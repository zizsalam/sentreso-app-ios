import { supabase } from '@/services/supabaseClient';

export async function sendSupportEmail({ to, subject, text, html }: { to: string | string[]; subject: string; text?: string; html?: string }) {
  const { data: session } = await supabase.auth.getSession();
  const token = session.session?.access_token;
  if (!token) throw new Error('No auth session');

  const base = process.env.EXPO_PUBLIC_SUPABASE_URL;
  if (!base) throw new Error('Missing EXPO_PUBLIC_SUPABASE_URL');

  // Temporary: try the deployed slug with a trailing dash first, then fallback
  const tryPaths = [
    `${base}/functions/v1/send-email-`,
    `${base}/functions/v1/send-email`,
  ];

  let res = await fetch(tryPaths[0], {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      apikey: process.env.EXPO_PUBLIC_SUPABASE_ANON || '',
    },
    body: JSON.stringify({ to, subject, text, html }),
  });
  if (res.status === 404) {
    // Retry without the trailing dash
    res = await fetch(tryPaths[1], {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        apikey: process.env.EXPO_PUBLIC_SUPABASE_ANON || '',
      },
      body: JSON.stringify({ to, subject, text, html }),
    });
  }
  if (!res.ok) {
    const details = await res.text();
    throw new Error(`Mail send failed: ${res.status} ${details}`);
  }
  return res.json();
}
