import { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { MOCK_BUSINESS_HOURS } from '@/data/mockData';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { Save } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function AdminBusinessHours() {
  const { toast } = useToast();
  const { t } = useTranslation();
  const { isDemoMode } = useAuth();
  const [hours, setHours] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isDemoMode) {
      setHours(MOCK_BUSINESS_HOURS);
      setLoading(false);
      return;
    }
    const fetch = async () => {
      const { data } = await supabase.from('business_hours').select('*').order('day_of_week');
      setHours(data || []);
      setLoading(false);
    };
    fetch();
  }, [isDemoMode]);

  const updateHour = (index: number, field: string, value: any) => {
    const updated = [...hours];
    updated[index] = { ...updated[index], [field]: value };
    setHours(updated);
  };

  const handleSave = async () => {
    setSaving(true);
    if (isDemoMode) {
      toast({ title: t('businessHours.updated') });
      setSaving(false);
      return;
    }
    for (const h of hours) {
      await supabase.from('business_hours').update({ start_time: h.start_time, end_time: h.end_time, is_open: h.is_open }).eq('id', h.id);
    }
    toast({ title: t('businessHours.updated') });
    setSaving(false);
  };

  return (
    <DashboardLayout>
      <div className="animate-fade-in space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-3xl font-bold tracking-tight">{t('businessHours.title')}</h1>
            <p className="text-muted-foreground">{t('businessHours.subtitle')}</p>
          </div>
          <Button onClick={handleSave} disabled={saving} className="gap-2"><Save className="h-4 w-4" /> {t('common.save')}</Button>
        </div>
        <Card className="shadow-card">
          <CardContent className="p-0">
            {loading ? (
              <p className="p-6 text-sm text-muted-foreground">{t('common.loading')}</p>
            ) : (
              <div className="divide-y divide-border">
                {hours.map((h, i) => (
                  <div key={h.id} className="flex items-center gap-6 p-4">
                    <div className="w-28"><p className="font-medium">{t(`days.${h.day_of_week}`)}</p></div>
                    <Switch checked={h.is_open} onCheckedChange={(v) => updateHour(i, 'is_open', v)} />
                    <span className="text-sm text-muted-foreground w-12">{h.is_open ? t('common.open') : t('common.closed')}</span>
                    {h.is_open && (
                      <div className="flex items-center gap-2">
                        <Input type="time" value={h.start_time?.slice(0, 5)} onChange={e => updateHour(i, 'start_time', e.target.value)} className="w-32" />
                        <span className="text-muted-foreground">{t('common.to')}</span>
                        <Input type="time" value={h.end_time?.slice(0, 5)} onChange={e => updateHour(i, 'end_time', e.target.value)} className="w-32" />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
