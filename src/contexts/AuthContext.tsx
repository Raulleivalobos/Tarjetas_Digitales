'use client';

import { createContext, useContext, useEffect, useState, useRef, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/client';
import { Organization, OrgMember } from '@/lib/types';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  organization: Organization | null;
  membership: OrgMember | null;
  memberships: any[]; // Lista de todas las membresías
  loading: boolean;
  signIn: (email: string, password: string, accessCode?: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string, orgName: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  refreshOrganization: () => Promise<void>;
  switchOrganization: (orgId: string) => Promise<void>;
  searchAndJoinOrganization: (query: string) => Promise<{ success?: boolean; error?: string }>;
  joinByCode: (code: string) => Promise<{ success?: boolean; error?: string }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [membership, setMembership] = useState<OrgMember | null>(null);
  const [memberships, setMemberships] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const supabaseRef = useRef(createClient());
  const supabase = supabaseRef.current;

  const fetchOrganization = async (userId: string, preferredOrgId?: string) => {
    try {
      // Obtener todas las membresías del usuario
      const { data: allMemberships } = await supabase
        .from('org_members')
        .select('*, organizations(*)')
        .eq('user_id', userId);

      if (!allMemberships || allMemberships.length === 0) {
        setMemberships([]);
        setOrganization(null);
        setMembership(null);
        return;
      }

      setMemberships(prev => {
        return JSON.stringify(prev) === JSON.stringify(allMemberships) ? prev : allMemberships;
      });

      // Determinar cuál organización activar
      const lastOrgId = preferredOrgId || localStorage.getItem('last_org_id');
      const activeMember = allMemberships.find(m => m.org_id === lastOrgId) || allMemberships[0];

      if (activeMember) {
        setMembership(prev => {
          const next = {
            id: activeMember.id,
            org_id: activeMember.org_id,
            user_id: activeMember.user_id,
            role: activeMember.role,
            created_at: activeMember.created_at,
          };
          return JSON.stringify(prev) === JSON.stringify(next) ? prev : next;
        });
        setOrganization(prev => {
          return JSON.stringify(prev) === JSON.stringify(activeMember.organizations) ? prev : activeMember.organizations;
        });
        localStorage.setItem('last_org_id', activeMember.org_id);
      }
    } catch (error) {
      console.error('Error fetching organizations:', error);
    }
  };

  useEffect(() => {
    const failsafe = setTimeout(() => {
      setLoading(false);
    }, 5000);

    const getSession = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();
        if (error) console.error('Error in getSession:', error);
        
        const currentSession = data?.session || null;
        setSession(currentSession);
        setUser(currentSession?.user ?? null);

        if (currentSession?.user) {
          await fetchOrganization(currentSession.user.id);
        }
      } catch (err) {
        console.error('Unhandled error in getSession:', err);
      } finally {
        setLoading(false);
      }
    };

    getSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, newSession) => {
        try {
          setSession(newSession);
          setUser(newSession?.user ?? null);

          if (newSession?.user) {
            await fetchOrganization(newSession.user.id);
          } else {
            setOrganization(null);
            setMembership(null);
            setMemberships([]);
            localStorage.removeItem('last_org_id');
          }
        } catch (err) {
          console.error('Error in onAuthStateChange:', err);
        } finally {
          setLoading(false);
        }
      }
    );

    return () => {
      clearTimeout(failsafe);
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string, accessCode?: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    
    if (!error && data.user && accessCode) {
      // Intentar vincular automáticamente si hay una clave
      try {
        const { data: joinData } = await supabase.rpc('join_org_by_code', {
          target_code: accessCode.trim().toUpperCase(),
          target_user_id: data.user.id
        });
        
        if (joinData && joinData.org_id) {
          localStorage.setItem('last_org_id', joinData.org_id);
        }
      } catch (err) {
        console.error('Auto-join failed:', err);
      }
    }

    return { error: error as Error | null };
  };

  const signUp = async (email: string, password: string, orgName: string) => {
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error || !data.user) return { error: error as Error | null };

    const slug = orgName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');

    const { error: rpcError } = await supabase.rpc('create_new_organization', {
      org_name: orgName,
      org_slug: slug
    });

    if (rpcError) {
      console.error("RPC Error:", rpcError);
      return { error: new Error('Error al crear la organización.') };
    }

    await refreshOrganization();
    return { error: null };
  };

  const signOut = async () => {
    // Forzado instantáneo para evitar cuelgues
    setOrganization(null);
    setMembership(null);
    setMemberships([]);
    localStorage.removeItem('last_org_id');
    supabase.auth.signOut().catch(() => {});
  };

  const refreshOrganization = async () => {
    if (user) {
      await fetchOrganization(user.id);
    }
  };

  const switchOrganization = async (orgId: string) => {
    if (user) {
      setLoading(true);
      await fetchOrganization(user.id, orgId);
      setLoading(false);
    }
  };

  const searchAndJoinOrganization = async (searchQuery: string) => {
    if (!user) return { error: 'No hay sesión activa' };
    
    try {
      setLoading(true);
      
      // Intentar usar el nuevo RPC inteligente si existe
      const { data: orgs, error: searchError } = await supabase.rpc('search_organizations_unrestricted', {
        search_query: searchQuery
      });

      if (searchError) {
        // Fallback básico si el RPC no está instalado
        const { data: basicOrgs } = await supabase
          .from('organizations')
          .select('*')
          .or(`name.ilike.%${searchQuery}%,rut.ilike.%${searchQuery.replace(/[^a-zA-Z0-9]/g, '')}%`)
          .limit(5);
        
        if (!basicOrgs || basicOrgs.length === 0) return { error: 'No se encontró la organización.' };
        return { error: 'Encontrada, pero requiere Clave de Acceso para entrar.' };
      }

      if (!orgs || orgs.length === 0) return { error: 'No se encontró ninguna organización.' };

      const targetOrg = orgs[0];
      await fetchOrganization(user.id, targetOrg.id);
      return { success: true };
    } catch (err) {
      return { error: 'Error en la búsqueda.' };
    } finally {
      setLoading(false);
    }
  };

  const joinByCode = async (code: string) => {
    if (!user) return { error: 'No hay sesión activa' };
    
    try {
      setLoading(true);
      const { data, error } = await supabase.rpc('join_org_by_code', {
        target_code: code.trim().toUpperCase(),
        target_user_id: user.id
      });

      if (error) throw error;
      if (data.error) return { error: data.error };

      await fetchOrganization(user.id, data.org_id);
      return { success: true };
    } catch (err) {
      console.error('Error joining by code:', err);
      return { error: 'Clave inválida o error de conexión.' };
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        organization,
        membership,
        memberships,
        loading,
        signIn,
        signUp,
        signOut,
        refreshOrganization,
        switchOrganization,
        searchAndJoinOrganization,
        joinByCode,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
