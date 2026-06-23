import { useEffect, useState, useRef } from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { StarRating } from '@/components/StarRating';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from 'react-i18next';
import { LoyaltyCard } from '@/components/LoyaltyCard';
import {
  CalendarDays, CheckCircle2, Star, Clock, TrendingUp, Edit2, Save, X,
  Mail, Phone, Shield, Briefcase, UserCog, User, Award, Sparkles, Camera, Loader2, ImagePlus
} from 'lucide-react';
import { format } from 'date-fns';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

const roleConfig = {
  admin: { icon: Shield, label: 'profile.systemAdmin', badgeClass: 'bg-primary text-primary-foreground' },
  staff: { icon: UserCog, label: 'roles.staff', badgeClass: 'bg-accent text-accent-foreground' },
  customer: { icon: User, label: 'roles.customer', badgeClass: 'bg-secondary text-secondary-foreground' },
};

export default function Profile() {
  const { user, isDemoMode, isAdmin, isStaff } = useAuth();
  const { toast } = useToast();
  const { t } = useTranslation();
  const [editing, setEditing] = useState(false);
  const [fullName, setFullName] = useState(user?.full_name || '');
  const [phone, setPhone] = useState('');
  const [saving, setSaving] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [bannerUrl, setBannerUrl] = useState<string | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [uploadingBanner, setUploadingBanner] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);
  const [stats, setStats] = useState({ total: 0, completed: 0, cancelled: 0, noShow: 0, upcoming: 0 });
  const [ratings, setRatings] = useState<any[]>([]);

  const role = user?.role || 'customer';
  const config = roleConfig[role] || roleConfig.customer;
  const RoleIcon = config.icon;

  useEffect(() => {
    if (!user) return;

    if (isDemoMode) {
      setFullName(user.full_name);
      if (isAdmin) {
        setStats({ total: 12, completed: 8, cancelled: 2, noShow: 1, upcoming: 3 });
      } else if (isStaff) {
        setStats({ total: 8, completed: 5, cancelled: 1, noShow: 0, upcoming: 2 });
      } else {
        setStats({ total: 4, completed: 1, cancelled: 1, noShow: 0, upcoming: 2 });
      }
      setRatings([{ id: '1', rating: 5, comment: 'Excellent service!', created_at: new Date().toISOString() }]);
      return;
    }

    const fetchProfile = async () => {
      const { data: profile } = await supabase.from('profiles').select('full_name, phone, avatar_url, banner_url').eq('user_id', user.id).maybeSingle();
      if (profile) {
        setFullName(profile.full_name || '');
        setPhone(profile.phone || '');
        if (profile.avatar_url) setAvatarUrl(profile.avatar_url);
        if ((profile as any).banner_url) setBannerUrl((profile as any).banner_url);
      }
    };

    const fetchStats = async () => {
      const query = isAdmin
        ? supabase.from('appointments').select('status, appointment_date')
        : supabase.from('appointments').select('status, appointment_date').eq(isStaff ? 'staff_id' : 'user_id', user.id);
      const { data: apts } = await query;
      if (apts) {
        const today = format(new Date(), 'yyyy-MM-dd');
        setStats({
          total: apts.length,
          completed: apts.filter(a => a.status === 'completed').length,
          cancelled: apts.filter(a => a.status === 'cancelled').length,
          noShow: apts.filter(a => a.status === 'no_show').length,
          upcoming: apts.filter(a => ['pending', 'confirmed'].includes(a.status) && a.appointment_date >= today).length,
        });
      }
    };

    const fetchRatings = async () => {
      const { data } = await supabase.from('ratings').select('*').eq('user_id', user.id).order('created_at', { ascending: false });
      setRatings(data || []);
    };

    fetchProfile();
    fetchStats();
    fetchRatings();
  }, [user, isDemoMode, isAdmin, isStaff]);

  const handleSave = async () => {
    if (!user) return;
    if (isDemoMode) { toast({ title: t('profile.updated') }); setEditing(false); return; }
    setSaving(true);
    try {
      const { error } = await supabase.from('profiles').update({ full_name: fullName.trim(), phone: phone.trim() }).eq('user_id', user.id);
      if (error) throw error;
      toast({ title: t('profile.updated') });
      setEditing(false);
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    if (!file.type.startsWith('image/')) {
      toast({ title: 'Error', description: 'Please select an image file.', variant: 'destructive' });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: 'Error', description: 'Image must be under 5MB.', variant: 'destructive' });
      return;
    }
    if (isDemoMode) {
      setAvatarUrl(URL.createObjectURL(file));
      toast({ title: t('profile.updated') });
      return;
    }
    setUploadingAvatar(true);
    try {
      const ext = file.name.split('.').pop();
      const path = `${user.id}/avatar.${ext}`;
      const { error: uploadErr } = await supabase.storage.from('avatars').upload(path, file, { upsert: true });
      if (uploadErr) throw uploadErr;
      const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(path);
      const publicUrl = `${urlData.publicUrl}?t=${Date.now()}`;
      const { error: updateErr } = await supabase.from('profiles').update({ avatar_url: publicUrl } as any).eq('user_id', user.id);
      if (updateErr) throw updateErr;
      setAvatarUrl(publicUrl);
      toast({ title: t('profile.updated') });
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setUploadingAvatar(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleBannerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    if (!file.type.startsWith('image/')) {
      toast({ title: 'Error', description: 'Please select an image file.', variant: 'destructive' });
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast({ title: 'Error', description: 'Banner image must be under 10MB.', variant: 'destructive' });
      return;
    }
    if (isDemoMode) {
      setBannerUrl(URL.createObjectURL(file));
      toast({ title: t('profile.updated') });
      return;
    }
    setUploadingBanner(true);
    try {
      const ext = file.name.split('.').pop();
      const path = `${user.id}/banner.${ext}`;
      const { error: uploadErr } = await supabase.storage.from('avatars').upload(path, file, { upsert: true });
      if (uploadErr) throw uploadErr;
      const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(path);
      const publicUrl = `${urlData.publicUrl}?t=${Date.now()}`;
      const { error: updateErr } = await supabase.from('profiles').update({ banner_url: publicUrl } as any).eq('user_id', user.id);
      if (updateErr) throw updateErr;
      setBannerUrl(publicUrl);
      toast({ title: t('profile.updated') });
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setUploadingBanner(false);
      if (bannerInputRef.current) bannerInputRef.current.value = '';
    }
  };

  const avgRating = ratings.length > 0 ? ratings.reduce((s, r) => s + r.rating, 0) / ratings.length : 0;
  const initials = (fullName || user?.email || '?').split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);

  const reliabilityScore = stats.total > 0
    ? Math.round(((stats.completed + stats.upcoming) / stats.total) * 100)
    : 100;

  const statItems = [
    { label: isAdmin ? t('profile.totalManaged') : t('profile.totalBookings'), value: stats.total, icon: CalendarDays },
    { label: t('dashboard.completed'), value: stats.completed, icon: CheckCircle2 },
    { label: t('dashboard.upcoming'), value: stats.upcoming, icon: Clock },
    { label: t('profile.reliability'), value: `${reliabilityScore}%`, icon: TrendingUp },
  ];

  return (
    <DashboardLayout>
      <div className="animate-fade-in space-y-6 max-w-4xl mx-auto">

        {/* Profile Header */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
          <Card className="shadow-card overflow-hidden border-0">
            {/* Banner with upload */}
            <div
              className="relative h-40 sm:h-48 overflow-hidden group cursor-pointer"
              onClick={() => bannerInputRef.current?.click()}
              style={{
                background: bannerUrl
                  ? `url(${bannerUrl}) center/cover no-repeat`
                  : undefined,
              }}
            >
              {!bannerUrl && (
                <div className="absolute inset-0 gradient-hero" />
              )}
              <div className="absolute inset-0 opacity-20" style={{
                backgroundImage: `radial-gradient(circle at 20% 50%, hsl(var(--accent) / 0.3) 0%, transparent 50%), 
                                  radial-gradient(circle at 80% 30%, hsl(var(--primary) / 0.2) 0%, transparent 50%)`
              }} />
              <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-card to-transparent" />
              
              {/* Banner upload overlay */}
              <div className="absolute inset-0 flex items-center justify-center bg-foreground/0 group-hover:bg-foreground/30 transition-all duration-200">
                {uploadingBanner ? (
                  <Loader2 className="h-8 w-8 text-primary-foreground animate-spin" />
                ) : (
                  <div className="flex items-center gap-2 rounded-full bg-background/80 px-4 py-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 shadow-lg">
                    <ImagePlus className="h-4 w-4 text-foreground" />
                    <span className="text-sm font-medium text-foreground">Change Cover</span>
                  </div>
                )}
              </div>
              <input ref={bannerInputRef} type="file" accept="image/*" className="hidden" onChange={handleBannerUpload} />
            </div>

            <CardContent className="relative -mt-16 px-6 pb-6">
              <div className="flex flex-col sm:flex-row gap-5">
                {/* Avatar */}
                <div className="relative shrink-0 group">
                  <Avatar className="h-28 w-28 border-4 border-card shadow-xl">
                    {avatarUrl && <AvatarImage src={avatarUrl} alt={fullName} className="object-cover" />}
                    <AvatarFallback className="bg-accent text-accent-foreground text-3xl font-bold font-display">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingAvatar}
                    className="absolute inset-0 flex items-center justify-center rounded-full bg-foreground/0 group-hover:bg-foreground/40 transition-all duration-200 cursor-pointer"
                  >
                    {uploadingAvatar ? (
                      <Loader2 className="h-6 w-6 text-primary-foreground animate-spin" />
                    ) : (
                      <Camera className="h-6 w-6 text-primary-foreground opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                    )}
                  </button>
                  <div className="absolute -bottom-1 -right-1 h-7 w-7 rounded-full bg-success border-[3px] border-card" />
                </div>

                {/* Info area */}
                <div className="flex-1 pt-1 sm:pt-6 min-w-0">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-3 flex-wrap">
                        <h1 className="font-display text-2xl font-bold tracking-tight">{fullName || user?.email}</h1>
                        <span className={cn('inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-wider', config.badgeClass)}>
                          <RoleIcon className="h-3 w-3" />
                          {t(config.label)}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1.5">
                          <Mail className="h-3.5 w-3.5 text-accent" />
                          {user?.email}
                        </span>
                        {phone && (
                          <span className="flex items-center gap-1.5">
                            <Phone className="h-3.5 w-3.5 text-accent" />
                            {phone}
                          </span>
                        )}
                        {isAdmin && (
                          <span className="flex items-center gap-1.5">
                            <Briefcase className="h-3.5 w-3.5 text-accent" />
                            {t('profile.systemAdmin')}
                          </span>
                        )}
                      </div>
                    </div>

                    {!editing && (
                      <Button size="sm" variant="outline" className="gap-1.5 h-9 self-start shrink-0" onClick={() => setEditing(true)}>
                        <Edit2 className="h-3.5 w-3.5" />
                        {t('profile.editProfile')}
                      </Button>
                    )}
                  </div>

                  {/* Inline Edit Form */}
                  {editing && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                      className="mt-4 rounded-xl border border-border bg-muted/40 p-5"
                    >
                      <p className="text-sm font-semibold mb-4 flex items-center gap-2">
                        <Edit2 className="h-4 w-4 text-accent" />
                        {t('profile.editInfo')}
                      </p>
                      <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-2">
                          <Label className="text-xs font-medium">{t('common.fullName')}</Label>
                          <Input value={fullName} onChange={e => setFullName(e.target.value)} maxLength={100} className="h-10" />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-xs font-medium">{t('profile.phone')}</Label>
                          <Input value={phone} onChange={e => setPhone(e.target.value)} placeholder="+81 XX-XXXX-XXXX" maxLength={20} className="h-10" />
                        </div>
                      </div>
                      <div className="flex gap-2 mt-4">
                        <Button size="sm" onClick={handleSave} disabled={saving} className="gap-1.5 h-9">
                          <Save className="h-3.5 w-3.5" />{saving ? t('common.loading') : t('common.save')}
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => setEditing(false)} className="gap-1.5 h-9">
                          <X className="h-3.5 w-3.5" />{t('common.cancel')}
                        </Button>
                      </div>
                    </motion.div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Stats Row */}
        <div className="grid gap-3 grid-cols-2 md:grid-cols-4">
          {statItems.map((item, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.05 * i }}>
              <Card className="shadow-card border-0 group hover:shadow-card-hover transition-all duration-200 hover:-translate-y-0.5">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent/10">
                      <item.icon className="h-4 w-4 text-accent" />
                    </div>
                    <Sparkles className="h-3 w-3 text-muted-foreground/30 group-hover:text-accent/50 transition-colors" />
                  </div>
                  <p className="text-2xl font-bold font-display leading-none">{item.value}</p>
                  <p className="text-[11px] text-muted-foreground mt-1">{item.label}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Loyalty — customers only */}
        {!isAdmin && !isStaff && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.25 }}>
            <LoyaltyCard stats={stats} ratingsCount={ratings.length} avgRating={avgRating} />
          </motion.div>
        )}

        {/* Ratings & Reviews */}
        <div className="grid gap-4 lg:grid-cols-2">
          {/* Rating Summary */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.3 }}>
            <Card className="shadow-card border-0 h-full">
              <CardHeader className="pb-2">
                <CardTitle className="font-display text-base flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-warning/10">
                    <Star className="h-4 w-4 text-warning" />
                  </div>
                  {t('profile.ratingSummary')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {ratings.length === 0 ? (
                  <div className="py-10 text-center">
                    <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-muted">
                      <Star className="h-7 w-7 text-muted-foreground/20" />
                    </div>
                    <p className="text-sm font-medium text-muted-foreground">{t('profile.noRatings')}</p>
                    <p className="mt-1 text-xs text-muted-foreground/50">{t('profile.noRatingsHint')}</p>
                  </div>
                ) : (
                  <div className="space-y-5">
                    <div className="flex items-center gap-4">
                      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-warning/20 to-warning/5">
                        <p className="text-3xl font-bold font-display">{avgRating.toFixed(1)}</p>
                      </div>
                      <div>
                        <StarRating rating={Math.round(avgRating)} size="md" />
                        <p className="text-xs text-muted-foreground mt-1.5">{t('profile.basedOn', { count: ratings.length })}</p>
                      </div>
                    </div>
                    <Separator />
                    <div className="space-y-2.5">
                      {[5, 4, 3, 2, 1].map(star => {
                        const count = ratings.filter(r => r.rating === star).length;
                        const pct = ratings.length > 0 ? (count / ratings.length) * 100 : 0;
                        return (
                          <div key={star} className="flex items-center gap-2.5 text-xs">
                            <span className="w-3 font-semibold text-muted-foreground">{star}</span>
                            <Star className="h-3 w-3 fill-warning text-warning" />
                            <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${pct}%` }}
                                transition={{ duration: 0.5, delay: 0.4 + star * 0.04 }}
                                className="h-full rounded-full bg-warning"
                              />
                            </div>
                            <span className="w-5 text-right text-muted-foreground/70 font-medium">{count}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Recent Reviews */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.35 }}>
            <Card className="shadow-card border-0 h-full">
              <CardHeader className="pb-2">
                <CardTitle className="font-display text-base flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent/10">
                    <Award className="h-4 w-4 text-accent" />
                  </div>
                  {t('profile.recentReviews')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {ratings.length === 0 ? (
                  <div className="py-10 text-center">
                    <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-muted">
                      <CheckCircle2 className="h-7 w-7 text-muted-foreground/20" />
                    </div>
                    <p className="text-sm font-medium text-muted-foreground">{t('profile.noReviews')}</p>
                    <p className="mt-1 text-xs text-muted-foreground/50">{t('profile.noReviewsHint')}</p>
                  </div>
                ) : (
                  <div className="space-y-2.5 max-h-[320px] overflow-y-auto pr-1">
                    {ratings.slice(0, 10).map((r, i) => (
                      <motion.div
                        key={r.id || i}
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.25, delay: i * 0.04 }}
                        className="rounded-lg border border-border p-3.5 transition-all duration-150 hover:bg-muted/30 hover:border-accent/20"
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <StarRating rating={r.rating} />
                          <span className="text-[10px] text-muted-foreground/50 font-medium">{format(new Date(r.created_at), 'MMM dd, yyyy')}</span>
                        </div>
                        {r.comment && <p className="text-sm text-muted-foreground leading-relaxed">{r.comment}</p>}
                      </motion.div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </DashboardLayout>
  );
}
