import type { Metadata } from "next";
import { Guide } from "../components/guide";
export const metadata: Metadata = {
  title: "Privacy & permissions \u00b7 Sideby",
  description:
    "How the current development version handles sharing. This overview describes local testing, not a launch-ready privacy policy. Public family enrollment is not open.",
  alternates: { canonical: "/privacy/" },
  openGraph: { title: "Privacy & permissions \u00b7 Sideby", url: "/privacy/" },
};
export default function Page() {
  return (
    <Guide
      title="Privacy & permissions"
      intro="How the current development version handles sharing. This overview describes local testing, not a launch-ready privacy policy. Public family enrollment is not open."
    >
      <section>
        <h2>This public website</h2>
        <p>
          The landing website has no account forms, device pairing or child-data
          collection features. Hosting requests are handled by Vercel and may
          produce technical request logs. The website does not connect to the
          parent app database.
        </p>
      </section>
      <section>
        <h2>A visible connection</h2>
        <p>
          Sideby Connect is visible on the device. Pairing is confirmed in the
          parent dashboard, and optional sharing has separate controls. Granting
          an Android permission does not approve a live screen, camera or
          microphone session.
        </p>
      </section>
      <section>
        <h2>What can be shared in local testing</h2>
        <p>
          Device details and permission status, opted-in daily app usage,
          launcher-visible apps, permitted notification previews, contacts,
          installer-permitted SMS/call records and explicitly selected photos.
          Notification previews are not complete social conversations. Location
          is not implemented.
        </p>
      </section>
      <section>
        <h2>Live sessions</h2>
        <p>
          Each session requires device approval and visible controls, is limited
          to five minutes and can be stopped. Screen sharing uses Android’s
          consent dialog and notification. Camera and microphone require the
          sharing screen to remain open. Sideby does not record these sessions
          or provide remote touch control.
        </p>
      </section>
      <section>
        <h2>Stored snapshots and stopping sharing</h2>
        <p>
          Content snapshots are stored for the paired family and replaced by
          newer snapshots. The companion offers Stop, and the parent can clear
          shared content. Disconnecting clears shared content; offline clearing
          may wait for connectivity. Removing access does not promise immediate
          deletion from provider backups.
        </p>
      </section>
      <section>
        <h2>Before public launch</h2>
        <p>
          Retention periods, backup deletion, hosting regions, account
          export/deletion and a private support/security contact still need to
          be finalized and published. Do not submit real child information
          through public project channels. This website does not yet offer
          public accounts or APK downloads.
        </p>
      </section>
    </Guide>
  );
}
