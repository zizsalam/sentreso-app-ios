import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { ArrowLeft, TrendingUp, TrendingDown, DollarSign } from 'lucide-react-native';
import { router } from 'expo-router';
import { useTransactions } from '@/contexts/TransactionContext';

export default function AnalyticsTab() {
  const { transactions, getTotalBalance, getMonthlyIncome, getMonthlyExpenses } = useTransactions();

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('fr-FR').format(amount);
  };

  const totalBalance = getTotalBalance();
  const monthlyIncome = getMonthlyIncome();
  const monthlyExpenses = getMonthlyExpenses();
  const monthlyProfit = monthlyIncome - monthlyExpenses;

  // Calculate category totals
  const categoryTotals = transactions.reduce((acc, transaction) => {
    if (!acc[transaction.category]) {
      acc[transaction.category] = { income: 0, expense: 0 };
    }
    if (transaction.type === 'income') {
      acc[transaction.category].income += transaction.amount;
    } else {
      acc[transaction.category].expense += transaction.amount;
    }
    return acc;
  }, {} as Record<string, { income: number; expense: number }>);

  console.log('📊 Analytics: Rendering with data:', {
    totalBalance,
    monthlyIncome,
    monthlyExpenses,
    monthlyProfit,
    categoriesCount: Object.keys(categoryTotals).length
  });

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Statistiques</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Monthly Overview */}
      <View style={styles.overviewCard}>
        <Text style={styles.overviewTitle}>Aperçu Mensuel</Text>
        <View style={styles.overviewStats}>
          <View style={styles.overviewItem}>
            <Text style={styles.overviewLabel}>Revenus</Text>
            <Text style={styles.overviewAmountPositive}>+{formatAmount(monthlyIncome)} FCFA</Text>
          </View>
          <View style={styles.overviewItem}>
            <Text style={styles.overviewLabel}>Dépenses</Text>
            <Text style={styles.overviewAmountNegative}>-{formatAmount(monthlyExpenses)} FCFA</Text>
          </View>
          <View style={styles.overviewItem}>
            <Text style={styles.overviewLabel}>Bénéfice</Text>
            <Text style={monthlyProfit >= 0 ? styles.overviewAmountPositive : styles.overviewAmountNegative}>
              {monthlyProfit >= 0 ? '+' : ''}{formatAmount(monthlyProfit)} FCFA
            </Text>
          </View>
        </View>
      </View>

      {/* Categories */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Catégories Principales</Text>
        
        {Object.keys(categoryTotals).length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>Aucune donnée disponible</Text>
            <Text style={styles.emptyStateSubtext}>Ajoutez des transactions pour voir les statistiques</Text>
          </View>
        ) : (
          Object.entries(categoryTotals).map(([category, totals]) => {
            const netAmount = totals.income - totals.expense;
            const isPositive = netAmount >= 0;
            
            return (
              <View key={category} style={styles.categoryItem}>
                <View style={[styles.categoryIcon, !isPositive && styles.categoryIconRed]}>
                  <DollarSign size={20} color={isPositive ? "#059669" : "#EF4444"} />
                </View>
                <View style={styles.categoryDetails}>
                  <Text style={styles.categoryName}>{category}</Text>
                  <Text style={styles.categoryDescription}>
                    {isPositive ? 'Revenus nets' : 'Dépenses nettes'}
                  </Text>
                </View>
                <View style={styles.categoryAmount}>
                  <Text style={isPositive ? styles.categoryAmountText : styles.categoryAmountTextRed}>
                    {isPositive ? '+' : ''}{formatAmount(Math.abs(netAmount))} FCFA
                  </Text>
                  <View style={isPositive ? styles.categoryTrend : styles.categoryTrendRed}>
                    {isPositive ? (
                      <TrendingUp size={16} color="#059669" />
                    ) : (
                      <TrendingDown size={16} color="#EF4444" />
                    )}
                    <Text style={isPositive ? styles.categoryTrendText : styles.categoryTrendTextRed}>
                      {Math.floor(Math.random() * 20) + 5}%
                    </Text>
                  </View>
                </View>
              </View>
            );
          })
        )}
      </View>

      {/* Quick Actions */}
      <View style={styles.quickActions}>
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => router.push('/(tabs)/add')}
        >
          <Text style={styles.actionButtonText}>Nouvelle Transaction</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.actionButtonSecondary}
          onPress={() => router.push('/(tabs)/voice')}
        >
          <Text style={styles.actionButtonSecondaryText}>Reçu Vocal</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
  },
  placeholder: {
    width: 40,
  },
  overviewCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    marginBottom: 24,
  },
  overviewTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 16,
  },
  overviewStats: {
    gap: 16,
  },
  overviewItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  overviewLabel: {
    fontSize: 16,
    color: '#6B7280',
    fontWeight: '500',
  },
  overviewAmountPositive: {
    fontSize: 18,
    fontWeight: '700',
    color: '#059669',
  },
  overviewAmountNegative: {
    fontSize: 18,
    fontWeight: '700',
    color: '#EF4444',
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 16,
  },
  emptyState: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 32,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  emptyStateText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 4,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#9CA3AF',
  },
  categoryItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    marginBottom: 12,
  },
  categoryIcon: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: '#DCFCE7',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  categoryIconRed: {
    backgroundColor: '#FEE2E2',
  },
  categoryDetails: {
    flex: 1,
  },
  categoryName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 2,
  },
  categoryDescription: {
    fontSize: 14,
    color: '#6B7280',
  },
  categoryAmount: {
    alignItems: 'flex-end',
  },
  categoryAmountText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#059669',
    marginBottom: 4,
  },
  categoryAmountTextRed: {
    fontSize: 16,
    fontWeight: '700',
    color: '#EF4444',
    marginBottom: 4,
  },
  categoryTrend: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  categoryTrendRed: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  categoryTrendText: {
    fontSize: 12,
    color: '#059669',
    fontWeight: '600',
  },
  categoryTrendTextRed: {
    fontSize: 12,
    color: '#EF4444',
    fontWeight: '600',
  },
  quickActions: {
    paddingHorizontal: 20,
    gap: 12,
    paddingBottom: 100,
  },
  actionButton: {
    backgroundColor: '#059669',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    shadowColor: '#059669',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  actionButtonSecondary: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  actionButtonSecondaryText: {
    color: '#6366F1',
    fontSize: 16,
    fontWeight: '600',
  },
});