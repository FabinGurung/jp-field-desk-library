"use strict";
(() => {
 const $=id=>document.getElementById(id), filters=[...document.querySelectorAll("[data-group]")];
 const states={PUBLISHED_CATALOGUE:"Available",RESTRICTED_NOT_CONNECTED:"Private records",ROLLOUT_UNVERIFIED:"Not yet in use",DERIVED_REFERENCE:"Earlier records",INTAKE_PENDING:"Not yet listed",EXTERNAL_OWNER_LINKED:"Open other website"};
 let sources=[],group="all",selected=null;
 const descriptions={
  PUBLISHED_CATALOGUE:["Where it is","Original Google Drive project files and the Project Resources Sheet","Before using","Confirm the latest approved drawing revision"],
  RESTRICTED_NOT_CONNECTED:["Where it is","Original restricted Fishtail worker workbooks","Before using","Worker-level data requires staff access"],
  ROLLOUT_UNVERIFIED:["Where it is","Existing worker Sheets and preserved older copies","Before using","Confirm the working workbook with payroll staff"],
  DERIVED_REFERENCE:["Where it is","Earlier wage records and separately available historical payments","Before using","Historical figures are not final payroll"],
  INTAKE_PENDING:["Where it is","The original field or office source, if available","Before using","Confirm which current register should be used"],
  EXTERNAL_OWNER_LINKED:["Where it is","Cost Estimation and original bill/receipt folders","Before using","Confirm the payment or claim status with Finance"]
 };
 const element=(tag,value,cls)=>{const e=document.createElement(tag);e.textContent=value;if(cls)e.className=cls;return e;};
 function show(s){const out=$("details");out.replaceChildren(element("h3",s.name),element("p",states[s.status],"status-detail"));
  if(Array.isArray(s.public_links)&&s.public_links.length){
   const nav=element("nav","","source-actions");nav.setAttribute("aria-label","Open reviewed owner pages");
   for(const link of s.public_links){
    if(!/^https:\/\/fabingurung\.github\.io\/jp-estimating-and-boq\/(?:finance\.html|memory-posters\.html|source-sheets\.html)(?:#[A-Za-z0-9-]+)?$/.test(link.url||""))continue;
    const a=element("a",link.label+" ↗");a.href=link.url;a.target="_blank";a.rel="noopener noreferrer";nav.append(a);
   }
   if(nav.childElementCount)out.append(nav);
  }
  const desc=descriptions[s.status]||["Where it is","Original project or company records","Before using","Confirm with the record owner"];for(let i=0;i<desc.length;i+=2)out.append(element("h4",desc[i]),element("p",desc[i+1]));
 }
 function render(){const q=$("search").value.trim().toLowerCase();
  const visible=sources.filter(s=>(group==="all"||s.group===group)&&[s.name,s.authority,s.custody,s.limit,s.integration].some(x=>x.toLowerCase().includes(q)));
  $("count").textContent=visible.length+" subjects found";
  const cards=visible.map(s=>{const b=element("button","","record");b.type="button";b.setAttribute("aria-pressed",String(s.id===selected));
   b.append(element("span",states[s.status],"status"),element("strong",s.name));
   b.addEventListener("click",()=>{selected=s.id;show(s);render();});return b;});
  $("sources").replaceChildren(...(cards.length?cards:[element("p","No matching records.","empty")]));
 }
 filters.forEach(b=>b.addEventListener("click",()=>{group=b.dataset.group;filters.forEach(x=>x.setAttribute("aria-pressed",String(b===x)));render();}));
 $("search").addEventListener("input",render);
 fetch("./source-custody.json",{cache:"no-store"}).then(r=>{if(!r.ok)throw Error();return r.json();}).then(data=>{
  if(data.schema_version!=="1.1.0"||data.live_worker_sync!==false||data.authenticated_private_payroll_reads!==true||data.historical_clean_payment_publication!==true||
   !Array.isArray(data.subjects)||data.subjects.some(s=>!states[s.status]))throw Error();
  sources=data.subjects;const age=Math.floor((Date.now()-new Date(data.as_of_npt+"T00:00:00+05:45").getTime())/86400000);
  $("audited").textContent=age>30?"Some information may need updating.":"Last checked: "+data.as_of_npt;
  const humanSystems={"Cost Estimation":"Supplier and contractor bills, cost calculations, and project payments","Scheduling and Resources":"Staffing and planned work resources","Communication, Map and Progress":"Site progress summaries and project maps"};
  const cons=data.consumers.map(c=>{const el=element("div","","consumer-card");el.append(element("strong",c.system),element("p",humanSystems[c.system]||"Related project information"));return el;});
  $("consumers").replaceChildren(...cons);
  selected=sources[0]?.id||null;if(sources[0])show(sources[0]);render();
 }).catch(()=>{$("count").textContent="Directory unavailable";$("sources").replaceChildren(element("p","The records are temporarily unavailable.","empty"));});
})();
// Current public document readback only. Never read private payroll in browser JS.
fetch("./catalog.json",{cache:"no-store"}).then(r=>{if(!r.ok)throw Error("unavailable");return r.json()}).then(d=>{
  const target=document.getElementById("live-catalogue-readback");
  if(target)target.textContent="Document list updated: "+(d.verified_on_npt||"date unavailable")+". Historical payment records are shown separately; other worker records remain private.";
}).catch(()=>{const target=document.getElementById("live-catalogue-readback");if(target)target.textContent="The document list cannot be refreshed right now.";});
