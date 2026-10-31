"use client";
import { useState } from "react";
const endpoint = process.env.NEXT_PUBLIC_ADMIN_API_ORIGIN;
export function BugForm() {
  const [error, setError] = useState(""),
    [reference, setReference] = useState(""),
    [busy, setBusy] = useState(false);
  return (
    <section id="report">
      <h2>Report a bug</h2>
      <p>
        Tell us what went wrong. Your reply email and report go to the private
        Sideby support inbox. Please leave out passwords, pairing codes,
        children’s names, messages and photos. Attachments are not accepted.
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
              const r = await fetch(endpoint + "/api/public/bugs", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  name: f.get("name"),
                  email: f.get("email"),
                  category: f.get("category"),
                  subject: f.get("subject"),
                  description: f.get("description"),
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
          <label>
            Details
            <textarea
              name="description"
              required
              minLength={20}
              maxLength={5000}
              rows={7}
              placeholder="Steps to reproduce, expected result, app and Android version. Please omit sensitive personal information."
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
            {busy ? "Sending…" : "Submit report"}
          </button>
        </form>
      )}
    </section>
  );
}
