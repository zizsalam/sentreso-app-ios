#!/usr/bin/env node
import 'dotenv/config';
/**
 * Manual Form Response Generator
 *
 * Generate email responses to Formspree submissions manually
 * Usage: node scripts/reply-to-form.js email@example.com platform profile [phone]
 *
 * Examples:
 *   node scripts/reply-to-form.js mohametbiramegaye@gmail.com ios commercant 772683652
 *   node scripts/reply-to-form.js user@example.com android commercant
 *   node scripts/reply-to-form.js contact@example.com ios distributeur
 */

import { createClient } from '@supabase/supabase-js';
import fetch from 'node-fetch';

const MAILGUN_API_KEY = process.env.MAILGUN_API_KEY || '';
const MAILGUN_DOMAIN = process.env.MAILGUN_DOMAIN || 'sentreso.com';
const MAILGUN_BASE = process.env.MAILGUN_BASE || 'https://api.eu.mailgun.net/v3';
// Send FROM a deliverable mailbox (no-reply), and set Reply-To to support
const FROM_EMAIL = process.env.SENDER_FROM || `no-reply@${MAILGUN_DOMAIN}`;
const REPLY_TO = process.env.SUPPORT_FROM || 'support@sentreso.com';

// Get arguments
const email = process.argv[2];
const platform = process.argv[3]?.toLowerCase();
const profile = process.argv[4]?.toLowerCase();
const phone = process.argv[5];

// Validate
if (!email || !email.includes('@')) {
  console.error('❌ Usage: node scripts/reply-to-form.js email@example.com platform profile [phone]');
  console.error('\nExamples:');
  console.error('  node scripts/reply-to-form.js mohametbiramegaye@gmail.com ios commercant 772683652');
  console.error('  node scripts/reply-to-form.js user@example.com android commercant');
  console.error('  node scripts/reply-to-form.js contact@example.com ios distributeur');
  console.error('\nPlatforms: ios, android, (or leave blank)');
  console.error('Profiles: commercant, distributeur, (or leave blank)');
  process.exit(1);
}

// Generate response based on profile
function generateMerchantResponse(email, phone, platform) {
  return `Bonjour,

🎉 Merci pour votre intérêt pour Sentreso Finance !

Nous avons bien reçu votre demande d'inscription en tant que commerçant.

📱 PROCHAINES ÉTAPES :

${platform === 'ios' ? `
1. Téléchargez l'application Sentreso sur iOS :

   🆕 VERSION BÊTA (Recommandée - Dernières fonctionnalités)
   • TestFlight : https://testflight.apple.com/join/bqnssref

   OU

   ✅ VERSION STABLE (App Store)
   • Recherchez "Sentreso Finance" sur l'App Store
   • Lien direct : https://apps.apple.com/us/app/sentreso-finance/id6748926788

2. Créez votre compte avec cette adresse email : ${email}
` : platform === 'android' ? `
1. Téléchargez l'application Sentreso
   👉 https://expo.dev/accounts/zizsalam/projects/sentreso-finance/builds/7336fdc5-6b79-4e69-93f9-9a0e318fe48f

2. Créez votre compte avec cette adresse email : ${email}
` : `
1. Téléchargez l'application Sentreso :

   📱 iOS :
   • Bêta (Recommandée) : https://testflight.apple.com/join/bqnssref
   • Stable (App Store) : https://apps.apple.com/us/app/sentreso-finance/id6748926788

   🤖 Android :
   • https://expo.dev/accounts/zizsalam/projects/sentreso-finance/builds/7336fdc5-6b79-4e69-93f9-9a0e318fe48f

2. Créez votre compte avec cette adresse email : ${email}
`}

3. Commencez à enregistrer vos transactions en quelques secondes

✨ AVANTAGES SENTRESO :

• ✅ Suivi en temps réel de vos revenus et dépenses
• ✅ Génération automatique de reçus pour vos clients
• ✅ Statistiques et analyses de votre activité
• ✅ Simple, rapide et sécurisé

${phone ? `📞 Nous vous contacterons au ${phone} dans les prochaines 24h pour vous accompagner.` : ''}

💬 BESOIN D'AIDE ?

Répondez simplement à cet email ou contactez-nous :
📧 support@sentreso.com
📱 WhatsApp : +221 77 839 10 34

À très bientôt sur Sentreso !

---
L'équipe Sentreso
www.sentreso.com
`;
}

