import { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { StatCard } from '@/components/StatCard';
import { StatusBadge } from '@/components/StatusBadge';
import { ActivityTimeline } from '@/components/ActivityTimeline';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { MOCK_APPOINTMENTS } from '@/data/mockData';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CalendarDays, Clock, CheckCircle2, XCircle, Plus, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { ProfileCard } from '@/components/ProfileCard';

function getGreetingKey(): string {
  const h = new Date().getHours();
  if (h < 12) return 'greetings.morning';
  if (h < 17) return 'greetings.afternoon';
  return 'greetings.evening';
}

export default function CustomerDashboard() {
  const { user, isDemoMode } = useAuth();
  const { t } = useTranslation();
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    if (isDemoMode) {
      setAppointments(MOCK_APPOINTMENTS.filter(a => a.user_id === user.id));
      setLoading(false);
      return;
    }
    const fetchAppointments = async () => {
      try {
        const { data, error } = await supabase.from('appointments').select('*, services(name, duration_minutes)').eq('user_id', user.id).order('appointment_date', { ascending: true });
        if (error) console.error('CustomerDashboard fetch error:', error);
        setAppointments(data || []);
      } catch (err) { console.error('CustomerDashboard unexpected error:', err); }
      finally { setLoading(false); }
    };
    fetchAppointments();
  }, [user, isDemoMode]);

  const upcoming = appointments.filter(a => ['pending', 'confirmed'].includes(a.status) && a.appointment_date >= format(new Date(), 'yyyy-MM-dd'));
  const completed = appointments.filter(a => a.status === 'completed');
  const cancelled = appointments.filter(a => a.status === 'cancelled');

  const nextAppointment = upcoming[0];

  return (
    <DashboardLayout>
      <div className="animate-fade-in space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
              <p className="text-sm font-medium text-accent flex items-center gap-1.5">
                <Sparkles className="h-4 w-4" />
                {t(getGreetingKey())}
              </p>
              <h1 className="font-display text-3xl font-bold tracking-tight">{user?.full_name || t('dashboard.title')}</h1>
              <p className="text-muted-foreground">{t('dashboard.welcome')}</p>
            </motion.div>
          </div>
          <Link to="/book"><Button className="gap-2"><Plus className="h-4 w-4" /> {t('common.bookAppointment')}</Button></Link>
        </div>

        {/* Next appointment highlight */}
        {nextAppointment && (
          <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.4, delay: 0.1 }}>
            <Card className="shadow-card border-accent/20 bg-gradient-to-r from-accent/5 to-transparent">
              <CardContent className="flex items-center gap-4 p-5">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-accent/10">
                  <CalendarDays className="h-7 w-7 text-accent" />
                </div>
                <div className="flex-1">
                  <p className="text-xs font-medium text-accent uppercase tracking-wide">{t('dashboard.nextAppointment')}</p>
                  <p className="font-display text-lg font-semibold">{nextAppointment.services?.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {format(new Date(nextAppointment.appointment_date), 'EEEE, MMM dd, yyyy')} • {nextAppointment.start_time?.slice(0, 5)}
                  </p>
                </div>
                <StatusBadge status={nextAppointment.status} />
              </CardContent>
            </Card>
          </motion.div>
        )}

        <div className="grid gap-4 md:grid-cols-3">
          <StatCard title={t('dashboard.upcoming')} value={upcoming.length} icon={<CalendarDays className="h-5 w-5" />} />
          <StatCard title={t('dashboard.completed')} value={completed.length} icon={<CheckCircle2 className="h-5 w-5" />} />
          <StatCard title={t('dashboard.cancelled')} value={cancelled.length} icon={<XCircle className="h-5 w-5" />} />
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="shadow-card">
            <CardHeader><CardTitle className="font-display text-lg">{t('dashboard.upcomingAppointments')}</CardTitle></CardHeader>
            <CardContent>
              {loading ? (
                <p className="text-muted-foreground text-sm">{t('common.loading')}</p>
              ) : upcoming.length === 0 ? (
                <div className="py-8 text-center">
                  <CalendarDays className="mx-auto mb-3 h-10 w-10 text-muted-foreground/40" />
                  <p className="text-muted-foreground">{t('dashboard.noUpcoming')}</p>
                  <Link to="/book"><Button variant="outline" className="mt-3 gap-2"><Plus className="h-4 w-4" /> {t('common.bookNow')}</Button></Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {upcoming.slice(0, 5).map((apt) => (
                    <div key={apt.id} className="flex items-center justify-between rounded-lg border border-border p-4 transition-colors hover:bg-muted/50">
                      <div className="flex items-center gap-4">
                        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-secondary"><Clock className="h-5 w-5 text-accent" /></div>
                        <div>
                          <p className="font-medium">{apt.services?.name}</p>
                          <p className="text-sm text-muted-foreground">{format(new Date(apt.appointment_date), 'MMM dd, yyyy')} • {apt.start_time?.slice(0, 5)}</p>
                        </div>
                      </div>
                      <StatusBadge status={apt.status} />
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <ActivityTimeline appointments={appointments} />
        </div>

        {/* Profile Widget */}
        <ProfileCard />
      </div>
    </DashboardLayout>
  );
}
