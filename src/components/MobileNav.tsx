import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useTranslation } from 'react-i18next';
import { LanguageSwitcher } from './LanguageSwitcher';
import { DarkModeToggle } from './DarkModeToggle';
import { NotificationCenter } from './NotificationCenter';
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from '@/components/ui/sheet';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  CalendarDays, LayoutDashboard, Clock, LogOut, Briefcase, BarChart3,
  CalendarPlus, History, UserCog, User, Menu
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export function MobileNav() {
  const { isAdmin, isStaff, signOut, user, isDemoMode } = useAuth();
  const location = useLocation();
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);

  const customerLinks = [
    { to: '/dashboard', icon: LayoutDashboard, label: t('sidebar.dashboard') },
    { to: '/book', icon: CalendarPlus, label: t('sidebar.bookAppointment') },
    { to: '/appointments', icon: History, label: t('sidebar.myAppointments') },
    { to: '/profile', icon: User, label: t('sidebar.profile') },
  ];

  const staffLinks = [
    { to: '/staff', icon: LayoutDashboard, label: t('sidebar.dashboard') },
    { to: '/staff/availability', icon: Clock, label: t('sidebar.myAvailability') },
    { to: '/profile', icon: User, label: t('sidebar.profile') },
  ];

  const adminLinks = [
    { to: '/admin', icon: BarChart3, label: t('sidebar.analytics') },
    { to: '/admin/appointments', icon: CalendarDays, label: t('sidebar.allAppointments') },
    { to: '/admin/services', icon: Briefcase, label: t('sidebar.services') },
    { to: '/admin/hours', icon: Clock, label: t('sidebar.businessHours') },
    { to: '/profile', icon: User, label: t('sidebar.profile') },
  ];

  const links = isAdmin ? adminLinks : isStaff ? staffLinks : customerLinks;
  const menuLabel = isAdmin ? t('sidebar.administration') : isStaff ? t('sidebar.staffMenu') : t('sidebar.menu');

  const initials = user?.email?.slice(0, 2).toUpperCase() || 'U';

  return (
    <header className="fixed top-0 left-0 right-0 z-50 flex h-14 items-center justify-between border-b border-sidebar-border bg-sidebar px-4 md:hidden">
      {/* Left: hamburger + logo */}
      <div className="flex items-center gap-3">
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <button className="flex h-9 w-9 items-center justify-center rounded-lg text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground transition-colors">
              <Menu className="h-5 w-5" />
            </button>
          </SheetTrigger>
          <SheetContent side="left" className="w-72 bg-sidebar text-sidebar-foreground border-sidebar-border p-0">
            <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
            {/* Sidebar header */}
            <div className="flex items-center gap-2 px-6 py-5 border-b border-sidebar-border">
              <CalendarDays className="h-7 w-7 text-sidebar-primary" />
              <span className="font-display text-lg font-bold tracking-tight">BookFlow</span>
              {isStaff && <UserCog className="ml-auto h-4 w-4 text-sidebar-primary" />}
            </div>

            {/* Nav links */}
            <nav className="flex-1 space-y-1 px-3 py-4">
              <p className="mb-2 px-3 text-xs font-medium uppercase tracking-wider text-muted-foreground/60">
                {menuLabel}
              </p>
              {links.map(({ to, icon: Icon, label }) => {
                const active = location.pathname === to;
                return (
                  <Link
                    key={to}
                    to={to}
                    onClick={() => setOpen(false)}
                    className={cn(
                      'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150',
                      active
                        ? 'bg-sidebar-accent text-sidebar-primary'
                        : 'text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground'
                    )}
                  >
                    <Icon className="h-4.5 w-4.5" />
                    {label}
                  </Link>
                );
              })}
            </nav>

            {/* Footer */}
            <div className="border-t border-sidebar-border p-4 space-y-3">
              <div className="flex items-center gap-2">
                <LanguageSwitcher variant="sidebar" />
              </div>
              <DarkModeToggle variant="sidebar" />
              {isDemoMode && <span className="inline-block rounded bg-accent/10 px-2 py-0.5 text-[10px] font-medium text-accent">DEMO</span>}
              <p className="truncate text-xs text-muted-foreground/60">{user?.email}</p>
              <button
                onClick={() => { signOut(); setOpen(false); }}
                className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-sidebar-foreground/70 transition-colors hover:bg-sidebar-accent hover:text-sidebar-foreground"
              >
                <LogOut className="h-4 w-4" />
                {t('common.signOut')}
              </button>
            </div>
          </SheetContent>
        </Sheet>

        <div className="flex items-center gap-2">
          <CalendarDays className="h-5 w-5 text-sidebar-primary" />
          <span className="font-display text-base font-bold tracking-tight text-sidebar-foreground">BookFlow</span>
        </div>
      </div>

      {/* Right: notification + profile */}
      <div className="flex items-center gap-2">
        <NotificationCenter />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex h-8 w-8 items-center justify-center rounded-full ring-2 ring-sidebar-border hover:ring-sidebar-primary transition-all">
              <Avatar className="h-8 w-8">
                <AvatarImage src="" />
                <AvatarFallback className="bg-sidebar-accent text-sidebar-primary text-xs font-semibold">
                  {initials}
                </AvatarFallback>
              </Avatar>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem asChild>
              <Link to="/profile" className="flex items-center gap-2">
                <User className="h-4 w-4" />
                {t('sidebar.profile')}
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={signOut} className="flex items-center gap-2 text-destructive">
              <LogOut className="h-4 w-4" />
              {t('common.signOut')}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
