"use strict";
(() => {
 const $=id=>document.getElementById(id);
 const node=(tag,body,cls)=>{const e=document.createElement(tag);if(body!==null&&body!==undefined)e.textContent=body;if(cls)e.className=cls;return e};
 const put=(parent,tag,body,cls)=>{const e=node(tag,body,cls);parent.append(e);return e};
 const safeDrive=u=>/^https:\/\/drive\.google\.com\/(?:file\/d\/[A-Za-z0-9_-]+\/view|drive\/folders\/[A-Za-z0-9_-]+)$/.test(u||"");
 const state={projects:[],catalog:null,packets:null,selected:"",company:"",status:"",query:""};
 const saved=new URLSearchParams(location.search).get("project")||"";
 const opts=(input,arr)=>{for(const value of arr){const o=node("option",value);o.value=value;input.append(o)}};
 function link(parent,label,url,category=""){
   const a=put(parent,"a",label,category||"project-link");
   a.href=url;
   if(/^https:\/\//.test(url)){a.target="_blank";a.rel="noopener noreferrer"}
   return a;
 }
 function classify(r){
   const value=[r.document_slot,r.discipline,r.category,r.title].join(" ").toLowerCase();
   const fmt=(r.format||"").toUpperCase();
   if(fmt==="FOLDER")return "Original folders";
   if(/architecture/.test(value))return "Architectural files";
   if(/structur|reinforcement|rebar/.test(value))return "Structural files";
   if(/land|plot|survey|geotech|soil/.test(value))return "Land, survey & geotechnical";
   if(/cost|estimate|boq|quantit|calculat/.test(value))return "Estimates & calculations";
   if(["EDB","E2K","SKP","IFC"].includes(fmt)||/models/.test(value))return "3D models & structural analysis";
   if(/report/.test(value))return "Reports & other PDF";
   return "Other source files";
 }
 const families=["Architectural files","Structural files","Land, survey & geotechnical","3D models & structural analysis","Reports & other PDF","Estimates & calculations","Original folders","Agreements & project packets","Other source files"];
 const resources=p=>state.catalog.resources.filter(r=>r.project_id===p.project_id&&safeDrive(r.url));
 const docs=p=>state.packets.documents.filter(d=>d.project_id===p.project_id&&safeDrive(d.drive_url));
 function details(p){
   state.selected=p.project_id; const pane=$("project-detail-body");pane.replaceChildren();
   put(pane,"p","PROJECT FILES","eyebrow");
   put(pane,"h3",p.name);
   put(pane,"p",(p.status||"Status not verified")+" · "+p.company,"project-meta");
   if(p.verification&&p.verification!=="VERIFIED")put(pane,"p","Some project details still need confirmation.","project-warning");
   const rs=resources(p),ds=docs(p);
   put(pane,"p",rs.length+" finalized file links · "+ds.length+" client documents","project-count-note");
   const grouped={};for(const r of rs)(grouped[classify(r)] ||= []).push(r);
   if(ds.length)grouped["Agreements & project packets"]=ds.map(d=>({title:d.title+" · "+d.version,url:d.drive_url,format:"PDF",approval:d.approval}));
   for(const family of families){
     const section=put(pane,"section",null,"project-family");
     const title=put(section,"h4",family);
     const group=grouped[family]||[];
     put(title,"small",group.length?(" · "+group.length):" · not listed");
     if(group.length){const groupWrap=put(section,"div",null,"source-list");
       for(const r of group){const wrap=put(groupWrap,"div",null,"source-item");
         link(wrap,r.title+" ↗",r.url,"project-source");
         put(wrap,"small",(r.format||"Original")+" · Check approved revision before using");
       }
     }else put(section,"p","No file listed here yet. Ask the document owner about the final issue.","no-file");
   }
   if(p.project_id==="JPENT-ASTAM-2026-01"){
      const c=put(pane,"div",null,"project-owned-actions");
      link(c,"Astam land and buyer research →","./feasibility/");
      put(c,"p","Land purchase is on hold pending review of the original documents.");
   }
   // The drawing repository's public projects.json currently reuses
   // PRJ-000029 for Ramachandra, but canonical A7 assigns it to Basanti.
   // Suppress ambiguous project-ID code searches rather than cross-attach.
   if(p.project_id==="PRJ-000029"){
     const hold=put(pane,"div",null,"project-owned-actions");
     put(hold,"strong","Similar project references — confirmation needed");
     put(hold,"p","Basanti Poudel Baral and Ramachandra Devkota have a conflicting reference in two separate systems. Keep their documents separate until the office confirms the correct assignment.");
     link(hold,"See the correction request ↗","https://github.com/FabinGurung/jp-drawing-coordination/issues/146");
   }else{
     const repoSearch=put(pane,"div",null,"project-owned-actions");
     put(repoSearch,"strong","Find related project drawings and calculations");
     const sourceCodeTargets=[
       ["Drawing Coordination", "jp-drawing-coordination"],
       ["Structural Analysis", "jp-structural-analysis"],
       ["Cost Estimation", "jp-estimating-and-boq"],
       ["Site Operations", "jp-site-operations"]
     ];
     for(const [label,repo] of sourceCodeTargets){
       link(repoSearch,"Look for this project in "+label+" ↗",
         "https://github.com/FabinGurung/"+repo+"/search?q="+encodeURIComponent(p.project_id)+"&type=code");
     }
     put(repoSearch,"p","Results may contain working drafts. The file links above are the ones currently listed by this Library.");
   }
   const u=new URL(location.href);u.searchParams.set("project",p.project_id);history.replaceState(null,"",u);
   document.querySelectorAll(".project-card").forEach(x=>x.setAttribute("aria-pressed",String(x.dataset.project===p.project_id)));
 }
 function render(){
   const projects=state.projects.filter(p=>(!state.company||p.company===state.company)&&(!state.status||p.status===state.status)&&
     [p.project_id,p.name,p.company,p.company_project_code,p.status,p.category].join(" ").toLowerCase().includes(state.query));
   $("project-count").textContent=projects.length+" shown";
   const root=$("project-cards");root.replaceChildren();
   for(const p of projects){
     const btn=put(root,"button",null,"project-card");btn.type="button";btn.setAttribute("role","listitem");btn.dataset.project=p.project_id;
     btn.setAttribute("aria-pressed",String(state.selected===p.project_id));
     const header=put(btn,"div",null,"project-card-heading");
     put(header,"strong",p.name);put(header,"small",p.status||"Project");
     const counts=resources(p).length+docs(p).length;
     put(btn,"span",p.company+" · "+p.status,"project-card-meta");
     put(btn,"span",counts?counts+" available file links":"No files listed yet","project-card-evidence");
     btn.addEventListener("click",()=>details(p));
   }
   if(!projects.length)put(root,"p","No projects match these filters. Change the company or search.", "empty");
 }
 function bind(){
  const company=$("project-company"),statuses=$("project-status"),search=$("project-query");
  opts(company,[...new Set(state.projects.map(p=>p.company))].sort());
  opts(statuses,[...new Set(state.projects.map(p=>p.status))].sort());
  company.addEventListener("change",()=>{state.company=company.value;render()});
  statuses.addEventListener("change",()=>{state.status=statuses.value;render()});
  search.addEventListener("input",()=>{state.query=search.value.toLowerCase().trim();render()});
  $("clear-project-filters").addEventListener("click",()=>{state.company="";state.status="";state.query="";company.value="";statuses.value="";search.value="";render()});
 }
 Promise.all([
  fetch("./projects-directory.json",{cache:"no-store"}).then(r=>{if(!r.ok)throw Error("Project register missing");return r.json()}),
  fetch("./catalog.json",{cache:"no-store"}).then(r=>{if(!r.ok)throw Error("Source catalogue unavailable");return r.json()}),
  fetch("./document-packets.json",{cache:"no-store"}).then(r=>{if(!r.ok)throw Error("Packet register unavailable");return r.json()})
 ]).then(([list,catalog,packets])=>{
   if(list.schema_version!=="1.0.0"||!Array.isArray(list.projects)||catalog.schema_version!=="2.0.0"||packets.schema_version!=="1.0.0")throw Error("Unexpected source version");
   state.catalog=catalog;state.packets=packets;
   const projects=list.projects.slice();
   for(const p of catalog.projects)if(!projects.some(q=>q.project_id===p.project_id)){
     projects.push({project_id:p.project_id,name:p.name,company:p.company,company_project_code:p.company_project_code||"",status:p.project_id.startsWith("JPENT-ASTAM")?"HOLD · feasibility":"Source index only",verification:p.project_id.startsWith("JPENT-ASTAM")?"PRE_PURCHASE_INTAKE_UNVERIFIED":"SOURCE_CATALOGUE",category:""});
   }
   state.projects=projects.sort((a,b)=>a.project_id.localeCompare(b.project_id));
   $("project-total").textContent=list.projects.length;
   $("project-with-files").textContent=state.projects.filter(p=>resources(p).length+docs(p).length>0).length;
   $("source-links").textContent=catalog.resources.length;
   $("project-provenance").textContent="Files open in Google Drive. Confirm the latest approved revision before using any drawing for construction.";
   bind();render();details(state.projects.find(x=>x.project_id===saved)||state.projects[0]);
 }).catch(error=>{
   $("project-provenance").textContent="The project list is temporarily unavailable. Open the Projects & Locations Sheet instead.";
   $("project-count").textContent="Source unavailable";
   $("project-cards").replaceChildren(node("p","See the original Projects & Locations Google Sheet for the maintained record.","empty"));
   console.error("Resource project directory load failed",error.message);
 });
})();
