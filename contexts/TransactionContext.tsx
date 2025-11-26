import React, { createContext, useContext, useState, ReactNode, useEffect, useMemo } from 'react';
import { fetchMyTransactions, createTransaction as createTx, subscribeMyTransactions, deleteTransaction as deleteTx, Tx, TransactionLineItem } from '../services/transactions';
import { cacheTransactions, loadCachedTransactions } from '@/services/transactionCache';
import { useAuthManager } from './AuthManager';

export interface Transaction {
  id: string;
  amount: number;
  description: string;
  category: string;
  type: 'income' | 'expense';
  date: string;
  createdAt: Date;
  lineItems?: TransactionLineItem[];
}

interface TransactionContextType {
  transactions: Transaction[];
  addTransaction: (transaction: Omit<Transaction, 'id' | 'createdAt'>) => void;
  deleteTransaction: (transactionId: string) => Promise<void>;
  getTotalBalance: () => number;
  getMonthlyIncome: () => number;
  getMonthlyExpenses: () => number;
  getRecentTransactions: (limit?: number) => Transaction[];
  syncWithSupabase: () => Promise<void>;
  getCacheInfo: () => Promise<{ count: number; age: number; expired: boolean }>;
  forceReloadFromCache: () => Promise<void>;
  loadTransactionsForUser: (userId: string) => Promise<void>;
}

const TransactionContext = createContext<TransactionContextType | undefined>(undefined);

