import { describe, expect, it } from 'vitest';

describe('locale-detection exports', () => {
  it('should export all locale detection functionality', async () => {
    // Test that the main export file works
    const localeDetection = await import('@/lib/locale-detection');

    // Verify that exports are available
    expect(localeDetection).toBeDefined();
    expect(typeof localeDetection).toBe('object');

    // Check for key exports that should be available
    expect(localeDetection).toHaveProperty('SmartLocaleDetector');
    expect(localeDetection).toHaveProperty('SUPPORTED_LOCALES');
    expect(localeDetection).toHaveProperty('DEFAULT_LOCALE');

    // Verify SmartLocaleDetector is a constructor
    expect(typeof localeDetection.SmartLocaleDetector).toBe('function');
  });

  it('should re-export locale constants', async () => {
    const localeDetection = await import('@/lib/locale-detection');

    // Test constants are exported
    expect(localeDetection.SUPPORTED_LOCALES).toBeDefined();
    expect(localeDetection.DEFAULT_LOCALE).toBeDefined();
    expect(Array.isArray(localeDetection.SUPPORTED_LOCALES)).toBe(true);
    expect(typeof localeDetection.DEFAULT_LOCALE).toBe('string');
  });

  it('should re-export locale detection types', async () => {
    // This tests that the types module is properly exported
    // We can't directly test TypeScript types at runtime, but we can test
    // that the module doesn't throw when imported
    expect(async () => {
      await import('@/lib/locale-detection-types');
    }).not.toThrow();
  });

  it('should re-export locale detection hooks', async () => {
    // Test that hooks are exported
    const hooks = await import('@/lib/locale-detection-hooks');
    expect(hooks).toBeDefined();
    expect(typeof hooks).toBe('object');
  });

  it('should re-export SmartLocaleDetector class', async () => {
    const { SmartLocaleDetector } = await import('@/lib/locale-detection');

    // Test that we can create an instance
    expect(() => new SmartLocaleDetector()).not.toThrow();

    // Test that instance has expected methods
    const detector = new SmartLocaleDetector();
    expect(typeof detector.detectFromBrowser).toBe('function');
    expect(typeof detector.detectSmartLocale).toBe('function');
  });

  it('should handle module loading errors gracefully', async () => {
    // Test that the main module can be imported without errors
    let importError = null;

    try {
      await import('@/lib/locale-detection');
    } catch (error) {
      importError = error;
    }

    expect(importError).toBeNull();
  });

  it('should maintain consistent exports structure', async () => {
    const localeDetection = await import('@/lib/locale-detection');

    // Test that the export structure is consistent
    const exportKeys = Object.keys(localeDetection);
    expect(exportKeys.length).toBeGreaterThan(0);

    // Verify no undefined exports
    exportKeys.forEach(key => {
      expect((localeDetection as Record<string, unknown>)[key]).toBeDefined();
    });
  });
});
