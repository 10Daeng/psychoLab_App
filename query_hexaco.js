const fs = require('fs');
const envStr = fs.readFileSync('.env.local', 'utf8');
const env = {};
envStr.split('\n').forEach(line => {
  const [k, ...v] = line.split('=');
  if(k && v) env[k.trim()] = v.join('=').trim().replace(/^"|"$/g, '');
});

const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function run() {
  const { data, error } = await supabase.from('questions').select('*').eq('test_code', 'HEXACO').limit(5);
  console.log(JSON.stringify(data, null, 2));
}
run();
