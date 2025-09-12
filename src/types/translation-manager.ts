/**
 * 翻译管理器相关类型定义
 */
import type { Locale } from '@/types/i18n';
;

// 翻译质量评分接口
export interface QualityScore {
  score: number; // 0-100
  confidence: number; // 0-1
  issues: QualityIssue[];
  suggestions: string[];
  // 分类分数
  grammar?: number;
  consistency?: number;
  terminology?: number;
  fluency?: number;
}

// 质量问题接口
export interface QualityIssue {
  type:
    | 'grammar'
    | 'consistency'
    | 'terminology'
    | 'length'
    | 'placeholder'
    | 'context'
    | 'fluency'
    | 'missing'
    | 'language'
    | 'accuracy';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  suggestion?: string;
}

// 验证报告接口
export interface ValidationReport {
  isValid: boolean;
  score: number;
  issues: QualityIssue[];
  recommendations: string[];
  timestamp: string;
}

// 质量报告接口
export interface QualityReport {
  overall: QualityScore;
  byLocale: Record<Locale, QualityScore>;
  trends: QualityTrend[];
  recommendations: string[];
  timestamp: string;
}

// 质量趋势接口
export interface QualityTrend {
  date: string;
  locale: Locale;
  score: number;
  keyCount: number;
}

// 质量趋势报告接口
export interface QualityTrendReport {
  locale: Locale;
  period: number;
  dataPoints: QualityTrend[];
}

// 单个语言环境的质量验证报告
export interface LocaleQualityReport {
  locale: Locale;
  totalKeys: number;
  validKeys: number;
  issues: QualityIssue[];
  score: number;
  timestamp: string;
  confidence: number;
  suggestions: string[];
}

// Lingo.dev集成配置
export interface LingoConfig {
  apiKey?: string;
  projectId?: string;
  baseUrl?: string;
  enabled: boolean;
}

// 翻译管理配置
export interface TranslationManagerConfig {
  locales: Locale[];
  defaultLocale: Locale;
  messagesDir: string;
  lingo: LingoConfig;
  qualityThresholds: {
    minScore: number;
    maxIssues: number;
    criticalIssueThreshold: number;
  };
}

/**
 * 翻译质量检查接口
 */
export interface TranslationQualityCheck {
  checkLingoTranslation(
    _key: string,
    _aiTranslation: string,
    _humanTranslation?: string,
  ): Promise<QualityScore>;

  validateTranslationConsistency(
    _translations: Record<string, string>,
  ): Promise<ValidationReport>;

  generateQualityReport(): Promise<QualityReport>;
}
