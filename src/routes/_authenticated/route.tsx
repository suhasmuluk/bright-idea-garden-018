import { createFileRoute, Link, Outlet, redirect, useNavigate } from "@tanstack/react-router";
import { LayoutDashboard, Wallet, ListChecks, PlusCircle, Settings, LogOut } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { settingsQuery } from "@/lib/data";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async () => {
    const { data } = await supabase.auth.getUser();
    if (!data.user) throw redirect({ to: "/auth" });
  },
  component: Layout,
});

const nav = [
  { to: "/dashboard", label: "Home", icon: LayoutDashboard },
  { to: "/bookings", label: "Bookings", icon: ListChecks },
  { to: "/amounts", label: "Amounts", icon: Wallet },
  { to: "/new", label: "New Booking", icon: PlusCircle },
  { to: "/settings", label: "Settings", icon: Settings },
] as const;

function Layout() {
  const navigate = useNavigate();
  const { data: s } = useQuery(settingsQuery);
  return (
    <div className="min-h-screen pb-20 md:pb-0">
      <header className="no-print sticky top-0 z-30 border-b bg-card/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center gap-2 px-4 py-3">
          <Link to="/dashboard" className="flex items-center gap-2">
            <span className="grid h-9 w-9 place-items-center rounded-full bg-saffron font-display text-lg text-primary-foreground">ॐ</span>
            <span className="font-display text-lg leading-tight text-maroon">{s?.shop_name ?? "Idol Bookings"}</span>
          </Link>
          <nav className="ml-auto hidden gap-1 md:flex">
            {nav.map((n) => (
              <Link key={n.to} to={n.to} className="flex items-center gap-2 rounded-md px-2 py-2 text-sm font-medium text-muted-foreground hover:bg-secondary" activeProps={{ className: "bg-secondary text-foreground" }}>
                <n.icon className="h-4 w-4" />{n.label}
              </Link>
            ))}
          </nav>
          <button
            onClick={async () => { await supabase.auth.signOut(); navigate({ to: "/auth" }); }}
            className="ml-auto flex items-center gap-1 rounded-md px-2 py-2 text-sm text-muted-foreground hover:bg-secondary md:ml-0"
            aria-label="Sign out"
          >
            <LogOut className="h-4 w-4" /><span className="hidden sm:inline">Sign out</span>
          </button>
        </div>
        <div className="gold-rule" />
      </header>
      <main className="mx-auto max-w-6xl px-4 py-6">
        <Outlet />
      </main>
      <nav className="no-print fixed inset-x-0 bottom-0 z-30 grid grid-cols-5 border-t bg-card md:hidden">
        {nav.map((n) => (
          <Link key={n.to} to={n.to} className="flex flex-col items-center gap-0.5 py-2 text-xs text-muted-foreground" activeProps={{ className: "text-primary" }}>
            <n.icon className="h-5 w-5" />{n.label}
          </Link>
        ))}
      </nav>
    </div>
  );
}
