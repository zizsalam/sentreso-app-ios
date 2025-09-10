import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Alert } from 'react-native';
import { useState } from 'react';
import { ArrowLeft, Plus, DollarSign, CircleCheck as CheckCircle } from 'lucide-react-native';
import { router } from 'expo-router';
import { useTransactions } from '@/contexts/TransactionContext';

export default function AddTab() {
  const { addTransaction } = useTransactions();
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [type, setType] = useState<'income' | 'expense'>('expense');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const categories = [
    'Alimentation',
    'Transport',
    'Logement',
    'Santé',
    'Loisirs',
    'Éducation',
    'Salaire',
    'Vente',
    'Autre'
  ];

  const handleSubmit = async () => {
    console.log('📝 Attempting to submit transaction...', { amount, description, category, type });

    if (!amount || !description || !category) {
      Alert.alert('Erreur', 'Veuillez remplir le montant, la description et choisir une catégorie');
      return;
    }

    const numericAmount = parseFloat(amount.replace(/[^\d.]/g, ''));
    if (isNaN(numericAmount) || numericAmount <= 0) {
      Alert.alert('Erreur', 'Veuillez entrer un montant valide');
      return;
    }

    setIsSubmitting(true);

    try {
      const newTransaction = {
        amount: numericAmount,
        description: description.trim(),
        category,
        type,
        date: new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
      };

      console.log('💾 Adding transaction:', newTransaction);

      // Add the transaction
      addTransaction(newTransaction);

      console.log('✅ Transaction added successfully!');

      // Show success state
      setShowSuccess(true);

      // Auto-hide success and reset form after 2 seconds
      setTimeout(() => {
        setShowSuccess(false);
        setAmount('');
        setDescription('');
        setCategory('');
        setIsSubmitting(false);

        // Navigate back to home to see the new transaction
        router.push('/');
      }, 2000);

    } catch (error) {
      console.error('❌ Error adding transaction:', error);
      setIsSubmitting(false);
      Alert.alert('Erreur', 'Une erreur est survenue lors de l\'enregistrement');
    }
  };

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('fr-FR').format(amount);
  };

  if (showSuccess) {
    return (
      <View style={styles.container}>
        <View style={styles.successContainer}>
          <CheckCircle size={64} color="#10B981" />
          <Text style={styles.successTitle}>Transaction Enregistrée!</Text>
          <Text style={styles.successMessage}>
            {type === 'income' ? 'Revenu' : 'Dépense'} de {formatAmount(parseFloat(amount.replace(/[^\d.]/g, '')))} FCFA ajouté(e) avec succès
          </Text>
          <Text style={styles.successSubtitle}>Redirection vers l'accueil...</Text>
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
          style={[styles.typeButton, type === 'income' && styles.typeButtonActive]}
          onPress={() => setType('income')}
        >
          <Text style={[styles.typeButtonText, type === 'income' && styles.typeButtonTextActive]}>
            Revenu
          </Text>
        </TouchableOpacity>
      </View>

      {/* Amount Input */}
      <View style={styles.amountSection}>
        <Text style={styles.amountLabel}>Montant *</Text>
        <View style={styles.amountInputContainer}>
          <DollarSign size={24} color="#6B7280" />
          <TextInput
            style={styles.amountInput}
            value={amount}
            onChangeText={setAmount}
            placeholder="0"
            keyboardType="numeric"
            placeholderTextColor="#9CA3AF"
          />
          <Text style={styles.currency}>FCFA</Text>
        </View>
      </View>

      {/* Description Input */}
      <View style={styles.inputSection}>
        <Text style={styles.inputLabel}>Description *</Text>
        <TextInput
          style={styles.textInput}
          value={description}
          onChangeText={setDescription}
          placeholder="Ex: Achat de nourriture"
          placeholderTextColor="#9CA3AF"
        />
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
  typeButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#6B7280',
  },
  typeButtonTextActive: {
    color: '#1F2937',
    fontWeight: '600',
  },
  amountSection: {
    marginHorizontal: 20,
    marginBottom: 24,
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
    fontSize: 16,
    color: '#6366F1',
    fontWeight: '500',
  },
});
