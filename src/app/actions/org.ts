'use server';

import { createClient } from '@supabase/supabase-js';
import { logActivity } from './audit';

export async function getOrgMembers(orgId: string) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  try {
    // 1. Obtener los miembros de la organización
    const { data: members, error: membersError } = await supabase
      .from('org_members')
      .select('*')
      .eq('org_id', orgId);

    if (membersError) throw membersError;

    // 2. Obtener los emails de Auth (con privilegios de admin)
    // Para no hacer mil llamadas, traemos la lista reciente
    const { data: authData, error: authError } = await supabase.auth.admin.listUsers({
      perPage: 1000
    });

    if (authError) throw authError;

    // 3. Enriquecer los miembros con sus emails reales
    const enrichedMembers = members.map(member => {
      const authUser = authData.users.find(u => u.id === member.user_id);
      return {
        ...member,
        email: authUser?.email || `usuario-${member.user_id.substring(0, 4)}@ejemplo.com`
      };
    });

    return { success: true, data: enrichedMembers };
  } catch (error: any) {
    console.error('Error fetching enriched members:', error);
    return { success: false, error: error.message };
  }
}

export async function updateMemberRole(
  memberId: string, 
  newRole: string,
  adminId: string,
  adminEmail: string,
  orgId: string
) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  try {
    const { error } = await supabase
      .from('org_members')
      .update({ role: newRole })
      .eq('id', memberId);

    if (error) throw error;

    // Log activity
    await logActivity({
      orgId,
      userId: adminId,
      userEmail: adminEmail,
      action: 'UPDATE_MEMBER_ROLE',
      entityType: 'membership',
      entityId: memberId,
      details: { new_role: newRole }
    });

    return { success: true };
  } catch (error: any) {
    console.error('Error updating member role:', error);
    return { success: false, error: error.message };
  }
}

export async function removeOrgMember(
  memberId: string,
  adminId: string,
  adminEmail: string,
  orgId: string
) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  try {
    const { error } = await supabase
      .from('org_members')
      .delete()
      .eq('id', memberId);

    if (error) throw error;

    // Log activity
    await logActivity({
      orgId,
      userId: adminId,
      userEmail: adminEmail,
      action: 'REMOVE_MEMBER',
      entityType: 'membership',
      entityId: memberId
    });

    return { success: true };
  } catch (error: any) {
    console.error('Error removing member:', error);
    return { success: false, error: error.message };
  }
}
