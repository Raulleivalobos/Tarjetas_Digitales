import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://idadoqaekgeunztslgfm.supabase.co';
const supabaseKey = 'sb_publishable_MahDLj1L-NVNLZMFxQJ_Iw_KjKo4eCP'; // We need service role key to bypass RLS in the test script, or we log in as the user.
