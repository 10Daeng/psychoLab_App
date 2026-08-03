const fs = require('fs');
const envStr = fs.readFileSync('.env.local', 'utf8');
const env = {};
envStr.split('\n').forEach(line => {
  const [k, ...v] = line.split('=');
  if(k && v) env[k.trim()] = v.join('=').trim().replace(/^"|"$/g, '');
});

const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SECRET_KEY);
async function run() {
  const { data: qData } = await supabase.from('questionnaires').select('id').eq('code', 'DISC').single();
  const { data: questions } = await supabase.from('questions').select('response_options, scoring_key, correct_answer').eq('questionnaire_id', qData.id).limit(1);
  console.log('response_options:', questions[0].response_options);
  console.log('scoring_key:', questions[0].scoring_key);
  console.log('correct_answer:', questions[0].correct_answer);
}
run();
