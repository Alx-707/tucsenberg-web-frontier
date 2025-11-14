#!/usr/bin/env node

/**
 * Translation Validation Script
 *
 * Validates that critical.json and deferred.json:
 * 1. Contain all required keys
 * 2. Have no duplicate keys
 * 3. Have consistent structure across all locales
 *
 * Usage: node scripts/validate-translations.js
 */

const fs = require('fs');
const path = require('path');

/**
 * Get all keys from a nested object (recursively)
 */
function getAllKeys(obj, prefix = '') {
  const keys = [];

  for (const [key, value] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;

    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      keys.push(...getAllKeys(value, fullKey));
    } else {
      keys.push(fullKey);
    }
  }

  return keys;
}

/**
 * Validate translations for a specific locale
 */
function validateLocale(locale) {
  console.log(`\n📦 Validating locale: ${locale}`);

  const criticalPath = path.join(
    __dirname,
    '..',
    'messages',
    locale,
    'critical.json',
  );
  const deferredPath = path.join(
    __dirname,
    '..',
    'messages',
    locale,
    'deferred.json',
  );

  // Check if files exist
  if (!fs.existsSync(criticalPath)) {
    console.error(`   ❌ Error: critical.json not found: ${criticalPath}`);
    return false;
  }

  if (!fs.existsSync(deferredPath)) {
    console.error(`   ❌ Error: deferred.json not found: ${deferredPath}`);
    return false;
  }

  // Read files
  const critical = JSON.parse(fs.readFileSync(criticalPath, 'utf-8'));
  const deferred = JSON.parse(fs.readFileSync(deferredPath, 'utf-8'));

  // Get all keys
  const criticalKeys = getAllKeys(critical);
  const deferredKeys = getAllKeys(deferred);

  console.log(`   Critical keys: ${criticalKeys.length}`);
  console.log(`   Deferred keys: ${deferredKeys.length}`);
  console.log(`   Total keys: ${criticalKeys.length + deferredKeys.length}`);

  // Check for duplicate keys
  const criticalSet = new Set(criticalKeys);
  const deferredSet = new Set(deferredKeys);

  const duplicates = criticalKeys.filter((key) => deferredSet.has(key));

  if (duplicates.length > 0) {
    console.error(`   ❌ Error: Found ${duplicates.length} duplicate keys:`);
    duplicates.slice(0, 10).forEach((key) => console.error(`      - ${key}`));
    if (duplicates.length > 10) {
      console.error(`      ... and ${duplicates.length - 10} more`);
    }
    return false;
  }

  console.log(`   ✅ No duplicate keys found`);

  return {
    locale,
    criticalKeys: criticalSet,
    deferredKeys: deferredSet,
    totalKeys: criticalKeys.length + deferredKeys.length,
  };
}

/**
 * Compare keys across locales
 */
function compareLocales(localeData) {
  console.log('\n🔍 Comparing locales...');

  const locales = Object.keys(localeData);

  if (locales.length < 2) {
    console.log('   ⚠️  Only one locale found, skipping comparison');
    return true;
  }

  const [firstLocale, ...otherLocales] = locales;
  const firstData = localeData[firstLocale];

  let allMatch = true;

  for (const locale of otherLocales) {
    const data = localeData[locale];

    // Check if total keys match
    if (data.totalKeys !== firstData.totalKeys) {
      console.error(
        `   ❌ Error: ${locale} has ${data.totalKeys} keys, but ${firstLocale} has ${firstData.totalKeys} keys`,
      );
      allMatch = false;
      continue;
    }

    // Check if all keys match
    const allKeys = new Set([...data.criticalKeys, ...data.deferredKeys]);
    const firstAllKeys = new Set([
      ...firstData.criticalKeys,
      ...firstData.deferredKeys,
    ]);

    const missingInLocale = [...firstAllKeys].filter(
      (key) => !allKeys.has(key),
    );
    const extraInLocale = [...allKeys].filter((key) => !firstAllKeys.has(key));

    if (missingInLocale.length > 0) {
      console.error(
        `   ❌ Error: ${locale} is missing ${missingInLocale.length} keys:`,
      );
      missingInLocale
        .slice(0, 5)
        .forEach((key) => console.error(`      - ${key}`));
      if (missingInLocale.length > 5) {
        console.error(`      ... and ${missingInLocale.length - 5} more`);
      }
      allMatch = false;
    }

    if (extraInLocale.length > 0) {
      console.error(
        `   ❌ Error: ${locale} has ${extraInLocale.length} extra keys:`,
      );
      extraInLocale
        .slice(0, 5)
        .forEach((key) => console.error(`      - ${key}`));
      if (extraInLocale.length > 5) {
        console.error(`      ... and ${extraInLocale.length - 5} more`);
      }
      allMatch = false;
    }

    if (missingInLocale.length === 0 && extraInLocale.length === 0) {
      console.log(`   ✅ ${locale} matches ${firstLocale}`);
    }
  }

  return allMatch;
}

/**
 * Main execution
 */
function main() {
  console.log('🚀 Translation Validation');
  console.log('==========================');

  const locales = require('../i18n-locales.config').locales;
  const localeData = {};
  let allValid = true;

  // Validate each locale
  for (const locale of locales) {
    const result = validateLocale(locale);

    if (!result) {
      allValid = false;
    } else {
      localeData[locale] = result;
    }
  }

  if (!allValid) {
    console.error('\n❌ Validation failed!\n');
    process.exit(1);
  }

  // Compare locales
  const localesMatch = compareLocales(localeData);

  if (!localesMatch) {
    console.error('\n❌ Locales do not match!\n');
    process.exit(1);
  }

  console.log('\n✅ All validations passed!');
  console.log('\nSummary:');
  console.log('--------');

  for (const [locale, data] of Object.entries(localeData)) {
    console.log(
      `${locale.toUpperCase()}: ${data.totalKeys} total keys (${data.criticalKeys.size} critical + ${data.deferredKeys.size} deferred)`,
    );
  }

  console.log(
    '\n💡 Translation files are valid and consistent across all locales.\n',
  );
}

// Run the script
if (require.main === module) {
  try {
    main();
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

module.exports = { validateLocale, compareLocales, getAllKeys };
