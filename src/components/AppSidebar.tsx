import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useTranslation } from 'react-i18next';
import { LanguageSwitcher } from './LanguageSwitcher';
import { DarkModeToggle } from './DarkModeToggle';
import { NotificationCenter } from './NotificationCenter';
import {
  CalendarDays, LayoutDashboard, Clock, LogOut, Briefcase, BarChart3, CalendarPlus, History, UserCog, User
} from 'lucide-react';
import { cn } from '@/lib/utils';

export function AppSidebar() {
  const { isAdmin, isStaff, signOut, user, isDemoMode } = useAuth();
  const location = useLocation();
  const { t } = useTranslation();

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

  return (
    <aside className="fixed left-0 top-0 z-40 flex h-screen w-64 flex-col bg-sidebar text-sidebar-foreground border-r border-sidebar-border">
      <div className="flex items-center gap-2 px-6 py-5 border-b border-sidebar-border">
        <CalendarDays className="h-7 w-7 text-sidebar-primary" />
        <span className="font-display text-lg font-bold tracking-tight">BookFlow</span>
        <div className="ml-auto flex items-center gap-1">
          <NotificationCenter />
          {isStaff && <UserCog className="h-4 w-4 text-sidebar-primary" />}
        </div>
      </div>

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

      <div className="border-t border-sidebar-border p-4 space-y-3">
        <div className="flex items-center gap-2">
          <LanguageSwitcher variant="sidebar" />
        </div>
        <DarkModeToggle variant="sidebar" />
        {isDemoMode && <span className="inline-block rounded bg-accent/10 px-2 py-0.5 text-[10px] font-medium text-accent">DEMO</span>}
        <p className="truncate text-xs text-muted-foreground/60">{user?.email}</p>
        <button
          onClick={signOut}
          className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-sidebar-foreground/70 transition-colors hover:bg-sidebar-accent hover:text-sidebar-foreground"
        >
          <LogOut className="h-4 w-4" />
          {t('common.signOut')}
        </button>
      </div>
    </aside>
  );
}
