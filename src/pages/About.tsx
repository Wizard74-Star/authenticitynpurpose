import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Leaf, Heart, Sun, Target, BookOpen, Star, Flame, Sparkles, Quote } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { LandingPageLayout } from "@/components/LandingPageLayout";
import { HeroFloatingCircles } from "@/components/HeroFloatingCircles";
import { AuthModal } from "@/components/auth/AuthModal";
import aboutUsHero from "@/assets/images/About-us.png";
import writtenPlanImg from "@/assets/images/Written-plan.jpg";

const values = [
  { icon: Heart, title: "Self-Compassion", description: "Celebrate your wins. Your journey is uniquely yours." },
  { icon: Sun, title: "Positivity", description: "Features that make you feel good about progress, not inadequate." },
  { icon: Target, title: "Focus", description: "Clear timelines from 30 days to 5 years—no overwhelm." },
  { icon: Leaf, title: "Growth", description: "Intentional goal-setting to create your best life." },
];

const milestones = [
  { year: "2023", title: "The Vision", description: "Founded after realizing productivity apps were making people feel worse, not better." },
  { year: "Early 2024", title: "Beta Launch", description: "100 beta testers who shared our vision of growth without comparison." },
  { year: "Mid 2024", title: "Gratitude", description: "Launched gratitude journaling—focus on what you have." },
  { year: "Late 2024", title: "10K Users", description: "10,000 active users across 50 countries." },
  { year: "2025", title: "5-Year Vision", description: "Long-term goal planning so you can dream bigger." },
];

const testimonials = [
  { name: "Jessica M.", role: "Entrepreneur", quote: "Finally an app that celebrates MY wins without everyone else's highlight reel. I feel motivated, not inadequate." },
  { name: "Robert K.", role: "Teacher", quote: "The 0-10 scale is brilliant. I see exactly where I am on each goal without the pressure of percentages." },
  { name: "Priya S.", role: "Healthcare Worker", quote: "The gratitude journal changed my mindset. I wake up excited to document my journey." },
];

