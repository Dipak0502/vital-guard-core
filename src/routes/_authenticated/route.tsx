import { createFileRoute, Outlet, redirect, Link, useNavigate, useLocation } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { HeartPulse, LayoutDashboard, User, Users, FileText, Bell, QrCode, LogOut, Siren } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useQueryClient } from "@tanstack/react-query";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async () => {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) throw redirect({ to: "/auth" });
    return { user: data.user };
  },
  component: AppShell,
});

const nav = [
  { to: "/app", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { to: "/app/profile", label: "My Profile", icon: User },
  { to: "/app/family", label: "Family", icon: Users },
  { to: "/app/documents", label: "Documents", icon: FileText },
  { to: "/app/reminders", label: "Reminders", icon: Bell },
  { to: "/app/qr", label: "Emergency QR", icon: QrCode },
] as const;

function AppShell() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const location = useLocation();

  const signOut = async () => {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  };

  return (
    <div className="flex min-h-screen bg-secondary/30">
      <aside className="hidden w-64 shrink-0 border-r border-border bg-card md:flex md:flex-col">
        <Link to="/app" className="flex items-center gap-2 border-b border-border px-6 py-4">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <HeartPulse className="h-4 w-4" />
          </div>
          <span className="font-semibold">LifeVault</span>
        </Link>
        <nav className="flex-1 space-y-1 p-3">
          {nav.map((n) => {
            const active = n.exact ? location.pathname === n.to : location.pathname.startsWith(n.to);
            return (
              <Link
                key={n.to}
                to={n.to}
                className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  active ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                }`}
              >
                <n.icon className="h-4 w-4" /> {n.label}
              </Link>
            );
          })}
          <Link
            to="/app/sos"
            className="mt-4 flex items-center gap-3 rounded-lg bg-destructive px-3 py-2 text-sm font-semibold text-destructive-foreground shadow-sm hover:opacity-95"
          >
            <Siren className="h-4 w-4" /> SOS
          </Link>
        </nav>
        <div className="border-t border-border p-3">
          <Button variant="ghost" onClick={signOut} className="w-full justify-start">
            <LogOut className="mr-2 h-4 w-4" /> Sign out
          </Button>
        </div>
      </aside>
      <main className="flex-1 overflow-auto">
        <div className="mx-auto max-w-5xl px-4 py-8 md:px-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}