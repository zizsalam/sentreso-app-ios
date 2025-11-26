# 🔗 myAgro Integration with Existing Sentreso UI

## 📋 Overview

This document shows how to integrate the myAgro reminder system into Sentreso's existing UI architecture, reusing patterns from the GIE mode implementation.

---

## 🎯 Current UI Architecture

### **Existing User Type System**
```typescript
// contexts/UserContext.tsx
interface UserDetails {
  name: string;
  phone: string;
  email?: string;
  userType?: 'merchant' | 'GIE';  // ← Add 'VE' here
  address?: string;
}
```

### **Current Tab Structure**
```typescript
// app/(tabs)/_layout.tsx
- index.tsx      (Home - always visible)
- add.tsx        (Add Transaction - always visible)
- voice.tsx      (Voice Recording - always visible)
- analytics.tsx  (Stats - always visible)
- meeting.tsx    (GIE only - conditional)
```

### **Conditional Tab Pattern (GIE Mode)**
```typescript
// Current pattern for conditional tabs
const gieMode = userDetails?.userType === 'GIE';

{gieMode && (
  <Tabs.Screen
    name="meeting"
    options={{ title: 'Réunion', ... }}
  />
)}
```

---

## 🔄 Integration Strategy

### **Option 1: Add VE as New User Type (Recommended)**

**Pros:**
- Clean separation of features
- Easy to enable/disable
- Follows existing GIE pattern
- Can coexist with merchant/GIE modes

**Implementation:**

#### **1. Extend User Type**
```typescript
// contexts/UserContext.tsx
interface UserDetails {
  name: string;
  phone: string;
  email?: string;
  userType?: 'merchant' | 'GIE' | 'VE';  // ← Add VE
  address?: string;
}
```

#### **2. Update Onboarding**
```typescript
// components/UserTypeOnboarding.tsx
// Add third option for VE

<TouchableOpacity
  style={styles.optionCard}
  onPress={() => handleSelectType('VE')}
>
  <View style={styles.iconContainer}>
    <Users size={32} color="#8B5CF6" />
  </View>
  <Text style={styles.optionTitle}>Village Entrepreneur</Text>
  <Text style={styles.optionDescription}>
    Pour gérer les groupes d'agriculteurs myAgro
  </Text>
</TouchableOpacity>
```

#### **3. Add Conditional Tabs for VE Mode**
```typescript
// app/(tabs)/_layout.tsx
export default function TabLayout() {
  const { userDetails } = useUserDetails();
  const gieMode = userDetails?.userType === 'GIE';
  const veMode = userDetails?.userType === 'VE';  // ← Add VE mode

  return (
    <Tabs>
      {/* Existing tabs - always visible */}
      <Tabs.Screen name="index" ... />
      <Tabs.Screen name="add" ... />
      <Tabs.Screen name="voice" ... />
      <Tabs.Screen name="analytics" ... />

      {/* GIE mode tab */}
      {gieMode && (
        <Tabs.Screen name="meeting" ... />
      )}

      {/* VE mode tabs */}
      {veMode && (
        <>
          <Tabs.Screen
            name="groups"
            options={{
              title: 'Groupes',
              tabBarIcon: ({ size, color }) => (
                <Users size={22} color={color} />
              ),
            }}
          />
          <Tabs.Screen
            name="reminders"
            options={{
              title: 'Rappels',
              tabBarIcon: ({ size, color }) => (
                <Bell size={22} color={color} />
              ),
            }}
          />
          <Tabs.Screen
            name="messages"
            options={{
              title: 'Messages',
              tabBarIcon: ({ size, color }) => (
                <MessageCircle size={22} color={color} />
              ),
            }}
          />
        </>
      )}
    </Tabs>
  );
}
```

---

## 📱 Screen Integration

### **1. Home Screen (`index.tsx`) - Conditional Content**

**Current Structure:**
```typescript
// Shows: Balance, Revenue/Expenses, Recent Transactions
```

**VE Mode Enhancement:**
```typescript
// app/(tabs)/index.tsx
export default function HomeTab() {
  const { userDetails } = useUserDetails();
  const veMode = userDetails?.userType === 'VE';
  const { transactions, ... } = useTransactions();

  // ... existing code ...

  return (
    <ScrollView>
      {/* Existing content for merchant/GIE */}
      {!veMode && (
        <>
          <BalanceCard />
          <RevenueExpenses />
          <RecentTransactions />
        </>
      )}

      {/* VE-specific dashboard */}
      {veMode && (
        <>
          <VEDashboardStats />
          <ActiveGroupsList />
          <UpcomingPayments />
          <QuickActions />
        </>
      )}
    </ScrollView>
  );
}
```

