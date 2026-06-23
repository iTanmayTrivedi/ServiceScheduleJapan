import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { MOCK_BUSINESS_HOURS, MOCK_APPOINTMENTS } from '@/data/mockData';
import { Calendar } from '@/components/ui/calendar';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { format, addMinutes, parse, isBefore, isToday } from 'date-fns';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';

interface RescheduleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  appointment: any;
  onRescheduled: () => void;
}

export function RescheduleDialog({ open, onOpenChange, appointment, onRescheduled }: RescheduleDialogProps) {
  const { toast } = useToast();
  const { t } = useTranslation();
  const { isDemoMode } = useAuth();
  const [businessHours, setBusinessHours] = useState<any[]>([]);
  const [existingAppointments, setExistingAppointments] = useState<any[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const duration = appointment?.services?.duration_minutes || 30;

  useEffect(() => {
    if (!open) return;
    if (isDemoMode) {
      setBusinessHours(MOCK_BUSINESS_HOURS);
    } else {
      supabase.from('business_hours').select('*').order('day_of_week').then(({ data }) => setBusinessHours(data || []));
    }
    setSelectedDate(undefined);
    setSelectedSlot(null);
  }, [open, isDemoMode]);

  useEffect(() => {
    if (!selectedDate) return;
    const dateStr = format(selectedDate, 'yyyy-MM-dd');
    if (isDemoMode) {
      setExistingAppointments(MOCK_APPOINTMENTS.filter(a => a.appointment_date === dateStr && ['pending', 'confirmed'].includes(a.status) && a.id !== appointment?.id));
      return;
    }
    supabase.from('appointments').select('start_time, end_time, id').eq('appointment_date', dateStr).in('status', ['pending', 'confirmed'])
      .then(({ data }) => setExistingAppointments((data || []).filter(a => a.id !== appointment?.id)));
  }, [selectedDate, appointment?.id, isDemoMode]);

  const generateTimeSlots = () => {
    if (!selectedDate) return [];
    const dayOfWeek = selectedDate.getDay();
    const hours = businessHours.find(h => h.day_of_week === dayOfWeek);
    if (!hours || !hours.is_open) return [];
    const slots: string[] = [];
    const start = parse(hours.start_time, 'HH:mm:ss', selectedDate);
    const end = parse(hours.end_time, 'HH:mm:ss', selectedDate);
    let current = start;
    while (addMinutes(current, duration) <= end) {
      const slotTime = format(current, 'HH:mm');
      const slotEnd = format(addMinutes(current, duration), 'HH:mm');
      const isConflict = existingAppointments.some(apt => { const aptStart = apt.start_time.slice(0, 5); const aptEnd = apt.end_time.slice(0, 5); return slotTime < aptEnd && slotEnd > aptStart; });
      const isPast = isToday(selectedDate) && isBefore(parse(slotTime, 'HH:mm', new Date()), new Date());
      if (!isConflict && !isPast) slots.push(slotTime);
      current = addMinutes(current, 30);
    }
    return slots;
  };

  const isDateDisabled = (date: Date) => {
    if (isBefore(date, new Date()) && !isToday(date)) return true;
    const dayOfWeek = date.getDay();
    const hours = businessHours.find(h => h.day_of_week === dayOfWeek);
    return !hours || !hours.is_open;
  };

  const handleReschedule = async () => {
    if (!selectedDate || !selectedSlot) return;
    setSaving(true);
    const endTime = format(addMinutes(parse(selectedSlot, 'HH:mm', new Date()), duration), 'HH:mm');

    if (isDemoMode) {
      toast({ title: t('reschedule.success') });
      onOpenChange(false);
      onRescheduled();
      setSaving(false);
      return;
    }

    const { error } = await supabase.from('appointments').update({ appointment_date: format(selectedDate, 'yyyy-MM-dd'), start_time: selectedSlot, end_time: endTime }).eq('id', appointment.id);
    if (error) toast({ title: t('reschedule.failed'), description: error.message, variant: 'destructive' });
    else { toast({ title: t('reschedule.success') }); onOpenChange(false); onRescheduled(); }
    setSaving(false);
  };

  const slots = generateTimeSlots();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display">{t('reschedule.title')}</DialogTitle>
          <DialogDescription>{t('reschedule.desc', { service: appointment?.services?.name })}</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <Calendar mode="single" selected={selectedDate} onSelect={(d) => { setSelectedDate(d); setSelectedSlot(null); }} disabled={isDateDisabled} className="pointer-events-auto mx-auto" />
          {selectedDate && (
            <div>
              <p className="mb-2 text-sm font-medium">{t('booking.availableSlots')} — {format(selectedDate, 'MMM dd')}</p>
              {slots.length === 0 ? (
                <p className="py-2 text-center text-sm text-muted-foreground">{t('booking.noSlots')}</p>
              ) : (
                <div className="grid grid-cols-4 gap-2">
                  {slots.map(slot => (
                    <button key={slot} onClick={() => setSelectedSlot(slot)}
                      className={cn('rounded-lg border px-3 py-2 text-sm font-medium transition-all', selectedSlot === slot ? 'border-accent bg-accent text-accent-foreground' : 'border-border hover:border-accent/50 hover:bg-muted/50')}>
                      {slot}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
          {selectedSlot && (
            <Button onClick={handleReschedule} className="w-full" disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}{t('reschedule.confirm')}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
