import { useState, useEffect } from 'react';
import { Text, View, TouchableOpacity, StyleSheet, ScrollView, SafeAreaView, TextInput, Alert } from 'react-native';
import { TransactionProvider, useTransactions } from '@/contexts/TransactionContext';
import { UserProvider, useUserDetails } from '@/contexts/UserContext';
import { TrendingUp, ArrowUpRight, ArrowDownLeft, ChartBar as BarChart3, Plus, Mic } from 'lucide-react-native';
// @ts-ignore: No type definitions for react-native-voice
import Voice from 'react-native-voice';
function DistributorDashboard({ onNavigate }: { onNavigate: (screen: Screen) => void }) {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.screenHeader}>
        <Text style={styles.screenTitle}>Tableau de bord Distributeur</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.formScrollView}>
        <View style={{ padding: 20 }}>
          <TouchableOpacity style={[styles.primaryButton, { backgroundColor: '#2563EB' }]} onPress={() => onNavigate('distCreate')}>
            <Text style={styles.primaryButtonText}>Enregistrer un marchand</Text>
          </TouchableOpacity>

          <View style={{ marginTop: 24 }}>
            <Text style={styles.sectionTitle}>Mes marchands</Text>
            <Text style={{ color: '#6B7280' }}>Liste à venir (intégration REST)</Text>
          </View>

          <View style={{ marginTop: 24 }}>
            <Text style={styles.sectionTitle}>Productivité</Text>
            <Text style={{ color: '#6B7280' }}>Vous avez enregistré X marchands</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function DistributorCreate({ onNavigate }: { onNavigate: (screen: Screen) => void }) {
  const [name, setName] = useState('');
  const [contact, setContact] = useState('');
  const [hasAccount, setHasAccount] = useState(false);
  const [merchantEmail, setMerchantEmail] = useState('');

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.screenHeader}>
        <TouchableOpacity style={styles.backButton} onPress={() => onNavigate('distDashboard')}>
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.screenTitle}>Enregistrer un marchand</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.formScrollView}>
        <View style={styles.formContainer}>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Nom *</Text>
            <TextInput style={styles.textInput} value={name} onChangeText={setName} placeholder="Boutique A" />
          </View>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Téléphone / Email (optionnel)</Text>
            <TextInput style={styles.textInput} value={contact} onChangeText={setContact} placeholder="77 123 45 67 / email@exemple.com" />
          </View>

          <View style={{ marginBottom: 16 }}>
            <TouchableOpacity style={[styles.secondaryButton, { justifyContent: 'flex-start' }]} onPress={() => setHasAccount(!hasAccount)}>
              <Text style={styles.secondaryButtonText}>{hasAccount ? '☑' : '☐'} Le marchand a déjà un compte</Text>
            </TouchableOpacity>
          </View>

          {hasAccount && (
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Email du marchand</Text>
              <TextInput style={styles.textInput} value={merchantEmail} onChangeText={setMerchantEmail} placeholder="merchant@email.com" />
            </View>
          )}

          <View style={styles.actionButtons}>
            <TouchableOpacity style={[styles.primaryButton, { backgroundColor: '#2563EB' }]} onPress={() => onNavigate('distDashboard')}>
              <Text style={styles.primaryButtonText}>Enregistrer</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.secondaryButton} onPress={() => onNavigate('distDashboard')}>
              <Text style={styles.secondaryButtonText}>Annuler</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

type Screen = 'home' | 'add' | 'voice' | 'analytics' | 'transactions' | 'edit' | 'distDashboard' | 'distCreate';

function TabBar({ currentScreen, onNavigate }: { currentScreen: Screen; onNavigate: (screen: Screen) => void }) {
  return (
    <View style={styles.tabBar}>
      <TouchableOpacity
        style={[styles.tabItem, currentScreen === 'home' && styles.tabItemActive]}
        onPress={() => onNavigate('home')}
      >
        <View style={styles.tabIcon}>
          <Text style={[styles.tabIconText, currentScreen === 'home' && styles.tabIconTextActive]}>🏠</Text>
        </View>
        <Text style={[styles.tabLabel, currentScreen === 'home' && styles.tabLabelActive]}>Accueil</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.tabItem, currentScreen === 'add' && styles.tabItemActive]}
        onPress={() => onNavigate('add')}
      >
        <View style={styles.tabIcon}>
          <Text style={[styles.tabIconText, currentScreen === 'add' && styles.tabIconTextActive]}>➕</Text>
        </View>
        <Text style={[styles.tabLabel, currentScreen === 'add' && styles.tabLabelActive]}>Ajouter</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.tabItem, currentScreen === 'voice' && styles.tabItemActive]}
        onPress={() => onNavigate('voice')}
      >
        <View style={styles.tabIcon}>
          <Text style={[styles.tabIconText, currentScreen === 'voice' && styles.tabIconTextActive]}>🎤</Text>
        </View>
        <Text style={[styles.tabLabel, currentScreen === 'voice' && styles.tabLabelActive]}>Vocal</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.tabItem, currentScreen === 'analytics' && styles.tabItemActive]}
        onPress={() => onNavigate('analytics')}
      >
        <View style={styles.tabIcon}>
          <Text style={[styles.tabIconText, currentScreen === 'analytics' && styles.tabIconTextActive]}>📊</Text>
        </View>
        <Text style={[styles.tabLabel, currentScreen === 'analytics' && styles.tabLabelActive]}>Stats</Text>
      </TouchableOpacity>
    </View>
  );
}

