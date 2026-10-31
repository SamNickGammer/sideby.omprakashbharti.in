"use client";
import Link from "next/link";
import { useCallback,useEffect,useState } from "react";
import { Activity,RefreshCw,Smartphone,ShieldCheck } from "lucide-react";
import {duration,localDay,type UsageDevice} from "../lib/device-usage";
export default function DeviceUsage({childId,userId}:{childId:string;userId:string}) {
  const [devices,setDevices]=useState<UsageDevice[]|null>(null);
  const [selected,setSelected]=useState("");
  const [error,setError]=useState("");
  const [loading,setLoading]=useState(false);
  const [now,setNow]=useState(Date.now());
  const refresh=useCallback(async(signal?:AbortSignal)=>{
    setLoading(true);setNow(Date.now());
    try {
      const r=await fetch(`/api/children/${childId}/usage`,{headers:{"x-sideby-user":userId},signal});
      if(r.status===401){window.location.assign("/auth/sign-in");return;}
      const body=await r.json();
      if(!r.ok)throw new Error(body.error || "Could not refresh usage.");
      setDevices(body.devices);setError("");
    }catch(e){if(!signal?.aborted)setError(e instanceof Error?e.message:"Could not refresh usage.");}
    finally{if(!signal?.aborted)setLoading(false);}
  },[childId,userId]);
  useEffect(()=>{
    const c=new AbortController();
    void refresh(c.signal);
    const timer=setInterval(()=>{setNow(Date.now());if(!document.hidden)void refresh(c.signal);},15000);
    return ()=>{c.abort();clearInterval(timer);};
  },[refresh]);
  const device=devices?.find(d=>d.id===selected) || devices?.find(d=>!d.inactive) || devices?.[0];
  const report=device?.report;
  const apps=report?.status==="ready"?[...report.apps].sort((a,b)=>b.foreground_ms-a.foreground_ms):[];
  const total=apps.reduce((sum,a)=>sum+a.foreground_ms,0);
  const stale=!!report && (!device?.received_at || now-Date.parse(device.received_at)>120000 || now-Date.parse(report.generated_at)>120000 || localDay(now,report.timezone)!==report.day);
  const emptyTitle=!devices ? "Loading device usage…" : !devices.length ? "Connect their first device." : device?.inactive ? "This connection is inactive." : !report ? "No usage report yet." : report.status==="disabled" ? "Usage sharing is off." : report.status==="no_permission" ? "Usage Access is needed." : report.status==="unavailable" ? "Android could not read usage." : "No app activity in this report.";
  return <div className="wellbeing">
    <div className="wellbeing-toolbar">
      <label>Device<select aria-label="Usage device" value={device?.id || ""} onChange={e=>setSelected(e.target.value)} disabled={!devices?.length}>
        {!devices?.length && <option value="">No device available</option>}
        {devices?.map(d=><option key={d.id} value={d.id}>{d.name}{d.inactive?" · inactive":""}</option>)}
      </select></label>
      <button className="secondary" onClick={()=>void refresh()} disabled={loading}><RefreshCw size={16}/>{loading?"Refreshing…":"Refresh dashboard"}</button>
    </div>
    {error && <p className="wellbeing-notice" role="alert">Could not refresh: {error} Any report below is the last successfully loaded data.</p>}
    {stale && <p className="wellbeing-notice" role="status">Earlier report — not live. Open Sideby Connect and check in to update it.</p>}
    {report && <div className="wellbeing-period"><span>{report.day} · {report.timezone}</span><span>{stale?"Last reported":"Device report"}</span></div>}
    {report?.status==="ready" && !device?.inactive && <section className="panel wellbeing-summary">
      <span className="wellbeing-symbol"><Activity size={27}/></span><div><p className="eyebrow">{report.omitted_apps?"SHOWN APPS":"TODAY’S APPS"} · FOREGROUND TIME</p><h2>{duration(total)}</h2><p>{apps.length} apps with recorded activity · estimated from Android events</p></div>
    </section>}
    {apps.length && !device?.inactive ? <section className="panel">
      <div className="section-heading"><h2>Time by app</h2><span className="status neutral">{stale?"Historical sample":"Device-reported"}</span></div>
      <ul className="wellbeing-apps">{apps.map(app=><li key={app.package_name}>
        <span className="wellbeing-app-icon" aria-hidden="true">{app.name[0]?.toUpperCase()}</span>
        <div className="wellbeing-app-info"><strong>{app.name}</strong><small>{app.package_name}</small><div className="wellbeing-bar" aria-hidden="true"><i style={{width:`${total?app.foreground_ms/total*100:0}%`}}/></div></div>
        <span className="wellbeing-time">{duration(app.foreground_ms)}</span>
      </li>)}</ul>
      {!!report?.omitted_apps && <p className="muted">Showing the 100 most-used apps. {report.omitted_apps} additional apps are omitted from this total.</p>}
    </section> : <section className="panel usage-empty"><Smartphone size={30}/><h2>{emptyTitle}</h2><p>{device?.inactive?"Reconnect or restore this profile before sharing new usage.":report?.status==="ready"?"Zero recorded activity is different from missing permission. Use an app, then return to Sideby Connect to check in.":"On the child device, open Sideby Connect → Permissions on this device. Allow Usage Access, enable usage sharing, and refresh. Older companion versions need an update."}</p><Link className="text-button" href={`/dashboard/children/${childId}/devices`}>Device setup</Link></section>}
    <section className="panel wellbeing-footnote"><ShieldCheck size={20}/><div>
      <strong>Shared with awareness</strong>
      <p>Updates arrive while Sideby Connect is open. Refreshing this page does not wake the device. App foreground time can overlap in multi-window mode and may differ from Android’s screen-time total. This is activity, not a complete installed-app list.</p>
      {report && <p>Sampled on device: {new Date(report.generated_at).toLocaleString()}<br/>Received by server: {device?.received_at?new Date(device.received_at).toLocaleString():"Unknown"}</p>}
    </div></section>
  </div>;
}
