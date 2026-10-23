"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import {
  LayoutDashboard,
  Users,
  Inbox,
  Clock3,
  Plus,
  ArrowUpRight,
  ChevronRight,
  Smartphone,
  ShieldCheck,
  Settings,
  LogOut,
  Download,
  RefreshCw,
  Check,
  Leaf,
  Link2,
  X,
  Trash2,
} from "lucide-react";
import { authClient } from "../lib/auth-client";
import type { FamilyData, Child, Routine } from "../lib/types";
import LiveUpdates from "./live-updates";
const nav = [
  { name: "Overview", icon: LayoutDashboard },
  { name: "Children", icon: Users },
  { name: "Routines", icon: Clock3 },
  { name: "Requests", icon: Inbox },
  { name: "Settings", icon: Settings },
];
export default function Dashboard({
  userId,
  initialTab = "Overview",
}: {
  userId: string;
  initialTab?: string;
}) {
  const [data, setData] = useState<FamilyData | null>(null),
    [tab, setTab] = useState(initialTab),
    [error, setError] = useState(""),
    [message, setMessage] = useState(""),
    [busy, setBusy] = useState(false),
    [live, setLive] = useState("Connecting…"),
    [modal, setModal] = useState<"child" | "routine" | null>(null),
    [editChild, setEditChild] = useState<Child | null>(null),
    [editRoutine, setEditRoutine] = useState<Routine | null>(null),
    [showArchived, setShowArchived] = useState(false);
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => setTab(initialTab), [initialTab]);
  const load = useCallback(async () => {
    try {
      const r = await fetch("/api/family", { cache: "no-store" });
      if (r.status === 401) {
        window.location.assign("/auth/sign-in");
        return;
      }
      const v = await r.json();
      if (!r.ok) throw new Error(v.error);
      if (v.user.id !== userId) {
        window.location.assign("/dashboard");
        return;
      }
      setData(v);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load your family.");
    }
  }, [userId]);
  useEffect(() => {
    load();
  }, [load]);
  useEffect(() => {
    if (modal) dialog.current?.showModal();
    else dialog.current?.close();
  }, [modal]);
  async function mutate(path: string, method: string, body: unknown) {
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const r = await fetch(path, {
        method,
        headers: {
          "Content-Type": "application/json",
          "x-sideby-user": userId,
        },
        body: body === undefined ? undefined : JSON.stringify(body),
      });
      const v = await r.json();
      if (r.status === 401) {
        window.location.assign("/auth/sign-in");
        return false;
      }
      if (!r.ok) throw new Error(v.error);
      await load();
      setMessage("Saved to your family space.");
      return true;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save. Try again.");
      return false;
    } finally {
      setBusy(false);
    }
  }
  async function signOut() {
    setBusy(true);
    try {
      const { error } = await authClient.signOut();
      if (error) throw new Error(error.message);
      window.location.assign("/auth/sign-in");
    } catch {
      setError("Sign out failed. Please try again.");
      setBusy(false);
    }
  }
  function go(t: string) {
    setTab(t);
    setError("");
    setMessage("");
  }
  const children = data?.children.filter((c) => !c.archived) || [];
  function avatar(c: Child) {
    return (
      <div className={`avatar ${c.color}`}>
        {c.avatar_key ? (
          <img
            src={`/api/avatar/${c.id}?v=${encodeURIComponent(c.avatar_key)}`}
            alt=""
          />
        ) : (
          c.name.slice(0, 1).toUpperCase()
        )}
      </div>
    );
  }
  function openChild(c: Child | null = null) {
    setEditChild(c);
    setModal("child");
    setError("");
  }
  function openRoutine(v: Routine | null = null) {
    setEditRoutine(v);
    setModal("routine");
    setError("");
  }
  if (!data)
    return (
      <div className="loading-screen">
        <img src="/brand/wordmark.svg" alt="Sideby" />
        <p>{error || "Opening your family space…"}</p>
        {error && (
          <button className="primary" onClick={load}>
            Try again
          </button>
        )}
      </div>
    );
  if (!data.family)
    return (
      <div className="onboarding">
        <img src="/brand/wordmark.svg" alt="Sideby" />
        <div className="onboard-card">
          <span className="onboard-icon">
            <Users size={32} />
          </span>
          <p className="eyebrow">YOUR FAMILY STARTS HERE</p>
          <h1>Make yourself at home.</h1>
          <p>
            Give your family space a name. You can add your children next, one
            little profile at a time.
          </p>
          {error && (
            <div role="alert" className="error-box">
              {error}
            </div>
          )}
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              await mutate("/api/family", "POST", {
                name: String(new FormData(e.currentTarget).get("name")),
              });
            }}
          >
            <label>
              Family name
              <input
                name="name"
                placeholder="e.g. The Sharma family"
                required
                maxLength={60}
                autoFocus
              />
            </label>
            <button className="primary" disabled={busy}>
              {busy ? "Creating…" : "Create family space"}
              <ArrowUpRight size={17} />
            </button>
          </form>
          <button className="text-button" onClick={signOut}>
            Sign out
          </button>
        </div>
      </div>
    );
  return (
    <div className="shell">
      <a href="#main" className="skip">
        Skip to content
      </a>
      <aside className="sidebar">
        <a href="/dashboard" className="brand">
          <img src="/brand/wordmark.svg" alt="Sideby" />
          <span>PARENT</span>
        </a>
        <div className="family-label">
          <span className="family-symbol">
            <Users size={20} />
          </span>
          <div>
            <strong>{data.family.name}</strong>
            <small>Your private family space</small>
          </div>
        </div>
        <p className="nav-label">WORKSPACE</p>
        <nav aria-label="Main navigation">
          {nav.map(({ name, icon: Icon }) => (
            <button
              key={name}
              className={`nav-item ${tab === name ? "active" : ""}`}
              aria-current={tab === name ? "page" : undefined}
              onClick={() => go(name)}
            >
              <Icon size={19} />
              <span>{name}</span>
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="companion">
            <Leaf size={23} />
            <strong>
              A little support.
              <br />A lot of growing room.
            </strong>
            <p>Healthy habits start with small conversations.</p>
          </div>
          <button
            className="profile profile-button"
            onClick={() => go("Settings")}
          >
            <span className="profile-avatar">
              {data.user.name?.slice(0, 1).toUpperCase()}
            </span>
            <span>
              <strong>{data.user.name}</strong>
              <small>Parent account</small>
            </span>
            <Settings size={16} />
          </button>
        </div>
      </aside>
      <div className="workspace">
        <header className="topbar">
          <div>
            Family workspace <ChevronRight size={14} />
            <strong>{tab}</strong>
          </div>
          <div className="live-status">
            <span
              className={`live-dot ${live === "Live updates on" ? "connected" : ""}`}
            />
            {live}
            <LiveUpdates userId={userId} onChange={load} onStatus={setLive} />
          </div>
        </header>
        <main id="main">
          <div className="page-heading">
            <div>
              <p className="eyebrow">A LITTLE CLOSER, EVERY DAY</p>
              <h1>
                {tab === "Overview"
                  ? "Your family, at a glance."
                  : tab === "Children"
                    ? "Room for everyone."
                    : tab === "Routines"
                      ? "Find your family’s rhythm."
                      : tab === "Requests"
                        ? "A little give and take."
                        : "Your space. Your settings."}
              </h1>
              <p>
                {tab === "Overview"
                  ? `Welcome back, ${data.user.name.split(" ")[0]}. Let’s make room for what matters.`
                  : tab === "Children"
                    ? "A little independence. A little guidance."
                    : tab === "Routines"
                      ? "Save routines now. Connect devices when the companion is ready."
                      : tab === "Requests"
                        ? "A place to listen, understand, and decide together."
                        : "Manage your family’s details and your account."}
              </p>
            </div>
            {tab === "Overview" || tab === "Children" ? (
              <button className="primary" onClick={() => openChild()}>
                <Plus size={18} /> Add child
              </button>
            ) : tab === "Routines" ? (
              <button className="primary" onClick={() => openRoutine()}>
                <Plus size={18} /> Add routine
              </button>
            ) : null}
          </div>
          {error && (
            <div role="alert" className="error-box">
              {error}
              <button aria-label="Dismiss error" onClick={() => setError("")}>
                <X size={16} />
              </button>
            </div>
          )}
          {message && (
            <div role="status" className="success-box">
              <Check size={17} />
              {message}
            </div>
          )}
          <>
            {tab === "Overview" && (
              <>
                <section className="welcome-strip">
                  <div>
                    <span className="status good">
                      Your family space is ready
                    </span>
                    <h2>A good place to grow, together.</h2>
                    <p>
                      Add your children and set a gentle rhythm.
                      <br />
                      We’ll take device connection one step at a time.
                    </p>
                    <button onClick={() => go("Routines")}>
                      Set your first routine <ArrowUpRight size={16} />
                    </button>
                  </div>
                  <div className="welcome-art" aria-hidden="true">
                    <span className="art-orbit" />
                    <span className="art-person tall" />
                    <span className="art-person short" />
                    <span className="art-star">✦</span>
                  </div>
                </section>
                <section className="stats">
                  <article>
                    <span>
                      <Users size={18} /> Your circle
                    </span>
                    <strong>
                      {children.length}
                      <small>
                        {" "}
                        {children.length === 1 ? "child" : "children"}
                      </small>
                    </strong>
                    <p>One space for everyone</p>
                  </article>
                  <article>
                    <span>
                      <Clock3 size={18} /> Family routines
                    </span>
                    <strong>
                      {data.routines.filter((v) => v.enabled).length}
                      <small> enabled</small>
                    </strong>
                    <p>Saved, ready for device setup</p>
                  </article>
                  <article>
                    <span>
                      <Link2 size={18} /> Paired devices
                    </span>
                    <strong>
                      {data.children
                        .filter((c) => !c.archived)
                        .reduce((total, c) => total + (c.device_count || 0), 0)}
                      <small> devices</small>
                    </strong>
                    <p>Android companion coming next</p>
                  </article>
                </section>
              </>
            )}
            {(tab === "Overview" || tab === "Children") && (
              <section>
                <div className="section-heading">
                  <h2>
                    Your children{" "}
                    <span className="count">{children.length}</span>
                  </h2>
                  {tab === "Children" && (
                    <button
                      className="text-button"
                      onClick={() => setShowArchived((v) => !v)}
                    >
                      {showArchived ? "Hide archived" : "Show archived"}
                    </button>
                  )}
                </div>
                {children.length === 0 && !showArchived ? (
                  <section className="panel empty-state">
                    <span className="empty-icon">
                      <Users size={30} />
                    </span>
                    <h2>Every family starts with a hello.</h2>
                    <p>
                      Add your first child to make this space yours. Their
                      device can be connected later.
                    </p>
                    <button className="primary" onClick={() => openChild()}>
                      <Plus size={17} /> Add your first child
                    </button>
                  </section>
                ) : (
                  <div className="children-grid">
                    {data.children
                      .filter((c) => !c.archived || showArchived)
                      .map((c) => (
                        <article className="child-card real-card" key={c.id}>
                          <div className="child-top">
                            {avatar(c)}
                            <div>
                              <h3>{c.name}</h3>
                              <p>
                                {c.age} years old
                                {c.archived ? " · Archived" : ""}
                              </p>
                            </div>
                            <Link
                              className="icon-button"
                              aria-label={`Open ${c.name}'s profile`}
                              href={`/dashboard/children/${c.id}`}
                            >
                              <ArrowUpRight size={20} />
                            </Link>
                          </div>
                          <div className="profile-allowance">
                            <span>Device usage</span>
                            <strong>Unrestricted</strong>
                            <small>Connect a device to see activity</small>
                          </div>
                          <div className="unpaired">
                            <Smartphone size={15} />{" "}
                            {c.device_count
                              ? `${c.device_count} paired device${c.device_count === 1 ? "" : "s"}`
                              : "No device paired"}
                          </div>
                          <Link
                            className="card-footer"
                            href={`/dashboard/children/${c.id}`}
                          >
                            View their space <ChevronRight size={16} />
                          </Link>
                        </article>
                      ))}
                  </div>
                )}
              </section>
            )}
            {(tab === "Routines" || tab === "Overview") && (
              <section className="routine-section">
                <div className="section-heading">
                  <h2>
                    {tab === "Overview"
                      ? "A little structure goes a long way"
                      : "Your routines"}
                  </h2>
                  {tab === "Overview" && (
                    <button
                      className="text-button"
                      onClick={() => go("Routines")}
                    >
                      Manage routines <ArrowUpRight size={15} />
                    </button>
                  )}
                </div>
                {data.routines.length ? (
                  <div className="routine-grid">
                    {data.routines.map((v) => (
                      <article className="panel saved-routine" key={v.id}>
                        <div className="routine-title">
                          <span className="routine-icon">
                            <Clock3 size={20} />
                          </span>
                          <strong>{v.name}</strong>
                          <button
                            disabled={busy}
                            className={`toggle ${v.enabled ? "on" : ""}`}
                            role="switch"
                            aria-label={`${v.name} enabled`}
                            aria-checked={v.enabled}
                            onClick={() =>
                              mutate(`/api/routines/${v.id}`, "PATCH", {
                                name: v.name,
                                start_time: v.start_time,
                                end_time: v.end_time,
                                days: v.days,
                                enabled: !v.enabled,
                              })
                            }
                          >
                            <span />
                          </button>
                        </div>
                        <h3>
                          {v.start_time} <span>—</span> {v.end_time}
                        </h3>
                        <p>
                          {v.days === "weekdays"
                            ? "Monday – Friday"
                            : v.days === "weekends"
                              ? "Saturday & Sunday"
                              : "Every day"}
                          {v.end_time < v.start_time ? " · Overnight" : ""}
                        </p>
                        <div className="routine-bottom">
                          <small>Saved · Not applied to a device</small>
                          <button
                            className="text-button"
                            aria-label={`Edit ${v.name}`}
                            onClick={() => openRoutine(v)}
                          >
                            Edit
                          </button>
                        </div>
                      </article>
                    ))}
                  </div>
                ) : (
                  <section className="panel routine-empty">
                    <span className="empty-icon">
                      <Clock3 size={25} />
                    </span>
                    <div>
                      <h2>Homework, bedtime, or a little quiet time.</h2>
                      <p>
                        Build routines that fit your family. Start with one.
                      </p>
                    </div>
                    <button className="secondary" onClick={() => openRoutine()}>
                      Create a routine <Plus size={16} />
                    </button>
                  </section>
                )}
              </section>
            )}
            {tab === "Requests" && (
              <section className="panel empty-state">
                <span className="empty-icon">
                  <Inbox size={30} />
                </span>
                <h2>Nothing asking for your attention.</h2>
                <p>
                  When Sideby Connect is available, your children can ask for
                  extra time and app access. Their requests will arrive here.
                </p>
                <span className="status neutral">
                  Waiting for a connected device
                </span>
              </section>
            )}
            {tab === "Settings" && (
              <div className="settings-grid">
                <section className="panel">
                  <h2>Family details</h2>
                  <form
                    className="settings-form"
                    onSubmit={(e) => {
                      e.preventDefault();
                      mutate("/api/family", "PATCH", {
                        name: String(new FormData(e.currentTarget).get("name")),
                      });
                    }}
                  >
                    <label>
                      Family name
                      <input
                        name="name"
                        defaultValue={data.family.name}
                        required
                        maxLength={60}
                      />
                    </label>
                    <button disabled={busy} className="primary">
                      Save changes
                    </button>
                  </form>
                </section>
                <section className="panel">
                  <h2>Your account</h2>
                  <p className="account-name">{data.user.name}</p>
                  <p className="muted">{data.user.email}</p>
                  <button
                    className="secondary spaced"
                    disabled={busy}
                    onClick={signOut}
                  >
                    <LogOut size={16} /> Sign out
                  </button>
                  <a
                    className="text-button spaced"
                    href="/auth/forgot-password"
                  >
                    Reset your password
                  </a>
                </section>
                <section className="panel">
                  <h2>Your data, in your hands.</h2>
                  <p className="muted spaced">
                    Download your saved family profiles and routines. Profile
                    photos stay in private storage.
                  </p>
                  <a href="/api/export" className="secondary spaced">
                    <Download size={16} /> Export family data
                  </a>
                  <button
                    className="text-button spaced"
                    onClick={() => {
                      go("Children");
                      setShowArchived(true);
                    }}
                  >
                    Manage archived profiles
                  </button>
                </section>
                <section className="panel">
                  <h2>Connection status</h2>
                  <p className="account-name">{live}</p>
                  <p className="muted">
                    Family changes sync between your signed-in browser sessions.
                    This is account data, not phone screen sharing.
                  </p>
                  <button
                    className="text-button spaced"
                    onClick={() => window.location.reload()}
                  >
                    <RefreshCw size={15} /> Reconnect
                  </button>
                </section>
              </div>
            )}
          </>
          <footer className="page-footer">
            <ShieldCheck size={15} /> Your family. Your space.
            <span>Sideby Parent · Early access</span>
          </footer>
        </main>
      </div>
      <dialog
        ref={dialog}
        onCancel={() => setModal(null)}
        onClick={(e) => {
          if (e.target === dialog.current) setModal(null);
        }}
      >
        <div className="dialog-header">
          <div>
            <p className="eyebrow">A LITTLE MORE PERSONAL</p>
            <h2>
              {modal === "child"
                ? editChild
                  ? "Edit their space"
                  : "Meet your newest member"
                : editRoutine
                  ? "Adjust your rhythm"
                  : "Make room for a routine"}
            </h2>
          </div>
          <button
            className="icon-button"
            aria-label="Close dialog"
            onClick={() => setModal(null)}
          >
            <X size={18} />
          </button>
        </div>
        {error && (
          <div role="alert" className="error-box">
            {error}
          </div>
        )}
        {modal === "child" ? (
          <form
            key={editChild?.id || "new-child"}
            className="dialog-form"
            onSubmit={async (e) => {
              e.preventDefault();
              const f = new FormData(e.currentTarget);
              const body = {
                name: String(f.get("name")),
                age: Number(f.get("age")),
                color: String(f.get("color")),
                archived: editChild?.archived || false,
              };
              if (
                await mutate(
                  editChild ? `/api/children/${editChild.id}` : "/api/children",
                  editChild ? "PATCH" : "POST",
                  body,
                )
              )
                setModal(null);
            }}
          >
            <label>
              Child’s first name
              <input
                name="name"
                defaultValue={editChild?.name}
                required
                maxLength={40}
                placeholder="First name"
                autoFocus
              />
            </label>
            <div className="form-row">
              <label>
                Age
                <input
                  name="age"
                  type="number"
                  min="1"
                  max="17"
                  required
                  defaultValue={editChild?.age || 10}
                />
              </label>
              <label>
                Profile color
                <select name="color" defaultValue={editChild?.color || "mint"}>
                  <option value="mint">Mint</option>
                  <option value="peach">Peach</option>
                  <option value="lavender">Lavender</option>
                  <option value="sky">Sky</option>
                </select>
              </label>
            </div>
            <p className="muted">
              No daily limit. Add their profile now, then connect their device
              from their space.
            </p>
            <button className="primary" disabled={busy}>
              {busy ? "Saving…" : editChild ? "Save changes" : "Add child"}
            </button>
          </form>
        ) : modal === "routine" ? (
          <form
            key={editRoutine?.id || "new-routine"}
            className="dialog-form"
            onSubmit={async (e) => {
              e.preventDefault();
              const f = new FormData(e.currentTarget);
              const body = {
                name: String(f.get("name")),
                start_time: String(f.get("start")),
                end_time: String(f.get("end")),
                days: String(f.get("days")),
                enabled: editRoutine?.enabled ?? true,
              };
              if (
                await mutate(
                  editRoutine
                    ? `/api/routines/${editRoutine.id}`
                    : "/api/routines",
                  editRoutine ? "PATCH" : "POST",
                  body,
                )
              )
                setModal(null);
            }}
          >
            <label>
              Routine name
              <input
                name="name"
                defaultValue={editRoutine?.name}
                required
                maxLength={50}
                placeholder="e.g. Homework focus"
                autoFocus
              />
            </label>
            <div className="form-row">
              <label>
                Starts
                <input
                  type="time"
                  name="start"
                  required
                  defaultValue={editRoutine?.start_time || "17:00"}
                />
              </label>
              <label>
                Ends
                <input
                  type="time"
                  name="end"
                  required
                  defaultValue={editRoutine?.end_time || "18:30"}
                />
              </label>
            </div>
            <label>
              Repeat
              <select
                name="days"
                defaultValue={editRoutine?.days || "weekdays"}
              >
                <option value="weekdays">Monday – Friday</option>
                <option value="weekends">Weekends</option>
                <option value="daily">Every day</option>
              </select>
            </label>
            <p className="muted">
              Schedules use your family’s local clock. Device timezone setup
              comes with pairing.
            </p>
            <button className="primary" disabled={busy}>
              {busy ? "Saving…" : "Save routine"}
            </button>
            {editRoutine && (
              <button
                type="button"
                className="text-button danger"
                disabled={busy}
                onClick={async () => {
                  if (window.confirm("Delete this saved routine?")) {
                    if (
                      await mutate(
                        `/api/routines/${editRoutine.id}`,
                        "DELETE",
                        undefined,
                      )
                    )
                      setModal(null);
                  }
                }}
              >
                <Trash2 size={15} /> Delete routine
              </button>
            )}
          </form>
        ) : null}
      </dialog>
    </div>
  );
}
