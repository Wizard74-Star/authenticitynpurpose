import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { Button } from '@/components/ui/button';
import { AuthModal } from '@/components/auth/AuthModal';
import { LandingPageLayout } from '@/components/LandingPageLayout';
import { HeroFloatingCircles } from '@/components/HeroFloatingCircles';
import {
  ChevronDown,
  Rocket,
  Sparkles,
  Shield,
  CreditCard,
  HelpCircle,
  Smartphone,
  Users,
  Target,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import faqBg from '@/assets/images/FQA-bg.jpg';

type FAQCategory = {
  id: string;
  title: string;
  icon: React.ElementType;
  items: { q: string; a: string }[];
};

const faqCategories: FAQCategory[] = [
  {
    id: 'getting-started',
    title: 'Getting Started',
    icon: Rocket,
    items: [
      {
        q: 'What is Authenticity and Purpose?',
        a: 'Authenticity and Purpose is a private personal growth system—not a task manager or habit tracker. It helps you define who you want to become, write a clear development plan, attach goals to time with a calendar, and get AI-powered feedback on your progress. Think of it as your dedicated space to design and follow your own path, without comparison, social pressure, or empty productivity hacks.',
      },
      {
        q: 'How do I get started?',
        a: 'Sign up for a 7-day free trial—no credit card required. Then: (1) Set your first goal—what do you want to achieve or who do you want to become? (2) Write your development plan in your own words. (3) Attach goals to dates and set reminders. (4) Optionally, invite a family member for private accountability. You can also watch our demo first to see how it all works.',
      },
      {
        q: 'Is there a mobile app?',
        a: 'Yes. Authenticity and Purpose works as a Progressive Web App (PWA) on your phone. Open it in your mobile browser (Chrome, Safari, etc.), then add it to your home screen for an app-like experience—icon, full-screen, offline support, and push notifications. No app store download required.',
      },
    ],
  },
  {
    id: 'product',
    title: 'Product & Features',
    icon: Sparkles,
    items: [
      {
        q: 'How does the AI feedback work?',
        a: 'Our AI analyzes your check-ins, goals, and patterns over time—not just your last entry. It identifies when you slip, suggests why, and offers actionable guidance. The feedback is tailored to your behavior, so you get insights that help you improve instead of generic tips. This is what sets us apart from apps that only store data.',
      },
      {
        q: 'Can I set goals for different timeframes?',
        a: 'Yes. You can set goals from 30 days up to 5 years. Each goal can have its own written plan, milestones, and check-ins. The calendar and reminders keep you aligned with your timeline, and the AI helps you see how your short-term actions connect to your long-term vision.',
      },
      {
        q: 'Can I invite family for accountability?',
        a: 'Absolutely. Invite family members for private accountability—no social feed, no public sharing. They can see your progress and support you without comparison or noise. Your data stays yours; you choose exactly who has access. It\'s designed for people who want real accountability from people who care, not from strangers online.',
      },
    ],
  },
  {
    id: 'account',
    title: 'Account & Billing',
    icon: CreditCard,
    items: [
      {
        q: 'How do I cancel my subscription?',
        a: 'Cancel anytime from your account settings. Your access continues until the end of your current billing period—we don\'t cut you off immediately. There are no long-term contracts or cancellation fees. If you change your mind, you can resubscribe whenever you\'re ready.',
      },
      {
        q: 'What payment methods do you accept?',
        a: 'We accept all major credit cards and debit cards. Payments are securely processed through Stripe. You can update your payment method or billing address anytime in your account settings.',
      },
      {
        q: 'Can I switch plans or upgrade later?',
        a: 'Yes. You can upgrade or change your plan from your account. When you upgrade, you\'ll be charged the prorated difference for the remainder of your billing period. Downgrades take effect at the start of your next billing cycle.',
      },
    ],
  },
  {
    id: 'privacy',
    title: 'Privacy & Data',
    icon: Shield,
    items: [
      {
        q: 'Is my data private and secure?',
        a: 'Yes. Your goals, plans, and check-ins are private by default. We don\'t sell your data, and we don\'t use it for advertising. Data is encrypted in transit and at rest. If you invite family, only the people you explicitly add can see your shared content—nothing is public or searchable.',
      },
      {
        q: 'Can I export my data?',
        a: 'Yes. You can export your goals, plans, and progress data from your account settings. We believe your data belongs to you, and we make it easy to take it with you if you ever decide to leave.',
      },
      {
        q: 'Does my data sync across devices?',
        a: 'Yes. Your information transfers back and forth between your computer, tablet, and phone. When you sign in on any device, you see the same goals, plans, and progress.',
      },
    ],
  },
];

const FAQ: React.FC = () => {
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  return (
    <LandingPageLayout>
      {/* Hero */}
      <section
        id="hero"
        className="relative py-20 sm:py-28 px-4 min-h-[28rem] flex items-center justify-center overflow-hidden"
      >
        <div
          className="absolute inset-0 bg-cover bg-center scale-105"
          style={{ backgroundImage: `url(${faqBg})` }}
          aria-hidden
        />
        <HeroFloatingCircles />
        <div className="absolute inset-0 opacity-[0.06]" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '32px 32px' }} aria-hidden />
        <div className="relative z-10 max-w-6xl mx-auto text-center px-4 sm:px-6">
          <div
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold mb-6 animate-slide-up"
            style={{ backgroundColor: 'var(--landing-primary)', color: 'white', animationDelay: '0.1s' }}
          >
            <HelpCircle className="h-4 w-4" />
            Everything you need to know
          </div>
          <h1
            className="text-4xl sm:text-5xl md:text-6xl font-bold mb-6 text-gray-900 drop-shadow-[0_1px_2px_rgba(255,255,255,0.9)] animate-slide-up"
            style={{ animationDelay: '0.1s' }}
          >
            Frequently Asked Questions
          </h1>
          <p
            className="text-lg sm:text-xl mb-10 font-semibold max-w-2xl mx-auto text-gray-900 drop-shadow-[0_1px_2px_rgba(255,255,255,0.8)] animate-slide-up"
            style={{ animationDelay: '0.2s' }}
          >
            Clear, honest answers about our personal growth system—what it is, how it works, and how we help you be the person you want to become.
          </p>
        </div>
      </section>

      {/* Explanation — editorial intro */}
      <section
        className="py-16 sm:py-20 px-4 relative overflow-hidden"
        style={{ backgroundColor: 'var(--landing-bg)', borderTop: '1px solid var(--landing-border)' }}
      >
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, var(--landing-primary) 1px, transparent 0)', backgroundSize: '28px 28px' }} />
        <div className="max-w-6xl mx-auto text-center relative px-4 sm:px-6">
          <p className="text-base sm:text-lg leading-relaxed" style={{ color: 'var(--landing-text)', opacity: 0.9 }}>
            We believe transparency builds trust. Below you&apos;ll find detailed answers to the questions we hear most—grouped by topic so you can quickly find what matters to you. If something isn&apos;t covered here, we&apos;re always happy to help via{' '}
            <button onClick={() => navigate('/contact')} className="font-semibold underline underline-offset-2 hover:no-underline" style={{ color: 'var(--landing-primary)' }}>contact</button>.
          </p>
        </div>
      </section>

      {/* Category nav — sticky on desktop, horizontal scroll on mobile */}
      <section
        className="sticky top-16 z-40 py-4 px-4 border-b"
        style={{ backgroundColor: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(12px)', borderColor: 'var(--landing-border)' }}
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex gap-2 overflow-x-auto pb-2 -mx-2 scrollbar-hide justify-center">
            {faqCategories.map((cat) => {
              const Icon = cat.icon;
              const isActive = activeCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => {
                    setActiveCategory(isActive ? null : cat.id);
                    document.getElementById(`faq-${cat.id}`)?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className={cn(
                    'flex items-center gap-2 px-4 py-2.5 rounded-xl whitespace-nowrap font-medium transition-all duration-200 shrink-0',
                    isActive
                      ? 'text-white shadow-md'
                      : 'hover:bg-[var(--landing-accent)]',
                  )}
                  style={isActive ? { backgroundColor: 'var(--landing-primary)' } : { color: 'var(--landing-text)' }}
                >
                  <Icon className="h-4 w-4" />
                  {cat.title}
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* FAQ Grid — bento-style, non-traditional layout */}
      <section id="faq" className="py-16 sm:py-24 px-4 relative overflow-hidden" style={{ backgroundColor: 'var(--landing-accent)', borderTop: '1px solid var(--landing-border)' }}>
        <div className="absolute inset-0 opacity-[0.04] pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, var(--landing-primary) 1px, transparent 0)', backgroundSize: '24px 24px' }} />
        <div className="max-w-6xl mx-auto relative space-y-16 px-4 sm:px-6">
          {faqCategories.map((category, catIndex) => {
            const Icon = category.icon;
            return (
              <div
                key={category.id}
                id={`faq-${category.id}`}
                className="scroll-mt-32"
                onMouseEnter={() => setActiveCategory(category.id)}
              >
                <div className="flex items-center gap-3 mb-8">
                  <div
                    className="w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-lg"
                    style={{ backgroundColor: 'var(--landing-primary)' }}
                  >
                    <Icon className="h-6 w-6" strokeWidth={2} />
                  </div>
                  <div>
                    <h2 className="text-xl sm:text-2xl font-bold" style={{ color: 'var(--landing-text)' }}>{category.title}</h2>
                    <p className="text-sm opacity-70" style={{ color: 'var(--landing-text)' }}>{category.items.length} questions</p>
                  </div>
                </div>

                <div className="space-y-4">
                  {category.items.map((item, i) => (
                    <Collapsible key={i}>
                      <article
                        className={cn(
                          'group rounded-2xl overflow-hidden transition-all duration-300',
                          'border hover:shadow-lg',
                        )}
                        style={{
                          borderColor: 'var(--landing-border)',
                          backgroundColor: 'white',
                          boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
                        }}
                      >
                        <CollapsibleTrigger className="group flex w-full items-start justify-between gap-4 px-5 sm:px-6 py-5 text-left">
                          <span className="flex items-center gap-4 flex-1 min-w-0">
                            <span
                              className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold"
                              style={{ backgroundColor: 'var(--landing-accent)', color: 'var(--landing-primary)' }}
                            >
                              {i + 1}
                            </span>
                            <span className="font-semibold text-base sm:text-lg leading-snug" style={{ color: 'var(--landing-text)' }}>
                              {item.q}
                            </span>
                          </span>
                          <ChevronDown className="h-5 w-5 shrink-0 mt-0.5 opacity-50 transition-transform duration-200 group-data-[state=open]:rotate-180" style={{ color: 'var(--landing-primary)' }} />
                        </CollapsibleTrigger>
                        <CollapsibleContent>
                          <div
                            className="px-5 sm:px-6 pb-5 pl-[4.5rem] sm:pl-[4.75rem]"
                            style={{ borderTop: '1px solid var(--landing-border)' }}
                          >
                            <p className="pt-4 text-sm sm:text-base leading-relaxed" style={{ color: 'var(--landing-text)', opacity: 0.88 }}>
                              {item.a}
                            </p>
                          </div>
                        </CollapsibleContent>
                      </article>
                    </Collapsible>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Still have questions — CTA */}
      <section
        className="py-16 sm:py-20 px-4 relative overflow-hidden"
        style={{ backgroundColor: 'var(--landing-bg)', borderTop: '1px solid var(--landing-border)' }}
      >
        <div className="max-w-2xl mx-auto text-center">
          <Target className="h-12 w-12 mx-auto mb-4 opacity-80" style={{ color: 'var(--landing-primary)' }} />
          <h2 className="text-2xl sm:text-3xl font-bold mb-3" style={{ color: 'var(--landing-text)' }}>Still have questions?</h2>
          <p className="text-base opacity-85 mb-8" style={{ color: 'var(--landing-text)' }}>
            We&apos;re here to help. Reach out anytime—we typically respond within 24 hours.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="lg"
              variant="outline"
              onClick={() => navigate('/contact')}
              className="border-2"
              style={{ borderColor: 'var(--landing-primary)', color: 'var(--landing-primary)' }}
            >
              Contact us
            </Button>
            <AuthModal
              trigger={
                <Button size="lg" variant="default" className="trial-cta">
                  Start free trial
                </Button>
              }
              defaultMode="signup"
            />
          </div>
        </div>
      </section>

    </LandingPageLayout>
  );
};

export default FAQ;
