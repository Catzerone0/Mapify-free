"use client";

import { useEffect, useMemo, useState, type ComponentType, type ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Bell,
  ChevronDown,
  LayoutDashboard,
  Map,
  PanelLeftClose,
  PanelLeftOpen,
  Settings,
  Share2,
  Sparkles,
  HelpCircle,
  LogOut,
} from "lucide-react";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { useAuthStore } from "@/lib/stores/auth";
import { useWorkspaceStore } from "@/lib/stores/workspace";

type NavItem = {
  href: string;
  label: string;
  icon: ComponentType<{ className?: string }>;
};

const navItems: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/maps", label: "My Maps", icon: Map },
  { href: "/templates", label: "Templates", icon: Sparkles },
  { href: "/shared-with-me", label: "Shared", icon: Share2 },
  { href: "/activity", label: "Activity", icon: Bell },
  { href: "/settings", label: "Settings", icon: Settings },
];

function getPageTitle(pathname: string) {
  if (pathname.startsWith("/workspace")) return "Workspace";
  if (pathname.startsWith("/mindmap/create")) return "Create Mind Map";
  if (pathname.startsWith("/mindmap/editor")) return "Mind Map";

  const direct = navItems.find((i) => i.href === pathname);
  if (direct) return direct.label;

  return "Mapify";
}

