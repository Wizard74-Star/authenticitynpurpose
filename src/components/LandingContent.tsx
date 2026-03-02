import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, useScroll, useTransform, useInView } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { AuthModal } from '@/components/auth/AuthModal';
import { Target, Calendar, Check, BookOpen, Sparkles, Users, BarChart3, Smartphone, AppWindow, UserX, TrendingUp, ArrowRight, Zap, Award, ShieldCheck } from 'lucide-react';
import { HeroFloatingCircles } from '@/components/HeroFloatingCircles';
import landingBg1 from '@/assets/images/landing-bg1.png';
import landingBg2 from '@/assets/images/landing-bg2.png';
import landingBg3 from '@/assets/images/landing-bg3.png';
import stepImg1 from '@/assets/images/Choose-who-you-want-to-become.jpg';
import stepImg2 from '@/assets/images/Write-your-goals-and-development-plan.jpg';
import stepImg3 from '@/assets/images/Attach-goals-to-time.jpg';
import stepImg4 from '@/assets/images/Get-AI-feedback-on-your-progress.jpg';
import successPhoneImg from '@/assets/images/hand-holding-smartphone-displaying-financial-app-with-quotsuccessquot-notification_1298745-37939.jpg';
import problemImg1 from '@/assets/images/happy-man.jpg';
import problemImg2 from '@/assets/images/marketing-pretty-young-blonde-girl-grey-suit-office-very-upset-tired_140725-165512.avif';
import problemImg3 from '@/assets/images/Success-Man.jpg';
import problemImg4 from '@/assets/images/family-connection.jpg';  
import problemImg5 from '@/assets/images/Get-AI-feedback-on-your-progress.jpg';

const heroSlides = [
  { bg: landingBg1, headline: 'Ready to chart your own course!' },
  { bg: landingBg2, headline: 'Choose your own path.' },
  { bg: landingBg3, headline: 'Build deeper connections!' },
];

const heroSubline = 'Your private space to plan, track, and grow—without comparison.';

const SLIDE_INTERVAL_MS = 10000;

const problemCardVariants = {
  hidden: { opacity: 0, y: 48, rotateX: -12 },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    rotateX: 0,
    transition: { delay: i * 0.1, duration: 0.75, ease: [0.22, 1, 0.36, 1] },
  }),
  hover: {
    rotateY: 4,
    rotateX: -3,
    scale: 1.015,
    boxShadow: '0 24px 48px -12px rgba(0,0,0,0.12), 0 0 0 1px rgba(0,0,0,0.04)',
    transition: { duration: 0.3, ease: [0.22, 1, 0.36, 1] },
  },
  tap: {
    rotateY: 2,
    rotateX: -2,
    scale: 0.995,
    boxShadow: '0 18px 40px -14px rgba(0,0,0,0.14), 0 0 0 1px rgba(0,0,0,0.05)',
    transition: { duration: 0.2, ease: [0.22, 1, 0.36, 1] },
  },
};

type ProblemItem = {
  image: string;
  title: string;
  stats: { value: string; label: string }[];
  problemDesc: string;
  solution: string;
  basicClosing: string;
};

