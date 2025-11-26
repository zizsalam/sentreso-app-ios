import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Alert, Modal } from 'react-native';
import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, Plus, CircleCheck as CheckCircle, Trash2, X } from 'lucide-react-native';
import { router } from 'expo-router';
import { useTransactions, TransactionLineItem } from '@/contexts/TransactionContext';
import { awardOnTxnConfirmed } from '@/src/game/engine';
import { useUserDetails } from '@/contexts/UserContext';
import MemberGrid from '@/components/MemberGrid';
import { Member } from '@/services/memberStore';

export default function AddTab() {
  const { addTransaction } = useTransactions();
  const { userDetails } = useUserDetails();
  // Only enable GIE mode if userType is explicitly GIE (ignore feature flag for security)
  const isGIEMode = userDetails?.userType === 'GIE';
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [type, setType] = useState<'income' | 'expense'>('expense');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [memberModalVisible, setMemberModalVisible] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState<string | null>(null);
  const [lastSavedAmount, setLastSavedAmount] = useState(0);
  const [lastTxnType, setLastTxnType] = useState<'income' | 'expense'>('income');
  const [lineItems, setLineItems] = useState<TransactionLineItem[]>([]);
  const [lineItemModalVisible, setLineItemModalVisible] = useState(false);
  const [lineItemName, setLineItemName] = useState('');
  const [lineItemQuantity, setLineItemQuantity] = useState('1');
  const [lineItemPrice, setLineItemPrice] = useState('');

  // Quick actions: activities presets
  const activities: { key: string; label: string; set: () => void }[] = [
    {
      key: 'cotisation',
      label: 'Cotisation',
      set: () => {
        setType('income');
        setCategory('Cotisation');
        setAmount((prev) => prev && prev.trim().length > 0 ? prev : '5000');
        setSelectedActivity('cotisation');
      },
    },
    {
      key: 'remboursement',
      label: 'Remboursement prêt',
      set: () => {
        setType('income');
        setCategory('Remboursement prêt');
        setSelectedActivity('remboursement');
      },
    },
    {
      key: 'pret',
      label: 'Prêt émis',
      set: () => {
        setType('expense');
        setCategory('Prêt émis');
        setSelectedActivity('pret');
      },
    },
    {
      key: 'vente',
      label: 'Vente produit',
      set: () => {
        setType('income');
        setCategory('Vente');
        setSelectedActivity('vente');
        if (lineItems.length === 0) {
          setAmount('');
        }
      },
    },
    {
      key: 'depense',
      label: 'Dépense opé',
      set: () => {
        setType('expense');
        setCategory('Dépense opérationnelle');
        setSelectedActivity('depense');
      },
    },
  ];

  const amountChips = ['1000','2500','5000','10000'];

  const categories = [
    'Alimentation',
    'Transport',
    'Logement',
    'Santé',
    'Loisirs',
    'Éducation',
    'Achat de marchandises',
    'Salaire',
    'Vente',
    'Autre'
  ];

  const totalLineItemsAmount = useMemo(
    () => lineItems.reduce((sum, item) => sum + item.total, 0),
    [lineItems]
  );

  useEffect(() => {
    if (lineItems.length > 0) {
      setAmount(totalLineItemsAmount.toString());
      if (type !== 'income') {
        setType('income');
      }
      if (!category) {
        setCategory('Vente');
      }
    }
  }, [lineItems, totalLineItemsAmount, type, category]);

  useEffect(() => {
    if (type === 'expense' && lineItems.length > 0) {
      setLineItems([]);
    }
  }, [type, lineItems.length]);

  const handleSubmit = async () => {
    console.log('📝 Attempting to submit transaction...', { amount, category, type, lineItems });

    if ((!amount || !category) && lineItems.length === 0) {
      Alert.alert('Erreur', 'Veuillez remplir le montant et choisir une catégorie');
      return;
    }

    const numericAmount = lineItems.length > 0
      ? totalLineItemsAmount
      : parseFloat(amount.replace(/[^\d.]/g, ''));

    if (isNaN(numericAmount) || numericAmount <= 0) {
      Alert.alert('Erreur', 'Veuillez entrer un montant valide');
      return;
    }

    if (lineItems.length > 0 && totalLineItemsAmount <= 0) {
      Alert.alert('Erreur', 'Ajoutez au moins un produit avec un montant positif');
      return;
    }

    setIsSubmitting(true);

    try {
      // Build description with member name if selected (for GIE mode)
      const descriptionBase = selectedMember
        ? `${category || 'Vente'} de ${selectedMember.name}`
        : category || 'Vente';

      const description =
        lineItems.length > 0
          ? `${descriptionBase} · ${lineItems
            .map(item => `${item.name} x${item.quantity}`)
            .join(', ')}`
          : descriptionBase;

      const newTransaction = {
        amount: numericAmount,
        description,
        category: category || 'Vente',
        type,
        date: new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }),
        ...(lineItems.length > 0 && { lineItems }),
        ...(selectedMember && { memberName: selectedMember.name, memberId: selectedMember.id }),
      };

      console.log('💾 Adding transaction:', newTransaction);

      await addTransaction(newTransaction);

      awardOnTxnConfirmed({
        type,
        amount: numericAmount,
        kind: type === 'income' ? 'sale' : 'expense',
      });

      setLastSavedAmount(numericAmount);
      setLastTxnType(type);
      setAmount('');
      setCategory('');
      setType('expense');
      setSelectedMember(null);
      setMemberModalVisible(false);
      setSelectedActivity(null);
      setLineItems([]);
      setShowSuccess(true);
    } catch (error) {
      console.error('❌ Failed to add transaction:', error);
      Alert.alert('Erreur', "Impossible d'ajouter la transaction");
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetLineItemForm = () => {
    setLineItemName('');
    setLineItemQuantity('1');
    setLineItemPrice('');
  };

  const handleAddLineItem = () => {
    const quantity = Math.max(1, parseInt(lineItemQuantity.replace(/[^\d]/g, ''), 10) || 1);
    const unitPrice = Math.max(0, parseInt(lineItemPrice.replace(/[^\d]/g, ''), 10) || 0);

    if (!lineItemName.trim()) {
      Alert.alert('Produit', 'Ajoutez un nom de produit');
      return;
    }

    if (unitPrice <= 0) {
      Alert.alert('Montant', 'Ajoutez un prix positif');
      return;
    }

    const total = quantity * unitPrice;
    const newItem: TransactionLineItem = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      name: lineItemName.trim(),
      quantity,
      unitPrice,
      total,
    };

    setLineItems(prev => [...prev, newItem]);
    resetLineItemForm();
    setLineItemModalVisible(false);
  };

  const handleRemoveLineItem = (id: string) => {
    setLineItems(prev => {
      const next = prev.filter(item => item.id !== id);
      if (next.length === 0) {
        setAmount('');
      }
      return next;
    });
  };

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('fr-FR').format(amount);
  };

  const handleAddAnother = () => {
    setShowSuccess(false);
    setAmount('');
    setCategory('');
    setSelectedMember(null);
    setMemberModalVisible(false);
    setSelectedActivity(null);
    setType('expense');
  };

  const handleGoHome = () => {
    setShowSuccess(false);
    setAmount('');
    setCategory('');
    setSelectedMember(null);
    setMemberModalVisible(false);
    setSelectedActivity(null);
    router.replace('/(tabs)');
  };

  if (showSuccess) {
    return (
      <View style={styles.container}>
        <View style={styles.successContainer}>
          <CheckCircle size={64} color="#10B981" />
          <Text style={styles.successTitle}>Transaction Enregistrée!</Text>
          <Text style={styles.successMessage}>
            {lastTxnType === 'income' ? 'Revenu' : 'Dépense'} de {formatAmount(lastSavedAmount)} FCFA ajouté(e) avec succès
          </Text>

          <View style={styles.successActions}>
            <TouchableOpacity
              style={styles.successButtonSecondary}
              onPress={handleAddAnother}
            >
              <Text style={styles.successButtonSecondaryText}>Ajouter une autre</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.successButtonPrimary}
              onPress={handleGoHome}
            >
              <Text style={styles.successButtonPrimaryText}>Retour à l&apos;accueil</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Nouvelle Transaction</Text>
        <View style={styles.placeholder} />
      </View>

          {/* Activities quick tiles (GIE Mode only) */}
          {isGIEMode && (
            <View style={styles.activitiesSection}>
              <Text style={styles.sectionLabel}>Activités</Text>
              <View style={styles.activitiesGrid}>
                {activities.map(a => (
                  <TouchableOpacity
                    key={a.key}
                    style={[
                      styles.activityTile,
                      selectedActivity === a.key && styles.activityTileActive
                    ]}
                    onPress={a.set}
                  >
                    <Text style={[
                      styles.activityTileText,
                      selectedActivity === a.key && styles.activityTileTextActive
                    ]}>
                      {a.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

      {/* Member Selection (GIE Mode only) */}
      {isGIEMode && (
        <View style={styles.memberSection}>
          <Text style={styles.sectionLabel}>Membre</Text>
          {selectedMember ? (
            <View style={styles.selectedMemberCard}>
              <View style={{ flex: 1 }}>
                <Text style={styles.selectedMemberText}>{selectedMember.name}</Text>
                {selectedMember.phone ? (
                  <Text style={styles.selectedMemberMeta}>{selectedMember.phone}</Text>
                ) : null}
              </View>
              <View style={styles.memberCardActions}>
                <TouchableOpacity
                  onPress={() => setMemberModalVisible(true)}
                  style={styles.changeMemberButton}
                >
                  <Text style={styles.changeMemberText}>Changer</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => setSelectedMember(null)}
                  style={styles.clearMemberButton}
                >
                  <Text style={styles.clearMemberText}>✕</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.selectMemberButton}
              onPress={() => setMemberModalVisible(true)}
            >
              <Text style={styles.selectMemberText}>
                Sélectionner un membre
              </Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Line items for sales */}
      {type === 'income' && (
        <View style={styles.lineItemsSection}>
          <View style={styles.lineItemsHeader}>
            <Text style={styles.sectionLabel}>Produits vendus</Text>
            <TouchableOpacity
              style={styles.addLineItemButton}
              onPress={() => {
                resetLineItemForm();
                setLineItemModalVisible(true);
              }}
            >
              <Plus size={16} color="#059669" />
              <Text style={styles.addLineItemButtonText}>Ajouter</Text>
            </TouchableOpacity>
          </View>

          {lineItems.length === 0 ? (
            <Text style={styles.lineItemsEmptyText}>
              Ajoutez chaque produit vendu pour calculer automatiquement le montant.
            </Text>
          ) : (
            <View style={styles.lineItemsList}>
              {lineItems.map(item => (
                <View key={item.id} style={styles.lineItemRow}>
                  <View style={styles.lineItemInfo}>
                    <Text style={styles.lineItemName}>{item.name}</Text>
                    <Text style={styles.lineItemMeta}>
                      {item.quantity} × {item.unitPrice.toLocaleString('fr-FR')} FCFA
                    </Text>
                  </View>
                  <View style={styles.lineItemAmount}>
                    <Text style={styles.lineItemTotal}>{item.total.toLocaleString('fr-FR')} FCFA</Text>
                    <TouchableOpacity onPress={() => handleRemoveLineItem(item.id)} style={styles.removeLineItemButton}>
                      <Trash2 size={16} color="#EF4444" />
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
              <View style={styles.lineItemsSummary}>
                <Text style={styles.lineItemsSummaryLabel}>Total produits</Text>
                <Text style={styles.lineItemsSummaryValue}>{totalLineItemsAmount.toLocaleString('fr-FR')} FCFA</Text>
              </View>
            </View>
          )}
        </View>
      )}

      {/* Transaction Type Selector */}
      <View style={styles.typeSelector}>
        <TouchableOpacity
          style={[styles.typeButton, type === 'expense' && styles.typeButtonActive]}
          onPress={() => setType('expense')}
        >
          <Text style={[styles.typeButtonText, type === 'expense' && styles.typeButtonTextActive]}>
            Dépense
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.typeButton,
            type === 'income' && styles.typeButtonActiveIncome
          ]}
          onPress={() => setType('income')}
        >
          <Text style={[
            styles.typeButtonText,
            type === 'income' && styles.typeButtonTextActiveIncome
          ]}>
            Revenu
          </Text>
        </TouchableOpacity>
      </View>

      {/* Amount Input */}
      <View style={styles.amountSection}>
        <Text style={styles.amountLabel}>Montant *</Text>
        <View style={styles.amountInputContainer}>
          <Text style={{ fontSize: 18, fontWeight: '700', color: '#6B7280' }}>FCFA</Text>
          <TextInput
            style={styles.amountInput}
            value={amount}
            onChangeText={setAmount}
            placeholder="0"
            keyboardType="numeric"
            placeholderTextColor="#9CA3AF"
            editable={lineItems.length === 0}
            selectTextOnFocus={lineItems.length === 0}
          />
          <Text style={styles.currency}></Text>
        </View>
        {lineItems.length > 0 && (
          <Text style={styles.amountHelper}>Montant calculé automatiquement à partir des produits.</Text>
        )}
        {/* Amount chips */}
        {lineItems.length === 0 && (
          <View style={styles.amountChipsRow}>
            {amountChips.map(v => (
              <TouchableOpacity key={v} style={styles.amountChip} onPress={() => setAmount(v)}>
                <Text style={styles.amountChipText}>{parseInt(v).toLocaleString('fr-FR')}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>


      {/* Category Selection */}
      <View style={styles.inputSection}>
        <Text style={styles.inputLabel}>Catégorie *</Text>
        <View style={styles.categoryGrid}>
          {categories.map((cat) => (
            <TouchableOpacity
              key={cat}
              style={[
                styles.categoryButton,
                category === cat && styles.categoryButtonActive
              ]}
              onPress={() => setCategory(cat)}
            >
              <Text style={[
                styles.categoryButtonText,
                category === cat && styles.categoryButtonTextActive
              ]}>
                {cat}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Submit Button */}
      <TouchableOpacity
        style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
        onPress={handleSubmit}
        disabled={isSubmitting}
      >
        <Plus size={20} color="#FFFFFF" />
        <Text style={styles.submitButtonText}>
          {isSubmitting ? 'Enregistrement...' : 'Ajouter Transaction'}
        </Text>
      </TouchableOpacity>

      {/* Voice Alternative */}
      <TouchableOpacity
        style={styles.voiceAlternative}
        onPress={() => router.push('/(tabs)/voice')}
      >
        <Text style={styles.voiceAlternativeText}>
          🎤 Ou créez un reçu vocal en 5 secondes
        </Text>
      </TouchableOpacity>

      <Modal
        visible={lineItemModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => {
          setLineItemModalVisible(false);
          resetLineItemForm();
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Ajouter un produit</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Nom du produit"
              placeholderTextColor="#9CA3AF"
              value={lineItemName}
              onChangeText={setLineItemName}
            />
            <View style={styles.modalRow}>
              <View style={styles.modalColumn}>
                <Text style={styles.modalLabel}>Quantité</Text>
                <TextInput
                  style={styles.modalInput}
                  placeholder="1"
                  keyboardType="numeric"
                  value={lineItemQuantity}
                  onChangeText={setLineItemQuantity}
                />
              </View>
              <View style={[styles.modalColumn, { marginLeft: 12 }]}>
                <Text style={styles.modalLabel}>Prix (FCFA)</Text>
                <TextInput
                  style={styles.modalInput}
                  placeholder="0"
                  keyboardType="numeric"
                  value={lineItemPrice}
                  onChangeText={setLineItemPrice}
                />
              </View>
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonSecondary]}
                onPress={() => {
                  setLineItemModalVisible(false);
                  resetLineItemForm();
                }}
              >
                <Text style={styles.modalButtonSecondaryText}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonPrimary]}
                onPress={handleAddLineItem}
              >
                <Text style={styles.modalButtonPrimaryText}>Ajouter</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        visible={memberModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setMemberModalVisible(false)}
      >
        <View style={styles.memberModalOverlay}>
          <View style={styles.memberModalContent}>
            <View style={styles.memberModalHeader}>
              <Text style={styles.modalTitle}>Choisir un membre</Text>
              <TouchableOpacity onPress={() => setMemberModalVisible(false)}>
                <X size={22} color="#6B7280" />
              </TouchableOpacity>
            </View>
            <View style={styles.memberModalBody}>
              <MemberGrid
                onSelectMember={(member) => {
                  setSelectedMember(member);
                  setMemberModalVisible(false);
                }}
              />
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  successContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    backgroundColor: '#F8FAFC',
  },
  successTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#10B981',
    marginTop: 20,
    marginBottom: 12,
    textAlign: 'center',
  },
  successMessage: {
    fontSize: 16,
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: 8,
    fontWeight: '500',
  },
  successSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
  successActions: {
    marginTop: 32,
    gap: 12,
    width: '100%',
  },
  successButtonPrimary: {
    backgroundColor: '#059669',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  successButtonPrimaryText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  successButtonSecondary: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  successButtonSecondaryText: {
    color: '#059669',
    fontSize: 16,
    fontWeight: '600',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
  },
  placeholder: {
    width: 40,
  },
  typeSelector: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginBottom: 24,
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    padding: 4,
  },
  typeButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 8,
  },
  typeButtonActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  typeButtonActiveIncome: {
    backgroundColor: '#DCFCE7',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  typeButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#6B7280',
  },
  typeButtonTextActive: {
    color: '#1F2937',
    fontWeight: '600',
  },
  typeButtonTextActiveIncome: {
    color: '#059669',
    fontWeight: '600',
  },
  amountSection: {
    marginHorizontal: 20,
    marginBottom: 24,
  },
  activitiesSection: {
    marginHorizontal: 20,
    marginBottom: 16,
  },
  sectionLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
  },
  activitiesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  activityTile: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  activityTileActive: {
    backgroundColor: '#DCFCE7',
    borderColor: '#059669',
    borderWidth: 2,
  },
  activityTileText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  activityTileTextActive: {
    color: '#059669',
    fontWeight: '700',
  },
  amountLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
  },
  amountInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  amountInput: {
    flex: 1,
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
    marginLeft: 8,
  },
  amountHelper: {
    marginTop: 8,
    fontSize: 12,
    color: '#6B7280',
  },
  amountChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 12,
  },
  amountChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  amountChipText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  currency: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
  },
  inputSection: {
    marginHorizontal: 20,
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    fontSize: 16,
    color: '#1F2937',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  categoryButtonActive: {
    backgroundColor: '#10B981',
    borderColor: '#10B981',
  },
  categoryButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  categoryButtonTextActive: {
    color: '#FFFFFF',
  },
  submitButton: {
    backgroundColor: '#10B981',
    marginHorizontal: 20,
    borderRadius: 12,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
    marginBottom: 16,
  },
  submitButtonDisabled: {
    backgroundColor: '#9CA3AF',
    shadowColor: '#9CA3AF',
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  voiceAlternative: {
    marginHorizontal: 20,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 40,
  },
  voiceAlternativeText: {
    fontSize: 14,
    color: '#059669',
    fontWeight: '600',
  },
  memberSection: {
    marginHorizontal: 20,
    marginBottom: 24,
  },
  selectedMemberCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#DCFCE7',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#059669',
    gap: 12,
  },
  selectedMemberText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#059669',
  },
  selectedMemberMeta: {
    fontSize: 12,
    color: '#065F46',
    marginTop: 4,
  },
  memberCardActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  clearMemberButton: {
    padding: 4,
  },
  clearMemberText: {
    fontSize: 18,
    color: '#059669',
    fontWeight: '700',
  },
  changeMemberButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#059669',
  },
  changeMemberText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#059669',
  },
  selectMemberButton: {
    backgroundColor: '#F0FDF4',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#059669',
    borderStyle: 'dashed',
  },
  selectMemberText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#059669',
  },
  memberGridContainer: {
    marginTop: 12,
    maxHeight: 340,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 12,
  },
  lineItemsSection: {
    marginTop: 24,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 16,
    gap: 12,
  },
  lineItemsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  addLineItemButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F0FDF4',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#059669',
  },
  addLineItemButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#059669',
  },
  lineItemsEmptyText: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  lineItemsList: {
    gap: 12,
  },
  lineItemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  lineItemInfo: {
    flex: 1,
    gap: 4,
  },
  lineItemName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1F2937',
  },
  lineItemMeta: {
    fontSize: 13,
    color: '#6B7280',
  },
  lineItemAmount: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  lineItemTotal: {
    fontSize: 15,
    fontWeight: '700',
    color: '#059669',
  },
  removeLineItemButton: {
    padding: 4,
  },
  lineItemsSummary: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 12,
  },
  lineItemsSummaryLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  lineItemsSummaryValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(17, 24, 39, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContent: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    gap: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  modalInput: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: '#1F2937',
  },
  modalRow: {
    flexDirection: 'row',
  },
  modalColumn: {
    flex: 1,
  },
  modalLabel: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 8,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
  modalButton: {
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 12,
  },
  modalButtonSecondary: {
    backgroundColor: '#F3F4F6',
  },
  modalButtonSecondaryText: {
    color: '#374151',
    fontWeight: '600',
  },
  modalButtonPrimary: {
    backgroundColor: '#059669',
  },
  modalButtonPrimaryText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  memberModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(17, 24, 39, 0.6)',
    justifyContent: 'flex-end',
  },
  memberModalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 12,
    height: '80%',
  },
  memberModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  memberModalBody: {
    flex: 1,
  },
});
