#!/bin/bash
echo "🔍 Checking for TestFlight users..."

node -e "
import('@supabase/supabase-js').then(m => {
  const client = m.createClient(
    'https://avltdtbgantbxbrqdxge.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF2bHRkdGJnYW50YnhicnFkeGdlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MDg2MjkyNSwiZXhwIjoyMDY2NDM4OTI1fQ.uTWh8tp56TrZToKbcbuHdisxFxI38PKWvmZQ5WTw_Tk'
  );
  
  // Get ALL users with pagination
  let allUsers = [];
  let page = 1;
  let hasMore = true;
  
  async function getAllUsers() {
    while (hasMore) {
      const { data, error } = await client.auth.admin.listUsers({
        page: page,
        perPage: 1000
      });
      
      if (error) {
        console.error('Error:', error.message);
        break;
      }
      
      if (data && data.users && data.users.length > 0) {
        allUsers = [...allUsers, ...data.users];
        hasMore = data.users.length === 1000;
        page++;
      } else {
        hasMore = false;
      }
    }
    
    console.log('Total users:', allUsers.length);
    
    // Group by email domain
    const domainCount = {};
    allUsers.forEach(u => {
      const domain = u.email?.split('@')[1] || 'unknown';
      domainCount[domain] = (domainCount[domain] || 0) + 1;
    });
    
    console.log('\nUsers by email domain:');
    Object.entries(domainCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .forEach(([domain, count]) => {
        console.log(\`  \${domain}: \${count}\`);
      });
    
    // Show recent iOS users
    const icloudUsers = allUsers.filter(u => u.email?.includes('icloud')).length;
    console.log(\`\nTotal iCloud users: \${icloudUsers}\`);
    
    // Show users from last 7 days
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const recentUsers = allUsers.filter(u => new Date(u.created_at) >= sevenDaysAgo);
    console.log(\`Users from last 7 days: \${recentUsers.length}\`);
    
    recentUsers.slice(0, 5).forEach(u => {
      console.log(\`  - \${u.email} (\${new Date(u.created_at).toLocaleDateString()})\`);
    });
  }
  
  getAllUsers().catch(e => console.error('Error:', e.message));
}).catch(e => console.error(e));
"

