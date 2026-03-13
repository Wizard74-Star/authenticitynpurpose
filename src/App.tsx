import { lazy, Suspense, useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { ThemeProvider } from "@/components/theme-provider";
import { AuthProvider } from "@/contexts/AuthContext";
import { StorageModeProvider } from "@/contexts/StorageModeContext";
import { TimezoneProvider } from "@/contexts/TimezoneContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { AuthenticatedLayout } from "@/components/AuthenticatedLayout";
import { Loader2 } from "lucide-react";

// Route-level code splitting: load pages only when their route is visited
// Index imported directly so home page always loads (avoids 500 on dynamic chunk)
import Index from "./pages/Index";
const GetStarted = lazy(() => import("./pages/GetStarted"));
const Contact = lazy(() => import("./pages/Contact"));
const About = lazy(() => import("./pages/About"));
const NotFound = lazy(() => import("./pages/NotFound"));
const EmailVerification = lazy(() => import("./pages/EmailVerification").then((m) => ({ default: m.EmailVerification })));
const AuthCallback = lazy(() => import("./pages/AuthCallback").then((m) => ({ default: m.AuthCallback })));
const Demo = lazy(() => import("./pages/Demo"));
const Help = lazy(() => import("./pages/Help"));
const Forums = lazy(() => import("./pages/Forums"));
const Calendar = lazy(() => import("./pages/Calendar"));
const PaymentSuccessPage = lazy(() => import("./pages/PaymentSuccess"));
const Pricing = lazy(() => import("./pages/Pricing"));
const Features = lazy(() => import("./pages/Features"));
const UseCase = lazy(() => import("./pages/UseCase"));
const FAQ = lazy(() => import("./pages/FAQ"));
const Settings = lazy(() => import("./pages/Settings"));
const Progress = lazy(() => import("./pages/Progress"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const JournalPage = lazy(() => import("./pages/JournalPage"));
const Goals = lazy(() => import("./pages/Goals"));
const Admin = lazy(() => import("./pages/Admin"));
const InviteCodes = lazy(() => import("./pages/InviteCodes"));


const queryClient = new QueryClient();

const PageLoader = () => (
  <div className="flex min-h-screen items-center justify-center" aria-label="Loading page">
    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
  </div>
);

/** Scroll to top when the route changes so each page starts at the top. */
const ScrollToTop = () => {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
};

const App = () => (
  <ThemeProvider defaultTheme="light">
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
            <ScrollToTop />
            <StorageModeProvider>
            <TimezoneProvider>
            <Suspense fallback={<PageLoader />}>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/getstarted" element={<ProtectedRoute><GetStarted /></ProtectedRoute>} />
              <Route path="/about" element={<About />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/verify-email" element={<EmailVerification />} />
              <Route path="/auth/callback" element={<AuthCallback />} />
              <Route path="/pricing" element={<Pricing />} />
              <Route path="/features" element={<Features />} />
              <Route path="/use-case" element={<UseCase />} />
              <Route path="/faq" element={<FAQ />} />
              <Route path="/demo" element={<Demo />} />

              {/* Protected routes - require login, redirect to / if not authenticated */}
              <Route path="/help" element={<ProtectedRoute><Help /></ProtectedRoute>} />
              <Route path="/forums" element={<ProtectedRoute><Forums /></ProtectedRoute>} />
              <Route path="/calendar" element={<ProtectedRoute><Calendar /></ProtectedRoute>} />
              <Route path="/payment-success" element={<ProtectedRoute><PaymentSuccessPage /></ProtectedRoute>} />
              <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
              <Route path="/progress" element={<ProtectedRoute><Progress /></ProtectedRoute>} />
              <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
              <Route path="/journal" element={<ProtectedRoute><JournalPage /></ProtectedRoute>} />
              <Route path="/goals" element={<ProtectedRoute><AuthenticatedLayout><Goals /></AuthenticatedLayout></ProtectedRoute>} />
              <Route path="/admin" element={<Admin />} />
              <Route path="/invite-codes" element={<ProtectedRoute><InviteCodes /></ProtectedRoute>} />


              <Route path="*" element={<NotFound />} />
            </Routes>
            </Suspense>
            </TimezoneProvider>
            </StorageModeProvider>
          </BrowserRouter>
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  </ThemeProvider>
);

export default App;