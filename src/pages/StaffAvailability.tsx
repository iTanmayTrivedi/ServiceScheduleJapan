import { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { MOCK_STAFF_AVAILABILITY } from '@/data/mockData';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface AvailabilityRow {
  id?: string;
  staff_id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  is_available: boolean;
}

export default function StaffAvailability() {
  const { user, isDemoMode } = useAuth();
  const { toast } = useToast();
  const { t } = useTranslation();
  const [availability, setAvailability] = useState<AvailabilityRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;

    if (isDemoMode) {
      const mine = MOCK_STAFF_AVAILABILITY.filter(a => a.staff_id === user.id);
      if (mine.length > 0) {
        setAvailability(mine as any);
      } else {
        setAvailability(Array.from({ length: 7 }, (_, i) => ({
          staff_id: user.id, day_of_week: i, start_time: '09:00', end_time: '17:00', is_available: i >= 1 && i <= 5,
        })));
      }
      setLoading(false);
      return;
    }

    const fetch = async () => {
      const { data } = await supabase.from('staff_availability').select('*').eq('staff_id', user.id).order('day_of_week');
      if (data && data.length > 0) {
        setAvailability(data as any);
      } else {
        setAvailability(Array.from({ length: 7 }, (_, i) => ({
          staff_id: user.id, day_of_week: i, start_time: '09:00', end_time: '17:00', is_available: i >= 1 && i <= 5,
        })));
      }
      setLoading(false);
    };
    fetch();
  }, [user, isDemoMode]);

  const updateRow = (dayOfWeek: number, field: keyof AvailabilityRow, value: any) => {
    setAvailability(prev => prev.map(row => row.day_of_week === dayOfWeek ? { ...row, [field]: value } : row));
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);

    if (isDemoMode) {
      toast({ title: t('staff.availabilityUpdated') });
      setSaving(false);
      return;
    }

    for (const row of availability) {
      if (row.id) {
        await supabase.from('staff_availability').update({ start_time: row.start_time, end_time: row.end_time, is_available: row.is_available }).eq('id', row.id);
      } else {
        const { data } = await supabase.from('staff_availability').insert({ staff_id: user.id, day_of_week: row.day_of_week, start_time: row.start_time, end_time: row.end_time, is_available: row.is_available }).select().single();
        if (data) setAvailability(prev => prev.map(r => r.day_of_week === row.day_of_week ? { ...r, id: data.id } : r));
      }
    }
    toast({ title: t('staff.availabilityUpdated') });
    setSaving(false);
  };

  return (
    <DashboardLayout>
      <div className="animate-fade-in space-y-6">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight">{t('staff.availabilityTitle')}</h1>
          <p className="text-muted-foreground">{t('staff.availabilitySubtitle')}</p>
        </div>
        <Card className="shadow-card">
          <CardHeader><CardTitle className="font-display text-lg">{t('staff.weeklySchedule')}</CardTitle></CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-sm text-muted-foreground">{t('common.loading')}</p>
            ) : (
              <div className="space-y-4">
                {availability.map(row => (
                  <div key={row.day_of_week} className="flex items-center gap-4 rounded-lg border border-border p-4">
                    <div className="w-28"><p className="font-medium">{t(`days.${row.day_of_week}`)}</p></div>
                    <Switch checked={row.is_available} onCheckedChange={(val) => updateRow(row.day_of_week, 'is_available', val)} />
                    <span className="text-sm text-muted-foreground w-16">{row.is_available ? t('common.open') : t('common.closed')}</span>
                    {row.is_available && (
                      <>
                        <Input type="time" value={row.start_time} onChange={(e) => updateRow(row.day_of_week, 'start_time', e.target.value)} className="w-32" />
                        <span className="text-muted-foreground">{t('common.to')}</span>
                        <Input type="time" value={row.end_time} onChange={(e) => updateRow(row.day_of_week, 'end_time', e.target.value)} className="w-32" />
                      </>
                    )}
                  </div>
                ))}
                <Button onClick={handleSave} disabled={saving} className="mt-4">
                  {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {t('common.save')}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
