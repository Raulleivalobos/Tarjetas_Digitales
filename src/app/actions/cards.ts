import { createClient } from '@supabase/supabase-js';
import { logActivity } from './audit';

export async function issueDigitalCard(
  cardData: any,
  adminId: string,
  adminEmail: string,
  orgId: string
) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  try {
    const { data: newCard, error } = await supabase
      .from('digital_cards')
      .insert({
        ...cardData,
        org_id: orgId
      })
      .select()
      .single();

    if (error) throw error;

    // Log activity
    await logActivity({
      orgId,
      userId: adminId,
      userEmail: adminEmail,
      action: 'ISSUE_CARD',
      entityType: 'card',
      entityId: newCard.id,
      details: { card_number: cardData.card_number, beneficiary_id: cardData.beneficiary_id }
    });

    return { success: true, data: newCard };
  } catch (error: any) {
    console.error('Error in issueDigitalCard:', error);
    return { success: false, error: error.message };
  }
}

export async function updateCardStatus(
  cardId: string,
  newStatus: string,
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
      .from('digital_cards')
      .update({ status: newStatus })
      .eq('id', cardId)
      .eq('org_id', orgId);

    if (error) throw error;

    // Log activity
    await logActivity({
      orgId,
      userId: adminId,
      userEmail: adminEmail,
      action: `CARD_STATUS_${newStatus.toUpperCase()}`,
      entityType: 'card',
      entityId: cardId
    });

    return { success: true };
  } catch (error: any) {
    console.error('Error in updateCardStatus:', error);
    return { success: false, error: error.message };
  }
}