export function AppShell({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, logout } = useAuthStore();
  const { workspaces, setWorkspaces, currentWorkspace, setCurrentWorkspace } =
    useWorkspaceStore();

  const [collapsed, setCollapsed] = useState(false);
  const [loadingWorkspaces, setLoadingWorkspaces] = useState(false);
  const [workspaceOpen, setWorkspaceOpen] = useState(false);

  const title = useMemo(() => getPageTitle(pathname), [pathname]);

  useEffect(() => {
    setWorkspaceOpen(false);
  }, [pathname]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("sidebar_collapsed");
      setCollapsed(raw === "1");
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    const load = async () => {
      setLoadingWorkspaces(true);
      try {
        const res = await fetch("/api/workspaces", {
          headers: {
            ...(localStorage.getItem("auth_token")
              ? { Authorization: `Bearer ${localStorage.getItem("auth_token")}` }
              : {}),
          },
        });
        if (!res.ok) return;
        const data = await res.json();
        const ws = (data.data || []) as typeof workspaces;
        setWorkspaces(ws);

        const storedId = localStorage.getItem("current_workspace_id");
        const active = (storedId && ws.find((w) => w.id === storedId)) || ws[0] || null;

        if (active) {
          setCurrentWorkspace(active);
          localStorage.setItem("current_workspace_id", active.id);
        }
      } finally {
        setLoadingWorkspaces(false);
      }
    };

    load();
  }, [setWorkspaces, setCurrentWorkspace]);

  const handleToggleCollapse = () => {
    const next = !collapsed;
    setCollapsed(next);
    try {
      localStorage.setItem("sidebar_collapsed", next ? "1" : "0");
    } catch {
      // ignore
    }
  };

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch {
      // ignore
    }

    localStorage.removeItem("auth_token");
    localStorage.removeItem("auth_user");
    logout();
    router.push("/auth/login");
  };

  // For full-screen pages, skip shell chrome.
  if (pathname.startsWith("/mindmap/editor") || pathname.startsWith("/mindmap/create")) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-background flex">
      <aside
        className={[
          "border-r border-border bg-sidebar",
          "flex flex-col",
          collapsed ? "w-16" : "w-64",
          "transition-[width] duration-150 ease-out",
        ].join(" ")}
      >
        <div className="h-14 px-3 flex items-center justify-between border-b border-border">
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-md bg-primary/10 flex items-center justify-center">
              <Map className="h-4 w-4 text-primary" />
            </div>
            {!collapsed && <span className="font-semibold">Mapify</span>}
          </Link>
          <button
            onClick={handleToggleCollapse}
            className="h-9 w-9 rounded-md hover:bg-accent flex items-center justify-center"
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            title={collapsed ? "Expand" : "Collapse"}
          >
            {collapsed ? (
              <PanelLeftOpen className="h-4 w-4" />
            ) : (
              <PanelLeftClose className="h-4 w-4" />
            )}
          </button>
        </div>

        <div className="p-3 border-b border-border">
          <div className="relative">
            <button
              type="button"
              onClick={() => setWorkspaceOpen((v) => !v)}
              className={[
                "w-full h-9 rounded-md border border-border bg-background flex items-center justify-between px-3",
                collapsed ? "justify-center" : "",
              ].join(" ")}
              disabled={loadingWorkspaces || workspaces.length === 0}
            >
              {!collapsed && (
                <span className="text-sm truncate">
                  {currentWorkspace?.name || "Select workspace"}
                </span>
              )}
              {!collapsed && <ChevronDown className="h-4 w-4 text-foreground-secondary" />}
              {collapsed && <BriefcaseIcon />}
            </button>
            {!collapsed && workspaceOpen && workspaces.length > 0 && (
              <div className="mt-2 rounded-md border border-border bg-popover shadow-elevation-2 overflow-hidden">
                {workspaces.slice(0, 6).map((ws) => (
                  <button
                    key={ws.id}
                    onClick={() => {
                      setCurrentWorkspace(ws);
                      localStorage.setItem("current_workspace_id", ws.id);
                      setWorkspaceOpen(false);
                      router.push(`/workspace/${ws.id}`);
                    }}
                    className={[
                      "w-full text-left px-3 py-2 text-sm hover:bg-accent",
                      currentWorkspace?.id === ws.id ? "bg-accent" : "",
                    ].join(" ")}
                  >
                    {ws.name}
                  </button>
                ))}
                <div className="border-t border-border">
                  <button
                    onClick={() => {
                      setWorkspaceOpen(false);
                      router.push("/dashboard");
                    }}
                    className="w-full text-left px-3 py-2 text-sm hover:bg-accent text-foreground-secondary"
                  >
                    Manage workspaces
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        <nav className="flex-1 p-2 space-y-1">
          {navItems.map((item) => {
            const active = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={[
                  "flex items-center gap-2 h-9 rounded-md px-3 text-sm transition-colors",
                  active ? "bg-accent text-foreground" : "text-foreground-secondary hover:bg-accent hover:text-foreground",
                  collapsed ? "justify-center px-0" : "",
                ].join(" ")}
                title={collapsed ? item.label : undefined}
              >
                <Icon className="h-4 w-4" />
                {!collapsed && <span>{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        <div className="p-3 border-t border-border space-y-2">
          <div className={["flex items-center", collapsed ? "justify-center" : "justify-between"].join(" ")}>
            {!collapsed && (
              <div className="text-sm">
                <div className="font-medium truncate">{user?.name || user?.email}</div>
                <div className="text-xs text-foreground-secondary truncate">{user?.email}</div>
              </div>
            )}
            <ThemeToggle />
          </div>
          <div className="flex gap-2">
            {!collapsed && (
              <button
                onClick={() => router.push("/help")}
                className="flex-1 h-9 rounded-md border border-border hover:bg-accent text-sm inline-flex items-center justify-center gap-2"
              >
                <HelpCircle className="h-4 w-4" />
                Help
              </button>
            )}
            <button
              onClick={handleLogout}
              className={[
                "h-9 rounded-md border border-border hover:bg-accent text-sm inline-flex items-center justify-center gap-2",
                collapsed ? "w-full" : "w-12",
              ].join(" ")}
              aria-label="Logout"
              title="Logout"
            >
              <LogOut className="h-4 w-4" />
              {collapsed && <span className="sr-only">Logout</span>}
            </button>
          </div>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-14 border-b border-border bg-background/80 backdrop-blur flex items-center justify-between px-4">
          <div className="flex items-center gap-3 min-w-0">
            <h1 className="text-sm md:text-base font-semibold truncate">{title}</h1>
            {currentWorkspace && !pathname.startsWith("/workspace") && (
              <button
                onClick={() => router.push(`/workspace/${currentWorkspace.id}`)}
                className="hidden md:inline-flex items-center gap-2 text-sm text-foreground-secondary hover:text-foreground"
              >
                <span className="truncate max-w-[240px]">{currentWorkspace.name}</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/mindmap/create"
              className="hidden sm:inline-flex h-9 px-3 rounded-md bg-primary text-primary-foreground text-sm items-center justify-center hover:bg-primary/90"
            >
              Quick create
            </Link>
            <Link
              href="/activity"
              className="h-9 w-9 rounded-md border border-border hover:bg-accent inline-flex items-center justify-center"
              aria-label="Notifications"
              title="Notifications"
            >
              <Bell className="h-4 w-4" />
            </Link>
            <button
              className="h-9 px-3 rounded-md border border-border hover:bg-accent text-sm"
              onClick={() => router.push("/settings")}
            >
              {user?.name || "Account"}
            </button>
          </div>
        </header>

        <main className="flex-1 min-w-0">{children}</main>
      </div>
    </div>
  );
}

function BriefcaseIcon() {
  return <div className="h-4 w-4 rounded-sm bg-primary/30" />;
}
