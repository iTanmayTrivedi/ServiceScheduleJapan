import { Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { User, Edit2, Shield, UserCog, CalendarDays, CheckCircle2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

const roleConfig = {
  admin: { icon: Shield, label: 'profile.systemAdmin', badgeClass: 'bg-primary text-primary-foreground' },
  staff: { icon: UserCog, label: 'roles.staff', badgeClass: 'bg-accent text-accent-foreground' },
  customer: { icon: User, label: 'roles.customer', badgeClass: 'bg-secondary text-secondary-foreground' },
};

export function ProfileCard() {
  const { user, isDemoMode, isAdmin, isStaff } = useAuth();
  const { t } = useTranslation();
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [bannerUrl, setBannerUrl] = useState<string | null>(null);
  const [stats, setStats] = useState({ total: 0, completed: 0 });

  const role = user?.role || 'customer';
  const config = roleConfig[role] || roleConfig.customer;
  const RoleIcon = config.icon;
  const initials = (user?.full_name || user?.email || '?').split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);

  useEffect(() => {
    if (!user) return;
    if (isDemoMode) {
      setStats({ total: isAdmin ? 12 : isStaff ? 8 : 4, completed: isAdmin ? 8 : isStaff ? 5 : 1 });
      return;
    }
    const fetchData = async () => {
      const { data: profile } = await supabase.from('profiles').select('avatar_url, banner_url').eq('user_id', user.id).maybeSingle();
      if (profile) {
        if (profile.avatar_url) setAvatarUrl(profile.avatar_url);
        if ((profile as any).banner_url) setBannerUrl((profile as any).banner_url);
      }
      const query = isAdmin
        ? supabase.from('appointments').select('status')
        : supabase.from('appointments').select('status').eq(isStaff ? 'staff_id' : 'user_id', user.id);
      const { data: apts } = await query;
      if (apts) {
        setStats({ total: apts.length, completed: apts.filter((a: any) => a.status === 'completed').length });
      }
    };
    fetchData();
  }, [user, isDemoMode, isAdmin, isStaff]);

  if (!user) return null;

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
      <Card className="shadow-card border-0 overflow-hidden">
        {/* Mini banner */}
        <div
          className="h-20 relative"
          style={{
            background: bannerUrl
              ? `url(${bannerUrl}) center/cover no-repeat`
              : 'linear-gradient(135deg, hsl(var(--primary)), hsl(var(--accent)))',
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-t from-card/80 to-transparent" />
        </div>

        <CardContent className="relative -mt-8 px-4 pb-4">
          <div className="flex items-end gap-3 mb-3">
            <Avatar className="h-14 w-14 border-3 border-card shadow-lg">
              {avatarUrl && <AvatarImage src={avatarUrl} alt={user.full_name} className="object-cover" />}
              <AvatarFallback className="bg-accent text-accent-foreground text-lg font-bold font-display">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <h3 className="font-display text-sm font-bold truncate">{user.full_name || user.email}</h3>
              <span className={cn('inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wider', config.badgeClass)}>
                <RoleIcon className="h-2.5 w-2.5" />
                {t(config.label)}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 mb-3">
            <div className="rounded-lg bg-muted/50 p-2 text-center">
              <div className="flex items-center justify-center gap-1 mb-0.5">
                <CalendarDays className="h-3 w-3 text-accent" />
              </div>
              <p className="text-lg font-bold font-display leading-none">{stats.total}</p>
              <p className="text-[9px] text-muted-foreground mt-0.5">{t('profile.totalBookings')}</p>
            </div>
            <div className="rounded-lg bg-muted/50 p-2 text-center">
              <div className="flex items-center justify-center gap-1 mb-0.5">
                <CheckCircle2 className="h-3 w-3 text-accent" />
              </div>
              <p className="text-lg font-bold font-display leading-none">{stats.completed}</p>
              <p className="text-[9px] text-muted-foreground mt-0.5">{t('dashboard.completed')}</p>
            </div>
          </div>

          <Link to="/profile">
            <Button variant="outline" size="sm" className="w-full gap-1.5 h-8 text-xs">
              <Edit2 className="h-3 w-3" />
              {t('profile.editProfile')}
            </Button>
          </Link>
        </CardContent>
      </Card>
    </motion.div>
  );
}
