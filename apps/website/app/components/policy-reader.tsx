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
    [error, setError] = useState(""),
    [loading, setLoading] = useState(true);
  async function load() {
    setLoading(true);
    setError("");
    setPolicy(undefined);
    try {
      if (!endpoint)
        throw Error("Published policy service is not configured yet.");
      const r = await fetch(endpoint + "/api/public/policies?slug=" + slug, {
        cache: "no-store",
      });
      const v = await r.json();
      if (!r.ok) throw Error(v.error || "Unable to load policy.");
      setPolicy(v.policy);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    void load();
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
              <a
                className="button"
                href={"/support/?request=policy&policy=" + slug + "#report"}
              >
                Request an older policy
              </a>
              <p>
                Only the current policy is published here. Request a copy for a
                specific date or date range through Support.
              </p>
            </div>
            <h2>{policy.title}</h2>
            <div className="policy-text">{policy.body}</div>
          </>
        )
      )}
    </div>
  );
}
