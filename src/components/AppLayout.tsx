import React, { useState, useCallback, useEffect, lazy, Suspense } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useSubscription } from '@/hooks/useSubscription';
import { ProductTour } from './ProductTour';
import { OfflineIndicator } from './OfflineIndicator';
import { AIChatbot } from './AIChatbot';
import { AuthenticatedLayout } from '@/components/AuthenticatedLayout';
import { Loader2 } from 'lucide-react';

const Dashboard = lazy(() => import('@/pages/Dashboard'));
import { LandingHeader } from '@/components/LandingHeader';
import { LandingFooter } from '@/components/LandingFooter';
import { LandingContent } from '@/components/LandingContent';
import { Leaf } from 'lucide-react';

const AppLayout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, loading } = useAuth();
  const { trialExpired, loading: subscriptionLoading } = useSubscription();
  const [isTourActive, setIsTourActive] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState<string | null>(null);

  useEffect(() => {
    if (location.pathname !== '/') return;
    const sections = ['how-it-works', 'problem'];
    const vis: Record<string, number> = {};
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const id = entry.target.id;
          vis[id] = entry.isIntersecting ? entry.intersectionRatio : 0;
        });
        const best = sections.reduce<{ id: string; ratio: number } | null>((acc, id) => {
          const r = vis[id] ?? 0;
          if (r <= 0) return acc;
          if (!acc || r > acc.ratio) return { id, ratio: r };
          return acc;
        }, null);
        setActiveSection(best?.id ?? null);
      },
      { rootMargin: '-20% 0px -60% 0px', threshold: [0, 0.25, 0.5, 0.75, 1] }
    );
    sections.forEach((id) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, [location.pathname]);

  useEffect(() => {
    if (user && !subscriptionLoading && trialExpired && location.pathname === '/') {
      navigate('/settings', { replace: true, state: { trialExpiredRedirect: true } });
    }
  }, [user, subscriptionLoading, trialExpired, location.pathname, navigate]);

  const scrollToSection = useCallback((id: string) => {
    setMobileMenuOpen(false);
    if (location.pathname !== '/') {
      navigate('/');
      setTimeout(() => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' }), 100);
    } else {
      document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [location.pathname, navigate]);

  const navItems = [
    { label: 'Home', path: '/', onClick: () => { setMobileMenuOpen(false); navigate('/'); }, sectionId: 'home' },
    { label: 'Features', path: '/features', onClick: () => { setMobileMenuOpen(false); navigate('/features'); }, sectionId: 'features' },
    { label: 'Use Cases', path: '/use-case', onClick: () => { setMobileMenuOpen(false); navigate('/use-case'); }, sectionId: 'use-cases' },
    { label: 'Pricing', path: '/pricing', onClick: () => { setMobileMenuOpen(false); navigate('/pricing'); }, sectionId: 'pricing' },
    { label: 'About Us', path: '/about', onClick: () => { setMobileMenuOpen(false); navigate('/about'); }, sectionId: 'about' },
    { label: 'FAQ', path: '/faq', onClick: () => { setMobileMenuOpen(false); navigate('/faq'); }, sectionId: 'faq' },
    { label: 'Demo', path: '/demo', onClick: () => { setMobileMenuOpen(false); navigate('/demo'); }, sectionId: 'demo', mobileOnly: true },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen landing" style={{ backgroundColor: 'var(--landing-bg)' }}>
        <div className="text-center" style={{ color: 'var(--landing-primary)' }}>
          <Leaf className="h-16 w-16 mx-auto mb-4 animate-pulse" />
          <p className="font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  if (user) {
    if (!subscriptionLoading && trialExpired && location.pathname === '/') {
      return (
        <div className="flex items-center justify-center min-h-screen landing" style={{ backgroundColor: 'var(--landing-bg)' }}>
          <div className="text-center" style={{ color: 'var(--landing-primary)' }}>
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p className="font-medium">Redirecting to subscription...</p>
          </div>
        </div>
      );
    }
    return (
      <AuthenticatedLayout>
        <Suspense fallback={
          <div className="flex min-h-[60vh] items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        }>
          <Dashboard />
        </Suspense>
      </AuthenticatedLayout>
    );
  }

  return (
    <div className="min-h-screen landing" style={{ backgroundColor: 'var(--landing-bg)', color: 'var(--landing-text)' }}>
      <LandingHeader
        navItems={navItems}
        activeSection={activeSection}
        mobileMenuOpen={mobileMenuOpen}
        setMobileMenuOpen={setMobileMenuOpen}
      />

      <LandingContent />

      <LandingFooter navigate={navigate} scrollToLandingSection={scrollToSection} />

      <ProductTour isActive={isTourActive} onComplete={() => setIsTourActive(false)} />
      <OfflineIndicator />
      <AIChatbot />

    </div>
  );
};

export default AppLayout;
