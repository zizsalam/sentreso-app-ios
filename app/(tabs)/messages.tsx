import { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { MessageSquare, Loader2 } from 'lucide-react-native';
import { supabase } from '@/services/supabaseClient';

interface SentMessage {
  id: string;
  farmer_id: string;
  group_id: string;
  type: 'reminder' | 'manual' | 'group_voice';
  channel: 'whatsapp' | 'sms';
  content: string;
  voice_url?: string | null;
  status: 'sent' | 'delivered' | 'read' | 'failed';
  farmer_confirmed: boolean;
  sent_at: string;
}

const FILTERS = ['tous', 'whatsapp', 'sms'] as const;

export default function MessagesTab() {
  const [messages, setMessages] = useState<SentMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [filter, setFilter] = useState<typeof FILTERS[number]>('tous');

  useEffect(() => {
    loadMessages();
  }, []);

  const loadMessages = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('sent_messages')
        .select('*')
        .order('sent_at', { ascending: false })
        .limit(50);
      if (error) throw error;
      setMessages(data || []);
    } catch (error) {
      console.error('❌ loadMessages error', error);
    } finally {
      setIsLoading(false);
    }
  };

  const refresh = async () => {
    setIsRefreshing(true);
    try {
      const { data, error } = await supabase
        .from('sent_messages')
        .select('*')
        .order('sent_at', { ascending: false })
        .limit(50);
      if (error) throw error;
      setMessages(data || []);
    } catch (error) {
      console.error('❌ refresh messages error', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  const filteredMessages = messages.filter((msg) => (filter === 'tous' ? true : msg.channel === filter));
  const confirmationCount = messages.filter((msg) => msg.farmer_confirmed).length;
  const confirmationRate = messages.length === 0 ? 0 : Math.round((confirmationCount / messages.length) * 100);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Loader2 size={32} color="#0EA5E9" />
        <Text style={styles.loadingText}>Chargement des messages...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={refresh} tintColor="#0EA5E9" />}
    >
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.title}>Historique des rappels</Text>
          <Text style={styles.subtitle}>Vérifiez les confirmations des agricultrices</Text>
        </View>
      </View>

      <View style={styles.filterRow}>
        {FILTERS.map((option) => (
          <TouchableOpacity
            key={option}
            style={[styles.filterChip, filter === option && styles.filterChipActive]}
            onPress={() => setFilter(option)}
          >
            <Text style={[styles.filterChipText, filter === option && styles.filterChipTextActive]}>
              {option === 'tous' ? 'Tous' : option.toUpperCase()}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.summaryCard}>
        <View>
          <Text style={styles.summaryLabel}>Confirmations reçues</Text>
          <Text style={styles.summaryValue}>{confirmationCount}</Text>
        </View>
        <View>
          <Text style={styles.summaryLabel}>Taux sur 50 derniers messages</Text>
          <Text style={styles.summaryRate}>{confirmationRate}%</Text>
        </View>
      </View>

      {filteredMessages.length === 0 ? (
        <View style={styles.emptyState}>
          <MessageSquare size={32} color="#94A3B8" />
          <Text style={styles.emptyTitle}>Aucun message</Text>
          <Text style={styles.emptySubtitle}>Envoyez un rappel pour tester la diffusion</Text>
        </View>
      ) : (
        filteredMessages.map((msg) => (
          <View key={msg.id} style={styles.messageCard}>
            <View style={styles.messageHeader}>
              <Text style={styles.messageType}>{msg.type === 'reminder' ? 'Rappel automatique' : 'Message'}</Text>
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
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 20,
    paddingTop: 40,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#0F172A',
  },
  subtitle: {
    fontSize: 14,
    color: '#475569',
  },
  filterRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 20,
  },
  filterChip: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  filterChipActive: {
    backgroundColor: '#E0F2FE',
    borderColor: '#0EA5E9',
  },
  filterChipText: {
    color: '#475569',
    fontWeight: '500',
  },
  filterChipTextActive: {
    color: '#0F172A',
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
    fontSize: 16,
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
  emptyState: {
    marginTop: 60,
    alignItems: 'center',
    gap: 8,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#475569',
    textAlign: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#F8FAFC',
  },
  loadingText: {
    color: '#475569',
  },
});
