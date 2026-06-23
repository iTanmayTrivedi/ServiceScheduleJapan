import { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { StatCard } from '@/components/StatCard';
import { Sparkles } from 'lucide-react';
import { StatusBadge } from '@/components/StatusBadge';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { MOCK_APPOINTMENTS } from '@/data/mockData';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CalendarDays, Users, CheckCircle2, TrendingUp, Clock, UserCheck } from 'lucide-react';
import { format, startOfWeek, endOfWeek, formatDistanceToNow } from 'date-fns';
import { enUS, ja } from 'date-fns/locale';
import { useTranslation } from 'react-i18next';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { DemandForecast } from '@/components/ai/DemandForecast';
import { AdminRatingsOverview } from '@/components/AdminRatingsOverview';
import { ProfileCard } from '@/components/ProfileCard';

function getGreetingKey(): string {
  const h = new Date().getHours();
  if (h < 12) return 'greetings.morning';
  if (h < 17) return 'greetings.afternoon';
  return 'greetings.evening';
}

export default function AdminDashboard() {
  const { t, i18n } = useTranslation();
  const { isDemoMode } = useAuth();
  const dateFnsLocale = i18n.language.startsWith('ja') ? ja : enUS;
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isDemoMode) {
      setAppointments(MOCK_APPOINTMENTS);
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      try {
        const { data, error } = await supabase.from('appointments').select('*, services(name)').order('appointment_date', { ascending: true });
        if (error) console.error('AdminDashboard fetch error:', error);
        const userIds = [...new Set((data || []).map((a: any) => a.user_id))];
        let profilesMap: Record<string, any> = {};
        if (userIds.length > 0) {
          const { data: profiles } = await supabase.from('profiles').select('user_id, full_name, email').in('user_id', userIds);
          (profiles || []).forEach((p: any) => { profilesMap[p.user_id] = p; });
        }
        setAppointments((data || []).map((a: any) => ({ ...a, customer_profile: profilesMap[a.user_id] || null })));
      } catch (err) { console.error('AdminDashboard unexpected error:', err); }
      finally { setLoading(false); }
    };
    fetchData();
  }, [isDemoMode]);

  const today = format(new Date(), 'yyyy-MM-dd');
  const weekStart = format(startOfWeek(new Date()), 'yyyy-MM-dd');
  const weekEnd = format(endOfWeek(new Date()), 'yyyy-MM-dd');
  const todayAppts = appointments.filter(a => a.appointment_date === today);
  const weekAppts = appointments.filter(a => a.appointment_date >= weekStart && a.appointment_date <= weekEnd);
  const completedCount = appointments.filter(a => a.status === 'completed').length;
  const cancelledCount = appointments.filter(a => a.status === 'cancelled').length;
  const upcomingAppts = appointments.filter(a => ['pending', 'confirmed'].includes(a.status) && a.appointment_date >= today);
  const recentBookings = [...appointments].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0, 6);

  const hourCounts: Record<string, number> = {};
  appointments.forEach(a => { if (a.start_time) { const hour = a.start_time.slice(0, 2); hourCounts[hour] = (hourCounts[hour] || 0) + 1; } });
  const chartData = Object.entries(hourCounts).sort(([a], [b]) => a.localeCompare(b)).map(([hour, count]) => ({ hour: `${hour}:00`, bookings: count }));

  return (
    <DashboardLayout>
      <div className="animate-fade-in space-y-6">
        <div>
          <p className="text-sm font-medium text-accent flex items-center gap-1.5 mb-1">
            <Sparkles className="h-4 w-4" />
            {t(getGreetingKey())}
          </p>
          <h1 className="font-display text-3xl font-bold tracking-tight">{t('admin.dashboardTitle')}</h1>
          <p className="text-muted-foreground">{t('admin.dashboardSubtitle')}</p>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatCard title={t('admin.todaysBookings')} value={todayAppts.length} icon={<CalendarDays className="h-5 w-5" />} />
          <StatCard title={t('admin.thisWeek')} value={weekAppts.length} icon={<TrendingUp className="h-5 w-5" />} />
          <StatCard title={t('dashboard.completed')} value={completedCount} icon={<CheckCircle2 className="h-5 w-5" />} description={`${cancelledCount} ${t('dashboard.cancelled').toLowerCase()}`} />
          <StatCard title={t('admin.total')} value={appointments.length} icon={<Users className="h-5 w-5" />} />
        </div>
        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="shadow-card">
            <CardHeader><CardTitle className="font-display text-lg">{t('admin.busyHours')}</CardTitle></CardHeader>
            <CardContent>
              {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="hour" fontSize={12} stroke="hsl(var(--muted-foreground))" />
                    <YAxis fontSize={12} stroke="hsl(var(--muted-foreground))" />
                    <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', fontSize: '13px' }} />
                    <Bar dataKey="bookings" fill="hsl(var(--accent))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <p className="py-8 text-center text-sm text-muted-foreground">{t('admin.noData')}</p>
              )}
            </CardContent>
          </Card>
          <Card className="shadow-card">
            <CardHeader><CardTitle className="font-display text-lg">{t('admin.recentBookings')}</CardTitle></CardHeader>
            <CardContent>
              {loading ? (
                <p className="text-sm text-muted-foreground">{t('common.loading')}</p>
              ) : recentBookings.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">{t('admin.noRecentBookings')}</p>
              ) : (
                <div className="max-h-[300px] space-y-3 overflow-y-auto">
                  {recentBookings.map(apt => (
                    <div key={apt.id} className="flex items-start gap-3 rounded-lg border border-border p-3">
                      <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-secondary"><UserCheck className="h-4 w-4 text-accent" /></div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium">{apt.customer_profile?.full_name || apt.customer_profile?.email || 'Unknown'}</p>
                        <p className="text-xs text-muted-foreground">{apt.services?.name} • {format(new Date(apt.appointment_date), 'MMM dd, yyyy', { locale: dateFnsLocale })} at {apt.start_time?.slice(0, 5)}</p>
                        <p className="mt-1 text-xs text-muted-foreground/60">{t('admin.bookedOn')} {formatDistanceToNow(new Date(apt.created_at), { addSuffix: true, locale: dateFnsLocale })}</p>
                      </div>
                      <StatusBadge status={apt.status} />
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
        <Card className="shadow-card">
          <CardHeader><CardTitle className="font-display text-lg">{t('admin.upcomingAppointments')}</CardTitle></CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-sm text-muted-foreground">{t('common.loading')}</p>
            ) : upcomingAppts.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">{t('admin.noUpcoming')}</p>
            ) : (
              <div className="space-y-3">
                {upcomingAppts.slice(0, 8).map(apt => (
                  <div key={apt.id} className="flex items-center justify-between rounded-lg border border-border p-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary"><Clock className="h-4 w-4 text-accent" /></div>
                      <div>
                        <p className="text-sm font-medium">{apt.customer_profile?.full_name || apt.customer_profile?.email}</p>
                        <p className="text-xs text-muted-foreground">{apt.services?.name} • {format(new Date(apt.appointment_date), 'MMM dd', { locale: dateFnsLocale })} at {apt.start_time?.slice(0, 5)}</p>
                      </div>
                    </div>
                    <StatusBadge status={apt.status} />
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
        <div className="grid gap-6 lg:grid-cols-2">
          <AdminRatingsOverview />
          <DemandForecast appointments={appointments} services={[]} />
        </div>

        {/* Profile Widget */}
        <ProfileCard />
      </div>
    </DashboardLayout>
  );
}
