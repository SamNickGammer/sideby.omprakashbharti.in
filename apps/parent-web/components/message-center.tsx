"use client";
import Link from "next/link";
import { useState } from "react";
import {
  Bell,
  MessageSquare,
  ShieldCheck,
  ArrowUpRight,
  Smartphone,
} from "lucide-react";
const apps = [
  "All apps",
  "WhatsApp",
  "Telegram",
  "Instagram",
  "Facebook",
  "Other apps",
];
export default function MessageCenter({
  deviceHref,
  archived,
}: {
  deviceHref: string;
  archived: boolean;
}) {
  const [mode, setMode] = useState<"sms" | "social">("sms");
  const [app, setApp] = useState("All apps");
  const social = mode === "social",
    Icon = social ? Bell : MessageSquare;
  const label =
    app === "All apps"
      ? "social apps"
      : app === "Other apps"
        ? "other apps"
        : app;
  return (
    <div className="content-page">
      <section className="panel child-data-empty">
        <div className="section-heading">
          <h2>Messages</h2>
          <span className="status neutral">Sync not available yet</span>
        </div>
        <div className="message-modes" role="group" aria-label="Message type">
          <button
            type="button"
            aria-pressed={!social}
            onClick={() => setMode("sms")}
          >
            <MessageSquare size={17} />
            SMS
          </button>
          <button
            type="button"
            aria-pressed={social}
            onClick={() => setMode("social")}
          >
            <Bell size={17} />
            Social notifications
          </button>
        </div>
        {social && (
          <div className="social-filter-bar">
            <p>FILTER BY APP</p>
            <div
              className="social-filters"
              role="group"
              aria-label="Filter social notifications by app"
            >
              {apps.map((name) => (
                <button
                  type="button"
                  key={name}
                  aria-pressed={app === name}
                  onClick={() => setApp(name)}
                >
                  {name}
                </button>
              ))}
            </div>
          </div>
        )}
        <div
          className="child-empty-body content-empty"
          role="status"
          aria-live="polite"
        >
          <span className="empty-icon">
            <Icon size={30} />
          </span>
          <h2>
            {social
              ? app === "All apps"
                ? "Social updates, in one place."
                : `${app} notifications`
              : "A space for supported SMS."}
          </h2>
          <p>
            {social
              ? `Notifications shared from ${label} will appear here once the Android companion supports syncing and notification access is enabled. No notifications have been received.`
              : "SMS messages will appear here once supported Android access is available and permission is granted. No SMS messages have been received."}
          </p>
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
                : social
                  ? "Notification previews, not full conversations"
                  : "SMS permission is separate"}
            </strong>
            <p>
              {archived
                ? "Restore the profile before connecting a new device. No content syncing is active."
                : social
                  ? "Only content exposed by a notification can be shared. Hidden text, earlier chat history and messages without notifications are not available here."
                  : "Pairing and notification access do not grant SMS access. Android support and permission are required separately."}
            </p>
          </div>
        </div>
      </section>
      <section
        className="panel content-details"
        aria-label="Message sharing availability"
      >
        <div>
          <Icon size={19} />
          <h3>{social ? "Grouped by source app" : "Supported SMS only"}</h3>
          <p>
            {social
              ? "Choose an app to focus the view. Other apps covers notification sources outside the named filters. These filters currently change the empty view; no device content is being synced."
              : "SMS support remains subject to Android and distribution requirements. Private messaging-app conversations are not included."}
          </p>
        </div>
        <div>
          <Smartphone size={19} />
          <h3>
            {social ? "Notification access on device" : "SMS access on device"}
          </h3>
          <p>
            {social
              ? "Sideby Connect will explain notification sharing and its permission on the child’s phone. Permission and sync status will appear after integration."
              : "The Android companion and SMS integration are still pending. Contacts have their own page and separate permission."}
          </p>
        </div>
      </section>
    </div>
  );
}
