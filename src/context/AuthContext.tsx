import React, { createContext, useContext, useEffect, useState } from 'react';
import { isSupabaseConfigured, supabase } from '../lib/supabase';

export type UserRole = 'admin' | 'recruiter' | 'hiring_manager';

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  department: string;
  avatarInitials: string;
  avatarUrl?: string;
}

export const ROLE_LABELS: Record<UserRole, string> = {
  admin: 'Administrador',
  recruiter: 'Recruiter RRHH',
  hiring_manager: 'Hiring Manager',
};

export const DEMO_PROFILES: Record<'recruiter' | 'hiring_manager' | 'admin', UserProfile> = {
  recruiter: {
    id: 'usr-recruiter-1',
    name: 'Sofía Seal',
    email: 'sofia.seal@hireflow.app',
    role: 'recruiter',
    department: 'Recursos Humanos & Selección',
    avatarInitials: 'SS',
  },
  hiring_manager: {
    id: 'usr-manager-1',
    name: 'Lucas Gómez',
    email: 'lucas.gomez@hireflow.app',
    role: 'hiring_manager',
    department: 'Hiring Manager · Tecnología & Comercial',
    avatarInitials: 'LG',
  },
  admin: {
    id: 'usr-admin-1',
    name: 'Administrador',
    email: 'admin@hireflow.app',
    role: 'admin',
    department: 'Head of Talent & Dirección',
    avatarInitials: 'AD',
  },
};

const STORAGE_KEY = 'hireflow_auth_user';

interface AuthContextValue {
  user: UserProfile | null;
  loading: boolean;
  isSupabaseActive: boolean;
  login: (email: string, password?: string) => Promise<{ success: boolean; error?: string }>;
  signUp: (email: string, password: string, name?: string, role?: UserRole) => Promise<{ success: boolean; error?: string }>;
  loginWithGoogle: () => Promise<{ success: boolean; error?: string }>;
  resetPassword: (email: string) => Promise<{ success: boolean; error?: string }>;
  updateProfile: (updates: Partial<Pick<UserProfile, 'name' | 'department' | 'avatarInitials' | 'avatarUrl'>>) => Promise<{ success: boolean; error?: string }>;
  updatePassword: (newPassword: string) => Promise<{ success: boolean; error?: string }>;
  loginAsDemo: (profileKey: 'recruiter' | 'hiring_manager' | 'admin') => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const isSupabaseActive = isSupabaseConfigured;

  // Detectar si la URL contiene parámetros de retorno OAuth de Google
  const isOAuthCallback =
    typeof window !== 'undefined' &&
    (window.location.hash.includes('access_token=') ||
      window.location.search.includes('code=') ||
      window.location.search.includes('error=') ||
      window.location.hash.includes('error='));

  const [loading, setLoading] = useState<boolean>(() => {
    return isSupabaseConfigured || isOAuthCallback;
  });

  const [user, setUser] = useState<UserProfile | null>(() => {
    // Si estamos procesando un callback de OAuth, no cargar un usuario previo de demo
    if (isOAuthCallback) return null;

    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch {
      // fallback
    }
    return null;
  });

