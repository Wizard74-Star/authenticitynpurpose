import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { TrialAnalyticsDashboard } from "@/components/TrialAnalyticsDashboard";
import { InviteCodesManager } from "@/components/InviteCodesManager";
import { AdminUserManagement } from "@/components/AdminUserManagement";
import { CommunityModerationPanel } from "@/components/CommunityModerationPanel";
import { AdminLoginCard } from "@/components/auth/AdminLoginCard";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  ShieldAlert,
  LayoutDashboard,
  Gift,
  Users,
  MessageSquareWarning,
  Menu,
  LogOut,
} from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import logoImg from "@/assets/images/Logo.png";

type AdminSection = "analytics" | "invite-codes" | "users" | "community";

export default function Admin() {
  const { user, loading: authLoading, signOut } = useAuth();
  const navigate = useNavigate();
  const [verified, setVerified] = useState(false);
  const [checkingAdmin, setCheckingAdmin] = useState(false);
  const [section, setSection] = useState<AdminSection>("analytics");
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setVerified(false);
      setCheckingAdmin(false);
      return;
    }
    let cancelled = false;
    setCheckingAdmin(true);
    void (async () => {
      try {
        const { data } = await supabase.from("admins").select("id").maybeSingle();
        if (!cancelled) setVerified(!!data);
      } finally {
        if (!cancelled) setCheckingAdmin(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user, authLoading]);

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  if (authLoading || (user && checkingAdmin)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-muted/30 to-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-2 border-primary border-t-transparent mx-auto" />
          <p className="mt-4 text-muted-foreground text-sm">Verifying access...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-muted/30 to-background flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <AdminLoginCard />
        </div>
      </div>
    );
  }

  if (!verified) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-muted/30 to-background flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <ShieldAlert className="h-12 w-12 text-destructive mx-auto mb-4" />
          <h1 className="text-xl font-semibold">Access denied</h1>
          <p className="text-muted-foreground mt-2 text-sm">
            This area is for administrators only.
          </p>
          <Button variant="outline" className="mt-6" onClick={() => navigate("/")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to home
          </Button>
        </div>
      </div>
    );
  }

  const navItems: { id: AdminSection; label: string; icon: React.ReactNode }[] = [
    { id: "analytics", label: "Analytics", icon: <LayoutDashboard className="h-4 w-4" /> },
    { id: "invite-codes", label: "Invite codes", icon: <Gift className="h-4 w-4" /> },
    { id: "users", label: "User management", icon: <Users className="h-4 w-4" /> },
    { id: "community", label: "Community moderation", icon: <MessageSquareWarning className="h-4 w-4" /> },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-muted/20 to-background">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <div className="container mx-auto px-4 h-14 md:h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
              <SheetTrigger asChild className="md:hidden">
                <Button variant="ghost" size="icon" aria-label="Open menu">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-64 pt-8">
                <SheetHeader>
                  <SheetTitle className="sr-only">Admin menu</SheetTitle>
                </SheetHeader>
                <nav className="flex flex-col gap-1 mt-6">
                  {navItems.map((item) => (
                    <Button
                      key={item.id}
                      variant={section === item.id ? "secondary" : "ghost"}
                      className="justify-start gap-2"
                      onClick={() => {
                        setSection(item.id);
                        setMobileNavOpen(false);
                      }}
                    >
                      {item.icon}
                      {item.label}
                    </Button>
                  ))}
                </nav>
              </SheetContent>
            </Sheet>
            <Button
              variant="ghost"
              size="sm"
              className="gap-2 text-muted-foreground hover:text-foreground -ml-2 md:ml-0"
              onClick={() => navigate("/")}
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="hidden sm:inline">Back</span>
            </Button>
            <span className="text-muted-foreground hidden sm:inline">·</span>
            <button
              type="button"
              onClick={() => navigate("/")}
              className="flex items-center gap-2 min-w-0"
              aria-label="Home"
            >
              <img src={logoImg} alt="" className="h-7 w-auto shrink-0" />
              <h1 className="font-semibold text-sm md:text-base truncate">Admin</h1>
            </button>
          </div>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => (
              <Button
                key={item.id}
                variant={section === item.id ? "secondary" : "ghost"}
                size="sm"
                className="gap-2"
                onClick={() => setSection(item.id)}
              >
                {item.icon}
                {item.label}
              </Button>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground truncate max-w-[120px] md:max-w-[180px]" title={user.email}>
              {user.email}
            </span>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 shrink-0 text-muted-foreground hover:text-foreground"
              onClick={handleSignOut}
              title="Sign out"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="container mx-auto px-4 py-6 md:py-8">
        {section === "analytics" && (
          <section className="animate-in fade-in duration-200">
            <TrialAnalyticsDashboard />
          </section>
        )}
        {section === "invite-codes" && (
          <section id="invite-codes" className="animate-in fade-in duration-200 w-full">
            <InviteCodesManager />
          </section>
        )}
        {section === "users" && (
          <section id="users" className="animate-in fade-in duration-200 w-full">
            <AdminUserManagement />
          </section>
        )}
        {section === "community" && (
          <section id="community" className="animate-in fade-in duration-200 w-full">
            <CommunityModerationPanel />
          </section>
        )}
      </main>
    </div>
  );
}
