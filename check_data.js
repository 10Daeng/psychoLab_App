require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function check() {
  console.log("Checking clients...");
  const { data: clients, error: clientsErr } = await supabase.from('clients').select('id, name, test_purpose').limit(10);
  console.log("Clients:", clients, clientsErr);

  console.log("Checking tokens...");
  const { data: tokens, error: tokensErr } = await supabase.from('tokens').select('id, client_id, purpose, token_code').limit(10);
  console.log("Tokens:", tokens, tokensErr);
}

check();
