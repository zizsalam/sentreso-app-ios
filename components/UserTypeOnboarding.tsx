import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Store, Users } from 'lucide-react-native';
import { router } from 'expo-router';
import { useUserDetails } from '@/contexts/UserContext';
import { supabase } from '@/services/supabaseClient';

export default function UserTypeOnboarding() {
  const { userDetails, setUserDetails } = useUserDetails();

  const handleSelectType = async (userType: 'merchant' | 'GIE' | 'VE') => {
    try {
      // Get user from auth to populate basic info if userDetails is null
      const { data: { user } } = await supabase.auth.getUser();

      if (userDetails) {
        await setUserDetails({ ...userDetails, userType });
      } else if (user) {
        // Create minimal userDetails for new users
        await setUserDetails({
          name: user.user_metadata?.name || user.email?.split('@')[0] || 'Utilisateur',
          phone: user.user_metadata?.phone || '',
          email: user.email || '',
          userType,
        });
      } else {
        // Fallback: create minimal userDetails
        await setUserDetails({
          name: 'Utilisateur',
          phone: '',
          userType,
        });
      }

      // Redirect to main app after selection
      router.replace('/(tabs)');
    } catch (error) {
      console.error('❌ Error setting user type:', error);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Qui êtes-vous ?</Text>
      <Text style={styles.subtitle}>Choisissez votre profil pour commencer</Text>

      <View style={styles.options}>
        <TouchableOpacity
          style={styles.optionCard}
          onPress={() => handleSelectType('merchant')}
        >
          <View style={styles.iconContainer}>
            <Store size={32} color="#059669" />
          </View>
          <Text style={styles.optionTitle}>Commerçant</Text>
          <Text style={styles.optionDescription}>
            Pour gérer vos transactions personnelles
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.optionCard}
          onPress={() => handleSelectType('GIE')}
        >
          <View style={[styles.iconContainer, styles.iconContainerGIE]}>
            <Users size={32} color="#3B82F6" />
          </View>
          <Text style={styles.optionTitle}>GIE</Text>
          <Text style={styles.optionDescription}>
            Pour gérer les finances de votre groupement
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.optionCard}
          onPress={() => handleSelectType('VE')}
        >
          <View style={[styles.iconContainer, styles.iconContainerVE]}>
            <Users size={32} color="#8B5CF6" />
          </View>
          <Text style={styles.optionTitle}>Village Entrepreneur</Text>
          <Text style={styles.optionDescription}>
            Pour gérer les groupes myAgro et les rappels WhatsApp
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    padding: 24,
    justifyContent: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 40,
  },
  options: {
    gap: 16,
  },
  optionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#DCFCE7',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#059669',
  },
  iconContainerGIE: {
    backgroundColor: '#DBEAFE',
    borderColor: '#3B82F6',
  },
  iconContainerVE: {
    backgroundColor: '#EDE9FE',
    borderColor: '#8B5CF6',
  },
  optionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 8,
  },
  optionDescription: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
});
