"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Room, RoomEvent, Track } from "livekit-client";
import { Camera, Monitor, Mic, ShieldCheck, Square, Play } from "lucide-react";
type Kind = "screen" | "camera" | "audio";
type Session = {
  id: string;
  device_id: string;
  kind: Kind;
  status: string;
  desired_lens: string;
  actual_lens: string | null;
  expires_at: string;
};
type Device = { id: string; name: string };
const ongoing = (s: Session | null) =>
  !!s && ["pending", "approved", "active"].includes(s.status);
export function LiveSharing({
  childId,
  userId,
  kind,
}: {
  childId: string;
  userId: string;
  kind: Kind;
}) {
  const [devices, setDevices] = useState<Device[]>([]),
    [device, setDevice] = useState(""),
    [session, setSession] = useState<Session | null>(null),
    [lens, setLens] = useState("front"),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [connected, setConnected] = useState(false),
    [mediaReady, setMediaReady] = useState(false);
  const media = useRef<HTMLDivElement>(null),
    room = useRef<Room | null>(null),
    current = useRef<Session | null>(null);
  const base = `/api/children/${childId}/live`;
  async function api(path: string, body?: object) {
    const r = await fetch(path, {
      method: body ? "POST" : "GET",
      headers: { "Content-Type": "application/json", "x-sideby-user": userId },
      body: body ? JSON.stringify(body) : undefined,
      cache: "no-store",
      signal: AbortSignal.timeout(10000),
    });
    const v = await r.json();
    if (!r.ok) throw Error(v.error || "Live sharing unavailable.");
    return v;
  }
  function update(s: Session | null) {
    current.current = s;
    setSession(s);
  }
  function disconnect() {
    room.current?.disconnect();
    room.current = null;
    setConnected(false);
    setMediaReady(false);
    media.current?.replaceChildren();
  }
  useEffect(() => {
    let gone = false;
    api(base)
      .then((v) => {
        if (gone) return;
        setDevices(v.devices);
        setDevice(v.devices[0]?.id || "");
        const s = v.sessions.find(
          (s: Session) => ongoing(s) && s.kind === kind,
        );
        if (s) {
          setDevice(s.device_id);
          update(s);
        }
      })
      .catch((e) => {
        if (!gone) setError(e.message);
      });
    return () => {
      gone = true;
      room.current?.disconnect();
      const s = current.current;
      if (ongoing(s))
        void fetch(`${base}/${s!.id}`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-sideby-user": userId,
          },
          body: JSON.stringify({ action: "stop" }),
          keepalive: true,
        });
    };
    // A keyed component isolates media when navigating between child/mode routes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [base, userId]);
  useEffect(() => {
    if (!session || !ongoing(session)) return;
    let gone = false,
      running = false;
    const id = session.id;
    async function tick() {
      if (running) return;
      running = true;
      try {
        const v = await api(`${base}/${id}`, { action: "poll" });
        if (gone) return;
        update(v.session);
        if (!ongoing(v.session)) {
          disconnect();
          return;
        }
        if (
          ["approved", "active"].includes(v.session.status) &&
          !room.current
        ) {
          const grant = await api(`${base}/${id}`, { action: "join" });
          if (gone) return;
          if (!grant.token) {
            update(grant.session);
            return;
          }
          const r = new Room({ adaptiveStream: true, dynacast: true });
          room.current = r;
          r.on(RoomEvent.TrackSubscribed, (track) => {
            if (gone) return;
            const element = track.attach();
            if (track.kind === Track.Kind.Video) {
              element.style.objectFit = "contain";
              element.style.width = "100%";
              element.style.height = "100%";
              element.setAttribute("playsinline", "");
              element.setAttribute("aria-label", `${kind} live view`);
            } else element.setAttribute("controls", "");
            media.current?.appendChild(element);
            setMediaReady(true);
          });
          r.on(RoomEvent.TrackUnsubscribed, (track) => {
            track.detach().forEach((e) => e.remove());
            setMediaReady(false);
          });
          r.on(RoomEvent.Disconnected, () => {
            if (!gone) {
              room.current = null;
              setConnected(false);
              setMediaReady(false);
              media.current?.replaceChildren();
              update({ ...current.current!, status: "ended" });
              void api(`${base}/${id}`, { action: "stop" }).catch(() => {});
            }
          });
          await r.connect(grant.url, grant.token);
          if (gone) {
            r.disconnect();
            return;
          }
          setConnected(true);
        }
      } catch (e) {
        if (!gone) {
          disconnect();
          setError(e instanceof Error ? e.message : "Connection lost.");
          update({ ...current.current!, status: "ended" });
          void api(`${base}/${id}`, { action: "stop" }).catch(() => {});
        }
      } finally {
        running = false;
      }
    }
    void tick();
    const timer = setInterval(tick, 5000);
    return () => {
      gone = true;
      clearInterval(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.id, ongoing(session), base, userId]);
  async function act(action: "start" | "stop" | "lens", nextLens?: string) {
    setBusy(true);
    setError("");
    try {
      const v =
        action === "start"
          ? await api(base, {
              device_id: device,
              kind,
              ...(kind === "camera" ? { lens } : {}),
            })
          : await api(`${base}/${session!.id}`, {
              action,
              ...(action === "lens" ? { lens: nextLens } : {}),
            });
      update(v.session);
      if (action === "stop") disconnect();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Please try again.");
    } finally {
      setBusy(false);
    }
  }
  const Icon = kind === "screen" ? Monitor : kind === "camera" ? Camera : Mic;
  const status =
    session?.status === "pending"
      ? "Waiting for device approval"
      : connected
        ? mediaReady
          ? "Live sharing"
          : "Connected · waiting for media"
        : ongoing(session)
          ? "Connecting…"
          : session
            ? `Session ${session.status}`
            : "Ready when you are";
  return (
    <section className="viewer-layout">
      <div className="viewer-stage">
        <nav className="viewer-tabs" aria-label="Live viewing mode">
          {(["screen", "camera", "audio"] as Kind[]).map((k) => (
            <Link
              key={k}
              href={`/dashboard/children/${childId}/${k}`}
              className={k === kind ? "active" : ""}
            >
              {k === "screen" ? "Screen" : k === "camera" ? "Camera" : "Audio"}
            </Link>
          ))}
        </nav>
        <div
          className={`phone-viewer live-phone ${mediaReady ? "has-media" : ""}`}
          aria-label={`${kind} viewer`}
        >
          <div className="phone-island" />
          <div ref={media} className="live-media" />
          {!mediaReady && (
            <div className="live-placeholder">
              <Icon size={36} />
              <h2>{status}</h2>
              <p>
                {session?.status === "pending"
                  ? "Open Live sharing in Sideby Connect to review this request."
                  : "Start a visible session with the paired device."}
              </p>
            </div>
          )}
          <span className="phone-status" role="status">
            {status}
          </span>
          <div className="phone-home" />
        </div>
        <p className="viewer-caption">
          <ShieldCheck size={15} /> View only · No recording · Stoppable on the
          device
        </p>
      </div>
      <aside className="viewer-controls">
        <section className="panel">
          <p className="eyebrow">LIVE SESSION</p>
          <h2>
            {kind === "screen"
              ? "Screen view"
              : kind === "camera"
                ? "Camera"
                : "Microphone"}
          </h2>
          <label className="device-selector">
            Device
            <select
              value={device}
              onChange={(e) => setDevice(e.target.value)}
              disabled={ongoing(session) || busy}
            >
              <option value="">Choose a paired device</option>
              {devices.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </label>
          {kind === "camera" && (
            <fieldset className="lens-picker">
              <legend>Camera</legend>
              {["front", "back"].map((l) => (
                <button
                  key={l}
                  type="button"
                  aria-pressed={(session?.desired_lens || lens) === l}
                  className={
                    (session?.desired_lens || lens) === l ? "active" : ""
                  }
                  disabled={busy || session?.status === "pending"}
                  onClick={() => {
                    setLens(l);
                    if (ongoing(session)) void act("lens", l);
                  }}
                >
                  {l === "front" ? "Front" : "Back"}
                </button>
              ))}
              {ongoing(session) && (
                <small>
                  Device reports: {session?.actual_lens || "waiting"}
                  {session?.actual_lens !== session?.desired_lens
                    ? " · switch pending"
                    : ""}
                </small>
              )}
            </fieldset>
          )}
          {error && (
            <p role="alert" className="live-error">
              {error}
            </p>
          )}
          {ongoing(session) ? (
            <button
              className="primary"
              disabled={busy}
              onClick={() => void act("stop")}
            >
              <Square size={16} /> Stop sharing
            </button>
          ) : (
            <button
              className="primary"
              disabled={busy || !device}
              onClick={() => void act("start")}
            >
              <Play size={16} /> Start{" "}
              {kind === "screen"
                ? "Screen"
                : kind === "camera"
                  ? "Camera"
                  : "Audio"}
            </button>
          )}
          {kind === "audio" && connected && (
            <button
              className="text-button spaced"
              onClick={() => void room.current?.startAudio()}
            >
              Enable audio playback
            </button>
          )}
          <p className="muted">
            Each session needs approval on the device and ends after five
            minutes. Screen and camera sessions do not include microphone audio.
          </p>
        </section>
        <section className="panel viewer-note">
          <ShieldCheck size={22} />
          <h3>Shared with awareness.</h3>
          <p>
            The child sees sharing status and can stop at any time. Camera and
            microphone stop when the child leaves the live-sharing screen.
            Screen sharing uses Android’s approval dialog and visible
            notification.
          </p>
        </section>
      </aside>
    </section>
  );
}
