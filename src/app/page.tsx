import { redirect } from 'next/navigation';

export default function RootPage() {
  // Redirect to default locale
  // nosemgrep: nextjs-unsafe-redirect
  // 安全说明：目标 URL 为受控的站内固定路径 '/en'，不包含任何用户输入或动态拼接，
  // 且该页面是应用根路由的单一入口重定向点，不会导致开放重定向风险。
  redirect('/en');
}
