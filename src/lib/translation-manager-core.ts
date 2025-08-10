import {
    DETECTION_SCORING,
    PERFORMANCE_THRESHOLDS,
} from '@/constants/i18n-constants';
import { Locale } from '@/types/i18n';
import {
    LocaleQualityReport,
    QualityIssue,
    QualityReport,
    QualityScore,
    QualityTrend,
    QualityTrendReport,
    TranslationManagerConfig,
    TranslationQualityCheck,
    ValidationReport,
} from '@/types/translation-manager';
import { TranslationQualityChecker } from './translation-quality-checker';
import {
    calculateConfidence,
    flattenTranslations,
    generateRecommendations,
    generateSuggestions,
    getNestedValue,
    isEmptyTranslation,
} from './translation-utils';

/**
 * 翻译管理器核心类
 */
export class TranslationManagerCore implements TranslationQualityCheck {
  private config: TranslationManagerConfig;
  private translations: Partial<Record<Locale, Record<string, unknown>>> = {};
  private qualityChecker: TranslationQualityChecker;

  /**
   * 安全地获取指定语言的翻译数据
   * 使用类型安全的方式避免 Object Injection Sink
   */
  private getTranslationsForLocale(locale: Locale): Record<string, unknown> {
    // 使用 switch 语句替代动态属性访问
    switch (locale) {
      case 'en':
        return this.translations.en || {};
      case 'zh':
        return this.translations.zh || {};
      default:
        return {};
    }
  }

  /**
   * 安全地设置指定语言的翻译数据
   */
  private setTranslationsForLocale(locale: Locale, translations: Record<string, unknown>): void {
    // 使用 switch 语句替代动态属性访问
    switch (locale) {
      case 'en':
        this.translations.en = translations;
        break;
      case 'zh':
        this.translations.zh = translations;
        break;
      default:
        // 不支持的语言，忽略
        break;
    }
  }

  /**
   * 安全地设置质量评分数据
   */
  private setQualityScoreForLocale(
    byLocale: Record<Locale, QualityScore>,
    locale: Locale,
    score: QualityScore
  ): void {
    // 使用 switch 语句替代动态属性访问
    switch (locale) {
      case 'en':
        byLocale.en = score;
        break;
      case 'zh':
        byLocale.zh = score;
        break;
      default:
        // 不支持的语言，忽略
        break;
    }
  }

  /**
   * 安全地设置翻译结果
   * 验证键名以防止 Object Injection Sink
   */
  private setTranslationResult(
    result: Record<string, string>,
    key: string,
    translation: string
  ): void {
    // 验证键名格式，只允许字母、数字、点、下划线和连字符
    if (!/^[a-zA-Z0-9._-]+$/.test(key)) {
      return;
    }

    // 限制键名长度
    if (key.length > 100) {
      return;
    }

    // 使用 Object.defineProperty 安全地设置属性
    Object.defineProperty(result, key, {
      value: translation,
      writable: true,
      enumerable: true,
      configurable: true,
    });
  }

  /**
   * 安全地获取扁平化翻译值
   */
  private getTranslationValue(flatTranslations: Record<string, string>, key: string): string | undefined {
    // 验证键名格式
    if (!/^[a-zA-Z0-9._-]+$/.test(key)) {
      return undefined;
    }

    // 限制键名长度
    if (key.length > 200) {
      return undefined;
    }

    // 使用安全的方式获取属性
    if (Object.prototype.hasOwnProperty.call(flatTranslations, key)) {
      return Object.getOwnPropertyDescriptor(flatTranslations, key)?.value;
    }

    return undefined;
  }

  constructor(config: TranslationManagerConfig) {
    this.config = config;
    this.qualityChecker = new TranslationQualityChecker(config, this.translations);
  }

  /**
   * 初始化翻译管理器
   */
  async initialize(): Promise<void> {
    await this.loadTranslations();

    if (this.config.lingo.enabled) {
      await this.initializeLingoIntegration();
    }
  }

