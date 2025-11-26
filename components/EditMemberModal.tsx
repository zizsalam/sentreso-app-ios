import { View, Text, StyleSheet, Modal, TextInput, TouchableOpacity, Alert, Image, Platform } from 'react-native';
import { useState, useEffect } from 'react';
import { X, Camera, Image as ImageIcon, Trash2 } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { updateMember, deleteMember, Member } from '@/services/memberStore';

interface EditMemberModalProps {
  visible: boolean;
  onClose: () => void;
  member: Member | null;
  onMemberUpdated: () => void;
  onMemberDeleted: () => void;
}

export default function EditMemberModal({ visible, onClose, member, onMemberUpdated, onMemberDeleted }: EditMemberModalProps) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [photoUri, setPhotoUri] = useState<string | undefined>();
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (visible && member) {
      setName(member.name || '');
      setPhone(member.phone || '');
      setPhotoUri(member.photoUri);
    }
  }, [visible, member]);

  const requestPermissions = async () => {
    if (Platform.OS !== 'web') {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission requise', 'Accès à la galerie photo nécessaire');
        return false;
      }
      if (Platform.OS === 'ios') {
        const { status: cameraStatus } = await ImagePicker.requestCameraPermissionsAsync();
        if (cameraStatus !== 'granted') {
          Alert.alert('Permission requise', 'Accès à la caméra nécessaire');
          return false;
        }
      }
    }
    return true;
  };

  const handleTakePhoto = async () => {
    if (!(await requestPermissions())) return;
    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });
      if (!result.canceled && result.assets[0]) {
        setPhotoUri(result.assets[0].uri);
      }
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de prendre une photo');
    }
  };

  const handlePickFromGallery = async () => {
    if (!(await requestPermissions())) return;
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });
      if (!result.canceled && result.assets[0]) {
        setPhotoUri(result.assets[0].uri);
      }
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de sélectionner une image');
    }
  };

  const handleSubmit = async () => {
    if (!member) return;
    if (!name.trim()) {
      Alert.alert('Erreur', 'Le nom est obligatoire');
      return;
    }

    setIsSubmitting(true);
    try {
      await updateMember(member.id, {
        name: name.trim(),
        phone: phone.trim() || undefined,
        photoUri: photoUri,
      });
      Alert.alert('Succès', 'Membre mis à jour');
      onMemberUpdated();
      onClose();
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de mettre à jour le membre');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!member) return;
    Alert.alert(
      'Supprimer le membre',
      `Êtes-vous sûr de vouloir supprimer ${member.name} ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteMember(member.id);
              Alert.alert('Succès', 'Membre supprimé');
              onMemberDeleted();
              onClose();
            } catch (error) {
              Alert.alert('Erreur', 'Impossible de supprimer le membre');
            }
          },
        },
      ]
    );
  };

  if (!member) return null;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <View style={styles.header}>
            <Text style={styles.title}>Modifier le membre</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <X size={24} color="#6B7280" />
            </TouchableOpacity>
          </View>

          <View style={styles.form}>
            <View style={styles.photoSection}>
              <Text style={styles.label}>Photo (optionnelle)</Text>
              <View style={styles.photoContainer}>
                {photoUri ? (
                  <View style={styles.photoPreview}>
                    <Image source={{ uri: photoUri }} style={styles.photoImage} />
                    <TouchableOpacity
                      style={styles.removePhotoButton}
                      onPress={() => setPhotoUri(undefined)}
                    >
                      <X size={16} color="#FFFFFF" />
                    </TouchableOpacity>
                  </View>
                ) : (
                  <View style={styles.photoPlaceholder}>
                    <Text style={styles.photoPlaceholderText}>
                      {name.substring(0, 2).toUpperCase()}
                    </Text>
                  </View>
                )}
                <View style={styles.photoActions}>
                  <TouchableOpacity style={styles.photoButton} onPress={handleTakePhoto}>
                    <Camera size={20} color="#059669" />
                    <Text style={styles.photoButtonText}>Caméra</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.photoButton} onPress={handlePickFromGallery}>
                    <ImageIcon size={20} color="#059669" />
                    <Text style={styles.photoButtonText}>Galerie</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Nom *</Text>
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholder="Nom complet"
                placeholderTextColor="#9CA3AF"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Téléphone</Text>
              <TextInput
                style={styles.input}
                value={phone}
                onChangeText={setPhone}
                placeholder="+221 XX XXX XX XX"
                placeholderTextColor="#9CA3AF"
                keyboardType="phone-pad"
              />
            </View>

            <TouchableOpacity
              style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
              onPress={handleSubmit}
              disabled={isSubmitting}
            >
              <Text style={styles.submitButtonText}>
                {isSubmitting ? 'Enregistrement...' : 'Enregistrer'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.deleteButton}
              onPress={handleDelete}
            >
              <Trash2 size={20} color="#EF4444" />
              <Text style={styles.deleteButtonText}>Supprimer le membre</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modal: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 24,
    paddingBottom: 40,
    maxHeight: '90%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
  },
  closeButton: {
    padding: 4,
  },
  form: {
    paddingHorizontal: 20,
  },
  photoSection: {
    marginBottom: 20,
  },
  photoContainer: {
    alignItems: 'center',
  },
  photoPreview: {
    position: 'relative',
    marginBottom: 12,
  },
  photoImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  removePhotoButton: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#EF4444',
    borderRadius: 12,
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#DCFCE7',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  photoPlaceholderText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#059669',
  },
  photoActions: {
    flexDirection: 'row',
    gap: 12,
  },
  photoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F0FDF4',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#059669',
  },
  photoButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#059669',
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#1F2937',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  submitButton: {
    backgroundColor: '#059669',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#FEF2F2',
    borderRadius: 12,
    paddingVertical: 16,
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  deleteButtonText: {
    color: '#EF4444',
    fontSize: 16,
    fontWeight: '600',
  },
});


