import { useState, useEffect, createContext, useContext, ReactNode, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { User, Session } from '@supabase/supabase-js';

/* ───────────────────────── Types ───────────────────────── */

export type AppRole = 'customer' | 'admin' | 'staff';

export interface MockUser {
  id: string;
  email: string;
  full_name: string;
  role: AppRole;
}

export type AuthMode = 'demo' | 'real';

export const DEMO_USERS: MockUser[] = [
  { id: 'admin-001', email: 'admin@bookflow.demo', full_name: 'Admin User', role: 'admin' },
  { id: 'staff-001', email: 'doctor@bookflow.demo', full_name: 'Dr. Sarah Chen', role: 'staff' },
  { id: 'staff-002', email: 'manager@bookflow.demo', full_name: 'Mike Johnson', role: 'staff' },
  { id: 'customer-001', email: 'client@bookflow.demo', full_name: 'Jane Smith', role: 'customer' },
  { id: 'customer-002', email: 'user@bookflow.demo', full_name: 'John Doe', role: 'customer' },
];

const STORAGE_KEY = 'bookflow_demo_user';
const MODE_KEY = 'bookflow_auth_mode';

interface AuthContextType {
  user: MockUser | null;
  session: any;
  isAdmin: boolean;
  isStaff: boolean;
  role: AppRole;
  isLoading: boolean;
  authMode: AuthMode;
  setAuthMode: (mode: AuthMode) => void;
  signUp: (email: string, password: string, fullName: string, role?: string) => Promise<{ error: any }>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  loginAs: (user: MockUser) => void;
  isDemoMode: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

/* ───────────────────────── Helpers ───────────────────────── */

function loadDemoUser(): MockUser | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return JSON.parse(stored);
  } catch {}
  return null;
}

function saveDemoUser(user: MockUser | null) {
  if (user) localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
  else localStorage.removeItem(STORAGE_KEY);
}

function loadMode(): AuthMode {
  try {
    const m = localStorage.getItem(MODE_KEY);
    if (m === 'real') return 'real';
  } catch {}
  return 'demo';
}

function saveMode(mode: AuthMode) {
  localStorage.setItem(MODE_KEY, mode);
}

/* ───────────────────────── Provider ───────────────────────── */

export function AuthProvider({ children }: { children: ReactNode }) {
  const [authMode, setAuthModeState] = useState<AuthMode>(loadMode);
  const [demoUser, setDemoUser] = useState<MockUser | null>(null);
  const [realUser, setRealUser] = useState<User | null>(null);
  const [realSession, setRealSession] = useState<Session | null>(null);
  const [realRole, setRealRole] = useState<AppRole>('customer');
  const [isLoading, setIsLoading] = useState(true);

  const isDemoMode = authMode === 'demo';

  /* ── Auth mode switching ── */
  const setAuthMode = useCallback((mode: AuthMode) => {
    saveMode(mode);
    setAuthModeState(mode);
    // Clear opposite mode state
    if (mode === 'demo') {
      supabase.auth.signOut({ scope: 'local' }).catch(() => {});
      setRealUser(null);
      setRealSession(null);
      setRealRole('customer');
    } else {
      saveDemoUser(null);
      setDemoUser(null);
    }
  }, []);

  /* ── Demo mode init ── */
  useEffect(() => {
    if (!isDemoMode) return;
    const stored = loadDemoUser();
    setDemoUser(stored);
    setIsLoading(false);
  }, [isDemoMode]);

  /* ── Real mode init ── */
  useEffect(() => {
    if (isDemoMode) return;
    setIsLoading(true);

    const timeout = setTimeout(() => setIsLoading(false), 5000);

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setRealSession(session);
      setRealUser(session?.user ?? null);
      if (session?.user) {
        setTimeout(() => fetchRole(session.user.id), 0);
      } else {
        setRealRole('customer');
        setIsLoading(false);
      }
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      setRealSession(session);
      setRealUser(session?.user ?? null);
      if (session?.user) {
        fetchRole(session.user.id);
      } else {
        setIsLoading(false);
      }
    }).catch(() => {
      // Clear stale/invalid session
      supabase.auth.signOut({ scope: 'local' }).catch(() => {});
      setIsLoading(false);
    });

    return () => {
      clearTimeout(timeout);
      subscription.unsubscribe();
    };
  }, [isDemoMode]);

  const fetchRole = async (userId: string) => {
    try {
      const { data } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .maybeSingle();
      setRealRole((data?.role as AppRole) || 'customer');
    } catch {
      setRealRole('customer');
    } finally {
      setIsLoading(false);
    }
  };

  /* ── Derived state ── */
  const user: MockUser | null = isDemoMode
    ? demoUser
    : realUser
      ? { id: realUser.id, email: realUser.email ?? '', full_name: realUser.user_metadata?.full_name ?? '', role: realRole }
      : null;

  const isAdmin = user?.role === 'admin';
  const isStaff = user?.role === 'staff';
  const role: AppRole = user?.role ?? 'customer';
  const session = isDemoMode ? (demoUser ? { user: demoUser } : null) : realSession;

  /* ── Demo actions ── */
  const loginAs = useCallback((u: MockUser) => {
    saveDemoUser(u);
    setDemoUser(u);
  }, []);

  /* ── Auth actions ── */
  const signIn = useCallback(async (email: string, password: string) => {
    if (isDemoMode) {
      const found = DEMO_USERS.find(u => u.email === email);
      if (!found) return { error: { message: 'Demo user not found. Select a demo account.' } };
      loginAs(found);
      return { error: null };
    }
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) return { error: { message: error.message } };
      return { error: null };
    } catch (err: any) {
      return { error: { message: err?.message || 'Sign in failed. Please try again.' } };
    }
  }, [isDemoMode, loginAs]);

  const signUp = useCallback(async (email: string, password: string, fullName: string, selectedRole: string = 'customer') => {
    if (isDemoMode) {
      const newUser: MockUser = { id: `custom-${Date.now()}`, email, full_name: fullName, role: (selectedRole as AppRole) || 'customer' };
      loginAs(newUser);
      return { error: null };
    }
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: fullName, role: selectedRole },
          emailRedirectTo: window.location.origin,
        },
      });
      if (error) return { error: { message: error.message } };
      return { error: null };
    } catch (err: any) {
      return { error: { message: err?.message || 'Sign up failed. Please try again.' } };
    }
  }, [isDemoMode, loginAs]);

  const signOut = useCallback(async () => {
    if (isDemoMode) {
      saveDemoUser(null);
      setDemoUser(null);
    } else {
      try {
        await supabase.auth.signOut();
      } catch {
        await supabase.auth.signOut({ scope: 'local' }).catch(() => {});
      }
      setRealUser(null);
      setRealSession(null);
      setRealRole('customer');
    }
  }, [isDemoMode]);

  return (
    <AuthContext.Provider value={{ user, session, isAdmin, isStaff, role, isLoading, authMode, setAuthMode, signUp, signIn, signOut, loginAs, isDemoMode }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) throw new Error('useAuth must be used within an AuthProvider');
  return context;
}
