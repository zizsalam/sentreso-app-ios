import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { TrendingUp, ArrowUpRight, ArrowDownLeft, ChartBar as BarChart3, Plus, Mic, LogOut } from 'lucide-react-native';
import { router } from 'expo-router';
import { useTransactions } from '@/contexts/TransactionContext';
import { useUserDetails } from '@/contexts/UserContext';

export default function HomeTab() {
  const { transactions, getTotalBalance, getMonthlyIncome, getMonthlyExpenses, getRecentTransactions } = useTransactions();
  const { userDetails, clearUserDetails, isLoading } = useUserDetails();

  const handleNewTransaction = () => {
    console.log('🔄 Navigating to add transaction...');
    router.push('/(tabs)/add');
  };

  const handleViewStats = () => {
    console.log('🔄 Navigating to analytics...');
    router.push('/(tabs)/analytics');
  };

  const handleVoiceRecord = () => {
    console.log('🔄 Navigating to voice recording...');
    router.push('/(tabs)/voice');
  };

  const handleLogout = () => {
    Alert.alert(
      'Déconnexion',
      'Êtes-vous sûr de vouloir vous déconnecter ?',
      [
        {
          text: 'Annuler',
          style: 'cancel',
        },
        {
          text: 'Déconnecter',
          style: 'destructive',
          onPress: async () => {
            try {
              clearUserDetails();
              console.log('✅ Logout successful');
            } catch (error) {
              console.error('❌ Logout error:', error);
              Alert.alert('Erreur', 'Erreur lors de la déconnexion');
            }
          },
        },
      ]
    );
  };

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('fr-FR').format(amount);
  };

  const totalBalance = getTotalBalance();
  const monthlyIncome = getMonthlyIncome();
  const monthlyExpenses = getMonthlyExpenses();
  const recentTransactions = getRecentTransactions(5);

  console.log('🏠 HomeTab: Rendering with data:', {
    totalBalance,
    monthlyIncome,
    monthlyExpenses,
    transactionsCount: transactions.length,
    recentCount: recentTransactions.length
  });

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Chargement des données...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header with Sentreso logo and logout */}
      <View style={styles.header}>
        <View style={styles.logoContainer}>
          <View style={styles.logo}>
            <View style={styles.logoIcon} />
          </View>
        </View>
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <LogOut size={16} color="#FFFFFF" />
          <Text style={styles.logoutText}>Déconnexion</Text>
        </TouchableOpacity>
      </View>

      {/* Greeting */}
      <View style={styles.greetingSection}>
        <Text style={styles.greeting}>Bonjour 👋</Text>
        <Text style={styles.subtitle}>Gérez vos finances facilement</Text>
      </View>

      {/* Total Balance Card */}
      <View style={styles.balanceCard}>
        <Text style={styles.balanceLabel}>Solde Total</Text>
        <Text style={styles.balanceAmount}>{formatAmount(totalBalance)} FCFA</Text>
        <View style={styles.balanceChange}>
          <TrendingUp size={16} color="#10B981" />
          <Text style={styles.balanceChangeText}>+12% ce mois</Text>
        </View>
      </View>

      {/* Revenue and Expenses */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <View style={styles.statHeader}>
            <View style={styles.statIconContainer}>
              <ArrowUpRight size={16} color="#10B981" />
            </View>
            <Text style={styles.statLabel}>Revenus</Text>
          </View>
          <Text style={styles.statAmountPositive}>+{formatAmount(monthlyIncome)}</Text>
          <Text style={styles.statPeriod}>Ce mois</Text>
        </View>

        <View style={styles.statCard}>
          <View style={styles.statHeader}>
            <View style={[styles.statIconContainer, styles.statIconContainerRed]}>
              <ArrowDownLeft size={16} color="#EF4444" />
            </View>
            <Text style={styles.statLabel}>Dépenses</Text>
          </View>
          <Text style={styles.statAmountNegative}>-{formatAmount(monthlyExpenses)}</Text>
          <Text style={styles.statPeriod}>Ce mois</Text>
        </View>
      </View>

      {/* Action Buttons */}
      <View style={styles.actionButtons}>
        <TouchableOpacity style={styles.primaryButton} onPress={handleNewTransaction}>
          <Plus size={20} color="#FFFFFF" />
          <Text style={styles.primaryButtonText}>Nouvelle Transaction</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.secondaryButton} onPress={handleViewStats}>
          <BarChart3 size={20} color="#6366F1" />
          <Text style={styles.secondaryButtonText}>Voir les Stats</Text>
        </TouchableOpacity>
      </View>

      {/* Voice Feature Highlight */}
      <TouchableOpacity style={styles.voiceFeature} onPress={handleVoiceRecord}>
        <View style={styles.voiceIcon}>
          <Mic size={24} color="#10B981" />
        </View>
        <View style={styles.voiceContent}>
          <Text style={styles.voiceTitle}>🎤 Créer un reçu vocal</Text>
          <Text style={styles.voiceSubtitle}>Parlez pour générer un reçu en 5 secondes</Text>
        </View>
        <ArrowUpRight size={20} color="#6B7280" />
      </TouchableOpacity>

      {/* Recent Transactions */}
      <View style={styles.transactionsSection}>
        <Text style={styles.sectionTitle}>Transactions Récentes</Text>

        {recentTransactions.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>Aucune transaction récente</Text>
            <Text style={styles.emptyStateSubtext}>Ajoutez votre première transaction</Text>
          </View>
        ) : (
          recentTransactions.map((transaction) => (
            <View key={transaction.id} style={styles.transactionItem}>
              <View style={[
                styles.transactionIcon,
                transaction.type === 'expense' && styles.transactionIconRed
              ]}>
                {transaction.type === 'income' ? (
                  <ArrowUpRight size={16} color="#10B981" />
                ) : (
                  <ArrowDownLeft size={16} color="#EF4444" />
                )}
              </View>
              <View style={styles.transactionDetails}>
                <Text style={styles.transactionTitle}>{transaction.description}</Text>
                <Text style={styles.transactionCategory}>{transaction.category}</Text>
              </View>
              <View style={styles.transactionAmount}>
                <Text style={[
                  styles.transactionAmountText,
                  transaction.type === 'expense' && styles.transactionAmountTextRed
                ]}>
                  {transaction.type === 'income' ? '+' : '-'}{formatAmount(transaction.amount)} FCFA
                </Text>
                <Text style={styles.transactionDate}>{transaction.date}</Text>
              </View>
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  logoutButton: {
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#EF4444',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  logoutText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  logoContainer: {
    alignItems: 'flex-start',
  },
  logo: {
    backgroundColor: '#000000',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoIcon: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#10B981',
  },
  greetingSection: {
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  greeting: {
    fontSize: 32,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    fontWeight: '400',
  },
  balanceCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    marginBottom: 20,
  },
  balanceLabel: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
    marginBottom: 8,
  },
  balanceAmount: {
    fontSize: 36,
    fontWeight: '800',
    color: '#1F2937',
    marginBottom: 12,
  },
  balanceChange: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  balanceChangeText: {
    fontSize: 14,
    color: '#10B981',
    fontWeight: '600',
    marginLeft: 4,
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  statHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  statIconContainer: {
    width: 24,
    height: 24,
    borderRadius: 6,
    backgroundColor: '#DCFCE7',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  statIconContainerRed: {
    backgroundColor: '#FEE2E2',
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  statAmountPositive: {
    fontSize: 20,
    fontWeight: '700',
    color: '#10B981',
    marginBottom: 4,
  },
  statAmountNegative: {
    fontSize: 20,
    fontWeight: '700',
    color: '#EF4444',
    marginBottom: 4,
  },
  statPeriod: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  actionButtons: {
    paddingHorizontal: 20,
    gap: 12,
    marginBottom: 24,
  },
  primaryButton: {
    backgroundColor: '#10B981',
    borderRadius: 12,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    gap: 8,
  },
  secondaryButtonText: {
    color: '#6366F1',
    fontSize: 16,
    fontWeight: '600',
  },
  voiceFeature: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#10B981',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  voiceIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#DCFCE7',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  voiceContent: {
    flex: 1,
  },
  voiceTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 2,
  },
  voiceSubtitle: {
    fontSize: 14,
    color: '#6B7280',
  },
  transactionsSection: {
    paddingHorizontal: 20,
    paddingBottom: 100,
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
  transactionItem: {
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
  transactionIcon: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: '#DCFCE7',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  transactionIconRed: {
    backgroundColor: '#FEE2E2',
  },
  transactionDetails: {
    flex: 1,
  },
  transactionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 2,
  },
  transactionCategory: {
    fontSize: 14,
    color: '#6B7280',
  },
  transactionAmount: {
    alignItems: 'flex-end',
  },
  transactionAmountText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#10B981',
    marginBottom: 2,
  },
  transactionAmountTextRed: {
    color: '#EF4444',
  },
  transactionDate: {
    fontSize: 12,
    color: '#9CA3AF',
  },
});
