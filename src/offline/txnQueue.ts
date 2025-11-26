import AsyncStorage from '@react-native-async-storage/async-storage';
import { createTransaction } from '../api/client';

const KEY = 'pendingTxns';

export async function enqueue(txn: any) {
  const buf = await AsyncStorage.getItem(KEY);
  const arr = buf ? JSON.parse(buf) : [];
  arr.push({ ...txn, _ts: Date.now() });
  await AsyncStorage.setItem(KEY, JSON.stringify(arr));
}

export async function drain(track?: (n: string, p?: any) => void) {
  const buf = await AsyncStorage.getItem(KEY);
  if (!buf) return;
  const arr = JSON.parse(buf);
  const next: any[] = [];
  for (const item of arr) {
    try {
      await createTransaction(item);
      track?.('txn_confirmed', { source: 'offline_sync' });
    } catch {
      next.push(item);
    }
  }
  if (next.length) await AsyncStorage.setItem(KEY, JSON.stringify(next));
  else await AsyncStorage.removeItem(KEY);
}
