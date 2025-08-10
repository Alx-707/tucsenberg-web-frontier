import { CallToAction } from '@/components/home/call-to-action';
import { ComponentShowcase } from '@/components/home/component-showcase';
import { HeroSection } from '@/components/home/hero-section';
import { ProjectOverview } from '@/components/home/project-overview';
import { TechStackSection } from '@/components/home/tech-stack-section';

export default function Home() {
  return (
    <div className='bg-background text-foreground min-h-screen'>
      <HeroSection />
      <TechStackSection />
      <ComponentShowcase />
      <ProjectOverview />
      <CallToAction />
    </div>
  );
}
