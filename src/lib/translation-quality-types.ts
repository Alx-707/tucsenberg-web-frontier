/**
 * 翻译质量检查相关的类型定义
 */
import type { Locale } from '@/types/i18n';
;
import type { QualityIssue, QualityScore } from '@/types/translation-manager';

// AI翻译服务接口
export interface AITranslationService {
  name: string;
  translate(
    _text: string,
    _fromLocale: Locale,
    _toLocale: Locale,
  ): Promise<string>;
  batchTranslate(
    _texts: string[],
    _fromLocale: Locale,
    _toLocale: Locale,
  ): Promise<string[]>;
}

// 翻译质量基准
export interface QualityBenchmark {
  locale: Locale;
  averageScore: number;
  benchmarkDate: string;
  sampleSize: number;
  categories: {
    grammar: number;
    consistency: number;
    terminology: number;
    fluency: number;
  };
}

// 质量对比结果
export interface QualityComparison {
  current: QualityScore;
  benchmark: QualityBenchmark;
  improvement: number; // 相对于基准的改进百分比
  recommendations: string[];
}

// 验证结果
export interface ValidationResult {
  issues: QualityIssue[];
  penalty: number;
}

// 批量翻译验证输入
export interface BatchTranslationInput {
  key: string;
  original: string;
  translated: string;
  locale: Locale;
  humanReference?: string;
}
