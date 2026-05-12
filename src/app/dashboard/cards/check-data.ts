import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkCards() {
  const { data: beneficiaries, error: benError } = await supabase
    .from('beneficiaries')
    .select('id, full_name, rut')
    .ilike('full_name', '%Leiva%');

  if (benError) {
    console.error('Error fetching beneficiaries:', benError);
    return;
  }

  console.log('Found beneficiaries:', beneficiaries);

  if (beneficiaries && beneficiaries.length > 0) {
    const ids = beneficiaries.map(b => b.id);
    const { data: cards, error: cardError } = await supabase
      .from('digital_cards')
      .select('*')
      .in('beneficiary_id', ids);

    if (cardError) {
      console.error('Error fetching cards:', cardError);
      return;
    }

    console.log('Found cards:', cards);
  }
}

checkCards();