### **2. New: Groups Screen (`groups.tsx`)**

**Reuse Existing Patterns:**
- Similar to `meeting.tsx` (GIE screen)
- Use same card/list components
- Reuse form patterns from `add.tsx`

```typescript
// app/(tabs)/groups.tsx
export default function GroupsTab() {
  const { userDetails } = useUserDetails();
  const [groups, setGroups] = useState<FarmerGroup[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);

  // Similar structure to meeting.tsx
  return (
    <ScrollView>
      {/* Groups list - similar to members list in meeting.tsx */}
      <GroupsList
        groups={groups}
        onSelectGroup={setSelectedGroup}
      />

      {/* Group detail - similar to meeting detail */}
      {selectedGroup && (
        <GroupDetailView
          groupId={selectedGroup}
          onBack={() => setSelectedGroup(null)}
        />
      )}
    </ScrollView>
  );
}
```

### **3. New: Reminders Screen (`reminders.tsx`)**

**Reuse Analytics Patterns:**
- Similar layout to `analytics.tsx`
- Use same chart/card components

```typescript
// app/(tabs)/reminders.tsx
export default function RemindersTab() {
  // Similar structure to analytics.tsx
  return (
    <ScrollView>
      <ReminderScheduleOverview />
      <ActiveReminderRules />
      <ReminderStats />
    </ScrollView>
  );
}
```

### **4. Enhanced Voice Screen (`voice.tsx`)**

**Add Group Voice Feature:**
```typescript
// app/(tabs)/voice.tsx
export default function VoiceTab() {
  const { userDetails } = useUserDetails();
  const veMode = userDetails?.userType === 'VE';

  return (
    <View>
      {/* Existing voice recording for transactions */}
      {!veMode && <TransactionVoiceRecorder />}

      {/* VE mode: Group voice message */}
      {veMode && (
        <>
          <GroupSelector />
          <VoiceRecorder
            maxDuration={60}
            onRecordComplete={handleGroupVoiceMessage}
          />
        </>
      )}
    </View>
  );
}
```

---

## 🎨 Component Reuse

### **Reusable Components from Existing Code**

#### **1. Card Components** (from `index.tsx`)
```typescript
// Reuse existing card styles
const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    marginBottom: 12,
  },
});
```

#### **2. List Components** (from `meeting.tsx`)
```typescript
// Reuse member grid pattern for farmers list
// components/MemberGrid.tsx → components/FarmerGrid.tsx
```

#### **3. Form Components** (from `add.tsx`)
```typescript
// Reuse form patterns for:
// - Add farmer form
// - Create group form
// - Reminder rule form
```

#### **4. Modal Components** (from existing modals)
```typescript
// Reuse modal patterns:
// - AddMemberModal.tsx → AddFarmerModal.tsx
// - EditMemberModal.tsx → EditFarmerModal.tsx
```

---

## 🔧 Context Integration

### **New Context: MyAgroContext**

**Similar to TransactionContext:**
```typescript
// contexts/MyAgroContext.tsx
export const MyAgroProvider = ({ children }) => {
  const [groups, setGroups] = useState<FarmerGroup[]>([]);
  const [farmers, setFarmers] = useState<Farmer[]>([]);
  const [reminders, setReminders] = useState<ReminderRule[]>([]);

  // Similar pattern to TransactionContext
  const addGroup = async (group: CreateGroupInput) => { ... };
  const addFarmer = async (farmer: CreateFarmerInput) => { ... };
  const sendReminder = async (reminderId: string) => { ... };

  return (
    <MyAgroContext.Provider value={{ groups, farmers, reminders, ... }}>
      {children}
    </MyAgroContext.Provider>
  );
};
```

**Wrap in App:**
```typescript
// app/_layout.tsx
export default function RootLayout() {
  return (
    <AuthManagerProvider>
      <UserProvider>
        <TransactionProvider>
          <MyAgroProvider>  {/* ← Add */}
            <Stack>
              {/* ... */}
            </Stack>
          </MyAgroProvider>
        </TransactionProvider>
      </UserProvider>
    </AuthManagerProvider>
  );
}
```

---

## 📊 Data Flow Integration

### **Reuse Existing Services Pattern**

**Similar to `services/transactions.ts`:**
```typescript
// services/myagroGroups.ts
export async function fetchMyGroups(userId?: string): Promise<FarmerGroup[]> {
  const { data: { user } } = userId
    ? { data: { user: { id: userId } as any } }
    : await supabase.auth.getUser();

  if (!user?.id) return [];

  const { data, error } = await supabase
    .from('myagro_groups')
    .select('*')
    .eq('ve_id', user.id)
    .order('created_at', { ascending: false });

  return data ?? [];
}
```

