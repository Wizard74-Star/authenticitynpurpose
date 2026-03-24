import React from 'react';
import { useNavigate } from 'react-router-dom';
import logoImg from '@/assets/images/Logo.png';

interface AuthenticatedFooterProps {
  navigate: (path: string) => void;
}

/**
 * Footer for authenticated layout.
 * Structure aligned with roadmap: Your Journey | Resources | Account
 * - Your Journey: Dashboard, Calendar, Progress (Steps 1–3)
 * - Resources: Features, FAQ, Contact, Pricing
 * - Account: Settings, Subscription
 */
export const AuthenticatedFooter: React.FC<AuthenticatedFooterProps> = ({ navigate }) => {
  return (
    <footer className="py-12 px-4 text-white bg-zinc-700">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
          {/* Your Journey — core app flow (Identity → Goals–Vision Board → Calendar → Progress → AI) */}
          <div>
            <h3 className="font-semibold mb-4 text-white/95">Your Journey</h3>
            <div className="flex flex-col gap-2">
              <button onClick={() => navigate('/')} className="text-left hover:underline opacity-90 text-sm">
                Dashboard
              </button>
              <button onClick={() => navigate('/calendar')} className="text-left hover:underline opacity-90 text-sm">
                Calendar
              </button>
              <button onClick={() => navigate('/progress')} className="text-left hover:underline opacity-90 text-sm">
                Progress
              </button>
            </div>
          </div>

          {/* Resources — help & product info */}
          <div>
            <h3 className="font-semibold mb-4 text-white/95">Resources</h3>
            <div className="flex flex-col gap-2">
              <button onClick={() => navigate('/features')} className="text-left hover:underline opacity-90 text-sm">
                Features
              </button>
              <button onClick={() => navigate('/faq')} className="text-left hover:underline opacity-90 text-sm">
                FAQ
              </button>
              <button onClick={() => navigate('/contact')} className="text-left hover:underline opacity-90 text-sm">
                Contact
              </button>
              <button onClick={() => navigate('/pricing')} className="text-left hover:underline opacity-90 text-sm">
                Pricing
              </button>
            </div>
          </div>

          {/* Account — settings & subscription */}
          <div>
            <h3 className="font-semibold mb-4 text-white/95">Account</h3>
            <div className="flex flex-col gap-2">
              <button onClick={() => navigate('/settings')} className="text-left hover:underline opacity-90 text-sm">
                Settings
              </button>
              <button onClick={() => navigate('/pricing')} className="text-left hover:underline opacity-90 text-sm">
                Subscription
              </button>
              <button onClick={() => navigate('/about')} className="text-left hover:underline opacity-90 text-sm">
                About
              </button>
            </div>
          </div>
        </div>

        <div className="mt-10 pt-8 border-t border-white/20 flex flex-wrap justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <img src={logoImg} alt="" className="h-9 w-9 object-contain" aria-hidden />
            <span className="font-semibold text-white/95">Authenticity and Purpose</span>
          </div>
          <div className="text-right">
            <p className="text-sm opacity-90">&copy; {new Date().getFullYear()} Authenticity and Purpose.</p>
            <p className="text-xs opacity-80 mt-1">Your information syncs across your computer, tablet, and phone.</p>
          </div>
        </div>
      </div>
    </footer>
  );
};
