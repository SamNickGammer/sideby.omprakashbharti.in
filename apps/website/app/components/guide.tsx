import type { ReactNode } from "react";
export function Guide({
  title,
  intro,
  children,
}: {
  title: string;
  intro: string;
  children: ReactNode;
}) {
  return (
    <>
      <a className="skip" href="#main">
        Skip to content
      </a>
      <header className="header wrap">
        <a href="/" aria-label="Sideby home">
          <img src="/brand/wordmark.svg" width="130" height="44" alt="Sideby" />
        </a>
        <a className="text-link" href="/">
          Back to Sideby
        </a>
      </header>
      <main id="main" className="wrap guide">
        <span className="eyebrow">SIDEBY · IN DEVELOPMENT</span>
        <h1>{title}</h1>
        <p className="guide-intro">{intro}</p>
        {children}
      </main>
      <footer className="wrap footer">
        <a href="/">Sideby</a>
        <nav aria-label="Help and privacy">
          <a href="/setup/">Setup guide</a>
          <a href="/privacy/">Privacy policy</a>
          <a href="/terms/">Terms of use</a>
          <a href="/support/">Support</a>
        </nav>
      </footer>
    </>
  );
}
