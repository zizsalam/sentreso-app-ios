// services/transactions.ts
import { supabase } from './supabaseClient';

export type TransactionLineItem = {
  id: string;
  name: string;
  quantity: number;
  unitPrice: number;
  total: number;
};

export type Tx = {
  id: string;
  user_id: string;
  amount: number;
  type: 'income' | 'expense';
  category: string | null;
  description: string | null;
  created_at: string;
  status?: 'active' | 'void';
  replaces_id?: string | null;
  // Legacy schema support
  kind?: 'sale' | 'expense';
  amount_cfa?: number;
  occurred_at?: string;
  source?: string | null;
  line_items?: TransactionLineItem[];
};

// Centralized normalization function
function normalizeRow(row: any): Tx {
  const kindToType = (k?: string | null): 'income' | 'expense' => {
    switch (k) {
      case 'sale':
      case 'income':
        return 'income'
      case 'expense':
      case 'purchase':
      case 'withdrawal':
        return 'expense'
      default:
        return 'expense'
    }
  }

  let lineItems: TransactionLineItem[] | undefined;
  const rawSource = row.source ?? row.metadata;

  if (typeof rawSource === 'string') {
    try {
      const parsed = JSON.parse(rawSource);
      if (Array.isArray(parsed?.lineItems)) {
        lineItems = parsed.lineItems;
      }
    } catch (err) {
      console.warn('⚠️ Unable to parse transaction source JSON', err);
    }
  } else if (rawSource?.lineItems) {
    lineItems = rawSource.lineItems;
  }

  if (lineItems) {
    lineItems = lineItems.map((item) => ({
      ...item,
      quantity: Number(item.quantity) || 0,
      unitPrice: Number(item.unitPrice) || 0,
      total: Number(item.total) || (Number(item.quantity) || 0) * (Number(item.unitPrice) || 0),
    }));
  }

  return {
    id: row.id,
    user_id: row.user_id,
    amount: row.amount ?? row.amount_cfa ?? 0,
    type: row.type ?? kindToType(row.kind),
    category: row.category ?? null,
    description: row.description ?? '',
    created_at: row.created_at ?? row.occurred_at,
    // Keep legacy fields for reference
    kind: row.kind,
    amount_cfa: row.amount_cfa,
    occurred_at: row.occurred_at,
    source: typeof rawSource === 'string' ? rawSource : rawSource ? JSON.stringify(rawSource) : null,
    line_items: lineItems,
  }
}

export async function fetchMyTransactions(max = 200, userId?: string): Promise<Tx[]> {
  const { data: { user } } = userId
    ? { data: { user: { id: userId } as any } }
    : await supabase.auth.getUser()

  if (!user?.id) {
    console.log('❌ No user ID available for fetching transactions');
    return [];
  }

  try {
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', user.id)
      .order('occurred_at', { ascending: false })
      .order('created_at', { ascending: false })
      .range(0, Math.max(0, max - 1));

    if (error) {
      console.error('❌ Failed to fetch transactions:', error);
      return [];
    }

    return (data ?? []).map(normalizeRow);
  } catch (error) {
    console.error('❌ Failed to fetch transactions:', error);
    return [];
  }
}

export async function createTransaction(tx: Omit<Tx, 'id' | 'user_id' | 'created_at'> & { line_items?: TransactionLineItem[] }): Promise<Tx> {
  const { data: { user } } = await supabase.auth.getUser();

  if (!user?.id) {
    throw new Error('Utilisateur non connecté');
  }

  const { line_items, ...rest } = tx;
  const payload = {
    ...rest,
    user_id: user.id,
    // prefer occurred_at as business date, fallback to server default for created_at
    occurred_at: (tx as any).occurred_at ?? new Date().toISOString(),
    source: line_items?.length ? JSON.stringify({ lineItems: line_items }) : null,
  };

  const { data, error } = await supabase
    .from('transactions')
    .insert([payload])
    .select('id,user_id,amount,type,category,description,created_at,occurred_at')
    .single();

  if (error) throw error;
  return normalizeRow(data);
}

