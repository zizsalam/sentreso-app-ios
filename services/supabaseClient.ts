import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://pvteukbvatoxxalxwgcf.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB2dGV1a2J2YXRveHhhbHh3Z2NmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTEwMjkzMTMsImV4cCI6MjA2NjYwNTMxM30.EzN3vIx_Y_zpHK';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
    detectSessionInUrl: false
  }
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
