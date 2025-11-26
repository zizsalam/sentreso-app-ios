import { View, Text, StyleSheet, TouchableOpacity, FlatList, Pressable, Image, TextInput } from 'react-native';
import { useState, useEffect, useMemo } from 'react';
import { Plus, User, Search, X } from 'lucide-react-native';
import { getAllMembers, getRecentMembers, updateMemberLastUsed, searchMembers, Member } from '@/services/memberStore';
import AddMemberModal from './AddMemberModal';
import EditMemberModal from './EditMemberModal';

type SortOption = 'recent' | 'alphabetical' | 'recentUsed';

interface MemberGridProps {
  onSelectMember: (member: Member) => void;
  onLongPress?: (member: Member) => void;
}

export default function MemberGrid({ onSelectMember, onLongPress }: MemberGridProps) {
  const [members, setMembers] = useState<Member[]>([]);
  const [recentMembers, setRecentMembers] = useState<Member[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOption, setSortOption] = useState<SortOption>('recent');
  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);

  const loadMembers = async () => {
    try {
      const [all, recent] = await Promise.all([getAllMembers(), getRecentMembers()]);
      setMembers(all);
      setRecentMembers(recent);
    } catch (error) {
      console.error('❌ Failed to load members:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMembers();
  }, []);

  const handleMemberPress = async (member: Member) => {
    await updateMemberLastUsed(member.id);
    onSelectMember(member);
    // Refresh to update recents
    loadMembers();
  };

  const handleMemberAdded = () => {
    loadMembers();
  };

  const handleMemberUpdated = () => {
    loadMembers();
  };

  const handleMemberDeleted = () => {
    loadMembers();
  };

  const handleLongPress = (member: Member) => {
    setEditingMember(member);
    setShowEditModal(true);
    onLongPress?.(member);
  };

  const getInitials = (name: string): string => {
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  // Filter and sort members
  const filteredAndSortedMembers = useMemo(() => {
    let filtered = members;

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(m =>
        m.name.toLowerCase().includes(query) ||
        (m.phone && m.phone.includes(query))
      );
    }

    // Apply sort
    const sorted = [...filtered];
    switch (sortOption) {
      case 'alphabetical':
        sorted.sort((a, b) => a.name.localeCompare(b.name, 'fr'));
        break;
      case 'recentUsed':
        sorted.sort((a, b) =>
          new Date(b.lastUsedAt).getTime() - new Date(a.lastUsedAt).getTime()
        );
        break;
      case 'recent':
      default:
        sorted.sort((a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        break;
    }

    return sorted;
  }, [members, searchQuery, sortOption]);

  const renderMember = ({ item }: { item: Member }) => (
    <Pressable
      style={styles.memberCard}
      onPress={() => handleMemberPress(item)}
      onLongPress={() => handleLongPress(item)}
    >
      {item.photoUri ? (
        <Image source={{ uri: item.photoUri }} style={styles.avatarImage} />
      ) : (
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{getInitials(item.name)}</Text>
        </View>
      )}
      <Text style={styles.memberName} numberOfLines={1}>
        {item.name}
      </Text>
    </Pressable>
  );

  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Chargement...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Search bar */}
      <View style={styles.searchSection}>
        <View style={styles.searchContainer}>
          <Search size={20} color="#6B7280" />
          <TextInput
            style={styles.searchInput}
            placeholder="Rechercher un membre..."
            placeholderTextColor="#9CA3AF"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearSearchButton}>
              <X size={16} color="#6B7280" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Sort options */}
      <View style={styles.sortSection}>
        <Text style={styles.sortLabel}>Trier par:</Text>
        <View style={styles.sortButtons}>
          <TouchableOpacity
            style={[styles.sortButton, sortOption === 'recent' && styles.sortButtonActive]}
            onPress={() => setSortOption('recent')}
          >
            <Text style={[styles.sortButtonText, sortOption === 'recent' && styles.sortButtonTextActive]}>
              Récents
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.sortButton, sortOption === 'alphabetical' && styles.sortButtonActive]}
            onPress={() => setSortOption('alphabetical')}
          >
            <Text style={[styles.sortButtonText, sortOption === 'alphabetical' && styles.sortButtonTextActive]}>
              A-Z
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.sortButton, sortOption === 'recentUsed' && styles.sortButtonActive]}
            onPress={() => setSortOption('recentUsed')}
          >
            <Text style={[styles.sortButtonText, sortOption === 'recentUsed' && styles.sortButtonTextActive]}>
              Utilisés
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Recents strip */}
      {recentMembers.length > 0 && !searchQuery && (
        <View style={styles.recentsSection}>
          <Text style={styles.sectionLabel}>Récents</Text>
          <View style={styles.recentsRow}>
            {recentMembers.map(member => (
              <Pressable
                key={member.id}
                style={styles.recentChip}
                onPress={() => handleMemberPress(member)}
              >
                {member.photoUri ? (
                  <Image source={{ uri: member.photoUri }} style={styles.recentChipImage} />
                ) : (
                  <Text style={styles.recentChipText}>{getInitials(member.name)}</Text>
                )}
              </Pressable>
            ))}
          </View>
        </View>
      )}

      {/* Add member button */}
      <TouchableOpacity style={styles.addButton} onPress={() => setShowAddModal(true)}>
        <Plus size={20} color="#059669" />
        <Text style={styles.addButtonText}>Nouveau membre</Text>
      </TouchableOpacity>

      {/* Members grid */}
      {filteredAndSortedMembers.length === 0 ? (
        <View style={styles.emptyState}>
          <User size={48} color="#9CA3AF" />
          <Text style={styles.emptyText}>
            {searchQuery ? 'Aucun résultat' : 'Aucun membre'}
          </Text>
          <Text style={styles.emptySubtext}>
            {searchQuery ? 'Essayez une autre recherche' : 'Ajoutez votre premier membre'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredAndSortedMembers}
          renderItem={renderMember}
          keyExtractor={item => item.id}
          numColumns={3}
          contentContainerStyle={styles.grid}
          columnWrapperStyle={styles.columnWrapper}
          showsVerticalScrollIndicator={false}
          nestedScrollEnabled
          style={styles.list}
        />
      )}

      <AddMemberModal
        visible={showAddModal}
        onClose={() => setShowAddModal(false)}
        onMemberAdded={handleMemberAdded}
      />

      <EditMemberModal
        visible={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setEditingMember(null);
        }}
        member={editingMember}
        onMemberUpdated={handleMemberUpdated}
        onMemberDeleted={handleMemberDeleted}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  loadingText: {
    textAlign: 'center',
    color: '#6B7280',
    marginTop: 20,
  },
  recentsSection: {
    marginBottom: 16,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 8,
  },
  recentsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  recentChip: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#DCFCE7',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#059669',
  },
  recentChipText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#059669',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F0FDF4',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#059669',
    gap: 8,
  },
  addButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#059669',
  },
  grid: {
    paddingBottom: 16,
  },
  columnWrapper: {
    justifyContent: 'flex-start',
  },
  list: {
    flexGrow: 0,
  },
  memberCard: {
    flex: 1,
    alignItems: 'center',
    margin: 4,
    padding: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    minWidth: 100,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#DCFCE7',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  avatarImage: {
    width: 56,
    height: 56,
    borderRadius: 28,
    marginBottom: 8,
  },
  avatarText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#059669',
  },
  recentChipImage: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  memberName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1F2937',
    textAlign: 'center',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
    marginTop: 12,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 4,
  },
  searchSection: {
    marginBottom: 16,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#1F2937',
  },
  clearSearchButton: {
    padding: 4,
  },
  sortSection: {
    marginBottom: 16,
  },
  sortLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 8,
  },
  sortButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  sortButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  sortButtonActive: {
    backgroundColor: '#DCFCE7',
    borderColor: '#059669',
  },
  sortButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  sortButtonTextActive: {
    color: '#059669',
    fontWeight: '600',
  },
});
