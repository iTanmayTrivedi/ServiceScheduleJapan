import { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { StatusBadge } from '@/components/StatusBadge';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { MOCK_APPOINTMENTS } from '@/data/mockData';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { CalendarDays, Clock, Download } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { NoShowPrediction } from '@/components/ai/NoShowPrediction';

const statuses = ['pending', 'confirmed', 'completed', 'cancelled', 'no_show'] as const;

export default function AdminAppointments() {
  const { toast } = useToast();
  const { t } = useTranslation();
  const { isDemoMode } = useAuth();
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');

  const fetchAppointments = async () => {
    if (isDemoMode) {
      const filtered = filter === 'all' ? MOCK_APPOINTMENTS : MOCK_APPOINTMENTS.filter(a => a.status === filter);
      setAppointments(filtered);
      setLoading(false);
      return;
    }

    let query = supabase.from('appointments')
      .select('*, services(name, duration_minutes, price), staff:profiles!appointments_staff_id_fkey(full_name, email)')
      .order('appointment_date', { ascending: false });
    if (filter !== 'all') query = query.eq('status', filter as any);
    const { data, error } = await query;
    if (error) { console.error('AdminAppointments fetch error:', error); }
    // Fetch customer profiles separately since there's no FK for user_id -> profiles
    const rows = data || [];
    const userIds = [...new Set(rows.map((a: any) => a.user_id))];
    let profilesMap: Record<string, any> = {};
    if (userIds.length > 0) {
      const { data: profiles } = await supabase.from('profiles').select('user_id, full_name, email').in('user_id', userIds);
      (profiles || []).forEach((p: any) => { profilesMap[p.user_id] = p; });
    }
    setAppointments(rows.map((a: any) => ({ ...a, profiles: profilesMap[a.user_id] || null })));
    setLoading(false);
  };

  useEffect(() => { fetchAppointments(); }, [filter, isDemoMode]);

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

  const exportCSV = () => {
    const headers = ['Customer', 'Service', 'Date', 'Time', 'Staff', 'Status'];
    const rows = appointments.map(apt => [
      apt.profiles?.full_name || apt.profiles?.email || apt.customer_profile?.full_name || 'Unknown',
      apt.services?.name || '',
      apt.appointment_date,
      apt.start_time?.slice(0, 5) || '',
      apt.staff?.full_name || '',
      apt.status,
    ]);
    const csv = [headers, ...rows].map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `appointments_${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: t('admin.csvExported') });
  };

  return (
    <DashboardLayout>
      <div className="animate-fade-in space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-3xl font-bold tracking-tight">{t('admin.allAppointments')}</h1>
            <p className="text-muted-foreground">{t('admin.manageStatuses')}</p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" onClick={exportCSV} disabled={appointments.length === 0}>
              <Download className="mr-2 h-4 w-4" />
              {t('admin.exportCSV')}
            </Button>
            <Select value={filter} onValueChange={setFilter}>
              <SelectTrigger className="w-[160px]"><SelectValue placeholder={t('common.filter')} /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('common.all')}</SelectItem>
                {statuses.map(s => <SelectItem key={s} value={s}>{t(`status.${s}`)}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>
        <Card className="shadow-card">
          <CardContent className="p-0">
            {loading ? (
              <p className="p-6 text-sm text-muted-foreground">{t('common.loading')}</p>
            ) : appointments.length === 0 ? (
              <div className="py-12 text-center"><CalendarDays className="mx-auto mb-3 h-10 w-10 text-muted-foreground/40" /><p className="text-muted-foreground">{t('admin.noAppointments')}</p></div>
            ) : (
              <div className="divide-y divide-border">
                {appointments.map(apt => (
                  <div key={apt.id} className="flex items-center justify-between p-4 transition-colors hover:bg-muted/30">
                    <div className="flex items-center gap-4">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary"><Clock className="h-4 w-4 text-accent" /></div>
                      <div>
                        <p className="font-medium">{apt.profiles?.full_name || apt.profiles?.email || apt.customer_profile?.full_name || 'Unknown'}</p>
                        <p className="text-sm text-muted-foreground">
                          {apt.services?.name} • {format(new Date(apt.appointment_date), 'MMM dd, yyyy')} • {apt.start_time?.slice(0, 5)}
                          {(apt.staff?.full_name) && ` • Staff: ${apt.staff.full_name}`}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <StatusBadge status={apt.status} />
                      <Select value={apt.status} onValueChange={(val) => updateStatus(apt.id, val)}>
                        <SelectTrigger className="w-[130px] h-8 text-xs"><SelectValue /></SelectTrigger>
                        <SelectContent>{statuses.map(s => <SelectItem key={s} value={s}>{t(`status.${s}`)}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
        <NoShowPrediction appointments={appointments} />
      </div>
    </DashboardLayout>
  );
}
