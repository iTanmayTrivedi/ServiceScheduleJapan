import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import {
  Trophy, Gem, Flame, Target, Award, Crown,
  Zap, Heart, Calendar, Star, Shield, Sparkles
} from 'lucide-react';

interface LoyaltyCardProps {
  stats: { total: number; completed: number; cancelled: number; noShow: number; upcoming: number };
  ratingsCount: number;
  avgRating: number;
}

interface AchievementDef {
  id: string;
  icon: React.ElementType;
  labelKey: string;
  descKey: string;
  check: (s: LoyaltyCardProps) => boolean;
  points: number;
  tier: 'bronze' | 'silver' | 'gold' | 'platinum';
}

const tierStyles = {
  bronze: 'bg-[hsl(30,50%,92%)] text-[hsl(30,60%,35%)] border-[hsl(30,40%,82%)]',
  silver: 'bg-secondary text-secondary-foreground border-border',
  gold: 'bg-[hsl(45,80%,90%)] text-[hsl(45,70%,30%)] border-[hsl(45,60%,78%)]',
  platinum: 'bg-accent/10 text-accent border-accent/20',
};

const tierGlow = {
  bronze: '',
  silver: '',
  gold: 'shadow-[0_0_12px_hsl(45,80%,60%,0.15)]',
  platinum: 'shadow-[0_0_16px_hsl(175,70%,42%,0.2)]',
};

const ACHIEVEMENTS: AchievementDef[] = [
  { id: 'first_booking', icon: Calendar, labelKey: 'loyalty.firstBooking', descKey: 'loyalty.firstBookingDesc', check: s => s.stats.total >= 1, points: 50, tier: 'bronze' },
  { id: 'reliable', icon: Shield, labelKey: 'loyalty.reliable', descKey: 'loyalty.reliableDesc', check: s => s.stats.completed >= 3 && s.stats.noShow === 0, points: 100, tier: 'silver' },
  { id: 'regular', icon: Flame, labelKey: 'loyalty.regular', descKey: 'loyalty.regularDesc', check: s => s.stats.completed >= 5, points: 150, tier: 'silver' },
  { id: 'reviewer', icon: Star, labelKey: 'loyalty.reviewer', descKey: 'loyalty.reviewerDesc', check: s => s.ratingsCount >= 3, points: 100, tier: 'bronze' },
  { id: 'top_rated', icon: Heart, labelKey: 'loyalty.topRated', descKey: 'loyalty.topRatedDesc', check: s => s.ratingsCount >= 3 && s.avgRating >= 4.5, points: 200, tier: 'gold' },
  { id: 'loyal', icon: Gem, labelKey: 'loyalty.loyal', descKey: 'loyalty.loyalDesc', check: s => s.stats.completed >= 10, points: 300, tier: 'gold' },
  { id: 'vip', icon: Crown, labelKey: 'loyalty.vip', descKey: 'loyalty.vipDesc', check: s => s.stats.completed >= 20, points: 500, tier: 'platinum' },
  { id: 'perfectScore', icon: Zap, labelKey: 'loyalty.perfectScore', descKey: 'loyalty.perfectScoreDesc', check: s => s.ratingsCount >= 5 && s.avgRating === 5, points: 400, tier: 'platinum' },
];

const LEVELS = [
  { name: 'loyalty.levelBronze', min: 0, icon: Award, color: 'text-[hsl(30,60%,45%)]' },
  { name: 'loyalty.levelSilver', min: 200, icon: Target, color: 'text-muted-foreground' },
  { name: 'loyalty.levelGold', min: 500, icon: Trophy, color: 'text-[hsl(45,70%,45%)]' },
  { name: 'loyalty.levelPlatinum', min: 1000, icon: Crown, color: 'text-accent' },
];

