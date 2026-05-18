import { ReactNode, useEffect, useState, useRef } from 'react';
import { SidebarProvider, SidebarTrigger, SidebarInset, useSidebar } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
import { BackgroundEffects } from '@/components/BackgroundEffects';
import { PageLoader } from '@/components/PageLoader';

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';

import { Sun, Moon, Info, Bell } from 'lucide-react';
import { useTheme } from '@/components/ThemeProvider';


// Dummy context to bypass actual auth
const useAuth = () => ({ user: { id: 'dummy-user', email: 'test@example.com' }, loading: false });

function LayoutHeader() {
  const { state } = useSidebar();
  const collapsed = state === 'collapsed';
  const { resolvedTheme, setTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';
  const [notifOpen, setNotifOpen] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setNotifOpen(false);
      }
    }
    if (notifOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [notifOpen]);

  return (
    <header className="sticky top-0 z-20 flex h-12 items-center justify-between border-b bg-background/80 px-3 backdrop-blur supports-[backdrop-filter]:bg-background/60 shadow-sm layout-header">
      {/* Left: sidebar toggle & controls */}
      <div className="flex items-center gap-4">
        <SidebarTrigger className={collapsed ? 'ml-0' : '-ml-1'} />
        
        <div className="flex items-center gap-1 header-controls">
          {/* Notification history button */}
          <div className="relative" ref={notifRef}>
            <button
              onClick={() => {
                const opening = !notifOpen;
                setNotifOpen(opening);
              }}
              className={`relative z-40 flex h-8 w-8 items-center justify-center rounded-md transition-colors duration-200 ${
                notifOpen ? 'bg-muted/60 text-foreground' : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground'
              }`}
              aria-label="Értesítés előzmények"
              title="Értesítés előzmények"
            >
              <Bell className="h-4 w-4" />
            </button>

            {notifOpen && (
              <div className="absolute left-0 top-10 z-40 w-80 rounded-xl border bg-popover shadow-xl overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 border-b bg-muted/30">
                  <span className="text-sm font-semibold">Legutóbbi értesítések</span>
                </div>
                <div className="max-h-80 overflow-y-auto divide-y">
                  <div className="px-4 py-6 text-center text-sm text-muted-foreground">
                    Nincsenek értesítések
                  </div>
                </div>
              </div>
            )}
          </div>

          <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
            <SheetContent side="left" className="w-[400px] sm:w-[540px] flex flex-col p-0" hideClose={true}>
              <SheetHeader className="px-6 py-4 border-b">
                <div className="flex items-center justify-between">
                  <SheetTitle>Értesítés előzmények</SheetTitle>
                </div>
              </SheetHeader>
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                  Nincsenek értesítések
                </div>
              </div>
            </SheetContent>
          </Sheet>

          {/* Info button */}
          <button
            className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-muted/60 hover:text-foreground transition-colors duration-200"
            aria-label="Információ"
            title="Információ"
          >
            <Info className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Center: Placeholder for header message */}
      <div className="flex-1 flex justify-center overflow-hidden px-4">
      </div>

      {/* Right: empty for now */}
      <div>
      </div>
    </header>
  );
}

interface AuthenticatedLayoutProps {
  children: ReactNode;
}

export function AuthenticatedLayout({ children }: AuthenticatedLayoutProps) {
  const { user, loading } = useAuth();
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (!loading && user) {
      const id = requestAnimationFrame(() => setIsReady(true));
      return () => cancelAnimationFrame(id);
    }
  }, [loading, user]);

  if (loading || !isReady) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <PageLoader />
      </div>
    );
  }

  return (
        <SidebarProvider>
          {/* Gradient is on body with background-attachment:fixed — transparent wrapper so it shows through */}
          <div className="min-h-screen flex w-full relative">
            {/* Background flowing colors */}
            <BackgroundEffects />

            <AppSidebar />
            <SidebarInset className="flex-1 relative z-10 !bg-transparent dark:!bg-background min-w-0">
              <LayoutHeader />
              <main className="flex-1 p-6 overflow-x-hidden min-w-0">
                {/* Smooth page transition on every route change */}
                {children}
              </main>
            </SidebarInset>
          </div>
        </SidebarProvider>
  );
}
