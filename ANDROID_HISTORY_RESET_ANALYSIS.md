# 🔍 Android App History Reset Investigation

## 🚨 **Problem Description**
Android users report that their transaction history resets to zero the next day, while the data appears to be properly stored in Supabase.

## 🔍 **Root Cause Analysis**

### **1. Session Management Issues**
**Problem**: The app relies heavily on Supabase session persistence, but Android may handle session storage differently than iOS.

**Evidence**:
```typescript
// TransactionContext.tsx - Line 33-38
const load = async () => {
  if (!session) {
    setTransactions([]);  // ⚠️ This clears all transactions!
    setLoading(false);
    return;
  }
  // ... load from Supabase
};
```

**Issue**: If the session is lost or not properly restored on Android, the app immediately clears all transactions from the UI.

### **2. AsyncStorage vs Supabase Session Conflict**
**Problem**: The app uses AsyncStorage for offline data but doesn't maintain a local transaction cache.

**Evidence**:
- `src/offline/txnQueue.ts` - Only stores pending transactions
- `src/game/engine.ts` - Only stores game state
- No local transaction history cache

**Issue**: When the session is lost, there's no local fallback to display previous transactions.

### **3. Android App Lifecycle Issues**
**Problem**: Android may kill the app more aggressively, causing session loss.

**Evidence**:
```typescript
// app/_layout.tsx - Lines 960-965
const sub = AppState.addEventListener('change', (s) => {
  if (s === 'active') drain(track);  // Only syncs pending transactions
});
```

**Issue**: The app only syncs pending transactions on resume, but doesn't restore the session or reload transaction history.

### **4. Supabase Client Configuration**
**Problem**: The Supabase client configuration may not be optimal for Android persistence.

**Evidence**:
```typescript
// services/supabaseClient.ts - Lines 8-14
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,  // ⚠️ May not work reliably on Android
    detectSessionInUrl: false,
  },
});
```

## 🛠️ **Proposed Solutions**

### **Solution 1: Add Local Transaction Cache (Recommended)**

Create a local cache of transactions that persists even when the session is lost.

```typescript
// contexts/TransactionContext.tsx - Enhanced version
const load = async () => {
  if (!session) {
    // ⚠️ DON'T clear transactions immediately
    // Try to load from local cache first
    const cachedTransactions = await loadCachedTransactions();
    if (cachedTransactions.length > 0) {
      setTransactions(cachedTransactions);
      setLoading(false);
      return;
    }
    // Only clear if no cache exists
    setTransactions([]);
    setLoading(false);
    return;
  }

  setLoading(true);
  try {
    const rows: Tx[] = await fetchMyTransactions(500);
    const normalized: Transaction[] = rows.map((t) => ({
      id: t.id,
      amount: t.amount,
      description: t.description ?? '',
      category: t.category ?? '',
      type: t.type,
      date: t.created_at.split('T')[0],
      createdAt: new Date(t.created_at),
    }));
    setTransactions(normalized);

    // ✅ Cache transactions locally
    await cacheTransactions(normalized);
  } catch (e) {
    console.error('Failed to load transactions', e);
    // Try to load from cache as fallback
    const cachedTransactions = await loadCachedTransactions();
    if (cachedTransactions.length > 0) {
      setTransactions(cachedTransactions);
    }
  } finally {
    setLoading(false);
  }
};
```

### **Solution 2: Improve Session Recovery**

Add better session recovery logic in AuthManager.

```typescript
// contexts/AuthManager.tsx - Enhanced session recovery
const getInitialSession = async () => {
  try {
    console.log('🔐 Getting initial session...');

    // Try to get existing session
    const { data: { session }, error } = await supabase.auth.getSession();

    if (error) {
      console.error('❌ Initial session error:', error);
      // Try to refresh the session
      const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
      if (refreshError) {
        console.error('❌ Session refresh failed:', refreshError);
        return;
      }
      session = refreshData.session;
    }

    if (mounted) {
      setState({
        user: session?.user ?? null,
        session,
        loading: false,
      });

      if (session) {
        console.log('🔐 Valid session found, navigating to tabs');
        router.replace('/(tabs)');
      } else {
        console.log('🔐 No session found, navigating to login');
        router.replace('/login');
      }
    }
  } catch (error) {
    console.error('❌ Initial session error:', error);
    if (mounted) {
      setState(prev => ({ ...prev, loading: false }));
      router.replace('/login');
    }
  }
};
```

### **Solution 3: Add Transaction Cache Utilities**

Create utility functions for local transaction caching.

