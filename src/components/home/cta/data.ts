import { BookOpen, Download, Github } from 'lucide-react';

// 辅助函数：获取行动数据
export const getCallToActionData = (t: (_key: string) => string) => ({
  actions: [
    {
      icon: Github,
      title: t('actions.github.title'),
      description: t('actions.github.description'),
      href: 'https://github.com/tucsenberg/web-frontier',
      primary: true,
      external: true,
    },
    {
      icon: Download,
      title: t('actions.download.title'),
      description: t('actions.download.description'),
      href: 'https://github.com/tucsenberg/web-frontier/archive/main.zip',
      primary: false,
      external: true,
    },
    {
      icon: BookOpen,
      title: t('actions.docs.title'),
      description: t('actions.docs.description'),
      href: '/docs',
      primary: false,
      external: false,
    },
  ],
  stats: [
    {
      value: '22+',
      label: t('stats.technologies'),
    },
    {
      value: '100%',
      label: t('stats.typescript'),
    },
    {
      value: 'A+',
      label: t('stats.performance'),
    },
    {
      value: '2',
      label: t('stats.languages'),
    },
  ],
});
