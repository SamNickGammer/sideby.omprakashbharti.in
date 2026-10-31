"use client";
import { useState } from "react";
export default function Login() {
  const [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  return (
    <main className="login">
      <a className="brand" href="https://sideby.omprakashbharti.in">
        sideby <small>ADMIN</small>
      </a>
      <section className="card">
        <span className="eyebrow">PRIVATE WORKSPACE</span>
        <h1>Welcome back.</h1>
        <p>Sign in to manage the platform, policies and support.</p>
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            setError("");
            setBusy(true);
            const f = new FormData(e.currentTarget);
            try {
              const r = await fetch("/api/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  email: f.get("email"),
                  password: f.get("password"),
                }),
              });
              const v = await r.json();
              if (!r.ok) throw Error(v.error);
              location.assign("/dashboard");
            } catch (e) {
              setError(e instanceof Error ? e.message : "Could not sign in.");
              setBusy(false);
            }
          }}
        >
          <label>
            Admin ID
            <input
              name="email"
              type="text"
              autoComplete="username"
              required
              maxLength={254}
            />
          </label>
          <label>
            Password
            <input
              name="password"
              type="password"
              autoComplete="current-password"
              required
              maxLength={200}
            />
          </label>
          {error && (
            <p className="error" role="alert">
              {error}
            </p>
          )}
          <button disabled={busy}>{busy ? "Signing in…" : "Sign in"}</button>
        </form>
        <p className="small">
          Private administrator access. Public registration is not available.
        </p>
      </section>
    </main>
  );
}