function HomeScreen({ onNavigate }: { onNavigate: (screen: Screen, params?: any) => void }) {
  const { getTotalBalance, getMonthlyIncome, getMonthlyExpenses, getRecentTransactions } = useTransactions();
  const { clearUserDetails } = useUserDetails();

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('fr-FR').format(amount);
  };

  const totalBalance = getTotalBalance();
  const monthlyIncome = getMonthlyIncome();
  const monthlyExpenses = getMonthlyExpenses();
  const recentTransactions = getRecentTransactions(3);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header with Sentreso logo and logout button */}
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <View style={styles.logo}>
              <View style={styles.logoIcon} />
            </View>
          </View>
          <View style={styles.headerSpacer} />
          <View style={styles.headerButtons}>
            <TouchableOpacity
              style={styles.deleteAccountButton}
              onPress={() => {
                Alert.alert(
                  "Supprimer le compte",
                  "Êtes-vous sûr de vouloir supprimer votre compte ? Cette action est irréversible.",
                  [
                    { text: "Annuler", style: "cancel" },
                    {
                      text: "Supprimer",
                      style: "destructive",
                      onPress: () => {
                        clearUserDetails();
                        Alert.alert("Compte supprimé", "Votre compte a été supprimé avec succès.");
                      }
                    }
                  ]
                );
              }}
            >
              <Text style={styles.deleteAccountButtonText}>🗑️</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.logoutButton}
              onPress={() => {
                Alert.alert(
                  "Déconnexion",
                  "Êtes-vous sûr de vouloir vous déconnecter ?",
                  [
                    { text: "Annuler", style: "cancel" },
                    {
                      text: "Se déconnecter",
                      style: "destructive",
                      onPress: () => {
                        clearUserDetails();
                        Alert.alert("Déconnexion", "Vous avez été déconnecté avec succès.");
                      }
                    }
                  ]
                );
              }}
            >
              <Text style={styles.logoutButtonText}>Se déconnecter</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Greeting */}
        <View style={styles.greetingSection}>
          <Text style={styles.greeting}>Bonjour 👋</Text>
          <Text style={styles.subtitle}>Gérez vos finances facilement</Text>
        </View>

        {/* Total Balance Card */}
        <View style={styles.balanceCard}>
          <Text style={styles.balanceLabel}>Solde Total</Text>
          <Text style={styles.balanceAmount}>{formatAmount(totalBalance)} FCFA</Text>
          <View style={styles.balanceChange}>
            <TrendingUp size={16} color="#10B981" />
            <Text style={styles.balanceChangeText}>
              {monthlyIncome > monthlyExpenses ? '+' : ''}{formatAmount(monthlyIncome - monthlyExpenses)} ce mois
            </Text>
          </View>
        </View>

        {/* Revenue and Expenses */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <View style={styles.statHeader}>
              <View style={styles.statIconContainer}>
                <ArrowUpRight size={16} color="#10B981" />
              </View>
              <Text style={styles.statLabel}>Revenus</Text>
            </View>
            <Text style={styles.statAmountPositive}>+{formatAmount(monthlyIncome)}</Text>
            <Text style={styles.statPeriod}>Ce mois</Text>
          </View>

          <View style={styles.statCard}>
            <View style={styles.statHeader}>
              <View style={[styles.statIconContainer, styles.statIconContainerRed]}>
                <ArrowDownLeft size={16} color="#EF4444" />
              </View>
              <Text style={styles.statLabel}>Dépenses</Text>
            </View>
            <Text style={styles.statAmountNegative}>-{formatAmount(monthlyExpenses)}</Text>
            <Text style={styles.statPeriod}>Ce mois</Text>
          </View>
        </View>

        {/* Recent Transactions */}
        {recentTransactions.length > 0 && (
          <View style={styles.recentTransactionsContainer}>
            <View style={styles.recentTransactionsHeader}>
              <Text style={styles.recentTransactionsTitle}>Transactions Récentes</Text>
              <TouchableOpacity
                style={styles.viewAllButton}
                onPress={() => onNavigate('transactions')}
              >
                <Text style={styles.viewAllButtonText}>Voir tout</Text>
              </TouchableOpacity>
            </View>
            {recentTransactions.map((transaction) => (
              <TouchableOpacity
                key={transaction.id}
                style={styles.transactionItem}
                onPress={() => onNavigate('edit', { transactionId: transaction.id })}
              >
                <View style={styles.transactionInfo}>
                  <Text style={styles.transactionDescription}>{transaction.description}</Text>
                  <Text style={styles.transactionCategory}>{transaction.category}</Text>
                </View>
                <View style={styles.transactionAmount}>
                  <Text style={[
                    styles.transactionAmountText,
                    transaction.type === 'income' ? styles.transactionAmountPositive : styles.transactionAmountNegative
                  ]}>
                    {transaction.type === 'income' ? '+' : '-'}{formatAmount(transaction.amount)}
                  </Text>
                  <Text style={styles.transactionDate}>
                    {transaction.createdAt.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity style={styles.primaryButton} onPress={() => onNavigate('add')}>
            <Plus size={20} color="#FFFFFF" />
            <Text style={styles.primaryButtonText}>Nouvelle Transaction</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.secondaryButton} onPress={() => onNavigate('analytics')}>
            <BarChart3 size={20} color="#6366F1" />
            <Text style={styles.secondaryButtonText}>Voir les Stats</Text>
          </TouchableOpacity>
        </View>

        {/* Voice Feature Highlight */}
        <View style={styles.voiceHighlight}>
          <View style={styles.voiceCard}>
            <View style={styles.voiceHeader}>
              <Mic size={24} color="#EF4444" />
              <Text style={styles.voiceTitle}>Transaction Vocale</Text>
            </View>
            <Text style={styles.voiceDescription}>
              Enregistrez vos transactions en parlant simplement
            </Text>
            <TouchableOpacity style={styles.voiceButton} onPress={() => onNavigate('voice')}>
              <Text style={styles.voiceButtonText}>Commencer</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function AddScreen({ onNavigate }: { onNavigate: (screen: Screen) => void }) {
  const { addTransaction } = useTransactions();
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [type, setType] = useState<'income' | 'expense'>('expense');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const categories = {
    income: ['Salaire', 'Freelance', 'Investissement', 'Autre'],
    expense: ['Alimentation', 'Transport', 'Logement', 'Santé', 'Loisirs', 'Shopping', 'Autre']
  };

  const handleSubmit = async () => {
    if (!amount || !description || !category) {
      alert('Veuillez remplir tous les champs obligatoires');
      return;
    }

    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      alert('Veuillez entrer un montant valide');
      return;
    }

    setIsSubmitting(true);
    try {
      await addTransaction({
        amount: numAmount,
        description,
        category,
        type,
        date
      });

      // Reset form
      setAmount('');
      setDescription('');
      setCategory('');
      setType('expense');
      setDate(new Date().toISOString().split('T')[0]);

      // Navigate back to home
      onNavigate('home');
    } catch (error) {
      alert('Erreur lors de l\'ajout de la transaction');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.screenHeader}>
        <TouchableOpacity style={styles.backButton} onPress={() => onNavigate('home')}>
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.screenTitle}>Nouvelle Transaction</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.formScrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.formContainer}>
          {/* Transaction Type Toggle */}
          <View style={styles.typeToggleContainer}>
            <TouchableOpacity
              style={[styles.typeToggle, type === 'expense' && styles.typeToggleActive]}
              onPress={() => setType('expense')}
            >
              <Text style={[styles.typeToggleText, type === 'expense' && styles.typeToggleTextActive]}>
                Dépense
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.typeToggle, type === 'income' && styles.typeToggleActive]}
              onPress={() => setType('income')}
            >
              <Text style={[styles.typeToggleText, type === 'income' && styles.typeToggleTextActive]}>
                Revenu
              </Text>
            </TouchableOpacity>
          </View>

          {/* Amount Input */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Montant (FCFA)</Text>
            <View style={styles.amountInputContainer}>
              <Text style={styles.currencySymbol}>FCFA</Text>
              <TextInput
                style={styles.amountInput}
                value={amount}
                onChangeText={setAmount}
                placeholder="0"
                keyboardType="numeric"
                placeholderTextColor="#9CA3AF"
              />
            </View>
          </View>

          {/* Description Input */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Description</Text>
            <TextInput
              style={styles.textInput}
              value={description}
              onChangeText={setDescription}
              placeholder="Ex: Achat de nourriture"
              placeholderTextColor="#9CA3AF"
            />
          </View>

          {/* Category Selection */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Catégorie</Text>
            <View style={styles.categoryGrid}>
              {categories[type].map((cat) => (
                <TouchableOpacity
                  key={cat}
                  style={[styles.categoryButton, category === cat && styles.categoryButtonActive]}
                  onPress={() => setCategory(cat)}
                >
                  <Text style={[styles.categoryButtonText, category === cat && styles.categoryButtonTextActive]}>
                    {cat}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Date Input */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Date</Text>
            <TextInput
              style={styles.textInput}
              value={date}
              onChangeText={setDate}
              placeholder="YYYY-MM-DD"
              placeholderTextColor="#9CA3AF"
            />
          </View>

          {/* Submit Button */}
          <TouchableOpacity
            style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={isSubmitting}
          >
            <Text style={styles.submitButtonText}>
              {isSubmitting ? 'Ajout en cours...' : 'Ajouter la Transaction'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function VoiceScreen({ onNavigate }: { onNavigate: (screen: Screen) => void }) {
  const { addTransaction } = useTransactions();
  const [isRecording, setIsRecording] = useState(false);
  const [transcription, setTranscription] = useState('');
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [client, setClient] = useState('');
  const [type, setType] = useState<'income' | 'expense'>('expense');
  const [isComplete, setIsComplete] = useState(false);
  const [lastCallResult, setLastCallResult] = useState<any>(null);

  // Format FCFA amount
  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('fr-FR').format(amount);
  };

    // Fake recording - simulate recording then show transcription
  const startFakeRecording = () => {
    setIsRecording(true);
    setTranscription('');

    // Simulate recording for 6 seconds (increased from 3)
    setTimeout(() => {
      setIsRecording(false);
      // Show random fake transcription from different categories
      const transcriptions = [
        "J'ai vendu pour 25000 francs de produits alimentaires à Madame Diop",
        "J'ai dépensé 15000 francs pour l'achat de marchandises au marché",
        "J'ai reçu 45000 francs de paiement de la boutique Salam",
        "J'ai payé 8000 francs pour le transport et la livraison",
        "J'ai vendu pour 35000 francs de produits cosmétiques à Mademoiselle Fatou",
        "J'ai acheté 12000 francs de matières premières chez le fournisseur",
        "J'ai reçu 60000 francs de vente de vêtements à la clientèle",
        "J'ai dépensé 5000 francs pour les frais de communication",
        "J'ai vendu pour 28000 francs de produits électroniques à Monsieur Diallo",
        "J'ai payé 18000 francs pour les services de maintenance"
      ];
      const randomTranscription = transcriptions[Math.floor(Math.random() * transcriptions.length)];
      setTranscription(randomTranscription);
    }, 6000);
  };

  // Save transaction
  const handleSaveTransaction = () => {
    if (!amount || !description) {
      alert('Veuillez remplir au moins le montant et la description');
      return;
    }
    const numericAmount = parseFloat(amount.replace(/[^\d.]/g, ''));
    if (isNaN(numericAmount) || numericAmount <= 0) {
      alert('Veuillez entrer un montant valide');
      return;
    }
    const newTransaction = {
      amount: numericAmount,
      description: description.trim(),
      category: type === 'income' ? 'Revenus' : 'Dépenses',
      type: type,
      date: new Date().toISOString().split('T')[0] // Save as ISO date string
    };
    addTransaction(newTransaction);
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
    setTranscription('');
    setIsRecording(false);
  };

  // Success screen
  if (isComplete && lastCallResult) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.screenHeader}>
          <TouchableOpacity style={styles.backButton} onPress={() => onNavigate('home')}>
            <Text style={styles.backButtonText}>←</Text>
          </TouchableOpacity>
          <Text style={styles.screenTitle}>Transaction Créée</Text>
          <View style={styles.placeholder} />
        </View>

        <ScrollView style={styles.voiceScrollView} showsVerticalScrollIndicator={false}>
          <View style={styles.voiceContainer}>
            <View style={styles.voiceInstructions}>
              <Text style={styles.voiceInstructionsTitle}>🎉 Transaction enregistrée!</Text>
              <Text style={styles.voiceInstructionsText}>
                Montant: {formatAmount(lastCallResult.amount)} FCFA
              </Text>
              <Text style={styles.voiceInstructionsText}>
                Description: {lastCallResult.description}
              </Text>
              <Text style={styles.voiceInstructionsText}>
                Type: {lastCallResult.type === 'income' ? '💰 Revenu' : '💸 Dépense'}
              </Text>
            </View>

            <View style={styles.recordingSection}>
              <TouchableOpacity style={styles.primaryButton} onPress={() => onNavigate('home')}>
                <Text style={styles.primaryButtonText}>📊 Voir les transactions</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.secondaryButton} onPress={resetCall}>
                <Text style={styles.secondaryButtonText}>📞 Nouvelle transaction</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

    // Confirmation form
  if (showConfirmation) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.screenHeader}>
          <TouchableOpacity style={styles.backButton} onPress={() => setShowConfirmation(false)}>
            <Text style={styles.backButtonText}>←</Text>
          </TouchableOpacity>
          <Text style={styles.screenTitle}>Nouvelle Transaction</Text>
          <View style={styles.placeholder} />
        </View>

        <ScrollView style={styles.formScrollView} showsVerticalScrollIndicator={false}>
          <View style={styles.formContainer}>
            <Text style={styles.screenSubtitle}>Saisissez les détails de votre transaction:</Text>

            <View style={styles.typeToggleContainer}>
              <TouchableOpacity
                style={[styles.typeToggle, type === 'income' && styles.typeToggleActive]}
                onPress={() => setType('income')}
              >
                <Text style={[styles.typeToggleText, type === 'income' && styles.typeToggleTextActive]}>
                  💰 Revenu
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.typeToggle, type === 'expense' && styles.typeToggleActive]}
                onPress={() => setType('expense')}
              >
                <Text style={[styles.typeToggleText, type === 'expense' && styles.typeToggleTextActive]}>
                  💸 Dépense
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>💵 Montant (FCFA) *</Text>
              <TextInput
                style={styles.textInput}
                value={amount}
                onChangeText={setAmount}
                placeholder="Ex: 25000"
                keyboardType="numeric"
                placeholderTextColor="#9CA3AF"
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

            <View style={styles.actionButtons}>
              <TouchableOpacity style={styles.primaryButton} onPress={handleSaveTransaction}>
                <Text style={styles.primaryButtonText}>Enregistrer</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.secondaryButton} onPress={() => setShowConfirmation(false)}>
                <Text style={styles.secondaryButtonText}>Annuler</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

    // Main screen with recording states
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.screenHeader}>
        <TouchableOpacity style={styles.backButton} onPress={() => onNavigate('home')}>
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.screenTitle}>🎤 Transaction Vocale</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.voiceScrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.voiceContainer}>
          <View style={styles.voiceInstructions}>
            <Text style={styles.voiceInstructionsTitle}>Prêt à enregistrer votre transaction</Text>
            <Text style={styles.voiceInstructionsText}>
              Appuyez et dites par exemple:
            </Text>
            <Text style={styles.voiceInstructionsExample}>
              "J'ai vendu pour 25000 francs de produits à Madame Diop"
            </Text>
            <Text style={styles.voiceInstructionsText}>
              Ou encore:
            </Text>
            <Text style={styles.voiceInstructionsExample}>
              "J'ai dépensé 15000 francs pour l'achat de marchandises"
            </Text>
            <Text style={styles.voiceInstructionsExample}>
              "J'ai reçu 45000 francs de paiement de la boutique"
            </Text>
          </View>

          <View style={styles.recordingSection}>
            {!isRecording && !transcription && (
              <TouchableOpacity
                style={styles.recordButton}
                onPress={startFakeRecording}
              >
                <View style={styles.recordButtonInner}>
                  <Mic size={32} color="#FFFFFF" />
                </View>
                <Text style={styles.recordButtonText}>Commencer l'enregistrement</Text>
              </TouchableOpacity>
            )}

            {isRecording && (
              <View style={styles.recordingActive}>
                <View style={[styles.recordButtonInner, styles.recordingPulse]}>
                  <Mic size={32} color="#FFFFFF" />
                </View>
                <Text style={styles.recordingText}>Enregistrement en cours...</Text>
              </View>
            )}

            {transcription && !showConfirmation && (
              <View style={styles.transcriptSection}>
                <Text style={styles.transcriptTitle}>Ce que vous avez dit :</Text>
                <View style={styles.transcriptCard}>
                  <Text style={styles.transcriptText}>{transcription}</Text>
                </View>
                <TouchableOpacity
                  style={styles.primaryButton}
                  onPress={() => setShowConfirmation(true)}
                >
                  <Text style={styles.primaryButtonText}>Utiliser cette transcription</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

          <TouchableOpacity
            style={styles.voiceButton}
            onPress={() => setShowConfirmation(true)}
          >
            <Text style={styles.voiceButtonText}>✏️ Saisie manuelle directe</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function AnalyticsScreen({ onNavigate }: { onNavigate: (screen: Screen) => void }) {
  const { transactions, getTotalBalance, getMonthlyIncome, getMonthlyExpenses } = useTransactions();

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('fr-FR').format(amount);
  };

  const totalBalance = getTotalBalance();
  const monthlyIncome = getMonthlyIncome();
  const monthlyExpenses = getMonthlyExpenses();

  // Calculate category breakdown
  const getCategoryBreakdown = () => {
    const breakdown: { [key: string]: number } = {};
    transactions.forEach(transaction => {
      if (transaction.type === 'expense') {
        breakdown[transaction.category] = (breakdown[transaction.category] || 0) + transaction.amount;
      }
    });
    return breakdown;
  };

  const categoryBreakdown = getCategoryBreakdown();
  const totalExpenses = Object.values(categoryBreakdown).reduce((sum, amount) => sum + amount, 0);

  // Get top spending categories
  const topCategories = Object.entries(categoryBreakdown)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 5);

  // Calculate monthly trend (simplified)
  const getMonthlyTrend = () => {
    const currentMonth = new Date().getMonth();
    const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;

    const currentMonthExpenses = transactions
      .filter(t => new Date(t.createdAt).getMonth() === currentMonth && t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);

    const lastMonthExpenses = transactions
      .filter(t => new Date(t.createdAt).getMonth() === lastMonth && t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);

    if (lastMonthExpenses === 0) return 0;
    return ((currentMonthExpenses - lastMonthExpenses) / lastMonthExpenses) * 100;
  };

  const monthlyTrend = getMonthlyTrend();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.screenHeader}>
        <TouchableOpacity style={styles.backButton} onPress={() => onNavigate('home')}>
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.screenTitle}>Statistiques</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.analyticsScrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.analyticsContainer}>
          {/* Overview Cards */}
          <View style={styles.overviewSection}>
            <View style={styles.overviewCard}>
              <Text style={styles.overviewLabel}>Solde Total</Text>
              <Text style={styles.overviewAmount}>{formatAmount(totalBalance)} FCFA</Text>
              <View style={styles.overviewTrend}>
                <TrendingUp size={16} color={totalBalance >= 0 ? "#10B981" : "#EF4444"} />
                <Text style={[styles.overviewTrendText, { color: totalBalance >= 0 ? "#10B981" : "#EF4444" }]}>
                  {totalBalance >= 0 ? 'Positif' : 'Négatif'}
                </Text>
              </View>
            </View>

            <View style={styles.overviewCard}>
              <Text style={styles.overviewLabel}>Revenus du Mois</Text>
              <Text style={styles.overviewAmountPositive}>+{formatAmount(monthlyIncome)} FCFA</Text>
              <View style={styles.overviewTrend}>
                <ArrowUpRight size={16} color="#10B981" />
                <Text style={[styles.overviewTrendText, { color: "#10B981" }]}>
                  {monthlyIncome > 0 ? 'En hausse' : 'Aucun revenu'}
                </Text>
              </View>
            </View>

            <View style={styles.overviewCard}>
              <Text style={styles.overviewLabel}>Dépenses du Mois</Text>
              <Text style={styles.overviewAmountNegative}>-{formatAmount(monthlyExpenses)} FCFA</Text>
              <View style={styles.overviewTrend}>
                <ArrowDownLeft size={16} color="#EF4444" />
                <Text style={[styles.overviewTrendText, { color: "#EF4444" }]}>
                  {monthlyTrend > 0 ? `+${Math.round(monthlyTrend)}%` : `${Math.round(monthlyTrend)}%`} vs mois dernier
                </Text>
              </View>
            </View>
          </View>

          {/* Category Breakdown */}
          {topCategories.length > 0 && (
            <View style={styles.categorySection}>
              <Text style={styles.sectionTitle}>Dépenses par Catégorie</Text>
              <View style={styles.categoryBreakdown}>
                {topCategories.map(([category, amount], index) => {
                  const percentage = totalExpenses > 0 ? (amount / totalExpenses) * 100 : 0;
                  return (
                    <View key={category} style={styles.categoryItem}>
                      <View style={styles.categoryInfo}>
                        <Text style={styles.categoryName}>{category}</Text>
                        <Text style={styles.categoryAmount}>{formatAmount(amount)} FCFA</Text>
                      </View>
                      <View style={styles.categoryBar}>
                        <View
                          style={[
                            styles.categoryBarFill,
                            { width: `${percentage}%` }
                          ]}
                        />
                      </View>
                      <Text style={styles.categoryPercentage}>{Math.round(percentage)}%</Text>
                    </View>
                  );
                })}
              </View>
            </View>
          )}

          {/* Monthly Comparison */}
          <View style={styles.comparisonSection}>
            <Text style={styles.sectionTitle}>Comparaison Mensuelle</Text>
            <View style={styles.comparisonCard}>
              <View style={styles.comparisonRow}>
                <Text style={styles.comparisonLabel}>Ce mois</Text>
                <Text style={styles.comparisonValue}>{formatAmount(monthlyExpenses)} FCFA</Text>
              </View>
              <View style={styles.comparisonRow}>
                <Text style={styles.comparisonLabel}>Mois dernier</Text>
                <Text style={styles.comparisonValue}>
                  {formatAmount(monthlyExpenses - (monthlyExpenses * monthlyTrend / 100))} FCFA
                </Text>
              </View>
              <View style={styles.comparisonTrend}>
                <Text style={styles.comparisonTrendLabel}>Évolution :</Text>
                <Text style={[
                  styles.comparisonTrendValue,
                  { color: monthlyTrend <= 0 ? "#10B981" : "#EF4444" }
                ]}>
                  {monthlyTrend > 0 ? '+' : ''}{Math.round(monthlyTrend)}%
                </Text>
              </View>
            </View>
          </View>

          {/* Insights */}
          <View style={styles.insightsSection}>
            <Text style={styles.sectionTitle}>Insights</Text>
            <View style={styles.insightsCard}>
              {monthlyExpenses > monthlyIncome ? (
                <View style={styles.insightItem}>
                  <Text style={styles.insightIcon}>⚠️</Text>
                  <Text style={styles.insightText}>
                    Vos dépenses dépassent vos revenus ce mois-ci. Considérez réduire vos dépenses.
                  </Text>
                </View>
              ) : (
                <View style={styles.insightItem}>
                  <Text style={styles.insightIcon}>✅</Text>
                  <Text style={styles.insightText}>
                    Excellent ! Vous dépensez moins que vos revenus ce mois-ci.
                  </Text>
                </View>
              )}

              {topCategories.length > 0 && (
                <View style={styles.insightItem}>
                  <Text style={styles.insightIcon}>📊</Text>
                  <Text style={styles.insightText}>
                    Votre plus grande dépense est {topCategories[0][0]} ({Math.round((topCategories[0][1] / totalExpenses) * 100)}% du total).
                  </Text>
                </View>
              )}
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
    );
}

