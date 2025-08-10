'use client';

import type React from 'react';
import {
  ArrowRight,
  BookOpen,
  Download,
  ExternalLink,
  Github,
  MessageCircle,
  Star,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { useIntersectionObserver } from '@/hooks/use-intersection-observer';

// UI常量
const UI_CONSTANTS = {
  /** 动画持续时间: 200ms */
  ANIMATION_DURATION: 200,
  /** 长动画持续时间: 700ms */
  LONG_ANIMATION_DURATION: 700,
  /** 交叉观察器阈值 */
  INTERSECTION_THRESHOLD: 0.2,
} as const;

function ActionCards({
  t,
  actions,
}: {
  t: (_key: string) => string;
  actions: Array<{
    icon: React.ComponentType<{ className?: string }>;
    title: string;
    description: string;
    href: string;
    primary: boolean;
    external: boolean;
  }>;
}) {
  return (
    <div className='grid gap-6 sm:grid-cols-3'>
      {actions.map((action, index) => {
        const Icon = action.icon;
        return (
          <Card
            key={index}
            className={`group transition-all duration-[${UI_CONSTANTS.ANIMATION_DURATION}ms] hover:shadow-lg ${
              action.primary
                ? 'border-primary/20 bg-primary/5 hover:shadow-primary/10'
                : 'hover:shadow-primary/5'
            }`}
          >
            <CardHeader className='text-center'>
              <div className='bg-primary/10 mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-lg'>
                <Icon className='text-primary h-6 w-6' />
              </div>
              <CardTitle className='text-lg'>{action.title}</CardTitle>
              <CardDescription>{action.description}</CardDescription>
            </CardHeader>
            <CardContent className='text-center'>
              <Button
                variant={action.primary ? 'default' : 'outline'}
                className='w-full group-hover:shadow-sm'
                asChild
              >
                <a
                  href={action.href}
                  {...(action.external && {
                    target: '_blank',
                    rel: 'noopener noreferrer',
                  })}
                  className='flex items-center justify-center gap-2'
                >
                  {action.primary
                    ? t('buttons.getStarted')
                    : t('buttons.learnMore')}
                  {action.external ? (
                    <ExternalLink className='h-4 w-4' />
                  ) : (
                    <ArrowRight className='h-4 w-4' />
                  )}
                </a>
              </Button>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

function StatsDisplay({
  stats,
}: {
  stats: Array<{ value: string; label: string }>;
}) {
  return (
    <div className='grid grid-cols-2 gap-6 sm:grid-cols-4'>
      {stats.map((stat, index) => (
        <div
          key={index}
          className='text-center'
        >
          <div className='text-foreground text-2xl font-bold sm:text-3xl'>
            {stat.value}
          </div>
          <div className='text-muted-foreground text-sm'>{stat.label}</div>
        </div>
      ))}
    </div>
  );
}

function CommunitySection({ t }: { t: (_key: string) => string }) {
  return (
    <div className='mt-16 text-center'>
      <Card className='bg-muted/50'>
        <CardHeader>
          <CardTitle className='flex items-center justify-center gap-2'>
            <MessageCircle className='h-5 w-5' />
            {t('community.title')}
          </CardTitle>
          <CardDescription className='text-base'>
            {t('community.description')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className='flex flex-col gap-3 sm:flex-row sm:justify-center'>
            <Button
              variant='outline'
              asChild
            >
              <a
                href='https://github.com/tucsenberg/web-frontier/discussions'
                target='_blank'
                rel='noopener noreferrer'
                className='flex items-center gap-2'
              >
                {t('community.discussions')}
                <ExternalLink className='h-4 w-4' />
              </a>
            </Button>
            <Button
              variant='outline'
              asChild
            >
              <a
                href='https://github.com/tucsenberg/web-frontier/issues'
                target='_blank'
                rel='noopener noreferrer'
                className='flex items-center gap-2'
              >
                {t('community.issues')}
                <ExternalLink className='h-4 w-4' />
              </a>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// 辅助函数：获取行动数据
const getCallToActionData = (t: (_key: string) => string) => ({
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

export function CallToAction() {
  const t = useTranslations('home.cta');

  // 动画Hook
  const { ref, isVisible } = useIntersectionObserver<HTMLDivElement>({
    threshold: UI_CONSTANTS.INTERSECTION_THRESHOLD,
    triggerOnce: true,
  });

  const { actions, stats } = getCallToActionData(t);

  return (
    <section className='from-primary/5 via-background to-secondary/5 bg-gradient-to-br py-20'>
      <div className='container mx-auto px-4'>
        <div
          ref={ref}
          className={`mx-auto max-w-4xl transition-all duration-[${UI_CONSTANTS.LONG_ANIMATION_DURATION}ms] ease-out ${
            isVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
          }`}
        >
          {/* 主要行动号召 */}
          <div className='mb-16 text-center'>
            <div className='mb-6'>
              <Badge className='mb-4 px-4 py-2 text-sm font-medium'>
                <Star className='mr-2 h-4 w-4' />
                {t('badge')}
              </Badge>
            </div>

            <h2 className='mb-6 text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl'>
              {t('title')}
            </h2>

            <p className='text-muted-foreground mx-auto mb-8 max-w-2xl text-lg sm:text-xl'>
              {t('subtitle')}
            </p>

            {/* 主要按钮 */}
            <div className='mb-12 flex flex-col gap-4 sm:flex-row sm:justify-center'>
              <Button
                size='lg'
                className='group px-8 py-4 text-lg'
                asChild
              >
                <a
                  href='https://github.com/tucsenberg/web-frontier'
                  target='_blank'
                  rel='noopener noreferrer'
                  className='flex items-center gap-2'
                >
                  <Github className='h-5 w-5' />
                  {t('primary.github')}
                  <ArrowRight className='h-4 w-4 transition-transform group-hover:translate-x-1' />
                </a>
              </Button>

              <Button
                variant='outline'
                size='lg'
                className='px-8 py-4 text-lg'
                asChild
              >
                <a
                  href='#demo'
                  className='flex items-center gap-2'
                >
                  {t('primary.demo')}
                  <ExternalLink className='h-4 w-4' />
                </a>
              </Button>
            </div>

            {/* 统计数据 */}
            <StatsDisplay stats={stats} />
          </div>

          {/* 行动选项 */}
          <ActionCards
            t={t}
            actions={actions}
          />

          <CommunitySection t={t} />
        </div>
      </div>
    </section>
  );
}