  /**
   * 加载翻译文件
   */
  private async loadTranslations(): Promise<void> {
    const fs = await import('fs');
    const path = await import('path');

    for (const locale of this.config.locales) {
      const filePath = path.join(this.config.messagesDir, `${locale}.json`);

      try {
        const content = fs.readFileSync(filePath, 'utf8');
        this.setTranslationsForLocale(locale, JSON.parse(content));
      } catch (error) {
        console.warn(`Failed to load translations for ${locale}:`, error);
        this.setTranslationsForLocale(locale, {});
      }
    }

    // 更新质量检查器的翻译数据
    this.qualityChecker = new TranslationQualityChecker(this.config, this.translations);
  }

  /**
   * 初始化Lingo.dev集成
   */
  private initializeLingoIntegration(): void {
    if (!this.config.lingo.apiKey || !this.config.lingo.projectId) {
      console.warn(
        'Lingo.dev integration enabled but missing API key or project ID',
      );
      return;
    }

    // 这里可以添加Lingo.dev API的初始化逻辑
    // 初始化完成，不需要额外的日志输出
  }

  /**
   * 检查Lingo.dev翻译质量
   */
  async checkLingoTranslation(
    key: string,
    aiTranslation: string,
    humanTranslation?: string,
  ): Promise<QualityScore> {
    return this.qualityChecker.checkLingoTranslation(key, aiTranslation, humanTranslation);
  }

  /**
   * 验证翻译一致性
   */
  async validateTranslationConsistency(
    translations: Record<string, string>,
  ): Promise<ValidationReport> {
    return this.qualityChecker.validateTranslationConsistency(translations);
  }

  /**
   * 生成质量报告
   */
  async generateQualityReport(): Promise<QualityReport> {
    const byLocale: Record<Locale, QualityScore> = {} as Record<
      Locale,
      QualityScore
    >;
    const allIssues: QualityIssue[] = [];

    // 为每个语言生成质量评分
    for (const locale of this.config.locales) {
      const localeTranslations = this.getTranslationsForLocale(locale);
      const localeIssues: QualityIssue[] = [];
      let localeScore = 100;

      // 检查翻译完整性
      const totalKeys = this.qualityChecker.getTotalTranslationKeys();
      const translatedKeys = Object.keys(
        flattenTranslations(localeTranslations),
      ).length;
      const completeness = translatedKeys / totalKeys;

      if (completeness < DETECTION_SCORING.USER_PREFERENCE_WEIGHT) {
        localeIssues.push({
          type: 'consistency',
          severity: 'medium',
          message: `Translation completeness is ${(completeness * 100).toFixed(1)}%`,
        });
        localeScore -=
          (1 - completeness) * PERFORMANCE_THRESHOLDS.MAX_MEMORY_USAGE;
      }

      this.setQualityScoreForLocale(byLocale, locale, {
        score: Math.max(0, localeScore),
        confidence: calculateConfidence(localeIssues),
        issues: localeIssues,
        suggestions: generateSuggestions(localeIssues),
      });

      allIssues.push(...localeIssues);
    }

    // 计算整体评分
    const overallScore =
      Object.values(byLocale).reduce((sum, score) => sum + score.score, 0) /
      this.config.locales.length;

    return {
      overall: {
        score: overallScore,
        confidence: calculateConfidence(allIssues),
        issues: allIssues,
        suggestions: generateSuggestions(allIssues),
      },
      byLocale,
      trends: await this.getQualityTrends(),
      recommendations: generateRecommendations(allIssues),
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * 获取质量趋势
   */
  private async getQualityTrends(): Promise<QualityTrend[]> {
    // 这里可以实现质量趋势分析
    // 例如从历史数据中获取质量变化趋势
    return [];
  }

  /**
   * 验证翻译质量
   */
  async validateTranslationQuality(locale: string): Promise<LocaleQualityReport> {
    const translations = this.getTranslationsForLocale(locale as Locale);
    const flatTranslations = flattenTranslations(translations);

    const issues: QualityIssue[] = [];
    let validKeys = 0;

    // 获取所有语言环境的键来检测缺失翻译
    const allKeys = new Set<string>();
    for (const loc of this.config.locales) {
      const locTranslations = this.getTranslationsForLocale(loc);
      const locFlat = flattenTranslations(locTranslations);
      Object.keys(locFlat).forEach(key => allKeys.add(key));
    }

    const totalKeys = allKeys.size;

    // 检查缺失翻译和过长翻译
    for (const key of allKeys) {
      const value = this.getTranslationValue(flatTranslations, key);

      if (!value || isEmptyTranslation(value as string)) {
        issues.push({
          type: 'missing',
          key,
          severity: 'high',
          message: `Missing translation for key: ${key}`,
          locale: locale as Locale,
        });
      } else {
        validKeys++;

        // 检查过长翻译
        if (typeof value === 'string' && value.length > 200) {
          issues.push({
            type: 'length',
            key,
            severity: 'medium',
            message: `Translation too long: ${value.length} characters`,
            locale: locale as Locale,
          });
        }
      }
    }

    const score = Math.max(0, 1 - (issues.length * 0.1));

    return {
      locale: locale as Locale,
      totalKeys,
      validKeys,
      score,
      issues,
      timestamp: new Date().toISOString(),
      confidence: calculateConfidence(issues),
      suggestions: generateSuggestions(issues),
    };
  }

  /**
   * 验证所有语言环境
   */
  async validateAllLocales(): Promise<LocaleQualityReport[]> {
    const reports: LocaleQualityReport[] = [];

    for (const locale of this.config.locales) {
      const report = await this.validateTranslationQuality(locale);
      reports.push(report);
    }

    return reports;
  }

  /**
   * 获取质量趋势
   */
  async getQualityTrend(locale: string, days: number): Promise<QualityTrendReport> {
    // 模拟历史数据
    const dataPoints: QualityTrend[] = [];
    const now = new Date();

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);

      dataPoints.push({
        date: date.toISOString().split('T')[0],
        score: Math.random() * 0.3 + 0.7, // 0.7-1.0 range
        keyCount: Math.floor(Math.random() * 100) + 50, // 50-150 range
        locale: locale as Locale,
      });
    }

    return {
      locale: locale as Locale,
      period: days,
      dataPoints,
    };
  }

