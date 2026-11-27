"use strict";
(() => {
  const $ = id => document.getElementById(id);
  const make = (tag, value, cls) => {
    const el = document.createElement(tag);
    if (value !== null && value !== undefined) el.textContent = value;
    if (cls) el.className = cls;
    return el;
  };
  const text = (parent, tag, value, cls) => { const child = make(tag, value, cls); parent.append(child); return child; };
  const safeDrive = url => /^https:\/\/drive\.google\.com\/(?:file\/d\/[A-Za-z0-9_-]+\/view|drive\/folders\/[A-Za-z0-9_-]+)$/.test(url || "");
  const state = { data: null, company: "", project: "", selected: "", query: "", facets: {}, facetsProject: "", fileView: "gallery" };
  const params = new URLSearchParams(location.search);
  state.company = params.get("company") || "";
  state.project = params.get("project") || "";

  function syncURL() {
    const u = new URL(location.href);
    for (const key of ["company", "project"]) u.searchParams.delete(key);
    if (state.company) u.searchParams.set("company", state.company);
    if (state.project) u.searchParams.set("project", state.project);
    history.replaceState(null, "", u);
  }
  function setLocation(company = "", project = "") {
    state.company = company;
    state.project = project;
    state.selected = "";
    state.query = "";
    state.facets = {};
    state.facetsProject = "";
    $("library-search").value = "";
    syncURL();
    render();
    $("main").scrollIntoView({behavior: "auto", block: "start"});
  }
  function detail(r) {
    const root = $("record-detail");
    root.replaceChildren();
    if (!r) {
      text(root, "p", "Select a file to see its type, original name and Google Drive link.", "soft");
      return;
    }
    text(root, "h3", r.title);
    const actions = make("nav",null,"detail-actions");
    actions.setAttribute("aria-label","Selected source actions");
    if(safeDrive(r.url)) { const link=text(actions,"a","Open original in Google Drive ↗","source-button"); link.href=r.url; link.target="_blank"; link.rel="noopener noreferrer"; }
    const related=text(actions,"a","View project directory","detail-project-link"); related.href="./?project="+encodeURIComponent(r.project_id);
    root.append(actions);
    const fields = [
      ["Project", r.project],
      ["File group", (state.data.groups.find(g => g.key === r.group) || {}).label || "Other files"],
      ["File category", r.document_slot || "Other files"],
      ["Drawing discipline", r.discipline || "Not specified"],
      ["Format", r.format],
      ["Original filename", r.original_filename || "Not supplied"],
      ["Revision status", "Check the title block or original file before construction"],
      ["Recorded issue status", humanLabel("approval", r.approval) || "Status unrecorded"],
      ["Access", r.access === "PUBLIC_LINK" ? "Open with existing Google Drive access" : "Google Drive permission required"],
      ["Files are stored in", "Google Drive"]
    ];
    for (const [label, value] of fields) {
      text(root, "h4", label);
      text(root, "p", value);
    }

  }
  function nav() {
    const root = $("company-nav"); root.replaceChildren();
    const choices = [{key: "", name: "All companies", project_count: state.data.projects.length}, ...state.data.companies];
    for (const c of choices) {
      const btn = make("button", null, "company-btn");
      btn.type = "button";
      btn.setAttribute("aria-pressed", String(c.key === state.company));
      text(btn, "strong", c.name);
      text(btn, "span", c.project_count + (c.project_count === 1 ? " project" : " projects"));
      btn.addEventListener("click", () => setLocation(c.key));
      root.append(btn);
    }
  }
  function crumbs() {
    const root = $("breadcrumbs"); root.replaceChildren();
    const step = (name, company, project) => {
      const btn = text(root, "button", name);
      btn.type = "button";
      btn.addEventListener("click", () => setLocation(company, project));
    };
    step("All companies", "", "");
    const c = state.data.companies.find(x => x.key === state.company);
    if (c) {
      text(root, "span", " / ");
      step(c.name, c.key, "");
    }
    if (state.project) {
      const p = state.data.projects.find(x => x.project_id === state.project);
      if (p) { text(root, "span", " / "); text(root, "span", p.name); }
    }
  }
  const matches = (...values) => values.some(value => String(value || "").toLocaleLowerCase().includes(state.query));
  const orderedProjects = company => state.data.projects.filter(p => p.company_key === company);
  const groupLabel = group => state.data.groups.find(g => g.key === group)?.label || group;
  const filterFields = [
    ["discipline", "Discipline"],
    ["format", "Format"],
    ["revision_note", "Revision note"],
    ["approval", "Approval"]
  ];
  const humanLabel = (field, value) => {
    if (field === "revision_note") {
      const labels = {
        REQUIRES_DISCIPLINE_AND_REVISION_CLASSIFICATION: "Classification and revision need review",
        NOT_VERIFIED_AS_APPROVED_CONSTRUCTION_DRAWING: "Drawing approval / revision not verified",
        "Issue/revision not independently certified": "Issue / revision not certified"
      };
      return labels[value] || value;
    }
    if (field === "approval") {
      if (value === "UNVERIFIED_AS_CURRENT_ISSUE") return "Current issue not verified";
      if (value === "APPROVED_FOR_CONSTRUCTION") return "Marked approved for construction in the register";
    }
    return value;
  };
  const facetsMatch = resource => filterFields.every(([field]) =>
    !state.facets[field] || state.facets[field] === (resource[field] || ""));
  function populateFacets(project) {
    for (const [field] of filterFields) {
      const select = $("facet-" + (field === "revision_note" ? "revision" : field));
      const options = [...new Set(state.data.resources
        .filter(r => r.project_id === project)
        .map(r => r[field] || "")
        .filter(Boolean))].sort((a,b)=>a.localeCompare(b));
      select.replaceChildren();
      const initial = make("option", "All " + (field === "revision_note" ? "revision notes" : field === "approval" ? "issue statuses" : field === "format" ? "formats" : "disciplines"));
      initial.value = "";
      select.append(initial);
      for (const option of options) {
        const o = make("option", humanLabel(field, option));
        o.value = option;
        select.append(o);
      }
      select.value = state.facets[field] || "";
    }
  }

  function introCards() {
    const root = $("workspace"); root.replaceChildren();
    const top = make("div", null, "section-top");
    const left = make("div");
    text(left, "p", "01 / CHOOSE AN ORGANIZATION", "eyebrow");
    text(left, "h2", "Companies & source owners");
    text(left, "p", "Choose a company to browse projects. Unassigned entries are surfaced for correction.");
    top.append(left); root.append(top);
    const grid = make("div", null, "company-grid");
    const shown = state.data.companies.filter(c => matches(
      c.name, ...orderedProjects(c.key).flatMap(p => [
        p.name, p.project_id, ...state.data.resources.filter(r => r.project_id === p.project_id).map(r => r.title)
      ])
    ));
    for (const c of shown) {
      const btn = make("button", null, "company-card");
      btn.type = "button";
      text(btn, "strong", c.name);
      text(btn, "small", c.project_count + " projects · " + c.resource_count + " references · " + c.document_count + " packet files");
      text(btn, "em", c.status === "NEEDS_OWNER_CONFIRMATION" ? "Company needs owner confirmation" : "Browse projects");
      btn.addEventListener("click", () => setLocation(c.key));
      grid.append(btn);
    }
    root.append(shown.length ? grid : text(make("div"), "p", "No organization matches the search.", "empty"));
  }
  function companyProjects() {
    const root = $("workspace"); root.replaceChildren();
    const c = state.data.companies.find(x => x.key === state.company);
    if (!c) return introCards();
    const top = make("div", null, "section-top");
    const left = make("div");
    text(left, "p", "02 / CHOOSE A PROJECT", "eyebrow");
    text(left, "h2", c.name);
    text(left, "p", c.project_count + " projects · " + c.resource_count + " references · " + c.document_count + " packet files");
    if (c.status === "NEEDS_OWNER_CONFIRMATION") text(left, "p", "Company name is not present in the packet source. Owner confirmation is required.", "review");
    top.append(left); root.append(top);
    const grid = make("div", null, "project-grid");
    const shown = orderedProjects(c.key).filter(p => matches(
      p.name, p.project_id, p.company_project_code, ...state.data.resources.filter(r => r.project_id === p.project_id).map(r => r.title)
    ));
    for (const p of shown) {
      const btn = make("button", null, "project-card");
      btn.type = "button";
      text(btn, "strong", p.name);
      text(btn, "small", "Browse available files");
      text(btn, "small", p.resource_count + " resource links · " + p.document_count + " packet documents");
      btn.addEventListener("click", () => setLocation(c.key, p.project_id));
      grid.append(btn);
    }
    root.append(shown.length ? grid : text(make("div"), "p", "No projects match the search.", "empty"));
  }

  // Stable presentation slots exist even when a project has no matching source record.
  // This is a view contract, NOT a synthetic file or approval assertion.
  const slotDefinitions = {
    "drawings": [
      ["architectural-pdf", "Architectural drawings · PDF", r => /architecture/i.test(r.discipline) && r.format === "PDF"],
      ["architectural-dwg", "Architectural drawings · DWG", r => /architecture/i.test(r.discipline) && r.format === "DWG"],
      ["structural-pdf", "Structural drawings · PDF", r => /structur/i.test(r.discipline) && r.format === "PDF"],
      ["structural-dwg", "Structural drawings · DWG", r => /structur/i.test(r.discipline) && r.format === "DWG"],
      ["other-drawings", "Other drawings", r => true]
    ],
    "models": [
      ["etabs-e2k", "ETABS structural model · E2K", r => r.format.toUpperCase() === "E2K"],
      ["etabs-edb", "ETABS structural model · EDB", r => r.format.toUpperCase() === "EDB"],
      ["sketchup-skp", "3D SketchUp model · SKP", r => r.format.toUpperCase() === "SKP"],
      ["other-models", "Other source models", r => true]
    ],
    "reports": [
      ["geotechnical", "Geotechnical / soil report", r => /geotech|soil/i.test(r.discipline)],
      ["mep", "MEP / sanitary report", r => /MEP|sanitary/i.test(r.discipline)],
      ["municipal", "Municipal / permit report", r => /municipal|permit/i.test(r.discipline)],
      ["other-reports", "Other technical reports", r => true]
    ],
    "calculations": [
      ["estimates", "Cost estimates / BOQ references", r => /cost|estimate|BOQ/i.test(r.discipline)],
      ["structural-calculations", "Structural calculations", r => /structural|rebar|footing/i.test(r.discipline)],
      ["other-calculations", "Other calculations", r => true]
    ],
    "source-folders": [
      ["project-source-folders", "Original project and revision folders", r => true]
    ],
    "project-packets": [
      ["client-packets", "Client A / B / C document packet", r => true]
    ],
    "other": [
      ["other-references", "Other reference files", r => true]
    ]
  };
  function splitIntoSlots(groupKey, records) {
    const remain = [...records];
    const result = [];
    for (const [key,label,accept] of slotDefinitions[groupKey] || []) {
      const found = remain.filter(accept);
      for (const item of found) remain.splice(remain.indexOf(item),1);
      result.push({key,label,records:found});
    }
    if (remain.length) throw Error("Unclassified resource slot for " + groupKey);
    return result;
  }
  function fileGallery(p, entries, stack) {
    const shell=make("section",null,"gallery-shell");
    shell.setAttribute("aria-label","Project file gallery");
    const head=make("div",null,"gallery-head"), title=make("div");
    text(title,"h3","Blueprint file gallery");
    text(title,"p","Swipe, use the arrows, or switch to the complete file register.");
    head.append(title);
    const switches=make("div",null,"gallery-switch");
    const galleryBtn=text(switches,"button","Curved gallery"), listBtn=text(switches,"button","Full list");
    galleryBtn.type=listBtn.type="button";head.append(switches);shell.append(head);
    const stage=make("div",null,"gallery-stage");shell.append(stage);
    const rail=make("div",null,"gallery-rail");stage.append(rail);rail.tabIndex=0;rail.setAttribute("aria-label","Swipeable files");
    const cards=[];
    const unique=new Map();
    for(const item of entries){const prev=unique.get(item.url);if(prev){prev.duplicates.push(item);prev.slot=[...new Set([prev.slot,...prev.duplicates.map(x=>x.slot)])].join(" / ");}else unique.set(item.url,{...item,duplicates:[]});}
    for(const item of unique.values()){
      const tile=make("article",null,"file-tile");tile.dataset.format=item.format||"FILE";
      text(tile,"span",item.format||"FILE","file-icon");
      text(tile,"span",item.slot,"file-category");text(tile,"h4",item.duplicates.length?"Combined "+item.format+" · "+(item.duplicates.length+1)+" registered roles":item.title);
      if(item.duplicates.length)for(const r of [item,...item.duplicates])text(tile,"small",r.title+" — "+(humanLabel("approval",r.approval)||"Issue status not recorded"));
      if(item.original_filename&&item.original_filename!==item.title)text(tile,"small",item.original_filename);
      text(tile,"div",item.packet?"Client documents · check approval in packet":humanLabel("approval",item.approval)||"Issue status not recorded","file-warning");
      text(tile,"small",item.packet?"Original files remain in Drive":item.access==="DRIVE_PERMISSION_REQUIRED"?"Google Drive permission required":"Open with existing Drive access");
      const actions=make("div",null,"file-actions");tile.append(actions);
      if(item.packet||safeDrive(item.url)){const open=text(actions,"a",item.packet?"Open packet ↗":"Open original ↗","file-open");open.href=item.url;if(!item.packet){open.target="_blank";open.rel="noopener noreferrer";}}
      if(!item.packet){const select=text(actions,"button","File details");select.type="button";select.addEventListener("click",()=>{state.selected=item.id;detail(item);if(window.matchMedia("(max-width:700px)").matches)$("east").scrollIntoView({block:"start",behavior:"auto"});});}
      rail.append(tile);cards.push(tile);
    }
    if(!cards.length)text(rail,"p","No registered files match these filters. The full list shows every standard category.","gallery-empty");
    const foot=make("div",null,"gallery-foot"), status=text(foot,"span","");
    const arrows=make("div",null,"gallery-arrows"), prev=text(arrows,"button","← Previous"), next=text(arrows,"button","Next →");prev.type=next.type="button";foot.append(arrows);stage.append(foot);
    let active=0,frame=0;
    const reduced=window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    function measure(){
      frame=0;if(stage.hidden)return;
      const rr=rail.getBoundingClientRect(),middle=rr.left+rr.width/2;let distance=Infinity;
      cards.forEach((card,i)=>{const dx=card.getBoundingClientRect().left+card.offsetWidth/2-middle;const ratio=Math.max(-1,Math.min(1,dx/Math.max(1,rr.width*.55)));card.style.setProperty("--tilt",reduced?"0deg":(-ratio*23)+"deg");card.style.setProperty("--scale",reduced?"1":String(1-Math.abs(ratio)*.09));if(Math.abs(dx)<distance){distance=Math.abs(dx);active=i;}});
      cards.forEach((card,i)=>{card.dataset.active=String(i===active);});
      status.textContent=cards.length?(active+1)+" / "+cards.length+" files":"No matching files";prev.disabled=!cards.length||active===0;next.disabled=!cards.length||active===cards.length-1;
    }
    function schedule(){if(!frame)frame=requestAnimationFrame(measure);}
    function move(index){if(!cards.length)return;index=Math.max(0,Math.min(cards.length-1,index));const cr=cards[index].getBoundingClientRect(),rr=rail.getBoundingClientRect();rail.scrollTo({left:rail.scrollLeft+cr.left+cr.width/2-rr.left-rr.width/2,behavior:reduced?"auto":"smooth"});}
    prev.addEventListener("click",()=>move(active-1));next.addEventListener("click",()=>move(active+1));rail.addEventListener("scroll",schedule,{passive:true});
    rail.addEventListener("keydown",e=>{if(e.target!==rail)return;if(e.key==="ArrowLeft"||e.key==="ArrowRight"){e.preventDefault();move(active+(e.key==="ArrowLeft"?-1:1));}});
    function view(mode){state.fileView=mode;const isGallery=mode==="gallery";stage.hidden=!isGallery;stack.hidden=isGallery;galleryBtn.setAttribute("aria-pressed",String(isGallery));listBtn.setAttribute("aria-pressed",String(!isGallery));if(isGallery)schedule();}
    galleryBtn.addEventListener("click",()=>view("gallery"));listBtn.addEventListener("click",()=>view("list"));
    view(state.fileView);return shell;
  }
  function projectResources() {
    const root = $("workspace"); root.replaceChildren();
    const p = state.data.projects.find(x => x.project_id === state.project && x.company_key === state.company);
    if (!p) {setLocation(); return;}
    const header = make("div", null, "section-top");
    const left = make("div");
    text(left, "p", "03 / DRAWINGS AND FILES", "eyebrow");
    text(left, "h2", p.name);
    text(left, "p", p.resource_count + " file and folder links · " + p.document_count + " client documents");
    header.append(left);
    const back = text(header,"button","All projects","utility-btn");
    back.addEventListener("click", () => setLocation(state.company));
    root.append(header);
    if (p.company_assignment === "NEEDS_OWNER_CONFIRMATION") {
      text(root,"p","Company assignment requires original source-owner confirmation.", "review");
    }
    const intro = make("div",null,"matrix-intro");
    text(intro,"strong","Browse registered files first");
    text(intro,"p","The gallery shows registered files only. Switch to Full list to inspect every standard category, including empty slots."); const intake=text(intro,"a","Open this project’s intake journal ↗","detail-project-link");intake.href="./intake.html?project="+encodeURIComponent(p.project_id);
    root.append(intro);
    if(p.project_id.startsWith("JPENT-ASTAM-")) { const notice=make("aside",null,"project-context-note");text(notice,"strong","Astam Village · pre-purchase feasibility");text(notice,"p","Purchase on HOLD · original JP Enterprise sources · approval unverified · permanent PRJ ID pending.");const guide=text(notice,"a","View existing feasibility research ↗");guide.href="./feasibility/";root.append(notice); }
    const stack = make("div",null,"group-stack");
    let matchingFiles = 0;
    const listedOriginals=new Map();
    const galleryEntries=[];
    const hasQuery = Boolean(state.query);
    const hasFacets = Object.values(state.facets).some(Boolean);
    for (const group of state.data.groups) {
      const all = state.data.resources.filter(r => r.project_id === p.project_id && r.group === group.key);
      const matching = all.filter(r => facetsMatch(r) &&
        matches(r.title,r.original_filename,r.document_slot,r.format,r.discipline,r.revision_note,r.id,r.approval,group.label));
      matchingFiles += matching.length;
      const hasPackets = group.key === "project-packets" && p.document_count > 0;
      const packetMatches = matches("agreements","documents","materials","packet",group.label,p.name);
      const groupCard = make("details",null,"resource-group");
      groupCard.open = Boolean(matching.length || (hasPackets && packetMatches));
      groupCard.dataset.group = group.key;
      const summ = make("summary");
      text(summ,"span",group.label);
      const recordCount = all.length + (hasPackets ? p.document_count : 0);
      text(summ,"small",recordCount ? recordCount+" listed" : "No files listed");
      groupCard.append(summ);
      const body=make("div",null,"resource-items slots");
      const allSlots=splitIntoSlots(group.key,all);
      for (const slot of allSlots) {
        const matched = slot.records.filter(r => matching.includes(r));
        for(const r of matched)galleryEntries.push({...r,slot:slot.label});
        const slotCard=make("details",null,"resource-slot");
        slotCard.dataset.slot=slot.key;
        slotCard.open=Boolean(matched.length) || (group.key === "project-packets" && hasPackets && packetMatches);
        const slotTitle=make("summary",null,"slot-title");
        text(slotTitle,"span",slot.label);
        const slotCount=group.key === "project-packets" && hasPackets ? p.document_count : slot.records.length;
        text(slotTitle,"small",slotCount ? slotCount+" registered" : "Not registered");
        slotCard.append(slotTitle);
        const content=make("div",null,"slot-contents");
        if (group.key === "project-packets" && hasPackets && packetMatches) {
          galleryEntries.push({packet:true,format:"PDF",slot:slot.label,title:"A/B/C client documents · "+p.document_count+" linked PDFs",url:"./resources/project-documents.html?project="+encodeURIComponent(p.project_id)});
          const a=text(content,"a","Open A/B/C documents · "+p.document_count+" linked PDFs","packet-link");
          a.href="./resources/project-documents.html?project="+encodeURIComponent(p.project_id);
        } else if (matched.length) {
          for (const r of matched) {
            const first=listedOriginals.get(r.url);
            if(first){text(content,"p",r.title+" — same original as "+first+". "+(humanLabel("approval",r.approval)||"Issue status not recorded"),"slot-empty");continue;}
            listedOriginals.set(r.url,slot.label);
            const entry=make("div",null,"resource-entry");
            const btn=make("button",null,"resource-line");
            btn.type="button";
            btn.setAttribute("aria-pressed",String(state.selected === r.id));
            text(btn,"strong",r.title);
            if (r.original_filename && r.original_filename !== r.title) {
              text(btn,"span",r.original_filename,"original-name");
            }
            text(btn,"span",[r.format, humanLabel("approval", r.approval),
              r.access === "DRIVE_PERMISSION_REQUIRED" ? "Drive permission required" : ""].filter(Boolean).join(" · "));
            btn.addEventListener("click",()=>{
              state.selected=r.id; detail(r); render();
              if (window.matchMedia("(max-width:700px)").matches) $("east").scrollIntoView({block:"start",behavior:"auto"});
            });
            entry.append(btn);
            if(safeDrive(r.url)) { const open=text(entry,"a","Open original ↗","resource-open"); open.href=r.url;open.target="_blank";open.rel="noopener noreferrer";open.setAttribute("aria-label","Open original in Google Drive: "+r.title); }
            content.append(entry);
          }
        } else {
          let msg;
          if (slot.records.length && (hasQuery || hasFacets)) msg="Registered files exist, but none match the current search or filters.";
          else msg="No "+slot.label.toLowerCase()+" registered for this project.";
          text(content,"p",msg,"slot-empty");
          const link=text(content,"a","How to register a verified source","slot-help");
          link.href="./editing.html#editable";
        }
        slotCard.append(content);
        body.append(slotCard);
      }
      groupCard.append(body);
      stack.append(groupCard);
    }
    $("facet-count").textContent=matchingFiles+" of "+p.resource_count+
      " catalogue references match · "+listedOriginals.size+" distinct file/folder links · Full list includes empty categories";
    root.append(fileGallery(p,galleryEntries,stack));
    root.append(stack);
    const siblings=orderedProjects(state.company),at=siblings.findIndex(x=>x.project_id===p.project_id);
    const pager=make("nav",null,"page-trail project-pager");pager.setAttribute("aria-label","Previous and next projects");
    const companyBack=text(pager,"a","← All "+p.company+" projects");companyBack.href="./?company="+encodeURIComponent(state.company);
    for(const [position,label] of [[at-1,"← Previous: "],[at+1,"Next: "]]) {const item=siblings[position];if(item){const link=text(pager,"a",label+item.name+(position>at?" →":""));link.href="./?project="+encodeURIComponent(item.project_id);}}
    root.append(pager);
  }
  function render() {
    if (!state.data) return;
    if (!state.company && state.project) {
      const fromLink = state.data.projects.find(p => p.project_id === state.project);
      if (fromLink) state.company = fromLink.company_key;
    }
    if (!state.data.companies.some(c => c.key === state.company)) {
      state.company = ""; state.project = "";
    }
    const current = state.data.projects.find(p => p.project_id === state.project);
    if (!current || current.company_key !== state.company) state.project = "";
    const showingProject = Boolean(state.project);
    $("facet-panel").hidden = !showingProject;
    if (showingProject && state.facetsProject !== state.project) {
      state.facets = {};
      state.facetsProject = state.project;
      populateFacets(state.project);
    }
    syncURL(); nav(); crumbs();
    if (!state.company) introCards();
    else if (!state.project) companyProjects();
    else projectResources();
    if (state.selected) {
      const selected = state.data.resources.find(r => r.id === state.selected);
      detail(selected || null);
    } else detail(null);
  }
  $("library-search").addEventListener("input", value => {
    state.query = value.target.value.trim().toLocaleLowerCase();
    render();
  });
  $("clear-search").addEventListener("click", () => {
    $("library-search").value = ""; state.query = ""; render(); $("library-search").focus();
  });
  for (const [field] of filterFields) {
    const select = $("facet-" + (field === "revision_note" ? "revision" : field));
    select.addEventListener("change", () => {
      state.facets[field] = select.value;
      render();
    });
  }
  $("clear-facets").addEventListener("click", () => {
    state.facets = {};
    if (state.project) populateFacets(state.project);
    render();
  });
  fetch("./catalog.json", {cache:"no-store"}).then(response => {
    if (!response.ok) throw Error("Unable to load catalog.json");
    return response.json();
  }).then(data => {
    if (data.schema_version !== "2.0.0" || !Array.isArray(data.companies) ||
        !Array.isArray(data.projects) || !Array.isArray(data.resources) || !Array.isArray(data.groups)) {
      throw Error("Unrecognized catalogue version");
    }
    if (data.resources.some(r => !safeDrive(r.url))) throw Error("Invalid Drive source route");
    state.data = data;
    $("metric-companies").textContent = String(data.companies.length);
    $("metric-projects").textContent = String(data.projects.length);
    $("metric-records").textContent = String(data.resources.length + data.projects.reduce((n,p) => n+p.document_count, 0));
    $("site-status").textContent = "Published from the reviewed owner register · " + data.verified_on_npt +
      " · Source file approvals remain independent";
    render();
  }).catch(error => {
    $("site-status").textContent = "Directory unavailable: " + error.message;
    $("workspace").replaceChildren(text(make("div"), "p", "The reviewed index cannot be loaded. No source approval should be inferred.", "empty"));
  });
})();
