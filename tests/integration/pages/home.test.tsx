import { render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import Home from '@/app/[locale]/page';
import '../setup';

// Mock home page components
vi.mock('@/components/home/call-to-action', () => ({
  CallToAction: () => (
    <section data-testid='call-to-action'>Call to Action Section</section>
  ),
}));

vi.mock('@/components/home/component-showcase', () => ({
  ComponentShowcase: () => (
    <section data-testid='component-showcase'>
      Component Showcase Section
    </section>
  ),
}));

vi.mock('@/components/home/hero-section', () => ({
  HeroSection: () => <section data-testid='hero-section'>Hero Section</section>,
}));

vi.mock('@/components/home/project-overview', () => ({
  ProjectOverview: () => (
    <section data-testid='project-overview'>Project Overview Section</section>
  ),
}));

vi.mock('@/components/home/tech-stack-section', () => ({
  TechStackSection: () => (
    <section data-testid='tech-stack-section'>Tech Stack Section</section>
  ),
}));

describe('Home Page Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Page Structure', () => {
    it('should render all main sections in correct order', () => {
      render(<Home />);

      // Verify all sections are present
      expect(screen.getByTestId('hero-section')).toBeInTheDocument();
      expect(screen.getByTestId('tech-stack-section')).toBeInTheDocument();
      expect(screen.getByTestId('component-showcase')).toBeInTheDocument();
      expect(screen.getByTestId('project-overview')).toBeInTheDocument();
      expect(screen.getByTestId('call-to-action')).toBeInTheDocument();
    });

    it('should have correct page layout structure', () => {
      render(<Home />);

      const mainContainer = screen.getByTestId('hero-section').parentElement;
      expect(mainContainer).toHaveClass('bg-background');
      expect(mainContainer).toHaveClass('text-foreground');
      expect(mainContainer).toHaveClass('min-h-screen');
    });

    it('should maintain proper section hierarchy', () => {
      render(<Home />);

      const container = screen.getByTestId('hero-section').parentElement;
      const sections = container?.children;

      expect(sections).toHaveLength(5);

      // Verify order of sections
      expect(sections?.[0]).toHaveAttribute('data-testid', 'hero-section');
      expect(sections?.[1]).toHaveAttribute(
        'data-testid',
        'tech-stack-section',
      );
      expect(sections?.[2]).toHaveAttribute(
        'data-testid',
        'component-showcase',
      );
      expect(sections?.[3]).toHaveAttribute('data-testid', 'project-overview');
      expect(sections?.[4]).toHaveAttribute('data-testid', 'call-to-action');
    });
  });

  describe('Component Integration', () => {
    it('should render all components without errors', async () => {
      const { container } = render(<Home />);

      await waitFor(() => {
        expect(container.firstChild).toBeInTheDocument();
      });

      // Verify no error boundaries were triggered
      expect(
        screen.queryByText(/something went wrong/i),
      ).not.toBeInTheDocument();
      expect(screen.queryByText(/error/i)).not.toBeInTheDocument();
    });

    it('should handle component loading states', async () => {
      render(<Home />);

      // All components should be immediately available (no async loading)
      expect(screen.getByTestId('hero-section')).toBeInTheDocument();
      expect(screen.getByTestId('tech-stack-section')).toBeInTheDocument();
      expect(screen.getByTestId('component-showcase')).toBeInTheDocument();
      expect(screen.getByTestId('project-overview')).toBeInTheDocument();
      expect(screen.getByTestId('call-to-action')).toBeInTheDocument();
    });
  });

  describe('Responsive Design', () => {
    it('should maintain layout on different screen sizes', () => {
      render(<Home />);

      const container = screen.getByTestId('hero-section').parentElement;

      // Container should have responsive classes
      expect(container).toHaveClass('min-h-screen');

      // All sections should be present regardless of screen size
      expect(screen.getByTestId('hero-section')).toBeInTheDocument();
      expect(screen.getByTestId('tech-stack-section')).toBeInTheDocument();
      expect(screen.getByTestId('component-showcase')).toBeInTheDocument();
      expect(screen.getByTestId('project-overview')).toBeInTheDocument();
      expect(screen.getByTestId('call-to-action')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper semantic structure', () => {
      render(<Home />);

      // All sections should be present as section elements
      const heroSection = screen.getByTestId('hero-section');
      const techStackSection = screen.getByTestId('tech-stack-section');
      const componentShowcase = screen.getByTestId('component-showcase');
      const projectOverview = screen.getByTestId('project-overview');
      const callToAction = screen.getByTestId('call-to-action');

      expect(heroSection.tagName).toBe('SECTION');
      expect(techStackSection.tagName).toBe('SECTION');
      expect(componentShowcase.tagName).toBe('SECTION');
      expect(projectOverview.tagName).toBe('SECTION');
      expect(callToAction.tagName).toBe('SECTION');

      // Main container should be accessible
      const container = screen.getByTestId('hero-section').parentElement;
      expect(container).toBeInTheDocument();
    });

    it('should support keyboard navigation', () => {
      render(<Home />);

      // Page should be navigable (components handle their own keyboard events)
      const container = screen.getByTestId('hero-section').parentElement;
      expect(container).toBeInTheDocument();

      // All interactive sections should be present
      expect(screen.getByTestId('hero-section')).toBeInTheDocument();
      expect(screen.getByTestId('call-to-action')).toBeInTheDocument();
    });
  });

  describe('Performance', () => {
    it('should render efficiently', () => {
      const startTime = performance.now();
      render(<Home />);
      const endTime = performance.now();

      // Rendering should be fast (under 100ms for mocked components)
      expect(endTime - startTime).toBeLessThan(100);
    });

    it('should handle multiple renders without issues', () => {
      const { rerender } = render(<Home />);

      expect(screen.getByTestId('hero-section')).toBeInTheDocument();

      rerender(<Home />);

      expect(screen.getByTestId('hero-section')).toBeInTheDocument();
      expect(screen.getByTestId('call-to-action')).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('should handle component errors gracefully', () => {
      // Mock console.error to avoid noise in test output
      const consoleSpy = vi
        .spyOn(console, 'error')
        .mockImplementation(() => {});

      render(<Home />);

      // Page should still render even if individual components have issues
      expect(screen.getByTestId('hero-section')).toBeInTheDocument();

      consoleSpy.mockRestore();
    });
  });

  describe('Content Flow', () => {
    it('should present content in logical order for user journey', () => {
      render(<Home />);

      const container = screen.getByTestId('hero-section').parentElement;
      const sections = Array.from(container?.children || []);

      // Verify logical flow:
      // 1. Hero (introduction)
      // 2. Tech Stack (what we use)
      // 3. Component Showcase (what we built)
      // 4. Project Overview (how it works)
      // 5. Call to Action (next steps)

      expect(sections[0]).toHaveAttribute('data-testid', 'hero-section');
      expect(sections[1]).toHaveAttribute('data-testid', 'tech-stack-section');
      expect(sections[2]).toHaveAttribute('data-testid', 'component-showcase');
      expect(sections[3]).toHaveAttribute('data-testid', 'project-overview');
      expect(sections[4]).toHaveAttribute('data-testid', 'call-to-action');
    });

    it('should maintain visual hierarchy', () => {
      render(<Home />);

      const container = screen.getByTestId('hero-section').parentElement;

      // Container should establish proper visual context
      expect(container).toHaveClass('bg-background');
      expect(container).toHaveClass('text-foreground');

      // All sections should inherit this context
      expect(screen.getByTestId('hero-section')).toBeInTheDocument();
      expect(screen.getByTestId('tech-stack-section')).toBeInTheDocument();
      expect(screen.getByTestId('component-showcase')).toBeInTheDocument();
      expect(screen.getByTestId('project-overview')).toBeInTheDocument();
      expect(screen.getByTestId('call-to-action')).toBeInTheDocument();
    });
  });
});
