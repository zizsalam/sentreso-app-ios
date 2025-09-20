import React, { createContext, useContext, useState, ReactNode, useEffect, useMemo } from 'react';
import { fetchMyTransactions, createTransaction as createTx, subscribeMyTransactions, Tx } from '../services/transactions';

export interface Transaction {
  id: string;
  amount: number;
  description: string;
  category: string;
  type: 'income' | 'expense';
  date: string;
  createdAt: Date;
}

interface TransactionContextType {
  transactions: Transaction[];
  addTransaction: (transaction: Omit<Transaction, 'id' | 'createdAt'>) => void;
  getTotalBalance: () => number;
  getMonthlyIncome: () => number;
  getMonthlyExpenses: () => number;
  getRecentTransactions: (limit?: number) => Transaction[];
  syncWithSupabase: () => Promise<void>;
}

const TransactionContext = createContext<TransactionContextType | undefined>(undefined);

export function TransactionProvider({ children }: { children: ReactNode }) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const load = async () => {
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
    return () => { void unsubscribe(); };
  }, []);

  const addTransaction = async (transactionData: Omit<Transaction, 'id' | 'createdAt'>) => {
    const created = await createTx({
      amount: transactionData.amount,
      description: transactionData.description,
      category: transactionData.category,
      type: transactionData.type,
    } as any);
    const next: Transaction = {
      id: created.id,
      amount: created.amount,
      description: created.description ?? '',
      category: created.category ?? '',
      type: created.type,
      date: created.created_at.split('T')[0],
      createdAt: new Date(created.created_at),
    };
    setTransactions(prev => [next, ...prev]);
  };

  const getTotalBalance = () => {
    return transactions.reduce((total, transaction) => {
      return transaction.type === 'income'
        ? total + transaction.amount
        : total - transaction.amount;
    }, 0);
  };

  const getMonthlyIncome = () => {
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    return transactions
      .filter(t => {
        const transactionDate = new Date(t.createdAt);
        return t.type === 'income' &&
          transactionDate.getMonth() === currentMonth &&
          transactionDate.getFullYear() === currentYear;
      })
      .reduce((total, t) => total + t.amount, 0);
  };

  const getMonthlyExpenses = () => {
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    return transactions
      .filter(t => {
        const transactionDate = new Date(t.createdAt);
        return t.type === 'expense' &&
          transactionDate.getMonth() === currentMonth &&
          transactionDate.getFullYear() === currentYear;
      })
      .reduce((total, t) => total + t.amount, 0);
  };

  const getRecentTransactions = (limit: number = 5) => {
    return transactions
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, limit);
  };

  const syncWithSupabase = async () => { await load(); };

  const value = useMemo(() => ({
    transactions,
    addTransaction,
    getTotalBalance,
    getMonthlyIncome,
    getMonthlyExpenses,
    getRecentTransactions,
    syncWithSupabase,
  }), [transactions]);

  return (
    <TransactionContext.Provider value={value}>
      {children}
    </TransactionContext.Provider>
  );
}

export function useTransactions() {
  const context = useContext(TransactionContext);
  if (context === undefined) {
    throw new Error('useTransactions must be used within a TransactionProvider');
  }
  return context;
}
