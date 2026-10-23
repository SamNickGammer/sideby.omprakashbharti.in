"use client";
import { useState } from "react";
import {
  LayoutDashboard,
  Users,
  Inbox,
  Clock3,
  Plus,
  ArrowUpRight,
  ChevronRight,
  Smartphone,
  Tablet,
  Battery,
  MapPin,
  ShieldCheck,
  WifiOff,
  Sparkles,
  Check,
  X,
  RotateCcw,
  Monitor,
  ArrowLeft,
  Settings2,
} from "lucide-react";

type Device = {
  id: string;
  name: string;
  kind: "phone" | "tablet";
  minutes: number;
  limit: number;
  battery: number;
  online: boolean;
};
type Child = {
  id: string;
  name: string;
  age: number;
  color: string;
  location: string;
  seen: string;
  devices: Device[];
};
type Request = {
  id: number;
  child: string;
  app: string;
  note: string;
  status: "pending" | "approved" | "declined";
};
const initialChildren: Child[] = [
  {
    id: "aarav",
    name: "Aarav",
    age: 13,
    color: "mint",
    location: "Home",
    seen: "Sample update · 4:20 PM",
    devices: [
      {
        id: "a-phone",
        name: "Aarav’s phone",
        kind: "phone",
        minutes: 82,
        limit: 120,
        battery: 76,
        online: true,
      },
      {
        id: "a-tablet",
        name: "Study tablet",
        kind: "tablet",
        minutes: 24,
        limit: 90,
        battery: 48,
        online: false,
      },
    ],
  },
  {
    id: "myra",
    name: "Myra",
    age: 10,
    color: "peach",
    location: "School",
    seen: "Sample update · 3:45 PM",
    devices: [
      {
        id: "m-phone",
        name: "Myra’s phone",
        kind: "phone",
        minutes: 46,
        limit: 90,
        battery: 62,
        online: true,
      },
    ],
  },
  {
    id: "ishaan",
    name: "Ishaan",
    age: 16,
    color: "lavender",
    location: "Not available",
    seen: "Location permission off",
    devices: [
      {
        id: "i-phone",
        name: "Ishaan’s phone",
        kind: "phone",
        minutes: 112,
        limit: 180,
        battery: 31,
        online: true,
      },
    ],
  },
];
const initialRequests: Request[] = [
  {
    id: 1,
    child: "aarav",
    app: "YouTube",
    note: "Can I finish my science video? Just 15 more minutes.",
    status: "pending",
  },
  {
    id: 2,
    child: "myra",
    app: "Minecraft",
    note: "Can I have 15 more minutes to finish my house?",
    status: "pending",
  },
];
const routines = [
  {
    name: "School time",
    time: "8:00 AM – 3:00 PM",
    days: "Monday – Friday",
    icon: "01",
    detail: "A little room to learn. Keep essential contacts available.",
  },
  {
    name: "Homework focus",
    time: "5:00 PM – 6:30 PM",
    days: "Monday – Friday",
    icon: "02",
    detail: "Make space for schoolwork and a fresh start.",
  },
  {
    name: "Wind-down",
    time: "9:00 PM – 7:00 AM",
    days: "Every day",
    icon: "03",
    detail: "A calmer evening, with time to recharge.",
  },
];
const duration = (m: number) =>
  `${Math.floor(m / 60) ? Math.floor(m / 60) + "h " : ""}${m % 60}m`;
