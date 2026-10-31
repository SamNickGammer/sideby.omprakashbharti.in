import type { Metadata } from "next";
import { Guide } from "../components/guide";
export const metadata: Metadata = {
  title: "Getting connected \u00b7 Sideby",
  description:
    "A guide to the current local testing flow. Public parent accounts and an Android download are not available from this website yet.",
  alternates: { canonical: "/setup/" },
  openGraph: { title: "Getting connected \u00b7 Sideby", url: "/setup/" },
};
export default function Page() {
  return (
    <Guide
      title="Getting connected"
      intro="A guide to the current local testing flow. Public parent accounts and an Android download are not available from this website yet."
    >
      <section>
        <h2>1. Create a child profile</h2>
        <p>
          In Sideby Parent, add a child and choose the device pairing option.
          Each child can have their own devices; one parent can manage multiple
          children.
        </p>
      </section>
      <section>
        <h2>2. Pair the Android companion</h2>
        <p>
          Install the test APK supplied by the project owner. Enter the expiring
          pairing code in Sideby Connect, then compare the device details and
          confirm in the parent dashboard. Local builds also need the
          development server connection configured by the tester; a pairing code
          alone does not make a local server reachable.
        </p>
      </section>
      <section>
        <h2>3. Choose what to share</h2>
        <p>
          Open Permissions on this device and Manage data sharing. Grant only
          the permissions for the features you choose, using Android’s dialogs
          or settings. Usage Access and notification access have their own
          Android settings. Photos are explicitly selected, not a full gallery
          upload.
        </p>
      </section>
      <section>
        <h2>4. Check the dashboard</h2>
        <p>
          Look at the device’s permission status and last check-in. Open Digital
          wellbeing or the relevant content tab to see the latest shared
          snapshot. Current content syncing is foreground-only; it is not
          continuous background monitoring.
        </p>
      </section>
      <section>
        <h2>5. Start a visible live session</h2>
        <p>
          Open Live sharing on the companion, then press Start Screen, Start
          Camera or Start Audio in the dashboard. Approve the session on the
          device. Android asks for screen-sharing consent each time. Sessions
          stop after five minutes; camera and microphone also stop when you
          leave the sharing screen. Screen and camera do not include microphone
          audio.
        </p>
      </section>
      <section>
        <h2>If something does not appear</h2>
        <p>
          Check the selected device, connection, permission status and sharing
          switch. Return to the companion and sync again. Android may refuse
          SMS/call access or hide protected content. See the support page for
          reporting a problem.
        </p>
      </section>
    </Guide>
  );
}
