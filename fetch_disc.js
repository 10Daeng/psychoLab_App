const https = require('https');

const options = {
  hostname: 'bgenakkulsrzchckkefv.supabase.co',
  port: 443,
  path: '/rest/v1/questionnaires?code=eq.DISC&select=id',
  method: 'GET',
  headers: {
    'apikey': 'sb_publishable_PRAaknPfaaJBEJvOxggw8g_VBEqG0dI',
    'Authorization': 'Bearer sb_publishable_PRAaknPfaaJBEJvOxggw8g_VBEqG0dI'
  }
};

const req = https.request(options, res => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    const q = JSON.parse(data);
    if (!q[0]) return console.log('No DISC questionnaire found');
    const qid = q[0].id;
    
    const options2 = {
      hostname: 'bgenakkulsrzchckkefv.supabase.co',
      port: 443,
      path: '/rest/v1/questions?questionnaire_id=eq.' + qid + '&select=response_options,scoring_key&limit=1',
      method: 'GET',
      headers: {
        'apikey': 'sb_publishable_PRAaknPfaaJBEJvOxggw8g_VBEqG0dI',
        'Authorization': 'Bearer sb_publishable_PRAaknPfaaJBEJvOxggw8g_VBEqG0dI'
      }
    };
    
    const req2 = https.request(options2, res2 => {
      let data2 = '';
      res2.on('data', chunk => data2 += chunk);
      res2.on('end', () => console.log(data2));
    });
    req2.end();
  });
});
req.end();
