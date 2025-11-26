import { View, Text, StyleSheet, TouchableOpacity, Alert, TextInput } from 'react-native';
import { useState, useRef } from 'react';
import { ArrowLeft, Phone, CircleCheck as CheckCircle, CreditCard as Edit3 } from 'lucide-react-native';
import { router } from 'expo-router';
import { awardOnTxnConfirmed } from '@/src/game/engine';
import { useTransactions } from '@/contexts/TransactionContext';

export default function VoiceTab() {
  const { addTransaction } = useTransactions();

  // Voice recording states
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [transcription, setTranscription] = useState('');
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [client, setClient] = useState('');
  const [type, setType] = useState<'income' | 'expense'>('expense');
  const [isComplete, setIsComplete] = useState(false);
  const [lastCallResult, setLastCallResult] = useState<any>(null);
  const amountInputRef = useRef<TextInput>(null);

  // Format FCFA amount
  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('fr-FR').format(amount);
  };

  // Sample voice transcriptions for demo
  const sampleTranscriptions = [
    "Vente de 5000 francs à Moussa pour réparation téléphone",
    "Achat de 2500 francs chez le pharmacien pour médicaments",
    "Revenu de 15000 francs de Mame Fatou pour couture",
    "Dépense de 800 francs pour transport en taxi",
    "Vente de 3000 francs à Amadou pour réparation radio",
    "Achat de 1200 francs au marché pour provisions",
    "Revenu de 8000 francs de Fatou pour coiffure",
    "Dépense de 600 francs pour recharge téléphone"
  ];

  // Enhanced fake recording with realistic simulation
  const startFakeRecording = () => {
    setIsRecording(true);
    setTranscription('');

    // Simulate recording for 3-4 seconds
    setTimeout(() => {
      setIsRecording(false);
      setIsProcessing(true);

      // Simulate processing for 2 seconds
      setTimeout(() => {
        setIsProcessing(false);

        // Generate random sample transcription
        const randomTranscription = sampleTranscriptions[Math.floor(Math.random() * sampleTranscriptions.length)];
        setTranscription(randomTranscription);

        // Auto-parse the transcription
        parseTranscription(randomTranscription);
      }, 2000);
    }, 3000 + Math.random() * 1000); // 3-4 seconds recording
  };

  // Parse transcription and fill form automatically
  const parseTranscription = (text: string) => {
    // Extract amount (look for numbers)
    const amountMatch = text.match(/(\d+(?:\s*\d+)*)/);
    if (amountMatch) {
      setAmount(amountMatch[1].replace(/\s/g, ''));
    }

    // Determine type based on keywords
    const incomeKeywords = ['vente', 'revenu', 'reçu', 'payé par'];
    const expenseKeywords = ['achat', 'dépense', 'payé pour', 'acheté'];

    const lowerText = text.toLowerCase();
    if (incomeKeywords.some(keyword => lowerText.includes(keyword))) {
      setType('income');
    } else if (expenseKeywords.some(keyword => lowerText.includes(keyword))) {
      setType('expense');
    }

    // Extract client name (after "à" or "pour")
    const clientMatch = text.match(/(?:à|pour)\s+([A-Za-z\s]+?)(?:\s+pour|\s+de|$)/);
    if (clientMatch) {
      setClient(clientMatch[1].trim());
    }

    // Set description (full transcription)
    setDescription(text);

    // Show confirmation form
    setShowConfirmation(true);
  };

  // Save transaction
  const handleSaveTransaction = () => {
    if (!amount || !description) {
      Alert.alert('Erreur', 'Veuillez remplir au moins le montant et la description');
      return;
    }
    const numericAmount = parseFloat(amount.replace(/[^\d.]/g, ''));
    if (isNaN(numericAmount) || numericAmount <= 0) {
      Alert.alert('Erreur', 'Veuillez entrer un montant valide');
      return;
    }
    const newTransaction = {
      amount: numericAmount,
      description: description.trim(),
      category: type === 'income' ? 'Revenus' : 'Dépenses',
      type: type,
      date: new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
    };
    addTransaction(newTransaction);
    try { void awardOnTxnConfirmed({ type: newTransaction.type }); } catch {}
    setLastCallResult({
      ...newTransaction,
      client: client.trim() || 'Non spécifié'
    });
    setIsComplete(true);
  };

  // Reset state
  const resetCall = () => {
    setIsComplete(false);
    setShowConfirmation(false);
    setLastCallResult(null);
    setAmount('');
    setDescription('');
    setClient('');
    setType('expense');
    setIsRecording(false);
    setIsProcessing(false);
    setTranscription('');
  };

  // Success screen
  if (isComplete && lastCallResult) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <ArrowLeft size={24} color="#1F2937" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Transaction Créée</Text>
          <View style={styles.placeholder} />
        </View>

        <View style={styles.successContainer}>
          <View style={styles.successCard}>
            <CheckCircle size={64} color="#10B981" />
            <Text style={styles.successTitle}>🎉 Transaction enregistrée!</Text>

            <View style={styles.receiptCard}>
              <Text style={styles.receiptTitle}>📄 Détails de la transaction</Text>
              <View style={styles.receiptDetails}>
                <View style={styles.receiptRow}>
                  <Text style={styles.receiptLabel}>💰 Montant:</Text>
                  <Text style={styles.receiptValue}>{formatAmount(lastCallResult.amount)} FCFA</Text>
                </View>
                <View style={styles.receiptRow}>
                  <Text style={styles.receiptLabel}>👤 Client:</Text>
                  <Text style={styles.receiptValue}>{lastCallResult.client}</Text>
                </View>
                <View style={styles.receiptRow}>
                  <Text style={styles.receiptLabel}>📝 Description:</Text>
                  <Text style={styles.receiptValue}>{lastCallResult.description}</Text>
                </View>
                <View style={styles.receiptRow}>
                  <Text style={styles.receiptLabel}>🏷️ Type:</Text>
                  <Text style={styles.receiptValue}>
                    {lastCallResult.type === 'income' ? '💰 Revenu' : '💸 Dépense'}
                  </Text>
                </View>
              </View>
            </View>

            <View style={styles.actionButtons}>
              <TouchableOpacity style={styles.primaryButton} onPress={() => router.push('/(tabs)')}>
                <Text style={styles.primaryButtonText}>📊 Voir les transactions</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.secondaryButton} onPress={resetCall}>
                <Text style={styles.secondaryButtonText}>📞 Nouvelle transaction</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    );
  }

  // Confirmation form
  if (showConfirmation) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => setShowConfirmation(false)} style={styles.backButton}>
            <ArrowLeft size={24} color="#1F2937" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Nouvelle Transaction</Text>
          <View style={styles.placeholder} />
        </View>

        <View style={styles.inputForm}>
          <Text style={styles.formTitle}>Saisissez les détails de votre transaction:</Text>

          <View style={styles.typeSelector}>
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
                💰 Revenu
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.typeButton, type === 'expense' && styles.typeButtonActive]}
              onPress={() => setType('expense')}
            >
              <Text style={[styles.typeButtonText, type === 'expense' && styles.typeButtonTextActive]}>
                💸 Dépense
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>💵 Montant (FCFA) *</Text>
            <TextInput
              ref={amountInputRef}
              style={styles.textInput}
              value={amount}
              onChangeText={setAmount}
              placeholder="Ex: 25000"
              keyboardType="numeric"
              placeholderTextColor="#9CA3AF"
              autoFocus
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>📝 Description *</Text>
            <TextInput
              style={styles.textInput}
              value={description}
              onChangeText={setDescription}
              placeholder="Ex: Vente de produits"
              placeholderTextColor="#9CA3AF"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>👤 Client (optionnel)</Text>
            <TextInput
              style={styles.textInput}
              value={client}
              onChangeText={setClient}
              placeholder="Ex: Boutique Salam"
              placeholderTextColor="#9CA3AF"
            />
          </View>

          <View style={styles.formActions}>
            <TouchableOpacity style={styles.saveButton} onPress={handleSaveTransaction}>
              <CheckCircle size={20} color="#FFFFFF" />
              <Text style={styles.saveButtonText}>Enregistrer</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.cancelButton} onPress={() => setShowConfirmation(false)}>
              <Text style={styles.cancelButtonText}>Annuler</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }

  // Main screen with simple fake recording button
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>🎤 Transaction Vocale</Text>
        <View style={styles.placeholder} />
      </View>

      <View style={styles.content}>
        <View style={{ alignItems: 'center', marginVertical: 32 }}>
          {/* Recording States */}
          {!isRecording && !isProcessing && !transcription && (
            <>
              <TouchableOpacity
                style={styles.recordingButton}
                onPress={startFakeRecording}
              >
                <Phone size={40} color="#FFFFFF" />
              </TouchableOpacity>
              <Text style={styles.instructionTitle}>
                Appuyez pour commencer l'enregistrement
              </Text>
            </>
          )}

          {isRecording && (
            <>
              <View style={[styles.recordingButton, styles.recordingActive]}>
                <Phone size={40} color="#FFFFFF" />
              </View>
              <Text style={styles.instructionTitle}>
                🎤 Enregistrement en cours...
              </Text>
              <Text style={styles.instructionSubtext}>
                Parlez clairement dans votre téléphone
              </Text>
            </>
          )}

          {isProcessing && (
            <>
              <View style={[styles.recordingButton, styles.processingActive]}>
                <Text style={styles.processingIcon}>⚡</Text>
              </View>
              <Text style={styles.instructionTitle}>
                🔄 Traitement en cours...
              </Text>
              <Text style={styles.instructionSubtext}>
                Conversion de votre voix en texte
              </Text>
            </>
          )}

          {transcription && !showConfirmation && (
            <>
              <View style={styles.transcriptionCard}>
                <Text style={styles.transcriptionTitle}>🎯 Transcription détectée:</Text>
                <Text style={styles.transcriptionResult}>"{transcription}"</Text>
                <TouchableOpacity
                  style={styles.useTranscriptionButton}
                  onPress={() => setShowConfirmation(true)}
                >
                  <Text style={styles.useTranscriptionButtonText}>Utiliser cette transcription</Text>
                </TouchableOpacity>
              </View>
            </>
          )}
          <Text style={styles.instructionText}>
            Simulez une transaction vocale
          </Text>
        </View>

        <TouchableOpacity
          style={styles.manualOption}
          onPress={() => setShowConfirmation(true)}
        >
          <Edit3 size={20} color="#6366F1" />
          <Text style={styles.manualOptionText}>✏️ Saisie manuelle directe</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
  },
  placeholder: {
    width: 40,
  },
  statusBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  statusItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '500',
  },
  platformText: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  recordingStatus: {
    marginBottom: 30,
  },
  recordingCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    borderWidth: 2,
    borderColor: '#EF4444',
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  recordingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  recordingIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#EF4444',
    marginRight: 8,
  },
  recordingText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  timerText: {
    fontSize: 32,
    fontWeight: '800',
    color: '#EF4444',
    textAlign: 'center',
    marginBottom: 16,
  },
  audioLevelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  audioLevelLabel: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  audioLevelBar: {
    flex: 1,
    height: 4,
    backgroundColor: '#E5E7EB',
    borderRadius: 2,
    overflow: 'hidden',
  },
  audioLevelFill: {
    height: '100%',
    backgroundColor: '#10B981',
    borderRadius: 2,
  },
  processingCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#6366F1',
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  processingIndicator: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 3,
    borderColor: '#6366F1',
    borderTopColor: 'transparent',
    marginBottom: 12,
  },
  processingText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  processingSubtext: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
  liveTranscription: {
    marginTop: 12,
    padding: 12,
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
  },
  processingTranscription: {
    marginTop: 12,
    padding: 12,
    backgroundColor: '#EEF2FF',
    borderRadius: 8,
    width: '100%',
  },
  transcriptionLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 4,
  },
  transcriptionText: {
    fontSize: 14,
    color: '#6366F1',
    fontStyle: 'italic',
  },
  instructionText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 8,
  },
  recordingSection: {
    alignItems: 'center',
    marginBottom: 40,
  },
  recordingButton: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: '#10B981',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
    marginBottom: 32,
  },
  recordingButtonActive: {
    backgroundColor: '#EF4444',
    shadowColor: '#EF4444',
  },
  recordingButtonDisabled: {
    backgroundColor: '#9CA3AF',
    shadowColor: '#9CA3AF',
    opacity: 0.6,
  },
  recordingButtonError: {
    backgroundColor: '#6B7280',
    shadowColor: '#6B7280',
  },
  instructions: {
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  instructionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: 8,
  },
  instructionExample: {
    fontSize: 14,
    color: '#6366F1',
    textAlign: 'center',
    fontStyle: 'italic',
    paddingHorizontal: 20,
    backgroundColor: '#EEF2FF',
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  retryButton: {
    backgroundColor: '#6366F1',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 12,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  manualOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  manualOptionText: {
    fontSize: 16,
    color: '#6366F1',
    fontWeight: '500',
  },
  // Manual Input Form Styles
  inputForm: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    margin: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  formTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 16,
    textAlign: 'center',
  },
  transcriptionDisplay: {
    backgroundColor: '#EEF2FF',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  typeSelector: {
    flexDirection: 'row',
    marginBottom: 16,
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    padding: 2,
  },
  typeButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 6,
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
    fontSize: 14,
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
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 6,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    color: '#1F2937',
    backgroundColor: '#FFFFFF',
  },
  formActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  saveButton: {
    flex: 2,
    backgroundColor: '#10B981',
    borderRadius: 8,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  saveButtonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  cancelButtonText: {
    color: '#6B7280',
    fontSize: 16,
    fontWeight: '600',
  },
  // Success Screen Styles
  successContainer: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  successCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
  },
  successTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#10B981',
    marginTop: 16,
    marginBottom: 20,
    textAlign: 'center',
  },
  receiptCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 16,
    width: '100%',
    marginBottom: 20,
  },
  receiptTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
    textAlign: 'center',
  },
  receiptDetails: {
    gap: 8,
  },
  receiptRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  receiptLabel: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
    flex: 1,
  },
  receiptValue: {
    fontSize: 14,
    color: '#1F2937',
    fontWeight: '600',
    flex: 2,
    textAlign: 'right',
  },
  receiptValueItalic: {
    fontSize: 14,
    color: '#6366F1',
    fontStyle: 'italic',
    flex: 2,
    textAlign: 'right',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  primaryButton: {
    flex: 1,
    backgroundColor: '#10B981',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  secondaryButton: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  secondaryButtonText: {
    color: '#6B7280',
    fontSize: 14,
    fontWeight: '600',
  },
  // Manual Entry Styles
  manualEntrySection: {
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  manualEntryText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 12,
  },
  manualEntryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F3F4F6',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 8,
  },
  manualEntryButtonText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  // New Recording State Styles
  recordingActive: {
    backgroundColor: '#EF4444',
    transform: [{ scale: 1.1 }],
  },
  processingActive: {
    backgroundColor: '#6366F1',
    transform: [{ scale: 1.1 }],
  },
  processingIcon: {
    fontSize: 32,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  instructionSubtext: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 8,
  },
  transcriptionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    borderWidth: 2,
    borderColor: '#10B981',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
    width: '100%',
    marginTop: 20,
  },
  transcriptionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
    textAlign: 'center',
  },
  transcriptionResult: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
    marginBottom: 16,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  useTranscriptionButton: {
    backgroundColor: '#10B981',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
  },
  useTranscriptionButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
});
