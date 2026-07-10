'use server';

import { createClient } from '@supabase/supabase-js';
import { logActivity } from './audit';

export async function createOrUpdateBeneficiary(
  data: any,
  adminId: string,
  adminEmail: string,
  orgId: string
) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  try {
    const isUpdate = !!data.id;
    let result;

    if (isUpdate) {
      result = await supabase
        .from('beneficiaries')
        .update({
          ...data,
          updated_at: new Date().toISOString()
        })
        .eq('id', data.id)
        .eq('org_id', orgId)
        .select()
        .single();
    } else {
      result = await supabase
        .from('beneficiaries')
        .insert({
          ...data,
          org_id: orgId
        })
        .select()
        .single();
    }

    if (result.error) throw result.error;

    // Log activity
    await logActivity({
      orgId,
      userId: adminId,
      userEmail: adminEmail,
      action: isUpdate ? 'UPDATE_BENEFICIARY' : 'CREATE_BENEFICIARY',
      entityType: 'beneficiary',
      entityId: result.data.id,
      details: { rut: data.rut, name: data.full_name }
    });

    return { success: true, data: result.data };
  } catch (error: any) {
    console.error('Error in createOrUpdateBeneficiary:', error);
    return { success: false, error: error.message };
  }
}

export async function deleteBeneficiaries(
  ids: string[],
  isSandbox: boolean,
  adminId: string,
  adminEmail: string,
  orgId: string
) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  try {
    if (isSandbox) {
      await supabase.from('meeting_attendance').delete().in('beneficiary_id', ids);
      await supabase.from('benefit_assignments').delete().in('beneficiary_id', ids);
      await supabase.from('certificates').delete().in('beneficiary_id', ids);
      await supabase.from('digital_cards').delete().in('beneficiary_id', ids);
      
      const { error } = await supabase.from('beneficiaries').delete().in('id', ids).eq('org_id', orgId);
      if (error) throw error;
    } else {
      await supabase.from('digital_cards').delete().in('beneficiary_id', ids);
      
      const { data: beneficiariesData } = await supabase.from('beneficiaries').select('id, custom_fields').in('id', ids);
      
      if (beneficiariesData) {
        for (const b of beneficiariesData) {
          await supabase.from('beneficiaries').update({
            status: 'inactive',
            custom_fields: { ...(b.custom_fields || {}), is_deleted: true }
          }).eq('id', b.id).eq('org_id', orgId);
        }
      }
    }

    // Log activity
    for (const id of ids) {
      await logActivity({
        orgId,
        userId: adminId,
        userEmail: adminEmail,
        action: 'DELETE_BENEFICIARY',
        entityType: 'beneficiary',
        entityId: id
      });
    }

    return { success: true };
  } catch (error: any) {
    console.error('Error in deleteBeneficiaries:', error);
    return { success: false, error: error.message };
  }
}
