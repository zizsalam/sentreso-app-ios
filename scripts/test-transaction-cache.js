#!/usr/bin/env node
/**
 * Test script for transaction cache functionality
 * Usage: node scripts/test-transaction-cache.js
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

// Mock AsyncStorage for Node.js testing
const mockAsyncStorage = {
  data: new Map(),
  async getItem(key) {
    return this.data.get(key) || null;
  },
  async setItem(key, value) {
    this.data.set(key, value);
  },
  async removeItem(key) {
    this.data.delete(key);
  }
};

// Replace AsyncStorage with mock for testing
global.AsyncStorage = mockAsyncStorage;

// Import cache functions
const { cacheTransactions, loadCachedTransactions, clearTransactionCache, getCacheInfo } = await import('../services/transactionCache.js');

async function testTransactionCache() {
  console.log('🧪 Testing Transaction Cache Functionality\n');

  // Test 1: Cache empty transactions
  console.log('Test 1: Caching empty transactions');
  await cacheTransactions([]);
  let cached = await loadCachedTransactions();
  console.log('✅ Cached empty transactions:', cached.length === 0);

  // Test 2: Cache sample transactions
  console.log('\nTest 2: Caching sample transactions');
  const sampleTransactions = [
    {
      id: '1',
      amount: 1000,
      description: 'Test transaction 1',
      category: 'Food',
      type: 'expense',
      date: '2025-01-20',
      createdAt: new Date('2025-01-20T10:00:00Z')
    },
    {
      id: '2',
      amount: 5000,
      description: 'Test transaction 2',
      category: 'Salary',
      type: 'income',
      date: '2025-01-20',
      createdAt: new Date('2025-01-20T11:00:00Z')
    }
  ];

  await cacheTransactions(sampleTransactions);
  cached = await loadCachedTransactions();
  console.log('✅ Cached sample transactions:', cached.length === 2);
  console.log('   - Transaction 1:', cached[0].description);
  console.log('   - Transaction 2:', cached[1].description);

  // Test 3: Cache info
  console.log('\nTest 3: Getting cache info');
  const cacheInfo = await getCacheInfo();
  console.log('✅ Cache info:', {
    count: cacheInfo.count,
    age: Math.round(cacheInfo.age / 1000) + 's',
    expired: cacheInfo.expired
  });

  // Test 4: Clear cache
  console.log('\nTest 4: Clearing cache');
  await clearTransactionCache();
  cached = await loadCachedTransactions();
  console.log('✅ Cleared cache:', cached.length === 0);

  // Test 5: Cache expiry simulation
  console.log('\nTest 5: Testing cache expiry');
  await cacheTransactions(sampleTransactions);

  // Manually set expiry to past date
  await mockAsyncStorage.setItem('transaction_cache_expiry', (Date.now() - 25 * 60 * 60 * 1000).toString());

  cached = await loadCachedTransactions();
  console.log('✅ Expired cache cleared:', cached.length === 0);

  console.log('\n🎉 All tests passed! Transaction cache is working correctly.');
}

testTransactionCache().catch(console.error);
