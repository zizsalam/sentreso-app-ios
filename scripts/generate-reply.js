#!/usr/bin/env node
/**
 * Generate Reply Text Only (No Sending)
 *
 * Generate email response text to copy-paste manually
 * Usage: node scripts/generate-reply.js email@example.com platform profile [phone]
 *
 * Examples:
 *   node scripts/generate-reply.js mohametbiramegaye@gmail.com ios commercant 772683652
 *   node scripts/generate-reply.js user@example.com android commercant
 *   node scripts/generate-reply.js contact@example.com ios distributeur
 */

const email = process.argv[2];
const platform = process.argv[3]?.toLowerCase();
const profile = process.argv[4]?.toLowerCase();
const phone = process.argv[5];

if (!email || !email.includes('@')) {
  console.error('❌ Usage: node scripts/generate-reply.js email@example.com platform profile [phone]');
  console.error('\nExamples:');
  console.error('  node scripts/generate-reply.js mohametbiramegaye@gmail.com ios commercant 772683652');
  console.error('  node scripts/generate-reply.js user@example.com android commercant');
  console.error('  node scripts/generate-reply.js contact@example.com ios distributeur');
  console.error('\nPlatforms: ios, android, (or leave blank for both)');
  console.error('Profiles: commercant, distributeur, (or leave blank for generic)');
  process.exit(1);
}

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

function generateDistributorResponse(email, phone) {
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

// Generate response
let subject = '';
let body = '';

if (profile === 'commercant' || profile === 'merchant') {
  subject = '🎉 Bienvenue chez Sentreso - Votre inscription est en cours';
  body = generateMerchantResponse(email, phone, platform);
} else if (profile === 'distributeur' || profile === 'distributor') {
  subject = '🚀 Bienvenue dans l\'équipe Sentreso';
  body = generateDistributorResponse(email, phone);
} else {
  subject = 'Nous avons bien reçu votre demande - Sentreso';
  body = generateGenericResponse(email);
}

// Output
console.log('\n═'.repeat(70));
console.log('  📝 SENTRESO - REPLY GENERATOR');
console.log('═'.repeat(70));
console.log(`\n📧 To: ${email}`);
console.log(`📱 Platform: ${platform || 'All platforms'}`);
console.log(`👤 Profile: ${profile || 'Generic'}`);
console.log(`📞 Phone: ${phone || 'N/A'}`);
console.log('\n' + '─'.repeat(70));
console.log(`\n📨 SUBJECT:\n${subject}`);
console.log('\n' + '─'.repeat(70));
console.log('\n📄 BODY (Copy this):\n');
console.log(body);
console.log('═'.repeat(70));
console.log('\n✅ Copy the text above and paste it into your email reply!');
console.log('   From: support@sentreso.com');
console.log(`   To: ${email}`);
console.log(`   Subject: ${subject}\n`);
