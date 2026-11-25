"use strict";
const {chromium} = require("playwright");
const assert = require("node:assert/strict");
const ROOT = process.env.BROWSER_QA_URL || "http://127.0.0.1:8765";

async function qa() {
  const options = {headless: true, args:["--no-sandbox"]};
  // Ubuntu Actions runners already carry Google Chrome; use it instead of
  // re-installing large browser/system-dependency packages on every PR.
  if (process.env.PLAYWRIGHT_CHROMIUM_PATH) options.executablePath = process.env.PLAYWRIGHT_CHROMIUM_PATH;
  if (process.env.PLAYWRIGHT_USE_SYSTEM_CHROME === "1") options.channel = "chrome";
  const browser = await chromium.launch(options);
  try {
    const errors = [];
    const page = await browser.newPage({viewport:{width:1366,height:900},deviceScaleFactor:1});
    page.on("pageerror", error => errors.push(error.message));
    await page.goto(ROOT + "/", {waitUntil:"domcontentloaded"});
    assert.equal(await page.getByRole("navigation", {name:"Primary resource tabs"})
      .locator('[aria-current="page"]').textContent(), "Desk Resources");
    await page.locator(".company-card").first().waitFor();
    assert.equal(await page.locator(".company-card").count(),3);
    assert.equal(await page.locator("#metric-projects").textContent(),"3");
    await page.locator(".company-card").first().click();
    assert.equal(await page.locator(".project-card").count(),1);
    await page.locator(".project-card").first().click();
    assert.equal(await page.locator(".file-tile").count(),1);
    assert.equal(await page.locator(".file-tile .file-open").isVisible(),true);
    await page.getByRole("button",{name:"Full list",exact:true}).click();
    assert.equal(await page.locator(".resource-line").count(),1);
    assert.equal(await page.locator(".resource-entry .resource-open").count(),1);
    assert.match(await page.locator(".resource-entry .resource-open").first().getAttribute("href"), /^https:\/\/drive\.google\.com\//);
    // Architecture-only example still exposes empty Structural PDF/DWG slots.
    assert.equal(await page.locator(".resource-slot").count() >= 12, true);
    const emptyStructural = page.locator('[data-slot="structural-pdf"]');
    assert.equal(await emptyStructural.count(),1);
    await emptyStructural.locator("summary").click();
    assert.match(await emptyStructural.innerText(),/No structural drawings.*registered/i);
    assert.equal(await page.locator("#facet-panel").isVisible(), true);
    assert.equal(await page.locator("#facet-discipline option").count(), 2);
    await page.locator("#facet-discipline").selectOption({label: "Architecture"});
    await page.locator("#facet-format").selectOption("DWG");
    await page.locator("#facet-revision").selectOption({label: "Drawing approval / revision not verified"});
    await page.locator("#facet-approval").selectOption({label: "Current issue not verified"});
    assert.equal(await page.locator(".resource-line").count(),1);
    assert.match(await page.locator("#facet-count").innerText(),/1 of 1/);
    await page.locator("#clear-facets").click();
    assert.equal(await page.locator("#facet-discipline").inputValue(),"");
    await page.locator(".resource-line").first().click();
    assert.match(await page.locator("#record-detail").innerText(),/Original filename/i);
    assert.doesNotMatch(await page.locator("#record-detail").innerText(),/Stable record ID|Source register|Owner-entered readback/i);
    assert.match(await page.locator("#record-detail").innerText(),/ARCHITECTURE/i);
    assert.match(await page.locator("#record-detail").innerText(),/REVISION/i);
    assert.match(await page.locator("#record-detail").innerText(),/Current issue not verified/);
    assert.equal(await page.locator("#record-detail .source-button").count(),1);
    assert.ok((await page.url()).includes("project=PRJ-000001"));
    await page.locator("#breadcrumbs button").first().click();
    assert.equal(await page.locator(".company-card").count(),3);
    await page.locator("#library-search").fill("Example Construction B");
    assert.equal(await page.locator(".company-card").count(),1);
    await page.locator("#clear-search").click();
    assert.equal(await page.locator(".company-card").count(),3);
    await page.goto(ROOT + "/projects.html", {waitUntil:"domcontentloaded"});
    await page.locator(".project-card").first().waitFor();
    assert.equal(await page.locator(".project-card").count(),29);
    assert.match(await page.locator("#project-provenance").innerText(),/Google Drive/i);
    assert.match(await page.locator("#project-provenance").innerText(),/dated reviewed snapshot \(not a verified live refresh\)/i);
    await page.locator("#project-query").fill("Narayani");
    assert.equal(await page.locator(".project-card").count(),1);
    await page.locator(".project-card").click();
    assert.match(await page.locator("#project-detail-body").innerText(),/Narayani/i);
    assert.doesNotMatch(await page.locator("#project-detail-body").innerText(),/PRJ-000007|project_id|record_id|source readback/i);
    await page.locator("#clear-project-filters").click();
    assert.equal(await page.locator(".project-card").count(),29);
    await page.goto(ROOT + "/intake.html", {waitUntil:"domcontentloaded"});
    await page.waitForFunction(()=>document.getElementById("intake-status").textContent.includes("No links are available"));
    assert.equal(await page.locator(".intake-card").count(),0); // synthetic preview has no live identity proof
    await page.route("**/project-intake.json", route=>route.fulfill({json:{schema_version:"1.0.0",projects:[{project_id:"PRJ-000001",name:"Fixture project",company:"Fixture company",url:"https://docs.google.com/document/d/SyntheticIntakeDoc123/edit"}]}}));
    await page.reload();await page.locator(".intake-card").first().waitFor();
    assert.match(await page.locator(".intake-open").getAttribute("href"),/^https:\/\/docs\.google\.com\/document\/d\//);
    await page.locator("#intake-search").fill("not a project");assert.equal(await page.locator(".intake-card").count(),0);
    await page.unroute("**/project-intake.json");
    await page.getByRole("button",{name:"By person",exact:true}).click();
    await page.locator("#person-intake-grid .intake-open").first().waitFor();
    assert.ok(await page.locator("#person-intake-grid .intake-card").count()>=3);
    assert.equal(await page.locator("#project-intake-section").isVisible(),false);
    assert.match(await page.locator("#person-intake-grid").innerText(),/Krishna Kumar Gupta/);
    await page.getByRole("button",{name:"By project",exact:true}).click();
    assert.equal(await page.locator("#person-intake-section").isVisible(),false);
    await page.goto(ROOT + "/editing.html", {waitUntil:"domcontentloaded"});
    assert.match(await page.locator("main").innerText(),/Project Resources Google Sheet/);
    assert.match(await page.locator("main").innerText(),/Record the current issue or approval status/);
    await page.route('https://fabingurung.github.io/jp-estimating-and-boq/**', route =>
      route.fulfill({body: 'Estimation fixture'}));
    await page.goto(ROOT + "/field.html#measurements");
    assert.equal(new URL(page.url()).hash, '#measurements');
    assert.ok(page.url().includes('/jp-estimating-and-boq/field.html'));
    await page.goto(ROOT + "/money.html#workforce");
    assert.ok(page.url().endsWith('/field.html#workforce'));
    await page.goto(ROOT + "/", {waitUntil:"domcontentloaded"});
    await page.locator(".company-card").first().waitFor();

    const mobile = await browser.newPage({viewport:{width:390,height:844},deviceScaleFactor:1,isMobile:true,hasTouch:true});
    mobile.on("pageerror", error => errors.push(error.message));
    await mobile.goto(ROOT + "/", {waitUntil:"domcontentloaded"});
    await mobile.locator(".company-card").first().waitFor();
    const fit = await mobile.evaluate(() => ({
      viewport:document.documentElement.clientWidth,
      scroll:document.documentElement.scrollWidth
    }));
    assert.ok(fit.scroll <= fit.viewport + 2, "Horizontal overflow at mobile viewport: " + JSON.stringify(fit));
    await mobile.locator(".company-card").first().click();
    await mobile.locator(".project-card").first().click();
    await mobile.locator("#facet-discipline").selectOption({label:"Architecture"});
    assert.equal(await mobile.locator(".resource-line").count(),1);
    await mobile.getByRole("button",{name:"Full list",exact:true}).click();
    await mobile.locator(".resource-line").first().click();
    assert.match(await mobile.locator("#record-detail").innerText(),/Open original/);
    await mobile.goto(ROOT + "/intake.html", {waitUntil:"domcontentloaded"});
    assert.ok(await mobile.evaluate(()=>document.documentElement.scrollWidth<=document.documentElement.clientWidth+2),"Intake mobile overflow");
    await mobile.goto(ROOT + "/projects.html", {waitUntil:"domcontentloaded"});
    await mobile.locator(".project-card").first().waitFor();
    const projectFit=await mobile.evaluate(()=>({viewport:document.documentElement.clientWidth,scroll:document.documentElement.scrollWidth}));
    assert.ok(projectFit.scroll<=projectFit.viewport+2,"Project directory mobile overflow");
    await mobile.goto(ROOT + "/?company=display-example-construction-b&project=PRJ-000002", {waitUntil:"domcontentloaded"});
    await mobile.locator(".file-tile").first().waitFor();
    assert.match(await mobile.locator("#workspace").innerText(),/Site B/);
    await mobile.goto(ROOT + "/resources/project-documents.html?project=PRJ-000029", {waitUntil:"domcontentloaded"});
    await mobile.locator("#load-status").waitFor();
    await mobile.waitForFunction(() => document.getElementById("load-status").textContent.includes("Document list updated"));
    assert.match(await mobile.locator("#project-name").textContent(),/Site C/);
    if (errors.length) throw new Error("Browser console errors: " + errors.join(" | "));
    console.log("Browser QA PASS: normalized empty slots, source-linked records, workspaces, finance boundaries, desktop/mobile overflow, legacy packet URL.");
  } finally {
    await browser.close();
  }
}
qa().catch(e => {console.error(e);process.exitCode=1;});