function OnboardingScreen({ onComplete }: { onComplete: () => void }) {
  const { setUserDetails } = useUserDetails();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    setError('');
    if (!name.trim()) {
      setError('Le nom est obligatoire.');
      return;
    }
    setIsSubmitting(true);
    try {
      await setUserDetails({ name: name.trim(), phone: phone.trim(), email: email.trim() });
      onComplete();
    } catch (e) {
      setError("Erreur lors de l'enregistrement des informations utilisateur.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.onboardingOuter}>
        <View style={styles.onboardingCard}>
          <View style={styles.onboardingLogoContainer}>
            <View style={styles.logo}>
              <View style={styles.logoIcon} />
            </View>
          </View>
          <Text style={styles.onboardingTitle}>Bienvenue sur Sentreso!</Text>
          <Text style={styles.onboardingSubtitle}>Veuillez renseigner vos informations pour continuer.</Text>
          <TextInput
            style={styles.textInput}
            placeholder="Nom complet *"
            value={name}
            onChangeText={setName}
            autoCapitalize="words"
          />
          <TextInput
            style={styles.textInput}
            placeholder="Téléphone (optionnel)"
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
          />
          <TextInput
            style={styles.textInput}
            placeholder="Email (optionnel)"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
          />
          {error ? <Text style={styles.errorText}>{error}</Text> : null}
          <TouchableOpacity style={styles.primaryButton} onPress={handleSubmit} disabled={isSubmitting}>
            <Text style={styles.primaryButtonText}>{isSubmitting ? 'Enregistrement...' : 'Continuer'}</Text>
          </TouchableOpacity>


        </View>
      </View>
    </SafeAreaView>
  );
}

function AppContent() {
  const [currentScreen, setCurrentScreen] = useState<Screen>('home');
  const { userDetails, isLoading } = useUserDetails();
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    if (!isLoading && !userDetails) {
      setShowOnboarding(true);
    } else {
      setShowOnboarding(false);
    }
  }, [isLoading, userDetails]);

  if (isLoading) {
    return (
      <View style={styles.container}>
        <Text>Chargement...</Text>
      </View>
    );
  }
  if (showOnboarding) {
    return <OnboardingScreen onComplete={() => setShowOnboarding(false)} />;
  }

  // Role-aware default screen: distributors land on their dashboard
  useEffect(() => {
    if (userDetails?.role === 'distributor') {
      setCurrentScreen('distDashboard');
    }
  }, [userDetails?.role]);

  const renderScreen = () => {
    switch (currentScreen) {
      case 'home':
        return <HomeScreen onNavigate={setCurrentScreen} />;
      case 'distDashboard':
        return <DistributorDashboard onNavigate={setCurrentScreen} />;
      case 'distCreate':
        return <DistributorCreate onNavigate={setCurrentScreen} />;
      case 'add':
        return <AddScreen onNavigate={setCurrentScreen} />;
      case 'voice':
        return <VoiceScreen onNavigate={setCurrentScreen} />;
      case 'analytics':
        return <AnalyticsScreen onNavigate={setCurrentScreen} />;
      default:
        return <HomeScreen onNavigate={setCurrentScreen} />;
    }
  };

  return (
    <View style={styles.appContainer}>
      <View style={styles.screenContainer}>
        {renderScreen()}
      </View>
      <TabBar currentScreen={currentScreen} onNavigate={setCurrentScreen} />
    </View>
  );
}

