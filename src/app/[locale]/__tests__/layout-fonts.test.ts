import { describe, expect, it } from 'vitest';
import { geistSans, getFontClassNames } from '@/app/[locale]/layout-fonts';

// 使用全局 setup 中的 next/font/local mock（src/test/setup.ts）
// 该全局 mock 提供 variable/className/style，避免 ESM 目录导入问题
//
// P2-1 Phase 2 更新说明：
// - 移除 geistMono 全局导出，等宽字体使用系统字体栈回退
// - getFontClassNames() 现在只返回 geistSans.variable
// - 这样可以节省 ~59KB 的 Geist Mono 字体下载

describe('Layout Fonts Configuration', () => {
  describe('geistSans字体配置', () => {
    it('应该正确配置Geist Sans字体', () => {
      expect(geistSans).toBeDefined();
      expect(geistSans.variable).toBe('--font-geist-sans');
    });

    it('应该包含正确的字体配置选项', () => {
      // 验证字体配置对象的结构
      expect(geistSans).toHaveProperty('variable');
      expect(geistSans).toHaveProperty('className');
      expect(geistSans).toHaveProperty('style');
    });

    it('应该设置正确的CSS变量名', () => {
      expect(geistSans.variable).toBe('--font-geist-sans');
    });
  });

  describe('getFontClassNames函数 (P2-1 Phase 2 优化后)', () => {
    it('应该只返回 Geist Sans 变量', () => {
      const classNames = getFontClassNames();

      expect(typeof classNames).toBe('string');
      expect(classNames).toContain('--font-geist-sans');
      // P2-1 Phase 2: Geist Mono 不再包含在全局类名中
      expect(classNames).not.toContain('--font-geist-mono');
    });

    it('应该只包含一个字体变量', () => {
      const classNames = getFontClassNames();

      // P2-1 Phase 2: 只有 Geist Sans，不再有 Mono
      expect(classNames).toBe(geistSans.variable);
    });

    // 中文字体子集由 head.tsx 注入，不再通过 next/font 变量控制

    it('应该返回一致的结果', () => {
      const classNames1 = getFontClassNames();
      const classNames2 = getFontClassNames();

      expect(classNames1).toBe(classNames2);
    });

    it('应该返回非空字符串', () => {
      const classNames = getFontClassNames();

      expect(classNames).toBeTruthy();
      expect(classNames.length).toBeGreaterThan(0);
    });
  });

  describe('字体变量一致性', () => {
    it('字体变量应该遵循CSS自定义属性命名规范', () => {
      expect(geistSans.variable).toMatch(/^--font-/);
    });

    it('getFontClassNames应该包含geistSans变量', () => {
      const classNames = getFontClassNames();

      expect(classNames).toContain(geistSans.variable);
      // 中文字体变量不再出现在类名中
    });
  });

  describe('字体对象属性验证', () => {
    it('geistSans应该包含必要的Next.js字体属性', () => {
      // 验证Next.js字体对象的基本结构
      expect(geistSans).toHaveProperty('className');
      expect(geistSans).toHaveProperty('style');
      expect(typeof geistSans.className).toBe('string');
      expect(typeof geistSans.style).toBe('object');
    });

    it('字体样式对象应该包含fontFamily属性', () => {
      expect(geistSans.style).toHaveProperty('fontFamily');
      expect(typeof geistSans.style.fontFamily).toBe('string');
    });
  });

  describe('边界条件测试', () => {
    it('字体变量名不应该为空', () => {
      expect(geistSans.variable.length).toBeGreaterThan(0);
    });

    it('字体类名不应该为空', () => {
      expect(geistSans.className.length).toBeGreaterThan(0);
    });

    it('getFontClassNames返回值不应该包含多余的空格', () => {
      const classNames = getFontClassNames();

      // 不应该以空格开头或结尾
      expect(classNames).not.toMatch(/^\s/);
      expect(classNames).not.toMatch(/\s$/);

      // 不应该包含连续的空格
      expect(classNames).not.toMatch(/\s{2,}/);
    });
  });
});
