"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, ShieldCheck, Check, Eye, EyeOff } from "lucide-react";
import { authClient } from "../lib/auth-client";
export default function AuthForm({ mode, development = false }: { mode: string; development?: boolean }) {
  const signup = mode === "sign-up",
    forgot = mode === "forgot-password",
    reset = mode === "reset-password";
  const [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [notice, setNotice] = useState(""),
    [visible, setVisible] = useState(false);
  const [recoveryEmail, setRecoveryEmail] = useState("");
  const [codeSent, setCodeSent] = useState(false);
  const [complete, setComplete] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  useEffect(() => {
    if (!cooldown) return;
    const timer = setTimeout(() => setCooldown((n) => Math.max(0, n - 1)), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);
  async function sendCode(email: string) {
    const result = await authClient.emailOtp.sendVerificationOtp({
      email, type: "forget-password",
    });
    if (result.error) throw new Error(result.error.message || "Could not send a code. Please try again.");
    setRecoveryEmail(email);
    setCodeSent(true);
    setCooldown(60);
    setNotice("If this email has an account, a verification code is on its way. Check your inbox and spam folder.");
  }
  async function resend() {
    if (busy || cooldown) return;
    setBusy(true); setError(""); setNotice("");
    try { await sendCode(recoveryEmail); }
    catch (e) { setError(e instanceof Error ? e.message : "Could not send a code."); }
    finally { setBusy(false); }
  }
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
        if (!codeSent) {
          await sendCode(email.trim());
          return;
        }
        if (password !== String(f.get("confirmPassword") || ""))
          throw new Error("The passwords don’t match.");
        result = await authClient.emailOtp.resetPassword({
          email: recoveryEmail,
          otp: String(f.get("otp") || "").trim(),
          password,
        });
        if (!result.error) {
          setComplete(true);
          setNotice("Password updated. Sign in with your new password.");

        }
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
          (forgot && result.error.code === "INVALID_OTP"
            ? "That code is incorrect or has expired. Check the code or request a new one."
            : result.error.message) ||
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
          <div className="auth-kicker">SIDEBY PARENT{development ? " · DEVELOPMENT" : ""}</div>
          <h2>
            {signup
              ? "A fresh start, together."
              : forgot
                ? (codeSent ? "Check your email." : "Let’s get you back in.")
                : reset
                  ? "Choose a new password."
                  : "Good to see you."}
          </h2>
          <p>
            {signup
              ? "Create your parent account. Build your family space."
              : forgot
                ? (codeSent ? "Enter the verification code and choose a new password of at least 12 characters." : "We’ll email you a verification code to reset your password.")
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
          {!complete && <form onSubmit={submit}>
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
            {!reset && !(forgot && codeSent) && (
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
            {forgot && codeSent && (
              <>
                <p>Code sent to {recoveryEmail}</p>
                <label>Verification code
                  <input name="otp" inputMode="numeric" autoComplete="one-time-code"
                    pattern="[0-9]{6}" minLength={6} maxLength={6} required placeholder="6-digit code" />
                </label>
              </>
            )}
            {(!forgot || codeSent) && (
              <label>
                Password
                <div className="password-input">
                  <input
                    name="password"
                    type={visible ? "text" : "password"}
                    autoComplete={
                      signup || reset || forgot ? "new-password" : "current-password"
                    }
                    required
                    minLength={signup || reset || forgot ? 12 : 1}
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
            {forgot && codeSent && (
              <label>Confirm new password
                <input name="confirmPassword" type={visible ? "text" : "password"}
                  autoComplete="new-password" required minLength={12} maxLength={128} />
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
                    ? (codeSent ? "Update password" : "Send verification code")
                    : reset
                      ? "Update password"
                      : "Sign in"}
              <ArrowRight size={17} />
            </button>
          </form>}
          {forgot && codeSent && !complete && (
            <div className="pairing-actions">
              <button type="button" className="text-button" disabled={busy || cooldown > 0} onClick={resend}>
                {cooldown > 0 ? `Resend code in ${cooldown}s` : "Resend code"}
              </button>
              <button type="button" className="text-button" disabled={busy} onClick={() => {
                setCodeSent(false); setRecoveryEmail(""); setError(""); setNotice("");
              }}>Use a different email</button>
            </div>
          )}
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
            Early access · Android connection testing is underway.
          </p>
        </div>
      </section>
    </div>
  );
}
