"use client";
import { useId, useRef } from "react";
import { ShieldCheck, ChevronRight, X } from "lucide-react";
import { permissionLabels, permissionStatusLabels, type PermissionKey, type PermissionReport } from "../lib/device-permissions";

type Props = { name: string; report: PermissionReport | null; updatedAt: string | null; now: number; inactive: boolean };
export default function DevicePermissions({ name, report, updatedAt, now, inactive }: Props) {
  const dialog = useRef<HTMLDialogElement>(null);
  const title = useId();
  const description = useId();
  const age = updatedAt ? now - Date.parse(updatedAt) : Infinity;
  const fresh = !!report && age >= 0 && age < 120000 && !inactive;
  const entries = Object.entries(permissionLabels) as [PermissionKey, string][];
  const granted = report ? entries.filter(([key]) => report.permissions[key] === "granted").length : 0;
  const unavailable = report ? entries.filter(([key]) => report.permissions[key] === "not_available").length : 0;
  const attention = report ? entries.filter(([key]) => ["not_granted", "session_required"].includes(report.permissions[key])).length : 0;
  const summary = !report ? "Waiting for a permission report" : !fresh ? "Last report · not current" : [`${granted} granted`, attention ? `${attention} need attention` : "", unavailable ? `${unavailable} not available` : ""].filter(Boolean).join(" · ");
  return <>
    <button className="permission-summary" aria-haspopup="dialog" onClick={() => dialog.current?.showModal()}>
      <ShieldCheck size={20} aria-hidden="true" />
      <span><strong>Permissions</strong><small>{summary}</small>
        <span className="permission-dots" aria-hidden="true">{entries.map(([key]) => {
          const state = report?.permissions[key];
          return <i key={key} className={`permission-dot ${fresh && state === "granted" ? "granted" : fresh && (state === "not_granted" || state === "session_required") ? "attention" : "neutral"}`} />;
        })}</span>
      </span><ChevronRight size={18} aria-hidden="true" />
    </button>
    <dialog ref={dialog} className="permission-dialog" aria-labelledby={title} aria-describedby={description}>
      <div className="dialog-header"><h2 id={title}>Device permissions</h2>
        <button type="button" className="icon-button" aria-label="Close permissions" onClick={() => dialog.current?.close()}><X size={20} /></button>
      </div>
      <p className="permission-device-name">{name}</p>
      <p id={description} className="muted">These are device-reported permissions, not proof that a feature is sharing data. Permissions are controlled on the device. Open Sideby Connect → Permissions on this device to review access, then refresh and send status.</p>
      <div className="permission-report-info">
        {!report ? "No report yet. Update Sideby Connect and keep it open to check in." : <>
          <strong>{fresh ? "Recent device report" : "Historical report — permissions may have changed"}</strong>
          <span>Received {updatedAt ? new Date(updatedAt).toLocaleString() : "at an unknown time"}</span>
          <span>Sideby Connect {report.app_version} · Android API {report.android_api}</span>
        </>}
      </div>
      <ul className="permission-list">{entries.map(([key, label]) => {
        const state = report?.permissions[key];
        const tone = fresh && state === "granted" ? "granted" : fresh && (state === "not_granted" || state === "session_required") ? "attention" : "neutral";
        return <li key={key}><span>{label}</span><span className={`permission-badge ${tone}`}>
          <i className={`permission-dot ${tone}`} aria-hidden="true" />
          {state ? `${!fresh ? "Last reported: " : ""}${permissionStatusLabels[state]}` : "Not reported"}
        </span></li>;
      })}</ul>
      <p className="permission-help">Usage Access alone does not start sharing. On Sideby Connect 0.3.0 or newer, separately enable usage sharing to see activity in Digital wellbeing. In 0.4.0, Manage data sharing controls installed apps, notifications, contacts, supported SMS/calls and selected photos. Photos use a system picker rather than a broad gallery permission. Unavailable camera/media features cannot be enabled yet.</p>
      <p className="permission-help">Green: granted · Amber: not allowed or session approval needed · Gray: unavailable or unconfirmed. Screen sharing needs approval for each session.</p>
      <button className="secondary" onClick={() => dialog.current?.close()}>Done</button>
    </dialog>
  </>;
}
