"use strict";
(() => {
 const $=id=>document.getElementById(id);
 const make=(tag,value,cls)=>{const el=document.createElement(tag);if(value!==null)el.textContent=value;if(cls)el.className=cls;return el};
 const put=(parent,tag,value,cls)=>{const el=make(tag,value,cls);parent.append(el);return el};
 const valid=/^https:\/\/docs\.google\.com\/document\/d\/[A-Za-z0-9_-]{15,100}\/edit$/;
 let rows=[];
 const mode=new URLSearchParams(location.search).get("view")==="person"?"person":"project";
 let personLoaded=false, people=[], assignments=[];
 const initialPerson=new URLSearchParams(location.search).get("person")||"";
 const docLink=(card,label,url)=>{const a=put(card,"a",label,"intake-open");a.href=url;a.target="_blank";a.rel="noopener noreferrer";};
 function selectPerson(name){
   const p=people.find(x=>x.name===name);
   const panel=$("person-project-panel");panel.hidden=!p;
   if(!p)return;
   const u=new URL(location.href);u.searchParams.set("person",name);history.replaceState(null,"",u);
   document.querySelectorAll(".person-selector").forEach(b=>b.setAttribute("aria-pressed",String(b.dataset.name===name)));
   $("selected-person-name").textContent=name+" — journals";
   const root=$("person-project-grid");root.replaceChildren();
   const general=put(root,"article",null,"intake-card");put(general,"span","GENERAL","intake-id");put(general,"h2","General personal journal");put(general,"p","Common expenses, attendance, income or instructions not tied to a project.");docLink(general,"Open general intake ↗",p.url);
   const list=assignments.filter(x=>x.name===name);
   for(const x of list){const card=put(root,"article",null,"intake-card");put(card,"span","PROJECT JOURNAL","intake-id");put(card,"h2",x.project_name);put(card,"p","Permanent project-specific intake");docLink(card,"Open project intake ↗",x.url);}
   $("person-project-status").textContent=list.length+" registered project journals, plus general intake. If the live project directory is unavailable, project links are withheld.";
 }
 function showMode(mode){
   const byPerson=mode==="person";
   $("project-intake-section").hidden=byPerson;$("person-intake-section").hidden=!byPerson;
   $("by-project").setAttribute("aria-pressed",String(!byPerson));$("by-person").setAttribute("aria-pressed",String(byPerson));
   const url=new URL(location.href);if(byPerson)url.searchParams.set("view","person");else {url.searchParams.delete("view");url.searchParams.delete("person");}history.replaceState(null,"",url);
   if(byPerson&&!personLoaded){personLoaded=true;
     const load=path=>fetch(path,{cache:"no-store"}).then(r=>{if(!r.ok)throw Error("Directory unavailable");return r.json()});
     Promise.all([load("./person-intake.json"),load("./person-project-intake.json")]).then(([data,pp])=>{
       if(data.schema_version!=="1.0.0"||data.access!=="DRIVE_PERMISSION_REQUIRED"||data.contents_published!==false||!Array.isArray(data.people)||data.people.some(p=>!valid.test(p.url)||typeof p.name!=="string"))throw Error("Invalid person directory");
       if(pp.schema_version!=="1.0.0"||pp.access!=="DRIVE_PERMISSION_REQUIRED"||pp.contents_published!==false||!Array.isArray(pp.assignments)||pp.assignments.some(p=>!valid.test(p.url)||typeof p.project_name!=="string"||!data.people.some(q=>q.name===p.name)))throw Error("Invalid person-project directory");
       people=data.people;assignments=pp.assignments;
       const root=$("person-intake-grid");root.replaceChildren();
       for(const p of people){const card=put(root,"article",null,"intake-card");put(card,"span","PERSONAL JOURNALS","intake-id");put(card,"h2",p.name);put(card,"p",assignments.filter(x=>x.name===p.name).length+" project journals + general");const b=put(card,"button","Select person","intake-open person-selector");b.type="button";b.dataset.name=p.name;b.setAttribute("aria-pressed","false");b.addEventListener("click",()=>selectPerson(p.name));}
       $("person-intake-status").textContent=people.length+" registered people. Select a person to browse journals.";
       if(initialPerson)selectPerson(initialPerson);
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
   for(const p of filtered){const card=put(root,"article",null,"intake-card");put(card,"span","PROJECT JOURNAL","intake-id");put(card,"h2",p.name);put(card,"p",p.company);put(card,"p","Permanent Google Doc · sign-in required");
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