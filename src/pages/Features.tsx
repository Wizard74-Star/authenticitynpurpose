import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, X, Check, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AuthModal } from '@/components/auth/AuthModal';
import { LandingPageLayout } from '@/components/LandingPageLayout';
import { HeroFloatingCircles } from '@/components/HeroFloatingCircles';
import featuresBg from '@/assets/images/features-bg.jpg';
import goalsImg from '@/assets/images/Goals.jpg';
import writtenPlanImg from '@/assets/images/Written-plan.jpg';
import calendarImg from '@/assets/images/Calendar.jpg';
import aiAnalysisImg from '@/assets/images/AI-analysis.jpg';
import getAIFeedbackImg from '@/assets/images/Get-AI-feedback-on-your-progress.jpg';
import familyConnectionImg from '@/assets/images/Family-connection.jpg';

const featureShowcaseItems = [
  { img: goalsImg, title: 'Goals', desc: 'Set and track what matters to you.' },
  { img: writtenPlanImg, title: 'Written plan', desc: 'Clarify your path in your own words.' },
  { img: calendarImg, title: 'Calendar', desc: 'Attach goals to time and reminders.' },
  { img: aiAnalysisImg, title: 'AI analysis', desc: 'Insights that help you improve.' },
  { img: familyConnectionImg, title: 'Family connection', desc: 'Private accountability, not social sharing.' },
];

