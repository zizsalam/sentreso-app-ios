import { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
  RefreshControl,
} from 'react-native';
import { Bell, Loader2 } from 'lucide-react-native';
import { supabase } from '@/services/supabaseClient';
import type { ReminderRule } from '@/services/reminderEngine';
import type { FarmerGroup } from '@/services/myagroGroups';

const REMINDER_TYPES: Array<{ label: string; value: ReminderRule['type'] }> = [
  { label: 'Épargne hebdo', value: 'weekly_savings' },
  { label: 'Date limite', value: 'payment_deadline' },
  { label: 'Encouragement', value: 'encouragement' },
  { label: 'Formation', value: 'training' },
];

const FREQUENCIES: Array<{ label: string; value: ReminderRule['frequency'] }> = [
  { label: 'Hebdo', value: 'weekly' },
  { label: 'Quotidien', value: 'daily' },
  { label: 'Personnalisé', value: 'custom' },
];

export default function RemindersTab() {
  const [rules, setRules] = useState<ReminderRule[]>([]);
  const [groups, setGroups] = useState<FarmerGroup[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({
    group_id: '',
    type: 'weekly_savings' as ReminderRule['type'],
    frequency: 'weekly' as ReminderRule['frequency'],
    message_template: '',
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [{ data: ruleData, error: ruleError }, { data: groupData, error: groupError }] = await Promise.all([
        supabase.from('reminder_rules').select('*').order('created_at', { ascending: false }),
        supabase.from('myagro_groups').select('*').order('created_at', { ascending: false }),
      ]);
      if (ruleError) throw ruleError;
      if (groupError) throw groupError;
      setRules(ruleData || []);
      setGroups(groupData || []);
    } catch (error) {
      console.error('❌ loadData error', error);
      Alert.alert('Erreur', 'Impossible de charger les rappels.');
    } finally {
      setIsLoading(false);
    }
  };

  const refresh = async () => {
    setIsRefreshing(true);
    try {
      const { data, error } = await supabase.from('reminder_rules').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      setRules(data || []);
    } catch (error) {
      console.error('❌ refresh reminders error', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleCreateRule = async () => {
    if (!form.group_id) {
      Alert.alert('Sélection requise', 'Choisissez un groupe de destination.');
      return;
    }
    try {
      await supabase.from('reminder_rules').insert({
        group_id: form.group_id,
        type: form.type,
        frequency: form.frequency,
        language: 'wolof',
        message_template: form.message_template || null,
        enabled: true,
        next_send_at: new Date().toISOString(),
      });
      setForm({ group_id: '', type: 'weekly_savings', frequency: 'weekly', message_template: '' });
      setShowModal(false);
      refresh();
    } catch (error) {
      console.error('❌ handleCreateRule error', error);
      Alert.alert('Erreur', "Impossible de créer le rappel. Vérifiez vos droits d'accès.");
    }
  };

  const toggleRule = async (rule: ReminderRule) => {
    try {
      await supabase
        .from('reminder_rules')
        .update({ enabled: !rule.enabled })
        .eq('id', rule.id);
      setRules((prev) => prev.map((r) => (r.id === rule.id ? { ...r, enabled: !r.enabled } : r)));
    } catch (error) {
      console.error('❌ toggleRule error', error);
      Alert.alert('Erreur', 'Impossible de modifier le rappel.');
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Loader2 size={32} color="#6366F1" />
        <Text style={styles.loadingText}>Chargement des rappels...</Text>
      </View>
    );
  }

  return (
    <>
      <ScrollView
        style={styles.container}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={refresh} tintColor="#6366F1" />}
      >
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.title}>Rappels programmés</Text>
            <Text style={styles.subtitle}>WhatsApp + SMS automatiques selon vos règles</Text>
          </View>
          <TouchableOpacity style={styles.createButton} onPress={() => setShowModal(true)}>
            <Text style={styles.createButtonText}>Nouveau</Text>
          </TouchableOpacity>
        </View>

        {rules.length === 0 ? (
          <View style={styles.emptyState}>
            <Bell size={32} color="#9CA3AF" />
            <Text style={styles.emptyTitle}>Aucun rappel encore</Text>
            <Text style={styles.emptySubtitle}>Ajoutez votre première règle pour envoyer un message vocal</Text>
          </View>
        ) : (
          rules.map((rule) => (
            <View key={rule.id} style={styles.ruleCard}>
              <View style={{ flex: 1 }}>
                <Text style={styles.ruleTitle}>{rule.type === 'weekly_savings' ? 'Épargne hebdomadaire' : 'Rappel personnalisé'}</Text>
                <Text style={styles.ruleMeta}>Fréquence: {rule.frequency}</Text>
                <Text style={styles.ruleMeta}>Prochain envoi: {rule.next_send_at ? new Date(rule.next_send_at).toLocaleString('fr-FR') : 'À programmer'}</Text>
              </View>
              <TouchableOpacity
                style={[styles.toggleButton, rule.enabled ? styles.toggleEnabled : styles.toggleDisabled]}
                onPress={() => toggleRule(rule)}
              >
                <Text style={rule.enabled ? styles.toggleTextEnabled : styles.toggleTextDisabled}>
                  {rule.enabled ? 'Actif' : 'Pause'}
                </Text>
              </TouchableOpacity>
            </View>
          ))
        )}
      </ScrollView>

      <Modal visible={showModal} transparent animationType="slide" onRequestClose={() => setShowModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Nouveau rappel</Text>

            <Text style={styles.inputLabel}>Groupe cible</Text>
            <ScrollView style={styles.groupSelector}>
              {groups.map((group) => (
                <TouchableOpacity
                  key={group.id}
                  style={[styles.groupOption, form.group_id === group.id && styles.groupOptionActive]}
                  onPress={() => setForm((prev) => ({ ...prev, group_id: group.id }))}
                >
                  <Text style={styles.groupOptionTitle}>{group.name}</Text>
                  <Text style={styles.groupOptionMeta}>{group.village}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Text style={styles.inputLabel}>Type de rappel</Text>
            <View style={styles.chipRow}>
              {REMINDER_TYPES.map((type) => (
                <TouchableOpacity
                  key={type.value}
                  style={[styles.chip, form.type === type.value && styles.chipActive]}
                  onPress={() => setForm((prev) => ({ ...prev, type: type.value }))}
                >
                  <Text style={[styles.chipText, form.type === type.value && styles.chipTextActive]}>{type.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.inputLabel}>Fréquence</Text>
            <View style={styles.chipRow}>
              {FREQUENCIES.map((freq) => (
                <TouchableOpacity
                  key={freq.value}
                  style={[styles.chip, form.frequency === freq.value && styles.chipActive]}
                  onPress={() => setForm((prev) => ({ ...prev, frequency: freq.value }))}
                >
                  <Text style={[styles.chipText, form.frequency === freq.value && styles.chipTextActive]}>{freq.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.inputLabel}>Message (facultatif)</Text>
            <TextInput
              placeholder="Utilisez {{name}}, {{amount_remaining}}, etc."
              value={form.message_template}
              onChangeText={(text) => setForm((prev) => ({ ...prev, message_template: text }))}
              style={[styles.input, { height: 100 }]}
              multiline
            />

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.secondaryButton} onPress={() => setShowModal(false)}>
                <Text style={styles.secondaryButtonText}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.primaryButton} onPress={handleCreateRule}>
                <Text style={styles.primaryButtonText}>Créer</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </>
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
    gap: 12,
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
  },
  createButton: {
    backgroundColor: '#6366F1',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
  },
  createButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  ruleCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 12,
    flexDirection: 'row',
    gap: 16,
    alignItems: 'center',
  },
  ruleTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
  },
  ruleMeta: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 4,
  },
  toggleButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  toggleEnabled: {
    backgroundColor: '#ECFDF5',
    borderColor: '#059669',
  },
  toggleDisabled: {
    backgroundColor: '#FEF2F2',
    borderColor: '#F87171',
  },
  toggleTextEnabled: {
    color: '#059669',
    fontWeight: '600',
  },
  toggleTextDisabled: {
    color: '#B91C1C',
    fontWeight: '600',
  },
  emptyState: {
    marginTop: 60,
    alignItems: 'center',
    gap: 8,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    gap: 12,
  },
  loadingText: {
    color: '#4B5563',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    width: '100%',
    gap: 12,
    maxHeight: '90%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
  },
  inputLabel: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 8,
  },
  groupSelector: {
    maxHeight: 150,
    marginTop: 4,
  },
  groupOption: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    padding: 12,
    marginTop: 8,
  },
  groupOptionActive: {
    borderColor: '#6366F1',
    backgroundColor: '#EEF2FF',
  },
  groupOptionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  groupOptionMeta: {
    fontSize: 12,
    color: '#6B7280',
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
  },
  chip: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  chipActive: {
    borderColor: '#6366F1',
    backgroundColor: '#EEF2FF',
  },
  chipText: {
    color: '#4B5563',
    fontWeight: '500',
  },
  chipTextActive: {
    color: '#4338CA',
  },
  input: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    padding: 12,
    marginTop: 4,
    textAlignVertical: 'top',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
  primaryButton: {
    backgroundColor: '#6366F1',
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  secondaryButton: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  secondaryButtonText: {
    color: '#1F2937',
    fontWeight: '600',
  },
});
