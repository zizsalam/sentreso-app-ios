#!/bin/bash
echo "📱 Checking for iOS users..."

node -e "
import('@supabase/supabase-js').then(m => {
  const client = m.createClient(
    'https://avltdtbgantbxbrqdxge.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF2bHRkdGJnYW50YnhicnFkeGdlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MDg2MjkyNSwiZXhwIjoyMDY2NDM4OTI1fQ.uTWh8tp56TrZToKbcbuHdisxFxI38PKWvmZQ5WTw_Tk'
  );
  
  client.auth.admin.listUsers().then(r => {
    console.log('Total users:', r.data.users.length);
    
    // Check for iOS identifiers
    const iosUsers = r.data.users.filter(u => {
      const meta = u.app_metadata || {};
      const rawMeta = u.raw_user_meta_data || {};
      return (
        meta.provider === 'apple' ||
        rawMeta.platform === 'ios' ||
        u.email?.includes('icloud') ||
        u.email?.includes('me.com')
      );
    });
    
    console.log('iOS users found:', iosUsers.length);
    iosUsers.slice(0, 5).forEach(u => {
      console.log('  -', u.email, u.created_at);
    });
  });
}).catch(e => console.error(e.message));
"

