# 🔧 Solutions for Auto-Logout Issue

## 🎯 **ROOT CAUSES IDENTIFIED**

### 1. **Multiple Auth State Listeners** ⚠️
- `TransactionContext.tsx` has its own auth listener
- `_layout.tsx` has another auth listener
- `AuthContext.tsx` has a third auth listener
- **Result**: Conflicting state updates causing logout

### 2. **Aggressive Session Checking** ⚠️
- `app/index.tsx` checks session on every navigation
- Multiple `getSession()` calls can trigger logout
- **Result**: Session invalidation due to race conditions

### 3. **Router Replace Conflicts** ⚠️
- Multiple components calling `router.replace('/login')`
- **Result**: Navigation loops and session loss

---

## 🛠️ **SOLUTION 1: Consolidate Auth State Management**

### **Step 1: Create Single Auth Manager**

```typescript
// contexts/AuthManager.tsx
import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { supabase } from '@/services/supabaseClient';
import { router } from 'expo-router';

interface AuthState {
  user: any;
  session: any;
  loading: boolean;
}

interface AuthManagerContextType extends AuthState {
  signOut: () => Promise<void>;
  refreshSession: () => Promise<void>;
}

const AuthManagerContext = createContext<AuthManagerContextType | undefined>(undefined);

export function AuthManagerProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    session: null,
    loading: true,
  });

  useEffect(() => {
    let mounted = true;

    // Get initial session
    const getInitialSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) {
          console.error('❌ Session error:', error);
          return;
        }

        if (mounted) {
          setState({
            user: session?.user ?? null,
            session,
            loading: false,
          });

          // Navigate based on session
          if (session) {
            router.replace('/(tabs)');
          } else {
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

    getInitialSession();

    // Single auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('🔐 Auth state changed:', event, session?.user?.email);

        if (!mounted) return;

        setState({
          user: session?.user ?? null,
          session,
          loading: false,
        });

        // Handle navigation based on event
        switch (event) {
          case 'SIGNED_IN':
            router.replace('/(tabs)');
            break;
          case 'SIGNED_OUT':
            router.replace('/login');
            break;
          case 'TOKEN_REFRESHED':
            // Stay on current page, just update session
            break;
          default:
            // Handle other events if needed
            break;
        }
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    try {
      setState(prev => ({ ...prev, loading: true }));
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    } catch (error) {
      console.error('❌ Sign out error:', error);
      throw error;
    } finally {
      setState(prev => ({ ...prev, loading: false }));
    }
  };

  const refreshSession = async () => {
    try {
      const { data: { session }, error } = await supabase.auth.refreshSession();
      if (error) throw error;
      return session;
    } catch (error) {
      console.error('❌ Refresh session error:', error);
      throw error;
    }
  };

  return (
    <AuthManagerContext.Provider value={{
      ...state,
      signOut,
      refreshSession,
    }}>
      {children}
    </AuthManagerContext.Provider>
  );
}

export function useAuthManager() {
  const context = useContext(AuthManagerContext);
  if (context === undefined) {
    throw new Error('useAuthManager must be used within an AuthManagerProvider');
  }
  return context;
}
```

### **Step 2: Update TransactionContext**

```typescript
// contexts/TransactionContext.tsx - REMOVE auth listener
export function TransactionProvider({ children }: { children: ReactNode }) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const { session } = useAuthManager(); // Use centralized auth

  const load = async () => {
    if (!session) {
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
    } catch (e) {
      console.error('Failed to load transactions', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();

    // Subscribe to transaction changes only
    const unsubscribe = subscribeMyTransactions((row) => {
      setTransactions((prev) => {
        if (prev.find((p) => p.id === row.id)) return prev;
        const next: Transaction = {
          id: row.id,
          amount: row.amount,
          description: row.description ?? '',
          category: row.category ?? '',
          type: row.type,
          date: row.created_at.split('T')[0],
          createdAt: new Date(row.created_at),
        };
        return [next, ...prev];
      });
    });

    return () => {
      void unsubscribe();
    };
  }, [session]); // Reload when session changes

  // ... rest of the component
}
```

### **Step 3: Simplify App Layout**

```typescript
// app/_layout.tsx - REMOVE auth listener
export default function App() {
  return (
    <AuthManagerProvider>
      <UserProvider>
        <TransactionProvider>
          <Stack>
            <Stack.Screen name="index" options={{ headerShown: false }} />
            <Stack.Screen name="login" options={{ headerShown: false }} />
            <Stack.Screen name="register" options={{ headerShown: false }} />
            <Stack.Screen name="reset-password" options={{ headerShown: false }} />
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="+not-found" />
          </Stack>
        </TransactionProvider>
      </UserProvider>
    </AuthManagerProvider>
  );
}
```

### **Step 4: Simplify Index Screen**

```typescript
// app/index.tsx - REMOVE session checking
import { useEffect } from 'react';
import { ActivityIndicator, View, Text } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useAuthManager } from '@/contexts/AuthManager';

export default function Index() {
  const params = useLocalSearchParams();
  const { loading } = useAuthManager();

  useEffect(() => {
    // Only handle password reset deep links
    const { access_token, refresh_token, type } = params;

    if (access_token && refresh_token && type === 'recovery') {
      console.log('Password reset deep link detected');
      router.replace('/reset-password');
    }
  }, [params]);

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 16 }}>
        <ActivityIndicator />
        <Text style={{ marginTop: 12, color: '#6B7280' }}>Vérification de session…</Text>
      </View>
    );
  }

  return null; // AuthManager handles navigation
}
```

