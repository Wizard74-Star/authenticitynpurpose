import React from 'react';
import PricingSection from '@/components/PricingSection';
import { LandingPageLayout } from '@/components/LandingPageLayout';
import { HeroFloatingCircles } from '@/components/HeroFloatingCircles';
import pricingBg from '@/assets/images/pricing-bg.jpg';

const Pricing: React.FC = () => {
  return (
    <LandingPageLayout>
      {/* Hero */}
      <section
        id="hero"
        className="relative py-20 sm:py-28 px-4 min-h-[28rem] flex items-center justify-center overflow-hidden"
      >
        <div className="absolute inset-0" aria-hidden>
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url(${pricingBg})` }}
          />
        </div>
        <div className="absolute inset-0" aria-hidden />
        <HeroFloatingCircles />
        <div className="relative z-10 max-w-6xl mx-auto text-center px-4 sm:px-6">
          <h1
            className="text-4xl sm:text-5xl md:text-6xl font-bold mb-6 text-gray-900 drop-shadow-[0_1px_2px_rgba(255,255,255,0.9)] animate-slide-up"
            style={{ animationDelay: '0.1s' }}
          >
            Simple, transparent pricing
          </h1>
          <p
            className="text-lg sm:text-xl mb-10 font-semibold max-w-2xl mx-auto text-gray-900 drop-shadow-[0_1px_2px_rgba(255,255,255,0.8)] animate-slide-up"
            style={{ animationDelay: '0.2s' }}
          >
            7-day free trial. No commitment. Choose the plan that works for you.
          </p>
        </div>
      </section>

      <PricingSection />
    </LandingPageLayout>
  );
};

export default Pricing;