export default function Home() {
  const [children, setChildren] = useState<Child[]>(initialChildren);
  const [requests, setRequests] = useState<Request[]>(initialRequests);
  const [tab, setTab] = useState("Overview");
  const [selected, setSelected] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState("");
  const [age, setAge] = useState("10");
  const [message, setMessage] = useState("");
  const [enabled, setEnabled] = useState([true, true, false]);
  const child = children.find((c) => c.id === selected);
  const pending = requests.filter((r) => r.status === "pending").length;
  const total = children.reduce(
    (s, c) => s + c.devices.reduce((n, d) => n + d.minutes, 0),
    0,
  );
  function navigate(value: string) {
    setTab(value);
    setSelected(null);
    setAdding(false);
    setMessage("");
  }
  function decide(id: number, status: "approved" | "declined") {
    setRequests((rs) =>
      rs.map((q) =>
        q.id === id && q.status === "pending" ? { ...q, status } : q,
      ),
    );
    setMessage(
      status === "approved"
        ? "Approved in demo only. No extra time was sent to a device."
        : "Request declined in this demo.",
    );
  }
  function reset() {
    setChildren(initialChildren);
    setRequests(initialRequests);
    setEnabled([true, true, false]);
    setSelected(null);
    setAdding(false);
    setMessage("Demo reset. All sample data restored.");
  }
  function requestList() {
    return (
      <div className="requests">
        {requests.map((q) => {
          const c = children.find((x) => x.id === q.child)!;
          return (
            <article className="request" key={q.id}>
              <div className={`avatar small ${c.color}`}>{c.name[0]}</div>
              <div className="request-copy">
                <strong>
                  {c.name} <span>is asking for more time</span>
                </strong>
                <p>
                  {q.app} <span>· 15 minutes</span>
                </p>
                <blockquote>“{q.note}”</blockquote>
              </div>
              {q.status === "pending" ? (
                <div className="request-actions">
                  <button
                    className="icon-button"
                    aria-label={`Decline ${c.name}'s request`}
                    onClick={() => decide(q.id, "declined")}
                  >
                    <X size={18} />
                  </button>
                  <button
                    className="approve"
                    aria-label={`Approve ${c.name}'s request`}
                    onClick={() => decide(q.id, "approved")}
                  >
                    <Check size={17} /> Approve
                  </button>
                </div>
              ) : (
                <span className="status neutral">{q.status} · demo</span>
              )}
            </article>
          );
        })}
      </div>
    );
  }
  function routineList() {
    return (
      <div className="routine-list">
        {routines.map((routine, i) => (
          <article className="routine" key={routine.name}>
            <span className="routine-number">{routine.icon}</span>
            <div>
              <strong>{routine.name}</strong>
              <p>{routine.time}</p>
              <small>{routine.days}</small>
              {tab === "Routines" && <p>{routine.detail}</p>}
            </div>
            <button
              className={`toggle ${enabled[i] ? "on" : ""}`}
              role="switch"
              aria-checked={enabled[i]}
              aria-label={`${routine.name} demo routine`}
              onClick={() => {
                setEnabled((e) => e.map((v, j) => (j === i ? !v : v)));
                setMessage(
                  "Routine updated in demo only. No device rules changed.",
                );
              }}
            >
              <span />
            </button>
          </article>
        ))}
      </div>
    );
  }
  return (
    <div className="shell">
      <a href="#main" className="skip">
        Skip to content
      </a>
      <aside className="sidebar">
        <a href="/" className="brand">
          <img src="/brand/wordmark.svg" alt="Sideby" />
          <span>PARENT</span>
        </a>
        <div className="family-label">
          <span className="family-symbol">
            <Users size={20} />
          </span>
          <div>
            <strong>Your family space</strong>
            <small>Sample family</small>
          </div>
        </div>
        <p className="nav-label">WORKSPACE</p>
        <nav aria-label="Main navigation">
          {[
            { name: "Overview", icon: LayoutDashboard },
            { name: "Children", icon: Users },
            { name: "Requests", icon: Inbox },
            { name: "Routines", icon: Clock3 },
          ].map(({ name, icon: Icon }) => (
            <button
              key={name}
              className={`nav-item ${tab === name ? "active" : ""}`}
              aria-current={tab === name ? "page" : undefined}
              onClick={() => navigate(name)}
            >
              <Icon size={19} />
              {name}
              {name === "Requests" && pending > 0 && (
                <span className="badge">{pending}</span>
              )}
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="companion">
            <ShieldCheck size={23} />
            <strong>
              A little support.
              <br />A lot of growing room.
            </strong>
            <p>Healthy habits start with small conversations.</p>
          </div>
          <div className="profile">
            <span className="profile-avatar">P</span>
            <div>
              <strong>Parent preview</strong>
              <small>No account connected</small>
            </div>
          </div>
        </div>
      </aside>
      <div className="workspace">
        <header className="topbar">
          <div>
            Family workspace <ChevronRight size={14} /> <strong>{tab}</strong>
          </div>
          <span className="preview-pill">
            <span /> Interactive preview
          </span>
        </header>
        <main id="main">
          <div className="demo-banner">
            <span>
              <Sparkles size={16} />
              <strong>Demo mode</strong> Explore with sample data. Changes reset
              when you reload; no devices are connected.
            </span>
            <button onClick={reset}>
              <RotateCcw size={14} /> Reset demo
            </button>
          </div>
          <div className="page-heading">
            <div>
              <p className="eyebrow">A LITTLE CLOSER, EVERY DAY</p>
              <h1>
                {child
                  ? `${child.name}’s space`
                  : tab === "Overview"
                    ? "Your family, at a glance."
                    : tab === "Children"
                      ? "Room for everyone."
                      : tab === "Requests"
                        ? "A little give and take."
                        : "Make room for good habits."}
              </h1>
              <p>
                {child
                  ? "Individual devices. Thoughtful boundaries."
                  : tab === "Overview"
                    ? "Small check-ins. Healthy boundaries. More peace of mind."
                    : tab === "Children"
                      ? "A space for each child, with rules that grow with them."
                      : tab === "Requests"
                        ? "Listen to the reason, then decide together."
                        : "Build a rhythm that works for your family."}
              </p>
            </div>
            {!child && (tab === "Overview" || tab === "Children") && (
              <button className="primary" onClick={() => setAdding(!adding)}>
                <Plus size={18} /> Add child
              </button>
            )}
            {child && (
              <button className="secondary" onClick={() => setSelected(null)}>
                <ArrowLeft size={16} /> Back to family
              </button>
            )}
          </div>
          <div role="status" className={message ? "feedback" : "sr-only"}>
            {message}
          </div>
          {adding && (
            <form
              className="add-form panel"
              onSubmit={(e) => {
                e.preventDefault();
                if (!name.trim()) return;
                const c: Child = {
                  id: crypto.randomUUID(),
                  name: name.trim(),
                  age: Number(age),
                  color: "mint",
                  location: "Not connected",
                  seen: "Pairing will be available later",
                  devices: [],
                };
                setChildren((v) => [...v, c]);
                setName("");
                setAdding(false);
                setMessage(
                  "Demo child added. No real profile or device connection was created.",
                );
              }}
            >
              <div>
                <h2>Add a demo child</h2>
                <p>Use a fictional name for this preview.</p>
              </div>
              <label>
                Name
                <input
                  required
                  maxLength={30}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Riya"
                />
              </label>
              <label>
                Age
                <input
                  type="number"
                  min="1"
                  max="17"
                  required
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                />
              </label>
              <button className="primary" type="submit">
                Add profile
              </button>
              <button
                type="button"
                className="secondary"
                onClick={() => setAdding(false)}
              >
                Cancel
              </button>
            </form>
          )}
          {child ? (
            <>
              <section className="panel detail-heading">
                <div className={`avatar ${child.color}`}>{child.name[0]}</div>
                <div>
                  <h2>
                    {child.name}, {child.age}
                  </h2>
                  <p>
                    {child.devices.length} sample devices · Limits apply
                    separately to each device.
                  </p>
                </div>
              </section>
              <div className="device-grid">
                {child.devices.map((d) => (
                  <section className="panel device-detail" key={d.id}>
                    <div className="section-heading">
                      <h2>{d.name}</h2>
                      {d.kind === "phone" ? <Smartphone /> : <Tablet />}
                    </div>
                    <span className={`status ${d.online ? "good" : "neutral"}`}>
                      {d.online
                        ? "Sample device online"
                        : "Sample device offline"}
                    </span>
                    <h3>
                      {duration(d.minutes)} <small>sample usage</small>
                    </h3>
                    <label>
                      Daily allowance (minutes)
                      <input
                        type="number"
                        min="15"
                        max="720"
                        step="15"
                        defaultValue={d.limit}
                        onBlur={(e) => {
                          const n = Number(e.target.value);
                          if (
                            !Number.isInteger(n) ||
                            n < 15 ||
                            n > 720 ||
                            n % 15 !== 0
                          ) {
                            e.target.value = String(d.limit);
                            setMessage(
                              "Enter a daily allowance from 15 to 720 minutes, in steps of 15.",
                            );
                            return;
                          }
                          setChildren((cs) =>
                            cs.map((c) =>
                              c.id === child.id
                                ? {
                                    ...c,
                                    devices: c.devices.map((v) =>
                                      v.id === d.id ? { ...v, limit: n } : v,
                                    ),
                                  }
                                : c,
                            ),
                          );
                          setMessage(
                            "Demo allowance saved. It has not been applied to a device.",
                          );
                        }}
                      />
                    </label>
                    <p>
                      <Battery size={17} /> {d.battery}% sample battery
                    </p>
                  </section>
                ))}
              </div>
              {child.devices.length === 0 && (
                <section className="panel empty">
                  <Smartphone size={32} />
                  <h2>No devices connected</h2>
                  <p>
                    Device pairing needs the Android companion and secure
                    backend. This preview only creates a sample profile.
                  </p>
                </section>
              )}
              <section className="panel live-note">
                <Monitor />
                <div>
                  <h2>Live sharing comes later</h2>
                  <p>
                    View-only screen, camera, and audio sessions need Sideby
                    Connect, device authorization, and supported permissions. No
                    live access is available in this preview.
                  </p>
                </div>
              </section>
            </>
          ) : (
            <>
              {tab === "Overview" && (
                <section className="stats" aria-label="Sample family summary">
                  <article>
                    <span>
                      <Users size={18} /> Your circle
                    </span>
                    <strong>
                      {children.length} <small>children</small>
                    </strong>
                    <p>
                      {children.reduce((s, c) => s + c.devices.length, 0)}{" "}
                      sample devices in your family
                    </p>
                  </article>
                  <article>
                    <span>
                      <Clock3 size={18} /> Screen time today
                    </span>
                    <strong>{duration(total)}</strong>
                    <p>Combined sample usage across devices</p>
                  </article>
                  <article>
                    <span>
                      <Inbox size={18} /> A moment of your time
                    </span>
                    <strong>
                      {pending} <small>requests</small>
                    </strong>
                    <button onClick={() => navigate("Requests")}>
                      Review together <ArrowUpRight size={15} />
                    </button>
                  </article>
                </section>
              )}
              {(tab === "Overview" || tab === "Children") && (
                <section>
                  <div className="section-heading">
                    <h2>
                      Your children{" "}
                      <span className="count">{children.length}</span>
                    </h2>
                    <span className="muted">
                      A little independence. A little guidance.
                    </span>
                  </div>
                  <div className="children-grid">
                    {children.map((c) => (
                      <article className="child-card" key={c.id}>
                        <div className="child-top">
                          <div className={`avatar ${c.color}`}>{c.name[0]}</div>
                          <div>
                            <h3>{c.name}</h3>
                            <p>
                              {c.age} years old · {c.devices.length} devices
                            </p>
                          </div>
                          <button
                            className="icon-button"
                            aria-label={`View ${c.name}'s devices`}
                            onClick={() => setSelected(c.id)}
                          >
                            <ArrowUpRight size={20} />
                          </button>
                        </div>
                        <div className="usage">
                          <span>Sample screen time</span>
                          <strong>
                            {duration(
                              c.devices.reduce((s, d) => s + d.minutes, 0),
                            )}
                          </strong>
                        </div>
                        <div className="device-rows">
                          {c.devices.map((d) => (
                            <div key={d.id}>
                              <div>
                                <span>
                                  {d.kind === "phone" ? (
                                    <Smartphone size={14} />
                                  ) : (
                                    <Tablet size={14} />
                                  )}{" "}
                                  {d.name}
                                </span>
                                <span>
                                  {duration(d.minutes)} / {duration(d.limit)}
                                </span>
                              </div>
                              <div className="track">
                                <span
                                  style={{
                                    width: `${Math.min(100, (d.minutes / d.limit) * 100)}%`,
                                  }}
                                />
                              </div>
                            </div>
                          ))}
                          {c.devices.length === 0 && <p>No paired devices</p>}
                        </div>
                        <div className="location">
                          <MapPin size={17} />
                          <div>
                            <strong>{c.location}</strong>
                            <small>{c.seen}</small>
                          </div>
                          {c.devices.some((d) => !d.online) && (
                            <WifiOff
                              size={16}
                              aria-label="A sample device is offline"
                            />
                          )}
                        </div>
                        <button
                          className="card-footer"
                          onClick={() => setSelected(c.id)}
                        >
                          View child’s space <ChevronRight size={16} />
                        </button>
                      </article>
                    ))}
                  </div>
                </section>
              )}
              {tab === "Overview" && (
                <div className="lower-grid">
                  <section className="panel">
                    <div className="section-heading">
                      <h2>
                        Little requests <span className="count">{pending}</span>
                      </h2>
                      <button
                        className="text-button"
                        onClick={() => navigate("Requests")}
                      >
                        View all <ArrowUpRight size={15} />
                      </button>
                    </div>
                    {requestList()}
                  </section>
                  <section className="panel">
                    <div className="section-heading">
                      <h2>Family rhythm</h2>
                      <Clock3 size={19} />
                    </div>
                    {routineList()}
                    <button
                      className="text-button"
                      onClick={() => navigate("Routines")}
                    >
                      Manage demo routines <ArrowUpRight size={15} />
                    </button>
                  </section>
                </div>
              )}
              {tab === "Requests" && (
                <section className="panel">
                  {requestList()}
                  <p className="muted">
                    Approvals are simulated. No app access or time is granted on
                    a real phone.
                  </p>
                </section>
              )}
              {tab === "Routines" && (
                <section className="panel">
                  <div className="section-heading">
                    <h2>Your sample routines</h2>
                    <Settings2 size={20} />
                  </div>
                  {routineList()}
                  <p className="muted">
                    These are demonstration schedules. Toggling a routine does
                    not apply restrictions to devices.
                  </p>
                </section>
              )}
            </>
          )}
          <footer className="page-footer">
            <ShieldCheck size={15} /> Built around your family. Designed for
            trust.<span>Sideby Parent · Prototype</span>
          </footer>
        </main>
      </div>
    </div>
  );
}
