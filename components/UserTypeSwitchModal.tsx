import React, { useState } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, Alert, Platform } from 'react-native';
import { X, Store, Users, Check } from 'lucide-react-native';
import { useUserDetails } from '@/contexts/UserContext';
import { router } from 'expo-router';

interface UserTypeSwitchModalProps {
  visible: boolean;
  onClose: () => void;
}

export default function UserTypeSwitchModal({ visible, onClose }: UserTypeSwitchModalProps) {
  const { userDetails, setUserDetails } = useUserDetails();
  const [isChanging, setIsChanging] = useState(false);

  const currentType = userDetails?.userType || 'merchant';

  const readableLabel = (type: 'merchant' | 'GIE' | 'VE') => {
    switch (type) {
      case 'GIE':
        return 'GIE';
      case 'VE':
        return 'Village Entrepreneur';
      default:
        return 'Commerçant';
    }
  };

  const handleSwitchType = async (newType: 'merchant' | 'GIE' | 'VE') => {
    if (newType === currentType) {
      onClose();
      return;
    }

    setIsChanging(true);
    try {
      await setUserDetails({
        ...userDetails!,
        userType: newType,
      });

      // Show confirmation
      const label = readableLabel(newType);
      if (Platform.OS === 'web') {
        if (typeof window !== 'undefined') {
          window.alert(`Profil changé en ${label}. L'application va se recharger.`);
        }
      } else {
        Alert.alert(
          'Profil changé',
          `Vous êtes maintenant en mode ${label}. L'application va se recharger.`,
          [{ text: 'OK', onPress: () => {} }]
        );
      }

      onClose();

      // Reload the app to reflect changes
      // Navigate to onboarding to ensure proper state
      setTimeout(() => {
        router.replace('/onboarding');
      }, 500);
    } catch (error) {
      console.error('❌ Error switching user type:', error);
      if (Platform.OS === 'web') {
        if (typeof window !== 'undefined') {
          window.alert('Erreur lors du changement de profil');
        }
      } else {
        Alert.alert('Erreur', 'Impossible de changer le profil');
      }
    } finally {
      setIsChanging(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <View style={styles.header}>
            <Text style={styles.title}>Changer de profil</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <X size={24} color="#6B7280" />
            </TouchableOpacity>
          </View>

          <View style={styles.content}>
            <Text style={styles.description}>
              Choisissez votre profil pour accéder aux fonctionnalités correspondantes.
            </Text>

            <View style={styles.options}>
              <TouchableOpacity
                style={[
                  styles.optionCard,
                  currentType === 'merchant' && styles.optionCardActive
                ]}
                onPress={() => handleSwitchType('merchant')}
                disabled={isChanging}
              >
                <View style={[
                  styles.iconContainer,
                  currentType === 'merchant' && styles.iconContainerActive
                ]}>
                  <Store size={32} color={currentType === 'merchant' ? '#059669' : '#6B7280'} />
                </View>
                <Text style={[
                  styles.optionTitle,
                  currentType === 'merchant' && styles.optionTitleActive
                ]}>
                  Commerçant
                </Text>
                <Text style={styles.optionDescription}>
                  Pour gérer vos transactions personnelles
                </Text>
                {currentType === 'merchant' && (
                  <View style={styles.checkBadge}>
                    <Check size={16} color="#059669" />
                    <Text style={styles.checkText}>Actif</Text>
                  </View>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.optionCard,
                  currentType === 'GIE' && styles.optionCardActive
                ]}
                onPress={() => handleSwitchType('GIE')}
                disabled={isChanging}
              >
                <View style={[
                  styles.iconContainer,
                  styles.iconContainerGIE,
                  currentType === 'GIE' && styles.iconContainerActiveGIE
                ]}>
                  <Users size={32} color={currentType === 'GIE' ? '#3B82F6' : '#6B7280'} />
                </View>
                <Text style={[
                  styles.optionTitle,
                  currentType === 'GIE' && styles.optionTitleActiveGIE
                ]}>
                  GIE
                </Text>
                <Text style={styles.optionDescription}>
                  Pour gérer les finances de votre groupement
                </Text>
                {currentType === 'GIE' && (
                  <View style={[styles.checkBadge, styles.checkBadgeGIE]}>
                    <Check size={16} color="#3B82F6" />
                    <Text style={[styles.checkText, styles.checkTextGIE]}>Actif</Text>
                  </View>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.optionCard,
                  currentType === 'VE' && styles.optionCardActiveVE
                ]}
                onPress={() => handleSwitchType('VE')}
                disabled={isChanging}
              >
                <View style={[
                  styles.iconContainer,
                  styles.iconContainerVE,
                  currentType === 'VE' && styles.iconContainerActiveVE
                ]}>
                  <Users size={32} color={currentType === 'VE' ? '#8B5CF6' : '#6B7280'} />
                </View>
                <Text style={[
                  styles.optionTitle,
                  currentType === 'VE' && styles.optionTitleActiveVE
                ]}>
                  Village Entrepreneur
                </Text>
                <Text style={styles.optionDescription}>
                  Pour gérer les groupes myAgro et les rappels
                </Text>
                {currentType === 'VE' && (
                  <View style={[styles.checkBadge, styles.checkBadgeVE]}>
                    <Check size={16} color="#8B5CF6" />
                    <Text style={[styles.checkText, styles.checkTextVE]}>Actif</Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>

            {isChanging && (
              <Text style={styles.loadingText}>Changement en cours...</Text>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modal: {
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    width: '90%',
    maxWidth: 500,
    maxHeight: '80%',
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
  },
  closeButton: {
    padding: 4,
  },
  content: {
    padding: 24,
  },
  description: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 24,
  },
  options: {
    gap: 16,
  },
  optionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E5E7EB',
    position: 'relative',
  },
  optionCardActive: {
    borderColor: '#059669',
    backgroundColor: '#F0FDF4',
  },
  optionCardActiveVE: {
    borderColor: '#8B5CF6',
    backgroundColor: '#F5F3FF',
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  iconContainerActive: {
    backgroundColor: '#DCFCE7',
  },
  iconContainerGIE: {
    backgroundColor: '#F3F4F6',
  },
  iconContainerActiveGIE: {
    backgroundColor: '#DBEAFE',
  },
  iconContainerVE: {
    backgroundColor: '#F3F4F6',
  },
  iconContainerActiveVE: {
    backgroundColor: '#EDE9FE',
  },
  optionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 6,
  },
  optionTitleActive: {
    color: '#059669',
  },
  optionTitleActiveGIE: {
    color: '#3B82F6',
  },
  optionTitleActiveVE: {
    color: '#8B5CF6',
  },
  optionDescription: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
  checkBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  checkBadgeGIE: {
    backgroundColor: '#DBEAFE',
  },
  checkBadgeVE: {
    backgroundColor: '#EDE9FE',
  },
  checkText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#059669',
  },
  checkTextGIE: {
    color: '#3B82F6',
  },
  checkTextVE: {
    color: '#8B5CF6',
  },
  loadingText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 16,
    fontStyle: 'italic',
  },
});
