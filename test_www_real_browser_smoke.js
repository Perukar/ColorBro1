'use strict';

/**
 * test_www_real_browser_smoke.js - PERUKAR real browser smoke tests
 *
 * Requires: @playwright/test (installed as devDependency)
 * Requires: Chromium binary (run: npx playwright install chromium)
 *
 * Run: node test_www_real_browser_smoke.js
 *
 * Contract: docs/real-browser-smoke-contract.md
 * HEAD at creation: b2645ef Add production readiness index
 *
 * SAFE APPROVED FIXTURE (scenarios 5, 7, 8):
 *   Same-level permanent 7->7, target_direction=1 (pepel), base_type=Naturalna.
 *   Mirrors UI-RENDER-APPROVED-CLEAN-PATH in test_www_business_scenarios.js.
 *   WHY NOT HTML defaults (root_level=5, target_level=9):
 *     5->9 = 4-level lift -> high oxidizer >=9% -> brand gate (hasBrandRuleMatrix=false)
 *     -> MANUAL_REQUIRED, not APPROVED.
 *     7->7 = same level -> standard oxidizer -> no brand gate -> APPROVED.
 */

const { chromium } = require('@playwright/test');
const path = require('path');
const assert = require('assert');

const INDEX_HTML = path.resolve(__dirname, 'www', 'index.html');
const FILE_URL = 'file:///' + INDEX_HTML.replace(/\\/g, '/');

const results = [];
let passed = 0;
let failed = 0;

function pass(name) {
  results.push({ name, ok: true });
  passed++;
  console.log('  PASS ' + name);
}

function fail(name, err) {
  results.push({ name, ok: false, err: String(err) });
  failed++;
  console.error('  FAIL ' + name + ': ' + String(err));
}

async function withPage(browser, fn) {
  const page = await browser.newPage();
  try {
    await fn(page);
  } finally {
    await page.close();
  }
}

async function setSelect(page, selector, value) {
  await page.selectOption(selector, { value });
}

/**
 * Apply the safe approved fixture.
 * Same-level permanent 7->7, direction=1 (pepel), natural base.
 */
async function applyApprovedFixture(page) {
  await setSelect(page, '#allergy', 'no');
  await setSelect(page, '#scalp_sensitivity', 'normal');
  await setSelect(page, '#root_level', '7');
  await setSelect(page, '#length_level', '7');
  await setSelect(page, '#ends_level', '7');
  await setSelect(page, '#target_level', '7');
  await setSelect(page, '#target_direction', '1');
  await setSelect(page, '#base_type', 'Натуральна');
}

async function clickCalculate(page) {
  await page.click('button');
  await page.waitForFunction(
    () => document.getElementById('output') &&
          document.getElementById('output').innerHTML.trim() !== '',
    { timeout: 5000 }
  );
}

async function getOutput(page) {
  return page.evaluate(() => {
    const el = document.getElementById('output');
    return el ? el.innerHTML.trim() : '';
  });
}

async function smokePageLoadOutputEmpty(browser) {
  const name = 'SMOKE-PAGE-LOAD-OUTPUT-EMPTY';
  try {
    await withPage(browser, async (page) => {
      await page.goto(FILE_URL, { waitUntil: 'domcontentloaded', timeout: 15000 });
      const output = await getOutput(page);
      assert.strictEqual(output, '', 'Expected #output empty on page load, got: ' + output.substring(0, 100));
    });
    pass(name);
  } catch (err) { fail(name, err); }
}

async function smokeAllergyYesBlocked(browser) {
  const name = 'SMOKE-ALLERGY-YES-BLOCKED';
  try {
    await withPage(browser, async (page) => {
      await page.goto(FILE_URL, { waitUntil: 'domcontentloaded', timeout: 15000 });
      await setSelect(page, '#allergy', 'yes');
      await clickCalculate(page);
      const output = await getOutput(page);
      assert.ok(output !== '', 'Expected non-empty output');
      assert.ok(!output.includes('approved-recipe'), 'No approved-recipe for allergy=yes');
      assert.ok(output.includes('BLOCKED'), 'Expected BLOCKED for allergy=yes, got: ' + output.substring(0, 200));
    });
    pass(name);
  } catch (err) { fail(name, err); }
}

async function smokeScalpIrritatedBlocked(browser) {
  const name = 'SMOKE-SCALP-IRRITATED-BLOCKED';
  try {
    await withPage(browser, async (page) => {
      await page.goto(FILE_URL, { waitUntil: 'domcontentloaded', timeout: 15000 });
      await setSelect(page, '#allergy', 'no');
      await setSelect(page, '#scalp_sensitivity', 'irritated');
      await clickCalculate(page);
      const output = await getOutput(page);
      assert.ok(output !== '', 'Expected non-empty output');
      assert.ok(!output.includes('approved-recipe'), 'No approved-recipe for scalp=irritated');
      assert.ok(output.includes('BLOCKED'), 'Expected BLOCKED for scalp=irritated, got: ' + output.substring(0, 200));
    });
    pass(name);
  } catch (err) { fail(name, err); }
}

