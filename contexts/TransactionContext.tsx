import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { supabaseData } from '../services/supabaseClient';

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
  // Start with empty transactions array - no seed data
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  // Load transactions from Supabase on mount (optional)
  useEffect(() => {
    const loadTransactions = async () => {
      try {
        const data = await supabaseData.getTransactions();
        if (data && data.length > 0) {
          const formattedTransactions = data.map((item: any) => ({
            id: item.id,
            amount: item.amount,
            description: item.description,
            category: item.category,
            type: item.type,
            date: item.date,
            createdAt: new Date(item.created_at)
          }));
          setTransactions(formattedTransactions);
        }
      } catch (error) {
        console.log('No Supabase data or error loading:', error);
        // Continue with empty transactions if Supabase fails
      }
    };

    loadTransactions();
  }, []);

  const addTransaction = async (transactionData: Omit<Transaction, 'id' | 'createdAt'>) => {
    const newTransaction: Transaction = {
      ...transactionData,
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      createdAt: new Date()
    };

    setTransactions(prev => [newTransaction, ...prev]);

    // Optionally sync with Supabase
    try {
      await supabaseData.addTransaction({
        id: newTransaction.id,
        amount: newTransaction.amount,
        description: newTransaction.description,
        category: newTransaction.category,
        type: newTransaction.type,
        date: newTransaction.date,
        created_at: newTransaction.createdAt.toISOString()
      });
    } catch (error) {
      console.log('Failed to sync with Supabase, continuing with local storage');
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

  const syncWithSupabase = async () => {
    try {
      const data = await supabaseData.getTransactions();
      if (data && data.length > 0) {
        const formattedTransactions = data.map((item: any) => ({
          id: item.id,
          amount: item.amount,
          description: item.description,
          category: item.category,
          type: item.type,
          date: item.date,
          createdAt: new Date(item.created_at)
        }));
        setTransactions(formattedTransactions);
      }
    } catch (error) {
      console.error('Error syncing with Supabase:', error);
    }
  };

  return (
    <TransactionContext.Provider value={{
      transactions,
      addTransaction,
      getTotalBalance,
      getMonthlyIncome,
      getMonthlyExpenses,
      getRecentTransactions,
      syncWithSupabase
    }}>
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
