import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, X, Quote } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AuthModal } from '@/components/auth/AuthModal';
import { LandingPageLayout } from '@/components/LandingPageLayout';
import { HeroFloatingCircles } from '@/components/HeroFloatingCircles';
import peopleSelfDevImg from '@/assets/images/People-serious-about-self-development.jpg';
import entrepreneursImg from '@/assets/images/Entrepreneurs.jpg';
import studentsImg from '@/assets/images/Students.jpg';
import professionalsImg from '@/assets/images/Professionals.jpg';
import tiredFakeProductivityImg from '@/assets/images/Anyone-tired-of-fake-productivity.jpg';

type UseCaseCard = {
  id: string;
  title: string;
  image: string;
  quote: string;
  name: string;
  role: string;
  otherApps: string[];
  ourApp: string[];
};

const useCaseCards: UseCaseCard[] = [
  {
    id: 'self-development',
    title: 'People serious about self-development',
    image: peopleSelfDevImg,
    quote: 'I tried journals and random goal apps for years. Here I finally have one place for my vision, my plan, and real feedback. I\'m actually becoming the person I want to become.',
    name: 'Alex M.',
    role: 'Personal growth coach',
    otherApps: ['Scattered notes and journals with no structure', 'No link between goals and daily actions', 'Zero insight into why I slipped'],
    ourApp: ['Clear goals + written plan in one place', 'Goals tied to time and check-ins', 'AI feedback that helps me improve'],
  },
  {
    id: 'entrepreneurs',
    title: 'Entrepreneurs',
    image: entrepreneursImg,
    quote: 'As a founder I needed to see progress without the noise. Other apps either felt like social media or just to-do lists. This gives me clarity and accountability without the show-off.',
    name: 'Jordan K.',
    role: 'Startup founder',
    otherApps: ['Task apps that don\'t connect to bigger goals', 'Social platforms = comparison and distraction', 'No private accountability with my co-founder'],
    ourApp: ['Goals from 30 days to 5 years, all visible', 'Private accountability—invite who matters', 'Progress and AI insights, no feed'],
  },
  {
    id: 'students',
    title: 'Students',
    image: studentsImg,
    quote: 'I used to forget my long-term goals and just react to deadlines. Now I track what I want to achieve and get reminders. My grades and my mindset both improved.',
    name: 'Sam L.',
    role: 'Graduate student',
    otherApps: ['Planners that only show tasks, not why', 'Habit trackers that guilt-trip when I miss', 'No way to tie goals to real deadlines'],
    ourApp: ['Goals + plan + calendar in one place', 'Check-ins and feedback, not guilt', 'Attach goals to time and get gentle reminders'],
  },
  {
    id: 'professionals',
    title: 'Professionals',
    image: professionalsImg,
    quote: 'I needed something that worked for career growth without turning into another productivity theater. This keeps me honest and moving—no fluff, no gamification.',
    name: 'Riley T.',
    role: 'Product manager',
    otherApps: ['Generic productivity apps with no real analysis', 'Streaks and badges that don\'t improve behavior', 'No link between goals and actual outcomes'],
    ourApp: ['AI that analyzes patterns, not just stores data', 'Meaningful feedback on why and when I slip', 'Authenticity and purpose plan that scale with my role'],
  },
  {
    id: 'tired-fake-productivity',
    title: 'Anyone tired of fake productivity',
    image: tiredFakeProductivityImg,
    quote: 'I was done with apps that made me feel busy but not better. This one actually helped me see my progress and get real feedback. Finally, something that delivers.',
    name: 'Morgan P.',
    role: 'Former “productivity junkie”',
    otherApps: ['Endless to-dos with no connection to goals', 'Habit streaks that break and demotivate', 'Lots of data, zero insight'],
    ourApp: ['Goals and a written plan—no fake busywork', 'Check-ins and AI feedback instead of streaks', 'Clear progress and actionable insights'],
  },
];

const UseCase: React.FC = () => {
  const navigate = useNavigate();

  return (
    <LandingPageLayout>
      {/* Hero — green background */}
      <section
        id="hero"
        className="relative py-20 sm:py-28 px-4 min-h-[28rem] flex items-center justify-center overflow-hidden"
      >
        <div
          className="absolute inset-0"
          style={{
            background: 'linear-gradient(135deg, var(--landing-primary) 0%, var(--landing-primary-soft) 50%, #1a6b4f 70%, #0f4c3a 100%)',
          }}
          aria-hidden
        />
        <HeroFloatingCircles />
        <div className="relative z-10 max-w-5xl mx-auto text-center px-4 sm:px-6">
          <h1
            className="text-4xl sm:text-5xl md:text-6xl font-bold mb-6 text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.3)] animate-slide-up"
            style={{ animationDelay: '0.1s' }}
          >
            Who is this for?
          </h1>
          <div
            className="space-y-4 text-base sm:text-lg mb-10 font-semibold text-white/95 drop-shadow-[0_1px_2px_rgba(0,0,0,0.3)] animate-slide-up"
            style={{ animationDelay: '0.25s' }}
          >
            <p>
              Who is Authenticity &amp; Purpose built for? People who want to live authentically: doing what they truly enjoy,
              excelling at it, and naturally attracting opportunities, relationships, and success that align with their true self.
            </p>
            <p>
              The app helps you discover your purpose, set meaningful goals, break them into clear steps, stay consistent and
              motivated, and create daily rhythm and flow—so your life feels synergistic, fulfilling, and effortlessly meaningful.
              In the zone, fear and doubt fade away. All that’s left is pure focus and action—the meaningless noise that once
              held you back from living your real purpose disappears.
            </p>
            <p>
              We’ve all been conditioned by society: how to act, think, and feel, how to live a “safe” but ultimately empty life.
              Authenticity &amp; Purpose breaks through those barriers, clears the path, and guides you back to where you are
              supposed to be—where you pursue what truly matters to you, and that is going to make the world a better place.
            </p>
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
      </section>

    </LandingPageLayout>
  );
};

export default UseCase;
