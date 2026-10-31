import type { Metadata } from "next";
import { Guide } from "../components/guide";
import { PolicyReader } from "../components/policy-reader";
export const metadata: Metadata = {
  title: "Privacy policy · Sideby",
  alternates: { canonical: "/privacy/" },
  openGraph: { title: "Privacy policy · Sideby", url: "/privacy/" },
};
export default function Page() {
  return (
    <Guide
      title="Privacy policy"
      intro="Understand what Sideby collects, why it is needed, how permissions work and how to contact us. Previous published versions remain available below."
    >
      <PolicyReader slug="privacy" />
    </Guide>
  );
}
