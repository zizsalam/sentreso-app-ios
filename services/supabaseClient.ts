/* eslint-disable */
import { createClient } from '@supabase/supabase-js';
import { Platform } from 'react-native';

// Prefer EXPO_PUBLIC_ vars at runtime; fallback to known working project
const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://avltdtbgantbxbrqdxge.supabase.co';
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF2bHRkdGJnYW50YnhicnFkeGdlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA4NjI5MjUsImV4cCI6MjA2NjQzODkyNX0.x_tYhcxmxENG_7qAimEWh7oi5nQSnrdp2fwyW1b4oqc';

let asyncStorage: any = undefined;
if (Platform.OS !== 'web') {
  asyncStorage = require('@react-native-async-storage/async-storage').default;
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: asyncStorage,
    autoRefreshToken: true, // Automatically refresh tokens before expiration
    persistSession: true, // Persist session across app restarts
    detectSessionInUrl: false, // Don't detect session in URL (for mobile)
    // Enhanced session persistence for better UX
    flowType: 'pkce', // Use PKCE flow for better security
    debug: __DEV__, // Enable debug logging in development
  },
});

// Simple data operations without auth
export const supabaseData = {
  // Add transaction to database
  async addTransaction(transaction: any) {
    try {
      const { data, error } = await supabase
        .from('transactions')
        .insert([transaction]);

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error adding transaction:', error);
      return null;
    }
  },

  // Get transactions from database
  async getTransactions() {
    try {
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error getting transactions:', error);
      return [];
    }
  },

  // Update transaction
  async updateTransaction(id: string, updates: any) {
    try {
      const { data, error } = await supabase
        .from('transactions')
        .update(updates)
        .eq('id', id);

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating transaction:', error);
      return null;
    }
  },

  // Delete transaction
  async deleteTransaction(id: string) {
    try {
      const { error } = await supabase
        .from('transactions')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error deleting transaction:', error);
      return false;
    }
  }
};
