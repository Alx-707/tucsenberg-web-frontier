/**
 * 翻译质量基准管理
 */
import { Locale } from '@/types/i18n';
import {
  QualityBenchmark,
  QualityComparison,
} from './translation-quality-types';

export class TranslationBenchmarks {
  private benchmarks: Map<Locale, QualityBenchmark> = new Map();

  /**
   * 初始化基准数据
   */
  initialize(): void {
    this.loadQualityBenchmarks();
  }

  /**
   * 与质量基准对比
   */
  compareWithBenchmark(currentScore: any, locale: Locale): QualityComparison {
    const benchmark = this.benchmarks.get(locale);

    if (!benchmark) {
      throw new Error(`No benchmark available for locale: ${locale}`);
    }

    const improvement =
      ((currentScore.score - benchmark.averageScore) / benchmark.averageScore) *
      100;

    const recommendations = this.generateBenchmarkRecommendations(
      currentScore,
      benchmark,
      improvement,
    );

    return {
      current: currentScore,
      benchmark,
      improvement,
      recommendations,
    };
  }

  /**
   * 获取基准数据
   */
  getBenchmark(locale: Locale): QualityBenchmark | undefined {
    return this.benchmarks.get(locale);
  }

  /**
   * 设置基准数据
   */
  setBenchmark(locale: Locale, benchmark: QualityBenchmark): void {
    this.benchmarks.set(locale, benchmark);
  }

  /**
   * 加载质量基准
   */
  private loadQualityBenchmarks(): void {
    // 这里可以从文件或API加载质量基准数据
    // 暂时使用默认基准

    this.benchmarks.set('en', {
      locale: 'en',
      averageScore: 85,
      benchmarkDate: '2024-01-01',
      sampleSize: 1000,
      categories: {
        grammar: 88,
        consistency: 82,
        terminology: 85,
        fluency: 87,
      },
    });

    this.benchmarks.set('zh', {
      locale: 'zh',
      averageScore: 82,
      benchmarkDate: '2024-01-01',
      sampleSize: 800,
      categories: {
        grammar: 85,
        consistency: 80,
        terminology: 83,
        fluency: 84,
      },
    });
  }

  /**
   * 生成基准对比建议
   */
  private generateBenchmarkRecommendations(
    current: any,
    benchmark: QualityBenchmark,
    improvement: number,
  ): string[] {
    const recommendations: string[] = [];

    if (improvement < -10) {
      recommendations.push(
        'Overall quality is significantly below benchmark. Consider comprehensive review.',
      );
    } else if (improvement < 0) {
      recommendations.push(
        'Quality is below benchmark. Focus on identified issues.',
      );
    } else if (improvement > 10) {
      recommendations.push('Excellent quality! Above benchmark standards.');
    }

    // 分类建议
    if (current.grammar < benchmark.categories.grammar) {
      recommendations.push(
        'Grammar score below benchmark. Review grammatical accuracy.',
      );
    }

    if (current.consistency < benchmark.categories.consistency) {
      recommendations.push(
        'Consistency score below benchmark. Ensure terminology consistency.',
      );
    }

    if (current.terminology < benchmark.categories.terminology) {
      recommendations.push(
        'Terminology score below benchmark. Review domain-specific terms.',
      );
    }

    if (current.fluency < benchmark.categories.fluency) {
      recommendations.push(
        'Fluency score below benchmark. Improve natural language flow.',
      );
    }

    return recommendations;
  }
}