---

## 🛠️ **SOLUTION 2: Add Session Persistence Checks**

### **Add Session Validation**

```typescript
// services/sessionManager.ts
import { supabase } from './supabaseClient';

export class SessionManager {
  private static instance: SessionManager;
  private sessionCheckInterval: NodeJS.Timeout | null = null;

  static getInstance(): SessionManager {
    if (!SessionManager.instance) {
      SessionManager.instance = new SessionManager();
    }
    return SessionManager.instance;
  }

  startSessionMonitoring() {
    // Check session every 5 minutes
    this.sessionCheckInterval = setInterval(async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) {
          console.error('❌ Session check error:', error);
          return;
        }

        if (!session) {
          console.log('🔐 No active session, user should be logged out');
          // Don't force logout here, let auth state change handle it
        }
      } catch (error) {
        console.error('❌ Session monitoring error:', error);
      }
    }, 5 * 60 * 1000); // 5 minutes
  }

  stopSessionMonitoring() {
    if (this.sessionCheckInterval) {
      clearInterval(this.sessionCheckInterval);
      this.sessionCheckInterval = null;
    }
  }
}
```

---

## 🛠️ **SOLUTION 3: Improve Error Handling**

### **Add Network Error Handling**

```typescript
// services/supabaseClient.ts - Enhanced version
import { createClient } from '@supabase/supabase-js';
import NetInfo from '@react-native-community/netinfo';

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://avltdtbgantbxbrqdxge.supabase.co';
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF2bHRkdGJnYW50YnhicnFkeGdlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA4NjI5MjUsImV4cCI6MjA2NjQzODkyNX0.x_tYhcxmxENG_7qAimEWh7oi5nQSnrdp2fwyW1b4oqc';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
    // Add retry logic
    retryAttempts: 3,
    retryDelay: 1000,
  },
  global: {
    headers: {
      'X-Client-Info': 'sentreso-finance',
    },
  },
});

// Network status monitoring
let isOnline = true;
NetInfo.addEventListener(state => {
  isOnline = state.isConnected ?? false;
  console.log('🌐 Network status:', isOnline ? 'Online' : 'Offline');
});

// Enhanced session check with network awareness
export const checkSessionWithRetry = async (maxRetries = 3) => {
  for (let i = 0; i < maxRetries; i++) {
    try {
      if (!isOnline) {
        throw new Error('No network connection');
      }

      const { data: { session }, error } = await supabase.auth.getSession();
      if (error) throw error;

      return session;
    } catch (error) {
      console.error(`❌ Session check attempt ${i + 1} failed:`, error);

      if (i === maxRetries - 1) {
        throw error;
      }

      // Wait before retry
      await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
    }
  }
};
```

---

## 🛠️ **SOLUTION 4: Add Debug Logging**

### **Enhanced Auth Debugging**

```typescript
// utils/authDebugger.ts
export class AuthDebugger {
  private static logs: string[] = [];

  static log(message: string, data?: any) {
    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] ${message}`;

    console.log(logEntry, data);
    this.logs.push(logEntry);

    // Keep only last 50 logs
    if (this.logs.length > 50) {
      this.logs = this.logs.slice(-50);
    }
  }

  static getLogs(): string[] {
    return [...this.logs];
  }

  static clearLogs() {
    this.logs = [];
  }

  static exportLogs(): string {
    return this.logs.join('\n');
  }
}

// Usage in AuthManager
import { AuthDebugger } from '@/utils/authDebugger';

// In onAuthStateChange
const { data: { subscription } } = supabase.auth.onAuthStateChange(
  async (event, session) => {
    AuthDebugger.log(`Auth state changed: ${event}`, {
      hasSession: !!session,
      userId: session?.user?.id,
      email: session?.user?.email,
    });

    // ... rest of the logic
  }
);
```

---

## 🚀 **IMPLEMENTATION PRIORITY**

### **Phase 1: Quick Fix** (1-2 hours)
1. ✅ Remove duplicate auth listeners
2. ✅ Consolidate auth state management
3. ✅ Add debug logging

### **Phase 2: Robust Solution** (4-6 hours)
1. ✅ Implement AuthManager
2. ✅ Add session monitoring
3. ✅ Improve error handling
4. ✅ Add network awareness

### **Phase 3: Testing** (2-3 hours)
1. ✅ Test with network interruptions
2. ✅ Test with app backgrounding
3. ✅ Test with long idle periods
4. ✅ Verify no auto-logout

---

## 📋 **TESTING CHECKLIST**

### **Test Scenarios**
- [ ] App backgrounding/foregrounding
- [ ] Network disconnection/reconnection
- [ ] Long idle periods (30+ minutes)
- [ ] Multiple rapid navigation
- [ ] Session refresh scenarios
- [ ] Manual logout/login cycles

### **Expected Behavior**
- [ ] No auto-logout during normal usage
- [ ] Graceful handling of network issues
- [ ] Proper session persistence
- [ ] Clean navigation flow

---

## 🎯 **RECOMMENDED IMMEDIATE ACTION**

**Start with Solution 1** - it addresses the root cause (multiple auth listeners) and should resolve the auto-logout issue immediately.

The key is to have **ONE** auth state manager that handles all session changes and navigation, instead of multiple competing listeners.

---

**© 2025 Sentreso Technologies**
*Stable authentication for stable finances* 🔐💰
