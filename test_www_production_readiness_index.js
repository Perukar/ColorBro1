'use strict';
/**
 * test_www_production_readiness_index.js
 *
 * Documentation layer smoke test for docs/production-readiness-index.md.
 *
 * Asserts that the production readiness index:
 *   - exists and is non-empty
 *   - contains all required section headings
 *   - explicitly states key invariants (endsRec inactive, 3-zone inactive,
 *     endsMass null, brand matrix disabled, diagnostic helpers not production
 *     sources, stale persisted output not authoritative)
 *   - lists critical domain names in the matrix
 *   - defines the required status vocabulary
 *
 * This test does NOT assert exact text blocks or large content regions.
 * It is intentionally narrow so it does not become brittle when the document
 * is updated with additional detail.
 *
 * NOTE: This test verifies the documentation layer only.
 * Runtime safety is covered by test_www_render_runtime.js,
 * test_www_business_scenarios.js, test_www_mass_model.js,
 * test_www_mapping.js, and test_www_browser_smoke.js.
 */

const fs = require('fs');
const path = require('path');
const assert = require('assert');

const DOC_PATH = path.resolve(__dirname, 'docs', 'production-readiness-index.md');

// ============================================================
// Load document
// ============================================================

let doc;
try {
    doc = fs.readFileSync(DOC_PATH, 'utf8');
} catch (e) {
    console.error('FAIL: docs/production-readiness-index.md does not exist or cannot be read');
    console.error(e.message);
    process.exit(1);
}

assert.ok(doc.length > 0, 'production-readiness-index.md must not be empty');
console.log('READINESS-INDEX-EXISTS: docs/production-readiness-index.md found (' + doc.length + ' bytes)');

// ============================================================
// Required section headings (by number and title keyword)
// ============================================================

const requiredSections = [
    '## 1.',   // Purpose
    '## 2.',   // Readiness status definitions
    '## 3.',   // Global production invariants
    '## 4.',   // Safety-critical production rules
    '## 5.',   // Domain readiness matrix
    '## 6.',   // Production-ready domains
    '## 7.',   // Safety-ready domains
    '## 8.',   // Manual-only domains
    '## 9.',   // Blocked-only domains
    '## 10.',  // Diagnostic-only domains
    '## 11.',  // Known limitations
    '## 12.',  // Future-forbidden activations
    '## 13.',  // Non-negotiable blockers
    '## 14.',  // Required regression tests
    '## 15.',  // Release checklist
    '## 16.',  // Final invariant summary
];

requiredSections.forEach(function(heading) {
    assert.ok(doc.includes(heading),
        'READINESS-INDEX-SECTIONS: missing required section: ' + heading);
});
console.log('READINESS-INDEX-SECTIONS: all 16 required section headings present');

// ============================================================
// Required status vocabulary
// ============================================================

const requiredStatuses = [
    'PRODUCTION_READY',
    'SAFETY_READY',
    'MANUAL_REQUIRED_ONLY',
    'BLOCKED_ONLY',
    'DIAGNOSTIC_ONLY',
    'CONTRACT_ONLY',
    'KNOWN_LIMITATION',
    'FUTURE_FORBIDDEN',
    'NOT_IMPLEMENTED',
];

requiredStatuses.forEach(function(status) {
    assert.ok(doc.includes(status),
        'READINESS-INDEX-STATUSES: missing required status definition: ' + status);
});
console.log('READINESS-INDEX-STATUSES: all 9 required status definitions present');

// ============================================================
// Critical domain names in matrix
// ============================================================

const requiredDomains = [
    'Runtime fail-safe',
    'UI render safety',
    'Allergy gate',
    'Scalp sensitivity gate',
    'Target direction gate',
    'Mass model 2-zone',
    'Runtime persistence',
    'Browser smoke',
    'Brand matrix',
    'Production third-zone',
    'endsRec',
    'endsMass',
    'Special Blond',
    'Grey coverage',
    'Powder surcharge',
    'Diagnostic-only helpers',
];

requiredDomains.forEach(function(domain) {
    assert.ok(doc.toLowerCase().includes(domain.toLowerCase()),
        'READINESS-INDEX-DOMAINS: missing required domain entry: ' + domain);
});
console.log('READINESS-INDEX-DOMAINS: all critical domain names found in document');

// ============================================================
// Key invariant strings — explicit statements required by task spec
// ============================================================

