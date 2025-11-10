/**
 * i18n Shape Consistency Check
 *
 * Goals:
 * 1) Ensure messages/en.json and messages/zh.json have identical leaf key shapes (dot-paths)
 * 2) Ensure messages/{locale}/critical.json + deferred.json union equals messages/{locale}.json
 * 3) Ensure public/messages/{locale}/{critical,deferred}.json union equals messages/{locale}/{critical,deferred}.json union
 *
 * Exit code: 0 on success, 1 on any mismatch
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

async function main() {
  const result = { ok: true, issues: [] };

  try {
    const locales = ['en', 'zh'];

    // Load full sources
    const full = {};
    for (const locale of locales) {
      const p = path.join(ROOT, 'messages', `${locale}.json`);
      full[locale] = await readJson(p);
    }

    // Compare full shapes
    const enLeaf = asSet(collectLeafPaths(full.en));
    const zhLeaf = asSet(collectLeafPaths(full.zh));

    const enMinusZh = diffSets(enLeaf, zhLeaf);
    const zhMinusEn = diffSets(zhLeaf, enLeaf);

    if (enMinusZh.length || zhMinusEn.length) {
      result.ok = false;
      result.issues.push({
        type: 'shape-mismatch-full',
        message: 'messages/en.json and messages/zh.json leaf key sets differ',
        missingInZh: enMinusZh.slice(0, 50),
        missingInEn: zhMinusEn.slice(0, 50),
        missingInZhCount: enMinusZh.length,
        missingInEnCount: zhMinusEn.length,
      });
    }

    // For each locale, validate split (critical+deferred) matches full
    for (const locale of locales) {
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
        result.issues.push({
          type: 'split-vs-full-mismatch',
          locale,
          message: `messages/${locale}/{critical,deferred}.json union != messages/${locale}.json`,
          extraInSplit: srcMinusFull.slice(0, 50),
          missingInSplit: fullMinusSrc.slice(0, 50),
          extraInSplitCount: srcMinusFull.length,
          missingInSplitCount: fullMinusSrc.length,
        });
      }

      // public vs src split (optional if public not generated yet)
      const hasPubCritical = fs.existsSync(pubCriticalPath);
      const hasPubDeferred = fs.existsSync(pubDeferredPath);
      if (hasPubCritical && hasPubDeferred) {
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
          result.issues.push({
            type: 'public-vs-src-split-mismatch',
            locale,
            message: `public/messages/${locale}/{critical,deferred}.json union != messages/${locale}/{critical,deferred}.json union`,
            extraInPublic: pubMinusSrc.slice(0, 50),
            missingInPublic: srcMinusPub.slice(0, 50),
            extraInPublicCount: pubMinusSrc.length,
            missingInPublicCount: srcMinusPub.length,
          });
        }
      } else {
        console.warn(
          `[i18n-shape-check] public/messages/${locale} not found; skip public parity sub-check`,
        );
      }
    }

    await ensureDir(REPORT_DIR);
    await fsp.writeFile(REPORT_PATH, JSON.stringify(result, null, 2), 'utf-8');

    if (!result.ok) {
      console.error('❌ i18n shape check failed');
      for (const issue of result.issues) {
        console.error(
          '-',
          issue.type,
          issue.locale ? `(locale: ${issue.locale})` : '',
          issue.message,
        );
        if (issue.missingInZhCount)
          console.error('  missingInZhCount:', issue.missingInZhCount);
        if (issue.missingInEnCount)
          console.error('  missingInEnCount:', issue.missingInEnCount);
        if (issue.missingInSplitCount !== undefined)
          console.error('  missingInSplitCount:', issue.missingInSplitCount);
        if (issue.extraInSplitCount !== undefined)
          console.error('  extraInSplitCount:', issue.extraInSplitCount);
        if (issue.missingInPublicCount !== undefined)
          console.error('  missingInPublicCount:', issue.missingInPublicCount);
        if (issue.extraInPublicCount !== undefined)
          console.error('  extraInPublicCount:', issue.extraInPublicCount);
      }
      process.exit(1);
    } else {
      console.log('✅ i18n shape check passed');
      process.exit(0);
    }
  } catch (err) {
    console.error('❌ i18n shape check crashed:', err?.message || err);
    try {
      await ensureDir(REPORT_DIR);
      await fsp.writeFile(
        REPORT_PATH,
        JSON.stringify({ ok: false, crash: String(err) }, null, 2),
        'utf-8',
      );
    } catch {}
    process.exit(1);
  }
}

main();
