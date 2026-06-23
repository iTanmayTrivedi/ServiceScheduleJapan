import { useAuth } from '@/hooks/useAuth';
import { Navigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { DarkModeToggle } from '@/components/DarkModeToggle';
import { CalendarDays, ArrowRight, Clock, Shield, Zap, Loader2, Users, Star, BarChart3 } from 'lucide-react';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { motion, useInView } from 'framer-motion';
import { useRef, useEffect, useState } from 'react';

function AnimatedCounter({ target, suffix = '', duration = 2000 }: { target: number; suffix?: string; duration?: number }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });

  useEffect(() => {
    if (!inView) return;
    let start = 0;
    const step = target / (duration / 16);
    const timer = setInterval(() => {
      start += step;
      if (start >= target) { setCount(target); clearInterval(timer); }
      else setCount(Math.floor(start));
    }, 16);
    return () => clearInterval(timer);
  }, [inView, target, duration]);

  return <span ref={ref}>{count.toLocaleString()}{suffix}</span>;
}

export default function Index() {
  const { user, isLoading, isAdmin, isStaff } = useAuth();
  const { t } = useTranslation();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-accent" />
      </div>
    );
  }
  if (user) return <Navigate to={isAdmin ? '/admin' : isStaff ? '/staff' : '/dashboard'} replace />;

  const features = [
    { icon: Clock, title: t('landing.smartScheduling'), desc: t('landing.smartSchedulingDesc') },
    { icon: Shield, title: t('landing.roleAccess'), desc: t('landing.roleAccessDesc') },
    { icon: Zap, title: t('landing.instantUpdates'), desc: t('landing.instantUpdatesDesc') },
  ];

  const stats = [
    { value: 12500, suffix: '+', label: t('landing.statBookings'), icon: CalendarDays },
    { value: 480, suffix: '+', label: t('landing.statBusinesses'), icon: Users },
    { value: 4.9, suffix: '', label: t('landing.statRating'), icon: Star },
    { value: 99.9, suffix: '%', label: t('landing.statUptime'), icon: BarChart3 },
  ];

  return (
    <div className="min-h-screen bg-background">
      <nav className="flex items-center justify-between px-6 py-4 lg:px-12">
        <div className="flex items-center gap-2">
          <CalendarDays className="h-7 w-7 text-accent" />
          <span className="font-display text-xl font-bold tracking-tight">BookFlow</span>
        </div>
        <div className="flex items-center gap-3">
          <DarkModeToggle />
          <LanguageSwitcher />
          <Link to="/auth">
            <Button variant="outline" className="gap-2">
              {t('common.signIn')} <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </nav>

      <section className="relative overflow-hidden px-6 py-24 lg:px-12 lg:py-36">
        <div className="absolute inset-0 gradient-hero opacity-5" />
        <div className="relative mx-auto max-w-4xl text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <span className="inline-block rounded-full bg-secondary px-4 py-1.5 text-sm font-medium text-secondary-foreground">
              {t('landing.tagline')}
            </span>
            <h1 className="mt-6 font-display text-5xl font-bold tracking-tight lg:text-7xl">
              {t('landing.heroTitle1')}
              <span className="text-accent">{t('landing.heroTitle2')}</span>
              <br />{t('landing.heroTitle3')}
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
              {t('landing.heroDesc')}
            </p>
            <div className="mt-8 flex items-center justify-center gap-4">
              <Link to="/auth">
                <Button size="lg" className="gap-2 text-base">
                  {t('landing.getStarted')} <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Social Proof Stats */}
      <section className="border-y border-border bg-muted/30 px-6 py-16 lg:px-12">
        <div className="mx-auto max-w-5xl">
          <div className="grid gap-8 grid-cols-2 md:grid-cols-4">
            {stats.map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.5 }}
                className="text-center"
              >
                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-accent/10">
                  <stat.icon className="h-6 w-6 text-accent" />
                </div>
                <p className="font-display text-3xl font-bold tracking-tight lg:text-4xl">
                  <AnimatedCounter target={stat.value} suffix={stat.suffix} />
                </p>
                <p className="mt-1 text-sm text-muted-foreground">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-6 py-20 lg:px-12">
        <div className="mx-auto max-w-5xl">
          <div className="grid gap-8 md:grid-cols-3">
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2 + i * 0.1, duration: 0.5 }}
                className="rounded-xl border border-border bg-card p-6 shadow-card transition-shadow hover:shadow-card-hover"
              >
                <div className="mb-4 inline-flex rounded-lg bg-secondary p-3">
                  <f.icon className="h-6 w-6 text-accent" />
                </div>
                <h3 className="font-display text-lg font-semibold">{f.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <footer className="border-t border-border px-6 py-8 text-center text-sm text-muted-foreground">
        <p>{t('common.copyright')}</p>
      </footer>
    </div>
  );
}