// production 3-zone is NOT active
assert.ok(
    doc.includes('production 3-zone is NOT active') ||
    doc.includes('production 3-zone activation') ||
    (doc.includes('3-zone') && doc.includes('NOT active')),
    'READINESS-INDEX-INVARIANT-3ZONE: document must explicitly state production 3-zone is not active'
);
console.log('READINESS-INDEX-INVARIANT-3ZONE: 3-zone inactive stated');

// production endsRec is NOT active
assert.ok(
    doc.includes('production endsRec is NOT active') ||
    doc.includes('endsRec is NOT active') ||
    (doc.includes('endsRec') && doc.includes('NOT active')),
    'READINESS-INDEX-INVARIANT-ENDSREC: document must explicitly state production endsRec is not active'
);
console.log('READINESS-INDEX-INVARIANT-ENDSREC: endsRec inactive stated');

// production endsMass remains null
assert.ok(
    doc.includes('endsMass remains null') ||
    doc.includes('endsMass: null') ||
    (doc.includes('endsMass') && doc.includes('null')),
    'READINESS-INDEX-INVARIANT-ENDSMASS: document must explicitly state endsMass remains null'
);
console.log('READINESS-INDEX-INVARIANT-ENDSMASS: endsMass null stated');

// brand matrix is NOT enabled
assert.ok(
    doc.includes('brand matrix is NOT enabled') ||
    doc.includes('hasBrandRuleMatrix') ||
    (doc.includes('brand matrix') && (doc.includes('NOT enabled') || doc.includes('false'))),
    'READINESS-INDEX-INVARIANT-BRAND: document must explicitly state brand matrix is not enabled'
);
console.log('READINESS-INDEX-INVARIANT-BRAND: brand matrix disabled stated');

// diagnostic helpers are not production sources
assert.ok(
    doc.includes('diagnostic helpers are NOT production sources') ||
    doc.includes('diagnostic helpers are not production sources') ||
    (doc.includes('diagnostic') && doc.includes('not production')),
    'READINESS-INDEX-INVARIANT-DIAG: document must state diagnostic helpers are not production sources'
);
console.log('READINESS-INDEX-INVARIANT-DIAG: diagnostic helpers not production sources stated');

// stale persisted output is not authoritative
assert.ok(
    doc.includes('stale persisted output is NOT authoritative') ||
    doc.includes('stale persisted output is not authoritative') ||
    (doc.includes('stale') && doc.includes('persisted') && doc.includes('authoritative')),
    'READINESS-INDEX-INVARIANT-PERSIST: document must state stale persisted output is not authoritative'
);
console.log('READINESS-INDEX-INVARIANT-PERSIST: stale persisted output not authoritative stated');

// brand-specific formulas are NOT production-ready
assert.ok(
    doc.includes('brand-specific formula') || doc.includes('Brand-specific formula'),
    'READINESS-INDEX-INVARIANT-BRAND-FORMULA: document must address brand-specific formula readiness'
);
console.log('READINESS-INDEX-INVARIANT-BRAND-FORMULA: brand-specific formula readiness addressed');

// browser smoke is a safety layer, not a replacement for domain tests
assert.ok(
    doc.includes('browser smoke is a safety layer') ||
    doc.includes('not a replacement for domain tests'),
    'READINESS-INDEX-INVARIANT-SMOKE: document must state browser smoke is a safety layer, not a replacement for domain tests'
);
console.log('READINESS-INDEX-INVARIANT-SMOKE: browser smoke scope stated');

// ============================================================
// Critical test files listed in §14
// ============================================================

const requiredTestFiles = [
    'test_www_render_runtime.js',
    'test_www_business_scenarios.js',
    'test_www_mass_model.js',
    'test_www_mapping.js',
    'test_www_browser_smoke.js',
    'test_www_production_readiness_index.js',
];

requiredTestFiles.forEach(function(tf) {
    assert.ok(doc.includes(tf),
        'READINESS-INDEX-TEST-FILES: missing required test file reference: ' + tf);
});
console.log('READINESS-INDEX-TEST-FILES: all 6 required test file references found');

// ============================================================
// Summary
// ============================================================

console.log('\nAll production readiness index documentation checks passed.');
console.log('NOTE: This test verifies the documentation layer only.');
console.log('Runtime safety is covered by the 5 runtime test files listed in §14.');