  /**
   * 根据键和语言获取翻译
   */
  getTranslation(key: string, locale: Locale): string {
    if (!key || typeof key !== 'string') {
      return key || '';
    }

    // 获取指定语言的翻译
    const localeTranslations = this.getTranslationsForLocale(locale);
    let translation = getNestedValue(localeTranslations, key);

    // 如果翻译不存在或为空，回退到默认语言
    if (!translation && locale !== this.config.defaultLocale) {
      const defaultTranslations = this.getTranslationsForLocale(this.config.defaultLocale);
      translation = getNestedValue(defaultTranslations, key);
    }

    // 如果仍然没有翻译或翻译为空字符串，返回键名
    return translation && translation.trim() !== '' ? translation : key;
  }

  /**
   * 批量获取翻译
   */
  getBatchTranslations(keys: string[], locale: Locale): Record<string, string> {
    const result: Record<string, string> = {};

    for (const key of keys) {
      const translation = this.getTranslation(key, locale);
      this.setTranslationResult(result, key, translation);
    }

    return result;
  }

  /**
   * 获取配置
   */
  getConfig(): TranslationManagerConfig {
    return { ...this.config };
  }

  /**
   * 获取所有翻译数据
   */
  getAllTranslations(): Partial<Record<Locale, Record<string, unknown>>> {
    return { ...this.translations };
  }

  /**
   * 重新加载翻译
   */
  async reloadTranslations(): Promise<void> {
    await this.loadTranslations();
  }

  /**
   * 清除缓存
   */
  clearCache(): void {
    this.qualityChecker.clearQualityCache();
  }

  /**
   * 获取缓存统计
   */
  getCacheStats(): { size: number; hitRate: number } {
    return this.qualityChecker.getCacheStats();
  }
}
