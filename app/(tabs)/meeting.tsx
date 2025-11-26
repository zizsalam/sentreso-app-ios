import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Platform, TextInput } from 'react-native';
import { useTransactions } from '@/contexts/TransactionContext';
import { useUserDetails } from '@/contexts/UserContext';
import { useMemo, useState, useEffect } from 'react';
import { CheckCircle, Calendar, Settings, XCircle } from 'lucide-react-native';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as Print from 'expo-print';
import * as Linking from 'expo-linking';
import EditGIEInfoModal from '@/components/EditGIEInfoModal';
import { getAllMembers, Member } from '@/services/memberStore';

export default function MeetingTab() {
  const { transactions } = useTransactions();
  const { userDetails } = useUserDetails();
  // Only enable exports if userType is GIE (ignore feature flags for security)
  const exportsEnabled = userDetails?.userType === 'GIE';

  // Redirect if not GIE user
  if (userDetails?.userType !== 'GIE') {
    return null; // Don't render anything for non-GIE users
  }

  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showEditGIE, setShowEditGIE] = useState(false);
  const [allMembers, setAllMembers] = useState<Member[]>([]);

  const selectedDateStr = selectedDate.toISOString().slice(0, 10);
  const isToday = selectedDateStr === new Date().toISOString().slice(0, 10);

  const selectedDateFormatted = selectedDate.toLocaleDateString('fr-FR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  // Load all members
  useEffect(() => {
    const loadMembers = async () => {
      try {
        const members = await getAllMembers();
        setAllMembers(members);
      } catch (error) {
        console.error('❌ Failed to load members:', error);
      }
    };
    loadMembers();
  }, []);

  // Extract member name from description (e.g., "Cotisation de Fatou" -> "Fatou")
  const extractMemberName = (description: string, category: string): string | null => {
    if (!description) return null;

    // Pattern: "Cotisation de Fatou" or "Remboursement de Moussa"
    const patterns = [
      /(?:cotisation|remboursement|prêt|pret)\s+de\s+(.+)/i,
      /(.+?)\s+(?:cotisation|remboursement|prêt|pret)/i,
    ];

    for (const pattern of patterns) {
      const match = description.match(pattern);
      if (match && match[1]) {
        return match[1].trim();
      }
    }

    // Fallback: if description contains "de" or "par", try to extract name
    if (description.includes(' de ') || description.includes(' par ')) {
      const parts = description.split(/ de | par /i);
      if (parts.length > 1) {
        return parts[parts.length - 1].trim();
      }
    }

    return null;
  };

  // Get members with transactions for selected date (cotisation, remboursement, prêt)
  // Group by member name and transaction type, summing amounts
  const membersWithTransactionsToday = useMemo(() => {
    const membersMap = new Map<string, { name: string; type: 'cotisation' | 'remboursement' | 'pret'; amount: number }>();

    for (const t of transactions) {
      // Check if transaction is from selected date using createdAt Date object
      const transactionDate = t.createdAt.toISOString().slice(0, 10);
      if (transactionDate !== selectedDateStr) continue;

      const cat = (t.category || '').toLowerCase();
      const desc = (t.description || '').toLowerCase();

      // Extract member name from description
      const memberName = extractMemberName(t.description || '', t.category || '');
      if (!memberName) continue;

      // Create unique key: memberName + type
      let type: 'cotisation' | 'remboursement' | 'pret' | null = null;

      // Cotisation
      if (t.type === 'income' && (cat.includes('cotisation') || cat.includes('contribution') || desc.includes('cotisation'))) {
        type = 'cotisation';
      }
      // Remboursement
      else if (t.type === 'income' && (cat.includes('remboursement') || cat.includes('rembour') || desc.includes('remboursement'))) {
        type = 'remboursement';
      }
      // Prêt émis
      else if (t.type === 'expense' && (cat.includes('prêt') || cat.includes('pret') || cat.includes('loan') || desc.includes('prêt') || desc.includes('pret'))) {
        type = 'pret';
      }

      if (!type) continue;

      const key = `${memberName}-${type}`;
      const existing = membersMap.get(key);

      if (existing) {
        // Sum amounts for same member + type
        existing.amount += t.amount;
      } else {
        // First transaction for this member + type
        membersMap.set(key, { name: memberName, type, amount: t.amount });
      }
    }

      return Array.from(membersMap.values());
    }, [transactions, selectedDateStr]);

  // Get members who have NOT contributed today (cotisation only)
  const membersWithoutCotisation = useMemo(() => {
    // Get all member names who have cotisation today
    const membersWithCotisation = new Set<string>();
    for (const t of transactions) {
      const transactionDate = t.createdAt.toISOString().slice(0, 10);
      if (transactionDate !== selectedDateStr) continue;

      const cat = (t.category || '').toLowerCase();
      const desc = (t.description || '').toLowerCase();

      // Check if it's a cotisation
      if (t.type === 'income' && (cat.includes('cotisation') || cat.includes('contribution') || desc.includes('cotisation'))) {
        const memberName = extractMemberName(t.description || '', t.category || '');
        if (memberName) {
          membersWithCotisation.add(memberName.toLowerCase());
        }
      }
    }

    // Find members from allMembers who don't have a cotisation today
    return allMembers.filter(member => {
      const memberNameLower = member.name.toLowerCase();
      // Check if member name matches any transaction member name (fuzzy match)
      let hasCotisation = false;
      for (const nameInSet of membersWithCotisation) {
        // Simple fuzzy match: check if names are similar
        if (memberNameLower.includes(nameInSet) || nameInSet.includes(memberNameLower)) {
          hasCotisation = true;
          break;
        }
      }
      return !hasCotisation;
    });
  }, [allMembers, transactions, selectedDateStr]);

  const { cotisationsToday, repaymentsToday, loansToday } = useMemo(() => {
    let c = 0, r = 0, l = 0;
    for (const t of transactions) {
      // Use createdAt Date object to check if transaction is from selected date
      const transactionDate = t.createdAt.toISOString().slice(0, 10);
      if (transactionDate !== selectedDateStr) continue;

      const cat = (t.category || '').toLowerCase();
      const desc = (t.description || '').toLowerCase();

      // Cotisation
      if (t.type === 'income' && (cat.includes('cotisation') || cat.includes('contribution') || desc.includes('cotisation'))) {
        c += t.amount;
      }
      // Remboursement
      else if (t.type === 'income' && (cat.includes('remboursement') || cat.includes('rembour') || desc.includes('remboursement'))) {
        r += t.amount;
      }
      // Prêt émis
      else if (t.type === 'expense' && (cat.includes('prêt') || cat.includes('pret') || cat.includes('loan') || desc.includes('prêt') || desc.includes('pret'))) {
        l += t.amount;
      }
    }
      return { cotisationsToday: c, repaymentsToday: r, loansToday: l };
    }, [transactions, selectedDateStr]);

  const getTransactionTypeLabel = (type: 'cotisation' | 'remboursement' | 'pret') => {
    switch (type) {
      case 'cotisation': return 'Cotisation';
      case 'remboursement': return 'Remboursement';
      case 'pret': return 'Prêt émis';
      default: return '';
    }
  };

  const formatAmount = (n: number) => new Intl.NumberFormat('fr-FR').format(n) + ' FCFA';

  const exportCsv = async () => {
    try {
      // Filter transactions to today only
      const todayTransactions = transactions.filter(t => {
        const transactionDate = t.createdAt.toISOString().slice(0, 10);
        return transactionDate === today;
      });

      const headers = ['Date','Activité','Membre','Montant FCFA','Catégorie','Type','Produits vendus'];
      const rows: string[] = [];
      rows.push(headers.join(','));
      const toIsoDate = (d: any) => {
        try {
          const dt = (d instanceof Date) ? d : new Date(d);
          return dt.toISOString().slice(0,10);
        } catch { return ''; }
      };
      for (const t of todayTransactions) {
        const date = toIsoDate(t.createdAt);
        const activity = (t.category || '').toString();
        const member = extractMemberName(t.description || '', t.category || '') || '';
        const amount = t.amount?.toString() ?? '';
        const category = t.category || '';
        const type = t.type === 'income' ? 'Revenu' : 'Dépense';
        const products = t.lineItems && t.lineItems.length
          ? t.lineItems.map((item) => `${item.name} x${item.quantity} (${item.total.toLocaleString('fr-FR')} FCFA)`).join(' | ')
          : '';
        rows.push([date, activity, member, amount, category, type, products].map((c) => `"${String(c).replace(/"/g,'""')}"`).join(','));
      }
          const csv = rows.join('\n');
          const fname = `GIE-Rapport_${selectedDateStr}.csv`;
      if (Platform.OS === 'web') {
        // Trigger browser download via data URL (works in Expo Web)
        const dataUrl = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv);
        await Linking.openURL(dataUrl);
        return;
      }
      const uri = FileSystem.cacheDirectory + fname;
      await FileSystem.writeAsStringAsync(uri, csv, { encoding: FileSystem.EncodingType.UTF8 });
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, { mimeType: 'text/csv', dialogTitle: 'Partager CSV' });
      } else {
        Alert.alert('Fichier prêt', `Enregistré: ${uri}`);
      }
    } catch (e) {
      Alert.alert('Erreur', "Impossible d'exporter le CSV");
    }
  };

  const exportPdf = async () => {
    try {
      // Filter transactions to selected date only (like CSV export)
      const todayTransactions = transactions.filter(t => {
        const transactionDate = t.createdAt.toISOString().slice(0, 10);
        return transactionDate === selectedDateStr;
      });

      // Group transactions by type for summary
      const cotisations = todayTransactions.filter(t => {
        const cat = (t.category || '').toLowerCase();
        const desc = (t.description || '').toLowerCase();
        return t.type === 'income' && (cat.includes('cotisation') || cat.includes('contribution') || desc.includes('cotisation'));
      });
      const remboursements = todayTransactions.filter(t => {
        const cat = (t.category || '').toLowerCase();
        const desc = (t.description || '').toLowerCase();
        return t.type === 'income' && (cat.includes('remboursement') || cat.includes('rembour') || desc.includes('remboursement'));
      });
      const prets = todayTransactions.filter(t => {
        const cat = (t.category || '').toLowerCase();
        const desc = (t.description || '').toLowerCase();
        return t.type === 'expense' && (cat.includes('prêt') || cat.includes('pret') || cat.includes('loan') || desc.includes('prêt') || desc.includes('pret'));
      });

      // Get GIE name (use userDetails or fallback)
      const gieName = userDetails?.name || 'GIE';

      const html = `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8" />
            <style>
              @page { margin: 20mm; }
              body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
                font-size: 11pt;
                line-height: 1.4;
                color: #1f2937;
              }
              .header {
                border-bottom: 3px solid #059669;
                padding-bottom: 16px;
                margin-bottom: 24px;
              }
              .header h1 {
                font-size: 24pt;
                font-weight: 700;
                color: #059669;
                margin: 0 0 8px 0;
              }
              .header .subtitle {
                font-size: 12pt;
                color: #6b7280;
                margin: 0;
              }
              .header .info {
                font-size: 10pt;
                color: #6b7280;
                margin-top: 8px;
              }
              .products {
                margin-top: 6px;
                color: #6b7280;
                font-size: 10pt;
              }
              .products span {
                display: block;
              }
              .report-meta {
                background: #f8fafc;
                padding: 12px;
                border-radius: 6px;
                margin-bottom: 20px;
              }
              .report-meta .date {
                font-size: 12pt;
                font-weight: 600;
                color: #1f2937;
              }
              .summary {
                display: grid;
                grid-template-columns: repeat(3, 1fr);
                gap: 12px;
                margin-bottom: 24px;
              }
              .summary-card {
                background: #ffffff;
                border: 1px solid #e5e7eb;
                border-left: 4px solid;
                padding: 12px;
                border-radius: 4px;
              }
              .summary-card.cotisation { border-left-color: #10b981; }
              .summary-card.remboursement { border-left-color: #3b82f6; }
              .summary-card.pret { border-left-color: #ef4444; }
              .summary-label {
                font-size: 9pt;
                color: #6b7280;
                margin-bottom: 4px;
              }
              .summary-value {
                font-size: 16pt;
                font-weight: 700;
                color: #1f2937;
              }
              .summary-count {
                font-size: 9pt;
                color: #9ca3af;
                margin-top: 4px;
              }
              table {
                width: 100%;
                border-collapse: collapse;
                margin-top: 16px;
                font-size: 9pt;
              }
              thead {
                background: #f8fafc;
              }
              th {
                padding: 10px 8px;
                text-align: left;
                font-weight: 600;
                color: #374151;
                border-bottom: 2px solid #e5e7eb;
              }
              td {
                padding: 8px;
                border-bottom: 1px solid #f3f4f6;
              }
              tbody tr:hover {
                background: #f9fafb;
              }
              .text-right {
                text-align: right;
              }
              .text-center {
                text-align: center;
              }
              .footer {
                margin-top: 32px;
                padding-top: 16px;
                border-top: 1px solid #e5e7eb;
                font-size: 9pt;
                color: #6b7280;
                text-align: center;
              }
              .empty-state {
                text-align: center;
                padding: 40px 20px;
                color: #9ca3af;
              }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>${gieName}</h1>
              <div class="subtitle">Rapport de Réunion</div>
              ${userDetails?.address ? `<div class="info">${userDetails.address}</div>` : ''}
              ${userDetails?.phone ? `<div class="info">Téléphone: ${userDetails.phone}</div>` : ''}
              ${userDetails?.email ? `<div class="info">Email: ${userDetails.email}</div>` : ''}
            </div>

            <div class="report-meta">
              <div class="date">Réunion du ${selectedDateFormatted}</div>
            </div>

            <div class="summary">
              <div class="summary-card cotisation">
                <div class="summary-label">Cotisations</div>
                <div class="summary-value">${formatAmount(cotisationsToday)}</div>
                <div class="summary-count">${cotisations.length} transaction${cotisations.length > 1 ? 's' : ''}</div>
              </div>
              <div class="summary-card remboursement">
                <div class="summary-label">Remboursements</div>
                <div class="summary-value">${formatAmount(repaymentsToday)}</div>
                <div class="summary-count">${remboursements.length} transaction${remboursements.length > 1 ? 's' : ''}</div>
              </div>
              <div class="summary-card pret">
                <div class="summary-label">Prêts émis</div>
                <div class="summary-value">${formatAmount(loansToday)}</div>
                <div class="summary-count">${prets.length} transaction${prets.length > 1 ? 's' : ''}</div>
              </div>
            </div>

            <table>
              <thead>
                <tr>
                  <th style="width: 8%;">N°</th>
                  <th style="width: 22%;">Membre</th>
                  <th style="width: 18%;">Type</th>
                  <th style="width: 14%;" class="text-right">Montant</th>
                  <th style="width: 38%;">Détails</th>
                </tr>
              </thead>
              <tbody>
                ${todayTransactions.length > 0 ? todayTransactions.map((t:any, index:number) => {
                  const member = extractMemberName(t.description || '', t.category || '') || '-';
                  const activity = (t.category || '').toString();
                  const type = t.type === 'income' ? 'Revenu' : 'Dépense';
                  const products = t.lineItems && t.lineItems.length
                    ? `<div class="products">
                        ${t.lineItems.map((item: any) => `<span>${item.name} x${item.quantity} (${formatAmount(item.total)})</span>`).join('<br/>')}
                      </div>`
                    : '';
                  return `<tr>
                    <td>${index + 1}</td>
                    <td>${member}</td>
                    <td>${activity}</td>
                    <td class="text-right">${formatAmount(t.amount)}</td>
                    <td>
                      <div>${(t.description || '').substring(0, 80)}${(t.description || '').length > 80 ? '...' : ''}</div>
                      ${products}
                    </td>
                  </tr>`;
                }).join('') : '<tr><td colspan="5" class="empty-state">Aucune transaction aujourd\'hui</td></tr>'}
              </tbody>
              ${todayTransactions.length > 0 ? `<tfoot>
                <tr style="background: #f8fafc; font-weight: 700;">
                  <td colspan="3" style="text-align: right; padding: 12px 8px;">TOTAL:</td>
                  <td class="text-right" style="padding: 12px 8px;">${formatAmount(cotisationsToday + repaymentsToday - loansToday)}</td>
                  <td></td>
                </tr>
              </tfoot>` : ''}
            </table>

            <div class="footer">
              <div>Généré le ${new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</div>
              <div style="margin-top: 4px;">Document généré par Sentreso</div>
            </div>
          </body>
        </html>`;
      if (Platform.OS === 'web') {
        // On web, just open the browser print dialog once (prevents double modal)
        await Print.printAsync({ html });
        return;
      }
      const { uri } = await Print.printToFileAsync({ html });
          const fname = FileSystem.cacheDirectory + `GIE-Rapport_${selectedDateStr}.pdf`;
      await FileSystem.copyAsync({ from: uri, to: fname });
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fname, { mimeType: 'application/pdf', dialogTitle: 'Partager PDF' });
      } else {
        Alert.alert('Fichier prêt', `Enregistré: ${fname}`);
      }
    } catch (e) {
      Alert.alert('Erreur', "Impossible d'exporter le PDF");
    }
  };

  const shareWhatsApp = async () => {
    try {
      const text = `Réunion ${selectedDateStr}\nCotisations: ${formatAmount(cotisationsToday)}\nRemboursements: ${formatAmount(repaymentsToday)}\nPrêts émis: ${formatAmount(loansToday)}`;
      const whatsappScheme = `whatsapp://send?text=${encodeURIComponent(text)}`;
      const whatsappUniversal = `https://wa.me/?text=${encodeURIComponent(text)}`;
      if (Platform.OS !== 'web' && (await Linking.canOpenURL(whatsappScheme))) {
        await Linking.openURL(whatsappScheme);
        return;
      }
      // Fallback to universal link (works on web and native if installed)
      await Linking.openURL(whatsappUniversal);
    } catch (e) {
      Alert.alert('Erreur', "Impossible de partager sur WhatsApp");
    }
  };

  return (
    <>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <Text style={styles.title}>Réunion</Text>
            <TouchableOpacity
              style={styles.editButton}
              onPress={() => setShowEditGIE(true)}
            >
              <Settings size={20} color="#059669" />
            </TouchableOpacity>
          </View>

          {/* Date selector */}
          <View style={styles.dateSelector}>
            <TouchableOpacity
              style={styles.dateButton}
              onPress={() => setShowDatePicker(true)}
            >
              <Calendar size={20} color="#059669" />
              <Text style={styles.dateButtonText}>
                {isToday ? "Aujourd'hui" : selectedDateFormatted}
              </Text>
            </TouchableOpacity>
            {!isToday && (
              <TouchableOpacity
                style={styles.todayButton}
                onPress={() => setSelectedDate(new Date())}
              >
                <Text style={styles.todayButtonText}>Aujourd'hui</Text>
              </TouchableOpacity>
            )}
          </View>

      {/* Top actions removed per request; only bottom action bar remains */}

          <View style={styles.cards}>
            <View style={[styles.card, styles.cardGreen]}>
              <Text style={styles.cardLabel}>Cotisations {isToday ? "aujourd'hui" : `du ${selectedDate.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}`}</Text>
          <Text style={styles.cardValue}>{formatAmount(cotisationsToday)}</Text>
          <Text style={styles.cardSubtext}>
            {membersWithTransactionsToday.filter(m => m.type === 'cotisation').length} membre{membersWithTransactionsToday.filter(m => m.type === 'cotisation').length > 1 ? 's' : ''} payé{membersWithTransactionsToday.filter(m => m.type === 'cotisation').length > 1 ? 's' : ''}
          </Text>
        </View>
        <View style={[styles.card, styles.cardBlue]}>
          <Text style={styles.cardLabel}>Remboursements</Text>
          <Text style={styles.cardValue}>{formatAmount(repaymentsToday)}</Text>
        </View>
        <View style={[styles.card, styles.cardRed]}>
          <Text style={styles.cardLabel}>Prêts émis</Text>
          <Text style={styles.cardValue}>{formatAmount(loansToday)}</Text>
        </View>
      </View>

      {/* Members with transactions today */}
      {membersWithTransactionsToday.length > 0 && (
        <View style={styles.memberListSection}>
          <Text style={styles.sectionTitle}>Membres ayant cotisé</Text>
          <View style={styles.memberList}>
            {membersWithTransactionsToday
              .filter(m => m.type === 'cotisation')
              .map((member, index) => (
                <View
                  key={`${member.name}-${member.type}-${index}`}
                  style={styles.memberItem}
                >
                  <View style={styles.memberItemLeft}>
                    <CheckCircle size={24} color="#10B981" />
                    <View style={styles.memberItemInfo}>
                      <Text style={styles.memberItemName}>{member.name}</Text>
                      <Text style={styles.memberItemType}>Cotisation</Text>
                    </View>
                  </View>
                  <Text style={styles.memberItemAmount}>{formatAmount(member.amount)}</Text>
                </View>
              ))}
          </View>
        </View>
      )}

      {/* Members without cotisation */}
      {membersWithoutCotisation.length > 0 && (
        <View style={styles.memberListSection}>
          <Text style={styles.sectionTitle}>Membres n'ayant pas cotisé</Text>
          <View style={styles.memberList}>
            {membersWithoutCotisation.map((member, index) => (
              <View
                key={`no-cotisation-${member.id}-${index}`}
                style={[styles.memberItem, styles.memberItemNoCotisation]}
              >
                <View style={styles.memberItemLeft}>
                  <XCircle size={24} color="#EF4444" />
                  <View style={styles.memberItemInfo}>
                    <Text style={styles.memberItemName}>{member.name}</Text>
                    <Text style={styles.memberItemType}>Pas de cotisation</Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Other transactions (remboursements, prêts) */}
      {membersWithTransactionsToday.filter(m => m.type !== 'cotisation').length > 0 && (
        <View style={styles.memberListSection}>
          <Text style={styles.sectionTitle}>Autres transactions</Text>
          <View style={styles.memberList}>
            {membersWithTransactionsToday
              .filter(m => m.type !== 'cotisation')
              .map((member, index) => (
                <View
                  key={`${member.name}-${member.type}-${index}`}
                  style={styles.memberItem}
                >
                  <View style={styles.memberItemLeft}>
                    <CheckCircle size={24} color="#3B82F6" />
                    <View style={styles.memberItemInfo}>
                      <Text style={styles.memberItemName}>{member.name}</Text>
                      <Text style={styles.memberItemType}>{getTransactionTypeLabel(member.type)}</Text>
                    </View>
                  </View>
                  <Text style={styles.memberItemAmount}>{formatAmount(member.amount)}</Text>
                </View>
              ))}
          </View>
        </View>
      )}

      {membersWithTransactionsToday.length === 0 && membersWithoutCotisation.length === 0 && (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>
            Aucune transaction {isToday ? "aujourd'hui" : `le ${selectedDate.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}`}
          </Text>
          <Text style={styles.emptySubtext}>
            {isToday ? "Les transactions d'aujourd'hui apparaîtront ici" : "Sélectionnez une autre date"}
          </Text>
        </View>
      )}

      {exportsEnabled && (
        <View style={styles.actionsBottom}>
          <TouchableOpacity style={styles.primary} onPress={exportCsv}>
            <Text style={styles.primaryText}>Exporter CSV</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.secondary} onPress={exportPdf}>
            <Text style={styles.secondaryText}>Exporter PDF</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.secondary} onPress={shareWhatsApp}>
            <Text style={styles.secondaryText}>Partager WhatsApp</Text>
          </TouchableOpacity>
        </View>
      )}
      </ScrollView>

      {showDatePicker && Platform.OS !== 'web' && (
        <View style={styles.datePickerModal}>
          <View style={styles.datePickerContent}>
            <Text style={styles.datePickerTitle}>Sélectionner une date</Text>
            <TextInput
              style={styles.dateInput}
              value={selectedDate.toISOString().slice(0, 10)}
              onChangeText={(text) => {
                const date = new Date(text);
                if (!isNaN(date.getTime())) {
                  setSelectedDate(date);
                }
              }}
              placeholder="YYYY-MM-DD"
              keyboardType="numeric"
            />
            <TouchableOpacity
              style={styles.datePickerButton}
              onPress={() => setShowDatePicker(false)}
            >
              <Text style={styles.datePickerButtonText}>Valider</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      <EditGIEInfoModal
        visible={showEditGIE}
        onClose={() => setShowEditGIE(false)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC', paddingHorizontal: 20, paddingTop: 60 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  title: { fontSize: 24, fontWeight: '700', color: '#1F2937' },
  editButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#F0FDF4',
  },
  dateSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 24,
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    flex: 1,
  },
  dateButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  todayButton: {
    backgroundColor: '#F0FDF4',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#059669',
  },
  todayButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#059669',
  },
  datePickerModal: {
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
  datePickerContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    width: '80%',
    maxWidth: 400,
  },
  datePickerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 16,
    textAlign: 'center',
  },
  dateInput: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#1F2937',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 16,
    textAlign: 'center',
  },
  datePickerButton: {
    backgroundColor: '#059669',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  datePickerButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  cards: { gap: 12, marginBottom: 24 },
  card: { backgroundColor: '#FFFFFF', borderRadius: 12, padding: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  cardLabel: { fontSize: 14, color: '#6B7280', marginBottom: 6, fontWeight: '500' },
  cardValue: { fontSize: 20, fontWeight: '800', color: '#1F2937' },
  cardSubtext: { fontSize: 12, color: '#9CA3AF', marginTop: 4 },
  cardGreen: { borderLeftWidth: 4, borderLeftColor: '#10B981' },
  cardBlue: { borderLeftWidth: 4, borderLeftColor: '#3B82F6' },
  cardRed: { borderLeftWidth: 4, borderLeftColor: '#EF4444' },
  memberListSection: { marginBottom: 24 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#1F2937', marginBottom: 4 },
  sectionSubtitle: { fontSize: 14, color: '#6B7280', marginBottom: 16 },
  memberList: { gap: 8 },
  memberItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  memberItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  memberItemInfo: {
    flex: 1,
  },
  memberItemName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  memberItemType: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  memberItemAmount: {
    fontSize: 14,
    fontWeight: '700',
    color: '#10B981',
  },
  memberItemNoCotisation: {
    opacity: 0.7,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 4,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#9CA3AF',
  },
  actionsTop: { gap: 12, marginBottom: 16 },
  actionsBottom: { gap: 12, marginBottom: 60 },
  primary: { backgroundColor: '#059669', borderRadius: 12, paddingVertical: 16, alignItems: 'center' },
  primaryText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },
  secondary: { backgroundColor: '#FFFFFF', borderRadius: 12, paddingVertical: 16, alignItems: 'center', borderWidth: 1, borderColor: '#E5E7EB' },
  secondaryText: { color: '#6366F1', fontSize: 16, fontWeight: '600' },
});