export function LoyaltyCard({ stats, ratingsCount, avgRating }: LoyaltyCardProps) {
  const { t } = useTranslation();
  const props: LoyaltyCardProps = { stats, ratingsCount, avgRating };

  const { unlocked, locked, totalPoints, currentLevel, nextLevel, progressPct } = useMemo(() => {
    const unlocked = ACHIEVEMENTS.filter(a => a.check(props));
    const locked = ACHIEVEMENTS.filter(a => !a.check(props));
    const totalPoints = unlocked.reduce((s, a) => s + a.points, 0);

    let currentLevel = LEVELS[0];
    let nextLevel = LEVELS[1];
    for (let i = LEVELS.length - 1; i >= 0; i--) {
      if (totalPoints >= LEVELS[i].min) {
        currentLevel = LEVELS[i];
        nextLevel = LEVELS[i + 1] || null;
        break;
      }
    }

    const progressPct = nextLevel
      ? Math.min(100, ((totalPoints - currentLevel.min) / (nextLevel.min - currentLevel.min)) * 100)
      : 100;

    return { unlocked, locked, totalPoints, currentLevel, nextLevel, progressPct };
  }, [stats, ratingsCount, avgRating]);

  const LevelIcon = currentLevel.icon;

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.15 }}>
      <Card className="shadow-card">
        <CardHeader className="pb-3">
          <CardTitle className="font-display text-lg flex items-center gap-2">
            <Trophy className="h-5 w-5 text-accent" />
            {t('loyalty.title')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          {/* Level & Points Summary */}
          <div className="flex items-center gap-4 rounded-xl border border-border bg-muted/30 p-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-accent/10">
              <LevelIcon className={cn('h-7 w-7', currentLevel.color)} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-semibold">{t(currentLevel.name)}</span>
                <span className="text-xs font-bold text-accent">{totalPoints} {t('loyalty.pts')}</span>
              </div>
              <Progress value={progressPct} className="h-2" />
              {nextLevel && (
                <p className="text-[11px] text-muted-foreground mt-1">
                  {nextLevel.min - totalPoints} {t('loyalty.ptsToNext')} {t(nextLevel.name)}
                </p>
              )}
            </div>
          </div>

          <Separator />

          {/* Unlocked Achievements */}
          {unlocked.length > 0 && (
            <div className="space-y-2.5">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5 text-accent" />
                {t('loyalty.earned')} ({unlocked.length})
              </p>
              <div className="grid gap-2">
                {unlocked.map((a, i) => {
                  const Icon = a.icon;
                  return (
                    <motion.div
                      key={a.id}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.3, delay: i * 0.06 }}
                      className={cn(
                        'flex items-center gap-3 rounded-lg border p-3 transition-all hover:scale-[1.01]',
                        tierStyles[a.tier],
                        tierGlow[a.tier]
                      )}
                    >
                      <Icon className="h-5 w-5 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold leading-tight">{t(a.labelKey)}</p>
                        <p className="text-[11px] opacity-70 leading-tight">{t(a.descKey)}</p>
                      </div>
                      <Badge variant="secondary" className="shrink-0 text-[10px] px-1.5 py-0">
                        +{a.points}
                      </Badge>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Locked Achievements */}
          {locked.length > 0 && (
            <div className="space-y-2.5">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {t('loyalty.locked')} ({locked.length})
              </p>
              <div className="grid gap-2">
                {locked.map((a) => {
                  const Icon = a.icon;
                  return (
                    <div
                      key={a.id}
                      className="flex items-center gap-3 rounded-lg border border-border p-3 opacity-40"
                    >
                      <Icon className="h-5 w-5 shrink-0 text-muted-foreground" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium leading-tight text-muted-foreground">{t(a.labelKey)}</p>
                        <p className="text-[11px] text-muted-foreground/60 leading-tight">{t(a.descKey)}</p>
                      </div>
                      <Badge variant="outline" className="shrink-0 text-[10px] px-1.5 py-0">
                        +{a.points}
                      </Badge>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