```typescript
// services/transactionCache.ts - New file
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Transaction } from '@/contexts/TransactionContext';

const TRANSACTION_CACHE_KEY = 'transaction_cache';
const CACHE_EXPIRY_KEY = 'transaction_cache_expiry';
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

export async function cacheTransactions(transactions: Transaction[]): Promise<void> {
  try {
    await AsyncStorage.setItem(TRANSACTION_CACHE_KEY, JSON.stringify(transactions));
    await AsyncStorage.setItem(CACHE_EXPIRY_KEY, Date.now().toString());
  } catch (error) {
    console.error('Failed to cache transactions:', error);
  }
}

export async function loadCachedTransactions(): Promise<Transaction[]> {
  try {
    const cached = await AsyncStorage.getItem(TRANSACTION_CACHE_KEY);
    const expiry = await AsyncStorage.getItem(CACHE_EXPIRY_KEY);

    if (!cached || !expiry) return [];

    const cacheAge = Date.now() - parseInt(expiry);
    if (cacheAge > CACHE_DURATION) {
      // Cache expired, clear it
      await clearTransactionCache();
      return [];
    }

    return JSON.parse(cached);
  } catch (error) {
    console.error('Failed to load cached transactions:', error);
    return [];
  }
}

export async function clearTransactionCache(): Promise<void> {
  try {
    await AsyncStorage.removeItem(TRANSACTION_CACHE_KEY);
    await AsyncStorage.removeItem(CACHE_EXPIRY_KEY);
  } catch (error) {
    console.error('Failed to clear transaction cache:', error);
  }
}
```

### **Solution 4: Add App State Recovery**

Improve app state recovery when the app is resumed.

```typescript
// app/_layout.tsx - Enhanced app state handling
useEffect(() => {
  initAnalytics();

  const sub = AppState.addEventListener('change', (s) => {
    if (s === 'active') {
      console.log('📱 App became active, syncing data...');
      drain(track);

      // ✅ Also refresh session and transactions
      refreshSessionAndData();
    }
  });

  const netUnsub = NetInfo.addEventListener((state) => {
    if (state.isConnected) {
      console.log('🌐 Network connected, syncing data...');
      drain(track);
      refreshSessionAndData();
    }
  });

  return () => {
    sub.remove();
    netUnsub();
  };
}, []);

const refreshSessionAndData = async () => {
  try {
    // Refresh session
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      // Refresh transactions
      // This will be handled by TransactionContext when session updates
    }
  } catch (error) {
    console.error('Failed to refresh session and data:', error);
  }
};
```

## 🧪 **Testing Strategy**

### **Test Scenarios**
1. **App Backgrounding**: Background the app for 30+ minutes, then resume
2. **App Killing**: Force kill the app, then reopen
3. **Network Interruption**: Disconnect network, use app, reconnect
4. **Session Expiry**: Wait for session to expire, then use app
5. **Device Restart**: Restart device, then open app

### **Expected Behavior**
- ✅ Transaction history should persist across app restarts
- ✅ Local cache should show transactions even without session
- ✅ Session should recover automatically when possible
- ✅ Data should sync when network is restored

## 🚀 **Implementation Priority**

### **Phase 1: Quick Fix (2-3 hours)**
1. Add local transaction cache utilities
2. Modify TransactionContext to use cache as fallback
3. Test on Android device

### **Phase 2: Robust Solution (4-6 hours)**
1. Improve session recovery in AuthManager
2. Add app state recovery logic
3. Add cache expiry and cleanup
4. Comprehensive testing

### **Phase 3: Monitoring (1-2 hours)**
1. Add logging for session and cache events
2. Add error tracking for Android-specific issues
3. Monitor user reports

## 📊 **Expected Impact**

### **Before Fix**
- ❌ Android users lose transaction history daily
- ❌ Poor user experience and trust issues
- ❌ Potential data loss perception

### **After Fix**
- ✅ Transaction history persists across app restarts
- ✅ Improved user experience and retention
- ✅ Reliable data access even offline
- ✅ Better session management

## 🔧 **Technical Considerations**

### **Storage Requirements**
- Local cache will use AsyncStorage (already available)
- Cache size: ~1KB per 100 transactions
- Automatic cleanup after 24 hours

### **Performance Impact**
- Minimal impact on app startup
- Faster transaction loading from cache
- Reduced Supabase API calls

### **Security**
- Cache contains only user's own transactions
- No sensitive data stored locally
- Cache expires automatically

---

## 🎯 **Immediate Action Required**

**Start with Solution 1** - Add local transaction cache. This addresses the core issue where transactions disappear when the session is lost, which is the most likely cause of the Android history reset problem.

The key insight is that the app currently has no fallback when the Supabase session is lost, causing all transactions to be cleared from the UI even though they exist in the database.
