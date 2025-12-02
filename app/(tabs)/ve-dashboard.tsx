import { useEffect, useMemo, useState, useRef } from 'react';
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
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
} from 'react-native';
import { Users, Bell, Loader2, X } from 'lucide-react-native';
import { MyAgroGroupsService, type FarmerGroup } from '@/services/myagroGroups';
import { supabase } from '@/services/supabaseClient';
import type { ReminderRule } from '@/services/reminderEngine';
import GroupDetailView from '@/components/GroupDetailView';
import { router } from 'expo-router';

const LANGUAGES: Array<{ label: string; value: FarmerGroup['language'] }> = [
  { label: 'Wolof', value: 'wolof' },
  { label: 'Pulaar', value: 'pulaar' },
  { label: 'Français', value: 'french' },
];

export default function VEDashboard() {
  const service = useMemo(() => new MyAgroGroupsService(), []);
  const [groups, setGroups] = useState<FarmerGroup[]>([]);
  const [rules, setRules] = useState<ReminderRule[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [farmerCounts, setFarmerCounts] = useState<Record<string, number>>({});

  // Modals
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<FarmerGroup | null>(null);

  // Forms
  const [groupForm, setGroupForm] = useState({ name: '', village: '', language: 'wolof' as FarmerGroup['language'] });
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    const loadFarmerCounts = async () => {
      const counts: Record<string, number> = {};
      for (const group of groups) {
        try {
          const { farmers } = await service.getGroupWithFarmers(group.id);
          counts[group.id] = farmers.length;
        } catch {
          counts[group.id] = 0;
        }
      }
      setFarmerCounts(counts);
    };
    if (groups.length > 0) {
      loadFarmerCounts();
    }
  }, [groups]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [groupsList, { data: ruleData }] = await Promise.all([
        service.listGroups(),
        supabase.from('reminder_rules').select('*').order('created_at', { ascending: false }),
      ]);
      setGroups(groupsList);
      setRules(ruleData || []);
    } catch (error) {
      console.error('❌ loadData error', error);
    } finally {
      setIsLoading(false);
    }
  };

  const refresh = async () => {
    setIsRefreshing(true);
    try {
      const groupsList = await service.listGroups();
      setGroups(groupsList);
    } catch (error) {
      console.error('❌ refresh error', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleCreateGroup = async () => {
    if (!groupForm.name.trim() || !groupForm.village.trim()) {
      Alert.alert('Champ manquant', 'Merci de remplir le nom et le village.');
      return;
    }
    if (isCreating) return;

    setIsCreating(true);
    try {
      const newGroup = await service.createGroup({
        name: groupForm.name.trim(),
        village: groupForm.village.trim(),
        language: groupForm.language,
      });
      setGroupForm({ name: '', village: '', language: 'wolof' });
      setShowGroupModal(false);
      await refresh();
      Alert.alert('✅ Succès', 'Groupe créé !');
    } catch (error: any) {
      Alert.alert('Erreur', error?.message || "Impossible de créer le groupe.");
    } finally {
      setIsCreating(false);
    }
  };


  const totalFarmers = Object.values(farmerCounts).reduce((sum, count) => sum + count, 0);
  const activeReminders = rules.filter(r => r.enabled).length;

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Loader2 size={32} color="#059669" />
        <Text style={styles.loadingText}>Chargement...</Text>
      </View>
    );
  }

  return (
    <>
      <ScrollView
        style={styles.container}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={refresh} tintColor="#059669" />}
      >
        {/* Header simple */}
        <View style={styles.header}>
          <Text style={styles.title}>Mes Groupes</Text>
          <Text style={styles.subtitle}>{groups.length} groupe{groups.length > 1 ? 's' : ''} • {totalFarmers} agriculteur{totalFarmers > 1 ? 's' : ''}</Text>
        </View>

        {/* Grands boutons d'action - très visibles */}
        <View style={styles.bigActions}>
          <TouchableOpacity style={styles.bigButton} onPress={() => setShowGroupModal(true)}>
            <View style={styles.bigButtonIcon}>
              <Users size={40} color="#FFFFFF" />
            </View>
            <Text style={styles.bigButtonText}>Nouveau Groupe</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.bigButton, styles.bigButtonGreen]} onPress={() => router.push('/(tabs)/ve-reminders')}>
            <View style={styles.bigButtonIcon}>
              <Bell size={40} color="#FFFFFF" />
            </View>
            <Text style={styles.bigButtonText}>Gérer Rappels</Text>
          </TouchableOpacity>
        </View>

        {/* Liste des groupes - simple et claire */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Mes Groupes</Text>
          {groups.length === 0 ? (
            <View style={styles.emptyState}>
              <Users size={48} color="#9CA3AF" />
              <Text style={styles.emptyText}>Aucun groupe</Text>
              <Text style={styles.emptySubtext}>Appuyez sur "Nouveau Groupe" pour commencer</Text>
            </View>
          ) : (
            groups.map((group) => (
              <TouchableOpacity
                key={group.id}
                style={styles.groupItem}
                onPress={() => setSelectedGroup(group)}
              >
                <View style={styles.groupItemLeft}>
                  <View style={styles.groupIcon}>
                    <Users size={24} color="#2563EB" />
                  </View>
                  <View>
                    <Text style={styles.groupName}>{group.name}</Text>
                    <Text style={styles.groupInfo}>{group.village} • {farmerCounts[group.id] || 0} personne{(farmerCounts[group.id] || 0) !== 1 ? 's' : ''}</Text>
                  </View>
                </View>
                <Text style={styles.groupArrow}>→</Text>
              </TouchableOpacity>
            ))
          )}
        </View>

        {/* Rappels actifs - simple */}
        {rules.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Rappels Actifs ({activeReminders})</Text>
              <TouchableOpacity onPress={() => router.push('/(tabs)/ve-reminders')}>
                <Text style={styles.viewAllText}>Voir tout →</Text>
              </TouchableOpacity>
            </View>
            {rules.slice(0, 3).map((rule) => {
              const group = groups.find(g => g.id === rule.group_id);
              return (
                <TouchableOpacity
                  key={rule.id}
                  style={styles.reminderItem}
                  onPress={() => router.push('/(tabs)/ve-reminders')}
                >
                  <View style={styles.reminderItemLeft}>
                    <Bell size={20} color={rule.enabled ? "#059669" : "#9CA3AF"} />
                    <View>
                      <Text style={styles.reminderName}>{group?.name || 'Groupe'}</Text>
                      <Text style={styles.reminderInfo}>
                        {rule.type === 'weekly_savings' ? 'Épargne' : 'Rappel'} • {rule.frequency}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.reminderStatus}>{rule.enabled ? '✓' : '○'}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Modal créer groupe - simplifié */}
      <Modal visible={showGroupModal} transparent animationType="slide" onRequestClose={() => setShowGroupModal(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Nouveau Groupe</Text>
              <TouchableOpacity onPress={() => setShowGroupModal(false)}>
                <X size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>
            <TextInput
              placeholder="Nom du groupe"
              value={groupForm.name}
              onChangeText={(text) => setGroupForm((prev) => ({ ...prev, name: text }))}
              style={styles.input}
            />
            <TextInput
              placeholder="Village"
              value={groupForm.village}
              onChangeText={(text) => setGroupForm((prev) => ({ ...prev, village: text }))}
              style={styles.input}
            />
            <View style={styles.languageRow}>
              {LANGUAGES.map((lang) => (
                <TouchableOpacity
                  key={lang.value}
                  style={[styles.langButton, groupForm.language === lang.value && styles.langButtonActive]}
                  onPress={() => setGroupForm((prev) => ({ ...prev, language: lang.value }))}
                >
                  <Text style={[styles.langText, groupForm.language === lang.value && styles.langTextActive]}>
                    {lang.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity
              style={[styles.saveButton, isCreating && styles.saveButtonDisabled]}
              onPress={handleCreateGroup}
              disabled={isCreating}
            >
              {isCreating ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.saveButtonText}>Créer</Text>
              )}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>


      {/* Group Detail Modal */}
      <Modal visible={!!selectedGroup} animationType="slide" onRequestClose={() => setSelectedGroup(null)}>
        {selectedGroup && (
          <GroupDetailView
            group={selectedGroup}
            onClose={() => {
              setSelectedGroup(null);
              refresh();
            }}
            onRefresh={refresh}
          />
        )}
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    gap: 12,
  },
  loadingText: { color: '#4B5563', fontSize: 16 },
  header: { padding: 24, paddingTop: 60 },
  title: { fontSize: 32, fontWeight: '800', color: '#1F2937', marginBottom: 8 },
  subtitle: { fontSize: 16, color: '#6B7280' },
  bigActions: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    gap: 16,
    marginBottom: 32,
  },
  bigButton: {
    flex: 1,
    backgroundColor: '#2563EB',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    gap: 12,
  },
  bigButtonGreen: {
    backgroundColor: '#059669',
  },
  bigButtonIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bigButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
  },
  section: { paddingHorizontal: 24, marginBottom: 32 },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: { fontSize: 20, fontWeight: '700', color: '#1F2937' },
  viewAllText: { color: '#059669', fontWeight: '600', fontSize: 14 },
  groupItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  groupItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    flex: 1,
  },
  groupIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  groupName: { fontSize: 18, fontWeight: '700', color: '#1F2937', marginBottom: 4 },
  groupInfo: { fontSize: 14, color: '#6B7280' },
  groupArrow: { fontSize: 24, color: '#059669', fontWeight: '600' },
  reminderItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  reminderItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  reminderName: { fontSize: 16, fontWeight: '600', color: '#1F2937', marginBottom: 4 },
  reminderInfo: { fontSize: 13, color: '#6B7280' },
  reminderStatus: {
    fontSize: 20,
    color: '#059669',
    fontWeight: '700',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
    gap: 12,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
  },
  input: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    marginBottom: 16,
    backgroundColor: '#FFFFFF',
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
  },
  languageRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  langButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
  },
  langButtonActive: {
    backgroundColor: '#ECFDF5',
    borderColor: '#059669',
  },
  langText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
  },
  langTextActive: {
    color: '#059669',
  },
  groupList: {
    maxHeight: 200,
    marginBottom: 24,
  },
  groupOption: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 8,
  },
  groupOptionActive: {
    backgroundColor: '#EEF2FF',
    borderColor: '#6366F1',
  },
  groupOptionText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  groupOptionSubtext: {
    fontSize: 14,
    color: '#6B7280',
  },
  recordButton: {
    backgroundColor: '#D946EF',
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    marginBottom: 24,
  },
  recordButtonActive: {
    backgroundColor: '#DC2626',
  },
  recordButtonDisabled: {
    opacity: 0.6,
  },
  recordButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
  voiceRecorded: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#ECFDF5',
    borderRadius: 12,
    marginBottom: 24,
  },
  voiceRecordedText: {
    color: '#059669',
    fontWeight: '600',
    fontSize: 16,
  },
  removeText: {
    color: '#DC2626',
    fontWeight: '600',
  },
  saveButton: {
    backgroundColor: '#059669',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
});
