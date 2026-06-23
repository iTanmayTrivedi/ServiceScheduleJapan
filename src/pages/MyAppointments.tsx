import { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { StatusBadge } from '@/components/StatusBadge';
import { RescheduleDialog } from '@/components/RescheduleDialog';
import { RatingDialog } from '@/components/RatingDialog';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { MOCK_APPOINTMENTS } from '@/data/mockData';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { CalendarDays, Clock, Star } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger
} from '@/components/ui/alert-dialog';

export default function MyAppointments() {
  const { user, isDemoMode } = useAuth();
  const { toast } = useToast();
  const { t } = useTranslation();
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [rescheduleApt, setRescheduleApt] = useState<any | null>(null);
  const [ratingApt, setRatingApt] = useState<any | null>(null);
  const [ratedIds, setRatedIds] = useState<Set<string>>(new Set());

  const fetchAppointments = async () => {
    if (!user) { setLoading(false); return; }

    if (isDemoMode) {
      setAppointments(MOCK_APPOINTMENTS.filter(a => a.user_id === user.id));
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase.from('appointments').select('*, services(name, duration_minutes, price)').eq('user_id', user.id).order('appointment_date', { ascending: false });
      if (error) console.error('MyAppointments fetch error:', error);
      setAppointments(data || []);
    } catch (err) { console.error('MyAppointments unexpected error:', err); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchAppointments(); }, [user, isDemoMode]);

  useEffect(() => {
    if (!user || isDemoMode) return;
    supabase.from('ratings').select('appointment_id').eq('user_id', user.id).then(({ data }) => {
      setRatedIds(new Set((data || []).map((r: any) => r.appointment_id)));
    });
  }, [user, isDemoMode]);

  const handleCancel = async (id: string) => {
    if (isDemoMode) {
      setAppointments(prev => prev.map(a => a.id === id ? { ...a, status: 'cancelled' } : a));
      toast({ title: t('myAppointments.appointmentCancelled') });
      return;
    }
    const { error } = await supabase.from('appointments').update({ status: 'cancelled' }).eq('id', id);
    if (error) toast({ title: 'Error', description: error.message, variant: 'destructive' });
    else { toast({ title: t('myAppointments.appointmentCancelled') }); fetchAppointments(); }
  };

  return (
    <DashboardLayout>
      <div className="animate-fade-in space-y-6">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight">{t('myAppointments.title')}</h1>
          <p className="text-muted-foreground">{t('myAppointments.subtitle')}</p>
        </div>
        <Card className="shadow-card">
          <CardHeader><CardTitle className="font-display text-lg">{t('myAppointments.allAppointments')}</CardTitle></CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-sm text-muted-foreground">{t('common.loading')}</p>
            ) : appointments.length === 0 ? (
              <div className="py-8 text-center">
                <CalendarDays className="mx-auto mb-3 h-10 w-10 text-muted-foreground/40" />
                <p className="text-muted-foreground">{t('myAppointments.noAppointments')}</p>
              </div>
            ) : (
              <div className="space-y-3">
                {appointments.map(apt => (
                  <div key={apt.id} className="flex items-center justify-between rounded-lg border border-border p-4 transition-colors hover:bg-muted/50">
                    <div className="flex items-center gap-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-secondary"><Clock className="h-5 w-5 text-accent" /></div>
                      <div>
                        <p className="font-medium">{apt.services?.name}</p>
                        <p className="text-sm text-muted-foreground">{format(new Date(apt.appointment_date), 'MMM dd, yyyy')} • {apt.start_time?.slice(0, 5)} – {apt.end_time?.slice(0, 5)}</p>
                        <p className="text-xs text-muted-foreground">${apt.services?.price}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <StatusBadge status={apt.status} />
                      {['pending', 'confirmed'].includes(apt.status) && (
                        <>
                          <Button variant="outline" size="sm" onClick={() => setRescheduleApt(apt)}>{t('reschedule.label')}</Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="outline" size="sm" className="text-destructive border-destructive/30 hover:bg-destructive/10">{t('myAppointments.cancelLabel')}</Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>{t('myAppointments.cancelTitle')}</AlertDialogTitle>
                                <AlertDialogDescription>{t('myAppointments.cancelDesc', { service: apt.services?.name, date: format(new Date(apt.appointment_date), 'MMM dd, yyyy') })}</AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>{t('common.keep')}</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleCancel(apt.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">{t('myAppointments.cancelButton')}</AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </>
                      )}
                      {apt.status === 'completed' && !ratedIds.has(apt.id) && (
                        <Button variant="outline" size="sm" className="gap-1.5" onClick={() => setRatingApt(apt)}>
                          <Star className="h-3.5 w-3.5" /> {t('ratings.rateButton')}
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
        <RescheduleDialog open={!!rescheduleApt} onOpenChange={(open) => { if (!open) setRescheduleApt(null); }} appointment={rescheduleApt} onRescheduled={fetchAppointments} />
        <RatingDialog open={!!ratingApt} onOpenChange={(open) => { if (!open) setRatingApt(null); }} appointment={ratingApt} onRated={() => { fetchAppointments(); if (ratingApt) setRatedIds(prev => new Set(prev).add(ratingApt.id)); }} />
      </div>
    </DashboardLayout>
  );
}
