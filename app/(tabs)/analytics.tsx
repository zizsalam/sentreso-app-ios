import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { ArrowLeft, TrendingUp, TrendingDown, Users, Bell, MessageSquare } from 'lucide-react-native';
import { router } from 'expo-router';
import { useTransactions } from '@/contexts/TransactionContext';
import { useUserDetails } from '@/contexts/UserContext';
import { useEffect, useState, type ReactNode } from 'react';
import { supabase } from '@/services/supabaseClient';

export default function AnalyticsTab() {
  const { transactions, getTotalBalance, getMonthlyIncome, getMonthlyExpenses } = useTransactions();
  const { userDetails } = useUserDetails();
  const isVE = userDetails?.userType === 'VE';
  const [veStats, setVeStats] = useState({
    groups: 0,
    farmers: 0,
    activeReminders: 0,
    confirmations: 0,
    confirmationRate: 0,
  });
  const [veMessages, setVeMessages] = useState<SentMessage[]>([]);
  const [isVEAnalyticsLoading, setVEAnalyticsLoading] = useState(true);

  useEffect(() => {
    if (!isVE) return;
    const fetchVEAnalytics = async () => {
      setVEAnalyticsLoading(true);
      try {
        const [
          { count: groupsCount },
          { count: farmersCount },
          { count: remindersCount },
          { count: totalMessages },
          { count: confirmedMessages },
          recentMessages,
        ] = await Promise.all([
          supabase.from('myagro_groups').select('id', { count: 'exact', head: true }),
          supabase.from('myagro_farmers').select('id', { count: 'exact', head: true }),
          supabase.from('reminder_rules').select('id', { count: 'exact', head: true }).eq('enabled', true),
          supabase.from('sent_messages').select('id', { count: 'exact', head: true }),
          supabase.from('sent_messages').select('id', { count: 'exact', head: true }).eq('farmer_confirmed', true),
          supabase.from('sent_messages').select('*').order('sent_at', { ascending: false }).limit(5),
        ]);

        const total = totalMessages ?? 0;
        const confirmed = confirmedMessages ?? 0;
        setVeStats({
          groups: groupsCount ?? 0,
          farmers: farmersCount ?? 0,
          activeReminders: remindersCount ?? 0,
          confirmations: confirmed,
          confirmationRate: total === 0 ? 0 : Math.round((confirmed / total) * 100),
        });

        setVeMessages(recentMessages.data || []);
      } catch (error) {
        console.error('❌ fetchVEAnalytics error', error);
      } finally {
        setVEAnalyticsLoading(false);
      }
    };

    fetchVEAnalytics();
  }, [isVE]);

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
    totalTransactions: transactions.length,
    totalBalance,
    monthlyIncome,
    monthlyExpenses,
    monthlyProfit,
    categoriesCount: Object.keys(categoryTotals).length,
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

  if (isVE) {
    return (
      <VEAnalyticsView
        stats={veStats}
        messages={veMessages}
        isLoading={isVEAnalyticsLoading}
      />
    );
  }

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
                  {isPositive ? (
                    <TrendingUp size={20} color="#059669" />
                  ) : (
                    <TrendingDown size={20} color="#EF4444" />
                  )}
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

type SentMessage = {
  id: string;
  type: 'reminder' | 'manual' | 'group_voice';
  channel: 'whatsapp' | 'sms';
  content: string;
  status: 'sent' | 'delivered' | 'read' | 'failed';
  farmer_confirmed: boolean;
  sent_at: string;
};

type VEAnalyticsProps = {
  stats: {
    groups: number;
    farmers: number;
    activeReminders: number;
    confirmations: number;
    confirmationRate: number;
  };
  messages: SentMessage[];
  isLoading: boolean;
};

function VEAnalyticsView({ stats, messages, isLoading }: VEAnalyticsProps) {
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Chargement des indicateurs VE...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 120 }}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Pilotage myAgro</Text>
        <View style={styles.placeholder} />
      </View>

      <View style={styles.veGrid}>
        <StatCard icon={<Users size={22} color="#059669" />} label="Groupes actifs" value={stats.groups} />
        <StatCard icon={<Users size={22} color="#6366F1" />} label="Agricultrices" value={stats.farmers} />
        <StatCard icon={<Bell size={22} color="#EA580C" />} label="Rappels actifs" value={stats.activeReminders} />
        <StatCard icon={<MessageSquare size={22} color="#0EA5E9" />} label="Confirmations" value={`${stats.confirmations} (${stats.confirmationRate}%)`} />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Derniers rappels envoyés</Text>
        {messages.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>Aucun rappel récent</Text>
            <Text style={styles.emptyStateSubtext}>Programmez un rappel dans l'onglet dédié</Text>
          </View>
        ) : (
          messages.map((msg) => (
            <View key={msg.id} style={styles.messageCard}>
              <View style={styles.messageHeader}>
                <Text style={styles.messageType}>{msg.type === 'reminder' ? 'Automatique' : 'Manuel'}</Text>
                <Text style={[styles.statusBadge, styles[`status_${msg.status}` as const]]}>{msg.status.toUpperCase()}</Text>
              </View>
              <Text style={styles.messageContent}>{msg.content || 'Message vocal envoyé'}</Text>
              <View style={styles.messageMetaRow}>
                <Text style={styles.messageMeta}>{msg.channel === 'whatsapp' ? 'WhatsApp' : 'SMS'}</Text>
                <Text style={styles.messageMeta}>{new Date(msg.sent_at).toLocaleString('fr-FR')}</Text>
                <Text style={styles.messageMeta}>{msg.farmer_confirmed ? 'Confirmé ✅' : 'En attente'}</Text>
              </View>
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
}

function StatCard({ icon, label, value }: { icon: ReactNode; label: string; value: string | number }) {
  return (
    <View style={styles.veStatCard}>
      <View style={styles.veStatIcon}>{icon}</View>
      <Text style={styles.veStatValue}>{value}</Text>
      <Text style={styles.veStatLabel}>{label}</Text>
    </View>
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
  veGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  veStatCard: {
    flexBasis: '47%',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  veStatIcon: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  veStatValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0F172A',
  },
  veStatLabel: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 4,
  },
  messageCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 12,
    gap: 8,
  },
  messageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  messageType: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  statusBadge: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 8,
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  status_sent: {
    backgroundColor: '#0EA5E9',
  },
  status_delivered: {
    backgroundColor: '#059669',
  },
  status_read: {
    backgroundColor: '#6366F1',
  },
  status_failed: {
    backgroundColor: '#DC2626',
  },
  messageContent: {
    fontSize: 14,
    color: '#0F172A',
  },
  messageMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
  },
  messageMeta: {
    fontSize: 12,
    color: '#475569',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    gap: 12,
  },
  loadingText: {
    color: '#475569',
  },
});
