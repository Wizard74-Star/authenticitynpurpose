import React from 'react';
import logoImg from '@/assets/images/Logo.png';

interface LandingFooterProps {
  navigate: (path: string) => void;
  scrollToLandingSection: (id: string) => void;
}

export const LandingFooter: React.FC<LandingFooterProps> = ({ navigate, scrollToLandingSection }) => {
  return (
    <footer className="py-12 px-4 text-white bg-zinc-700">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-wrap justify-between items-center gap-6">
        <div className="flex items-center gap-2">
          <img src={logoImg} alt="" className="h-9 w-9 object-contain" aria-hidden />
          <span className="font-semibold">Authenticity and Purpose</span>
        </div>
        <div className="flex flex-wrap gap-6">
          <button onClick={() => navigate('/features')} className="hover:underline opacity-90">Features</button>
          <button onClick={() => navigate('/use-case')} className="hover:underline opacity-90">Use Cases</button>
          <button onClick={() => navigate('/pricing')} className="hover:underline opacity-90">Pricing</button>
          <button onClick={() => navigate('/faq')} className="hover:underline opacity-90">FAQ</button>
          <button onClick={() => navigate('/contact')} className="hover:underline opacity-90">Contact</button>
          <button onClick={() => navigate('/about')} className="hover:underline opacity-90">About</button>
        </div>
      </div>
      <p className="text-center text-sm opacity-90 mt-8">&copy; {new Date().getFullYear()} Authenticity and Purpose.</p>
      <p className="text-center text-xs opacity-80 mt-2">Your information syncs across your computer, tablet, and phone.</p>
    </footer>
  );
};
