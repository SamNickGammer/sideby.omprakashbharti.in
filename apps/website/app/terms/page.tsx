import type { Metadata } from "next";
import { Guide } from "../components/guide";
import { PolicyReader } from "../components/policy-reader";
export const metadata: Metadata = {
  title: "Terms of use · Sideby",
  alternates: { canonical: "/terms/" },
  openGraph: { title: "Terms of use · Sideby", url: "/terms/" },
};
export default function Page() {
  return (
    <Guide
      title="Terms of use"
      intro="The conditions for using Sideby’s website and development services, with the current terms below. Older versions are available on request through Support."
    >
      <PolicyReader slug="terms" />
    </Guide>
  );
}
