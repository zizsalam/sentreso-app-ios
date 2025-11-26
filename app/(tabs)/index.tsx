import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Platform } from 'react-native';
import { TrendingUp, ArrowUpRight, ArrowDownLeft, ChartBar as BarChart3, Plus, Mic, LogOut, Trash2, Settings, Users, Bell } from 'lucide-react-native';
import { router } from 'expo-router';
import { useTransactions, Transaction } from '@/contexts/TransactionContext';
import { useUserDetails } from '@/contexts/UserContext';
import { useAuthManager } from '@/contexts/AuthManager';
import UserTypeSwitchModal from '@/components/UserTypeSwitchModal';
import { useState } from 'react';
import { createAndShareReceipt } from '@/src/receipts/receipt';
import { getMerchantIdentity, saveMerchantIdentity } from '@/src/receipts/identity';

export default function HomeTab() {
  const { transactions, getTotalBalance, getMonthlyIncome, getMonthlyExpenses, getRecentTransactions, deleteTransaction } = useTransactions();
  const { userDetails, clearUserDetails, isLoading } = useUserDetails();
  const { signOut } = useAuthManager();
  const [showUserTypeModal, setShowUserTypeModal] = useState(false);
  const isVE = userDetails?.userType === 'VE';

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

  const handleLogout = async () => {
    console.log('🔐 Logout button pressed');

    // On web, Alert.alert might not work well, so use confirm for web
    if (Platform.OS === 'web') {
      const confirmed = typeof window !== 'undefined' && window.confirm('Êtes-vous sûr de vouloir vous déconnecter ?');
      if (!confirmed) return;

      try {
        console.log('🔐 Proceeding with logout on web...');
        await signOut();
        await clearUserDetails();
        // Force navigation on web
        router.replace('/login');
      } catch (error) {
        console.error('❌ Logout error:', error);
        if (typeof window !== 'undefined') {
          window.alert('Erreur lors de la déconnexion');
        }
      }
    } else {
      Alert.alert(
        'Déconnexion',
        'Êtes-vous sûr de vouloir vous déconnecter ?',
        [
          { text: 'Annuler', style: 'cancel' },
          {
            text: 'Déconnecter',
            style: 'destructive',
            onPress: async () => {
              try {
                console.log('🔐 Proceeding with logout...');
                await signOut();
                await clearUserDetails();
                // Navigation is handled by AuthManager
              } catch (error) {
                console.error('❌ Logout error:', error);
                Alert.alert('Erreur', 'Erreur lors de la déconnexion');
              }
            },
          },
        ]
      );
    }
  };

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('fr-FR').format(amount);
  };

  const handleCreateReceipt = async (tx: any) => {
    try {
      // Just-in-time identity capture
      const ident = await getMerchantIdentity();
      if (!ident.name || ident.name === 'Commerçant') {
        // Quick prompt, minimal fields
        // In absence of a full sheet component, use 2-step alerts as a temporary shim
        let enteredName = '';
        let enteredPhone = ident.phone || '';
        await new Promise<void>((resolve) => {
          Alert.alert(
            'Identité du commerce',
            "Ajoute le nom de ton commerce pour l'afficher sur le reçu.",
            [
              {
                text: 'Plus tard',
                style: 'cancel',
                onPress: () => resolve(),
              },
              {
                text: 'Continuer',
                onPress: () => resolve(),
              },
            ]
          );
        });
        // Since Alert cannot collect input, keep it minimal now; skip persistence if not available.
        // A full bottom sheet form can be added next iteration.
        if (enteredName.trim().length >= 2) {
          await saveMerchantIdentity({ name: enteredName.trim(), phone: enteredPhone.trim() });
        }
      }

      await createAndShareReceipt({
        id: tx.id,
        type: tx.type,
        amount: tx.amount,
        category: tx.category,
        description: tx.description,
        date: tx.date,
        created_at: tx.created_at,
      });
    } catch (error) {
      console.error('❌ Receipt creation error:', error);
      Alert.alert('Erreur', "Impossible de générer le reçu");
    }
  };

  const handleDeleteTransaction = (transaction: Transaction) => {
    if (Platform.OS === 'web') {
      const confirmed = typeof window !== 'undefined' && window.confirm(
        `Êtes-vous sûr de vouloir supprimer "${transaction.description}" ?`
      );
      if (!confirmed) return;

      (async () => {
        try {
          await deleteTransaction(transaction.id);
          if (typeof window !== 'undefined') {
            window.alert('Transaction supprimée');
          }
        } catch (error) {
          console.error('❌ Delete error:', error);
          if (typeof window !== 'undefined') {
            window.alert('Impossible de supprimer la transaction');
          }
        }
      })();
      return;
    }

    Alert.alert(
      'Supprimer la transaction',
      `Êtes-vous sûr de vouloir supprimer "${transaction.description}" ?`,
      [
        {
          text: 'Annuler',
          style: 'cancel',
        },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteTransaction(transaction.id);
              Alert.alert('Succès', 'Transaction supprimée');
            } catch (error) {
              console.error('❌ Delete error:', error);
              Alert.alert('Erreur', `Impossible de supprimer la transaction: ${error instanceof Error ? error.message : String(error)}`);
            }
          },
        },
      ],
      { cancelable: true }
    );
  };

  const totalBalance = getTotalBalance();
  const monthlyIncome = getMonthlyIncome();
  const monthlyExpenses = getMonthlyExpenses();
  const recentTransactions = getRecentTransactions(5);

  console.log('🏠 HomeTab: Dashboard data:', {
    totalTransactions: transactions.length,
    totalBalance,
    monthlyIncome,
    monthlyExpenses,
    currentDate: new Date(),
    currentMonth: new Date().getMonth(),
    currentYear: new Date().getFullYear(),
    sampleTransactions: transactions.slice(0, 3).map(t => ({
      description: t.description,
      amount: t.amount,
      type: t.type,
      createdAt: t.createdAt,
      month: new Date(t.createdAt).getMonth(),
      year: new Date(t.createdAt).getFullYear()
    }))
  });

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
  const dashboardContent = isVE ? (
    <VEDashboard
      onOpenUserTypeModal={() => setShowUserTypeModal(true)}
      onLogout={handleLogout}
    />
  ) : (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header with Sentreso logo, settings and logout */}
      <View style={styles.header}>
        <View style={styles.logoContainer}>
          <View style={styles.logo}>
            <View style={styles.logoIcon} />
          </View>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.settingsButton}
            onPress={() => setShowUserTypeModal(true)}
          >
            <Settings size={18} color="#059669" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <LogOut size={16} color="#FFFFFF" />
            <Text style={styles.logoutText}>Déconnexion</Text>
          </TouchableOpacity>
        </View>
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
            <View
              key={transaction.id}
              style={styles.transactionItem}
            >
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
                {transaction.lineItems && transaction.lineItems.length > 0 && (
                  <Text style={styles.transactionLineItems}>
                    {transaction.lineItems
                      .map(item => `${item.name} x${item.quantity}`)
                      .join(', ')}
                  </Text>
                )}
              </View>
              <View style={styles.transactionAmount}>
                <Text style={[
                  styles.transactionAmountText,
                  transaction.type === 'expense' && styles.transactionAmountTextRed
                ]}>
                  {transaction.type === 'income' ? '+' : '-'}{formatAmount(transaction.amount)} FCFA
                </Text>
                <Text style={styles.transactionDate}>{transaction.date}</Text>
                <View style={styles.transactionActions}>
                  {transaction.type === 'income' && (
                    <TouchableOpacity
                      onPress={() => handleCreateReceipt(transaction)}
                      style={styles.receiptBtn}
                    >
                      <Text style={styles.receiptBtnText}>Créer reçu</Text>
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity
                    onPress={() => handleDeleteTransaction(transaction)}
                    style={styles.deleteBtn}
                    activeOpacity={0.7}
                  >
                    <Trash2 size={16} color="#EF4444" />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          ))
        )}
      </View>

    </ScrollView>
  );

  return (
    <>
      {dashboardContent}
      <UserTypeSwitchModal
        visible={showUserTypeModal}
        onClose={() => setShowUserTypeModal(false)}
      />
    </>
  );
}

