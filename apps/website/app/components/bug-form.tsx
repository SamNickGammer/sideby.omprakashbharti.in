"use client";
import { useEffect, useState } from "react";
const endpoint = process.env.NEXT_PUBLIC_ADMIN_API_ORIGIN;
export function BugForm() {
  const [error, setError] = useState(""),
    [reference, setReference] = useState(""),
    [busy, setBusy] = useState(false);
  const [historical, setHistorical] = useState(false);
  const [policyType, setPolicyType] = useState("privacy");
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    setHistorical(params.get("request") === "policy");
    const type = params.get("policy");
    if (type && ["privacy", "terms", "support"].includes(type))
      setPolicyType(type);
  }, []);
  return (
    <section id="report">
      <h2>Support &amp; requests</h2>
      <p>
        Ask for help, report a bug or request an older policy. Your reply email
        and request go to the private Sideby support inbox. Please leave out
        passwords, pairing codes, children’s names, messages and photos.
        Attachments are not accepted.
      </p>
      {!endpoint ? (
        <p>The report form is not available yet.</p>
      ) : reference ? (
        <div role="status">
          <p>
            Report received. Keep this reference: <strong>{reference}</strong>.
          </p>
          <p>
            No automatic email has been sent. We do not promise a response time
            during development.
          </p>
          <button className="button" onClick={() => setReference("")}>
            Send another report
          </button>
        </div>
      ) : (
        <form
          className="support-form"
          onSubmit={async (e) => {
            e.preventDefault();
            setBusy(true);
            setError("");
            const f = new FormData(e.currentTarget);
            try {
              const from = String(f.get("dateFrom") || "");
              const to = String(f.get("dateTo") || "");
              if (historical && (!from || (to && to < from)))
                throw Error(
                  "Choose a date, with an end date on or after the start date.",
                );
              const r = await fetch(endpoint + "/api/public/bugs", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  name: f.get("name"),
                  email: f.get("email"),
                  category: historical ? "privacy" : f.get("category"),
                  subject: historical
                    ? "Historical policy request"
                    : f.get("subject"),
                  description: historical
                    ? `Historical policy request: ${policyType}. Date: ${from}${to ? " through " + to : ""}.\n${f.get("description") || "Please share the applicable policy privately."}`
                    : f.get("description"),
                  website: f.get("website"),
                }),
              });
              const v = await r.json();
              if (!r.ok) throw Error(v.error || "Could not send your report.");
              setReference(v.reference);
            } catch (e) {
              setError((e as Error).message);
            } finally {
              setBusy(false);
            }
          }}
        >
          <label>
            Request type
            <select
              value={historical ? "policy" : "general"}
              onChange={(e) => setHistorical(e.target.value === "policy")}
            >
              <option value="general">Bug or general support</option>
              <option value="policy">Request an older policy</option>
            </select>
          </label>
          {historical && (
            <>
              <p>
                Select a policy and a specific date, or add an end date for a
                range. We will review your request and share the available
                policy privately using your reply email.
              </p>
              <label>
                Policy
                <select
                  value={policyType}
                  onChange={(e) => setPolicyType(e.target.value)}
                >
                  <option value="privacy">Privacy policy</option>
                  <option value="terms">Terms of use</option>
                  <option value="support">Support policy</option>
                </select>
              </label>
              <div className="support-fields">
                <label>
                  Date / range start
                  <input name="dateFrom" type="date" required />
                </label>
                <label>
                  Range end (optional)
                  <input name="dateTo" type="date" />
                </label>
              </div>
            </>
          )}
          <div className="support-fields">
            <label>
              Name (optional)
              <input name="name" autoComplete="name" maxLength={100} />
            </label>
            <label>
              Reply email
              <input
                name="email"
                type="email"
                required
                autoComplete="email"
                maxLength={254}
              />
            </label>
          </div>
          {!historical && (
            <>
              {" "}
              <label>
                Topic
                <select name="category">
                  <option value="bug">Bug</option>
                  <option value="privacy">Privacy request</option>
                  <option value="account">Account help</option>
                  <option value="feedback">Feedback</option>
                </select>
              </label>
              <label>
                Subject
                <input name="subject" required minLength={3} maxLength={160} />
              </label>
            </>
          )}
          <label>
            {historical ? "Additional details (optional)" : "Details"}
            <textarea
              name="description"
              required={!historical}
              minLength={historical ? undefined : 20}
              maxLength={historical ? 4500 : 5000}
              rows={7}
              placeholder={
                historical
                  ? "Anything else that will help us find the policy you need (optional)."
                  : "Steps to reproduce, expected result, app and Android version. Please omit sensitive personal information."
              }
            />
          </label>
          <div className="form-honeypot" aria-hidden="true">
            <label>
              Website
              <input name="website" tabIndex={-1} autoComplete="off" />
            </label>
          </div>
          <label className="check-label">
            <input type="checkbox" required />I have read the{" "}
            <a href="/privacy/">privacy policy</a> and understand how my report
            will be used.
          </label>
          {error && (
            <p role="alert" className="form-error">
              {error}
            </p>
          )}
          <button className="button" disabled={busy}>
            {busy
              ? "Sending…"
              : historical
                ? "Submit policy request"
                : "Submit report"}
          </button>
        </form>
      )}
    </section>
  );
}
