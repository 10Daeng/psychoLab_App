import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function GET(req: Request) {
  const { data: clients } = await supabaseAdmin.from('clients').select('id, name, test_purpose');
  const { data: tokens } = await supabaseAdmin.from('tokens').select('id, token_code, client_id, purpose');
  
  const testClient = clients?.find(c => c.name.toLowerCase() === 'test' || (tokens && tokens.find(t => t.client_id === c.id && t.token_code === 'EMP-6A5U6W')));
  
  if (testClient) {
     const clientTokens = tokens?.filter(t => t.client_id === testClient.id) || [];
     
     if (testClient.test_purpose !== 'EMP') {
        const { error } = await supabaseAdmin.from('clients').update({ test_purpose: 'EMP' }).eq('id', testClient.id);
        if (error) {
           return NextResponse.json({ success: false, error });
        }
        return NextResponse.json({ success: true, message: 'Updated test_purpose to EMP', testClient, clientTokens });
     }
     return NextResponse.json({ success: true, message: 'Already EMP', testClient, clientTokens });
  }
  return NextResponse.json({ success: false, error: 'Client not found' });
}