**Similar to `contexts/TransactionContext.tsx`:**
```typescript
// contexts/MyAgroContext.tsx
export function useMyAgro() {
  const context = useContext(MyAgroContext);
  if (!context) {
    throw new Error('useMyAgro must be used within MyAgroProvider');
  }
  return context;
}
```

---

## 🎯 Conditional UI Logic

### **Pattern: Show/Hide Based on User Type**

```typescript
// Example: Conditional rendering in any component
const { userDetails } = useUserDetails();
const veMode = userDetails?.userType === 'VE';
const gieMode = userDetails?.userType === 'GIE';
const merchantMode = userDetails?.userType === 'merchant';

// Show different content based on mode
{veMode && <VEDashboard />}
{gieMode && <GIEDashboard />}
{merchantMode && <MerchantDashboard />}
```

### **Pattern: Conditional Navigation**

```typescript
// In any screen
const handleAction = () => {
  if (veMode) {
    router.push('/(tabs)/groups');
  } else if (gieMode) {
    router.push('/(tabs)/meeting');
  } else {
    router.push('/(tabs)/add');
  }
};
```

---

## 🔄 Migration Path

### **Phase 1: Extend User Type System**
1. Add 'VE' to UserDetails interface
2. Update onboarding to include VE option
3. Update UserTypeSwitchModal to support VE

### **Phase 2: Add Conditional Tabs**
1. Create `groups.tsx`, `reminders.tsx`, `messages.tsx`
2. Add conditional tab rendering in `_layout.tsx`
3. Test tab visibility based on userType

### **Phase 3: Integrate Contexts**
1. Create MyAgroContext
2. Add MyAgroProvider to app layout
3. Create services (myagroGroups.ts, reminderEngine.ts)

### **Phase 4: Build Screens**
1. Build Groups screen (reuse meeting.tsx patterns)
2. Build Reminders screen (reuse analytics.tsx patterns)
3. Build Messages screen (new, but reuse list patterns)

### **Phase 5: Enhance Existing Screens**
1. Update Home screen for VE mode
2. Update Voice screen for group messages
3. Add VE-specific features to Analytics

---

## 📝 Code Examples

### **Example 1: Conditional Home Screen**

```typescript
// app/(tabs)/index.tsx
export default function HomeTab() {
  const { userDetails } = useUserDetails();
  const veMode = userDetails?.userType === 'VE';

  if (veMode) {
    return <VEDashboard />;
  }

  // Existing merchant/GIE dashboard
  return <MerchantDashboard />;
}
```

### **Example 2: Reuse Card Component**

```typescript
// components/GroupCard.tsx
// Reuse styles from existing cards
import { StyleSheet } from 'react-native';

export const GroupCard = ({ group }) => {
  return (
    <View style={styles.card}>
      {/* Same card style as transaction cards */}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    // Copy from index.tsx transactionItem styles
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    // ... existing styles
  },
});
```

### **Example 3: Reuse Form Pattern**

```typescript
// app/(tabs)/groups.tsx - Add Farmer Form
// Reuse pattern from app/(tabs)/add.tsx

const [farmerName, setFarmerName] = useState('');
const [phone, setPhone] = useState('');
// ... similar to add.tsx transaction form

<TouchableOpacity
  style={styles.primaryButton}  // Reuse from add.tsx
  onPress={handleAddFarmer}
>
  <Text style={styles.primaryButtonText}>Ajouter agriculteur</Text>
</TouchableOpacity>
```

---

## ✅ Benefits of This Approach

1. **Consistency**: Reuses existing UI patterns
2. **Maintainability**: Follows established code structure
3. **User Experience**: Familiar interface for existing users
4. **Code Reuse**: Leverages existing components and styles
5. **Scalability**: Easy to add more user types in future
6. **Testing**: Can test VE mode independently

---

## 🚀 Quick Start Implementation

### **Step 1: Update User Type**
```typescript
// contexts/UserContext.tsx
userType?: 'merchant' | 'GIE' | 'VE';
```

### **Step 2: Add VE Tab**
```typescript
// app/(tabs)/_layout.tsx
const veMode = userDetails?.userType === 'VE';
{veMode && <Tabs.Screen name="groups" ... />}
```

### **Step 3: Create Groups Screen**
```typescript
// app/(tabs)/groups.tsx
// Copy structure from meeting.tsx
// Adapt for farmer groups
```

### **Step 4: Test**
- Switch user type to VE
- Verify tabs appear
- Test navigation

---

**This integration maintains Sentreso's existing architecture while cleanly adding myAgro features!**


