import AsyncStorage from '@react-native-async-storage/async-storage';

export interface Member {
  id: string;
  name: string;
  phone?: string;
  photoUri?: string;
  createdAt: string;
  lastUsedAt: string;
  active: boolean;
}

const MEMBERS_STORAGE_KEY = 'gie_members';
const RECENTS_LIMIT = 5;

// Simple fuzzy match for duplicate detection
function fuzzyMatch(a: string, b: string): boolean {
  const normalize = (s: string) => s.toLowerCase().trim().replace(/\s+/g, ' ');
  const na = normalize(a);
  const nb = normalize(b);
  if (na === nb) return true;
  // Check if one contains the other (for typos like "Fatou" vs "Fatou Diop")
  if (na.length > 3 && nb.length > 3) {
    return na.includes(nb) || nb.includes(na);
  }
  return false;
}

export async function getAllMembers(): Promise<Member[]> {
  try {
    const stored = await AsyncStorage.getItem(MEMBERS_STORAGE_KEY);
    if (!stored) return [];
    const members: Member[] = JSON.parse(stored);
    return members.filter(m => m.active !== false).sort((a, b) =>
      new Date(b.lastUsedAt).getTime() - new Date(a.lastUsedAt).getTime()
    );
  } catch (error) {
    console.error('❌ Failed to load members:', error);
    return [];
  }
}

export async function getRecentMembers(limit = RECENTS_LIMIT): Promise<Member[]> {
  const all = await getAllMembers();
  return all.slice(0, limit);
}

export async function addMember(member: Omit<Member, 'id' | 'createdAt' | 'lastUsedAt' | 'active'>): Promise<{ member: Member; duplicateHint?: Member }> {
  try {
    const all = await getAllMembers();
    // Check for duplicates
    const duplicate = all.find(m => fuzzyMatch(m.name, member.name));
    if (duplicate) {
      return { member: duplicate, duplicateHint: duplicate };
    }
    // Create new member
    const newMember: Member = {
      id: `member_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      ...member,
      createdAt: new Date().toISOString(),
      lastUsedAt: new Date().toISOString(),
      active: true,
    };
    all.push(newMember);
    await AsyncStorage.setItem(MEMBERS_STORAGE_KEY, JSON.stringify(all));
    return { member: newMember };
  } catch (error) {
    console.error('❌ Failed to add member:', error);
    throw error;
  }
}

export async function updateMemberLastUsed(memberId: string): Promise<void> {
  try {
    const all = await getAllMembers();
    const member = all.find(m => m.id === memberId);
    if (member) {
      member.lastUsedAt = new Date().toISOString();
      await AsyncStorage.setItem(MEMBERS_STORAGE_KEY, JSON.stringify(all));
    }
  } catch (error) {
    console.error('❌ Failed to update member lastUsed:', error);
  }
}

export async function getMemberById(id: string): Promise<Member | null> {
  const all = await getAllMembers();
  return all.find(m => m.id === id) || null;
}

export async function searchMembers(query: string): Promise<Member[]> {
  const all = await getAllMembers();
  const q = query.toLowerCase().trim();
  if (!q) return all;
  return all.filter(m =>
    m.name.toLowerCase().includes(q) ||
    (m.phone && m.phone.includes(q))
  );
}

export async function updateMember(memberId: string, updates: Partial<Omit<Member, 'id' | 'createdAt' | 'lastUsedAt' | 'active'>>): Promise<void> {
  try {
    const stored = await AsyncStorage.getItem(MEMBERS_STORAGE_KEY);
    if (!stored) throw new Error('No members found');
    const members: Member[] = JSON.parse(stored);
    const index = members.findIndex(m => m.id === memberId);
    if (index === -1) throw new Error('Member not found');
    members[index] = { ...members[index], ...updates };
    await AsyncStorage.setItem(MEMBERS_STORAGE_KEY, JSON.stringify(members));
  } catch (error) {
    console.error('❌ Failed to update member:', error);
    throw error;
  }
}

export async function deleteMember(memberId: string): Promise<void> {
  try {
    const stored = await AsyncStorage.getItem(MEMBERS_STORAGE_KEY);
    if (!stored) throw new Error('No members found');
    const members: Member[] = JSON.parse(stored);
    const index = members.findIndex(m => m.id === memberId);
    if (index === -1) throw new Error('Member not found');
    // Soft delete by setting active to false
    members[index].active = false;
    await AsyncStorage.setItem(MEMBERS_STORAGE_KEY, JSON.stringify(members));
  } catch (error) {
    console.error('❌ Failed to delete member:', error);
    throw error;
  }
}
