import { useAuth, DEMO_USERS, type AuthMode } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Navigate } from 'react-router-dom';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CalendarDays, Loader2, Shield, UserCog, User, Settings } from 'lucide-react';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { useToast } from '@/hooks/use-toast';
import { motion } from 'framer-motion';
import AuthShowcase from '@/components/auth/AuthShowcase';

const roleIcons = { admin: Shield, staff: UserCog, customer: User };

export default function Auth() {
  const { user, isAdmin, isStaff, loginAs, authMode, setAuthMode, signIn, signUp } = useAuth();
  const { t } = useTranslation();
  const { toast } = useToast();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState<'customer' | 'admin' | 'staff'>('customer');
  const [loading, setLoading] = useState(false);
  const [forgotMode, setForgotMode] = useState(false);
  const [resetEmail, setResetEmail] = useState('');

  if (user) return <Navigate to={isAdmin ? '/admin' : isStaff ? '/staff' : '/dashboard'} replace />;

  const handleRealSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isLogin) {
        const { error } = await signIn(email, password);
        if (error) toast({ title: t('auth.loginFailed'), description: error.message, variant: 'destructive' });
      } else {
        const { error } = await signUp(email, password, fullName, role);
        if (error) toast({ title: t('auth.signupFailed'), description: error.message, variant: 'destructive' });
        else toast({ title: t('auth.accountCreated'), description: t('auth.checkEmail') });
      }
    } finally {
      setLoading(false);
    }
  };

  const inputClass = "h-11 rounded-xl border-[hsl(220,20%,18%)] bg-[hsl(220,25%,10%)] text-[hsl(210,20%,96%)] placeholder:text-[hsl(220,10%,40%)] focus-visible:ring-[hsl(175,70%,42%)] focus-visible:border-[hsl(175,70%,42%)]";

  return (
    <div className="flex min-h-screen bg-[hsl(220,25%,7%)]">
      {/* Left side — Form */}
      <div className="flex w-full flex-col justify-between p-6 sm:p-10 md:w-[420px] md:min-w-[420px] lg:w-[460px] lg:min-w-[460px]">
        {/* Logo */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[hsl(175,70%,42%)]">
              <CalendarDays className="h-5 w-5 text-white" />
            </div>
            <span className="font-display text-xl font-bold text-[hsl(210,20%,96%)]">BookFlow</span>
          </div>
          <LanguageSwitcher />
        </div>

        {/* Form */}
        <div className="mx-auto w-full max-w-[340px] flex-1 flex flex-col justify-center py-8">
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
            <h1 className="font-display text-3xl font-bold tracking-tight text-[hsl(210,20%,96%)] mb-1.5">
              {authMode === 'demo' ? 'Try it out' : isLogin ? t('auth.welcomeBack') : t('auth.createAccount')}
            </h1>
            <p className="text-[hsl(220,10%,50%)] text-sm mb-6">
              {authMode === 'demo' ? 'Select a demo account to explore' : isLogin ? t('auth.signInDesc') : t('auth.signUpDesc')}
            </p>
          </motion.div>

          {/* Mode toggle */}
          <div className="flex rounded-full border border-[hsl(220,20%,18%)] bg-[hsl(220,25%,10%)] p-1 mb-5 w-fit">
            {(['demo', 'real'] as const).map(mode => (
              <button
                key={mode}
                onClick={() => setAuthMode(mode)}
                className={`rounded-full px-4 py-1.5 text-xs font-medium transition-all ${
                  authMode === mode
                    ? 'bg-[hsl(175,70%,42%)] text-white shadow-lg'
                    : 'text-[hsl(220,10%,55%)] hover:text-[hsl(210,20%,80%)]'
                }`}
              >
                {mode === 'demo' ? 'Demo' : 'Sign In'}
              </button>
            ))}
          </div>

          {authMode === 'demo' ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-2">
              {DEMO_USERS.map((demoUser, i) => {
                const Icon = roleIcons[demoUser.role];
                return (
                  <motion.button
                    key={demoUser.id}
                    initial={{ opacity: 0, x: -16 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    onClick={() => loginAs(demoUser)}
                    className="flex w-full items-center gap-3 rounded-xl border border-[hsl(220,20%,18%)] bg-[hsl(220,25%,10%)] p-3 text-left transition-all hover:border-[hsl(175,70%,42%)/0.4] hover:bg-[hsl(220,25%,12%)] group"
                  >
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[hsl(220,20%,16%)] group-hover:bg-[hsl(175,70%,42%)/0.15] transition-colors">
                      <Icon className="h-4 w-4 text-[hsl(175,70%,42%)]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm text-[hsl(210,20%,96%)]">{demoUser.full_name}</p>
                      <p className="text-[11px] text-[hsl(220,10%,45%)] truncate">{demoUser.email}</p>
                    </div>
                    <span className="shrink-0 rounded-full bg-[hsl(220,20%,16%)] px-2 py-0.5 text-[10px] font-medium capitalize text-[hsl(175,70%,42%)]">
                      {demoUser.role}
                    </span>
                  </motion.button>
                );
              })}
            </motion.div>
          ) : (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <form onSubmit={handleRealSubmit} className="space-y-3.5">
                {!isLogin && (
                  <>
                    <div className="space-y-1.5">
                      <Label htmlFor="fullName" className="text-[hsl(210,20%,80%)] text-xs">{t('common.fullName')}</Label>
                      <Input id="fullName" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="John Doe" required className={inputClass} />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-[hsl(210,20%,80%)] text-xs">{t('roles.signUpAs')}</Label>
                      <div className="grid grid-cols-3 gap-2">
                        {(['customer', 'staff', 'admin'] as const).map((r) => {
                          const Icon = r === 'admin' ? Settings : r === 'staff' ? UserCog : CalendarDays;
                          return (
                            <button key={r} type="button" onClick={() => setRole(r)}
                              className={`flex flex-col items-center gap-1 rounded-xl border p-2.5 text-[11px] font-medium transition-all ${
                                role === r
                                  ? 'border-[hsl(175,70%,42%)] bg-[hsl(175,70%,42%)/0.1] text-[hsl(175,70%,42%)]'
                                  : 'border-[hsl(220,20%,18%)] text-[hsl(220,10%,50%)] hover:border-[hsl(220,10%,30%)]'
                              }`}
                            >
                              <Icon className="h-3.5 w-3.5" />
                              {t(`roles.${r}`)}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </>
                )}
                <div className="space-y-1.5">
                  <Label htmlFor="email" className="text-[hsl(210,20%,80%)] text-xs">{t('common.email')}</Label>
                  <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" required className={inputClass} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="password" className="text-[hsl(210,20%,80%)] text-xs">{t('common.password')}</Label>
                  <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required minLength={6} className={inputClass} />
                </div>
                <Button type="submit" className="w-full h-11 rounded-xl bg-[hsl(175,70%,42%)] text-white font-medium hover:bg-[hsl(175,70%,38%)] transition-colors" disabled={loading}>
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {isLogin ? t('common.signIn') : t('common.signUp')}
                </Button>
              </form>

              <div className="flex items-center gap-3 my-4">
                <div className="flex-1 h-px bg-[hsl(220,20%,16%)]" />
                <span className="text-[10px] text-[hsl(220,10%,35%)] uppercase tracking-widest">or</span>
                <div className="flex-1 h-px bg-[hsl(220,20%,16%)]" />
              </div>

              <button
                type="button"
                disabled={loading}
                onClick={async () => {
                  setLoading(true);
                  try {
                    const { error } = await supabase.auth.signInWithOAuth({
                      provider: 'google',
                      options: { redirectTo: `${window.location.origin}/` },
                    });
                    if (error) {
                      toast({ title: t('auth.loginFailed'), description: error.message || 'Google sign in failed', variant: 'destructive' });
                      setLoading(false);
                    }
                  } catch (err: any) {
                    toast({ title: t('auth.loginFailed'), description: err?.message || 'Google sign in failed', variant: 'destructive' });
                    setLoading(false);
                  }
                }}
                className="flex w-full items-center justify-center gap-2.5 h-11 rounded-xl border border-[hsl(220,20%,18%)] bg-[hsl(220,25%,10%)] text-[hsl(210,20%,96%)] text-sm font-medium hover:bg-[hsl(220,25%,12%)] hover:border-[hsl(220,20%,24%)] transition-colors disabled:opacity-50 mb-4"
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24" aria-hidden="true">
                  <path fill="#EA4335" d="M12 10.2v3.9h5.5c-.2 1.4-1.6 4.1-5.5 4.1-3.3 0-6-2.7-6-6.1s2.7-6.1 6-6.1c1.9 0 3.1.8 3.8 1.5l2.6-2.5C16.7 3.4 14.6 2.4 12 2.4 6.7 2.4 2.4 6.7 2.4 12s4.3 9.6 9.6 9.6c5.5 0 9.2-3.9 9.2-9.4 0-.6-.1-1.1-.2-1.6H12z"/>
                  <path fill="#4285F4" d="M21.2 10.6H12v3.9h5.5c-.3 1.4-1.7 4-5.5 4v3.1c5.5 0 9.2-3.9 9.2-9.4 0-.6-.1-1.1-.2-1.6z"/>
                  <path fill="#FBBC05" d="M5.4 14.3a6 6 0 010-4.6L2.7 7.6a9.6 9.6 0 000 8.8l2.7-2.1z"/>
                  <path fill="#34A853" d="M12 21.6c2.6 0 4.8-.9 6.4-2.3l-3.1-2.4c-.8.6-2 1-3.3 1-2.5 0-4.7-1.7-5.5-4l-2.7 2.1A9.6 9.6 0 0012 21.6z"/>
                </svg>
                Continue with Google
              </button>

              <div className="text-center space-y-2">
                {isLogin && !forgotMode && (
                  <button type="button" onClick={() => setForgotMode(true)} className="block w-full text-xs text-[hsl(220,10%,45%)] hover:text-[hsl(175,70%,42%)] transition-colors">
                    Forgot your password?
                  </button>
                )}
                <button type="button" onClick={() => { setIsLogin(!isLogin); setForgotMode(false); }} className="text-xs text-[hsl(175,70%,42%)] hover:text-[hsl(175,70%,52%)] transition-colors">
                  {isLogin ? t('auth.noAccount') : t('auth.hasAccount')}
                </button>
              </div>

              {forgotMode && (
                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mt-4 rounded-xl border border-[hsl(220,20%,18%)] bg-[hsl(220,25%,10%)] p-3.5 space-y-2.5">
                  <p className="text-xs font-medium text-[hsl(210,20%,96%)]">Reset your password</p>
                  <p className="text-[10px] text-[hsl(220,10%,50%)]">We'll send you a reset link.</p>
                  <Input type="email" value={resetEmail} onChange={(e) => setResetEmail(e.target.value)} placeholder="you@example.com" className={`h-9 ${inputClass}`} />
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => setForgotMode(false)} className="rounded-lg border-[hsl(220,20%,18%)] text-[hsl(210,20%,80%)] hover:bg-[hsl(220,25%,14%)] text-xs h-8">
                      Cancel
                    </Button>
                    <Button size="sm" disabled={!resetEmail || loading} className="rounded-lg bg-[hsl(175,70%,42%)] text-white hover:bg-[hsl(175,70%,38%)] text-xs h-8"
                      onClick={async () => {
                        setLoading(true);
                        try {
                          const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, { redirectTo: `${window.location.origin}/reset-password` });
                          if (error) toast({ title: 'Error', description: error.message, variant: 'destructive' });
                          else { toast({ title: 'Check your email', description: 'Reset link sent.' }); setForgotMode(false); }
                        } finally { setLoading(false); }
                      }}
                    >
                      {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'Send Link'}
                    </Button>
                  </div>
                </motion.div>
              )}
            </motion.div>
          )}
        </div>

        <p className="text-[10px] text-[hsl(220,10%,35%)] text-center">
          By continuing, you agree to BookFlow's Terms of Service and Privacy Policy.
        </p>
      </div>

      {/* Right side — Interactive showcase */}
      <AuthShowcase />
    </div>
  );
}
