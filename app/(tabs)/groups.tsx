import { useEffect, useMemo, useState } from 'react';
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
import { Plus, Users, Loader2 } from 'lucide-react-native';
import { MyAgroGroupsService, type Farmer, type FarmerGroup } from '@/services/myagroGroups';

const LANGUAGES: Array<{ label: string; value: FarmerGroup['language'] }> = [
  { label: 'Wolof', value: 'wolof' },
  { label: 'Pulaar', value: 'pulaar' },
  { label: 'Français', value: 'french' },
];

export default function GroupsTab() {
  const service = useMemo(() => new MyAgroGroupsService(), []);
  const [groups, setGroups] = useState<FarmerGroup[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createForm, setCreateForm] = useState({ name: '', village: '', language: 'wolof' as FarmerGroup['language'] });
  const [selectedGroup, setSelectedGroup] = useState<FarmerGroup | null>(null);
  const [groupFarmers, setGroupFarmers] = useState<Farmer[]>([]);
  const [isDetailLoading, setIsDetailLoading] = useState(false);

  useEffect(() => {
    loadGroups();
  }, []);

  const loadGroups = async () => {
    setIsLoading(true);
    try {
      const list = await service.listGroups();
      setGroups(list);
    } catch (error) {
      console.error('❌ loadGroups error', error);
      Alert.alert('Erreur', 'Impossible de charger les groupes.');
    } finally {
      setIsLoading(false);
    }
  };

  const refreshGroups = async () => {
    setIsRefreshing(true);
    try {
      const list = await service.listGroups();
      setGroups(list);
    } catch (error) {
      console.error('❌ refreshGroups error', error);
      Alert.alert('Erreur', 'Impossible de rafraîchir la liste.');
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleCreateGroup = async () => {
    if (!createForm.name.trim() || !createForm.village.trim()) {
      Alert.alert('Champ manquant', 'Merci de remplir le nom et le village.');
      return;
    }
    try {
      await service.createGroup({
        name: createForm.name.trim(),
        village: createForm.village.trim(),
        language: createForm.language,
      });
      setCreateForm({ name: '', village: '', language: 'wolof' });
      setShowCreateModal(false);
      refreshGroups();
    } catch (error) {
      console.error('❌ handleCreateGroup error', error);
      Alert.alert('Erreur', "Impossible de créer le groupe. Vérifiez vos droits d'accès.");
    }
  };

  const openGroupDetails = async (group: FarmerGroup) => {
    setIsDetailLoading(true);
    setSelectedGroup(group);
    try {
      const { farmers } = await service.getGroupWithFarmers(group.id);
      setGroupFarmers(farmers);
    } catch (error) {
      console.error('❌ openGroupDetails error', error);
      Alert.alert('Erreur', 'Impossible de récupérer les agriculteurs.');
    } finally {
      setIsDetailLoading(false);
    }
  };

  const renderGroups = () => (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={refreshGroups} tintColor="#059669" />}
    >
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.title}>Groupes myAgro</Text>
          <Text style={styles.subtitle}>Ajoutez vos villages et les agricultrices suivies</Text>
        </View>
        <TouchableOpacity style={styles.createButton} onPress={() => setShowCreateModal(true)}>
          <Plus size={18} color="#FFFFFF" />
          <Text style={styles.createButtonText}>Créer</Text>
        </TouchableOpacity>
      </View>

      {groups.length === 0 ? (
        <View style={styles.emptyState}>
          <Users size={32} color="#9CA3AF" />
          <Text style={styles.emptyTitle}>Aucun groupe enregistré</Text>
          <Text style={styles.emptySubtitle}>Créez votre premier groupe pour commencer</Text>
        </View>
      ) : (
        groups.map((group) => (
          <TouchableOpacity key={group.id} style={styles.groupCard} onPress={() => openGroupDetails(group)}>
            <View>
              <Text style={styles.groupName}>{group.name}</Text>
              <Text style={styles.groupMeta}>{group.village} • Langue: {group.language.toUpperCase()}</Text>
            </View>
            <Text style={styles.groupChevron}>Voir</Text>
          </TouchableOpacity>
        ))
      )
    </ScrollView>
  );

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Loader2 size={32} color="#059669" />
        <Text style={styles.loadingText}>Chargement des groupes...</Text>
      </View>
    );
  }

  return (
    <>
      {renderGroups()}
      <Modal visible={showCreateModal} transparent animationType="slide" onRequestClose={() => setShowCreateModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Nouveau groupe</Text>
            <TextInput
              placeholder="Nom du groupe"
              value={createForm.name}
              onChangeText={(text) => setCreateForm((prev) => ({ ...prev, name: text }))}
              style={styles.input}
            />
            <TextInput
              placeholder="Village"
              value={createForm.village}
              onChangeText={(text) => setCreateForm((prev) => ({ ...prev, village: text }))}
              style={styles.input}
            />
            <View style={styles.languageRow}>
              {LANGUAGES.map((lang) => (
                <TouchableOpacity
                  key={lang.value}
                  style={[styles.languageChip, createForm.language === lang.value && styles.languageChipActive]}
                  onPress={() => setCreateForm((prev) => ({ ...prev, language: lang.value }))}
                >
                  <Text style={[styles.languageChipText, createForm.language === lang.value && styles.languageChipTextActive]}>
                    {lang.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.secondaryButton} onPress={() => setShowCreateModal(false)}>
                <Text style={styles.secondaryButtonText}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.primaryButton} onPress={handleCreateGroup}>
                <Text style={styles.primaryButtonText}>Enregistrer</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        visible={!!selectedGroup}
        animationType="slide"
        onRequestClose={() => setSelectedGroup(null)}
      >
        <View style={styles.detailContainer}>
          <View style={styles.detailHeader}>
            <Text style={styles.detailTitle}>{selectedGroup?.name}</Text>
            <TouchableOpacity onPress={() => setSelectedGroup(null)}>
              <Text style={styles.closeText}>Fermer</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.detailSubtitle}>
            {selectedGroup?.village} • Langue principale {selectedGroup?.language.toUpperCase()}
          </Text>
          {isDetailLoading ? (
            <View style={styles.loadingContainer}>
              <Loader2 size={28} color="#059669" />
              <Text style={styles.loadingText}>Chargement des agricultrices...</Text>
            </View>
          ) : groupFarmers.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyTitle}>Aucune agricultrice encore</Text>
              <Text style={styles.emptySubtitle}>Ajoutez-les depuis votre tablette ou importez via photo</Text>
            </View>
          ) : (
            <ScrollView style={styles.farmerList}>
              {groupFarmers.map((farmer) => (
                <View key={farmer.id} style={styles.farmerCard}>
                  <Text style={styles.farmerName}>{farmer.name}</Text>
                  <Text style={styles.farmerMeta}>{farmer.phone} • {farmer.package_type}</Text>
                  <Text style={styles.farmerMeta}>
                    Cible hebdo: {farmer.weekly_savings_target.toLocaleString('fr-FR')} FCFA
                  </Text>
                </View>
              ))}
            </ScrollView>
          )}
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
    marginBottom: 20,
    gap: 12,
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
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#059669',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
  },
  createButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  groupCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  groupName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
  },
  groupMeta: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 4,
  },
  groupChevron: {
    color: '#059669',
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
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
  },
  input: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    padding: 12,
    fontSize: 16,
  },
  languageRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  languageChip: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  languageChipActive: {
    borderColor: '#059669',
    backgroundColor: '#ECFDF5',
  },
  languageChipText: {
    color: '#4B5563',
    fontWeight: '500',
  },
  languageChipTextActive: {
    color: '#059669',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 8,
  },
  primaryButton: {
    backgroundColor: '#059669',
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
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
  detailContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    padding: 20,
  },
  detailHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  detailTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1F2937',
  },
  closeText: {
    color: '#EF4444',
    fontWeight: '600',
  },
  detailSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 16,
  },
  farmerList: {
    flex: 1,
  },
  farmerCard: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    backgroundColor: '#F8FAFC',
  },
  farmerName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
  },
  farmerMeta: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 4,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#F8FAFC',
  },
  loadingText: {
    color: '#4B5563',
    fontSize: 14,
  },
});
