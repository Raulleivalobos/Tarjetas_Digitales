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

export async function deleteBeneficiary(
  id: string,
  adminId: string,
  adminEmail: string,
  orgId: string
) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  try {
    // Primero eliminar tarjetas digitales asociadas (FK constraint)
    const { error: cardsError } = await supabase
      .from('digital_cards')
      .delete()
      .eq('beneficiary_id', id);

    if (cardsError) {
      console.error('Error deleting related cards:', cardsError);
    }

    // Luego eliminar el beneficiario
    const { error } = await supabase
      .from('beneficiaries')
      .delete()
      .eq('id', id)
      .eq('org_id', orgId);

    if (error) throw error;

    // Log activity
    await logActivity({
      orgId,
      userId: adminId,
      userEmail: adminEmail,
      action: 'DELETE_BENEFICIARY',
      entityType: 'beneficiary',
      entityId: id
    });

    return { success: true };
  } catch (error: any) {
    console.error('Error in deleteBeneficiary:', error);
    return { success: false, error: error.message };
  }
}
