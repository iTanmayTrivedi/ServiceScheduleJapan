import { CalendarDays, CheckCircle2, XCircle, Clock, Star } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useTranslation } from 'react-i18next';
import { formatDistanceToNow } from 'date-fns';
import { ja, enUS } from 'date-fns/locale';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface TimelineEvent {
  id: string;
  type: 'booked' | 'completed' | 'cancelled' | 'upcoming' | 'rated';
  title: string;
  subtitle: string;
  time: Date;
}

const eventConfig = {
  booked: { icon: CalendarDays, color: 'bg-info/10 text-info', line: 'bg-info' },
  completed: { icon: CheckCircle2, color: 'bg-success/10 text-success', line: 'bg-success' },
  cancelled: { icon: XCircle, color: 'bg-destructive/10 text-destructive', line: 'bg-destructive' },
  upcoming: { icon: Clock, color: 'bg-warning/10 text-warning', line: 'bg-warning' },
  rated: { icon: Star, color: 'bg-accent/10 text-accent', line: 'bg-accent' },
};

interface Props {
  appointments: any[];
}

export function ActivityTimeline({ appointments }: Props) {
  const { t, i18n } = useTranslation();
  const locale = i18n.language?.startsWith('ja') ? ja : enUS;

  const today = new Date().toISOString().slice(0, 10);

  const events: TimelineEvent[] = appointments
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 8)
    .map(apt => ({
      id: apt.id,
      type: apt.status === 'cancelled' ? 'cancelled' : apt.status === 'completed' ? 'completed' : apt.appointment_date >= today ? 'upcoming' : 'booked',
      title: apt.services?.name || t('common.loading'),
      subtitle: `${apt.appointment_date} • ${apt.start_time?.slice(0, 5) || ''}`,
      time: new Date(apt.created_at),
    }));

  return (
    <Card className="shadow-card">
      <CardHeader className="pb-3">
        <CardTitle className="font-display text-lg flex items-center gap-2">
          <Clock className="h-5 w-5 text-accent" />
          {t('timeline.title')}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {events.length === 0 ? (
          <div className="py-8 text-center">
            <Clock className="mx-auto mb-2 h-8 w-8 text-muted-foreground/30" />
            <p className="text-sm text-muted-foreground">{t('timeline.empty')}</p>
          </div>
        ) : (
          <div className="relative space-y-0">
            {events.map((event, i) => {
              const config = eventConfig[event.type];
              const Icon = config.icon;
              return (
                <motion.div
                  key={event.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.06, duration: 0.3 }}
                  className="relative flex gap-3 pb-4"
                >
                  {/* Line */}
                  {i < events.length - 1 && (
                    <div className={cn('absolute left-[15px] top-8 h-[calc(100%-16px)] w-0.5', config.line, 'opacity-20')} />
                  )}
                  {/* Icon */}
                  <div className={cn('relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full', config.color)}>
                    <Icon className="h-4 w-4" />
                  </div>
                  {/* Content */}
                  <div className="min-w-0 flex-1 pt-0.5">
                    <p className="text-sm font-medium leading-tight">{event.title}</p>
                    <p className="text-xs text-muted-foreground">{event.subtitle}</p>
                    <p className="mt-0.5 text-[11px] text-muted-foreground/50">
                      {formatDistanceToNow(event.time, { addSuffix: true, locale })}
                    </p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
