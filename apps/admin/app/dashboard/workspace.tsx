"use client";
import { useEffect, useState, useRef } from "react";
type Policy = {
  id: string;
  slug: string;
  title: string;
  body: string;
  summary: string;
  effective_date: string;
  published_at: string | null;
  current: boolean;
};
type Bug = {
  id: string;
  name: string;
  email: string;
  category: string;
  subject: string;
  description: string;
  status: string;
  created_at: string;
};
type Overview = {
  available: boolean;
  environment: string;
  message?: string;
  asOf?: string;
  counts?: {
    users: number;
    families: number;
    children: number;
    devices: number;
    recent: number;
  };
  growth?: { day: string; users: number; children: number; devices: number }[];
};
async function api(path: string, method = "GET", data?: unknown) {
  const r = await fetch("/api/" + path, {
    method,
    headers: { "Content-Type": "application/json" },
    body: data === undefined ? undefined : JSON.stringify(data),
  });
  const v = await r.json();
  if (r.status === 401) {
    location.assign("/login");
    throw Error("Session expired.");
  }
  if (!r.ok) throw Error(v.error || "Request failed.");
  return v;
}
export default function Dashboard() {
  const [tab, setTab] = useState("overview"),
    [overview, setOverview] = useState<Overview>(),
    [policies, setPolicies] = useState<Policy[]>([]),
    [bugs, setBugs] = useState<Bug[]>([]),
    [page, setPage] = useState(1),
    [more, setMore] = useState(false),
    [error, setError] = useState(""),
    [notice, setNotice] = useState(""),
    [busy, setBusy] = useState(false),
    [preview, setPreview] = useState<Policy | null>(null),
    [draft, setDraft] = useState({
      slug: "privacy",
      title: "",
      body: "",
      summary: "",
      effectiveDate: new Date().toISOString().slice(0, 10),
    });
  const modalRef = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    if (preview) modalRef.current?.showModal();
  }, [preview]);
  async function refresh() {
    setError("");
    try {
      if (tab === "overview") setOverview(await api("overview"));
      if (tab === "policies") setPolicies((await api("policies")).versions);
      if (tab === "bugs") {
        const v = await api("bugs?page=" + page);
        setBugs(v.reports);
        setMore(v.hasMore);
      }
    } catch (e) {
      setError((e as Error).message);
    }
  }
  useEffect(() => {
    void refresh();
  }, [tab, page]);
  async function act(run: () => Promise<void>) {
    setBusy(true);
    setError("");
    setNotice("");
    try {
      await run();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="workspace">
      <aside>
        <a className="brand" href="/dashboard">
          sideby <small>ADMIN</small>
        </a>
        <nav aria-label="Admin navigation">
          {[
            ["overview", "Overview"],
            ["policies", "Policies"],
            ["bugs", "Support & bugs"],
          ].map(([id, label]) => (
            <button
              key={id}
              className={tab === id ? "selected" : ""}
              onClick={() => {
                setTab(id);
                setNotice("");
              }}
            >
              {label}
            </button>
          ))}
        </nav>
        <p className="small">
          One place for platform health, clear policies and family support.
        </p>
        <button
          className="secondary"
          disabled={busy}
          onClick={() =>
            act(async () => {
              await api("logout", "POST", {});
              location.assign("/login");
            })
          }
        >
          Sign out
        </button>
      </aside>
      <main>
        <header className="page-head">
          <div>
            <span className="eyebrow">SIDEBY OPERATIONS</span>
            <h1>
              {tab === "overview"
                ? "A clear view."
                : tab === "policies"
                  ? "Words that build trust."
                  : "Here to help."}
            </h1>
          </div>
          <button className="secondary" onClick={refresh}>
            Refresh
          </button>
        </header>
        {error && (
          <p className="error" role="alert">
            {error}
          </p>
        )}
        {notice && (
          <p className="notice" role="status">
            {notice}
          </p>
        )}
        {tab === "overview" && (
          <>
            {!overview ? (
              <p>Loading platform counts…</p>
            ) : (
              <>
                <p className="small">
                  {overview.environment.toUpperCase()} database ·{" "}
                  {overview.asOf
                    ? `Updated ${new Date(overview.asOf).toLocaleString()}`
                    : "Metrics unavailable"}
                </p>
                {!overview.available ? (
                  <div className="card">{overview.message}</div>
                ) : (
                  <>
                    <div className="stats">
                      {[
                        ["Parent accounts", overview.counts!.users],
                        ["Families", overview.counts!.families],
                        ["Active children", overview.counts!.children],
                        ["Paired devices", overview.counts!.devices],
                        ["Seen in 24 hours", overview.counts!.recent],
                      ].map(([label, count]) => (
                        <article className="card" key={label}>
                          <p>{label}</p>
                          <strong>{count}</strong>
                        </article>
                      ))}
                    </div>
                    <section className="card">
                      <h2>Growth over 30 days</h2>
                      <p>
                        New accounts, child profiles and device pairings per day
                        (UTC). “Seen” is a recent check-in, not a live
                        connection.
                      </p>
                      <div className="table-scroll">
                        <table>
                          <thead>
                            <tr>
                              <th>Date</th>
                              <th>Accounts</th>
                              <th>Children</th>
                              <th>Devices</th>
                            </tr>
                          </thead>
                          <tbody>
                            {overview.growth!.map((d) => (
                              <tr key={d.day}>
                                <td>{d.day}</td>
                                <td>{d.users}</td>
                                <td>{d.children}</td>
                                <td>{d.devices}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </section>
                  </>
                )}
              </>
            )}
          </>
        )}
        {tab === "policies" && (
          <>
            <div className="card">
              <h2>Create a policy version</h2>
              <p>
                Saved versions are immutable. Use “Copy to editor” to make a
                revision. Publication makes the selected version public
                immediately.
              </p>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  void act(async () => {
                    await api("policies", "POST", draft);
                    setNotice(
                      "Draft saved. Review its complete text before publishing.",
                    );
                    await refresh();
                  });
                }}
              >
                <div className="form-grid">
                  <label>
                    Policy
                    <select
                      value={draft.slug}
                      onChange={(e) =>
                        setDraft({ ...draft, slug: e.target.value })
                      }
                    >
                      <option value="privacy">Privacy policy</option>
                      <option value="terms">Terms of use</option>
                      <option value="support">Support policy</option>
                    </select>
                  </label>
                  <label>
                    Effective date
                    <input
                      type="date"
                      required
                      value={draft.effectiveDate}
                      onChange={(e) =>
                        setDraft({ ...draft, effectiveDate: e.target.value })
                      }
                    />
                  </label>
                </div>
                <label>
                  Title
                  <input
                    required
                    minLength={3}
                    maxLength={160}
                    value={draft.title}
                    onChange={(e) =>
                      setDraft({ ...draft, title: e.target.value })
                    }
                  />
                </label>
                <label>
                  Change summary
                  <input
                    required
                    minLength={3}
                    maxLength={1000}
                    value={draft.summary}
                    onChange={(e) =>
                      setDraft({ ...draft, summary: e.target.value })
                    }
                  />
                </label>
                <label>
                  Full policy text
                  <textarea
                    rows={18}
                    required
                    minLength={100}
                    maxLength={60000}
                    value={draft.body}
                    onChange={(e) =>
                      setDraft({ ...draft, body: e.target.value })
                    }
                  />
                </label>
                <button disabled={busy}>Save new draft</button>
              </form>
            </div>
            <section className="card">
              <h2>Version history</h2>
              {policies.length === 0 ? (
                <p>No versions yet.</p>
              ) : (
                policies.map((p) => (
                  <article className="record" key={p.id}>
                    <div>
                      <span className="pill">
                        {p.current
                          ? "Current"
                          : p.published_at
                            ? "Archived"
                            : "Draft"}{" "}
                        · {p.slug}
                      </span>
                      <h3>{p.title}</h3>
                      <p>{p.summary}</p>
                      <small>
                        Effective {p.effective_date.slice(0, 10)} · {p.id}
                      </small>
                    </div>
                    <div className="actions">
                      <button
                        className="secondary"
                        onClick={() => setPreview(p)}
                      >
                        Review
                      </button>
                      <button
                        className="secondary"
                        onClick={() => {
                          setDraft({
                            slug: p.slug,
                            title: p.title,
                            body: p.body,
                            summary: "",
                            effectiveDate: new Date()
                              .toISOString()
                              .slice(0, 10),
                          });
                          window.scrollTo({ top: 0, behavior: "smooth" });
                        }}
                      >
                        Copy to editor
                      </button>
                    </div>
                  </article>
                ))
              )}
            </section>
          </>
        )}
        {tab === "bugs" && (
          <section className="card">
            <h2>Private support inbox</h2>
            <p>
              Report details are visible only here. Status changes do not send
              emails. Use the supplied reply address for any separately
              authorized follow-up.
            </p>
            {bugs.length === 0 ? (
              <p>No reports on this page.</p>
            ) : (
              bugs.map((b) => (
                <article className="record" key={b.id}>
                  <span className="pill">{b.category}</span>
                  <h3>{b.subject}</h3>
                  <p className="prewrap">{b.description}</p>
                  <p>
                    {b.name || "No name supplied"} · {b.email}
                  </p>
                  <small>
                    {new Date(b.created_at).toLocaleString()} · {b.id}
                  </small>
                  <label>
                    Status
                    <select
                      disabled={busy}
                      value={b.status}
                      onChange={(e) =>
                        act(async () => {
                          await api("bugs/" + b.id, "PATCH", {
                            status: e.target.value,
                          });
                          await refresh();
                          setNotice("Report status updated.");
                        })
                      }
                    >
                      <option value="open">Open</option>
                      <option value="investigating">Investigating</option>
                      <option value="resolved">Resolved</option>
                    </select>
                  </label>
                </article>
              ))
            )}
            <div className="actions">
              <button
                className="secondary"
                disabled={page === 1}
                onClick={() => setPage(page - 1)}
              >
                Previous
              </button>
              <span>Page {page}</span>
              <button
                className="secondary"
                disabled={!more}
                onClick={() => setPage(page + 1)}
              >
                Next
              </button>
            </div>
          </section>
        )}
        {preview && (
          <dialog
            ref={modalRef}
            onClose={() => setPreview(null)}
            className="card modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="review-title"
          >
            <button className="secondary" onClick={() => setPreview(null)}>
              Close review
            </button>
            <h2 id="review-title">{preview.title}</h2>
            <p>
              Effective {preview.effective_date.slice(0, 10)} ·{" "}
              {preview.published_at ? "Published" : "Draft"}
            </p>
            <div className="prewrap policy-body">{preview.body}</div>
            {!preview.published_at && (
              <button
                disabled={busy}
                onClick={() =>
                  act(async () => {
                    await api(
                      "policies/" + preview.id + "/publish",
                      "POST",
                      {},
                    );
                    setPreview(null);
                    await refresh();
                    setNotice(
                      "Policy published. Previous published versions remain in the archive.",
                    );
                  })
                }
              >
                Publish this version publicly
              </button>
            )}
          </dialog>
        )}
      </main>
    </div>
  );
}