export function TransactionProvider({ children }: { children: ReactNode }) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const { session } = useAuthManager();

  const load = async () => {
    console.log('📱 Loading transactions...', { hasSession: !!session });

    // Always try to load from cache first (regardless of session)
    console.log('📱 Attempting to load from cache...');
    try {
      const cachedTransactions = await loadCachedTransactions();
      console.log('📱 Cache result:', cachedTransactions.length, 'transactions');

      if (cachedTransactions.length > 0) {
        console.log('📱 Loaded transactions from cache:', cachedTransactions.length);
        setTransactions(cachedTransactions);
        setLoading(false);

        // If we have a session, also try to sync with Supabase in background
        if (session) {
          console.log('📱 Syncing with Supabase in background...');
          syncWithSupabaseInBackground();
        }
        return;
      }
    } catch (cacheError) {
      console.error('❌ Cache loading failed:', cacheError);
    }

    // No cache available or cache failed
    if (!session) {
      console.log('📱 No session and no cache, clearing UI');
      setTransactions([]);
      setLoading(false);
      return;
    }

    // Try to load from Supabase
    setLoading(true);
    try {
      console.log('📱 Loading transactions from Supabase...');
      const userId = session?.user?.id;
      console.log('📱 User ID from session:', userId);

      if (!userId) {
        console.error('❌ No user ID available from session');
        setTransactions([]);
        setLoading(false);
        return;
      }

      const rows: Tx[] = await fetchMyTransactions(500, userId);
      console.log('📱 Raw transactions from Supabase:', rows.length);

      const normalized: Transaction[] = rows.map((t) => ({
        id: t.id,
        amount: t.amount,
        description: t.description ?? '',
        category: t.category ?? '',
        type: t.type,
        date: t.created_at.split('T')[0],
        createdAt: new Date(t.created_at),
        lineItems: t.line_items ?? [],
      }));

      console.log('📱 Normalized transactions:', normalized.length);
      console.log('📱 Setting transactions in state...');
      setTransactions(normalized);

      // Cache transactions locally for offline access
      await cacheTransactions(normalized);
      console.log('📱 Cached transactions for offline access');
    } catch (e) {
      console.error('❌ Failed to load transactions from Supabase:', e);
      // Keep existing transactions if any, don't clear them
      console.log('📱 Keeping existing transactions due to Supabase error');
    } finally {
      setLoading(false);
    }
  };

  const syncWithSupabaseInBackground = async () => {
    try {
      console.log('📱 Background sync with Supabase...');
      const userId = session?.user?.id;

      if (!userId) {
        console.log('❌ No user ID for background sync, skipping');
        return;
      }

      const rows: Tx[] = await fetchMyTransactions(500, userId);
      console.log('📱 Background sync fetched:', rows.length, 'transactions');

      const normalized: Transaction[] = rows.map((t) => ({
        id: t.id,
        amount: t.amount,
        description: t.description ?? '',
        category: t.category ?? '',
        type: t.type,
        date: t.created_at.split('T')[0],
        createdAt: new Date(t.created_at),
        lineItems: t.line_items ?? [],
      }));

      // Update transactions and cache
      setTransactions(normalized);
      await cacheTransactions(normalized);
      console.log('📱 Background sync completed:', normalized.length);
    } catch (e) {
      console.error('❌ Background sync failed:', e);
    }
  };

  // Auto-cache transactions whenever they change
  useEffect(() => {
    if (transactions.length > 0) {
      console.log('📱 Auto-caching transactions on change:', transactions.length);
      cacheTransactions(transactions).catch(error => {
        console.error('❌ Auto-cache failed:', error);
      });
    }
  }, [transactions]);

  useEffect(() => {
    load();

    // Only subscribe to transactions if we have a session
    if (!session) {
      return;
    }

    const unsubscribe = subscribeMyTransactions(({ eventType, transaction: row }) => {
      setTransactions((prev) => {
        const formatted: Transaction = {
          id: row.id,
          amount: row.amount,
          description: row.description ?? '',
          category: row.category ?? '',
          type: row.type,
          date: row.created_at.split('T')[0],
          createdAt: new Date(row.created_at),
          lineItems: row.line_items ?? [],
        };

        if (eventType === 'DELETE') {
          const updated = prev.filter(t => t.id !== row.id);
          cacheTransactions(updated).catch(err => console.error('❌ Failed to cache after delete event:', err));
          return updated;
        }

        // For INSERT / UPDATE, replace existing entry if present
        const withoutCurrent = prev.filter(t => t.id !== row.id);
        const updated = [formatted, ...withoutCurrent];
        cacheTransactions(updated).catch(err => console.error('❌ Failed to cache after upsert event:', err));
        return updated;
      });
    });
    return () => {
      void unsubscribe();
    };
  }, [session]); // Reload when session changes

  // Additional effect to ensure cache is always up to date
  useEffect(() => {
    if (transactions.length > 0) {
      // Cache transactions whenever they change
      cacheTransactions(transactions);
      console.log('📱 Auto-cached transactions on change:', transactions.length);
    }
  }, [transactions]);

  const addTransaction = async (transactionData: Omit<Transaction, 'id' | 'createdAt'>) => {
    const created = await createTx({
      amount: transactionData.amount,
      description: transactionData.description,
      category: transactionData.category,
      type: transactionData.type,
      line_items: transactionData.lineItems ?? [],
    } as any);
    const next: Transaction = {
      id: created.id,
      amount: created.amount,
      description: created.description ?? '',
      category: created.category ?? '',
      type: created.type,
      date: created.created_at.split('T')[0],
      createdAt: new Date(created.created_at),
      lineItems: created.line_items ?? transactionData.lineItems ?? [],
    };
    setTransactions(prev => {
      const updated = [next, ...prev];
      // Cache the updated transaction list
      cacheTransactions(updated);
      return updated;
    });
  };

  const deleteTransaction = async (transactionId: string) => {
    try {
      await deleteTx(transactionId);
      setTransactions(prev => {
        const updated = prev.filter(t => t.id !== transactionId);
        // Update cache after deletion (async, but don't block)
        cacheTransactions(updated).catch(err => {
          console.error('❌ Failed to update cache after deletion:', err);
        });
        return updated;
      });
    } catch (error) {
      console.error('❌ Failed to delete transaction:', error);
      throw error;
    }
  };

  const getTotalBalance = () => {
    return transactions.reduce((total, transaction) => {
      return transaction.type === 'income'
        ? total + transaction.amount
        : total - transaction.amount;
    }, 0);
  };

  const getMonthlyIncome = () => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    // TEMPORARY: Show all income transactions to debug
    const allIncome = transactions
      .filter(t => t.type === 'income')
      .reduce((total, t) => total + t.amount, 0);

    const monthlyIncome = transactions
      .filter(t => {
        const transactionDate = new Date(t.createdAt);
        const isIncome = t.type === 'income';
        const isCurrentMonth = transactionDate.getMonth() === currentMonth;
        const isCurrentYear = transactionDate.getFullYear() === currentYear;

        console.log('📊 Income filter:', {
          description: t.description,
          amount: t.amount,
          type: t.type,
          createdAt: t.createdAt,
          transactionMonth: transactionDate.getMonth(),
          currentMonth,
          transactionYear: transactionDate.getFullYear(),
          currentYear,
          isIncome,
          isCurrentMonth,
          isCurrentYear,
          passes: isIncome && isCurrentMonth && isCurrentYear
        });

        return isIncome && isCurrentMonth && isCurrentYear;
      })
      .reduce((total, t) => total + t.amount, 0);

    console.log('📊 Monthly Income Result:', {
      totalTransactions: transactions.length,
      currentMonth,
      currentYear,
      monthlyIncome,
      allIncome,
      allIncomeTransactions: transactions.filter(t => t.type === 'income').length
    });

    // TEMPORARY: Return all income if monthly is 0 but we have income transactions
    if (monthlyIncome === 0 && allIncome > 0) {
      console.log('📊 TEMPORARY FIX: Returning all income instead of monthly');
      return allIncome;
    }

    return monthlyIncome;
  };

  const getMonthlyExpenses = () => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    // TEMPORARY: Show all expense transactions to debug
    const allExpenses = transactions
      .filter(t => t.type === 'expense')
      .reduce((total, t) => total + t.amount, 0);

    const monthlyExpenses = transactions
      .filter(t => {
        const transactionDate = new Date(t.createdAt);
        const isExpense = t.type === 'expense';
        const isCurrentMonth = transactionDate.getMonth() === currentMonth;
        const isCurrentYear = transactionDate.getFullYear() === currentYear;

        console.log('📊 Expense filter:', {
          description: t.description,
          amount: t.amount,
          type: t.type,
          createdAt: t.createdAt,
          transactionMonth: transactionDate.getMonth(),
          currentMonth,
          transactionYear: transactionDate.getFullYear(),
          currentYear,
          isExpense,
          isCurrentMonth,
          isCurrentYear,
          passes: isExpense && isCurrentMonth && isCurrentYear
        });

        return isExpense && isCurrentMonth && isCurrentYear;
      })
      .reduce((total, t) => total + t.amount, 0);

    console.log('📊 Monthly Expenses Result:', {
      totalTransactions: transactions.length,
      currentMonth,
      currentYear,
      monthlyExpenses,
      allExpenses,
      allExpenseTransactions: transactions.filter(t => t.type === 'expense').length
    });

    // TEMPORARY: Return all expenses if monthly is 0 but we have expense transactions
    if (monthlyExpenses === 0 && allExpenses > 0) {
      console.log('📊 TEMPORARY FIX: Returning all expenses instead of monthly');
      return allExpenses;
    }

    return monthlyExpenses;
  };

  const getRecentTransactions = (limit: number = 5) => {
    return transactions
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, limit);
  };

  const syncWithSupabase = async () => {
    console.log('📱 Syncing with Supabase...');
    await load();
  };

  const getCacheInfo = async () => {
    const { getCacheInfo: getCacheInfoFromService } = await import('@/services/transactionCache');
    return await getCacheInfoFromService();
  };

  const forceReloadFromCache = async () => {
    console.log('📱 Force reloading from cache...');
    const cachedTransactions = await loadCachedTransactions();
    if (cachedTransactions.length > 0) {
      console.log('📱 Force loaded transactions from cache:', cachedTransactions.length);
      setTransactions(cachedTransactions);
    } else {
      console.log('📱 No cached transactions found for force reload');
    }
  };

  const loadTransactionsForUser = async (userId: string) => {
    console.log('📱 Loading transactions for specific user:', userId);
    setLoading(true);
    try {
      const rows: Tx[] = await fetchMyTransactions(500, userId);
      const normalized: Transaction[] = rows.map((t) => ({
        id: t.id,
        amount: t.amount,
        description: t.description ?? '',
        category: t.category ?? '',
        type: t.type,
        date: t.created_at.split('T')[0],
        createdAt: new Date(t.created_at),
        lineItems: t.line_items ?? [],
      }));
      setTransactions(normalized);

      // Cache transactions locally
      await cacheTransactions(normalized);
      console.log('📱 Loaded and cached transactions for user:', normalized.length);
    } catch (e) {
      console.error('❌ Failed to load transactions for user:', e);
    } finally {
      setLoading(false);
    }
  };

  const value = useMemo(() => ({
    transactions,
    addTransaction,
    deleteTransaction,
    getTotalBalance,
    getMonthlyIncome,
    getMonthlyExpenses,
    getRecentTransactions,
    syncWithSupabase,
    getCacheInfo,
    forceReloadFromCache,
    loadTransactionsForUser,
  }), [transactions]);

  return (
    <TransactionContext.Provider value={value}>
      {children}
    </TransactionContext.Provider>
  );
}

export function useTransactions() {
  const context = useContext(TransactionContext);
  if (!context) {
    throw new Error('useTransactions must be used within a TransactionProvider');
  }
  return context;
}

export type { TransactionLineItem } from '../services/transactions';