function generateDistributorResponse(email, phone, platform) {
  return `Bonjour,

🚀 Bienvenue dans l'équipe Sentreso !

Nous sommes ravis de votre intérêt pour rejoindre notre réseau de distributeurs.

📋 PROCHAINES ÉTAPES :

1. Un membre de notre équipe vous contactera dans les prochaines 24h pour :
   • Discuter de votre profil et expérience
   • Vous présenter le programme de distribution
   • Répondre à toutes vos questions

2. Vous recevrez un accès privilégié à :
   • L'application Sentreso (version distributeur)
   • Les outils de formation et support
   • Le tableau de bord de suivi des commerçants

💼 CE QUE VOUS ALLEZ FAIRE :

• Recruter et former des commerçants dans votre zone
• Les accompagner dans l'utilisation de l'application
• Gagner des commissions sur chaque commerçant actif
• Faire partie d'une révolution fintech en Afrique

${phone ? `📞 Nous vous appellerons au ${phone} très prochainement.` : ''}

💬 DES QUESTIONS ?

N'hésitez pas à nous contacter :
📧 support@sentreso.com
📱 WhatsApp : +221 77 839 10 34

À très vite !

---
L'équipe Sentreso
www.sentreso.com
`;
}

function generateGenericResponse(email) {
  return `Bonjour,

Nous avons bien reçu votre message et nous vous en remercions.

Notre équipe va examiner votre demande et vous répondra dans les plus brefs délais (généralement sous 24h).

En attendant, n'hésitez pas à consulter notre site web pour en savoir plus sur Sentreso :
👉 www.sentreso.com

💬 BESOIN D'AIDE URGENTE ?

Contactez-nous directement :
📧 support@sentreso.com

Merci pour votre intérêt pour Sentreso !

---
L'équipe Sentreso
www.sentreso.com
`;
}

async function sendEmail(recipient, subject, body) {
  console.log(`\n📧 Sending email to ${recipient}...\n`);

  if (!MAILGUN_API_KEY) {
    throw new Error('Missing MAILGUN_API_KEY env var. Set it before running this script.');
  }

  const formData = new URLSearchParams();
  formData.append('from', `Sentreso <${FROM_EMAIL}>`);
  formData.append('to', recipient);
  formData.append('subject', subject);
  formData.append('text', body);
  formData.append('h:Reply-To', REPLY_TO);

  const response = await fetch(
    `${MAILGUN_BASE}/${MAILGUN_DOMAIN}/messages`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${Buffer.from(`api:${MAILGUN_API_KEY}`).toString('base64')}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData,
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Mailgun error: ${errorText}`);
  }

  const result = await response.json();
  return result;
}

async function main() {
  console.log('\n📝 FORM RESPONSE GENERATOR\n');
  console.log('═'.repeat(60));
  console.log(`📧 Email: ${email}`);
  console.log(`📱 Platform: ${platform || 'Non spécifiée (both iOS & Android)'}`);
  console.log(`👤 Profile: ${profile || 'Non spécifié (generic)'}`);
  console.log(`📞 Phone: ${phone || 'Non spécifié'}`);
  console.log('═'.repeat(60));

  // Determine response
  let subject = '';
  let body = '';

  if (profile === 'commercant' || profile === 'merchant') {
    subject = '🎉 Bienvenue chez Sentreso - Votre inscription est en cours';
    body = generateMerchantResponse(email, phone, platform);
  } else if (profile === 'distributeur' || profile === 'distributor') {
    subject = '🚀 Bienvenue dans l\'équipe Sentreso';
    body = generateDistributorResponse(email, phone, platform);
  } else {
    subject = 'Nous avons bien reçu votre demande - Sentreso';
    body = generateGenericResponse(email);
  }

  // Print preview
  console.log('\n📄 EMAIL PREVIEW:\n');
  console.log('Subject:', subject);
  console.log('\n' + '─'.repeat(60) + '\n');
  console.log(body);
  console.log('─'.repeat(60) + '\n');

  // Ask for confirmation
  console.log('🚀 Send this email? (y/n)');

  // For auto-send, skip confirmation
  const autoSend = process.argv.includes('--send') || process.argv.includes('-y');

  if (autoSend) {
    console.log('✅ Auto-send enabled, sending...\n');
  } else {
    // Wait for user input
    const readline = await import('readline');
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    const answer = await new Promise(resolve => {
      rl.question('', resolve);
    });
    rl.close();

    if (answer.toLowerCase() !== 'y' && answer.toLowerCase() !== 'yes') {
      console.log('❌ Email not sent. Cancelled by user.');
      process.exit(0);
    }
  }

  // Send email
  try {
    const result = await sendEmail(email, subject, body);
    console.log('✅ Email sent successfully!');
    console.log('   Message ID:', result.id);
    console.log('   Recipient:', email);
    console.log('\n🎉 Done!\n');
  } catch (error) {
    console.error('❌ Error sending email:', error.message);
    process.exit(1);
  }
}

main();
