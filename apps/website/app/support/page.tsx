import type { Metadata } from "next";
import { Guide } from "../components/guide";
export const metadata: Metadata = {
  title: "A little help connecting \u00b7 Sideby",
  description:
    "Sideby is in development. These checks apply to the local Android test app and parent dashboard.",
  alternates: { canonical: "/support/" },
  openGraph: {
    title: "A little help connecting \u00b7 Sideby",
    url: "/support/",
  },
};
export default function Page() {
  return (
    <Guide
      title="A little help connecting"
      intro="Sideby is in development. These checks apply to the local Android test app and parent dashboard."
    >
      <section>
        <h2>Pairing code expired?</h2>
        <p>
          Generate a new code for the intended child and device. Confirm the
          device details in the dashboard. Ask the person running the local test
          server to check its connection; do not enter a production account into
          an unfamiliar test server.
        </p>
      </section>
      <section>
        <h2>Permissions granted, but no data?</h2>
        <p>
          Permissions and sharing switches are separate. Enable the relevant
          sharing option, keep the companion open and check in or sync again.
          Check the dashboard’s selected device and timestamp. Some Android
          permissions remain unavailable depending on the device or installer.
        </p>
      </section>
      <section>
        <h2>Screen, camera or audio will not start?</h2>
        <p>
          Keep Live sharing open on the companion, start a request from the
          dashboard and approve it on the device before it expires. Complete
          Android’s screen-sharing prompt when requested. A local media server
          must also be running. Protected Android content may appear blank.
        </p>
      </section>
      <section>
        <h2>Report a non-sensitive bug</h2>
        <p>
          Use the project’s GitHub issue tracker for reproducible bugs. Include
          the app version, Android version, steps and expected result. Remove
          names, phone numbers, messages, photos, pairing codes, tokens and
          account information from screenshots and logs.
        </p>
      </section>
      <section>
        <h2>Private or security-related concerns</h2>
        <p>
          A dedicated private support and security channel is not configured
          yet. Use an existing private contact with the project owner if you
          have one. Do not post child information or vulnerability details in
          public issues. There is no promised response time during development.
        </p>
      </section>
      <a
        className="button"
        href="https://github.com/SamNickGammer/sideby.omprakashbharti.in/issues"
      >
        Report a non-sensitive bug
      </a>
    </Guide>
  );
}