  // Helper para convertir el usuario de Supabase a UserProfile
  const mapSupabaseUser = (sbUser: any): UserProfile => {
    const meta = sbUser.user_metadata || {};
    const fullName =
      meta.full_name ||
      meta.name ||
      (meta.given_name && meta.family_name ? `${meta.given_name} ${meta.family_name}` : '') ||
      sbUser.email?.split('@')[0] ||
      'Usuario';
    const email = sbUser.email || '';
    const avatarUrl = meta.avatar_url || meta.picture || undefined;

    const parts = fullName.trim().split(/\s+/);
    const initials =
      parts.length > 1
        ? `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
        : fullName.slice(0, 2).toUpperCase() || 'U';

    return {
      id: sbUser.id,
      email,
      name: fullName,
      role: meta.role || 'recruiter',
      department: meta.department || 'Recursos Humanos & Selección',
      avatarInitials: initials,
      avatarUrl,
    };
  };

  // Escuchar sesión de Supabase si está activo
  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) {
      setLoading(false);
      return;
    }

    const sb = supabase;
    let isMounted = true;
    let safetyTimeout: any = null;

    const initAuth = async () => {
      // 1. Extraer errores de query o hash
      const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ''));
      const searchParams = new URLSearchParams(window.location.search);

      const oauthError = searchParams.get('error') || hashParams.get('error');
      const oauthErrorDesc =
        searchParams.get('error_description') ||
        hashParams.get('error_description') ||
        searchParams.get('error_code');

      if (oauthError || oauthErrorDesc) {
        console.error('[HireFlow Auth] Error devuelto por OAuth:', oauthError, oauthErrorDesc);
        alert(`Error al iniciar sesión con Google / Supabase:\n\n${oauthErrorDesc || oauthError}\n\nRevisá los permisos o la consola de Supabase.`);
        window.history.replaceState({}, document.title, window.location.pathname);
        if (isMounted) setLoading(false);
        return;
      }

      // 2. Consultar getSession() (supabase-js procesa e intercambia el código automáticamente)
      try {
        const {
          data: { session },
        } = await sb.auth.getSession();
        if (session?.user && isMounted) {
          const u = mapSupabaseUser(session.user);
          setUser(u);
          localStorage.setItem(STORAGE_KEY, JSON.stringify(u));
          window.history.replaceState({}, document.title, window.location.pathname);
          if (isMounted) setLoading(false);
          return;
        }
      } catch (err) {
        console.error('[HireFlow Auth] Error en getSession():', err);
      }

      // 4. Si estamos en un callback de OAuth, darle 5 segundos a onAuthStateChange para procesar los tokens
      if (isOAuthCallback) {
        safetyTimeout = setTimeout(() => {
          if (isMounted) {
            console.warn('[HireFlow Auth] Timeout de espera OAuth agotado sin sesión.');
            setLoading(false);
          }
        }, 5000);
      } else {
        if (isMounted) setLoading(false);
      }
    };

    initAuth();

    // 5. Suscribirse a eventos de autenticación en tiempo real
    const {
      data: { subscription },
    } = sb.auth.onAuthStateChange((event, session) => {
      console.log('[HireFlow Auth] onAuthStateChange event:', event, 'user:', session?.user?.email);
      if (!isMounted) return;
      if (safetyTimeout) clearTimeout(safetyTimeout);

      if (session?.user) {
        const u = mapSupabaseUser(session.user);
        setUser(u);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(u));
        setLoading(false);
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        localStorage.removeItem(STORAGE_KEY);
        setLoading(false);
      }
    });

    return () => {
      isMounted = false;
      if (safetyTimeout) clearTimeout(safetyTimeout);
      subscription.unsubscribe();
    };
  }, []);

  const login = async (email: string, password?: string): Promise<{ success: boolean; error?: string }> => {
    setLoading(true);

    // Si Supabase está conectado, intentar autenticación real
    if (isSupabaseConfigured && supabase && password) {
      try {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) {
          setLoading(false);
          return { success: false, error: error.message };
        }
        if (data.user) {
          const u: UserProfile = {
            id: data.user.id,
            email: data.user.email || email,
            name: data.user.user_metadata?.full_name || email.split('@')[0],
            role: data.user.user_metadata?.role || 'recruiter',
            department: data.user.user_metadata?.department || 'Talento & RRHH',
            avatarInitials: (data.user.user_metadata?.full_name?.[0] || email[0] || 'U').toUpperCase(),
          };
          setUser(u);
          localStorage.setItem(STORAGE_KEY, JSON.stringify(u));
          setLoading(false);
          return { success: true };
        }
      } catch (err: any) {
        setLoading(false);
        return { success: false, error: err.message || 'Error de conexión con Supabase' };
      }
    }

    // Modo local / demo: mapear o crear perfil dinámico
    const foundDemo = Object.values(DEMO_PROFILES).find(
      (p) => p.email.toLowerCase() === email.toLowerCase()
    );

    const activeProfile: UserProfile = foundDemo || {
      id: `usr-${Date.now()}`,
      email: email.trim(),
      name: email.split('@')[0].replace(/[._]/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase()),
      role: 'recruiter',
      department: 'Recursos Humanos',
      avatarInitials: (email[0] || 'U').toUpperCase(),
    };

    setUser(activeProfile);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(activeProfile));
    setLoading(false);
    return { success: true };
  };

  const signUp = async (
    email: string,
    password: string,
    name?: string,
    role: UserRole = 'recruiter'
  ): Promise<{ success: boolean; error?: string }> => {
    setLoading(true);

    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: name || email.split('@')[0],
              role,
              department: role === 'hiring_manager' ? 'Operaciones / Tech' : 'Recursos Humanos',
            },
          },
        });

        if (error) {
          setLoading(false);
          return { success: false, error: error.message };
        }

        if (data.user) {
          const u: UserProfile = {
            id: data.user.id,
            email: data.user.email || email,
            name: name || data.user.user_metadata?.full_name || email.split('@')[0],
            role,
            department: role === 'hiring_manager' ? 'Operaciones / Tech' : 'Recursos Humanos',
            avatarInitials: ((name || email)[0] || 'U').toUpperCase(),
          };
          setUser(u);
          localStorage.setItem(STORAGE_KEY, JSON.stringify(u));
          setLoading(false);
          return { success: true };
        }
      } catch (err: any) {
        setLoading(false);
        return { success: false, error: err.message || 'Error al registrar en Supabase' };
      }
    }

    // Modo local / demo fallback
    const localUser: UserProfile = {
      id: `usr-${Date.now()}`,
      email: email.trim(),
      name: name || email.split('@')[0].replace(/[._]/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase()),
      role,
      department: role === 'hiring_manager' ? 'Tecnología & Comercial' : 'Recursos Humanos & Selección',
      avatarInitials: ((name || email)[0] || 'U').toUpperCase(),
    };

    setUser(localUser);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(localUser));
    setLoading(false);
    return { success: true };
  };

  const loginWithGoogle = async (): Promise<{ success: boolean; error?: string }> => {
    setLoading(true);

    if (isSupabaseConfigured && supabase) {
      try {
        // Limpiamos cualquier usuario demo antiguo antes de iniciar OAuth
        localStorage.removeItem(STORAGE_KEY);
        const { error } = await supabase.auth.signInWithOAuth({
          provider: 'google',
          options: {
            redirectTo: window.location.origin,
            scopes: 'openid email profile',
            queryParams: {
              prompt: 'select_account',
            },
          },
        });
        if (error) {
          setLoading(false);
          return { success: false, error: error.message };
        }
        return { success: true };
      } catch (err: any) {
        setLoading(false);
        return { success: false, error: err.message || 'Error de autenticación con Google' };
      }
    }

    // Modo demo fallback para Google Workspace
    const googleProfile: UserProfile = {
      id: `usr-google-${Date.now()}`,
      name: 'Usuario Google Workspace',
      email: 'recruiter.google@hireflow.app',
      role: 'recruiter',
      department: 'Recursos Humanos',
      avatarInitials: 'GW',
    };

    setUser(googleProfile);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(googleProfile));
    setLoading(false);
    return { success: true };
  };

  const resetPassword = async (emailToReset: string): Promise<{ success: boolean; error?: string }> => {
    if (!emailToReset.trim()) {
      return { success: false, error: 'Por favor, ingresá un correo válido.' };
    }

    if (isSupabaseConfigured && supabase) {
      try {
        const { error } = await supabase.auth.resetPasswordForEmail(emailToReset.trim(), {
          redirectTo: `${window.location.origin}/login`,
        });
        if (error) {
          return { success: false, error: error.message };
        }
        return { success: true };
      } catch (err: any) {
        return { success: false, error: err.message };
      }
    }

    // En modo local demo siempre retorna éxito simulado
    return { success: true };
  };

  const updateProfile = async (
    updates: Partial<Pick<UserProfile, 'name' | 'department' | 'avatarInitials' | 'avatarUrl'>>
  ): Promise<{ success: boolean; error?: string }> => {
    if (!user) return { success: false, error: 'No hay sesión activa.' };

    const updatedUser: UserProfile = {
      ...user,
      ...updates,
      avatarInitials:
        updates.avatarInitials ||
        (updates.name
          ? updates.name
              .split(' ')
              .map((n) => n[0])
              .slice(0, 2)
              .join('')
              .toUpperCase()
          : user.avatarInitials),
    };

    setUser(updatedUser);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedUser));

    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.auth.updateUser({
          data: {
            full_name: updatedUser.name,
            department: updatedUser.department,
            avatar_url: updatedUser.avatarUrl,
          },
        });
      } catch (err: any) {
        // En caso de error remoto pero éxito local
      }
    }

    return { success: true };
  };

  const updatePassword = async (newPassword: string): Promise<{ success: boolean; error?: string }> => {
    if (!newPassword || newPassword.length < 6) {
      return { success: false, error: 'La contraseña debe tener al menos 6 caracteres.' };
    }

    if (isSupabaseConfigured && supabase) {
      try {
        const { error } = await supabase.auth.updateUser({ password: newPassword });
        if (error) return { success: false, error: error.message };
      } catch (err: any) {
        return { success: false, error: err.message };
      }
    }

    return { success: true };
  };

  const loginAsDemo = (profileKey: 'recruiter' | 'hiring_manager' | 'admin') => {
    const profile = DEMO_PROFILES[profileKey];
    setUser(profile);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
  };

  const logout = async () => {
    if (isSupabaseConfigured && supabase) {
      await supabase.auth.signOut().catch(() => {});
    }
    setUser(null);
    localStorage.removeItem(STORAGE_KEY);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isSupabaseActive,
        login,
        signUp,
        loginWithGoogle,
        resetPassword,
        updateProfile,
        updatePassword,
        loginAsDemo,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextValue => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe utilizarse dentro de un AuthProvider');
  }
  return context;
};
