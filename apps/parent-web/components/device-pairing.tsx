"use client";
import { useCallback, useEffect, useState } from "react";
import { Copy, Link2, Smartphone, ShieldCheck, RefreshCw } from "lucide-react";
import type { Child } from "../lib/types";
type Device = {
  id: string;
  name: string;
  platform: string;
  created_at: string;
  last_seen_at: string | null;
  revoked_at: string | null;
  credential_expires_at: string;
};
type Offer = {
  id: string;
  status: string;
  expires_at: string;
  device_name: string | null;
  verification: string | null;
};
type Snapshot = { devices: Device[]; pairing: Offer | null };
export default function DevicePairing({
  child,
  userId,
}: {
  child: Child;
  userId: string;
}) {
  const [data, setData] = useState<Snapshot | null>(null),
    [code, setCode] = useState<{ id: string; value: string } | null>(null);
  const [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [message, setMessage] = useState(""),
    [now, setNow] = useState(Date.now());
  const [confirm, setConfirm] = useState<string | null>(null),
    [matched, setMatched] = useState(false);
  const base = `/api/children/${child.id}`;
  const refresh = useCallback(
    async (signal?: AbortSignal) => {
      const r = await fetch(`${base}/devices`, {
        headers: { "x-sideby-user": userId },
        signal,
      });
      if (r.status === 401) {
        window.location.assign("/auth/sign-in");
        return;
      }
      const body = await r.json();
      if (!r.ok) throw new Error(body.error);
      setData(body);
      setNow(Date.now());
    },
    [base, userId],
  );
  useEffect(() => {
    const controller = new AbortController();
    const load = () => {
      if (!document.hidden)
        refresh(controller.signal).catch((e) => {
          if (!controller.signal.aborted) setError(e.message);
        });
    };
    load();
    const timer = setInterval(load, 5000);
    return () => {
      controller.abort();
      clearInterval(timer);
    };
  }, [refresh]);
  useEffect(() => {
    setMatched(false);
  }, [data?.pairing?.id, data?.pairing?.verification]);
  async function mutate(path: string, method: string, body?: unknown) {
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const r = await fetch(base + path, {
        method,
        headers: {
          "Content-Type": "application/json",
          "x-sideby-user": userId,
        },
        body: body ? JSON.stringify(body) : undefined,
      });
      if (r.status === 401) {
        window.location.assign("/auth/sign-in");
        return;
      }
      const result = await r.json();
      if (!r.ok) throw new Error(result.error);
      if (result.code) setCode({ id: result.id, value: result.code });
      else {
        setCode(null);
        setMessage(
          method === "DELETE"
            ? "Device disconnected."
            : body && (body as { action: string }).action === "approve"
              ? "Device paired. Waiting for its next check-in."
              : "Pairing cancelled.",
        );
      }
      setConfirm(null);
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save. Try again.");
    } finally {
      setBusy(false);
    }
  }
  const offer = data?.pairing;
  const seconds = offer
    ? Math.max(0, Math.ceil((Date.parse(offer.expires_at) - now) / 1000))
    : 0;
  const pending = offer?.status === "pending" && seconds > 0;
  const offered = offer?.status === "offered" && seconds > 0;
  const currentCode = code?.id === offer?.id ? code?.value : null;
  return (
    <div className="pairing-grid">
      <section className="panel pairing-card">
        <span className="empty-icon">
          <Link2 size={26} />
        </span>
        <p className="eyebrow">SIDE BY SIDE, CONNECTED</p>
        <h2>Connect their device</h2>
        <p>
          Add Sideby Connect to an Android device, enter this code there, then
          confirm the match here.
        </p>
        <p className="pairing-note">
          Sideby Connect is in early testing. Public downloads are not available yet.
        </p>
        {error && (
          <p className="error-box" role="alert">
            {error}
          </p>
        )}
        {message && (
          <p className="success-box" role="status">
            {message}
          </p>
        )}
        {!data && !error && <p role="status">Loading device setup…</p>}
        {child.archived ? (
          <p className="pairing-note">
            Restore this profile to connect a new device. Existing devices
            cannot check in while it is archived.
          </p>
        ) : (
          <>
            {offered && (
              <div className="pairing-code-box">
                <span>ENTER ON THEIR DEVICE</span>
                {currentCode ? (
                  <>
                    <strong className="pairing-code">{currentCode}</strong>
                    <button
                      className="secondary"
                      onClick={async () => {
                        try {
                          await navigator.clipboard.writeText(currentCode);
                          setMessage("Pairing code copied.");
                        } catch {
                          setError(
                            "Could not copy. Select and copy the code instead.",
                          );
                        }
                      }}
                    >
                      <Copy size={15} />
                      Copy code
                    </button>
                  </>
                ) : (
                  <p>
                    For your privacy, codes are shown once. Generate a new code
                    to continue.
                  </p>
                )}
                <small>
                  Expires in {Math.floor(seconds / 60)}m {seconds % 60}s · One
                  device only
                </small>
              </div>
            )}
            {pending && (
              <div className="pairing-review">
                <span className="status good">Waiting for your approval</span>
                <h3>{offer.device_name}</h3>
                <p>
                  Compare this verification code with the one on the device.
                  Only approve when both match.
                </p>
                <strong className="pairing-code">{offer.verification}</strong>
                <label className="pairing-match">
                  <input
                    type="checkbox"
                    checked={matched}
                    onChange={(e) => setMatched(e.target.checked)}
                  />
                  I’m with this device and the codes match.
                </label>
                <button
                  className="primary"
                  disabled={busy || !matched}
                  onClick={() =>
                    mutate("/pairing", "PATCH", {
                      id: offer.id,
                      action: "approve",
                    })
                  }
                >
                  <ShieldCheck size={16} />
                  Approve device
                </button>
              </div>
            )}
            {offer &&
              !offered &&
              !pending &&
              ["expired", "locked"].includes(offer.status) && (
                <p role="status">
                  {offer.status === "locked"
                    ? "Too many incorrect attempts. Generate a new code."
                    : "This code expired. Generate a new one when you’re ready."}
                </p>
              )}
            <div className="pairing-actions">
              {!pending && (
                <button
                  className="primary"
                  disabled={busy || !data}
                  onClick={() => mutate("/pairing", "POST")}
                >
                  <RefreshCw size={16} />
                  {offered ? "Generate new code" : "Create pairing code"}
                </button>
              )}
              {(offered || pending) && (
                <button
                  className="secondary"
                  disabled={busy}
                  onClick={() =>
                    mutate("/pairing", "PATCH", {
                      id: offer!.id,
                      action: "cancel",
                    })
                  }
                >
                  Cancel pairing
                </button>
              )}
            </div>
          </>
        )}
        <p className="pairing-footnote">
          <ShieldCheck size={16} />
          Pairing doesn’t enable monitoring. Permissions and live sessions
          remain visible on the device.
        </p>
      </section>
      <section className="panel pairing-card">
        <div className="section-heading">
          <h2>Their devices</h2>
          <Smartphone size={22} />
        </div>
        <p>One child, room for more than one device.</p>
        {data?.devices.length === 0 && (
          <div className="pairing-empty">
            <Smartphone size={34} />
            <h3>A fresh start.</h3>
            <p>Paired devices will appear here, with their last check-in.</p>
          </div>
        )}
        {data?.devices.map((device) => {
          const expired = Date.parse(device.credential_expires_at) <= now;
          const recent =
            device.last_seen_at &&
            now - Date.parse(device.last_seen_at) < 120000;
          const label = device.revoked_at
            ? "Disconnected"
            : expired
              ? "Pairing expired"
              : child.archived
                ? "Profile archived"
                : !device.last_seen_at
                  ? "Waiting for first check-in"
                  : recent
                    ? "Seen recently"
                    : "Offline · Last check-in below";
          return (
            <article className="paired-device" key={device.id}>
              <div className="paired-device-heading">
                <span className="empty-icon">
                  <Smartphone size={22} />
                </span>
                <div>
                  <h3>{device.name}</h3>
                  <small>Android · Sideby Connect</small>
                </div>
              </div>
              <span
                className={`status ${recent && !device.revoked_at && !expired && !child.archived ? "good" : "neutral"}`}
              >
                {label}
              </span>
              {device.last_seen_at && (
                <p className="muted">
                  Last seen {new Date(device.last_seen_at).toLocaleString()}
                </p>
              )}
              {!device.revoked_at &&
                (confirm === device.id ? (
                  <div className="disconnect-confirm">
                    <p>
                      Disconnect {device.name}? It will need a new pairing code
                      to reconnect.
                    </p>
                    <div className="pairing-actions">
                      <button
                        className="secondary"
                        disabled={busy}
                        onClick={() => setConfirm(null)}
                      >
                        Keep device
                      </button>
                      <button
                        className="danger-button"
                        disabled={busy}
                        onClick={() =>
                          mutate(`/devices/${device.id}`, "DELETE")
                        }
                      >
                        Disconnect device
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    className="text-button"
                    disabled={busy}
                    onClick={() => setConfirm(device.id)}
                  >
                    Disconnect
                  </button>
                ))}
            </article>
          );
        })}
      </section>
    </div>
  );
}
