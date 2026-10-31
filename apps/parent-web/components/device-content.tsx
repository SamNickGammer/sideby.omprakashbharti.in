"use client";
import Link from "next/link";
import { useCallback,useEffect,useState } from "react";
import { RefreshCw,ShieldCheck,Search,Trash2,Smartphone } from "lucide-react";
import type { ContentKind,ContentDevice,ContentItem } from "../lib/content-contract";
const descriptions:Record<ContentKind,string>={
 apps:"Launcher-visible apps, shared from this device. Android may hide system or work-profile packages.",
 contacts:"Contact names and phone numbers shared with permission. No contact photos, notes or addresses.",
 notifications:"Selected-source notification previews from the last 24 hours. Sensitive content is withheld; these are not complete conversations.",
 sms:"Supported SMS records from the last seven days. Android may refuse access even after installing an APK. Sensitive code-like messages are withheld.",
 calls:"Supported call records from the last seven days. No call recordings or audio.",
 photos:"Only images explicitly selected and shared on the device. Sharing a new selection replaces the previous one."
};
const labels:Record<ContentKind,string>={apps:"Installed apps",contacts:"Contacts",notifications:"Notification previews",sms:"SMS messages",calls:"Call history",photos:"Shared photos"};
const string=(item:ContentItem,key:string)=>String(item[key]??"");
export default function DeviceContent({childId,userId,kind}:{childId:string;userId:string;kind:ContentKind}) {
 const [devices,setDevices]=useState<ContentDevice[]|null>(null),[selected,setSelected]=useState("");
 const [error,setError]=useState(""),[loading,setLoading]=useState(false),[query,setQuery]=useState(""),[source,setSource]=useState("all"),[limit,setLimit]=useState(50),[now,setNow]=useState(Date.now());
 const refresh=useCallback(async()=>{
  setLoading(true);setNow(Date.now());
  try {const r=await fetch(`/api/children/${childId}/content/${kind}`,{headers:{"x-sideby-user":userId},signal:AbortSignal.timeout(20000)});
   if(r.status===401){window.location.assign("/auth/sign-in");return;}
   const body=await r.json();if(!r.ok)throw new Error(body.error||"Could not load shared data.");setDevices(body.devices);setError("");
  }catch(e){setError(e instanceof Error?e.message:"Could not load shared data.");}finally{setLoading(false);}
 },[childId,userId,kind]);
 useEffect(()=>{void refresh();const timer=setInterval(()=>{setNow(Date.now());if(!document.hidden)void refresh()},15000);return()=>clearInterval(timer)},[refresh]);
 const device=devices?.find(d=>d.id===selected)||devices?.find(d=>!d.inactive)||devices?.[0],report=device?.report;
 const all=report?.status==="ready"?report.items:[];
 const sources=[...new Map(all.filter(i=>i.package).map(i=>[string(i,"package"),string(i,"app")])).entries()];
 const items=all.filter(i=>(source==="all"||i.package===source)&&Object.values(i).join(" ").toLowerCase().includes(query.toLowerCase()));
 const stale=report&&now-Date.parse(report.generated_at)>120000;
 async function clear(){
  if(!device||!window.confirm("Remove this device’s shared snapshot? Original phone data stays unchanged. If sharing remains enabled, a later device sync may send it again."))return;
  setLoading(true);
  try{const r=await fetch(`/api/children/${childId}/content/${kind}?device=${device.id}`,{method:"DELETE",headers:{"x-sideby-user":userId}});if(!r.ok)throw new Error("Could not clear the shared snapshot.");await refresh()}catch(e){setError(e instanceof Error?e.message:"Could not clear data.")}finally{setLoading(false)}
 }
 const empty=!devices?"Loading shared data…":!device?"Connect a device first.":device.inactive?"This device connection is inactive.":!report?"No report received yet.":report.status==="disabled"?"Sharing is off.":report.status==="no_permission"?"Android access is needed.":report.status==="unavailable"?"This device could not provide the data.":all.length?"No matching records.":"No records in this snapshot.";
 return <div className="shared-content">
  <div className="wellbeing-toolbar"><label>Device<select aria-label="Content device" value={device?.id||""} onChange={e=>{setSelected(e.target.value);setSource("all");setLimit(50)}} disabled={!devices?.length}>{!devices?.length&&<option>No device</option>}{devices?.map(d=><option key={d.id} value={d.id}>{d.name}{d.inactive?" · inactive":""}</option>)}</select></label><button className="secondary" disabled={loading} onClick={()=>void refresh()}><RefreshCw size={16}/>{loading?"Refreshing…":"Refresh dashboard"}</button></div>
  {error&&<p role="alert" className="wellbeing-notice">{error} Any visible data is the last successfully loaded report.</p>}
  {stale&&<p className="wellbeing-notice">Earlier snapshot — not live. Open Sideby Connect → Manage data sharing and sync to update.</p>}
  <section className="panel shared-panel"><div className="section-heading"><div><h2>{labels[kind]}</h2><p className="muted">{descriptions[kind]}</p></div><span className="status neutral">{all.length} {all.length===1?"record":"records"}</span></div>
   {!!all.length&&<div className="shared-tools">{kind!=="photos"&&<label className="shared-search"><Search size={17}/><input aria-label={`Search ${labels[kind]}`} placeholder="Search shared records" value={query} onChange={e=>{setQuery(e.target.value);setLimit(50)}}/></label>}{kind==="notifications"&&<select aria-label="Notification source" value={source} onChange={e=>{setSource(e.target.value);setLimit(50)}}><option value="all">All shared apps</option>{sources.map(([pkg,name])=><option key={pkg} value={pkg}>{name}</option>)}</select>}<button className="text-button" disabled={loading} onClick={()=>void clear()}><Trash2 size={16}/>Clear shared data</button></div>}
   {!items.length?<div className="child-empty-body"><Smartphone size={30}/><h3>{empty}</h3><p>Sharing is controlled on the child device. Open Sideby Connect → Manage data sharing to review access, choose sources and sync.</p><Link className="secondary" href={`/dashboard/children/${childId}/devices`}>Device setup</Link></div>:
   kind==="photos"?<div className="shared-photo-grid">{items.map((item,n)=><a key={string(item,"id")} href={`/api/children/${childId}/photos/${item.id}`} target="_blank" rel="noreferrer"><img src={`/api/children/${childId}/photos/${item.id}`} alt={`Explicitly shared photo ${n+1}`} loading="lazy"/><span>Open shared photo {n+1}</span></a>)}</div>:
   <ul className="shared-records">{items.slice(0,limit).map(item=><li key={string(item,"id")}>
    <span className="wellbeing-app-icon" aria-hidden="true">{String(item.name||item.app||item.address||item.number||"•").slice(0,1).toUpperCase()}</span>
    <div className="shared-record-copy">
     <strong>{String(item.name||item.title||item.address||item.number||"Unnamed record")}</strong>
     {kind==="apps"&&<><small>{item.id}</small><p>Version {item.version||"unknown"} · {item.system?"System app":"Installed app"}</p></>}
     {kind==="contacts"&&<p>{item.number||"No phone number"}</p>}
     {kind==="notifications"&&<><small>{item.app} · {item.package}</small><p>{item.text||"No preview text available"}</p>{item.redacted&&<span className="status neutral">Content withheld</span>}</>}
     {kind==="sms"&&<><small>{item.direction}</small><p>{item.body||"No text"}</p></>}
     {kind==="calls"&&<p>{item.type} · {item.duration}s</p>}
    </div>{item.time&&<time className="shared-time" dateTime={string(item,"time")}>{new Date(string(item,"time")).toLocaleString()}</time>}
   </li>)}</ul>}
   {items.length>limit&&<button className="secondary" onClick={()=>setLimit(n=>n+50)}>Show more records</button>}
   {!!report?.omitted&&<p className="muted">{report.omitted} additional records were outside this bounded snapshot.</p>}
  </section>
  <section className="panel wellbeing-footnote"><ShieldCheck size={20}/><div><strong>Shared with awareness</strong><p>Device permission and sharing opt-in are separate. Stop sharing on the device to prevent future uploads. Offline changes reach the dashboard after reconnection.</p>{report&&<p>Sampled: {new Date(report.generated_at).toLocaleString()}<br/>Received: {new Date(report.received_at).toLocaleString()}</p>}</div></section>
 </div>;
}
export function SharedMessages({childId,userId}:{childId:string;userId:string}) {
 const [mode,setMode]=useState<"sms"|"notifications">("sms");
 return <div><div className="message-modes" role="group" aria-label="Message type"><button aria-pressed={mode==="sms"} onClick={()=>setMode("sms")}>SMS</button><button aria-pressed={mode==="notifications"} onClick={()=>setMode("notifications")}>Social notifications</button></div><DeviceContent key={mode} childId={childId} userId={userId} kind={mode}/></div>;
}