const ProblemCard: React.FC<{ item: ProblemItem; index: number }> = ({ item, index: i }) => {
  const ref = useRef<HTMLElement>(null);
  const isInView = useInView(ref, { once: true, amount: 0.12 });
  const { image, title, stats, problemDesc, solution, basicClosing } = item;
  const firstLetter = title.charAt(0);
  const restTitle = title.slice(1);
  return (
    <motion.article
      ref={ref}
      className="group relative overflow-hidden rounded-2xl border bg-white"
      style={{
        borderColor: 'var(--landing-border)',
        boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
        transformStyle: 'preserve-3d',
      }}
      variants={problemCardVariants}
      initial="hidden"
      animate={isInView ? 'show' : 'hidden'}
      custom={i}
      whileHover="hover"
      whileTap="tap"
    >
      <div className="flex flex-col lg:flex-row min-h-0">
        <div className="lg:w-[42%] flex flex-col">
          <motion.div
            className="relative aspect-[4/3] overflow-hidden rounded-t-2xl lg:rounded-l-2xl lg:rounded-tr-none"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={isInView ? { opacity: 1, scale: 1 } : {}}
            transition={{ delay: 0.25 + i * 0.1, duration: 0.75, ease: [0.22, 1, 0.36, 1] }}
          >
            <img
              src={image}
              alt=""
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
          </motion.div>
          <div className="flex border-t border-b lg:border-b-0 lg:border-r" style={{ borderColor: 'var(--landing-border)' }}>
            {stats.map(({ value, label }, j) => (
              <motion.div
                key={j}
                className="flex-1 py-4 px-3 text-center border-r last:border-r-0"
                style={{ borderColor: 'var(--landing-border)' }}
                initial={{ opacity: 0, y: 8 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ delay: 0.35 + i * 0.1 + j * 0.06, duration: 0.6 }}
              >
                <div className="text-lg sm:text-xl font-bold" style={{ color: 'var(--landing-primary)' }}>{value}</div>
                <div className="text-[10px] font-semibold uppercase tracking-widest mt-0.5 opacity-70" style={{ color: 'var(--landing-text)' }}>{label}</div>
              </motion.div>
            ))}
          </div>
        </div>
        <div className="flex-1 p-6 sm:p-8 flex flex-col justify-center">
          <motion.h3
            className="text-lg sm:text-xl lg:text-2xl font-bold mb-3 leading-tight"
            style={{ color: 'var(--landing-text)' }}
            initial={{ opacity: 0, y: 12 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.3 + i * 0.1, duration: 0.65 }}
          >
            <span className="text-2xl sm:text-3xl lg:text-4xl" style={{ color: 'var(--landing-primary)' }}>{firstLetter}</span>
            <span style={{ color: 'var(--landing-primary)' }}>{restTitle}</span>
          </motion.h3>
          <motion.p
            className="text-sm sm:text-base opacity-90 mb-5 leading-relaxed"
            style={{ color: 'var(--landing-text)' }}
            initial={{ opacity: 0 }}
            animate={isInView ? { opacity: 1 } : {}}
            transition={{ delay: 0.35 + i * 0.1, duration: 0.6 }}
          >
            {problemDesc}
          </motion.p>
          <div className="grid grid-cols-2 gap-3 sm:gap-4 mb-5">
            <motion.div
              className="p-4 rounded-xl border-l-4"
              style={{ borderColor: '#dc2626', backgroundColor: 'rgba(220,38,38,0.06)' }}
              initial={{ opacity: 0, x: -8 }}
              animate={isInView ? { opacity: 1, x: 0 } : {}}
              transition={{ delay: 0.4 + i * 0.1, duration: 0.6 }}
            >
              <span className="text-[10px] font-bold uppercase tracking-widest block mb-1.5" style={{ color: '#dc2626' }}>Problem</span>
              <p className="text-xs sm:text-sm leading-relaxed" style={{ color: 'var(--landing-text)' }}>{problemDesc}</p>
            </motion.div>
            <motion.div
              className="p-4 rounded-xl border-l-4"
              style={{ borderColor: 'var(--landing-primary)', backgroundColor: 'var(--landing-accent)' }}
              initial={{ opacity: 0, x: 8 }}
              animate={isInView ? { opacity: 1, x: 0 } : {}}
              transition={{ delay: 0.45 + i * 0.1, duration: 0.6 }}
            >
              <span className="text-xs font-bold uppercase tracking-widest block mb-1.5" style={{ color: 'var(--landing-primary)' }}>Our solution</span>
              <p className="text-xs sm:text-sm font-bold leading-relaxed" style={{ color: 'var(--landing-text)' }}>{solution}</p>
            </motion.div>
          </div>
          <motion.p
            className="text-base sm:text-lg font-bold leading-snug"
            style={{ color: 'var(--landing-primary)' }}
            initial={{ opacity: 0, y: 6 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.55 + i * 0.1, duration: 0.6 }}
          >
            {basicClosing}
          </motion.p>
        </div>
      </div>
    </motion.article>
  );
};

type StepItem = { step: number; title: string; icon: React.ComponentType<{ className?: string }>; img: string };

const HowItWorksStepCard: React.FC<{ item: StepItem; index: number }> = ({ item, index }) => {
  const ref = useRef<HTMLElement>(null);
  const isInView = useInView(ref, { once: true, amount: 0.15 });
  const { step, title, icon: Icon, img } = item;
  return (
    <motion.article
      ref={ref}
      className="group rounded-2xl overflow-hidden border bg-white"
      style={{
        borderColor: 'var(--landing-border)',
        transformStyle: 'preserve-3d',
        boxShadow: '0 4px 20px rgba(44, 157, 115, 0.06), 0 0 0 1px rgba(0,0,0,0.03)',
      }}
      initial={{ opacity: 0, y: 48, rotateX: 14 }}
      animate={isInView ? { opacity: 1, y: 0, rotateX: 0 } : { opacity: 0, y: 48, rotateX: 14 }}
      transition={{
        delay: 0.2 + index * 0.15,
        duration: 1,
        ease: [0.22, 1, 0.36, 1],
      }}
      whileHover={{
        rotateY: 4,
        rotateX: -3,
        y: -8,
        scale: 1.02,
        boxShadow: '0 24px 48px -12px rgba(44, 157, 115, 0.18), 0 0 0 1px rgba(44, 157, 115, 0.08)',
        transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] },
      }}
    >
      <div className="relative aspect-[4/3] overflow-hidden">
        <motion.img
          src={img}
          alt={title}
          className="h-full w-full object-cover"
          whileHover={{ scale: 1.08 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        />
        <motion.div
          className="absolute top-3 left-3 w-11 h-11 rounded-xl flex items-center justify-center text-white shadow-lg"
          style={{
            backgroundColor: 'var(--landing-primary)',
            boxShadow: '0 4px 14px rgba(44, 157, 115, 0.35)',
          }}
          initial={{ scale: 0, rotate: -180 }}
          animate={isInView ? { scale: 1, rotate: 0 } : { scale: 0, rotate: -180 }}
          transition={{
            delay: 0.45 + index * 0.15,
            duration: 0.75,
            type: 'spring',
            stiffness: 200,
            damping: 20,
          }}
          whileHover={{ scale: 1.1, rotate: 5 }}
        >
          <Icon className="h-5 w-5" />
        </motion.div>
        <div
          className="absolute bottom-0 left-0 right-0 h-1/2 bg-gradient-to-t from-black/60 to-transparent"
          aria-hidden
        />
        <motion.span
          className="absolute bottom-3 left-3 text-white text-xs font-semibold tracking-wide uppercase"
          style={{ textShadow: '0 1px 2px rgba(0,0,0,0.5)' }}
          initial={{ opacity: 0, x: -12 }}
          animate={isInView ? { opacity: 1, x: 0 } : { opacity: 0, x: -12 }}
          transition={{ delay: 0.6 + index * 0.15, duration: 0.6 }}
        >
          Step {step}
        </motion.span>
      </div>
      <motion.div
        className="p-4 sm:p-5 text-center"
        initial={{ opacity: 0 }}
        animate={isInView ? { opacity: 1 } : { opacity: 0 }}
        transition={{ delay: 0.55 + index * 0.15, duration: 0.6 }}
      >
        <p className="font-semibold text-sm sm:text-base leading-snug" style={{ color: 'var(--landing-text)' }}>
          {title}
        </p>
      </motion.div>
    </motion.article>
  );
};

