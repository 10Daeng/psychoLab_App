require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
async function run() {
  const { data: qData } = await supabase.from('questionnaires').select('id').eq('code', 'DISC').single();
  const { data: questions } = await supabase.from('questions').select('response_options').eq('questionnaire_id', qData.id).limit(1);
  console.log(questions[0].response_options);
}
run();
