/**
 * i18n Shape Consistency Check
 *
 * Goals:
 * 1) Ensure messages/en.json and messages/zh.json have identical leaf key shapes (dot-paths)
 * 2) Ensure messages/{locale}/critical.json + deferred.json union equals messages/{locale}.json
 * 3) Ensure public/messages/{locale}/{critical,deferred}.json union equals messages/{locale}/{critical,deferred}.json union
 * 4) Ensure en/critical.json keys match zh/critical.json keys (and same for deferred)
 *
 * Exit code: 0 on success, 1 on any mismatch
 *
 * CI Integration:
 * - Run via `pnpm i18n:shape:check` as blocking gate
 * - Outputs structured JSON report to reports/i18n-shape-report.json
 * - Console output provides human-readable summary
 */

const fs = require('fs');
const fsp = require('fs').promises;
const path = require('path');

const ROOT = path.join(__dirname, '..');
const REPORT_DIR = path.join(ROOT, 'reports');
const REPORT_PATH = path.join(REPORT_DIR, 'i18n-shape-report.json');

function isObject(v) {
  return v !== null && typeof v === 'object' && !Array.isArray(v);
}

function collectLeafPaths(obj, prefix = '') {
  const out = [];
  if (!isObject(obj)) return out; // non-object root => no keys
  for (const [k, v] of Object.entries(obj)) {
    const p = prefix ? `${prefix}.${k}` : k;
    if (isObject(v)) {
      out.push(...collectLeafPaths(v, p));
    } else {
      // treat any non-object as a leaf (strings for next-intl; tolerate number/boolean/null)
      out.push(p);
    }
  }
  return out;
}

async function readJson(p) {
  const s = await fsp.readFile(p, 'utf-8');
  return JSON.parse(s);
}

function asSet(arr) {
  return new Set(arr);
}

function diffSets(a, b) {
  // return a - b
  const out = [];
  for (const x of a) if (!b.has(x)) out.push(x);
  return out;
}

async function ensureDir(p) {
  if (!fs.existsSync(p)) {
    await fsp.mkdir(p, { recursive: true });
  }
}

/**
 * Compare split files (critical/deferred) between en and zh locales.
 * This ensures type safety as the types are derived from en/*.json files.
 */
async function compareSplitFiles(result, locales) {
  const splitTypes = ['critical', 'deferred'];

  for (const splitType of splitTypes) {
    const splitData = {};

    for (const locale of locales) {
      const filePath = path.join(ROOT, 'messages', locale, `${splitType}.json`);
      try {
        splitData[locale] = await readJson(filePath);
      } catch (err) {
        result.ok = false;
        result.issues.push({
          type: 'file-read-error',
          locale,
          file: `${splitType}.json`,
          message: `Failed to read messages/${locale}/${splitType}.json: ${err.message}`,
        });
        return;
      }
    }

    // Compare en vs zh for this split type
    const enKeys = asSet(collectLeafPaths(splitData.en));
    const zhKeys = asSet(collectLeafPaths(splitData.zh));

    const enMinusZh = diffSets(enKeys, zhKeys);
    const zhMinusEn = diffSets(zhKeys, enKeys);

    if (enMinusZh.length || zhMinusEn.length) {
      result.ok = false;
      result.issues.push({
        type: `${splitType}-shape-mismatch`,
        message: `messages/en/${splitType}.json and messages/zh/${splitType}.json leaf key sets differ`,
        missingInZh: enMinusZh.slice(0, 50),
        missingInEn: zhMinusEn.slice(0, 50),
        missingInZhCount: enMinusZh.length,
        missingInEnCount: zhMinusEn.length,
      });
    }
  }
}

