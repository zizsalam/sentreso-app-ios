import { useEffect } from 'react';
import { ActivityIndicator, View, Text } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { supabase } from '@/services/supabaseClient';

export default function Index() {
  const params = useLocalSearchParams();

  useEffect(() => {
    (async () => {
      try {
        // Check if this is a password reset deep link
        const { access_token, refresh_token, type } = params;

        if (access_token && refresh_token && type === 'recovery') {
          console.log('Password reset deep link detected, redirecting to reset-password');
          router.replace('/reset-password');
          return;
        }

        // Normal session check
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          router.replace('/(tabs)');
        } else {
          router.replace('/login');
        }
      } catch {
        router.replace('/login');
      }
    })();
  }, [params]);

  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <ActivityIndicator />
      <Text style={{ marginTop: 12, color: '#6B7280' }}>Index: vérification de session…</Text>
    </View>
  );
}
