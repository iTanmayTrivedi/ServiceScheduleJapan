import { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { StatCard } from '@/components/StatCard';
import { Sparkles } from 'lucide-react';
import { StatusBadge } from '@/components/StatusBadge';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { MOCK_APPOINTMENTS } from '@/data/mockData';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { CalendarDays, CheckCircle2, Clock, Users } from 'lucide-react';
import { format } from 'date-fns';
import { useTranslation } from 'react-i18next';
import { ProfileCard } from '@/components/ProfileCard';

const completableStatuses = ['pending', 'confirmed', 'completed', 'cancelled', 'no_show'] as const;

function getGreetingKey(): string {
  const h = new Date().getHours();
  if (h < 12) return 'greetings.morning';
  if (h < 17) return 'greetings.afternoon';
  return 'greetings.evening';
}

export default function StaffDashboard() {
  const { user, isDemoMode } = useAuth();
  const { toast } = useToast();
  const { t } = useTranslation();
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAppointments = async () => {
    if (!user) { setLoading(false); return; }

    if (isDemoMode) {
      const filtered = MOCK_APPOINTMENTS.filter(a => a.staff_id === user.id);
      setAppointments(filtered);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('appointments')
        .select('*, services(name, duration_minutes, price)')
        .eq('staff_id', user.id)
        .order('appointment_date', { ascending: true });
      if (error) console.error('StaffDashboard fetch error:', error);

      const userIds = [...new Set((data || []).map((a: any) => a.user_id))];
      let profilesMap: Record<string, any> = {};
      if (userIds.length > 0) {
        const { data: profiles } = await supabase.from('profiles').select('user_id, full_name, email').in('user_id', userIds);
        (profiles || []).forEach((p: any) => { profilesMap[p.user_id] = p; });
      }
      setAppointments((data || []).map((a: any) => ({ ...a, customer_profile: profilesMap[a.user_id] || null })));
    } catch (err) {
      console.error('StaffDashboard unexpected error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAppointments(); }, [user, isDemoMode]);

  const updateStatus = async (id: string, status: string) => {
    if (isDemoMode) {
      setAppointments(prev => prev.map(a => a.id === id ? { ...a, status } : a));
      toast({ title: t('admin.statusUpdated', { status: t(`status.${status}`) }) });
      return;
    }
    const { error } = await supabase.from('appointments').update({ status: status as any }).eq('id', id);
    if (error) toast({ title: 'Error', description: error.message, variant: 'destructive' });
    else { toast({ title: t('admin.statusUpdated', { status: t(`status.${status}`) }) }); fetchAppointments(); }
  };

  const today = format(new Date(), 'yyyy-MM-dd');
  const todayAppts = appointments.filter(a => a.appointment_date === today);
  const upcoming = appointments.filter(a => ['pending', 'confirmed'].includes(a.status) && a.appointment_date >= today);
  const completedCount = appointments.filter(a => a.status === 'completed').length;

  return (
    <DashboardLayout>
      <div className="animate-fade-in space-y-6">
        <div>
          <p className="text-sm font-medium text-accent flex items-center gap-1.5 mb-1">
            <Sparkles className="h-4 w-4" />
            {t(getGreetingKey())}
          </p>
          <h1 className="font-display text-3xl font-bold tracking-tight">{t('staff.dashboardTitle')}</h1>
          <p className="text-muted-foreground">{t('staff.dashboardSubtitle')}</p>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          <StatCard title={t('admin.todaysBookings')} value={todayAppts.length} icon={<CalendarDays className="h-5 w-5" />} />
          <StatCard title={t('dashboard.upcoming')} value={upcoming.length} icon={<Clock className="h-5 w-5" />} />
          <StatCard title={t('dashboard.completed')} value={completedCount} icon={<CheckCircle2 className="h-5 w-5" />} />
        </div>
        <Card className="shadow-card">
          <CardHeader><CardTitle className="font-display text-lg">{t('staff.assignedAppointments')}</CardTitle></CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-sm text-muted-foreground">{t('common.loading')}</p>
            ) : appointments.length === 0 ? (
              <div className="py-8 text-center">
                <CalendarDays className="mx-auto mb-3 h-10 w-10 text-muted-foreground/40" />
                <p className="text-muted-foreground">{t('staff.noAssigned')}</p>
              </div>
            ) : (
              <div className="space-y-3">
                {appointments.map(apt => (
                  <div key={apt.id} className="flex items-center justify-between rounded-lg border border-border p-4 transition-colors hover:bg-muted/50">
                    <div className="flex items-center gap-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-secondary"><Clock className="h-5 w-5 text-accent" /></div>
                      <div>
                        <p className="font-medium">{apt.customer_profile?.full_name || apt.customer_profile?.email || 'Unknown'}</p>
                        <p className="text-sm text-muted-foreground">{apt.services?.name} • {format(new Date(apt.appointment_date), 'MMM dd, yyyy')} • {apt.start_time?.slice(0, 5)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <StatusBadge status={apt.status} />
                      {['pending', 'confirmed'].includes(apt.status) && (
                        <Select value={apt.status} onValueChange={(val) => updateStatus(apt.id, val)}>
                          <SelectTrigger className="w-[130px] h-8 text-xs"><SelectValue /></SelectTrigger>
                          <SelectContent>{completableStatuses.map(s => <SelectItem key={s} value={s}>{t(`status.${s}`)}</SelectItem>)}</SelectContent>
                        </Select>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Profile Widget */}
        <ProfileCard />
      </div>
    </DashboardLayout>
  );
}