async function smokeAllergyUnknownManual(browser) {
  const name = 'SMOKE-ALLERGY-UNKNOWN-MANUAL';
  try {
    await withPage(browser, async (page) => {
      await page.goto(FILE_URL, { waitUntil: 'domcontentloaded', timeout: 15000 });
      await setSelect(page, '#scalp_sensitivity', 'normal');
      await clickCalculate(page);
      const output = await getOutput(page);
      assert.ok(output !== '', 'Expected non-empty output');
      assert.ok(!output.includes('approved-recipe'), 'No approved-recipe for allergy=unknown');
      assert.ok(output.includes('MANUAL'), 'Expected MANUAL for allergy=unknown, got: ' + output.substring(0, 200));
    });
    pass(name);
  } catch (err) { fail(name, err); }
}

async function smokeCleanPathApproved(browser) {
  const name = 'SMOKE-CLEAN-PATH-APPROVED';
  try {
    await withPage(browser, async (page) => {
      await page.goto(FILE_URL, { waitUntil: 'domcontentloaded', timeout: 15000 });
      await applyApprovedFixture(page);
      await clickCalculate(page);
      const output = await getOutput(page);
      assert.ok(output !== '', 'Expected non-empty output');
      assert.ok(output.includes('approved-recipe'), 'Expected approved-recipe for clean path, got: ' + output.substring(0, 300));
    });
    pass(name);
  } catch (err) { fail(name, err); }
}

async function smokeStaleStorageNoPrerender(browser) {
  const name = 'SMOKE-STALE-STORAGE-NO-PRERENDER';
  try {
    await withPage(browser, async (page) => {
      await page.goto(FILE_URL, { waitUntil: 'domcontentloaded', timeout: 15000 });
      await page.evaluate(() => {
        try {
          localStorage.setItem('perukar_state', JSON.stringify({
            status: 'APPROVED', productionReady: true,
            finalFormula: 'FAKE_STALE', 'approved-recipe': true
          }));
          localStorage.setItem('perukar_result', JSON.stringify({ status: 'APPROVED', approved: true }));
        } catch (e) { /* localStorage unavailable on file:// = safe */ }
      });
      await page.reload({ waitUntil: 'domcontentloaded', timeout: 15000 });
      const output = await getOutput(page);
      assert.strictEqual(output, '', 'Expected #output empty after reload with stale storage, got: ' + output.substring(0, 200));
    });
    pass(name);
  } catch (err) { fail(name, err); }
}

async function smokeForbiddenFieldsNotInOutput(browser) {
  const name = 'SMOKE-FORBIDDEN-FIELDS-NOT-IN-OUTPUT';
  try {
    await withPage(browser, async (page) => {
      await page.goto(FILE_URL, { waitUntil: 'domcontentloaded', timeout: 15000 });
      await applyApprovedFixture(page);
      await clickCalculate(page);
      const output = await getOutput(page);
      assert.ok(output !== '', 'Expected non-empty output');
      assert.ok(output.includes('approved-recipe'), 'Expected approved-recipe before forbidden-field check, got: ' + output.substring(0, 300));
      const forbidden = ['dyeMass', 'oxidizerMass', 'notForMixing', 'threeZonePreviewOnly', 'endsRecipeReady'];
      for (const field of forbidden) {
        assert.ok(!output.includes(field), 'Forbidden internal field in APPROVED output: ' + field);
      }
    });
    pass(name);
  } catch (err) { fail(name, err); }
}

async function smokeNoConsoleErrors(browser) {
  const name = 'SMOKE-NO-CONSOLE-ERRORS';
  try {
    await withPage(browser, async (page) => {
      const errors = [];
      page.on('console', msg => { if (msg.type() === 'error') errors.push(msg.text()); });
      page.on('pageerror', err => { errors.push('pageerror: ' + String(err)); });
      await page.goto(FILE_URL, { waitUntil: 'domcontentloaded', timeout: 15000 });
      await applyApprovedFixture(page);
      await clickCalculate(page);
      assert.strictEqual(errors.length, 0, 'Expected no console errors, got: ' + errors.join('; '));
    });
    pass(name);
  } catch (err) { fail(name, err); }
}

async function main() {
  console.log('=== PERUKAR REAL BROWSER SMOKE ===');
  console.log('URL:', FILE_URL);
  console.log('');

  let browser;
  try {
    browser = await chromium.launch({ headless: true });
  } catch (err) {
    console.error('FATAL: Could not launch Chromium browser.');
    console.error('Run: npx playwright install chromium');
    console.error('Error:', String(err));
    process.exit(1);
  }

  try {
    await smokePageLoadOutputEmpty(browser);
    await smokeAllergyYesBlocked(browser);
    await smokeScalpIrritatedBlocked(browser);
    await smokeAllergyUnknownManual(browser);
    await smokeCleanPathApproved(browser);
    await smokeStaleStorageNoPrerender(browser);
    await smokeForbiddenFieldsNotInOutput(browser);
    await smokeNoConsoleErrors(browser);
  } finally {
    await browser.close();
  }

  console.log('');
  console.log('=== RESULTS ===');
  console.log('PASS: ' + passed + ' / ' + (passed + failed));
  if (failed > 0) {
    console.error('FAIL: ' + failed + ' test(s) failed');
    results.filter(r => !r.ok).forEach(r => {
      console.error('  FAIL ' + r.name + ': ' + r.err);
    });
    process.exit(1);
  } else {
    console.log('ALL TESTS PASSED');
    process.exit(0);
  }
}

main().catch(err => {
  console.error('FATAL error in test runner:', err);
  process.exit(2);
});