async function main() {
  const startTime = Date.now();
  const result = {
    ok: true,
    timestamp: new Date().toISOString(),
    duration: 0,
    summary: {
      totalChecks: 0,
      passedChecks: 0,
      failedChecks: 0,
    },
    issues: [],
  };

  try {
    const locales = require('../i18n-locales.config').locales;

    // Load full sources
    const full = {};
    for (const locale of locales) {
      const p = path.join(ROOT, 'messages', `${locale}.json`);
      full[locale] = await readJson(p);
    }

    // Check 1: Compare full shapes (en.json vs zh.json)
    result.summary.totalChecks++;
    const enLeaf = asSet(collectLeafPaths(full.en));
    const zhLeaf = asSet(collectLeafPaths(full.zh));

    const enMinusZh = diffSets(enLeaf, zhLeaf);
    const zhMinusEn = diffSets(zhLeaf, enLeaf);

    if (enMinusZh.length || zhMinusEn.length) {
      result.ok = false;
      result.summary.failedChecks++;
      result.issues.push({
        type: 'shape-mismatch-full',
        message: 'messages/en.json and messages/zh.json leaf key sets differ',
        missingInZh: enMinusZh.slice(0, 50),
        missingInEn: zhMinusEn.slice(0, 50),
        missingInZhCount: enMinusZh.length,
        missingInEnCount: zhMinusEn.length,
      });
    } else {
      result.summary.passedChecks++;
    }

    // Check 2: Compare split files (critical/deferred) between locales
    result.summary.totalChecks += 2; // critical + deferred
    const issueCountBefore = result.issues.length;
    await compareSplitFiles(result, locales);
    const newIssues = result.issues.length - issueCountBefore;
    result.summary.passedChecks += 2 - newIssues;
    result.summary.failedChecks += newIssues;

    // Check 3: For each locale, validate split (critical+deferred) matches full
    for (const locale of locales) {
      result.summary.totalChecks++;
      const srcCriticalPath = path.join(
        ROOT,
        'messages',
        locale,
        'critical.json',
      );
      const srcDeferredPath = path.join(
        ROOT,
        'messages',
        locale,
        'deferred.json',
      );
      const pubCriticalPath = path.join(
        ROOT,
        'public',
        'messages',
        locale,
        'critical.json',
      );
      const pubDeferredPath = path.join(
        ROOT,
        'public',
        'messages',
        locale,
        'deferred.json',
      );

      const srcCritical = await readJson(srcCriticalPath);
      const srcDeferred = await readJson(srcDeferredPath);

      const srcSet = asSet([
        ...collectLeafPaths(srcCritical),
        ...collectLeafPaths(srcDeferred),
      ]);
      const fullSet = asSet(collectLeafPaths(full[locale]));

      // src split vs full
      const srcMinusFull = diffSets(srcSet, fullSet);
      const fullMinusSrc = diffSets(fullSet, srcSet);
      if (srcMinusFull.length || fullMinusSrc.length) {
        result.ok = false;
        result.summary.failedChecks++;
        result.issues.push({
          type: 'split-vs-full-mismatch',
          locale,
          message: `messages/${locale}/{critical,deferred}.json union != messages/${locale}.json`,
          extraInSplit: srcMinusFull.slice(0, 50),
          missingInSplit: fullMinusSrc.slice(0, 50),
          extraInSplitCount: srcMinusFull.length,
          missingInSplitCount: fullMinusSrc.length,
        });
      } else {
        result.summary.passedChecks++;
      }

      // Check 4: public vs src split (optional if public not generated yet)
      const hasPubCritical = fs.existsSync(pubCriticalPath);
      const hasPubDeferred = fs.existsSync(pubDeferredPath);
      if (hasPubCritical && hasPubDeferred) {
        result.summary.totalChecks++;
        const pubCritical = await readJson(pubCriticalPath);
        const pubDeferred = await readJson(pubDeferredPath);
        const pubSet = asSet([
          ...collectLeafPaths(pubCritical),
          ...collectLeafPaths(pubDeferred),
        ]);

        const pubMinusSrc = diffSets(pubSet, srcSet);
        const srcMinusPub = diffSets(srcSet, pubSet);
        if (pubMinusSrc.length || srcMinusPub.length) {
          result.ok = false;
          result.summary.failedChecks++;
          result.issues.push({
            type: 'public-vs-src-split-mismatch',
            locale,
            message: `public/messages/${locale}/{critical,deferred}.json union != messages/${locale}/{critical,deferred}.json union`,
            extraInPublic: pubMinusSrc.slice(0, 50),
            missingInPublic: srcMinusPub.slice(0, 50),
            extraInPublicCount: pubMinusSrc.length,
            missingInPublicCount: srcMinusPub.length,
          });
        } else {
          result.summary.passedChecks++;
        }
      } else {
        console.warn(
          `[i18n-shape-check] public/messages/${locale} not found; skip public parity sub-check`,
        );
      }
    }

    result.duration = Date.now() - startTime;

    await ensureDir(REPORT_DIR);
    await fsp.writeFile(REPORT_PATH, JSON.stringify(result, null, 2), 'utf-8');

    // Output summary
    console.log('\n=== i18n Shape Check Report ===');
    console.log(`Timestamp: ${result.timestamp}`);
    console.log(`Duration: ${result.duration}ms`);
    console.log(
      `Checks: ${result.summary.passedChecks}/${result.summary.totalChecks} passed`,
    );

    if (!result.ok) {
      console.error('\n❌ i18n shape check failed');
      console.error(`\nIssues found: ${result.issues.length}`);
      for (const issue of result.issues) {
        console.error(
          '\n-',
          issue.type,
          issue.locale ? `(locale: ${issue.locale})` : '',
        );
        console.error('  ', issue.message);
        if (issue.missingInZhCount)
          console.error('  Missing in zh:', issue.missingInZhCount, 'keys');
        if (issue.missingInEnCount)
          console.error('  Missing in en:', issue.missingInEnCount, 'keys');
        if (issue.missingInSplitCount !== undefined)
          console.error(
            '  Missing in split:',
            issue.missingInSplitCount,
            'keys',
          );
        if (issue.extraInSplitCount !== undefined)
          console.error('  Extra in split:', issue.extraInSplitCount, 'keys');
        if (issue.missingInPublicCount !== undefined)
          console.error(
            '  Missing in public:',
            issue.missingInPublicCount,
            'keys',
          );
        if (issue.extraInPublicCount !== undefined)
          console.error('  Extra in public:', issue.extraInPublicCount, 'keys');

        // Show sample keys for debugging
        if (issue.missingInZh?.length) {
          console.error(
            '  Sample missing in zh:',
            issue.missingInZh.slice(0, 5).join(', '),
          );
        }
        if (issue.missingInEn?.length) {
          console.error(
            '  Sample missing in en:',
            issue.missingInEn.slice(0, 5).join(', '),
          );
        }
      }
      console.error(`\nReport saved to: ${REPORT_PATH}`);
      process.exit(1);
    } else {
      console.log('\n✅ i18n shape check passed');
      console.log(`Report saved to: ${REPORT_PATH}`);
      process.exit(0);
    }
  } catch (err) {
    result.duration = Date.now() - startTime;
    console.error('❌ i18n shape check crashed:', err?.message || err);
    try {
      await ensureDir(REPORT_DIR);
      await fsp.writeFile(
        REPORT_PATH,
        JSON.stringify(
          {
            ok: false,
            timestamp: result.timestamp,
            duration: result.duration,
            crash: String(err),
            stack: err?.stack,
          },
          null,
          2,
        ),
        'utf-8',
      );
    } catch {}
    process.exit(1);
  }
}

main();
