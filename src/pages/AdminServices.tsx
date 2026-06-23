import { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { MOCK_SERVICES } from '@/data/mockData';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Plus, Pencil, Trash2, Clock, Briefcase } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger
} from '@/components/ui/alert-dialog';

export default function AdminServices() {
  const { toast } = useToast();
  const { t } = useTranslation();
  const { isDemoMode } = useAuth();
  const [services, setServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<any | null>(null);
  const [form, setForm] = useState({ name: '', description: '', duration_minutes: 30, price: 0, is_active: true });

  const fetchServices = async () => {
    if (isDemoMode) {
      setServices(MOCK_SERVICES);
      setLoading(false);
      return;
    }
    const { data } = await supabase.from('services').select('*').order('created_at');
    setServices(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchServices(); }, [isDemoMode]);

  const openCreate = () => { setEditing(null); setForm({ name: '', description: '', duration_minutes: 30, price: 0, is_active: true }); setDialogOpen(true); };
  const openEdit = (svc: any) => { setEditing(svc); setForm({ name: svc.name, description: svc.description || '', duration_minutes: svc.duration_minutes, price: svc.price, is_active: svc.is_active }); setDialogOpen(true); };

  const handleSave = async () => {
    if (isDemoMode) {
      if (editing) {
        setServices(prev => prev.map(s => s.id === editing.id ? { ...s, ...form } : s));
        toast({ title: t('services.serviceUpdated') });
      } else {
        setServices(prev => [...prev, { id: `svc-${Date.now()}`, ...form, created_at: new Date().toISOString(), updated_at: new Date().toISOString() }]);
        toast({ title: t('services.serviceCreated') });
      }
      setDialogOpen(false);
      return;
    }
    if (editing) {
      const { error } = await supabase.from('services').update(form).eq('id', editing.id);
      if (error) { toast({ title: 'Error', description: error.message, variant: 'destructive' }); return; }
      toast({ title: t('services.serviceUpdated') });
    } else {
      const { error } = await supabase.from('services').insert(form);
      if (error) { toast({ title: 'Error', description: error.message, variant: 'destructive' }); return; }
      toast({ title: t('services.serviceCreated') });
    }
    setDialogOpen(false);
    fetchServices();
  };

  const handleDelete = async (id: string) => {
    if (isDemoMode) {
      setServices(prev => prev.filter(s => s.id !== id));
      toast({ title: t('services.serviceDeleted') });
      return;
    }
    const { error } = await supabase.from('services').delete().eq('id', id);
    if (error) toast({ title: 'Error', description: error.message, variant: 'destructive' });
    else { toast({ title: t('services.serviceDeleted') }); fetchServices(); }
  };

  return (
    <DashboardLayout>
      <div className="animate-fade-in space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-3xl font-bold tracking-tight">{t('services.title')}</h1>
            <p className="text-muted-foreground">{t('services.subtitle')}</p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={openCreate} className="gap-2"><Plus className="h-4 w-4" /> {t('services.addService')}</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle className="font-display">{editing ? t('services.editService') : t('services.newService')}</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2"><Label>{t('services.name')}</Label><Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder={t('services.namePlaceholder')} /></div>
                <div className="space-y-2"><Label>{t('services.description')}</Label><Textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder={t('services.descPlaceholder')} /></div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2"><Label>{t('services.duration')}</Label><Input type="number" value={form.duration_minutes} onChange={e => setForm({ ...form, duration_minutes: Number(e.target.value) })} /></div>
                  <div className="space-y-2"><Label>{t('services.price')}</Label><Input type="number" step="0.01" value={form.price} onChange={e => setForm({ ...form, price: Number(e.target.value) })} /></div>
                </div>
                <div className="flex items-center gap-2"><Switch checked={form.is_active} onCheckedChange={v => setForm({ ...form, is_active: v })} /><Label>{t('common.active')}</Label></div>
                <Button onClick={handleSave} className="w-full">{editing ? t('common.update') : t('common.create')} {t('sidebar.services')}</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {loading ? (
            <p className="text-sm text-muted-foreground col-span-full">{t('common.loading')}</p>
          ) : services.length === 0 ? (
            <div className="col-span-full py-12 text-center"><Briefcase className="mx-auto mb-3 h-10 w-10 text-muted-foreground/40" /><p className="text-muted-foreground">{t('services.noServices')}</p></div>
          ) : (
            services.map(svc => (
              <Card key={svc.id} className="shadow-card transition-shadow hover:shadow-card-hover">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between">
                    <div><h3 className="font-display font-semibold">{svc.name}</h3><p className="mt-1 text-sm text-muted-foreground line-clamp-2">{svc.description}</p></div>
                    {!svc.is_active && <span className="rounded bg-muted px-2 py-0.5 text-xs text-muted-foreground">{t('common.inactive')}</span>}
                  </div>
                  <div className="mt-3 flex items-center gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" />{svc.duration_minutes} {t('booking.min')}</span>
                    <span className="font-display font-bold text-foreground">${svc.price}</span>
                  </div>
                  <div className="mt-4 flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => openEdit(svc)} className="gap-1"><Pencil className="h-3 w-3" /> {t('common.edit')}</Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild><Button variant="outline" size="sm" className="gap-1 text-destructive border-destructive/30 hover:bg-destructive/10"><Trash2 className="h-3 w-3" /> {t('common.delete')}</Button></AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader><AlertDialogTitle>{t('services.deleteConfirm', { name: svc.name })}</AlertDialogTitle><AlertDialogDescription>{t('services.deleteWarning')}</AlertDialogDescription></AlertDialogHeader>
                        <AlertDialogFooter><AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel><AlertDialogAction onClick={() => handleDelete(svc.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">{t('common.delete')}</AlertDialogAction></AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
