import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Menu, LogOut, Settings, CreditCard, Star, Flame } from 'lucide-react';
import logoImg from '@/assets/images/Logo.png';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { AuthModal } from '@/components/auth/AuthModal';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import type { User } from '@supabase/supabase-js';

export type NavItem =
  | { label: string; path: string; onClick: () => void; mobileOnly?: boolean }
  | { label: string; sectionId: string; onClick: () => void; mobileOnly?: boolean };

interface LandingHeaderProps {
  navItems: NavItem[];
  activeSection: string | null;
  mobileMenuOpen: boolean;
  setMobileMenuOpen: (open: boolean) => void;
  /** When set, show logged-in UI (user menu, points, streak, settings, sign out) instead of Get Started */
  user?: User | null;
  onSignOut?: () => void;
  points?: number;
  streak?: number;
  isPremium?: boolean;
}

export const LandingHeader: React.FC<LandingHeaderProps> = ({
  navItems,
  activeSection,
  mobileMenuOpen,
  setMobileMenuOpen,
  user,
  onSignOut,
  points = 0,
  streak = 0,
  isPremium = false,
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const isLoggedIn = !!user;
  const [authDialogOpen, setAuthDialogOpen] = useState(false);

  return (
    <header
      className="sticky top-0 z-50 w-full transition-shadow duration-200"
      style={{
        backgroundColor: 'rgba(255, 255, 255, 0.8)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        boxShadow: '0 1px 0 0 rgba(0,0,0,0.05)',
      }}
    >
      <div className="max-w-7xl mx-auto relative flex items-center justify-between h-16 px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-3 group focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--landing-primary)] rounded-lg transition-transform active:scale-[0.98]"
        >
          <img
            src={logoImg}
            alt="Authenticity & Purpose"
            className="h-9 w-9 object-contain transition-transform duration-200 group-hover:scale-105"
          />
          <span className="text-lg font-bold tracking-tight hidden sm:inline bg-gradient-to-r from-[#6b7280] via-[#4b5563] to-[#6b7280] bg-clip-text text-transparent">
            Authenticity & Purpose
          </span>
        </button>

        {/* Nav — desktop (no mobile-only items e.g. Demo) */}
        <nav className="hidden md:flex absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 items-center gap-0.5">
          {navItems.filter((item) => !item.mobileOnly).map((item) => {
            const isActive =
              'path' in item
                ? location.pathname === item.path
                : activeSection === item.sectionId;
            return (
              <button
                key={item.label}
                onClick={item.onClick}
                className="group relative px-4 py-2 text-sm font-bold rounded-md focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--landing-primary)]"
              >
                <span
                  className={`relative z-10 bg-clip-text text-transparent transition-colors duration-150 ${
                    isActive
                      ? 'bg-gradient-to-r from-[var(--landing-primary)] via-[var(--landing-primary)] to-[var(--landing-primary)]'
                      : 'bg-gradient-to-r from-[#6b7280] via-[#4b5563] to-[#6b7280] group-hover:from-[#4b5563] group-hover:via-[var(--landing-primary)] group-hover:to-[#4b5563]'
                  }`}
                >
                  {item.label}
                </span>
                <span
                  className={`absolute bottom-0 left-1/2 h-0.5 w-3/4 -translate-x-1/2 origin-center rounded-full transition-transform duration-200 ease-out ${isActive ? 'scale-x-100' : 'scale-x-0 group-hover:scale-x-100'}`}
                  style={{ backgroundColor: 'var(--landing-primary)' }}
                  aria-hidden
                />
              </button>
            );
          })}
        </nav>

        {/* Right: CTA or logged-in user */}
        <div className="flex items-center gap-2">
          {/* Home — visible on mobile only */}
          <button
            onClick={() => {
              setMobileMenuOpen(false);
              navigate('/');
            }}
            className="md:hidden text-sm font-bold text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md transition-colors duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--landing-primary)]"
          >
            <span className={`relative z-10 bg-clip-text text-transparent transition-colors duration-150 ${location.pathname === '/' ? 'bg-gradient-to-r from-[var(--landing-primary)] via-[var(--landing-primary)] to-[var(--landing-primary)]' : 'bg-gradient-to-r from-[#6b7280] via-[#4b5563] to-[#6b7280]'}`}>
              Home
            </span>
          </button>
          {/* Demo — visible on mobile only */}
          <button
            onClick={() => {
              setMobileMenuOpen(false);
              navigate('/demo');
            }}
            className="md:hidden text-sm font-bold text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md transition-colors duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--landing-primary)]"
          >
            <span className={`relative z-10 bg-clip-text text-transparent transition-colors duration-150 ${location.pathname === '/demo' ? 'bg-gradient-to-r from-[var(--landing-primary)] via-[var(--landing-primary)] to-[var(--landing-primary)]' : 'bg-gradient-to-r from-[#6b7280] via-[#4b5563] to-[#6b7280]'}`}>
              Demo
            </span>
          </button>
          <button
            onClick={() => navigate('/contact')}
            className="text-sm font-bold text-gray-600 hover:text-gray-900 px-4 py-2 rounded-md transition-colors duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--landing-primary)]"
          >
            <span className={`relative z-10 bg-clip-text text-transparent transition-colors duration-150 ${location.pathname === '/contact' ? 'bg-gradient-to-r from-[var(--landing-primary)] via-[var(--landing-primary)] to-[var(--landing-primary)]' : 'bg-gradient-to-r from-[#6b7280] via-[#4b5563] to-[#6b7280]'}`}>
              Contact Us
            </span>
          </button>

          {isLoggedIn ? (
            <>
              {points !== undefined && (
                <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full" style={{ backgroundColor: 'var(--landing-accent)' }}>
                  <Star className="h-4 w-4" style={{ color: 'var(--landing-primary)' }} />
                  <span className="text-sm font-bold" style={{ color: 'var(--landing-primary)' }}>{points} pts</span>
                </div>
              )}
              {streak !== undefined && streak > 0 && (
                <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-100 dark:bg-amber-900/30">
                  <Flame className="h-4 w-4 text-amber-600" />
                  <span className="text-sm font-bold text-amber-800 dark:text-amber-400">{streak} day streak</span>
                </div>
              )}
              <div className="hidden sm:flex items-center gap-2">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="text-white text-sm" style={{ backgroundColor: 'var(--landing-primary)' }}>
                    {user?.email?.charAt(0).toUpperCase() ?? '?'}
                  </AvatarFallback>
                </Avatar>
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300 max-w-[100px] truncate">
                  {user?.email?.split('@')[0]}
                </span>
              </div>
              <Button variant="ghost" size="sm" onClick={() => navigate('/settings')} className="hidden sm:inline-flex text-gray-600 hover:text-gray-900">
                <Settings className="h-4 w-4 mr-1.5" />
                Settings
              </Button>
              {!isPremium && (
                <Button size="sm" onClick={() => navigate('/pricing')} className="hidden sm:inline-flex text-white" style={{ backgroundColor: 'var(--landing-primary)' }}>
                  <CreditCard className="h-4 w-4 mr-1.5" />
                  Subscribe
                </Button>
              )}
              <Button variant="outline" size="sm" onClick={onSignOut} className="hidden sm:inline-flex border-gray-300 text-gray-700 hover:bg-gray-50">
                <LogOut className="h-4 w-4 mr-1.5" />
                Sign Out
              </Button>
              <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="sm:hidden rounded-lg" style={{ color: 'var(--landing-text)' }} aria-label="Open menu">
                    <Menu className="h-5 w-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-[280px] sm:w-[320px] pt-8" style={{ borderColor: 'var(--landing-border)', backgroundColor: 'var(--landing-bg)' }}>
                  <nav className="flex flex-col gap-1 pt-4">
                    {navItems.map((item) => (
                      <button key={item.label} onClick={item.onClick} className="flex items-center px-4 py-3 text-left text-sm font-bold rounded-lg transition-colors" style={{ color: 'var(--landing-text)' }}>
                        {item.label}
                      </button>
                    ))}
                    <div className="mt-4 pt-4 border-t flex flex-col gap-2" style={{ borderColor: 'var(--landing-border)' }}>
                      <Button variant="outline" size="sm" className="w-full justify-start" onClick={() => { setMobileMenuOpen(false); navigate('/settings'); }}>
                        <Settings className="h-4 w-4 mr-2" /> Settings
                      </Button>
                      {!isPremium && (
                        <Button size="sm" className="w-full justify-start text-white" style={{ backgroundColor: 'var(--landing-primary)' }} onClick={() => { setMobileMenuOpen(false); navigate('/pricing'); }}>
                          <CreditCard className="h-4 w-4 mr-2" /> Subscribe
                        </Button>
                      )}
                      <Button variant="outline" size="sm" className="w-full justify-start text-red-600 border-red-200" onClick={() => { setMobileMenuOpen(false); onSignOut?.(); }}>
                        <LogOut className="h-4 w-4 mr-2" /> Sign Out
                      </Button>
                    </div>
                  </nav>
                </SheetContent>
              </Sheet>
            </>
          ) : (
            <>
              <AuthModal
                open={authDialogOpen}
                onOpenChange={setAuthDialogOpen}
                trigger={
                  <Button
                    size="sm"
                    className="px-5 font-bold text-white shadow-sm transition-all duration-200 hover:shadow hover:scale-[1.02] active:scale-[0.98] hidden sm:inline-flex"
                    style={{ backgroundColor: 'var(--landing-primary)' }}
                  >
                    Get Started
                  </Button>
                }
                defaultMode="login"
              />
              <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="md:hidden rounded-lg" style={{ color: 'var(--landing-text)' }} aria-label="Open menu">
                    <Menu className="h-5 w-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-[280px] sm:w-[320px] pt-8" style={{ borderColor: 'var(--landing-border)', backgroundColor: 'var(--landing-bg)' }}>
                  <nav className="flex flex-col gap-1 pt-4">
                    {navItems.map((item) => (
                      <button
                        key={item.label}
                        onClick={item.onClick}
                        className="flex items-center px-4 py-3 text-left text-sm font-bold rounded-lg transition-colors bg-gradient-to-r from-[#6b7280] via-[#4b5563] to-[#6b7280] bg-clip-text text-transparent"
                        style={{ backgroundColor: 'transparent' }}
                      >
                        {item.label}
                      </button>
                    ))}
                    <div className="mt-4 pt-4 border-t" style={{ borderColor: 'var(--landing-border)' }}>
                      <Button
                        size="sm"
                        className="w-full rounded-full font-extrabold text-white transition-all duration-200 hover:brightness-95 hover:scale-[1.02] active:scale-[0.98]"
                        style={{ backgroundColor: '#2c9d73' }}
                        onClick={() => {
                          setAuthDialogOpen(true);
                          setMobileMenuOpen(false);
                        }}
                      >
                        Get Started
                      </Button>
                    </div>
                  </nav>
                </SheetContent>
              </Sheet>
            </>
          )}
        </div>
      </div>
    </header>
  );
};