export default function App() {
  return (
    <TransactionProvider>
      <UserProvider>
        <AppContent />
      </UserProvider>
    </TransactionProvider>
  );
}

const styles = StyleSheet.create({
  appContainer: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  screenContainer: {
    flex: 1,
  },
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    paddingTop: 20,
    paddingHorizontal: 20,
    paddingBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerSpacer: {
    width: 80,
  },

  logoContainer: {
    alignItems: 'flex-start',
  },
  logo: {
    backgroundColor: '#000000',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoIcon: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#10B981',
  },
  greetingSection: {
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  greeting: {
    fontSize: 32,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    fontWeight: '400',
  },
  balanceCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    marginBottom: 20,
  },
  balanceLabel: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
    marginBottom: 8,
  },
  balanceAmount: {
    fontSize: 36,
    fontWeight: '800',
    color: '#1F2937',
    marginBottom: 12,
  },
  balanceChange: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  balanceChangeText: {
    fontSize: 14,
    color: '#10B981',
    fontWeight: '600',
    marginLeft: 4,
  },
  statsContainer: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginBottom: 20,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  statHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  statIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#D1FAE5',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  statIconContainerRed: {
    backgroundColor: '#FEE2E2',
  },
  statLabel: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  statAmountPositive: {
    fontSize: 20,
    fontWeight: '700',
    color: '#10B981',
    marginBottom: 4,
  },
  statAmountNegative: {
    fontSize: 20,
    fontWeight: '700',
    color: '#EF4444',
    marginBottom: 4,
  },
  statPeriod: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  actionButtons: {
    marginHorizontal: 20,
    marginBottom: 20,
    gap: 12,
  },
  primaryButton: {
    backgroundColor: '#10B981',
    borderRadius: 12,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  secondaryButtonText: {
    color: '#6366F1',
    fontSize: 16,
    fontWeight: '600',
  },
  voiceHighlight: {
    marginHorizontal: 20,
    marginBottom: 100,
  },
  voiceCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  voiceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  voiceTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginLeft: 8,
  },
  voiceDescription: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 16,
  },
  voiceButton: {
    backgroundColor: '#EF4444',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  voiceButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  screenHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 20,
    paddingHorizontal: 20,
    paddingBottom: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backButtonText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1F2937',
  },
  screenTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
  },
  placeholder: {
    width: 40,
  },
  screenContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  screenSubtitle: {
    fontSize: 18,
    color: '#6B7280',
    marginBottom: 20,
    textAlign: 'center',
  },
  comingSoon: {
    fontSize: 16,
    color: '#9CA3AF',
    textAlign: 'center',
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingBottom: 8,
    paddingTop: 8,
    height: 80,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabItemActive: {
    // Active state styling
  },
  tabIcon: {
    marginBottom: 4,
  },
  tabIconText: {
    fontSize: 20,
    color: '#9CA3AF',
  },
  tabIconTextActive: {
    color: '#10B981',
  },
  tabLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#9CA3AF',
  },
  tabLabelActive: {
    color: '#10B981',
  },
  formScrollView: {
    flex: 1,
  },
  formContainer: {
    padding: 20,
  },
  typeToggleContainer: {
    flexDirection: 'row',
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    padding: 4,
    marginBottom: 24,
  },
  typeToggle: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  typeToggleActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  typeToggleText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
  },
  typeToggleTextActive: {
    color: '#1F2937',
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
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
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  currencySymbol: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
    marginRight: 8,
  },
  amountInput: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  textInput: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 16,
    paddingVertical: 16,
    fontSize: 16,
    color: '#1F2937',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryButton: {
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
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
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 20,
  },
  submitButtonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  recentTransactionsContainer: {
    marginHorizontal: 20,
    marginBottom: 20,
  },
  recentTransactionsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  viewAllButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#F3F4F6',
  },
  viewAllButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6366F1',
  },
  recentTransactionsTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 12,
  },
  transactionItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  transactionInfo: {
    flex: 1,
  },
  transactionDescription: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  transactionCategory: {
    fontSize: 14,
    color: '#6B7280',
  },
  transactionAmount: {
    alignItems: 'flex-end',
  },
  transactionAmountText: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 2,
  },
  transactionAmountPositive: {
    color: '#10B981',
  },
  transactionAmountNegative: {
    color: '#EF4444',
  },
  transactionDate: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  voiceScrollView: {
    flex: 1,
  },
  voiceContainer: {
    padding: 20,
  },
  voiceInstructions: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  voiceInstructionsTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 8,
  },
  voiceInstructionsText: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  voiceInstructionsExample: {
    fontSize: 12,
    color: '#9CA3AF',
    fontStyle: 'italic',
    marginTop: 8,
  },
  recordingSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  recordButton: {
    alignItems: 'center',
  },
  recordButtonInner: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#EF4444',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  recordingPulse: {
    backgroundColor: '#DC2626',
  },
  recordButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#EF4444',
  },
  recordingActive: {
    alignItems: 'center',
  },
  recordingText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#EF4444',
    marginBottom: 8,
  },
  recordingTime: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 16,
  },
  stopButton: {
    backgroundColor: '#EF4444',
    borderRadius: 8,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  stopButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  processingSection: {
    alignItems: 'center',
  },
  processingSpinner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  processingText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
  },
  transcriptSection: {
    marginBottom: 24,
  },
  transcriptTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
  },
  transcriptCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  transcriptText: {
    fontSize: 14,
    color: '#1F2937',
    lineHeight: 20,
  },
  resultSection: {
    marginBottom: 24,
  },
  resultTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
  },
  resultCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  resultRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  resultLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  resultValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  resultActions: {
    flexDirection: 'row',
    gap: 12,
  },
  confirmButton: {
    flex: 1,
    backgroundColor: '#10B981',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  confirmButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  retryButton: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  retryButtonText: {
    color: '#6B7280',
    fontSize: 14,
    fontWeight: '600',
  },
  manualSection: {
    marginTop: 24,
  },
  manualButton: {
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  manualButtonText: {
    color: '#6B7280',
    fontSize: 14,
    fontWeight: '600',
  },
  manualInputContainer: {
    marginTop: 12,
  },
  manualTextInput: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 12,
    fontSize: 14,
    color: '#1F2937',
    minHeight: 80,
    textAlignVertical: 'top',
  },
  manualSubmitButton: {
    backgroundColor: '#6366F1',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  manualSubmitButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  analyticsScrollView: {
    flex: 1,
  },
  analyticsContainer: {
    padding: 20,
  },
  overviewSection: {
    marginBottom: 24,
  },
  overviewCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  overviewLabel: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
    marginBottom: 8,
  },
  overviewAmount: {
    fontSize: 24,
    fontWeight: '800',
    color: '#1F2937',
    marginBottom: 8,
  },
  overviewAmountPositive: {
    fontSize: 24,
    fontWeight: '800',
    color: '#10B981',
    marginBottom: 8,
  },
  overviewAmountNegative: {
    fontSize: 24,
    fontWeight: '800',
    color: '#EF4444',
    marginBottom: 8,
  },
  overviewTrend: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  overviewTrendText: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 16,
  },
  categorySection: {
    marginBottom: 24,
  },
  categoryBreakdown: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  categoryItem: {
    marginBottom: 16,
  },
  categoryInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  categoryName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  categoryAmount: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  categoryBar: {
    height: 8,
    backgroundColor: '#F3F4F6',
    borderRadius: 4,
    marginBottom: 4,
  },
  categoryBarFill: {
    height: '100%',
    backgroundColor: '#10B981',
    borderRadius: 4,
  },
  categoryPercentage: {
    fontSize: 12,
    color: '#9CA3AF',
    textAlign: 'right',
  },
  comparisonSection: {
    marginBottom: 24,
  },
  comparisonCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  comparisonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  comparisonLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  comparisonValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  comparisonTrend: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    marginTop: 8,
  },
  comparisonTrendLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  comparisonTrendValue: {
    fontSize: 14,
    fontWeight: '700',
  },
  insightsSection: {
    marginBottom: 24,
  },
  insightsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  insightItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  insightIcon: {
    fontSize: 20,
    marginRight: 12,
    marginTop: 2,
  },
  insightText: {
    flex: 1,
    fontSize: 14,
    color: '#1F2937',
    lineHeight: 20,
  },
  transactionsScrollView: {
    flex: 1,
  },
  transactionsContainer: {
    padding: 20,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyStateIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 24,
  },
  emptyStateButton: {
    backgroundColor: '#10B981',
    borderRadius: 8,
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  emptyStateButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  transactionListItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  transactionListInfo: {
    flex: 1,
  },
  transactionListDescription: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  transactionListCategory: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
  },
  transactionListDate: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  transactionListAmount: {
    alignItems: 'flex-end',
  },
  transactionListAmountText: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 2,
  },
  transactionListType: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  deleteButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteButtonText: {
    fontSize: 16,
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    margin: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 12,
  },
  modalText: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
    marginBottom: 20,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
  },
  modalCancelButton: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  modalCancelButtonText: {
    color: '#6B7280',
    fontSize: 14,
    fontWeight: '600',
  },
  modalDeleteButton: {
    backgroundColor: 'transparent',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#EF4444',
  },
  modalDeleteButtonText: {
    color: '#EF4444',
    fontSize: 14,
    fontWeight: '600',
  },
  onboardingOuter: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
  },
  onboardingCard: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 8,
    alignItems: 'center',
  },
  onboardingLogoContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  onboardingTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 16,
    textAlign: 'center',
  },
  onboardingSubtitle: {
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 32,
    textAlign: 'center',
    lineHeight: 22,
  },
  errorText: {
    color: '#EF4444',
    fontSize: 14,
    marginVertical: 8,
  },
  debugBox: {
    backgroundColor: '#FEE2E2',
    borderRadius: 8,
    padding: 12,
    marginVertical: 12,
    borderWidth: 1,
    borderColor: '#EF4444',
  },
  debugTitle: {
    color: '#B91C1C',
    fontWeight: '700',
    marginBottom: 4,
  },
  debugText: {
    color: '#B91C1C',
    fontSize: 13,
    fontFamily: 'monospace',
  },
  logoutButton: {
    backgroundColor: '#EF4444',
    borderRadius: 8,
    padding: 10,
    marginRight: 16,
    minWidth: 100,
    alignItems: 'center',
  },
  logoutButtonText: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  deleteAccountButton: {
    backgroundColor: '#EF4444',
    borderRadius: 8,
    padding: 8,
    alignItems: 'center',
    justifyContent: 'center',
    width: 36,
    height: 36,
  },
  deleteAccountButtonText: {
    fontSize: 16,
    color: '#FFFFFF',
  },
});
