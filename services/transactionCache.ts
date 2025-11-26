/* eslint-disable */
import { Transaction } from '@/contexts/TransactionContext';
import { Platform } from 'react-native';

const TRANSACTION_CACHE_KEY = 'transaction_cache';
const CACHE_EXPIRY_KEY = 'transaction_cache_expiry';
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

type StorageAdapter = {
  getItem: (key: string) => Promise<string | null>;
  setItem: (key: string, value: string) => Promise<void>;
  removeItem: (key: string) => Promise<void>;
  multiSet?: (entries: [string, string][]) => Promise<void>;
  multiGet?: (keys: string[]) => Promise<[string, string | null][]>;
};

const isWeb = Platform.OS === 'web';

const webStorage: StorageAdapter = {
  async getItem(key) {
    if (typeof window === 'undefined') return null;
    return window.localStorage.getItem(key);
  },
  async setItem(key, value) {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(key, value);
  },
  async removeItem(key) {
    if (typeof window === 'undefined') return;
    window.localStorage.removeItem(key);
  },
  async multiSet(entries) {
    if (typeof window === 'undefined') return;
    entries.forEach(([key, value]) => window.localStorage.setItem(key, value));
  },
  async multiGet(keys) {
    if (typeof window === 'undefined') return keys.map((key) => [key, null]);
    return keys.map((key) => [key, window.localStorage.getItem(key)] as [string, string | null]);
  },
};

const nativeAsyncStorage = !isWeb
  ? // eslint-disable-next-line import/no-commonjs
    require('@react-native-async-storage/async-storage').default
  : null;

const storage: StorageAdapter = isWeb
  ? webStorage
  : {
      getItem: nativeAsyncStorage.getItem,
      setItem: nativeAsyncStorage.setItem,
      removeItem: nativeAsyncStorage.removeItem,
      multiSet: nativeAsyncStorage.multiSet,
      multiGet: nativeAsyncStorage.multiGet,
    };

export async function cacheTransactions(transactions: Transaction[]): Promise<void> {
  try {
    console.log('📱 Android: Attempting to cache transactions...', transactions.length);
    await storage.setItem(TRANSACTION_CACHE_KEY, JSON.stringify(transactions));
    await storage.setItem(CACHE_EXPIRY_KEY, Date.now().toString());
    console.log('📱 Android: Successfully cached transactions:', transactions.length);
  } catch (error) {
    console.error('❌ Android: Failed to cache transactions:', error);
    if (storage.multiSet) {
      try {
        console.log('📱 Android: Trying alternative storage method...');
        await storage.multiSet([
          [TRANSACTION_CACHE_KEY, JSON.stringify(transactions)],
          [CACHE_EXPIRY_KEY, Date.now().toString()]
        ]);
        console.log('📱 Android: Alternative storage successful');
      } catch (altError) {
        console.error('❌ Android: Alternative storage also failed:', altError);
      }
    }
  }
}

export async function loadCachedTransactions(): Promise<Transaction[]> {
  try {
    console.log('📱 Android: Attempting to load cached transactions...');
    const cached = await storage.getItem(TRANSACTION_CACHE_KEY);
    const expiry = await storage.getItem(CACHE_EXPIRY_KEY);

    console.log('📱 Android: Cache check - cached:', !!cached, 'expiry:', !!expiry);

    if (!cached || !expiry) {
      console.log('📱 Android: No cached transactions found');
      return [];
    }

    const cacheAge = Date.now() - parseInt(expiry);
    console.log('📱 Android: Cache age:', cacheAge, 'ms');

    if (cacheAge > CACHE_DURATION) {
      console.log('📱 Android: Transaction cache expired, clearing...');
      await clearTransactionCache();
      return [];
    }

    const transactions = JSON.parse(cached).map((t: any) => ({
      ...t,
      createdAt: new Date(t.createdAt), // Re-hydrate Date objects
      lineItems: t.lineItems ?? [],
    }));
    console.log('📱 Android: Successfully loaded cached transactions:', transactions.length);
    return transactions;
  } catch (error) {
    console.error('❌ Android: Failed to load cached transactions:', error);
    if (storage.multiGet) {
      try {
        console.log('📱 Android: Trying alternative loading method...');
        const [cachedEntry, expiryEntry] = await storage.multiGet([TRANSACTION_CACHE_KEY, CACHE_EXPIRY_KEY]);

        const cachedValue = cachedEntry?.[1];
        const expiryValue = expiryEntry?.[1];

        if (!cachedValue || !expiryValue) {
          console.log('📱 Android: No cached data found with alternative method');
          return [];
        }

        const cacheAge = Date.now() - parseInt(expiryValue);
        if (cacheAge > CACHE_DURATION) {
          console.log('📱 Android: Cache expired with alternative method');
          return [];
        }

        const transactions = JSON.parse(cachedValue).map((t: any) => ({
          ...t,
          createdAt: new Date(t.createdAt),
          lineItems: t.lineItems ?? [],
        }));
        console.log('📱 Android: Alternative loading successful:', transactions.length);
        return transactions;
      } catch (altError) {
        console.error('❌ Android: Alternative loading also failed:', altError);
      }
    }
    return [];
  }
}

export async function clearTransactionCache(): Promise<void> {
  try {
    await storage.removeItem(TRANSACTION_CACHE_KEY);
    await storage.removeItem(CACHE_EXPIRY_KEY);
    console.log('📱 Cleared transaction cache');
  } catch (error) {
    console.error('❌ Failed to clear transaction cache:', error);
  }
}

export async function getCacheInfo(): Promise<{ count: number; age: number; expired: boolean }> {
  try {
    const cached = await storage.getItem(TRANSACTION_CACHE_KEY);
    const expiry = await storage.getItem(CACHE_EXPIRY_KEY);

    if (!cached || !expiry) {
      return { count: 0, age: 0, expired: true };
    }

    const transactions = JSON.parse(cached);
    const cacheAge = Date.now() - parseInt(expiry);
    const expired = cacheAge > CACHE_DURATION;

    return {
      count: transactions.length,
      age: cacheAge,
      expired
    };
  } catch (error) {
    console.error('❌ Failed to get cache info:', error);
    return { count: 0, age: 0, expired: true };
  }
}