const Features: React.FC = () => {
  const navigate = useNavigate();

  return (
    <LandingPageLayout>
      {/* Hero — like Landing page */}
      <section
        id="hero"
        className="relative py-20 sm:py-28 px-4 min-h-[28rem] flex items-center justify-center overflow-hidden"
      >
        <div className="absolute inset-0" aria-hidden>
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url(${featuresBg})` }}
          />
        </div>
        <div className="absolute inset-0" style={{ backgroundColor: 'var(--landing-accent)', opacity: 0.85 }} aria-hidden />
        <HeroFloatingCircles />
        <div className="relative z-10 max-w-6xl mx-auto text-center px-4 sm:px-6">
          <h1
            className="text-4xl sm:text-5xl md:text-6xl font-bold mb-6 bg-clip-text text-transparent animate-slide-up"
            style={{
              backgroundImage: 'linear-gradient(135deg, var(--landing-primary) 0%, var(--landing-primary-soft) 50%, #1a6b4f 100%)',
              WebkitBackgroundClip: 'text',
              backgroundClip: 'text',
              animationDelay: '0.1s',
            }}
          >
            The best personal growth system—built for your success
          </h1>
          <p
            className="text-lg sm:text-xl mb-10 font-bold max-w-2xl mx-auto bg-clip-text text-transparent animate-slide-up"
            style={{
              backgroundImage: 'linear-gradient(135deg, #4a5568 0%, #2d3748 50%, #1a1a1a 100%)',
              WebkitBackgroundClip: 'text',
              backgroundClip: 'text',
              animationDelay: '0.25s',
            }}
          >
            Not another task app or habit tracker. Goals with steps, timelines, percent complete, and deadlines; progress photo uploads; and a home screen you can customize with your own picture. AI-powered insights and clear plans—in one place.
          </p>
          <div
            className="flex flex-col sm:flex-row gap-4 justify-center animate-slide-up"
            style={{ animationDelay: '0.4s' }}
          >
            <AuthModal
              trigger={
                <Button size="lg" variant="default" className="trial-cta">
                  Start 7-day free trial
                </Button>
              }
              defaultMode="signup"
            />
            <Button
              size="lg"
              variant="outline"
              onClick={() => navigate('/demo')}
              className="hero-cta-outline"
            >
              Watch demo
            </Button>
          </div>
        </div>
      </section>

      {/* 1. Feature Showcase — bento-style with imagery */}
      <section id="features" className="py-20 px-4 overflow-hidden" style={{ backgroundColor: 'var(--landing-bg)', borderTop: '1px solid var(--landing-border)' }}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <h2 className="text-2xl sm:text-3xl font-bold mb-3 text-center" style={{ color: 'var(--landing-text)' }}>Feature Showcase</h2>
          <p className="text-center text-sm opacity-80 mb-14 max-w-xl mx-auto" style={{ color: 'var(--landing-text)' }}>Everything you need to grow—beautifully designed</p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 auto-rows-fr">
            {/* Goals — spans 2 cols, 2 rows */}
            <article className="group relative sm:col-span-2 sm:row-span-2 min-h-[280px] sm:min-h-[360px] rounded-3xl overflow-hidden border transition-all duration-500 feature-card-shadow" style={{ borderColor: 'var(--landing-border)' }}>
              <div className="absolute inset-0 bg-cover bg-center transition-transform duration-700 ease-out group-hover:scale-110" style={{ backgroundImage: `url(${goalsImg})` }} />
              <div className="absolute inset-0 rounded-3xl" style={{ background: 'linear-gradient(to top, rgba(26, 107, 79, 0.9) 0%, rgba(44, 157, 115, 0.5) 50%, transparent 100%)' }} />
              <div className="absolute inset-0 rounded-3xl pointer-events-none" style={{ boxShadow: 'inset 0 0 0 1px rgba(44, 157, 115, 0.25)' }} />
              <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-8">
                <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider mb-3 text-white" style={{ backgroundColor: 'var(--landing-primary)' }}>Core</span>
                <h3 className="text-xl sm:text-2xl font-bold text-white mb-2">{featureShowcaseItems[0].title}</h3>
                <p className="text-sm text-white/95">{featureShowcaseItems[0].desc}</p>
              </div>
            </article>

            {/* Written plan */}
            <article className="group relative min-h-[200px] sm:min-h-[240px] rounded-3xl overflow-hidden border transition-all duration-500 feature-card-shadow" style={{ borderColor: 'var(--landing-border)' }}>
              <div className="absolute inset-0 bg-cover bg-center transition-transform duration-700 ease-out group-hover:scale-110" style={{ backgroundImage: `url(${writtenPlanImg})` }} />
              <div className="absolute inset-0 rounded-3xl" style={{ background: 'linear-gradient(to top, rgba(26, 107, 79, 0.88) 0%, rgba(44, 157, 115, 0.4) 45%, transparent 100%)' }} />
              <div className="absolute inset-0 rounded-3xl pointer-events-none" style={{ boxShadow: 'inset 0 0 0 1px rgba(44, 157, 115, 0.25)' }} />
              <div className="absolute bottom-0 left-0 right-0 p-5">
                <h3 className="text-lg font-bold text-white mb-1">{featureShowcaseItems[1].title}</h3>
                <p className="text-xs text-white/95">{featureShowcaseItems[1].desc}</p>
              </div>
            </article>

            {/* Calendar */}
            <article className="group relative min-h-[200px] sm:min-h-[240px] rounded-3xl overflow-hidden border transition-all duration-500 feature-card-shadow" style={{ borderColor: 'var(--landing-border)' }}>
              <div className="absolute inset-0 bg-cover bg-center transition-transform duration-700 ease-out group-hover:scale-110" style={{ backgroundImage: `url(${calendarImg})` }} />
              <div className="absolute inset-0 rounded-3xl" style={{ background: 'linear-gradient(to top, rgba(26, 107, 79, 0.88) 0%, rgba(44, 157, 115, 0.4) 45%, transparent 100%)' }} />
              <div className="absolute inset-0 rounded-3xl pointer-events-none" style={{ boxShadow: 'inset 0 0 0 1px rgba(44, 157, 115, 0.25)' }} />
              <div className="absolute bottom-0 left-0 right-0 p-5">
                <h3 className="text-lg font-bold text-white mb-1">{featureShowcaseItems[2].title}</h3>
                <p className="text-xs text-white/95">{featureShowcaseItems[2].desc}</p>
              </div>
            </article>

            {/* AI analysis */}
            <article className="group relative min-h-[200px] sm:min-h-[240px] rounded-3xl overflow-hidden border transition-all duration-500 feature-card-shadow" style={{ borderColor: 'var(--landing-border)' }}>
              <div className="absolute inset-0 bg-cover bg-center transition-transform duration-700 ease-out group-hover:scale-110" style={{ backgroundImage: `url(${aiAnalysisImg})` }} />
              <div className="absolute inset-0 rounded-3xl" style={{ background: 'linear-gradient(to top, rgba(26, 107, 79, 0.88) 0%, rgba(44, 157, 115, 0.4) 45%, transparent 100%)' }} />
              <div className="absolute inset-0 rounded-3xl pointer-events-none" style={{ boxShadow: 'inset 0 0 0 1px rgba(44, 157, 115, 0.25)' }} />
              <div className="absolute bottom-0 left-0 right-0 p-5">
                <h3 className="text-lg font-bold text-white mb-1">{featureShowcaseItems[3].title}</h3>
                <p className="text-xs text-white/95">{featureShowcaseItems[3].desc}</p>
              </div>
            </article>

            {/* Family connection — spans 2 cols on lg */}
            <article className="group relative sm:col-span-2 min-h-[200px] sm:min-h-[220px] rounded-3xl overflow-hidden border transition-all duration-500 feature-card-shadow" style={{ borderColor: 'var(--landing-border)' }}>
              <div className="absolute inset-0 bg-cover bg-center transition-transform duration-700 ease-out group-hover:scale-110" style={{ backgroundImage: `url(${familyConnectionImg})` }} />
              <div className="absolute inset-0 rounded-3xl" style={{ background: 'linear-gradient(to top, rgba(26, 107, 79, 0.9) 0%, rgba(44, 157, 115, 0.5) 50%, transparent 100%)' }} />
              <div className="absolute inset-0 rounded-3xl pointer-events-none" style={{ boxShadow: 'inset 0 0 0 1px rgba(44, 157, 115, 0.25)' }} />
              <div className="absolute bottom-0 left-0 right-0 p-6">
                <h3 className="text-xl font-bold text-white mb-2">{featureShowcaseItems[4].title}</h3>
                <p className="text-sm text-white/95">{featureShowcaseItems[4].desc}</p>
              </div>
            </article>
          </div>
        </div>
      </section>

      {/* 2. AI & Analysis — problem vs solution */}
      <section id="ai-analysis" className="py-20 px-4 overflow-hidden relative" style={{ backgroundColor: 'var(--landing-bg)', borderTop: '1px solid var(--landing-border)' }}>
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, var(--landing-primary) 1px, transparent 0)', backgroundSize: '24px 24px' }} />
        <div className="max-w-6xl mx-auto relative">
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
            {/* Image — full bleed on left */}
            <div className="relative order-2 lg:order-1">
              <div className="aspect-[4/3] rounded-3xl overflow-hidden border feature-card-shadow group" style={{ borderColor: 'var(--landing-border)' }}>
                <img src={getAIFeedbackImg} alt="AI feedback on your progress" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                <div className="absolute inset-0 rounded-3xl" style={{ background: 'linear-gradient(to top, rgba(26, 107, 79, 0.3) 0%, transparent 50%)' }} />
              </div>
              <div className="absolute -bottom-4 -right-4 w-24 h-24 rounded-2xl flex items-center justify-center hidden sm:flex" style={{ backgroundColor: 'var(--landing-primary)', boxShadow: '0 8px 24px rgba(44, 157, 115, 0.35)' }}>
                <Sparkles className="h-12 w-12 text-white" />
              </div>
            </div>

            {/* Content — problem vs solution */}
            <div className="order-1 lg:order-2">
              <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider mb-4" style={{ backgroundColor: 'var(--landing-accent)', color: 'var(--landing-primary)' }}>AI & Analysis</span>
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-8" style={{ color: 'var(--landing-text)' }}>Insights that actually help you improve</h2>

              <div className="grid sm:grid-cols-2 gap-6">
                {/* Problems with other apps */}
                <div className="rounded-2xl p-6 border" style={{ backgroundColor: 'rgba(220, 53, 69, 0.04)', borderColor: 'rgba(220, 53, 69, 0.2)' }}>
                  <div className="flex items-center gap-2 mb-4">
                    <X className="h-5 w-5 text-red-500" />
                    <h3 className="font-bold" style={{ color: 'var(--landing-text)' }}>Other apps</h3>
                  </div>
                  <ul className="space-y-2 text-sm" style={{ color: 'var(--landing-text)', opacity: 0.9 }}>
                    <li>• Just store goals—no real analysis</li>
                    <li>• Habit trackers show streaks, not <em>why</em> you slip</li>
                    <li>• No behavioral insights—you're left guessing</li>
                    <li>• Generic tips, never personalized</li>
                  </ul>
                </div>

                {/* Our solution */}
                <div className="rounded-2xl p-6 border feature-card-shadow" style={{ backgroundColor: 'var(--landing-accent)', borderColor: 'rgba(44, 157, 115, 0.3)' }}>
                  <div className="flex items-center gap-2 mb-4">
                    <Check className="h-5 w-5 text-white" style={{ backgroundColor: 'var(--landing-primary)', borderRadius: '50%', padding: 2 }} />
                    <h3 className="font-bold" style={{ color: 'var(--landing-primary)' }}>Our solution</h3>
                  </div>
                  <ul className="space-y-2 text-sm" style={{ color: 'var(--landing-text)' }}>
                    <li>• AI analyzes your progress patterns, not just stores data</li>
                    <li>• Identifies when and why you slip—actionable feedback</li>
                    <li>• Insights tailored to your behavior</li>
                    <li>• Continuous improvement, not static checklists</li>
                  </ul>
                </div>
              </div>
              <p className="mt-6 text-sm font-medium" style={{ color: 'var(--landing-text)', opacity: 0.85 }}>This is what makes it premium—real intelligence behind your goals.</p>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Family / Accountability — problem vs solution */}
      <section id="family-accountability" className="py-20 px-4 overflow-hidden relative" style={{ backgroundColor: 'var(--landing-accent)', borderTop: '1px solid var(--landing-border)' }}>
        <div className="absolute inset-0 opacity-[0.04] pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, var(--landing-primary) 1px, transparent 0)', backgroundSize: '28px 28px' }} />
        <div className="max-w-6xl mx-auto relative">
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
            {/* Content — problem vs solution (left on desktop) */}
            <div>
              <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider mb-4" style={{ backgroundColor: 'var(--landing-primary)', color: 'white' }}>Family & Accountability</span>
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-8" style={{ color: 'var(--landing-text)' }}>Private accountability, not social noise</h2>

              <div className="grid sm:grid-cols-2 gap-6">
                {/* Problems with other apps */}
                <div className="rounded-2xl p-6 border bg-white" style={{ borderColor: 'var(--landing-border)' }}>
                  <div className="flex items-center gap-2 mb-4">
                    <X className="h-5 w-5 text-red-500" />
                    <h3 className="font-bold" style={{ color: 'var(--landing-text)' }}>Other apps</h3>
                  </div>
                  <ul className="space-y-2 text-sm" style={{ color: 'var(--landing-text)', opacity: 0.9 }}>
                    <li>• Social = public sharing, comparison, pressure</li>
                    <li>• Going alone = no accountability, easy to quit</li>
                    <li>• Group apps = too much noise, no real support</li>
                    <li>• No option for a trusted private circle</li>
                  </ul>
                </div>

                {/* Our solution */}
                <div className="rounded-2xl p-6 border feature-card-shadow" style={{ backgroundColor: 'white', borderColor: 'rgba(44, 157, 115, 0.3)', boxShadow: '0 4px 20px rgba(44, 157, 115, 0.12)' }}>
                  <div className="flex items-center gap-2 mb-4">
                    <Check className="h-5 w-5 text-white" style={{ backgroundColor: 'var(--landing-primary)', borderRadius: '50%', padding: 2 }} />
                    <h3 className="font-bold" style={{ color: 'var(--landing-primary)' }}>Our solution</h3>
                  </div>
                  <ul className="space-y-2 text-sm" style={{ color: 'var(--landing-text)' }}>
                    <li>• Private family circles—no public feed, ever</li>
                    <li>• Real accountability from people who care</li>
                    <li>• Your data stays yours—invite only who you trust</li>
                    <li>• Support without comparison or social pressure</li>
                  </ul>
                </div>
              </div>
              <p className="mt-6 text-sm font-medium" style={{ color: 'var(--landing-text)', opacity: 0.85 }}>Grow together, privately. No likes, no followers—just progress.</p>
            </div>

            {/* Image — right side */}
            <div className="relative">
              <div className="aspect-[4/3] rounded-3xl overflow-hidden border feature-card-shadow group" style={{ borderColor: 'var(--landing-border)' }}>
                <img src={familyConnectionImg} alt="Family connection and accountability" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                <div className="absolute inset-0 rounded-3xl" style={{ background: 'linear-gradient(to top, rgba(26, 107, 79, 0.35) 0%, transparent 55%)' }} />
              </div>
              <div className="absolute -bottom-4 -left-4 w-24 h-24 rounded-2xl flex items-center justify-center hidden sm:flex" style={{ backgroundColor: 'var(--landing-primary)', boxShadow: '0 8px 24px rgba(44, 157, 115, 0.35)' }}>
                <Users className="h-12 w-12 text-white" />
              </div>
            </div>
          </div>
        </div>
      </section>
    </LandingPageLayout>
  );
};

export default Features;
