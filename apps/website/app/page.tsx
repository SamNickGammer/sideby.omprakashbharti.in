import {
  ArrowUpRight,
  ArrowRight,
  Check,
  ChevronRight,
  Heart,
  Layers3,
  Link2,
  ShieldCheck,
  Smartphone,
  Sun,
  Users,
  Wifi,
} from "lucide-react";
const questions = [
  [
    "Can I use Sideby today?",
    "The parent dashboard and Android companion work together in local testing. Public accounts and APK downloads are not available yet. This website introduces the project; it does not enroll your family or collect device information.",
  ],
  [
    "Can one parent connect more than one child?",
    "Yes. The parent dashboard supports multiple child profiles, and each child can have multiple paired devices. Pairing and check-ins have been tested with the Android emulator; physical-phone testing remains ahead.",
  ],
  [
    "Will my child know the app is installed?",
    "Yes. Sideby Connect is visible and explains permissions. Each live session needs approval on the device, and screen sharing also needs Android’s consent. Sharing is view-only, lasts at most five minutes and can be stopped on the device.",
  ],
  [
    "Does Sideby already limit screen time or show messages?",
    "Device limits are not enforced yet. Local tests cover opted-in usage, launcher-visible apps, notification previews, selected photos and contacts. SMS and call records depend on Android and the installer. Social views contain available notification previews, not full conversations. Location is not available.",
  ],
  [
    "Will it work on iPhone?",
    "Android is the first companion platform, currently tested on an emulator. We do not currently promise an iPhone companion or equivalent features across platforms.",
  ],
];
export default function Home() {
  return (
    <>
      <a className="skip" href="#main">
        Skip to content
      </a>
      <header className="header wrap">
        <a href="#" aria-label="Sideby home">
          <img src="/brand/wordmark.svg" width="130" height="44" alt="Sideby" />
        </a>
        <nav aria-label="Main navigation">
          <a href="#inside">Inside Sideby</a>
          <a href="#how">How it works</a>
          <a href="#questions">Questions</a>
        </nav>
        <a className="header-link" href="#progress">
          Follow our progress <ArrowUpRight size={16} />
        </a>
      </header>
      <main id="main">
        <section className="hero wrap">
          <div className="hero-copy">
            <span className="eyebrow">
              <span className="dot" /> MADE FOR FAMILY LIFE
            </span>
            <h1>
              A little closer.
              <br />
              Even <em>online.</em>
            </h1>
            <p>
              A calmer place to keep up with your family’s digital world. More
              understanding, healthy habits, and room to grow.
            </p>
            <div className="actions">
              <a className="button" href="#inside">
                Meet Sideby <ArrowRight size={18} />
              </a>
              <a className="text-link" href="#how">
                See how it connects <ArrowUpRight size={16} />
              </a>
            </div>
            <span className="hero-note">
              Thoughtfully in development. Built around your family.
            </span>
          </div>
          <div className="hero-art">
            <div className="orbit orbit-one" />
            <div className="orbit orbit-two" />
            <div className="small-note">
              <Heart size={17} /> A little support goes a long way.
            </div>
            <div className="preview">
              <div className="preview-head">
                <img src="/brand/symbol.svg" alt="" width="27" height="27" />
                <span>Your family</span>
                <span className="demo">Illustrative preview</span>
              </div>
              <div className="preview-title">
                <span className="eyebrow">YOUR SHARED SPACE</span>
                <h2>
                  Every child.
                  <br />
                  Their own space.
                </h2>
                <Sun size={31} />
              </div>
              <div className="profile">
                <span className="avatar mint">A</span>
                <div>
                  <strong>Alex’s space</strong>
                  <small>Ready for a new connection</small>
                </div>
                <ChevronRight size={18} />
              </div>
              <div className="profile">
                <span className="avatar peach">R</span>
                <div>
                  <strong>Riley’s space</strong>
                  <small>Growing at their own pace</small>
                </div>
                <ChevronRight size={18} />
              </div>
              <div className="preview-footer">
                <Users size={16} />
                <span>One family. Many little worlds.</span>
              </div>
            </div>
            <div className="connect-chip">
              <span className="chip-icon">
                <Link2 size={22} />
              </span>
              <div>
                <strong>Sideby Connect</strong>
                <small>Android companion · local testing</small>
              </div>
            </div>
          </div>
        </section>
        <div className="principles wrap">
          <span>
            <Users size={18} /> One parent, multiple children
          </span>
          <span>
            <Smartphone size={18} /> A space for every device
          </span>
          <span>
            <ShieldCheck size={18} /> Visible, permission-based connection
          </span>
        </div>
        <section className="section wrap" id="inside">
          <div className="section-head">
            <div>
              <span className="eyebrow">LESS NOISE. MORE CONNECTION.</span>
              <h2>
                Family life isn’t one-size-fits-all.
                <br />
                Your family space shouldn’t be either.
              </h2>
            </div>
            <p>
              A clear overview for you.
              <br />A little independence for them.
            </p>
          </div>
          <div className="feature-grid">
            <article className="feature feature-large">
              <span className="feature-icon">
                <Layers3 />
              </span>
              <span className="pill">Built in the parent web app</span>
              <h3>
                One family.
                <br />
                Individual little worlds.
              </h3>
              <p>
                Give every child their own profile and dedicated space. Keep
                devices, saved routines and family details organised without
                mixing everyone together.
              </p>
              <div className="family-illustration" aria-hidden="true">
                <span className="avatar mint">A</span>
                <span className="avatar peach">R</span>
                <span className="avatar lavender">J</span>
                <span className="family-label">
                  Together, with room to be themselves.
                </span>
              </div>
            </article>
            <article className="feature">
              <span className="feature-icon">
                <Sun />
              </span>
              <h3>Start with a conversation.</h3>
              <p>
                Usage starts unrestricted. Saved routines are a starting point
                for healthy habits, not a promise that a phone is already being
                controlled.
              </p>
              <a href="#progress" className="text-link">
                What’s ready today <ArrowUpRight size={16} />
              </a>
            </article>
            <article className="feature">
              <span className="feature-icon">
                <ShieldCheck />
              </span>
              <h3>Connection, in the open.</h3>
              <p>
                A visible child app, clear permissions and revocable pairing.
                Live sessions are view-only, separately approved on the device
                and stoppable at any time. No recordings or remote control.
              </p>
              <a href="#questions" className="text-link">
                Your questions, answered <ArrowUpRight size={16} />
              </a>
            </article>
          </div>
        </section>
        <section className="how-section" id="how">
          <div className="wrap how-layout">
            <div>
              <span className="eyebrow">TWO APPS. ONE CONNECTION.</span>
              <h2>
                You’re on the same team.
                <br />
                <em>Sideby side.</em>
              </h2>
              <p>
                Sideby Parent lives in your browser. Sideby Connect is the
                Android companion for your child’s device. Both are in local
                testing; public access is not open yet.
              </p>
              <span className="outline-note">
                <Smartphone size={16} /> Pairing verified on emulator ·
                physical-phone testing next.
              </span>
            </div>
            <ol className="steps">
              <li>
                <span>01</span>
                <div>
                  <h3>Make room for your family</h3>
                  <p>
                    Create a parent account and add a profile for each child in
                    the parent dashboard.
                  </p>
                </div>
              </li>
              <li>
                <span>02</span>
                <div>
                  <h3>Pair, then confirm</h3>
                  <p>
                    Enter the expiring pairing code in Sideby Connect. Compare
                    the details and confirm the device in Sideby Parent.
                  </p>
                </div>
              </li>
              <li>
                <span>03</span>
                <div>
                  <h3>Stay connected, with clarity</h3>
                  <p>
                    Choose what to share in the companion and grant the relevant
                    Android permissions. Check permission status and the latest
                    sync in the dashboard. Live sessions need fresh approval.
                  </p>
                </div>
              </li>
            </ol>
          </div>
        </section>
        <section className="section wrap progress" id="progress">
          <div>
            <span className="eyebrow">BUILT WITH CARE, ONE STEP AT A TIME</span>
            <h2>
              A real foundation.
              <br />
              An honest roadmap.
            </h2>
            <p>
              We’re building Sideby in stages. Here’s where things stand,
              without the fine print.
            </p>
          </div>
          <div className="milestones">
            <article>
              <span className="milestone-symbol">
                <Check size={18} />
              </span>
              <div>
                <span className="eyebrow">BUILT · IN TESTING</span>
                <h3>The parent web foundation</h3>
                <p>
                  Accounts, multiple children and devices, private profile
                  photos, pairing, permission status and saved routines.
                  Routines do not enforce device limits.
                </p>
              </div>
            </article>
            <article>
              <span className="milestone-symbol next">
                <Wifi size={18} />
              </span>
              <div>
                <span className="eyebrow">
                  EMULATOR-VERIFIED · NOT PUBLIC YET
                </span>
                <h3>A working Android connection</h3>
                <p>
                  Pairing, check-ins, today’s opted-in app usage,
                  launcher-visible apps, selected photos, contacts and
                  notification previews. SMS and call records are
                  platform-dependent. Screen, camera and audio sessions are
                  tested locally with visible approval.
                </p>
              </div>
            </article>
            <article>
              <span className="milestone-symbol later">
                <Smartphone size={18} />
              </span>
              <div>
                <span className="eyebrow">
                  LATER · SUBJECT TO PLATFORM SUPPORT
                </span>
                <h3>Before a public release</h3>
                <p>
                  Physical-phone testing, reliable background syncing and
                  production hosting are still ahead. Location, device
                  pause/enforcement and an iPhone companion are not available.
                </p>
              </div>
            </article>
          </div>
        </section>
        <section className="section wrap faq" id="questions">
          <div>
            <span className="eyebrow">GOOD QUESTIONS</span>
            <h2>
              A little clarity
              <br />
              before we connect.
            </h2>
          </div>
          <div>
            {questions.map(([q, a]) => (
              <details key={q}>
                <summary>
                  {q}
                  <span aria-hidden="true">+</span>
                </summary>
                <p>{a}</p>
              </details>
            ))}
          </div>
        </section>
        <section className="closing wrap">
          <img src="/brand/symbol.svg" alt="" width="48" height="48" />
          <h2>
            Growing up is a journey.
            <br />
            Let’s stay <em>side by side.</em>
          </h2>
          <p>Connected families. Healthy habits.</p>
          <a href="#progress" className="button">
            Explore what’s next <ArrowUpRight size={17} />
          </a>
        </section>
      </main>
      <footer className="wrap footer">
        <a href="#" aria-label="Sideby home">
          <img src="/brand/wordmark.svg" width="105" height="36" alt="Sideby" />
        </a>
        <span>
          © {new Date().getFullYear()} Sideby. Thoughtfully in development.
        </span>
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
