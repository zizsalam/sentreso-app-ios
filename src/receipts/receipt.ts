import * as Print from 'expo-print';
import { shareAsync } from 'expo-sharing';
import { Linking } from 'react-native';
import { supabase } from '@/services/supabaseClient';

export type SimpleTx = {
  id: string;
  type: 'income' | 'expense';
  amount: number;
  category: string | null;
  description: string | null;
  date?: string | null; // human display if available
  created_at?: string | null; // ISO
};

const START_URL = process.env.EXPO_PUBLIC_START_URL || 'https://sentre.so/start';
const ALLOW_EXPENSE_RECEIPTS = false;

function formatAmountCfa(amount: number): string {
  try {
    return new Intl.NumberFormat('fr-FR').format(amount);
  } catch {
    return String(amount);
  }
}

function escapeHtml(s: string | null | undefined): string {
  if (!s) return '';
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function buildQrUrl(data: string, size = 160): string {
  // External QR image service; replace with local generation in a later iteration
  const enc = encodeURIComponent(data);
  return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${enc}`;
}

function makeRef(merchantId: string, txId: string, createdAtIso: string) {
  const day = (createdAtIso || new Date().toISOString()).slice(0, 10).replace(/-/g, '');
  return `${(merchantId || 'UNK').slice(0, 6)}-${day}-${txId.slice(0, 6)}`.toUpperCase();
}

function buildReceiptHtml(opts: { tx: SimpleTx; createdAtIso: string; ref: string; startUrl: string; merchantName: string; merchantContact: string }) {
  const { tx, createdAtIso, ref, startUrl, merchantName, merchantContact } = opts;
  const qrUrl = buildQrUrl(startUrl, 180);
  const friendlyDate = (tx.date || createdAtIso || '').replace('T', ' ').replace('Z', '');

  const kindLabel = tx.type === 'income' ? 'Revenu (Vente)' : 'Dépense';
  const amount = formatAmountCfa(tx.amount);

  return `
  <html>
    <head>
      <meta charset="utf-8" />
      <style>
        body{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Fira Sans', 'Droid Sans', 'Helvetica Neue', Arial, sans-serif; padding:24px; color:#111827; }
        .card{ border:1px solid #e5e7eb; border-radius:12px; padding:20px; }
        h1{ font-size:20px; margin:0 0 12px 0; }
        .header{ display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:12px; }
        .merchant{ font-weight:700; }
        .contact{ color:#6b7280; font-size:12px; }
        .row{ display:flex; justify-content:space-between; margin:8px 0; }
        .label{ color:#6b7280; }
        .amount{ font-weight:700; font-size:22px; }
        .footer{ margin-top:20px; padding-top:12px; border-top:1px dashed #e5e7eb; display:flex; gap:16px; align-items:center; }
        .small{ color:#6b7280; font-size:12px; }
        img.qr{ width:180px; height:180px; }
      </style>
    </head>
    <body>
      <div class="card">
        <div class="header">
          <div>
            <h1>Reçu Sentreso</h1>
            <div class="merchant">${escapeHtml(merchantName)}</div>
            <div class="contact">${escapeHtml(merchantContact)}</div>
          </div>
        </div>
        <div class="row"><div class="label">Type</div><div>${kindLabel}</div></div>
        <div class="row"><div class="label">Montant</div><div class="amount">${amount} FCFA</div></div>
        <div class="row"><div class="label">Catégorie</div><div>${escapeHtml(tx.category)}</div></div>
        <div class="row"><div class="label">Description</div><div>${escapeHtml(tx.description)}</div></div>
        <div class="row"><div class="label">Date</div><div>${escapeHtml(friendlyDate)}</div></div>

        <div class="footer">
          <img class="qr" src="${qrUrl}" />
          <div>
            <div>Reçu généré par Sentreso.</div>
            <div class="small">Scanne pour commencer.</div>
            <div class="small">Reçu n°&nbsp;${ref}</div>
            <div class="small">Lien&nbsp;: ${startUrl}</div>
          </div>
        </div>
      </div>
    </body>
  </html>`;
}

export async function createAndShareReceipt(tx: SimpleTx, opts?: { openWhatsApp?: boolean }) {
  if (!ALLOW_EXPENSE_RECEIPTS && tx.type !== 'income') {
    throw new Error('Le reçu est disponible pour les ventes uniquement.');
  }
  const { data: userData } = await supabase.auth.getUser();
  const merchantId = userData?.user?.id || 'unknown';
  const createdAtIso = tx.created_at || new Date().toISOString();

  const ref = makeRef(merchantId, tx.id, createdAtIso);
  const merchantName = (userData?.user?.user_metadata as any)?.name
    || (userData?.user?.email?.split('@')[0])
    || 'Marchand';
  const merchantContact = (userData?.user?.user_metadata as any)?.phone
    || (userData?.user as any)?.phone
    || (userData?.user?.email || '');
  const startUrl = `${START_URL}?ref=${encodeURIComponent(ref)}`;
  const html = buildReceiptHtml({ tx, createdAtIso, ref, startUrl, merchantName, merchantContact });
  const { uri } = await Print.printToFileAsync({ html });

  try {
    await shareAsync(uri, { UTI: 'com.adobe.pdf', mimeType: 'application/pdf', dialogTitle: 'Partager le reçu' });
  } catch (err) {
    console.warn('Sharing failed', err);
  }

  // Optional WhatsApp quick action
  const whatsappText = `Envoie SENT ${ref} au +221 …`;
  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(whatsappText)}`;
  if (opts?.openWhatsApp) {
    try {
      await Linking.openURL(whatsappUrl);
    } catch {}
  }

  return { uri, ref, startUrl, whatsappText, whatsappUrl };
}
