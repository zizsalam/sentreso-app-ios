import { supabase } from '@/services/supabaseClient';

export type MerchantIdentity = {
  name: string;
  phone: string;
};

export async function getMerchantIdentity(): Promise<MerchantIdentity> {
  const { data } = await supabase.auth.getUser();
  const user = data?.user as any;

  const fallbackName = user?.user_metadata?.display_name || user?.user_metadata?.full_name || 'Commerçant';
  const fallbackPhone = user?.phone || user?.user_metadata?.phone || '';

  let name = fallbackName;
  let phone = fallbackPhone || '';
  if (user?.id) {
    const { data: prof } = await supabase
      .from('user_public_profile')
      .select('display_name, contact_phone')
      .eq('user_id', user.id)
      .maybeSingle();
    name = prof?.display_name || fallbackName;
    phone = prof?.contact_phone || fallbackPhone || '';
  }

  return { name, phone };
}

export async function saveMerchantIdentity(input: MerchantIdentity): Promise<void> {
  await supabase.rpc('save_merchant_identity', {
    p_display_name: input.name,
    p_phone: input.phone,
  });
}
