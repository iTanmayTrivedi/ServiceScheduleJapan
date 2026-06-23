import { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { MOCK_SERVICES, MOCK_BUSINESS_HOURS, MOCK_STAFF_AVAILABILITY, MOCK_APPOINTMENTS, MOCK_PROFILES } from '@/data/mockData';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { useToast } from '@/hooks/use-toast';
import { format, addMinutes, parse, isBefore, isToday } from 'date-fns';
import { Loader2, CheckCircle2, Clock, UserCog } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next';
import { SmartSlotRecommendation } from '@/components/ai/SmartSlotRecommendation';

export default function BookAppointment() {
  const { user, isDemoMode } = useAuth();
  const { toast } = useToast();
  const { t } = useTranslation();
  const [services, setServices] = useState<any[]>([]);
  const [businessHours, setBusinessHours] = useState<any[]>([]);
  const [staffMembers, setStaffMembers] = useState<any[]>([]);
  const [staffAvailability, setStaffAvailability] = useState<any[]>([]);
  const [existingAppointments, setExistingAppointments] = useState<any[]>([]);
  const [selectedService, setSelectedService] = useState<any | null>(null);
  const [selectedStaff, setSelectedStaff] = useState<any | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [booking, setBooking] = useState(false);
  const [step, setStep] = useState(1);

  useEffect(() => {
    if (isDemoMode) {
      setServices(MOCK_SERVICES.filter(s => s.is_active));
      setBusinessHours(MOCK_BUSINESS_HOURS);
      const staffIds = [...new Set(MOCK_STAFF_AVAILABILITY.map(a => a.staff_id))];
      setStaffMembers(MOCK_PROFILES.filter(p => staffIds.includes(p.user_id)));
      setStaffAvailability(MOCK_STAFF_AVAILABILITY);
      return;
    }

    const fetchData = async () => {
      try {
        const [{ data: svc }, { data: bh }] = await Promise.all([
          supabase.from('services').select('*').eq('is_active', true).order('price'),
          supabase.from('business_hours').select('*').order('day_of_week'),
        ]);
        setServices(svc || []);
        setBusinessHours(bh || []);

        const { data: staffProfiles } = await supabase.from('profiles').select('*');
        const { data: avail } = await supabase.from('staff_availability').select('*');
        if (avail && avail.length > 0) {
          const staffIds = [...new Set(avail.map(a => a.staff_id))];
          setStaffMembers((staffProfiles || []).filter(p => staffIds.includes(p.user_id)));
          setStaffAvailability(avail);
        }
      } catch (err) { console.error('BookAppointment fetch error:', err); }
    };
    fetchData();
  }, [isDemoMode]);

  useEffect(() => {
    if (!selectedDate) return;

    if (isDemoMode) {
      const dateStr = format(selectedDate, 'yyyy-MM-dd');
      setExistingAppointments(MOCK_APPOINTMENTS.filter(a => a.appointment_date === dateStr && ['pending', 'confirmed'].includes(a.status)));
      return;
    }

    const fetchExisting = async () => {
      const { data } = await supabase.from('appointments').select('start_time, end_time, service_id, staff_id')
        .eq('appointment_date', format(selectedDate, 'yyyy-MM-dd')).in('status', ['pending', 'confirmed']);
      setExistingAppointments(data || []);
    };
    fetchExisting();
  }, [selectedDate, isDemoMode]);

  const generateTimeSlots = () => {
    if (!selectedDate || !selectedService) return [];
    const dayOfWeek = selectedDate.getDay();
    const hours = businessHours.find(h => h.day_of_week === dayOfWeek);
    if (!hours || !hours.is_open) return [];
    if (selectedStaff) {
      const staffAvail = staffAvailability.find(a => a.staff_id === selectedStaff.user_id && a.day_of_week === dayOfWeek);
      if (staffAvail && !staffAvail.is_available) return [];
    }
    const slots: string[] = [];
    const start = parse(hours.start_time, 'HH:mm:ss', selectedDate);
    const end = parse(hours.end_time, 'HH:mm:ss', selectedDate);
    let slotStart = start;
    let slotEnd = end;
    if (selectedStaff) {
      const staffAvail = staffAvailability.find(a => a.staff_id === selectedStaff.user_id && a.day_of_week === dayOfWeek);
      if (staffAvail) {
        const sStart = parse(staffAvail.start_time, 'HH:mm:ss', selectedDate);
        const sEnd = parse(staffAvail.end_time, 'HH:mm:ss', selectedDate);
        if (sStart > slotStart) slotStart = sStart;
        if (sEnd < slotEnd) slotEnd = sEnd;
      }
    }
    let current = slotStart;
    while (addMinutes(current, selectedService.duration_minutes) <= slotEnd) {
      const slotTime = format(current, 'HH:mm');
      const slotEndTime = format(addMinutes(current, selectedService.duration_minutes), 'HH:mm');
      const isConflict = existingAppointments.some(apt => {
        if (selectedStaff && apt.staff_id !== selectedStaff.user_id) return false;
        const aptStart = apt.start_time.slice(0, 5);
        const aptEnd = apt.end_time.slice(0, 5);
        return slotTime < aptEnd && slotEndTime > aptStart;
      });
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
    if (!hours || !hours.is_open) return true;
    if (selectedStaff) {
      const staffAvail = staffAvailability.find(a => a.staff_id === selectedStaff.user_id && a.day_of_week === dayOfWeek);
      if (staffAvail && !staffAvail.is_available) return true;
    }
    return false;
  };

  const handleBook = async () => {
    if (!user || !selectedService || !selectedDate || !selectedSlot) return;
    setBooking(true);
    const endTime = format(addMinutes(parse(selectedSlot, 'HH:mm', new Date()), selectedService.duration_minutes), 'HH:mm');

    if (isDemoMode) {
      toast({ title: t('booking.booked'), description: t('booking.bookedDesc') });
      setStep(5);
      setBooking(false);
      return;
    }

    const insertData: any = { user_id: user.id, service_id: selectedService.id, appointment_date: format(selectedDate, 'yyyy-MM-dd'), start_time: selectedSlot, end_time: endTime, status: 'pending' };
    if (selectedStaff) insertData.staff_id = selectedStaff.user_id;
    const { error } = await supabase.from('appointments').insert(insertData);
    if (error) toast({ title: t('booking.bookingFailed'), description: error.message, variant: 'destructive' });
    else { toast({ title: t('booking.booked'), description: t('booking.bookedDesc') }); setStep(5); }
    setBooking(false);
  };

  const slots = generateTimeSlots();
  const totalSteps = staffMembers.length > 0 ? 4 : 3;
  const stepLabels = staffMembers.length > 0
    ? [t('booking.stepService'), t('booking.stepStaff'), t('booking.stepDate'), t('booking.stepTime')]
    : [t('booking.stepService'), t('booking.stepDate'), t('booking.stepTime')];
  const getDateStep = () => staffMembers.length > 0 ? 3 : 2;
  const getTimeStep = () => staffMembers.length > 0 ? 4 : 3;
  const getDoneStep = () => 5;

  return (
    <DashboardLayout>
      <div className="animate-fade-in space-y-6">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight">{t('booking.title')}</h1>
          <p className="text-muted-foreground">{t('booking.subtitle')}</p>
        </div>
        <div className="flex items-center gap-2">
          {Array.from({ length: totalSteps }, (_, i) => i + 1).map((s, i) => (
            <div key={s} className="flex items-center gap-2">
              <div className={cn('flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium transition-colors', step >= s ? 'bg-accent text-accent-foreground' : 'bg-muted text-muted-foreground')}>
                {step > s ? <CheckCircle2 className="h-4 w-4" /> : s}
              </div>
              <span className={cn('text-sm', step >= s ? 'font-medium' : 'text-muted-foreground')}>{stepLabels[i]}</span>
              {s < totalSteps && <div className={cn('h-px w-8', step > s ? 'bg-accent' : 'bg-border')} />}
            </div>
          ))}
        </div>

        {step === getDoneStep() ? (
          <Card className="shadow-card">
            <CardContent className="py-12 text-center">
              <CheckCircle2 className="mx-auto mb-4 h-16 w-16 text-success" />
              <h2 className="font-display text-2xl font-bold">{t('booking.confirmed')}</h2>
              <p className="mt-2 text-muted-foreground">
                {selectedService?.name}{selectedStaff && ` with ${selectedStaff.full_name}`} on {selectedDate && format(selectedDate, 'MMMM dd, yyyy')} at {selectedSlot}
              </p>
              <Button className="mt-6" onClick={() => { setStep(1); setSelectedService(null); setSelectedStaff(null); setSelectedDate(undefined); setSelectedSlot(null); }}>{t('common.bookAnother')}</Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 lg:grid-cols-2">
            {step >= 1 && (
              <Card className={cn('shadow-card', step !== 1 && 'opacity-60')}>
                <CardHeader><CardTitle className="font-display text-lg">{t('booking.selectService')}</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  {services.map(svc => (
                    <button key={svc.id} onClick={() => { setSelectedService(svc); setSelectedSlot(null); setStep(staffMembers.length > 0 ? 2 : getDateStep()); }}
                      className={cn('flex w-full items-center justify-between rounded-lg border p-4 text-left transition-all', selectedService?.id === svc.id ? 'border-accent bg-secondary shadow-sm' : 'border-border hover:border-accent/50 hover:bg-muted/50')}>
                      <div>
                        <p className="font-medium">{svc.name}</p>
                        <p className="text-sm text-muted-foreground">{svc.description}</p>
                        <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground"><span className="flex items-center gap-1"><Clock className="h-3 w-3" />{svc.duration_minutes} {t('booking.min')}</span></div>
                      </div>
                      <span className="font-display text-lg font-bold">${svc.price}</span>
                    </button>
                  ))}
                </CardContent>
              </Card>
            )}

            {staffMembers.length > 0 && step >= 2 && (
              <Card className={cn('shadow-card', step !== 2 && 'opacity-60')}>
                <CardHeader><CardTitle className="font-display text-lg">{t('booking.selectStaff')}</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  <button onClick={() => { setSelectedStaff(null); setStep(getDateStep()); setSelectedSlot(null); }}
                    className={cn('flex w-full items-center gap-3 rounded-lg border p-4 text-left transition-all', selectedStaff === null && step > 2 ? 'border-accent bg-secondary shadow-sm' : 'border-border hover:border-accent/50 hover:bg-muted/50')}>
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted"><UserCog className="h-5 w-5 text-muted-foreground" /></div>
                    <div><p className="font-medium">{t('booking.anyStaff')}</p><p className="text-xs text-muted-foreground">{t('booking.anyStaffDesc')}</p></div>
                  </button>
                  {staffMembers.map(staff => (
                    <button key={staff.user_id} onClick={() => { setSelectedStaff(staff); setStep(getDateStep()); setSelectedSlot(null); }}
                      className={cn('flex w-full items-center gap-3 rounded-lg border p-4 text-left transition-all', selectedStaff?.user_id === staff.user_id ? 'border-accent bg-secondary shadow-sm' : 'border-border hover:border-accent/50 hover:bg-muted/50')}>
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent/10"><UserCog className="h-5 w-5 text-accent" /></div>
                      <div><p className="font-medium">{staff.full_name || staff.email}</p><p className="text-xs text-muted-foreground">{staff.email}</p></div>
                    </button>
                  ))}
                </CardContent>
              </Card>
            )}

            {step >= getDateStep() && (
              <div className="space-y-6">
                <Card className="shadow-card">
                  <CardHeader><CardTitle className="font-display text-lg">{t('booking.selectDate')}</CardTitle></CardHeader>
                  <CardContent>
                    <Calendar mode="single" selected={selectedDate} onSelect={(d) => { setSelectedDate(d); if (d) setStep(getTimeStep()); setSelectedSlot(null); }} disabled={isDateDisabled} className="pointer-events-auto" />
                  </CardContent>
                </Card>
                {step >= getTimeStep() && selectedDate && (
                  <Card className="shadow-card">
                    <CardHeader><CardTitle className="font-display text-lg">{t('booking.availableSlots')} — {format(selectedDate, 'MMM dd')}</CardTitle></CardHeader>
                    <CardContent>
                       {slots.length === 0 ? (
                        <p className="py-4 text-center text-sm text-muted-foreground">{t('booking.noSlots')}</p>
                      ) : (
                        <>
                          <SmartSlotRecommendation
                            availableSlots={slots}
                            serviceName={selectedService?.name || ''}
                            dayOfWeek={selectedDate ? format(selectedDate, 'EEEE') : ''}
                            bookingPatterns={existingAppointments}
                            onSelectSlot={setSelectedSlot}
                            selectedSlot={selectedSlot}
                          />
                          <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 mt-3">
                            {slots.map(slot => (
                              <button key={slot} onClick={() => setSelectedSlot(slot)}
                                className={cn('rounded-lg border px-3 py-2 text-sm font-medium transition-all', selectedSlot === slot ? 'border-accent bg-accent text-accent-foreground' : 'border-border hover:border-accent/50 hover:bg-muted/50')}>
                                {slot}
                              </button>
                            ))}
                          </div>
                        </>
                      )}
                      {selectedSlot && (
                        <Button onClick={handleBook} className="mt-4 w-full" disabled={booking}>
                          {booking && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}{t('common.confirmBooking')}
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
