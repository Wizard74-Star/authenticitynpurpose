import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { HelpCircle, Bell, User, LogOut, CreditCard, LayoutDashboard, Menu } from 'lucide-react';
import logoImg from '@/assets/images/Logo.png';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { useAuth } from '@/contexts/AuthContext';
import { useNotifications } from '@/hooks/useNotifications';
import type { User as SupabaseUser } from '@supabase/supabase-js';

/** Center nav: Home (Dashboard), Journal, Goals, Progress, Calendar */
const centerNavItems = [
  { label: 'Home', path: '/', scrollId: undefined },
  { label: 'Journal', path: '/journal', scrollId: undefined },
  { label: 'Goals', path: '/goals', scrollId: undefined },
  { label: 'Progress', path: '/progress', scrollId: undefined },
  { label: 'Calendar', path: '/calendar', scrollId: undefined },
];

const helpNavItems = [
  { label: 'Getting Started', path: '/getstarted' },
  { label: 'Features', path: '/features' },
  { label: 'Use Cases', path: '/use-case' },
  { label: 'Pricing', path: '/pricing' },
  { label: 'FAQ', path: '/faq' },
  { label: 'About Us', path: '/about' },
  { label: 'Contact Us', path: '/contact' },
];

export const AuthenticatedHeader: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, signOut } = useAuth();
  const { unreadCount } = useNotifications();
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleHelpNav = (item: typeof helpNavItems[0]) => {
    navigate(item.path);
  };

  const handleCenterNav = (item: typeof centerNavItems[0]) => {
    setMobileMenuOpen(false);
    navigate(item.path);
    if (item.scrollId) {
      setTimeout(() => document.getElementById(item.scrollId!)?.scrollIntoView({ behavior: 'smooth' }), 100);
    }
  };

  const isActive = (item: typeof centerNavItems[0]) =>
    item.scrollId ? location.pathname === item.path : location.pathname === item.path;

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

        {/* Center nav — desktop (Landing-style tabs) */}
        <nav className="hidden md:flex absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 items-center gap-0.5">
          {centerNavItems.map((item) => (
              <button
                key={item.label}
                onClick={() => handleCenterNav(item)}
                className="group relative px-4 py-2 text-sm font-bold rounded-md focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--landing-primary)]"
              >
                <span
                  className={`relative z-10 bg-clip-text text-transparent transition-colors duration-150 ${
                    isActive(item)
                      ? 'bg-gradient-to-r from-[var(--landing-primary)] via-[var(--landing-primary)] to-[var(--landing-primary)]'
                      : 'bg-gradient-to-r from-[#6b7280] via-[#4b5563] to-[#6b7280] group-hover:from-[#4b5563] group-hover:via-[var(--landing-primary)] group-hover:to-[#4b5563]'
                  }`}
                >
                  {item.label}
                </span>
                <span
                  className={`absolute bottom-0 left-1/2 h-0.5 w-3/4 -translate-x-1/2 origin-center rounded-full transition-transform duration-200 ease-out ${isActive(item) ? 'scale-x-100' : 'scale-x-0 group-hover:scale-x-100'}`}
                  style={{ backgroundColor: 'var(--landing-primary)' }}
                  aria-hidden
                />
              </button>
            ))}
        </nav>

        {/* Right: Help, Notifications, User */}
        <div className="flex items-center gap-1 sm:gap-2">
          {/* Help (?) Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="group rounded-full h-9 w-9 hover:bg-[var(--landing-hover-bg)] hover:text-[var(--landing-primary)]"
                aria-label="Help"
              >
                <HelpCircle className="h-5 w-5 text-[var(--landing-text)] group-hover:text-[var(--landing-primary)] transition-colors" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-[200px] dropdown-landing">
              {helpNavItems.map((item) => (
                <DropdownMenuItem
                  key={item.label}
                  onClick={() => handleHelpNav(item)}
                  className="cursor-pointer"
                >
                  {item.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Notifications */}
          <Popover open={notificationOpen} onOpenChange={setNotificationOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="group rounded-full h-9 w-9 relative hover:bg-[var(--landing-hover-bg)] hover:text-[var(--landing-primary)]"
                aria-label="Notifications"
              >
                <Bell className="h-5 w-5 text-[var(--landing-text)] group-hover:text-[var(--landing-primary)] transition-colors" />
                {unreadCount > 0 && (
                  <span
                    className="absolute top-1 right-1 h-2 w-2 rounded-full"
                    style={{ backgroundColor: 'var(--landing-primary)' }}
                  />
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-80 p-0">
              <div className="p-3 border-b" style={{ borderColor: 'var(--landing-border)' }}>
                <h3 className="font-semibold text-sm" style={{ color: 'var(--landing-text)' }}>
                  Notifications
                </h3>
              </div>
              <div className="max-h-[300px] overflow-y-auto">
                {unreadCount === 0 ? (
                  <div className="p-4 text-center text-sm" style={{ color: 'var(--landing-text)', opacity: 0.8 }}>
                    No new notifications
                  </div>
                ) : (
                  <div className="p-4 text-sm" style={{ color: 'var(--landing-text)' }}>
                    You have {unreadCount} pending reminder{unreadCount !== 1 ? 's' : ''}. Check your calendar or reminders.
                  </div>
                )}
              </div>
            </PopoverContent>
          </Popover>

          {/* User Avatar Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="group rounded-full p-1 h-auto gap-2 pl-2 hover:bg-[var(--landing-hover-bg)] hover:text-[var(--landing-primary)]"
                aria-label="User menu"
              >
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="text-white text-sm" style={{ backgroundColor: 'var(--landing-primary)' }}>
                    {(user as SupabaseUser)?.email?.charAt(0).toUpperCase() ?? '?'}
                  </AvatarFallback>
                </Avatar>
                <span className="text-sm font-medium hidden sm:inline max-w-[100px] truncate text-[var(--landing-text)] group-hover:text-[var(--landing-primary)] transition-colors">
                  {(user as SupabaseUser)?.email?.split('@')[0]}
                </span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-[200px] dropdown-landing">
              <div className="px-2 py-2">
                <p className="text-sm font-medium truncate" style={{ color: 'var(--landing-text)' }}>
                  {(user as SupabaseUser)?.email}
                </p>
                <p className="text-xs" style={{ color: 'var(--landing-text)', opacity: 0.7 }}>
                  User Info
                </p>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => navigate('/')} className="cursor-pointer">
                <LayoutDashboard className="h-4 w-4 mr-2" />
                Dashboard
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate('/settings')} className="cursor-pointer">
                <User className="h-4 w-4 mr-2" />
                Profile
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate('/pricing')} className="cursor-pointer">
                <CreditCard className="h-4 w-4 mr-2" />
                Subscription
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => signOut()}
                className="signout-item cursor-pointer text-red-600 focus:!text-red-600 focus:!bg-red-50"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Mobile menu */}
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden rounded-lg hover:bg-[var(--landing-hover-bg)] hover:text-[var(--landing-primary)]"
                style={{ color: 'var(--landing-text)' }}
                aria-label="Open menu"
              >
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[280px] sm:w-[320px] pt-8" style={{ borderColor: 'var(--landing-border)', backgroundColor: 'var(--landing-bg)' }}>
              <nav className="flex flex-col gap-1 pt-4">
                {centerNavItems.map((item) => (
                  <button
                    key={item.label}
                    onClick={() => handleCenterNav(item)}
                    className="flex items-center px-4 py-3 text-left text-sm font-bold rounded-lg transition-colors"
                    style={{
                      color: isActive(item) ? 'var(--landing-primary)' : 'var(--landing-text)',
                    }}
                  >
                    {item.label}
                  </button>
                ))}
                <div className="mt-4 pt-4 border-t flex flex-col gap-2" style={{ borderColor: 'var(--landing-border)' }}>
                  <Button variant="outline" size="sm" className="w-full justify-start hover:bg-[var(--landing-hover-bg)] hover:text-[var(--landing-primary)] hover:border-[var(--landing-primary)]" onClick={() => { setMobileMenuOpen(false); navigate('/settings'); }}>
                    <User className="h-4 w-4 mr-2" /> Profile
                  </Button>
                  <Button variant="outline" size="sm" className="w-full justify-start hover:bg-[var(--landing-hover-bg)] hover:text-[var(--landing-primary)] hover:border-[var(--landing-primary)]" onClick={() => { setMobileMenuOpen(false); navigate('/pricing'); }}>
                    <CreditCard className="h-4 w-4 mr-2" /> Subscription
                  </Button>
                  <Button variant="outline" size="sm" className="w-full justify-start text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700 hover:border-red-300" onClick={() => { setMobileMenuOpen(false); signOut(); }}>
                    <LogOut className="h-4 w-4 mr-2" /> Sign Out
                  </Button>
                </div>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
};
