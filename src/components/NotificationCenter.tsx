import { useState, useEffect } from 'react';
import { Bell, CalendarDays, CheckCircle2, XCircle, Clock, AlertTriangle } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { MOCK_APPOINTMENTS } from '@/data/mockData';
import { useTranslation } from 'react-i18next';
import { format, formatDistanceToNow } from 'date-fns';
import { ja, enUS } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface Notification {
  id: string;
  type: 'booking' | 'confirmed' | 'cancelled' | 'reminder' | 'completed';
  title: string;
  message: string;
  time: Date;
  read: boolean;
}

const typeConfig = {
  booking: { icon: CalendarDays, color: 'text-info' },
  confirmed: { icon: CheckCircle2, color: 'text-success' },
  cancelled: { icon: XCircle, color: 'text-destructive' },
  reminder: { icon: Clock, color: 'text-warning' },
  completed: { icon: CheckCircle2, color: 'text-accent' },
};

export function NotificationCenter() {
  const { user, isDemoMode, isAdmin, isStaff } = useAuth();
  const { t, i18n: i18nInstance } = useTranslation();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [open, setOpen] = useState(false);
  const locale = i18nInstance.language?.startsWith('ja') ? ja : enUS;

  useEffect(() => {
    if (!user) return;

    if (isDemoMode) {
      const now = new Date();
      const demoNotifs: Notification[] = [
        { id: '1', type: 'confirmed', title: t('notifications.appointmentConfirmed'), message: 'General Consultation – Tomorrow 10:00', time: new Date(now.getTime() - 30 * 60000), read: false },
        { id: '2', type: 'reminder', title: t('notifications.upcomingReminder'), message: 'Physical Therapy – Today 09:00', time: new Date(now.getTime() - 2 * 3600000), read: false },
        { id: '3', type: 'booking', title: t('notifications.newBooking'), message: 'Dental Cleaning – ' + format(new Date(now.getTime() + 86400000 * 2), 'MMM dd'), time: new Date(now.getTime() - 4 * 3600000), read: true },
        { id: '4', type: 'completed', title: t('notifications.appointmentCompleted'), message: 'Physical Therapy – Great session!', time: new Date(now.getTime() - 24 * 3600000), read: true },
      ];
      setNotifications(demoNotifs);
      return;
    }

    const fetchNotifications = async () => {
      const query = isAdmin
        ? supabase.from('appointments').select('id, status, appointment_date, start_time, created_at, services(name)').order('updated_at', { ascending: false }).limit(10)
        : supabase.from('appointments').select('id, status, appointment_date, start_time, created_at, services(name)').eq(isStaff ? 'staff_id' : 'user_id', user.id).order('updated_at', { ascending: false }).limit(10);

      const { data } = await query;
      if (data) {
        const notifs: Notification[] = data.map((apt: any) => ({
          id: apt.id,
          type: apt.status === 'cancelled' ? 'cancelled' : apt.status === 'completed' ? 'completed' : apt.status === 'confirmed' ? 'confirmed' : 'booking',
          title: apt.status === 'cancelled' ? t('notifications.appointmentCancelled') : apt.status === 'completed' ? t('notifications.appointmentCompleted') : apt.status === 'confirmed' ? t('notifications.appointmentConfirmed') : t('notifications.newBooking'),
          message: `${apt.services?.name || 'Appointment'} – ${format(new Date(apt.appointment_date), 'MMM dd')} ${apt.start_time?.slice(0, 5) || ''}`,
          time: new Date(apt.created_at),
          read: ['completed', 'cancelled'].includes(apt.status),
        }));
        setNotifications(notifs);
      }
    };
    fetchNotifications();
  }, [user, isDemoMode, isAdmin, isStaff]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button className="relative flex items-center justify-center rounded-lg p-2 text-sidebar-foreground/70 transition-colors hover:bg-sidebar-accent hover:text-sidebar-foreground">
          <Bell className="h-4.5 w-4.5" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-accent text-[10px] font-bold text-accent-foreground">
              {unreadCount}
            </span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="start" side="right" sideOffset={8}>
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <h4 className="font-display text-sm font-semibold">{t('notifications.title')}</h4>
          {unreadCount > 0 && (
            <button onClick={markAllRead} className="text-xs text-accent hover:underline">
              {t('notifications.markAllRead')}
            </button>
          )}
        </div>
        <div className="max-h-[320px] overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="py-8 text-center">
              <Bell className="mx-auto mb-2 h-8 w-8 text-muted-foreground/30" />
              <p className="text-sm text-muted-foreground">{t('notifications.empty')}</p>
            </div>
          ) : (
            notifications.map(n => {
              const config = typeConfig[n.type];
              const Icon = config.icon;
              return (
                <div key={n.id} className={cn('flex gap-3 px-4 py-3 transition-colors hover:bg-muted/50', !n.read && 'bg-accent/5')}>
                  <div className={cn('mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-secondary', config.color)}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className={cn('text-sm', !n.read && 'font-medium')}>{n.title}</p>
                    <p className="text-xs text-muted-foreground truncate">{n.message}</p>
                    <p className="mt-0.5 text-[11px] text-muted-foreground/60">
                      {formatDistanceToNow(n.time, { addSuffix: true, locale })}
                    </p>
                  </div>
                  {!n.read && <div className="mt-2 h-2 w-2 shrink-0 rounded-full bg-accent" />}
                </div>
              );
            })
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
