import { Tabs } from 'expo-router';
import { Chrome as Home, Plus, Mic, ChartBar as BarChart3, Users, Bell, MessageSquare } from 'lucide-react-native';
import { getFlag } from '@/src/featureFlags';
import { useUserDetails } from '@/contexts/UserContext';

export default function TabLayout() {
  const game = getFlag('game_mode_v1');
  const { userDetails } = useUserDetails();
  // Only enable GIE mode if userType is explicitly GIE (ignore feature flag for security)
  const gieMode = userDetails?.userType === 'GIE';
  const veMode = userDetails?.userType === 'VE';
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#059669',
        tabBarInactiveTintColor: '#9CA3AF',
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopWidth: 0,
          paddingBottom: 8,
          paddingTop: 8,
          height: 80,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.1,
          shadowRadius: 8,
          elevation: 8,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
          marginTop: 2,
        },
        tabBarIconStyle: {
          marginBottom: 2,
        },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Accueil',
          tabBarIcon: ({ size, color }) => (
            <Home size={22} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="add"
        options={{
          title: 'Ajouter',
          tabBarIcon: ({ size, color }) => (
            <Plus size={22} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="voice"
        options={{
          title: 'Vocal',
          tabBarIcon: ({ size, color }) => (
            <Mic size={22} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="analytics"
        options={{
          title: 'Stats',
          tabBarIcon: ({ size, color }) => (
            <BarChart3 size={22} color={color} />
          ),
        }}
      />
      {gieMode && (
        <Tabs.Screen
          name="meeting"
          options={{
            title: 'Réunion',
            tabBarIcon: ({ size, color }) => (
              <Users size={22} color={color} />
            ),
          }}
        />
      )}
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
                <MessageSquare size={22} color={color} />
              ),
            }}
          />
        </>
      )}
    </Tabs>
  );
}
