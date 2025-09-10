#!/usr/bin/env node

const { exec } = require('child_process');
const { promisify } = require('util');

const execAsync = promisify(exec);

async function runDigCommand(type, domain) {
  try {
    const { stdout } = await execAsync(`dig ${type} ${domain}`);
    return stdout;
  } catch (error) {
    return `Erreur: ${error.message}`;
  }
}

async function verifyDNSConfiguration() {
  console.log('🌐 Vérification de la configuration DNS pour sentreso.com\n');
  console.log('=' .repeat(60));

  const checks = [
    {
      name: 'Enregistrements MX',
      command: 'MX',
      domain: 'sentreso.com',
      expected: ['mxa.mailgun.org', 'mxb.mailgun.org'],
      current: ['mx1.privateemail.com', 'mx2.privateemail.com']
    },
    {
      name: 'Enregistrement SPF',
      command: 'TXT',
      domain: 'sentreso.com',
      expected: ['v=spf1 include:mailgun.org'],
      current: []
    },
    {
      name: 'Enregistrement DKIM',
      command: 'TXT',
      domain: 's1._domainkey.sentreso.com',
      expected: ['DKIM record from Mailgun'],
      current: []
    }
  ];

  for (const check of checks) {
    console.log(`\n🔍 Vérification: ${check.name}`);
    console.log(`   Domaine: ${check.domain}`);

    const result = await runDigCommand(check.command, check.domain);

    // Analyser le résultat
    const lines = result.split('\n');
    const answerSection = lines.findIndex(line => line.includes('ANSWER SECTION:'));

    if (answerSection !== -1) {
      const answers = lines.slice(answerSection + 1)
        .filter(line => line.trim() && !line.startsWith(';'))
        .filter(line => line.includes(check.domain));

      console.log(`   📋 Résultats actuels:`);
      answers.forEach(answer => {
        console.log(`      ${answer.trim()}`);
      });

      // Vérifier si la migration est nécessaire
      const needsMigration = check.current.some(current =>
        answers.some(answer => answer.includes(current))
      );

      if (needsMigration) {
        console.log(`   ⚠️  Migration nécessaire vers Mailgun`);
        console.log(`   📝 À configurer: ${check.expected.join(', ')}`);
      } else {
        console.log(`   ✅ Configuration correcte`);
      }
    } else {
      console.log(`   ❌ Aucun enregistrement trouvé`);
      console.log(`   📝 À configurer: ${check.expected.join(', ')}`);
    }
  }

  console.log('\n' + '=' .repeat(60));
  console.log('📋 Résumé des actions nécessaires:\n');

  console.log('1️⃣ Créer un compte Mailgun:');
  console.log('   • Allez sur https://mailgun.com');
  console.log('   • Créez un compte avec kaneaziz@gmail.com');
  console.log('   • Ajoutez le domaine sentreso.com');

  console.log('\n2️⃣ Modifier les enregistrements DNS:');
  console.log('   • Remplacez les MX PrivateEmail par Mailgun');
  console.log('   • Ajoutez l\'enregistrement SPF');
  console.log('   • Ajoutez l\'enregistrement DKIM (fourni par Mailgun)');

  console.log('\n3️⃣ Configurer Supabase:');
  console.log('   • Connectez-vous à Supabase Dashboard');
  console.log('   • Allez dans Settings → Auth → Email Templates');
  console.log('   • Configurez SMTP avec les infos Mailgun');

  console.log('\n4️⃣ Tester la configuration:');
  console.log('   • Attendez 24-48h pour la propagation DNS');
  console.log('   • Relancez ce script: node verify-dns.js');
  console.log('   • Testez l\'envoi: node test-email-config.js');
}

// Fonction pour vérifier la configuration Mailgun
async function checkMailgunSetup() {
  console.log('\n📧 Vérification de la configuration Mailgun...\n');

  console.log('🔗 Étapes pour configurer Mailgun:');
  console.log('1. Connectez-vous à https://mailgun.com');
  console.log('2. Créez un nouveau domaine: sentreso.com');
  console.log('3. Copiez les enregistrements DNS fournis');
  console.log('4. Ajoutez-les à votre registrar de domaine');
  console.log('5. Attendez la vérification (24-48h)');

  console.log('\n📋 Enregistrements typiques Mailgun:');
  console.log('MX: mxa.mailgun.org, mxb.mailgun.org');
  console.log('SPF: v=spf1 include:mailgun.org ~all');
  console.log('DKIM: [valeur fournie par Mailgun]');
}

// Fonction pour vérifier Supabase
async function checkSupabaseSetup() {
  console.log('\n🔧 Vérification de la configuration Supabase...\n');

  console.log('📋 Configuration SMTP dans Supabase Dashboard:');
  console.log('Host: smtp.mailgun.org');
  console.log('Port: 587');
  console.log('Username: kaneaziz@gmail.com');
  console.log('Password: [votre password Mailgun]');
  console.log('Sender Name: Sentreso Finance');
  console.log('Sender Email: support@sentreso.com');

  console.log('\n📧 Templates à configurer:');
  console.log('• confirm_signup - Email de bienvenue');
  console.log('• recovery - Réinitialisation de mot de passe');
  console.log('• magic_link - Connexion par lien magique');
}

// Fonction principale
async function main() {
  console.log('🚀 Vérificateur DNS - Sentreso Finance\n');

  await verifyDNSConfiguration();
  await checkMailgunSetup();
  await checkSupabaseSetup();

  console.log('\n' + '=' .repeat(60));
  console.log('✅ Vérification terminée!');
  console.log('\n📞 Prochaines étapes:');
  console.log('1. Suivez le guide DNS_MIGRATION_GUIDE.md');
  console.log('2. Configurez Mailgun et les DNS');
  console.log('3. Configurez Supabase Dashboard');
  console.log('4. Testez avec: node test-email-config.js');
}

// Exécuter le script
if (require.main === module) {
  main().catch(console.error);
}

module.exports = {
  verifyDNSConfiguration,
  checkMailgunSetup,
  checkSupabaseSetup
};
