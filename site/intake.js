"use strict";
(() => {
 const $=id=>document.getElementById(id);
 const make=(tag,value,cls)=>{const el=document.createElement(tag);if(value!==null)el.textContent=value;if(cls)el.className=cls;return el};
 const put=(parent,tag,value,cls)=>{const el=make(tag,value,cls);parent.append(el);return el};
 const valid=/^https:\/\/docs\.google\.com\/document\/d\/[A-Za-z0-9_-]{15,100}\/edit$/;
 let rows=[];
 const mode=new URLSearchParams(location.search).get("view")==="person"?"person":"project";
 let personLoaded=false;
 function showMode(mode){
   const byPerson=mode==="person";
   $("project-intake-section").hidden=byPerson;$("person-intake-section").hidden=!byPerson;
   $("by-project").setAttribute("aria-pressed",String(!byPerson));$("by-person").setAttribute("aria-pressed",String(byPerson));
   const url=new URL(location.href);if(byPerson)url.searchParams.set("view","person");else url.searchParams.delete("view");history.replaceState(null,"",url);
   if(byPerson&&!personLoaded){personLoaded=true;
     fetch("./person-intake.json",{cache:"no-store"}).then(r=>{if(!r.ok)throw Error("Person directory unavailable");return r.json()}).then(data=>{
       if(data.schema_version!=="1.0.0"||data.access!=="DRIVE_PERMISSION_REQUIRED"||data.contents_published!==false||!Array.isArray(data.people)||data.people.some(p=>!valid.test(p.url)||typeof p.name!=="string"))throw Error("Invalid person directory");
       const root=$("person-intake-grid");root.replaceChildren();
       for(const p of data.people){const card=put(root,"article",null,"intake-card");put(card,"span","PERSONAL JOURNAL","intake-id");put(card,"h2",p.name);put(card,"p","Permanent Google Doc · sign-in required");const a=put(card,"a","Open personal intake ↗","intake-open");a.href=p.url;a.target="_blank";a.rel="noopener noreferrer";}
       $("person-intake-status").textContent=data.people.length+" registered personal journals. Contents remain in Google Drive.";
     }).catch(()=>{personLoaded=false;$("person-intake-status").textContent="Person directory unavailable. Use the authorized Drive folder.";});
   }
 }
 $("by-project").addEventListener("click",()=>showMode("project"));
 $("by-person").addEventListener("click",()=>showMode("person"));
 showMode(mode);
 function render(){
   const q=$("intake-search").value.trim().toLowerCase(),company=$("intake-company").value;
   const filtered=rows.filter(p=>(!company||p.company===company)&&[p.name,p.project_id,p.company].join(" ").toLowerCase().includes(q));
   const root=$("intake-grid");root.replaceChildren();
   for(const p of filtered){const card=put(root,"article",null,"intake-card");put(card,"span",p.project_id,"intake-id");put(card,"h2",p.name);put(card,"p",p.company);put(card,"p","Permanent Google Doc · sign-in required");
     const a=put(card,"a","Open intake Doc ↗","intake-open");a.href=p.url;a.target="_blank";a.rel="noopener noreferrer";}
   $("intake-status").textContent=filtered.length+" of "+rows.length+" registered intake links. Document content is not published.";
 }
 fetch("./project-intake.json",{cache:"no-store"}).then(r=>{if(!r.ok)throw Error("Intake directory unavailable");return r.json()}).then(data=>{
   if(data.schema_version!=="1.0.0"||!Array.isArray(data.projects)||data.projects.some(p=>!valid.test(p.url)))throw Error("Invalid intake directory");
   rows=data.projects;for(const c of [...new Set(rows.map(p=>p.company))].sort()){const o=put($("intake-company"),"option",c);o.value=c;}
   $("intake-search").value=new URLSearchParams(location.search).get("project")||"";
   $("intake-search").addEventListener("input",render);$("intake-company").addEventListener("change",render);
   render();if(!rows.length)$("intake-status").textContent="No links are available from the verified source. The Drive folder remains available to authorized users.";
 }).catch(()=>{$("intake-status").textContent="Intake directory unavailable. Open the permission-controlled Drive folder above.";});
})();