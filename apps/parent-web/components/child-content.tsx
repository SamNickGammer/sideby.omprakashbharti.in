import Link from "next/link";
import MessageCenter from "./message-center";
import {
  Images,
  MessageSquare,
  ContactRound,
  Phone,
  ArrowUpRight,
  ShieldCheck,
  Smartphone,
} from "lucide-react";

export const contentPages = {
  photos: {
    title: "Photo gallery",
    icon: Images,
    heading: "A place for shared moments.",
    description:
      "Photos explicitly shared from Sideby Connect will appear here. No photos have been received.",
    scope: "Selected photos",
    detail:
      "Start with photos selected on the child’s device. Pairing does not give access to their entire library.",
    permission: "Photo selection on device",
    availability: "Android integration pending",
  },
  messages: {
    title: "Messages",
    icon: MessageSquare,
    heading: "Messages, with clear boundaries.",
    description:
      "This space is reserved for supported SMS sharing. Message syncing is not available yet, and no messages have been collected.",
    scope: "Supported SMS only",
    detail:
      "This does not provide access to WhatsApp, Instagram or other apps’ private conversations.",
    permission: "SMS access, where permitted",
    availability: "Android feasibility review pending",
  },
  contacts: {
    title: "Contacts",
    icon: ContactRound,
    heading: "Their contacts, shared with care.",
    description:
      "Contacts authorized for sharing from the child’s device will appear here. No contact names or numbers have been received.",
    scope: "Optional contact sharing",
    detail:
      "Contact access will be explained and enabled separately on the device. Pairing alone does not share an address book.",
    permission: "Contacts permission",
    availability: "Android integration pending",
  },
  "call-history": {
    title: "Call history",
    icon: Phone,
    heading: "A clearer view of calls.",
    description:
      "This space is reserved for supported call records. Call-history syncing is not available yet, and no records have been collected.",
    scope: "Call records, not recordings",
    detail:
      "Where supported, records may include incoming, outgoing and missed calls. This section does not record calls or access their audio.",
    permission: "Call-log access, where permitted",
    availability: "Android feasibility review pending",
  },
};
export type ContentSection = keyof typeof contentPages;
export default function ChildContent({
  section,
  deviceHref,
  archived,
}: {
  section: ContentSection;
  deviceHref: string;
  archived: boolean;
}) {
  if (section === "messages")
    return <MessageCenter deviceHref={deviceHref} archived={archived} />;
  const page = contentPages[section],
    Icon = page.icon;
  return (
    <div className="content-page">
      <section className="panel child-data-empty">
        <div className="section-heading">
          <h2>{page.title}</h2>
          <span className="status neutral">Sync not available yet</span>
        </div>
        <div className="child-empty-body content-empty">
          {section === "photos" ? (
            <div className="gallery-outline" aria-hidden="true">
              {[0, 1, 2].map((n) => (
                <span key={n}>
                  <Images size={30} />
                </span>
              ))}
            </div>
          ) : (
            <span className="empty-icon">
              <Icon size={30} />
            </span>
          )}
          <h2>{page.heading}</h2>
          <p>{page.description}</p>
          <Link href={deviceHref} className="secondary">
            View device setup <ArrowUpRight size={16} />
          </Link>
        </div>
        <div className="content-permission">
          <ShieldCheck size={18} />
          <div>
            <strong>
              {archived
                ? "This profile is archived"
                : "Shared only with permission"}
            </strong>
            <p>
              {archived
                ? "Restore the profile before connecting a new device. No content syncing is active."
                : "Permissions are managed on the child’s device. This page currently displays no device content."}
            </p>
          </div>
        </div>
      </section>
      <section
        className="panel content-details"
        aria-label={`${page.title} availability`}
      >
        <div>
          <Icon size={19} />
          <h3>{page.scope}</h3>
          <p>{page.detail}</p>
        </div>
        <div>
          <Smartphone size={19} />
          <h3>{page.permission}</h3>
          <p>
            {page.availability}. The dashboard will show permission and sync
            status once the companion supports this feature.
          </p>
        </div>
      </section>
    </div>
  );
}