export default function About() {
  const navigate = useNavigate();

  return (
    <LandingPageLayout>
      {/* Hero — same pattern as Features/Pricing */}
      <section
        id="hero"
        className="relative py-20 sm:py-28 px-4 min-h-[28rem] flex items-center justify-center overflow-hidden"
      >
        <div className="absolute inset-0" aria-hidden>
          <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${aboutUsHero})` }} />
        </div>
        <div className="absolute inset-0" style={{ backgroundColor: "var(--landing-accent)", opacity: 0.88 }} aria-hidden />
        <HeroFloatingCircles />
        <div className="relative z-10 max-w-6xl mx-auto text-center px-4 sm:px-6">
          <h1
            className="text-4xl sm:text-5xl md:text-6xl font-bold mb-6 bg-clip-text text-transparent animate-slide-up"
            style={{
              backgroundImage: "linear-gradient(135deg, var(--landing-primary) 0%, var(--landing-primary-soft) 50%, #1a6b4f 100%)",
              WebkitBackgroundClip: "text",
              backgroundClip: "text",
              animationDelay: "0.1s",
            }}
          >
            Your journey. Your rules. No comparison.
          </h1>
          <p
            className="text-lg sm:text-xl mb-10 font-bold max-w-2xl mx-auto bg-clip-text text-transparent animate-slide-up"
            style={{
              backgroundImage: "linear-gradient(135deg, #4a5568 0%, #2d3748 50%, #1a1a1a 100%)",
              WebkitBackgroundClip: "text",
              backgroundClip: "text",
              animationDelay: "0.25s",
            }}
          >
            Authenticity & Purpose is a private space to dream, plan, and achieve—without the noise of social feeds or the pressure to perform for anyone but yourself.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center animate-slide-up" style={{ animationDelay: "0.4s" }}>
            <AuthModal trigger={<Button size="lg" variant="default" className="trial-cta">Start 7-day free trial</Button>} defaultMode="signup" />
            <Button size="lg" variant="outline" onClick={() => navigate("/features")} className="hero-cta-outline">
              See how it works
            </Button>
          </div>
        </div>
      </section>

      {/* Mission + Vision — single editorial block with image */}
      <section className="py-20 px-4 overflow-hidden relative" style={{ backgroundColor: "var(--landing-bg)", borderTop: "1px solid var(--landing-border)" }}>
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: "radial-gradient(circle at 2px 2px, var(--landing-primary) 1px, transparent 0)", backgroundSize: "24px 24px" }} />
        <div className="max-w-6xl mx-auto relative px-4 sm:px-6">
          <div className="grid lg:grid-cols-2 gap-10 lg:gap-16 items-center">
            <div className="order-2 lg:order-1">
              <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider mb-4" style={{ backgroundColor: "var(--landing-accent)", color: "var(--landing-primary)" }}>
                Why we exist
              </span>
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-6" style={{ color: "var(--landing-text)" }}>
                Your only competition is who you were yesterday.
              </h2>
              <p className="text-base sm:text-lg mb-6 opacity-90" style={{ color: "var(--landing-text)" }}>
                We built Authenticity and Purpose because the apps meant to help us improve were making us feel worse. Social feeds, leaderboards, and comparison culture don’t belong in your growth journey.
              </p>
              <p className="text-base sm:text-lg opacity-90" style={{ color: "var(--landing-text)" }}>
                Our mission: a personal sanctuary where you visualize dreams, track progress, and celebrate every step—without feeling inadequate. No feeds. No likes. Just you and your path forward.
              </p>
            </div>
            <div className="order-1 lg:order-2 relative">
              <div className="aspect-[4/3] rounded-3xl overflow-hidden border feature-card-shadow group" style={{ borderColor: "var(--landing-border)" }}>
                <div className="absolute inset-0 bg-cover bg-center transition-transform duration-700 ease-out group-hover:scale-105" style={{ backgroundImage: `url(${writtenPlanImg})` }} />
                <div className="absolute inset-0 rounded-3xl" style={{ background: "linear-gradient(to top, rgba(26, 107, 79, 0.4) 0%, transparent 60%)" }} />
              </div>
              <div className="absolute -bottom-4 -right-4 w-20 h-20 rounded-2xl flex items-center justify-center hidden sm:flex" style={{ backgroundColor: "var(--landing-primary)", boxShadow: "0 8px 24px rgba(44, 157, 115, 0.35)" }}>
                <Sparkles className="h-10 w-10 text-white" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Why we're different — split: Others vs Us */}
      <section className="py-20 px-4 overflow-hidden" style={{ backgroundColor: "var(--landing-bg)", borderTop: "1px solid var(--landing-border)" }}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <h2 className="text-2xl sm:text-3xl font-bold mb-3 text-center" style={{ color: "var(--landing-text)" }}>Why we're different</h2>
          <p className="text-center text-sm opacity-80 mb-12 max-w-xl mx-auto" style={{ color: "var(--landing-text)" }}>No highlight reels. No leaderboards. Just your progress.</p>

          <div className="grid sm:grid-cols-2 gap-6">
            <div className="rounded-2xl p-6 sm:p-8 border transition-all duration-300 feature-card-shadow" style={{ backgroundColor: "rgba(220, 53, 69, 0.04)", borderColor: "rgba(220, 53, 69, 0.18)" }}>
              <h3 className="font-bold text-lg mb-4 flex items-center gap-2" style={{ color: "var(--landing-text)" }}>
                <span className="w-2 h-2 rounded-full bg-red-500" /> Others
              </h3>
              <ul className="space-y-3 text-sm opacity-90" style={{ color: "var(--landing-text)" }}>
                <li>Highlight reels and comparison culture</li>
                <li>Likes, followers, and performance pressure</li>
                <li>Anxiety and feeling like you're falling behind</li>
                <li>Goals tied to what others are doing</li>
              </ul>
            </div>
            <div className="rounded-2xl p-6 sm:p-8 border transition-all duration-300 feature-card-shadow" style={{ borderColor: "var(--landing-border)", backgroundColor: "var(--landing-accent)" }}>
              <h3 className="font-bold text-lg mb-4 flex items-center gap-2" style={{ color: "var(--landing-primary)" }}>
                <Leaf className="h-5 w-5" /> Authenticity and Purpose
              </h3>
              <ul className="space-y-3 text-sm opacity-90" style={{ color: "var(--landing-text)" }}>
                <li>Your space only—no feeds, no audience</li>
                <li>Private progress and gentle accountability</li>
                <li>Celebrate your wins on your terms</li>
                <li>30 days to 5 years—your timeline, your rules</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Our Story — card timeline with refined UI */}
      <section
        id="our-story"
        className="py-24 px-4 overflow-hidden relative"
        style={{ backgroundColor: "var(--landing-bg)", borderTop: "1px solid var(--landing-border)" }}
      >
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: "radial-gradient(circle at 2px 2px, var(--landing-primary) 1px, transparent 0)", backgroundSize: "24px 24px" }} />
        <div className="max-w-6xl mx-auto relative px-4 sm:px-6">
          <div className="text-center mb-16">
            <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider mb-4" style={{ backgroundColor: "var(--landing-accent)", color: "var(--landing-primary)" }}>
              Our journey
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold mb-5" style={{ color: "var(--landing-text)" }}>
              Our story
            </h2>
            <p className="text-base sm:text-lg max-w-2xl mx-auto leading-relaxed opacity-90" style={{ color: "var(--landing-text)" }}>
              What if we created something focused entirely on you? No social features. No leaderboards. Just a private space to dream big and celebrate every step. That question became Authenticity and Purpose.
            </p>
          </div>

          <div className="relative">
            {/* Vertical line — visible on all screens */}
            <div
              className="absolute left-6 sm:left-7 top-0 bottom-0 w-0.5 rounded-full hidden sm:block"
              style={{ backgroundColor: "var(--landing-primary)", opacity: 0.2 }}
            />
            <div className="space-y-6">
              {milestones.map((m, i) => (
                <div
                  key={i}
                  className="relative flex gap-6 sm:gap-8 items-stretch animate-fade-in"
                  style={{ animationDelay: `${i * 0.08}s` }}
                >
                  {/* Node */}
                  <div className="relative z-10 flex-shrink-0 flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 rounded-2xl border-2 transition-all duration-300 feature-card-shadow" style={{ backgroundColor: "var(--landing-bg)", borderColor: "var(--landing-primary)" }}>
                    <span className="text-xs sm:text-sm font-bold tabular-nums" style={{ color: "var(--landing-primary)" }}>
                      {m.year.slice(-2)}
                    </span>
                  </div>
                  {/* Card */}
                  <div
                    className="flex-1 min-w-0 rounded-2xl border p-6 sm:p-7 transition-all duration-300 feature-card-shadow hover:scale-[1.01] hover:shadow-lg"
                    style={{
                      borderColor: "var(--landing-border)",
                      backgroundColor: i % 2 === 0 ? "var(--landing-bg)" : "var(--landing-accent)",
                    }}
                  >
                    <div className="flex flex-wrap items-center gap-2 mb-3">
                      <span className="text-xs font-semibold uppercase tracking-wider px-2.5 py-1 rounded-md" style={{ backgroundColor: "var(--landing-primary)", color: "white" }}>
                        {m.year}
                      </span>
                      <h3 className="text-lg sm:text-xl font-bold" style={{ color: "var(--landing-text)" }}>
                        {m.title}
                      </h3>
                    </div>
                    <p className="text-sm sm:text-base leading-relaxed opacity-90" style={{ color: "var(--landing-text)" }}>
                      {m.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Values — compact row with icons */}
      <section className="py-20 px-4 overflow-hidden" style={{ backgroundColor: "var(--landing-bg)", borderTop: "1px solid var(--landing-border)" }}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <h2 className="text-2xl sm:text-3xl font-bold mb-3 text-center" style={{ color: "var(--landing-text)" }}>What we stand for</h2>
          <p className="text-center text-sm opacity-80 mb-12 max-w-xl mx-auto" style={{ color: "var(--landing-text)" }}>Every feature is designed around these beliefs.</p>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {values.map((v, i) => (
              <div
                key={i}
                className="rounded-2xl p-5 border text-center transition-all duration-300 feature-card-shadow hover:scale-[1.02]"
                style={{ borderColor: "var(--landing-border)" }}
              >
                <v.icon className={`w-10 h-10 mx-auto mb-3 ${i % 2 === 0 ? "" : ""}`} style={{ color: "var(--landing-primary)" }} />
                <h3 className="font-bold text-sm mb-2" style={{ color: "var(--landing-text)" }}>{v.title}</h3>
                <p className="text-xs opacity-85" style={{ color: "var(--landing-text)" }}>{v.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials — editorial quote style */}
      <section className="py-20 px-4 overflow-hidden" style={{ backgroundColor: "var(--landing-bg)", borderTop: "1px solid var(--landing-border)" }}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <h2 className="text-2xl sm:text-3xl font-bold mb-3 text-center" style={{ color: "var(--landing-text)" }}>What our users say</h2>
          <p className="text-center text-sm opacity-80 mb-12 max-w-xl mx-auto" style={{ color: "var(--landing-text)" }}>Real people, real progress.</p>

          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((t, i) => (
              <div key={i} className="rounded-2xl p-6 border feature-card-shadow" style={{ borderColor: "var(--landing-border)" }}>
                <Quote className="h-8 w-8 mb-4 opacity-40" style={{ color: "var(--landing-primary)" }} />
                <p className="text-sm italic mb-5 opacity-90" style={{ color: "var(--landing-text)" }}>&ldquo;{t.quote}&rdquo;</p>
                <div className="flex gap-1 mb-2">
                  {[...Array(5)].map((_, j) => (
                    <Star key={j} className="h-4 w-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="font-semibold text-sm" style={{ color: "var(--landing-text)" }}>{t.name}</p>
                <p className="text-xs opacity-70" style={{ color: "var(--landing-text)" }}>{t.role}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features summary — 3 cards */}
      <section className="py-16 px-4 overflow-hidden" style={{ backgroundColor: "var(--landing-bg)", borderTop: "1px solid var(--landing-border)" }}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="grid sm:grid-cols-3 gap-6">
            <div className="rounded-2xl p-6 text-center border-t-4 feature-card-shadow" style={{ borderColor: "var(--landing-primary)", backgroundColor: "var(--landing-accent)" }}>
              <Target className="w-10 h-10 mx-auto mb-3" style={{ color: "var(--landing-primary)" }} />
              <h3 className="font-bold text-sm mb-2" style={{ color: "var(--landing-text)" }}>Goal timelines</h3>
              <p className="text-xs opacity-85" style={{ color: "var(--landing-text)" }}>30, 60, 90 days to 5-year plans with 0–10 progress</p>
            </div>
            <div className="rounded-2xl p-6 text-center border-t-4 feature-card-shadow" style={{ borderColor: "var(--landing-primary)", backgroundColor: "var(--landing-accent)" }}>
              <Heart className="w-10 h-10 mx-auto mb-3" style={{ color: "var(--landing-primary)" }} />
              <h3 className="font-bold text-sm mb-2" style={{ color: "var(--landing-text)" }}>Gratitude journal</h3>
              <p className="text-xs opacity-85" style={{ color: "var(--landing-text)" }}>Focus on what you have, not what you lack</p>
            </div>
            <div className="rounded-2xl p-6 text-center border-t-4 feature-card-shadow" style={{ borderColor: "var(--landing-primary)", backgroundColor: "var(--landing-accent)" }}>
              <BookOpen className="w-10 h-10 mx-auto mb-3" style={{ color: "var(--landing-primary)" }} />
              <h3 className="font-bold text-sm mb-2" style={{ color: "var(--landing-text)" }}>Life journal</h3>
              <p className="text-xs opacity-85" style={{ color: "var(--landing-text)" }}>A life worth living is worth recording</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto text-center rounded-3xl p-10 sm:p-14 relative overflow-hidden px-4 sm:px-6" style={{ background: "linear-gradient(135deg, var(--landing-primary) 0%, var(--landing-primary-soft) 50%, #1a6b4f 100%)" }}>
          <div className="absolute top-0 right-0 w-48 h-48 rounded-full opacity-20 blur-3xl" style={{ backgroundColor: "white" }} />
          <div className="absolute bottom-0 left-0 w-48 h-48 rounded-full opacity-20 blur-3xl" style={{ backgroundColor: "white" }} />
          <div className="relative z-10">
            <Leaf className="w-12 h-12 mx-auto mb-4 text-white/90" />
            <h2 className="text-2xl sm:text-3xl font-bold mb-3 text-white">Ready to start your growth journey?</h2>
            <p className="text-white/90 mb-6 max-w-md mx-auto">7-day free trial. No credit card required.</p>
            <Button
              size="lg"
              onClick={() => navigate("/")}
              className="text-base px-8 bg-white text-[var(--landing-primary)] hover:bg-white/95 shadow-lg"
            >
              <Flame className="h-5 w-5 mr-2" />
              Begin your journey
            </Button>
          </div>
        </div>
      </section>

    </LandingPageLayout>
  );
}
