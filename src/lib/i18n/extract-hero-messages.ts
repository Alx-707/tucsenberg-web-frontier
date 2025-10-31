/**
 * 提取 home.hero 命名空间的纯函数工具
 * - 输入为编译期/运行期的 messages 根对象（Record<string, unknown>）
 * - 返回 hero 命名空间对象（Record<string, unknown>）；若不存在则返回空对象
 * - 纯函数、无副作用，并使用类型守卫进行 unknown 窄化
 */

export type HeroMessages = Record<string, unknown>;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

export function extractHeroMessages(
  messages: Record<string, unknown>,
): HeroMessages {
  // 安全获取 home 命名空间
  const homeCandidate: unknown = (messages as { home?: unknown }).home;
  const home = isRecord(homeCandidate)
    ? (homeCandidate as Record<string, unknown>)
    : undefined;

  // 从 home 中安全获取 hero 命名空间
  const heroCandidate: unknown =
    home && 'hero' in home ? (home as Record<string, unknown>).hero : undefined;
  const hero = isRecord(heroCandidate)
    ? (heroCandidate as Record<string, unknown>)
    : {};

  return hero;
}
