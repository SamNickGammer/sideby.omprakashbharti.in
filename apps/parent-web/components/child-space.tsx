"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useCallback } from "react";
import {
  LayoutDashboard,
  Users,
  Clock3,
  Inbox,
  Settings,
  ArrowLeft,
  ArrowUpRight,
  Smartphone,
  Monitor,
  Camera,
  Mic,
  Bell,
  Grid2X2,
  Activity,
  UserRound,
  Server,
  Pause,
  Link2,
  ShieldCheck,
  ChevronRight,
  SwitchCamera,
  Check,
  Archive,
  Images,
  MessageSquare,
  ContactRound,
  Phone,
} from "lucide-react";
import type { Child } from "../lib/types";
import LiveUpdates from "./live-updates";
import DevicePairing from "./device-pairing";
import ChildContent, {
  contentPages,
  type ContentSection,
} from "./child-content";
const sections = [
  { id: "overview", label: "Their space", icon: LayoutDashboard },
  { id: "usage", label: "Digital wellbeing", icon: Activity },
  { id: "apps", label: "Installed apps", icon: Grid2X2 },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "photos", label: "Photo gallery", icon: Images },
  { id: "messages", label: "Messages", icon: MessageSquare },
  { id: "contacts", label: "Contacts", icon: ContactRound },
  { id: "call-history", label: "Call history", icon: Phone },
  { id: "screen", label: "Screen view", icon: Monitor },
  { id: "camera", label: "Camera", icon: Camera },
  { id: "audio", label: "Microphone", icon: Mic },
  { id: "accounts", label: "Accounts", icon: UserRound },
  { id: "services", label: "Device services", icon: Server },
  { id: "devices", label: "Devices", icon: Smartphone },
  { id: "settings", label: "Profile settings", icon: Settings },
];
const featureDescriptions: Record<string, string> = {
  usage: "Understand their daily habits",
  apps: "Know what’s on their device",
  notifications: "Device-shared notifications",
  screen: "View-only, authorized sharing",
  camera: "Front or back, one at a time",
  accounts: "Authorized account information",
  photos: "Photos shared from their device",
  messages: "SMS & social notifications",
  contacts: "Optional contact sharing",
  "call-history": "Call records · Coming later",
};
const familyNav = [
  { name: "Overview", icon: LayoutDashboard },
  { name: "Children", icon: Users },
  { name: "Routines", icon: Clock3 },
  { name: "Requests", icon: Inbox },
  { name: "Settings", icon: Settings },
];
export default function ChildSpace({
  child,
  familyName,
  userId,
  section,
}: {
  child: Child;
  familyName: string;
  userId: string;
  section: string;
}) {
  const router = useRouter();
  const [lens, setLens] = useState("back");
  const [status, setStatus] = useState("Connecting…");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const refresh = useCallback(() => router.refresh(), [router]);
  const base = `/dashboard/children/${child.id}`;
  const href = (id: string) => (id === "overview" ? base : `${base}/${id}`);
  const active = sections.find((s) => s.id === section)!;
  const liveView = ["screen", "camera", "audio"].includes(section);
  async function save(body: unknown) {
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const r = await fetch(`/api/children/${child.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-sideby-user": userId,
        },
        body: JSON.stringify(body),
      });
      if (r.status === 401) {
        window.location.assign("/auth/sign-in");
        return;
      }
      if (!r.ok) throw new Error((await r.json()).error);
      setMessage("Profile saved.");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save. Try again.");
    } finally {
      setBusy(false);
    }
  }
  const avatar = (
    <span className={`avatar ${child.color}`}>
      {child.avatar_key ? (
        <img
          src={`/api/avatar/${child.id}?v=${encodeURIComponent(child.avatar_key)}`}
          alt=""
        />
      ) : (
        child.name[0]?.toUpperCase()
      )}
    </span>
  );
  return (
    <div className="child-shell">
      <a className="skip" href="#child-main">
        Skip to child space
      </a>
      <nav className="family-rail" aria-label="Family navigation">
        <Link
          href="/dashboard"
          className="rail-brand"
          aria-label="Sideby family overview"
        >
          <img src="/brand/symbol.svg" alt="" />
        </Link>
        {familyNav.map(({ name, icon: Icon }) => (
          <Link
            key={name}
            href={`/dashboard?view=${name}`}
            title={`Family ${name.toLowerCase()}`}
            aria-label={`Family ${name.toLowerCase()}`}
            className={name === "Children" ? "selected" : ""}
          >
            <Icon size={21} />
          </Link>
        ))}
        <span className="rail-bottom">
          <ShieldCheck size={20} />
        </span>
      </nav>
      <aside className="child-sidebar">
        <Link className="back-family" href="/dashboard?view=Children">
          <ArrowLeft size={15} /> All children
        </Link>
        <div className="child-identity">
          {avatar}
          <h2>{child.name}</h2>
          <p>
            {child.age} years old ·{" "}
            {child.archived ? "Archived profile" : "Child’s space"}
          </p>
        </div>
        <p className="nav-label">THEIR DIGITAL WORLD</p>
        <nav aria-label="Child navigation">
          {sections.map(({ id, label, icon: Icon }) => (
            <Link
              key={id}
              href={href(id)}
              className={`nav-item ${section === id ? "active" : ""}`}
              aria-current={section === id ? "page" : undefined}
            >
              <Icon size={18} />
              <span>{label}</span>
            </Link>
          ))}
        </nav>
        <div className="child-side-note">
          <ShieldCheck size={18} />
          <p>
            Connection begins with trust.
            <br />
            Device access stays visible.
          </p>
        </div>
      </aside>
      <div className="child-workspace">
        <header className="child-topbar">
          <div className="child-breadcrumb">
            <Link href="/dashboard">{familyName}</Link>
            <ChevronRight size={14} />
            <span>{child.name}</span>
          </div>
          <span className="live-status">
            <span
              className={`live-dot ${status === "Live updates on" ? "connected" : ""}`}
            />
            {status}
            <LiveUpdates
              userId={userId}
              onChange={refresh}
              onStatus={setStatus}
            />
          </span>
        </header>
        <main id="child-main">
          <div className="page-heading">
            <div>
              <p className="eyebrow">
                A LITTLE INDEPENDENCE. A LITTLE GUIDANCE.
              </p>
              <h1>
                {section === "overview"
                  ? `${child.name}’s space`
                  : active.label}
              </h1>
              <p>
                {section === "overview"
                  ? "A clear view of their day, with room to be themselves."
                  : `Your space to stay connected with ${child.name}.`}
              </p>
            </div>
            <span className="status neutral">
              <Smartphone size={14} />{" "}
              {child.device_count
                ? `${child.device_count} paired device${child.device_count === 1 ? "" : "s"}`
                : "No device paired"}
            </span>
          </div>
          {error && (
            <p role="alert" className="error-box">
              {error}
            </p>
          )}
          {message && (
            <p role="status" className="success-box">
              <Check size={16} />
              {message}
            </p>
          )}
          {section === "overview" && (
            <>
              <section className="child-welcome">
                <div>
                  <span className="status good">Unrestricted by default</span>
                  <h2>
                    A little freedom.
                    <br />A little peace of mind.
                  </h2>
                  <p>
                    No daily allowance to set. Once a device is connected, check
                    their activity and pause when it’s time for a break.
                  </p>
                  <Link className="primary" href={href("devices")}>
                    <Link2 size={17} /> Connect a device
                  </Link>
                </div>
                <div className="child-welcome-art" aria-hidden="true">
                  <span />
                  <span />
                  <span>✦</span>
                </div>
              </section>
              <div className="child-summary">
                <section className="panel">
                  <Activity size={20} />
                  <p>Screen time today</p>
                  <strong>Not available</strong>
                  <small>Activity appears after connection</small>
                </section>
                <section className="panel">
                  <Smartphone size={20} />
                  <p>Paired devices</p>
                  <strong>{child.device_count || 0} devices</strong>
                  <small>One child can have multiple devices</small>
                </section>
                <section className="panel pause-card">
                  <Pause size={20} />
                  <p>Take a little break</p>
                  <button
                    className="secondary"
                    disabled
                    aria-describedby="pause-reason"
                  >
                    <Pause size={16} /> Pause device
                  </button>
                  <small id="pause-reason">
                    Pause controls are coming with Android
                  </small>
                </section>
              </div>
              <div className="section-heading">
                <h2>A place for every part of their day</h2>
              </div>
              <div className="child-feature-grid">
                {sections
                  .filter((s) =>
                    [
                      "usage",
                      "apps",
                      "notifications",
                      "screen",
                      "camera",
                      "accounts",
                      "photos",
                      "messages",
                      "contacts",
                      "call-history",
                    ].includes(s.id),
                  )
                  .map(({ id, label, icon: Icon }) => (
                    <Link
                      href={href(id)}
                      className="panel child-feature"
                      key={id}
                    >
                      <span className="empty-icon">
                        <Icon size={22} />
                      </span>
                      <div>
                        <h3>{label}</h3>
                        <p>{featureDescriptions[id]}</p>
                      </div>
                      <ArrowUpRight size={18} />
                    </Link>
                  ))}
              </div>
            </>
          )}
          {liveView && (
            <section className="viewer-layout">
              <div className="viewer-stage">
                <nav className="viewer-tabs" aria-label="Live viewing mode">
                  {[
                    { id: "screen", label: "Screen", icon: Monitor },
                    { id: "camera", label: "Camera", icon: Camera },
                    { id: "audio", label: "Audio", icon: Mic },
                  ].map(({ id, label, icon: Icon }) => (
                    <Link
                      href={href(id)}
                      key={id}
                      className={section === id ? "active" : ""}
                      aria-current={section === id ? "page" : undefined}
                    >
                      <Icon size={16} />
                      {label}
                    </Link>
                  ))}
                </nav>
                <div
                  className="phone-viewer"
                  aria-label={`${active.label} display — live sharing not available`}
                >
                  <div className="phone-island" />
                  <span className="viewer-idle">
                    <span />
                    <span />
                    <span />
                  </span>
                  <active.icon size={38} />
                  <h2>
                    {section === "screen"
                      ? "Their screen, right here."
                      : section === "camera"
                        ? `${lens === "back" ? "Back" : "Front"} camera view`
                        : "A moment to listen."}
                  </h2>
                  <p>
                    Live sharing will be available after the Android companion
                    and its permission flow are ready.
                  </p>
                  <span className="phone-status">No live session</span>
                  <div className="phone-home" />
                </div>
                <div className="viewer-caption">
                  <ShieldCheck size={15} />
                  {section === "screen"
                    ? "View only · No remote touch or control"
                    : section === "camera"
                      ? "One camera at a time · No recording"
                      : "Visible session · No recording"}
                </div>
              </div>
              <aside className="viewer-controls">
                <section className="panel">
                  <p className="eyebrow">SESSION CONTROLS</p>
                  <h2>{active.label}</h2>
                  <label className="device-selector">
                    Device
                    <select disabled aria-describedby="device-hint">
                      <option>Live sharing coming next</option>
                    </select>
                  </label>
                  <p id="device-hint" className="muted">
                    Pairing alone does not enable screen, camera or microphone
                    access.
                  </p>
                  {section === "camera" && (
                    <fieldset className="lens-picker">
                      <legend>Camera to request</legend>
                      {["back", "front"].map((value) => (
                        <button
                          type="button"
                          key={value}
                          className={lens === value ? "active" : ""}
                          aria-pressed={lens === value}
                          onClick={() => setLens(value)}
                        >
                          <SwitchCamera size={16} />
                          {value === "back" ? "Back camera" : "Front camera"}
                        </button>
                      ))}
                      <small>
                        This chooses the lens for a future session. No camera is
                        currently accessed.
                      </small>
                    </fieldset>
                  )}
                  <button className="primary" disabled>
                    Request{" "}
                    {section === "screen"
                      ? "screen sharing"
                      : section === "camera"
                        ? "camera access"
                        : "microphone access"}
                  </button>
                  <Link href={href("devices")} className="text-button spaced">
                    Device setup <ArrowUpRight size={15} />
                  </Link>
                </section>
                <section className="panel viewer-note">
                  <ShieldCheck size={22} />
                  <h3>Shared with awareness.</h3>
                  <p>
                    Sessions require device authorization and platform
                    permissions. The child sees sharing status and can stop the
                    session.
                  </p>
                </section>
              </aside>
            </section>
          )}
          {section === "usage" && (
            <>
              <div className="usage-heading">
                <div className="segmented-static" aria-label="Activity period">
                  <span>Today</span>
                </div>
                <span className="muted">
                  Device local time · Available after pairing
                </span>
              </div>
              <section className="panel usage-empty">
                <Activity size={32} />
                <h2>Every day has a rhythm.</h2>
                <p>
                  Screen time, app activity and device pickups will help you
                  understand it. Connect a device to start receiving real
                  activity.
                </p>
                <div className="empty-chart" aria-hidden="true">
                  <span />
                  <span />
                  <span />
                  <span />
                </div>
                <span className="status neutral">No activity received</span>
              </section>
              <section className="panel child-inline">
                <div>
                  <h2>Freedom first. A break when needed.</h2>
                  <p>
                    No daily time allowance. Pause will be available for
                    supported connected devices, with delivery status.
                  </p>
                </div>
                <button className="secondary" disabled>
                  <Pause size={16} /> Pause device
                </button>
              </section>
            </>
          )}
          {["apps", "notifications", "accounts", "services"].includes(
            section,
          ) && (
            <section className="panel child-data-empty">
              <div className="section-heading">
                <h2>{active.label}</h2>
                <span className="status neutral">Awaiting device data</span>
              </div>
              <div className="child-empty-body">
                <span className="empty-icon">
                  <active.icon size={30} />
                </span>
                <h2>
                  {section === "apps"
                    ? "Their apps will live here."
                    : section === "notifications"
                      ? "A quieter way to keep up."
                      : section === "accounts"
                        ? "Only what the device can share."
                        : "A clearer picture of device health."}
                </h2>
                <p>
                  {section === "apps"
                    ? "Installed apps and app details will appear when a paired companion is authorized to report them."
                    : section === "notifications"
                      ? "Notifications require explicit device permission. No notification content has been collected."
                      : section === "accounts"
                        ? "Supported account labels can appear only with device authorization. Passwords, tokens and private account contents are never collected."
                        : "Supported service and permission status will appear after pairing. Android may restrict visibility of other apps’ running services."}
                </p>
                <Link href={href("devices")} className="secondary">
                  Go to device setup <ArrowUpRight size={16} />
                </Link>
              </div>
            </section>
          )}
          {Object.hasOwn(contentPages, section) && (
            <ChildContent
              section={section as ContentSection}
              deviceHref={href("devices")}
              archived={child.archived}
            />
          )}
          {section === "devices" && (
            <DevicePairing key={child.id} child={child} userId={userId} />
          )}
          {section === "settings" && (
            <div className="settings-grid">
              <section className="panel">
                <h2>A space that feels like them.</h2>
                <form
                  className="settings-form"
                  key={`${child.name}-${child.age}-${child.color}`}
                  onSubmit={(e) => {
                    e.preventDefault();
                    const f = new FormData(e.currentTarget);
                    save({
                      name: String(f.get("name")),
                      age: Number(f.get("age")),
                      color: String(f.get("color")),
                      archived: child.archived,
                    });
                  }}
                >
                  <label>
                    Child’s first name
                    <input
                      required
                      name="name"
                      maxLength={40}
                      defaultValue={child.name}
                    />
                  </label>
                  <div className="form-row">
                    <label>
                      Age
                      <input
                        required
                        type="number"
                        name="age"
                        min="1"
                        max="17"
                        defaultValue={child.age}
                      />
                    </label>
                    <label>
                      Profile color
                      <select name="color" defaultValue={child.color}>
                        {["mint", "peach", "lavender", "sky"].map((c) => (
                          <option key={c} value={c}>
                            {c}
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>
                  <p className="muted">
                    Usage is unrestricted. There is no allowance to set.
                  </p>
                  <button className="primary" disabled={busy}>
                    {busy ? "Saving…" : "Save profile"}
                  </button>
                </form>
              </section>
              <section className="panel">
                <h2>Profile photo</h2>
                <div className="profile-photo-preview">{avatar}</div>
                <label className="upload-control">
                  <Camera size={17} />
                  {busy ? "Saving…" : "Choose a photo"}
                  <input
                    type="file"
                    aria-label="Upload profile photo"
                    accept="image/png,image/jpeg,image/webp"
                    disabled={busy}
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      setBusy(true);
                      setError("");
                      try {
                        const f = new FormData();
                        f.set("file", file);
                        const r = await fetch(`/api/avatar/${child.id}`, {
                          method: "POST",
                          headers: { "x-sideby-user": userId },
                          body: f,
                        });
                        if (!r.ok) throw new Error((await r.json()).error);
                        setMessage("Profile photo saved.");
                        router.refresh();
                      } catch (e) {
                        setError(
                          e instanceof Error ? e.message : "Upload failed.",
                        );
                      } finally {
                        setBusy(false);
                      }
                    }}
                  />
                </label>
                <p className="muted">
                  Private · JPEG, PNG or WebP · Up to 2 MB
                </p>
              </section>
              <section className="panel">
                <h2>
                  {child.archived
                    ? "Bring their space back."
                    : "Keep things tidy."}
                </h2>
                <p className="muted spaced">
                  Archiving hides the profile from your family overview. You can
                  restore it anytime.
                </p>
                <button
                  className="secondary spaced"
                  disabled={busy}
                  onClick={() =>
                    save({
                      name: child.name,
                      age: child.age,
                      color: child.color,
                      archived: !child.archived,
                    })
                  }
                >
                  <Archive size={16} />
                  {child.archived ? "Restore profile" : "Archive profile"}
                </button>
              </section>
            </div>
          )}
          <footer className="page-footer">
            <ShieldCheck size={15} /> Their space. Your support.
            <span>Sideby Parent</span>
          </footer>
        </main>
      </div>
    </div>
  );
}
