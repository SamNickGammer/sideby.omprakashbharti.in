// Synthetic local QA fixture. Credentials stay in ignored .test-android.json.
import { randomUUID } from 'node:crypto';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import assert from 'node:assert/strict';
const base='http://127.0.0.1:3000', file='.test-android.json';
const action=process.argv[2] || 'status';
let state=existsSync(file)?JSON.parse(readFileSync(file,'utf8')):{};
async function request(path,method='GET',body) {
 const r=await fetch(base+path,{method,headers:{Origin:base,'Content-Type':'application/json',Cookie:state.cookie||''},body:body===undefined?undefined:JSON.stringify(body)});
 if(r.headers.getSetCookie().length)state.cookie=r.headers.getSetCookie().map(c=>c.split(';')[0]).join('; ');
 assert.ok(r.ok,`Fixture request ${method} ${path} failed: ${r.status}`);
 return r.json();
}
function save() { writeFileSync(file,JSON.stringify(state),{mode:0o600}); }
if(action==='create') {
 assert.ok(!state.userId,'Existing fixture must be cleaned and its local file removed before creating another.');
 state.email=`sideby-test-${randomUUID().slice(0,8)}-a@example.com`; state.password=randomUUID()+'Aa1!';
 const result=await request('/api/auth/sign-up/email','POST',{name:'Sideby Test a',email:state.email,password:state.password});state.userId=result.user.id;save();
 const users=existsSync('.test-users.json')?JSON.parse(readFileSync('.test-users.json','utf8')):[];users.push(state.userId);writeFileSync('.test-users.json',JSON.stringify(users),{mode:0o600});
 await request('/api/family','POST',{name:'Android test family'});
 const child=await request('/api/children','POST',{name:'Demo child',age:12,color:'mint'});state.childId=child.id;
 state.offer=await request(`/api/children/${state.childId}/pairing`,'POST');save();
 console.log('PASS synthetic parent, child and pairing offer created; private fixture saved.');
} else {
 assert.ok(state.childId,'Create the synthetic fixture first.');
 const path=`/api/children/${state.childId}`;
 if(action==='offer') { state.offer=await request(path+'/pairing','POST'); save(); console.log('PASS fresh offer saved.'); }
 else if(action==='approve') { await request(path+'/pairing','PATCH',{id:state.offer.id,action:'approve'});console.log('PASS parent approval accepted.'); }
 else if(action==='revoke') { const {devices}=await request(path+'/devices');for(const d of devices.filter(d=>!d.revoked_at))await request(path+'/devices/'+d.id,'DELETE');console.log('PASS synthetic devices revoked.'); }
 else if(action==='status') { const {devices,pairing}=await request(path+'/devices');console.log(JSON.stringify({pairing:pairing?.status,devices:devices.map(d=>({name:d.name,lastSeen:d.last_seen_at,revoked:!!d.revoked_at}))})); }
 else throw new Error('Unknown fixture action');
}
