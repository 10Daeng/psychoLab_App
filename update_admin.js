const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcryptjs');

const env = fs.readFileSync('.env.local', 'utf-8').split('\n').reduce((acc, line) => {
  const [k, ...v] = line.split('=');
  if (k && v.length) acc[k.trim()] = v.join('=').replace(/^['"]|['"]$/g, '');
  return acc;
}, {});

const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SECRET_KEY);

async function run() {
  // 1. Get users
  const { data: users, error } = await supabase.from('admin_users').select('*');
  if (error) {
    console.error('Error fetching users:', error);
    return;
  }
  
  if (!users || users.length === 0) {
    console.log('No users found in admin_users table. Creating one...');
    const hash = bcrypt.hashSync('admin123', 10);
    const { data: newUser, error: insertError } = await supabase.from('admin_users').insert([{
      username: 'admin',
      password_hash: hash,
      role: 'superadmin'
    }]).select();
    console.log('Created user:', newUser);
    return;
  }

  console.log('Found users:', users.map(u => u.username));
  
  // 2. Update the first user's password to admin123
  const targetUsername = users[0].username;
  console.log(`Updating password for user: ${targetUsername} to admin123`);
  
  const newHash = bcrypt.hashSync('admin123', 10);
  const { data: updated, error: updateError } = await supabase.from('admin_users')
    .update({ password_hash: newHash })
    .eq('username', targetUsername)
    .select();
    
  if (updateError) {
    console.error('Update error:', updateError);
  } else {
    console.log('Successfully updated password for:', targetUsername);
  }
}
run();
