'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Link } from '@/i18n/routing';
// cn utility is imported but not used in this file
// import { cn } from '@/lib/utils';
import { logger } from '@/lib/logger';
import { ArrowRight, Bell, CheckCircle, Clock, Github, Linkedin, Mail, Twitter, Users, Zap } from 'lucide-react';
import { useTranslations } from 'next-intl';
import React, { useState } from 'react';
import { AnimatedIcon } from './animated-icon';
import { ProgressIndicator } from './progress-indicator';

interface EmailSubscriptionProps {
  showEmailSubscription: boolean;
}

export function EmailSubscription({ showEmailSubscription }: EmailSubscriptionProps) {
  const _t = useTranslations('underConstruction');
  const [email, setEmail] = useState('');
  const [isSubscribed, setIsSubscribed] = useState(false);

  const handleEmailSubscription = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    try {
      const response = await fetch('/api/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (data.success) {
        setIsSubscribed(true);
        setEmail('');
      }
    } catch (error) {
      logger.error('Subscription error', { error: error as Error });
    }
  };

  if (!showEmailSubscription) return null;

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <CardTitle className="flex items-center justify-center gap-2">
          <Bell className="h-5 w-5" />
          {_t('emailSubscription.title')}
        </CardTitle>
        <CardDescription>
          {_t('emailSubscription.description')}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isSubscribed ? (
          <div className="text-center space-y-2">
            <CheckCircle className="h-8 w-8 text-green-500 mx-auto" />
            <p className="text-sm text-muted-foreground">
              {_t('emailSubscription.success')}
            </p>
          </div>
        ) : (
          <form onSubmit={handleEmailSubscription} className="space-y-4">
            <Input
              type="email"
              placeholder={_t('emailSubscription.placeholder')}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <Button type="submit" className="w-full">
              {_t('emailSubscription.button')}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </form>
        )}
      </CardContent>
    </Card>
  );
}

interface SocialLinksProps {
  showSocialLinks: boolean;
}

export function SocialLinks({ showSocialLinks }: SocialLinksProps) {
  const _t = useTranslations('underConstruction');

  const socialLinks = [
    { icon: Twitter, href: '#', label: 'Twitter' },
    { icon: Github, href: '#', label: 'GitHub' },
    { icon: Linkedin, href: '#', label: 'LinkedIn' },
  ];

  if (!showSocialLinks) return null;

  return (
    <div className="flex justify-center space-x-4">
      {socialLinks.map((social) => (
        <Button
          key={social.label}
          variant="outline"
          size="icon"
          asChild
          className="hover:scale-110 transition-transform"
        >
          <Link href={social.href as any} aria-label={social.label}>
            <social.icon className="h-4 w-4" />
          </Link>
        </Button>
      ))}
    </div>
  );
}

interface FeaturePreviewProps {
  showFeaturePreview: boolean;
}

export function FeaturePreview({ showFeaturePreview }: FeaturePreviewProps) {
  const _t = useTranslations('underConstruction');

  const features = [
    { icon: Zap, title: _t('features.performance'), description: _t('features.performanceDesc') },
    { icon: Users, title: _t('features.collaboration'), description: _t('features.collaborationDesc') },
    { icon: CheckCircle, title: _t('features.quality'), description: _t('features.qualityDesc') },
  ];

  if (!showFeaturePreview) return null;

  return (
    <div className="w-full max-w-4xl mx-auto">
      <h3 className="text-xl font-semibold text-center mb-8">
        {_t('features.title')}
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {features.map((feature, index) => (
          <Card key={index} className="text-center hover:shadow-lg transition-shadow">
            <CardHeader>
              <feature.icon className="h-8 w-8 mx-auto text-primary" />
              <CardTitle className="text-lg">{feature.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>{feature.description}</CardDescription>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

interface HeaderSectionProps {
  pageType: 'products' | 'blog' | 'about' | 'contact';
  expectedDate: string;
}

export function HeaderSection({ pageType, expectedDate }: HeaderSectionProps) {
  const _t = useTranslations('underConstruction');
  const tPage = useTranslations(`underConstruction.pages.${pageType}`);

  return (
    <div className="text-center space-y-6">
      <div className="space-y-4">
        <AnimatedIcon
          variant="construction"
          size="xl"
          className="text-primary drop-shadow-lg"
        />
        <div className="space-y-2">
          <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            {tPage('title')}
          </h1>
          <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto">
            {tPage('subtitle')}
          </p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
        <Badge variant="secondary" className="text-sm px-4 py-2">
          <Clock className="mr-2 h-4 w-4" />
          {_t('expectedLaunch')}: {expectedDate}
        </Badge>
        <Button asChild variant="outline">
          <Link href="/">
            {_t('backToHome')}
          </Link>
        </Button>
      </div>
    </div>
  );
}

interface ProgressSectionProps {
  showProgress: boolean;
  currentStep: number;
}

export function ProgressSection({ showProgress, currentStep }: ProgressSectionProps) {
  const _t = useTranslations('underConstruction');

  if (!showProgress) return null;

  return (
    <div className="w-full max-w-2xl mx-auto">
      <h3 className="text-lg font-semibold text-center mb-6">
        {_t('progress.title')}
      </h3>
      <ProgressIndicator currentStep={currentStep} />
    </div>
  );
}

interface ContactSectionProps {
  pageType: 'products' | 'blog' | 'about' | 'contact';
}

export function ContactSection({ pageType: _pageType }: ContactSectionProps) {
  const _t = useTranslations('underConstruction');

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <CardTitle className="flex items-center justify-center gap-2">
          <Mail className="h-5 w-5" />
          {_t('contact.title')}
        </CardTitle>
        <CardDescription>
          {_t('contact.description')}
        </CardDescription>
      </CardHeader>
      <CardContent className="text-center">
        <Button asChild className="w-full">
          <Link href="/contact">
            {_t('contact.button')}
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}