export function subscribeMyTransactions(onChange: (payload: { eventType: string; transaction: Tx }) => void) {
  const channel = supabase
    .channel('tx-stream')
    .on(
      'postgres_changes',
      {
        event: '*',                 // INSERT/UPDATE/DELETE (void/replace flows)
        schema: 'public',
        table: 'transactions',
        // Optional: filter to current user for less noise
        // filter: `user_id=eq.${currentUserId}`
      },
      (payload) => {
        const row = payload.new ?? payload.old;
        if (!row) return;
        onChange({
          eventType: payload.eventType,
          transaction: normalizeRow(row),
        });
      }
    )
    .subscribe();
  return () => supabase.removeChannel(channel);
}

export async function deleteTransaction(transactionId: string): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user?.id) {
    throw new Error('Utilisateur non connecté');
  }

  const { error } = await supabase
    .from('transactions')
    .delete()
    .eq('id', transactionId)
    .eq('user_id', user.id);

  if (error) throw error;
}

export async function voidTransaction(originalId: string, reason?: string) {
  const { error } = await supabase.rpc('void_transaction', {
    p_original: originalId,
    p_void_reason: reason ?? null,
  });
  if (error) throw error;
}

export async function replaceTransaction(params: {
  originalId: string;
  amount: number;
  type: 'income' | 'expense';
  category?: string | null;
  description?: string | null;
  occurred_at?: string;
  void_reason?: string;
}): Promise<Tx> {
  // Try RPC first (preferred), then fallback to client-side void+insert
  const rpc = await supabase.rpc('replace_transaction', {
    p_original: params.originalId,
    p_amount: params.amount,
    p_type: params.type,
    p_category: params.category ?? null,
    p_description: params.description ?? null,
    p_occurred_at: params.occurred_at ?? new Date().toISOString(),
    p_void_reason: params.void_reason ?? null,
  });
  if (!rpc.error && rpc.data) return rpc.data as Tx;

  // Fallback path when function is missing/not deployed
  const errMsg = rpc.error?.message?.toLowerCase() || '';
  const functionMissing = errMsg.includes('could not find the function') || errMsg.includes('schema cache');
  if (!functionMissing) {
    throw rpc.error!;
  }

  // 1) void original (best-effort, ignore if status column missing)
  try {
    await supabase
      .from('transactions')
      .update({ status: 'void', voided_at: new Date().toISOString(), void_reason: params.void_reason ?? null } as any)
      .eq('id', params.originalId);
  } catch {}

  // 2) insert replacement (include replaces_id/status when available)
  let insertPayload: any = {
    amount: params.amount,
    type: params.type,
    category: params.category ?? null,
    description: params.description ?? null,
    created_at: params.occurred_at ?? new Date().toISOString(),
  };
  // include optional columns; DB will ignore unknown keys
  insertPayload.replaces_id = params.originalId;
  insertPayload.status = 'active';

  // try with optional cols; if schema doesn't have them, retry minimal payload
  let ins = await supabase
    .from('transactions')
    .insert([insertPayload])
    .select('id,user_id,amount,type,category,description,created_at,occurred_at')
    .single();
  if (!ins.error && ins.data) return ins.data as Tx;

  const msg = ins.error?.message?.toLowerCase() || '';
  const missingOptional = msg.includes("replaces_id") || msg.includes("status");
  if (!missingOptional) throw ins.error!;

  // retry minimal
  insertPayload = {
    amount: params.amount,
    type: params.type,
    category: params.category ?? null,
    description: params.description ?? null,
    created_at: params.occurred_at ?? new Date().toISOString(),
  };
  ins = await supabase
    .from('transactions')
    .insert([insertPayload])
    .select('id,user_id,amount,type,category,description,created_at,occurred_at')
    .single();
  if (ins.error) throw ins.error;
  return ins.data as Tx;
}