export const LandingContent: React.FC = () => {
  const navigate = useNavigate();
  const heroRef = useRef<HTMLElement>(null);
  const problemSectionRef = useRef<HTMLElement>(null);
  const problemIntroRef = useRef<HTMLDivElement>(null);
  const goalCategoriesRef = useRef<HTMLDivElement>(null);
  const problemClosingRef = useRef<HTMLDivElement>(null);
  const visionSectionRef = useRef<HTMLElement>(null);
  const visionBadgeRef = useRef<HTMLDivElement>(null);
  const visionBodyRef = useRef<HTMLDivElement>(null);
  const howItWorksSectionRef = useRef<HTMLElement>(null);
  const howItWorksIntroRef = useRef<HTMLDivElement>(null);
  const guaranteeStripRef = useRef<HTMLDivElement>(null);
  const guaranteeImageRef = useRef<HTMLDivElement>(null);
  const guaranteeContentRef = useRef<HTMLDivElement>(null);
  const ctaSectionRef = useRef<HTMLElement>(null);
  const ctaHeadlineRef = useRef<HTMLDivElement>(null);
  const ctaButtonRef = useRef<HTMLDivElement>(null);

  const isProblemInView = useInView(problemSectionRef, { once: true, amount: 0.08 });
  const isProblemIntroInView = useInView(problemIntroRef, { once: true, amount: 0.2 });
  const isGoalCategoriesInView = useInView(goalCategoriesRef, { once: true, amount: 0.15 });
  const isProblemClosingInView = useInView(problemClosingRef, { once: true, amount: 0.3 });
  const isVisionInView = useInView(visionSectionRef, { once: true, amount: 0.15 });
  const isVisionBadgeInView = useInView(visionBadgeRef, { once: true, amount: 0.25 });
  const isVisionBodyInView = useInView(visionBodyRef, { once: true, amount: 0.2 });
  const isHowItWorksInView = useInView(howItWorksSectionRef, { once: true, amount: 0.1 });
  const isHowItWorksIntroInView = useInView(howItWorksIntroRef, { once: true, amount: 0.3 });
  const isGuaranteeStripInView = useInView(guaranteeStripRef, { once: true, amount: 0.15 });
  const isGuaranteeImageInView = useInView(guaranteeImageRef, { once: true, amount: 0.2 });
  const isGuaranteeContentInView = useInView(guaranteeContentRef, { once: true, amount: 0.2 });
  const isCtaInView = useInView(ctaSectionRef, { once: true, amount: 0.2 });
  const isCtaHeadlineInView = useInView(ctaHeadlineRef, { once: true, amount: 0.4 });
  const isCtaButtonInView = useInView(ctaButtonRef, { once: true, amount: 0.3 });
  const [heroSlideIndex, setHeroSlideIndex] = useState(0);
  const [slideTick, setSlideTick] = useState(0);

  const problemItems: ProblemItem[] = [
    { image: problemImg1, title: 'No Trolls', stats: [{ value: '100%', label: 'PRIVATE' }, { value: '0', label: 'FEED' }, { value: '1', label: 'YOUR JOURNEY' }], problemDesc: 'Your feed becomes a highlight reel of everyone else. You compare your behind-the-scenes to their best moments—and it drains you.', solution: 'Private space, no feed. Your journey stays yours—no highlight reels, no comparison.', basicClosing: 'Comparison collapses your identity.' },
    { image: problemImg2, title: "Apps that don't change your life", stats: [{ value: '1', label: 'SYSTEM' }, { value: 'Goals', label: '+ PLAN' }, { value: 'Full', label: 'TRANSFORMATION' }], problemDesc: "Another to-do app, another habit tracker. They organize tasks but don't help you become someone new. You need a development system, not another inbox.", solution: 'Full development system: goals + written plan + calendar + AI feedback. One place to be the person you want to become.', basicClosing: 'Transformation, not another inbox.' },
    { image: problemImg3, title: 'Goals you set and forget', stats: [{ value: 'Written', label: 'PLAN' }, { value: 'Calendar', label: 'REVISIT' }, { value: 'Goals', label: 'STICK' }], problemDesc: 'New Year resolutions. Big ideas in a notes app. Without a written plan and a place to revisit them, goals fade by February.', solution: "Written plan + calendar + revisit. Attach goals to time with reminders so they don't fade.", basicClosing: 'Steps & Due Dates = 91% Progress.' },
    { image: problemImg4, title: 'No real accountability', stats: [{ value: 'Trusted', label: 'CIRCLE' }, { value: 'No', label: 'BROADCAST' }, { value: 'Real', label: 'SUPPORT' }], problemDesc: 'Going it alone is hard. You need someone in your corner—without broadcasting to the world.', solution: 'Family connection. Private accountability partners. Invite trusted people—no social feed.', basicClosing: 'Real support, Real results.' },
    { image: problemImg5, title: "No way to measure growth", stats: [{ value: 'Progress', label: 'TRACK' }, { value: 'AI', label: 'INSIGHTS' }, { value: 'Proof', label: 'OVER FEELING' }], problemDesc: "You feel like you're improving, but where's the proof? Without tracking progress over time, it's hard to see how far you've come.", solution: "Progress tracking with photos, percent complete, and AI insights. Upload progress photos, see percent complete, and get AI feedback on patterns and how to improve.", basicClosing: 'Proof over feeling.' },
  ];

  const stepItems: StepItem[] = [
    { step: 1, title: 'Choose who you want to become', icon: Target, img: stepImg1 },
    { step: 2, title: 'Write your authenticity and purpose plan', icon: BookOpen, img: stepImg2 },
    { step: 3, title: 'Attach goals to time (calendar + reminders)', icon: Calendar, img: stepImg3 },
    { step: 4, title: 'Get AI feedback on your progress', icon: Sparkles, img: stepImg4 },
  ];

  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ['start start', 'end start'],
  });
  const heroScale = useTransform(scrollYProgress, [0, 0.5, 1], [1, 0.92, 0.8]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.35, 0.75], [1, 0.5, 0]);

  useEffect(() => {
    const t = setInterval(() => {
      setHeroSlideIndex((i) => (i + 1) % 3);
    }, SLIDE_INTERVAL_MS);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    setSlideTick((prev) => prev + 1);
  }, [heroSlideIndex]);

  return (
    <>
      {/* 1. Hero — The Big Idea */}
      <section
        id="hero"
        ref={heroRef}
        className="relative py-20 sm:py-28 px-4 min-h-[28rem] flex items-center justify-center overflow-hidden"
      >
        <motion.div
          className="absolute inset-0 flex items-center justify-center origin-center"
          style={{ scale: heroScale, opacity: heroOpacity }}
        >
        <div className="absolute inset-0" aria-hidden>
          {heroSlides.map((slide, i) => (
            <div
              key={heroSlideIndex === i ? `hero-bg-${i}-${slideTick}` : `hero-bg-${i}`}
              className={`absolute inset-0 bg-cover bg-center transition-opacity duration-700 ease-out ${
                heroSlideIndex === i
                  ? 'opacity-100 animate-hero-bg-enter'
                  : 'opacity-0'
              }`}
              style={{ backgroundImage: `url(${slide.bg})` }}
            />
          ))}
        </div>
        <div className="absolute inset-0" style={{ backgroundColor: 'var(--landing-accent)', opacity: 0 }} aria-hidden />
        <HeroFloatingCircles />
        <div className="relative z-10 max-w-6xl mx-auto text-center px-4 sm:px-6">
          <h1
            key={heroSlideIndex}
            className="text-4xl sm:text-5xl md:text-6xl font-bold mb-6 text-white opacity-0 animate-hero-headline-in"
            style={{ textShadow: '0 1px 3px rgba(0,0,0,0.3)' }}
          >
            {heroSlides[heroSlideIndex].headline}
          </h1>
          <p
            className="text-lg sm:text-xl mb-10 font-semibold max-w-2xl mx-auto text-white"
            style={{ textShadow: '0 1px 3px rgba(0,0,0,0.3)' }}
          >
            {heroSubline}
          </p>
          {/* Slide indicators — pill with progress fill */}
          <div className="flex justify-center gap-2.5 mb-8" aria-label="Hero slide">
            {heroSlides.map((_, i) => {
              const isActive = heroSlideIndex === i;
              return (
                <button
                  key={i}
                  type="button"
                  onClick={() => setHeroSlideIndex(i)}
                  className="relative h-2 rounded-full overflow-hidden transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--landing-primary)] min-w-[8px]"
                  style={{
                    width: isActive ? 48 : 8,
                    backgroundColor: isActive ? 'rgba(255,255,255,0.35)' : 'rgba(255,255,255,0.5)',
                    boxShadow: isActive ? '0 0 12px rgba(44, 157, 115, 0.25)' : undefined,
                  }}
                  aria-current={isActive ? 'true' : undefined}
                  aria-label={`Go to slide ${i + 1}`}
                >
                  {isActive && (
                    <span
                      className="absolute inset-y-0 left-0 rounded-full animate-hero-indicator-progress"
                      style={{ backgroundColor: 'var(--landing-primary)' }}
                    />
                  )}
                </button>
              );
            })}
          </div>
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
        </motion.div>
      </section>

      {/* 2. The Problem → Solution */}
      <section ref={problemSectionRef} id="problem" className="py-12 px-4 relative overflow-hidden" style={{ backgroundColor: 'var(--landing-bg)', borderTop: '1px solid var(--landing-border)' }}>
        <div className="absolute top-0 right-0 w-96 h-96 rounded-full opacity-[0.06] blur-3xl pointer-events-none" style={{ background: 'radial-gradient(circle, var(--landing-primary) 0%, transparent 70%)' }} aria-hidden />
        <div className="absolute bottom-0 left-0 w-80 h-80 rounded-full opacity-[0.05] blur-3xl pointer-events-none" style={{ background: 'radial-gradient(circle, var(--landing-primary) 0%, transparent 70%)' }} aria-hidden />
        <div className="absolute inset-0 z-0 pointer-events-none opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, var(--landing-text) 1px, transparent 0)', backgroundSize: '40px 40px' }} aria-hidden />

        <div className="max-w-6xl mx-auto relative z-10 px-4 sm:px-6" style={{ perspective: '1200px' }}>
          <div ref={problemIntroRef} className="text-center mb-16">
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={isProblemIntroInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.75, ease: [0.22, 1, 0.36, 1] }}
            >
              <motion.span
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-medium uppercase tracking-widest mb-5 block"
                style={{ backgroundColor: 'var(--landing-accent)', color: 'var(--landing-primary)' }}
                initial={{ opacity: 0, y: 16 }}
                animate={isProblemIntroInView ? { opacity: 1, y: 0 } : {}}
                transition={{ delay: 0.15, duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
              >
                <Zap className="h-3 w-3" />
                Why we built this
              </motion.span>
              <motion.h2
                className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-5 tracking-tight"
                style={{ color: 'var(--landing-primary)' }}
                initial={{ opacity: 0, y: 20 }}
                animate={isProblemIntroInView ? { opacity: 1, y: 0 } : {}}
                transition={{ delay: 0.25, duration: 0.75, ease: [0.22, 1, 0.36, 1] }}
              >
                The best you.
              </motion.h2>
              <motion.p
                className="text-lg max-w-2xl mx-auto opacity-90 leading-relaxed"
                style={{ color: 'var(--landing-text)' }}
                initial={{ opacity: 0, y: 20 }}
                animate={isProblemIntroInView ? { opacity: 1, y: 0 } : {}}
                transition={{ delay: 0.35, duration: 0.75, ease: [0.22, 1, 0.36, 1] }}
              >
                When you are operating at your highest level, you are in the zone. No Fear, Frustration or Doubt—that&apos;s when you find out who you are. We help you get there.
              </motion.p>
            </motion.div>
          </div>

          <div className="grid gap-10 sm:gap-12">
            {problemItems.map((item, i) => (
              <ProblemCard key={i} item={item} index={i} />
            ))}
          </div>

          <div ref={problemClosingRef} className="mt-12">
            <motion.p
              className="text-center text-sm font-medium opacity-85 max-w-xl mx-auto"
              style={{ color: 'var(--landing-text)' }}
              initial={{ opacity: 0, y: 16 }}
              animate={isProblemClosingInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.75, ease: [0.22, 1, 0.36, 1] }}
            >
              A private space for your goals, your plan, your progress—and real accountability—without the noise.
            </motion.p>
          </div>
        </div>
      </section>

      {/* 3. The Vision — 3D perspective + scroll-triggered animations */}
      <section
        id="vision"
        ref={visionSectionRef}
        className="relative py-28 px-4 overflow-hidden min-h-[32rem] flex items-center"
        style={{
          backgroundColor: 'var(--landing-accent)',
          perspective: '1200px',
        }}
      >
        {/* Animated gradient orbs — slow float/pulse */}
        <motion.div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] rounded-full opacity-35 blur-3xl pointer-events-none"
          style={{ background: 'radial-gradient(circle, var(--landing-primary) 0%, transparent 70%)' }}
          aria-hidden
          animate={{
            scale: [1, 1.15, 1],
            opacity: [0.3, 0.45, 0.3],
          }}
          transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute top-1/4 right-1/4 w-64 h-64 rounded-full opacity-20 blur-2xl pointer-events-none"
          style={{ background: 'radial-gradient(circle, var(--landing-primary) 0%, transparent 70%)' }}
          aria-hidden
          animate={{ x: [0, 20, 0], y: [0, -15, 0], scale: [1, 1.1, 1] }}
          transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute bottom-1/4 left-1/4 w-48 h-48 rounded-full opacity-25 blur-2xl pointer-events-none"
          style={{ background: 'radial-gradient(circle, var(--landing-primary) 0%, transparent 70%)' }}
          aria-hidden
          animate={{ x: [0, -15, 0], y: [0, 20, 0], scale: [1, 1.08, 1] }}
          transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}
        />
        {/* Grid overlay */}
        <div
          className="absolute inset-0 z-0 pointer-events-none opacity-[0.04]"
          style={{ backgroundImage: 'linear-gradient(var(--landing-text) 1px, transparent 1px), linear-gradient(90deg, var(--landing-text) 1px, transparent 1px)', backgroundSize: '48px 48px' }}
          aria-hidden
        />
        {/* 3D content card */}
        <motion.div
          className="relative z-10 w-full max-w-6xl mx-auto px-4 sm:px-6"
          style={{ perspective: '1000px', transformStyle: 'preserve-3d' }}
          initial={false}
          animate={isVisionBadgeInView ? { opacity: 1 } : { opacity: 0.6 }}
          transition={{ duration: 0.75 }}
        >
          <motion.div
            className="relative mx-auto rounded-3xl p-8 sm:p-12 text-center"
            style={{
              backgroundColor: 'rgba(255,255,255,0.7)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              boxShadow: '0 25px 50px -12px rgba(44, 157, 115, 0.15), 0 0 0 1px rgba(255,255,255,0.5)',
              transformStyle: 'preserve-3d',
            }}
            initial={{ opacity: 0, rotateX: 12, y: 40 }}
            animate={isVisionBadgeInView ? { opacity: 1, rotateX: 0, y: 0 } : { opacity: 0, rotateX: 12, y: 40 }}
            transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
            whileHover={{
              rotateX: -2,
              rotateY: 2,
              scale: 1.01,
              boxShadow: '0 32px 64px -16px rgba(44, 157, 115, 0.22), 0 0 0 1px rgba(255,255,255,0.6)',
              transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] },
            }}
          >
            {/* Badge + headlines — animate when this block enters view */}
            <div ref={visionBadgeRef}>
              <motion.div
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold uppercase tracking-widest mb-8"
                style={{
                  backgroundColor: 'var(--landing-primary)',
                  color: 'white',
                  boxShadow: '0 4px 14px rgba(44, 157, 115, 0.35)',
                }}
                initial={{ opacity: 0, scale: 0.8, rotateY: -15 }}
                animate={isVisionBadgeInView ? { opacity: 1, scale: 1, rotateY: 0 } : { opacity: 0, scale: 0.8, rotateY: -15 }}
                transition={{ delay: 0.2, duration: 0.85, ease: [0.22, 1, 0.36, 1] }}
              >
                <motion.span
                  animate={{ rotate: [0, 10, -10, 0] }}
                  transition={{ duration: 2.5, repeat: Infinity, repeatDelay: 3 }}
                >
                  <Sparkles className="h-4 w-4 inline-block" />
                </motion.span>
                The Vision
              </motion.div>
              <motion.h2
                className="text-2xl sm:text-3xl md:text-4xl font-bold mb-6 leading-tight"
                style={{ color: 'var(--landing-text)' }}
                initial={{ opacity: 0, y: 24, rotateX: 8 }}
                animate={isVisionBadgeInView ? { opacity: 1, y: 0, rotateX: 0 } : { opacity: 0, y: 24, rotateX: 8 }}
                transition={{ delay: 0.35, duration: 0.95, ease: [0.22, 1, 0.36, 1] }}
              >
                This is a personal development space
              </motion.h2>
              <motion.p
                className="text-xl sm:text-2xl font-semibold mb-6"
                style={{ color: 'var(--landing-primary)' }}
                initial={{ opacity: 0, y: 20, rotateX: 6 }}
                animate={isVisionBadgeInView ? { opacity: 1, y: 0, rotateX: 0 } : { opacity: 0, y: 20, rotateX: 6 }}
                transition={{ delay: 0.5, duration: 0.95, ease: [0.22, 1, 0.36, 1] }}
              >
                Authenticity & Purpose
              </motion.p>
            </div>
            {/* Body + line — animate when this block scrolls into view (separate zone) */}
            <div ref={visionBodyRef}>
              <motion.p
                className="text-base sm:text-lg max-w-2xl mx-auto leading-relaxed"
                style={{ color: 'var(--landing-text)' }}
                initial={{ opacity: 0, y: 20, rotateX: 4 }}
                animate={isVisionBodyInView ? { opacity: 1, y: 0, rotateX: 0 } : { opacity: 0, y: 20, rotateX: 4 }}
                transition={{ delay: 0.15, duration: 0.95, ease: [0.22, 1, 0.36, 1] }}
              >
                A place where you choose who you want to become, set goals with steps and deadlines, measure progress. Upload photos, remember milestones, and customize your home screen-you be the best you period. No comparisons
              </motion.p>
              <motion.div
                className="mt-10 mx-auto h-1 w-16 rounded-full"
                style={{ backgroundColor: 'var(--landing-primary)' }}
                initial={{ opacity: 0, scaleX: 0 }}
                animate={isVisionBodyInView ? { opacity: 1, scaleX: 1 } : { opacity: 0, scaleX: 0 }}
                transition={{ delay: 0.45, duration: 0.75, ease: [0.22, 1, 0.36, 1] }}
              />
            </div>
          </motion.div>
        </motion.div>
      </section>

      {/* 4. How The System Works — 3D cards + staggered scroll reveal */}
      <section
        id="how-it-works"
        ref={howItWorksSectionRef}
        className="relative py-24 px-4 bg-white overflow-hidden"
        style={{
          borderTop: '1px solid var(--landing-border)',
          perspective: '1200px',
        }}
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div ref={howItWorksIntroRef} className="text-center mb-14">
            <motion.h2
              className="text-2xl sm:text-3xl font-bold mb-4"
              style={{ color: 'var(--landing-text)' }}
              initial={{ opacity: 0, y: 24, rotateX: 10 }}
              animate={isHowItWorksIntroInView ? { opacity: 1, y: 0, rotateX: 0 } : { opacity: 0, y: 24, rotateX: 10 }}
              transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
            >
              How The System Works
            </motion.h2>
            <motion.p
              className="text-center text-sm sm:text-base opacity-80 max-w-2xl mx-auto"
              style={{ color: 'var(--landing-text)' }}
              initial={{ opacity: 0, y: 16 }}
              animate={isHowItWorksIntroInView ? { opacity: 0.85, y: 0 } : { opacity: 0, y: 16 }}
              transition={{ delay: 0.15, duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
            >
              Four simple steps to define your path, plan it, schedule it, and improve with AI.
            </motion.p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8" style={{ transformStyle: 'preserve-3d' }}>
            {stepItems.map((item, index) => (
              <HowItWorksStepCard key={item.step} item={item} index={index} />
            ))}
          </div>

          {/* Social proof + guarantee strip — after Step 4 (animation + 3D + image) */}
          <motion.div
            ref={guaranteeStripRef}
            className="mt-16 sm:mt-20 max-w-6xl mx-auto px-4 sm:px-6"
            style={{ perspective: '1200px', transformStyle: 'preserve-3d' }}
          >
            <motion.div
              className="rounded-2xl overflow-hidden border"
              style={{
                borderColor: 'var(--landing-border)',
                background: 'linear-gradient(160deg, rgba(255,255,255,0.99) 0%, var(--landing-accent) 50%, rgba(255,255,255,0.97) 100%)',
                boxShadow: '0 20px 40px -12px rgba(0,0,0,0.08), 0 0 0 1px rgba(0,0,0,0.03)',
                transformStyle: 'preserve-3d',
              }}
              initial={{ opacity: 0, y: 40, rotateX: 10 }}
              animate={isGuaranteeStripInView ? { opacity: 1, y: 0, rotateX: 0 } : { opacity: 0, y: 40, rotateX: 10 }}
              transition={{ duration: 0.85, ease: [0.22, 1, 0.36, 1] }}
              whileHover={{
                rotateY: 2,
                rotateX: -1,
                boxShadow: '0 28px 56px -16px rgba(44, 157, 115, 0.15), 0 0 0 1px rgba(0,0,0,0.04)',
                transition: { duration: 0.35 },
              }}
            >
              <div className="grid md:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] gap-0 min-h-0">
                {/* Image column — animates when this block enters view */}
                <motion.div
                  ref={guaranteeImageRef}
                  className="relative aspect-[4/3] md:aspect-auto md:min-h-[280px] overflow-hidden"
                  style={{ transformStyle: 'preserve-3d' }}
                  initial={{ opacity: 0, x: -32, rotateY: -8 }}
                  animate={isGuaranteeImageInView ? { opacity: 1, x: 0, rotateY: 0 } : { opacity: 0, x: -32, rotateY: -8 }}
                  transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
                >
                  <motion.img
                    src={successPhoneImg}
                    alt="Hand holding smartphone with success notification"
                    className="h-full w-full object-cover object-center"
                    whileHover={{ scale: 1.05 }}
                    transition={{ duration: 0.4 }}
                  />
                  <div
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-transparent to-white/30 md:to-white/50 pointer-events-none"
                    aria-hidden
                  />
                </motion.div>

                {/* Content column — animates when this block enters view (separate zone) */}
                <div ref={guaranteeContentRef} className="p-6 sm:p-8 md:p-10 flex flex-col justify-center space-y-6 md:space-y-8">
                  <motion.div
                    className="flex flex-wrap items-center justify-center md:justify-start gap-3"
                    initial={{ opacity: 0, y: 20, rotateX: 6 }}
                    animate={isGuaranteeContentInView ? { opacity: 1, y: 0, rotateX: 0 } : { opacity: 0, y: 20, rotateX: 6 }}
                    transition={{ delay: 0.15, duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
                  >
                    <motion.div
                      className="inline-flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-base sm:text-lg tracking-tight"
                      style={{
                        backgroundColor: 'var(--landing-primary)',
                        color: 'white',
                        boxShadow: '0 4px 16px -2px rgba(26, 107, 79, 0.4)',
                      }}
                      whileHover={{ scale: 1.04, rotateY: 3 }}
                      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                    >
                      <Award className="h-5 w-5 shrink-0" strokeWidth={2.5} />
                      <span>#1 Life changing app!</span>
                    </motion.div>
                  </motion.div>

                  <motion.div
                    className="flex items-start gap-4 p-5 sm:p-6 rounded-xl border"
                    style={{
                      borderColor: 'var(--landing-border)',
                      backgroundColor: 'rgba(255,255,255,0.85)',
                      transformStyle: 'preserve-3d',
                    }}
                    initial={{ opacity: 0, y: 24, rotateX: 5 }}
                    animate={isGuaranteeContentInView ? { opacity: 1, y: 0, rotateX: 0 } : { opacity: 0, y: 24, rotateX: 5 }}
                    transition={{ delay: 0.35, duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
                    whileHover={{
                      rotateY: 2,
                      boxShadow: '0 12px 28px -8px rgba(44, 157, 115, 0.12), 0 0 0 1px var(--landing-border)',
                      transition: { duration: 0.3 },
                    }}
                  >
                    <motion.span
                      initial={{ scale: 0, rotate: -20 }}
                      animate={isGuaranteeContentInView ? { scale: 1, rotate: 0 } : { scale: 0, rotate: -20 }}
                      transition={{ delay: 0.5, type: 'spring', stiffness: 260, damping: 22 }}
                    >
                      <ShieldCheck className="h-7 w-7 shrink-0 mt-0.5" style={{ color: 'var(--landing-primary)' }} strokeWidth={2} />
                    </motion.span>
                    <div className="min-w-0">
                      <p className="font-bold text-base sm:text-lg" style={{ color: 'var(--landing-text)' }}>
                        Our 100% happiness guarantee
                      </p>
                      <p className="text-sm sm:text-base mt-2 opacity-90 leading-relaxed" style={{ color: 'var(--landing-text)' }}>
                        If this isn’t the right fit for your journey in the first 30 days, we’ll make it right—no questions asked.
                      </p>
                    </div>
                  </motion.div>

                  <motion.div
                    className="text-center md:text-left"
                    initial={{ opacity: 0, x: 16, rotateY: 4 }}
                    animate={isGuaranteeContentInView ? { opacity: 1, x: 0, rotateY: 0 } : { opacity: 0, x: 16, rotateY: 4 }}
                    transition={{ delay: 0.55, duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
                  >
                    <p
                      className="text-lg sm:text-xl md:text-2xl font-bold leading-snug tracking-tight"
                      style={{
                        color: 'var(--landing-primary)',
                        textShadow: '0 0 40px rgba(26, 107, 79, 0.08)',
                      }}
                    >
                      You&apos;re not everybody, you are you.
                    </p>
                  </motion.div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* 5. Final CTA — headline and button animate in separate zones */}
      <section
        ref={ctaSectionRef}
        id="cta"
        className="py-24 px-4 text-white overflow-hidden"
        style={{ backgroundColor: 'var(--landing-primary)', perspective: '1200px' }}
      >
        <div className="max-w-2xl mx-auto text-center" style={{ transformStyle: 'preserve-3d' }}>
          <motion.div
            ref={ctaHeadlineRef}
            initial={{ opacity: 0, y: 40, rotateX: 12 }}
            animate={isCtaHeadlineInView ? { opacity: 1, y: 0, rotateX: 0 } : { opacity: 0, y: 40, rotateX: 12 }}
            transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
            whileHover={{
              rotateY: 2,
              rotateX: -1,
              scale: 1.01,
              transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] },
            }}
          >
            <motion.h2
              className="text-3xl sm:text-4xl font-bold mb-6"
              initial={{ opacity: 0, y: 24 }}
              animate={isCtaHeadlineInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 24 }}
              transition={{ delay: 0.15, duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
            >
              Start becoming the person you were meant to be.
            </motion.h2>
          </motion.div>
          <motion.div
            ref={ctaButtonRef}
            initial={{ opacity: 0, y: 20, scale: 0.96 }}
            animate={isCtaButtonInView ? { opacity: 1, y: 0, scale: 1 } : { opacity: 0, y: 20, scale: 0.96 }}
            transition={{ duration: 0.75, ease: [0.22, 1, 0.36, 1] }}
            whileHover={{ scale: 1.05, transition: { duration: 0.3 } }}
            whileTap={{ scale: 0.98, transition: { duration: 0.1 } }}
          >
            <AuthModal
              trigger={
                <Button size="lg" variant="default" className="trial-cta">
                  Start 7-day free trial
                </Button>
              }
              defaultMode="signup"
            />
          </motion.div>
        </div>
      </section>
    </>
  );
};
