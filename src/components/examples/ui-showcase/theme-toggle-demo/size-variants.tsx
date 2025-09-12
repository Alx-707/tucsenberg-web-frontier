import { HorizontalThemeToggle } from '@/components/theme/horizontal-theme-toggle';

/**
 * 尺寸变体演示组件
 */
export function SizeVariants() {
  return (
    <div>
      <h4 className="font-semibold mb-3">📏 尺寸变体</h4>
      <div className="space-y-4">
        <div>
          <span className="text-sm text-muted-foreground mb-2 block">默认尺寸</span>
          <HorizontalThemeToggle />
        </div>

        <div>
          <span className="text-sm text-muted-foreground mb-2 block">小尺寸</span>
          <HorizontalThemeToggle size="sm" />
        </div>

        <div>
          <span className="text-sm text-muted-foreground mb-2 block">大尺寸</span>
          <HorizontalThemeToggle size="lg" />
        </div>
      </div>
    </div>
  );
}
