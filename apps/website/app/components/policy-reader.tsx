"use client";
import { useEffect, useState } from "react";
type Version = {
  id: string;
  title: string;
  summary: string;
  effective_date: string;
  published_at: string;
};
type Policy = Version & { body: string };
const endpoint = process.env.NEXT_PUBLIC_ADMIN_API_ORIGIN;
export function PolicyReader({
  slug,
}: {
  slug: "privacy" | "terms" | "support";
}) {
  const [policy, setPolicy] = useState<Policy>(),
    [versions, setVersions] = useState<Version[]>([]),
    [error, setError] = useState(""),
    [loading, setLoading] = useState(true);
  async function load(id?: string) {
    setLoading(true);
    setError("");
    setPolicy(undefined);
    try {
      if (!endpoint)
        throw Error("Published policy service is not configured yet.");
      const r = await fetch(
        endpoint +
          "/api/public/policies?slug=" +
          slug +
          (id ? "&version=" + encodeURIComponent(id) : ""),
        { cache: "no-store" },
      );
      const v = await r.json();
      if (!r.ok) throw Error(v.error || "Unable to load policy.");
      setPolicy(v.policy);
      setVersions(v.versions);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    const id = new URLSearchParams(location.search).get("version");
    void load(id || undefined);
  }, [slug]);
  return (
    <div className="policy-reader">
      {loading ? (
        <p role="status">Loading published policy…</p>
      ) : error ? (
        <div role="alert">
          <p>{error} Please try again before relying on this page.</p>
          <button className="button" onClick={() => load()}>
            Try again
          </button>
        </div>
      ) : (
        policy && (
          <>
            <div className="policy-meta">
              <p>
                <strong>Effective:</strong> {policy.effective_date.slice(0, 10)}
                <br />
                <strong>Last updated:</strong>{" "}
                {new Date(policy.published_at).toLocaleDateString("en-GB", {
                  timeZone: "Asia/Kolkata",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
                <br />
                <strong>Version:</strong> {policy.id}
              </p>
              <label>
                Policy archive
                <select
                  value={policy.id}
                  onChange={(e) => {
                    history.replaceState(
                      null,
                      "",
                      "?version=" + encodeURIComponent(e.target.value),
                    );
                    void load(e.target.value);
                  }}
                >
                  {versions.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.effective_date.slice(0, 10)} — {v.summary}
                    </option>
                  ))}
                </select>
              </label>
              <a className="text-link" href={"?version=" + policy.id}>
                Link to this version
              </a>
            </div>
            <h2>{policy.title}</h2>
            <div className="policy-text">{policy.body}</div>
          </>
        )
      )}
    </div>
  );
}
