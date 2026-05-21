'use client';

import { createContext, useContext, useEffect, useState, useRef, useCallback, useMemo, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/client';
import { Organization, OrgMember } from '@/lib/types';
import { signOutAction } from '@/app/actions/auth';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  organization: Organization | null;
  membership: OrgMember | null;
  memberships: any[];
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
  const lastFetchedUserRef = useRef<string | null>(null);

  const fetchOrganization = useCallback(async (userId: string, preferredOrgId?: string) => {
    try {
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

      setMemberships(allMemberships);

      // Determine which organization to activate
      const lastOrgId = preferredOrgId || localStorage.getItem('last_org_id');

      // 1. If there's a saved preference, find it
      let activeMember = lastOrgId ? allMemberships.find((m: any) => m.org_id === lastOrgId) : null;

      // 2. If no preference and only ONE org, auto-select
      if (!activeMember && allMemberships.length === 1) {
        activeMember = allMemberships[0];
      }

      if (activeMember) {
        setMembership({
          id: activeMember.id,
          org_id: activeMember.org_id,
          user_id: activeMember.user_id,
          role: activeMember.role,
          created_at: activeMember.created_at,
        });
        setOrganization(activeMember.organizations);
        localStorage.setItem('last_org_id', activeMember.org_id);
      } else {
        // Multiple orgs, no preference: force selection
        setOrganization(null);
        setMembership(null);
      }
    } catch (error) {
      console.error('Error fetching organizations:', error);
    }
  }, [supabase]);

  useEffect(() => {
    // Hard cap: if loading takes > 8s, force-stop to prevent infinite spinner
    const failsafe = setTimeout(() => {
      setLoading(false);
    }, 8000);

    let isMounted = true;
    let initialSessionHandled = false;

    const getSession = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase.auth.getSession();
        if (error) throw error;
        if (!isMounted) return;

        const currentSession = data?.session || null;
        setSession(currentSession);
        setUser(currentSession?.user ?? null);

        if (currentSession?.user) {
          await fetchOrganization(currentSession.user.id);
        }
        initialSessionHandled = true;
      } catch (err) {
        console.error('Error in initial session fetch:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event: any, newSession: any) => {
        if (!isMounted) return;

        if (event === 'SIGNED_OUT') {
          setSession(null);
          setUser(null);
          setOrganization(null);
          setMembership(null);
          setMemberships([]);
          localStorage.removeItem('last_org_id');
          setLoading(false);
          return;
        }

        // Skip INITIAL_SESSION if getSession already handled it (prevents double-fetch)
        if (event === 'INITIAL_SESSION' && initialSessionHandled) {
          return;
        }

        if (event === 'SIGNED_IN' || event === 'INITIAL_SESSION') {
          setSession(newSession);
          setUser(newSession?.user ?? null);

          if (newSession?.user) {
            await fetchOrganization(newSession.user.id);
          }
          setLoading(false);
        }

        // TOKEN_REFRESHED: just update session/user refs silently, no re-fetch
        if (event === 'TOKEN_REFRESHED') {
          setSession(newSession);
          setUser(newSession?.user ?? null);
        }
      }
    );

    getSession();

    return () => {
      isMounted = false;
      clearTimeout(failsafe);
      subscription.unsubscribe();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const signIn = useCallback(async (email: string, password: string, accessCode?: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (!error && data.user && accessCode) {
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
  }, [supabase]);

  const signUp = useCallback(async (email: string, password: string, orgName: string) => {
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

    return { error: null };
  }, [supabase]);

  const signOut = useCallback(async () => {
    try {
      // 1. Clear local Supabase JS client state
      await supabase.auth.signOut();
    } catch (e) {
      console.warn("Client SignOut error", e);
    }

    try {
      // 2. Clear server-side HTTP cookies using a Server Action.
      // We wrap it in a 1.5s timeout so that even if the network is sluggish,
      // the process continues and doesn't leave the user stuck.
      await Promise.race([
        signOutAction(),
        new Promise(resolve => setTimeout(resolve, 1500))
      ]);
    } catch (e) {
      console.warn("Server SignOut error", e);
    }

    // Force-clear Supabase auth tokens
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith('sb-') && key.endsWith('-auth-token')) {
        localStorage.removeItem(key);
      }
    });
    localStorage.removeItem('last_org_id');

    // 3. Update React state at the very end to trigger unmount/redirects
    setUser(null);
    setSession(null);
    setOrganization(null);
    setMembership(null);
    setMemberships([]);
  }, [supabase]);

  const refreshOrganization = useCallback(async () => {
    if (user) {
      lastFetchedUserRef.current = null; // Force re-fetch
      await fetchOrganization(user.id);
    }
  }, [user, fetchOrganization]);

  const switchOrganization = useCallback(async (orgId: string) => {
    if (user) {
      setLoading(true);
      await fetchOrganization(user.id, orgId);
      setLoading(false);
    }
  }, [user, fetchOrganization]);

  const searchAndJoinOrganization = useCallback(async (searchQuery: string) => {
    if (!user) return { error: 'No hay sesión activa' };

    try {
      setLoading(true);

      const { data: orgs, error: searchError } = await supabase.rpc('search_organizations_unrestricted', {
        search_query: searchQuery
      });

      if (searchError) {
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
      lastFetchedUserRef.current = null;
      await fetchOrganization(user.id, targetOrg.id);
      return { success: true };
    } catch {
      return { error: 'Error en la búsqueda.' };
    } finally {
      setLoading(false);
    }
  }, [user, supabase, fetchOrganization]);

  const joinByCode = useCallback(async (code: string) => {
    if (!user) return { error: 'No hay sesión activa' };

    try {
      setLoading(true);
      const { data, error } = await supabase.rpc('join_org_by_code', {
        target_code: code.trim().toUpperCase(),
        target_user_id: user.id
      });

      if (error) throw error;
      if (data.error) return { error: data.error };

      lastFetchedUserRef.current = null;
      await fetchOrganization(user.id, data.org_id);
      return { success: true };
    } catch {
      return { error: 'Clave inválida o error de conexión.' };
    } finally {
      setLoading(false);
    }
  }, [user, supabase, fetchOrganization]);

  // Memoize the context value to prevent unnecessary re-renders of all consumers
  const contextValue = useMemo(() => ({
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
  }), [user, session, organization, membership, memberships, loading, signIn, signUp, signOut, refreshOrganization, switchOrganization, searchAndJoinOrganization, joinByCode]);

  return (
    <AuthContext.Provider value={contextValue}>
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
