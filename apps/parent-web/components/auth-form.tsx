"use client";
import { useState } from "react";
import Link from "next/link";
import { ArrowRight, ShieldCheck, Check, Eye, EyeOff } from "lucide-react";
import { authClient } from "../lib/auth-client";
export default function AuthForm({ mode }: { mode: string }) {
  const signup = mode === "sign-up",
    forgot = mode === "forgot-password",
    reset = mode === "reset-password";
  const [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [notice, setNotice] = useState(""),
    [visible, setVisible] = useState(false);
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError("");
    setNotice("");
    const f = new FormData(e.currentTarget);
    const email = String(f.get("email") || ""),
      password = String(f.get("password") || "");
    try {
      let result;
      if (forgot) {
        result = await authClient.requestPasswordReset({
          email,
          redirectTo: window.location.origin + "/auth/reset-password",
        });
        if (!result.error)
          setNotice(
            "If an account exists, a recovery email is on its way. Check your inbox.",
          );
      } else if (reset) {
        const token = new URLSearchParams(window.location.search).get("token");
        if (!token)
          throw new Error("This reset link is incomplete. Request a new one.");
        result = await authClient.resetPassword({
          newPassword: password,
          token,
        });
        if (!result.error) setNotice("Password updated. You can sign in now.");
      } else if (signup) {
        result = await authClient.signUp.email({
          email,
          password,
          name: String(f.get("name")),
        });
        if (!result.error) window.location.assign("/dashboard");
      } else {
        result = await authClient.signIn.email({ email, password });
        if (!result.error) window.location.assign("/dashboard");
      }
      if (result.error)
        setError(
          result.error.message ||
            "We couldn’t complete that. Please try again.",
        );
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Connection failed. Please try again.",
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="auth-shell">
      <section className="auth-story">
        <img src="/brand/wordmark.svg" alt="Sideby" />
        <span className="auth-eyebrow">A LITTLE CLOSER, EVERY DAY</span>
        <h1>
          Growing up.
          <br />
          Side by side.
        </h1>
        <p>
          A calmer space to guide their digital world.
          <br />
          With room for independence, and room for you.
        </p>
        <div className="orbit-art" aria-hidden="true">
          <div className="orbit-line" />
          <span className="orbit-dot one">S</span>
          <span className="orbit-dot two">♥</span>
          <span className="orbit-dot three">✦</span>
          <div className="orbit-center">
            <ShieldCheck size={48} />
          </div>
        </div>
        <small>Connected families. Healthy habits.</small>
      </section>
      <section className="auth-main">
        <Link href="/auth/sign-in" className="mobile-brand">
          <img src="/brand/wordmark.svg" alt="Sideby" />
        </Link>
        <div className="auth-card">
          <div className="auth-kicker">SIDEBY PARENT</div>
          <h2>
            {signup
              ? "A fresh start, together."
              : forgot
                ? "Let’s get you back in."
                : reset
                  ? "Choose a new password."
                  : "Good to see you."}
          </h2>
          <p>
            {signup
              ? "Create your parent account. Build your family space."
              : forgot
                ? "We’ll send a recovery link to your email."
                : reset
                  ? "Use a unique password of at least 12 characters."
                  : "Sign in to your family’s space."}
          </p>
          {error && (
            <div role="alert" className="error-box">
              {error}
            </div>
          )}
          {notice && (
            <div role="status" className="success-box">
              <Check size={18} />
              {notice}
            </div>
          )}
          <form onSubmit={submit}>
            {signup && (
              <label>
                Your name
                <input
                  name="name"
                  autoComplete="name"
                  required
                  maxLength={60}
                  placeholder="What should we call you?"
                />
              </label>
            )}
            {!reset && (
              <label>
                Email address
                <input
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  placeholder="you@example.com"
                />
              </label>
            )}
            {!forgot && (
              <label>
                Password
                <div className="password-input">
                  <input
                    name="password"
                    type={visible ? "text" : "password"}
                    autoComplete={
                      signup || reset ? "new-password" : "current-password"
                    }
                    required
                    minLength={signup || reset ? 12 : 1}
                    maxLength={128}
                    placeholder={
                      signup ? "At least 12 characters" : "Your password"
                    }
                  />
                  <button
                    type="button"
                    onClick={() => setVisible((v) => !v)}
                    aria-label={visible ? "Hide password" : "Show password"}
                  >
                    {visible ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </label>
            )}
            {!signup && !forgot && !reset && (
              <Link className="forgot-link" href="/auth/forgot-password">
                Forgot password?
              </Link>
            )}
            <button disabled={busy} className="primary auth-submit">
              {busy
                ? "One moment…"
                : signup
                  ? "Create account"
                  : forgot
                    ? "Send recovery email"
                    : reset
                      ? "Update password"
                      : "Sign in"}
              <ArrowRight size={17} />
            </button>
          </form>
          <p className="auth-switch">
            {signup
              ? "Already part of Sideby? "
              : forgot || reset
                ? "Ready to return? "
                : "New here? "}
            <Link
              href={
                signup || forgot || reset ? "/auth/sign-in" : "/auth/sign-up"
              }
            >
              {signup || forgot || reset ? "Sign in" : "Create an account"}
            </Link>
          </p>
          <div className="auth-footnote">
            <ShieldCheck size={15} /> Your family’s information stays in your
            private account.
          </div>
          <p className="beta-note">
            Early access · Device connections are coming next.
          </p>
        </div>
      </section>
    </div>
  );
}