type VEDashboardProps = {
  onOpenUserTypeModal: () => void;
  onLogout: () => void;
};

function VEDashboard({ onOpenUserTypeModal, onLogout }: VEDashboardProps) {
  const quickStats = [
    { label: 'Groupes actifs', value: '0', sub: 'Créez votre premier groupe' },
    { label: 'Agriculteurs suivis', value: '0', sub: 'Ajoutez vos productrices' },
    { label: 'Rappels hebdo', value: '0', sub: 'Planifiez un rappel audio' },
  ];

  const quickTasks = [
    'Créer un nouveau groupe myAgro',
    'Ajouter les numéros WhatsApp des agricultrices',
    'Programmer le rappel vocal du mercredi',
  ];

  return (
    <ScrollView style={styles.veContainer} contentContainerStyle={{ paddingBottom: 120 }}>
      <View style={styles.veHeader}>
        <View>
          <Text style={styles.veTitle}>Mode Village Entrepreneur</Text>
          <Text style={styles.veSubtitle}>Pilotez vos groupes et rappels myAgro</Text>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.settingsButton}
            onPress={onOpenUserTypeModal}
          >
            <Settings size={18} color="#059669" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.logoutButton} onPress={onLogout}>
            <LogOut size={16} color="#FFFFFF" />
            <Text style={styles.logoutText}>Déconnexion</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.veHighlightCard}>
        <Text style={styles.veHighlightTitle}>Résumé du jour</Text>
        <Text style={styles.veHighlightText}>
          Configurez vos groupes et laissez Sentreso envoyer les rappels WhatsApp automatiques (voix en Wolof / Pulaar).
        </Text>
      </View>

      <View style={styles.veStatGrid}>
        {quickStats.map((stat) => (
          <View key={stat.label} style={styles.veStatCard}>
            <Text style={styles.veStatValue}>{stat.value}</Text>
            <Text style={styles.veStatLabel}>{stat.label}</Text>
            <Text style={styles.veStatSub}>{stat.sub}</Text>
          </View>
        ))}
      </View>

      <View style={styles.veActions}>
        <TouchableOpacity style={styles.primaryButton}>
          <Users size={20} color="#FFFFFF" />
          <Text style={styles.primaryButtonText}>Créer un groupe</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.secondaryButton}>
          <Bell size={20} color="#6366F1" />
          <Text style={styles.secondaryButtonText}>Planifier un rappel</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.veQuickTasks}>
        <Text style={styles.sectionTitle}>Planification rapide</Text>
        {quickTasks.map((task) => (
          <View key={task} style={styles.veTaskItem}>
            <Text style={styles.veTaskBullet}>•</Text>
            <Text style={styles.veTaskText}>{task}</Text>
          </View>
        ))}
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
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  settingsButton: {
    padding: 10,
    borderRadius: 8,
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#059669',
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
    fontSize: 12,
    color: '#6B7280',
  },
  transactionLineItems: {
    fontSize: 12,
    color: '#4B5563',
    marginTop: 2,
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
  receiptBtn: {
    marginTop: 6,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#10B981',
  },
  receiptBtnText: {
    color: '#10B981',
    fontSize: 12,
    fontWeight: '700',
  },
  transactionActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 6,
  },
  deleteBtn: {
    padding: 6,
    borderRadius: 6,
    backgroundColor: '#FEE2E2',
  },
  veContainer: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 20,
    paddingTop: 60,
  },
  veHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
    gap: 12,
  },
  veTitle: {
    fontSize: 26,
    fontWeight: '700',
    color: '#1F2937',
  },
  veSubtitle: {
    fontSize: 16,
    color: '#6B7280',
  },
  veHighlightCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#059669',
    marginBottom: 20,
  },
  veHighlightTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#059669',
    marginBottom: 6,
  },
  veHighlightText: {
    fontSize: 14,
    color: '#4B5563',
  },
  veStatGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  veStatCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  veStatValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 4,
  },
  veStatLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  veStatSub: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 8,
  },
  veActions: {
    gap: 12,
    marginBottom: 24,
  },
  veQuickTasks: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  veTaskItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
  },
  veTaskBullet: {
    fontSize: 18,
    color: '#059669',
    marginTop: -2,
  },
  veTaskText: {
    fontSize: 14,
    color: '#4B5563',
    flex: 1,
    flexWrap: 'wrap',
  },
});
