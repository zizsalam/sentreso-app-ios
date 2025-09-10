#!/usr/bin/env node

/**
 * Script de vérification de conformité Apple
 * Vérifie que l'app respecte les guidelines 5.1.1 et 5.1.1(v)
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Vérification de conformité Apple - Sentreso Finance\n');

let allTestsPassed = true;

// Test 1: Vérifier app.json
console.log('📋 Test 1: Configuration app.json');
try {
  const appJson = JSON.parse(fs.readFileSync('app.json', 'utf8'));

  // Vérifier supportsTablet
  if (appJson.expo.ios.supportsTablet === false) {
    console.log('  ✅ supportsTablet: false (iPad désactivé)');
  } else {
    console.log('  ❌ supportsTablet doit être false');
    allTestsPassed = false;
  }

  // Vérifier buildNumber
  if (appJson.expo.ios.buildNumber === "33") {
    console.log('  ✅ buildNumber: 33 (incrémenté)');
  } else {
    console.log('  ❌ buildNumber doit être 33');
    allTestsPassed = false;
  }

  // Vérifier NSUserTrackingUsageDescription
  if (appJson.expo.ios.infoPlist.NSUserTrackingUsageDescription) {
    console.log('  ✅ NSUserTrackingUsageDescription: présent');
  } else {
    console.log('  ❌ NSUserTrackingUsageDescription manquant');
    allTestsPassed = false;
  }

} catch (error) {
  console.log('  ❌ Erreur lecture app.json:', error.message);
  allTestsPassed = false;
}

// Test 2: Vérifier Info.plist
console.log('\n📋 Test 2: Configuration Info.plist');
try {
  const infoPlist = fs.readFileSync('ios/SentresoFinance/Info.plist', 'utf8');

  if (infoPlist.includes('<string>49</string>')) {
    console.log('  ✅ CFBundleVersion: 49 (incrémenté)');
  } else {
    console.log('  ❌ CFBundleVersion doit être 49');
    allTestsPassed = false;
  }

} catch (error) {
  console.log('  ❌ Erreur lecture Info.plist:', error.message);
  allTestsPassed = false;
}

// Test 3: Vérifier le code de l'app
console.log('\n📋 Test 3: Code de l\'application');
try {
  const layoutFile = fs.readFileSync('app/_layout.tsx', 'utf8');

  // Vérifier que le téléphone est optionnel
  if (layoutFile.includes('placeholder="Téléphone (optionnel)"')) {
    console.log('  ✅ Téléphone rendu optionnel');
  } else {
    console.log('  ❌ Téléphone doit être optionnel');
    allTestsPassed = false;
  }

  // Vérifier la validation du nom uniquement
  if (layoutFile.includes('if (!name.trim())') && !layoutFile.includes('!phone.trim()')) {
    console.log('  ✅ Seul le nom est obligatoire');
  } else {
    console.log('  ❌ Validation incorrecte');
    allTestsPassed = false;
  }

  // Vérifier la fonction de suppression
  if (layoutFile.includes('🗑️') && layoutFile.includes('Supprimer le compte') && layoutFile.includes('Alert.alert')) {
    console.log('  ✅ Fonction de suppression présente');
  } else {
    console.log('  ❌ Fonction de suppression manquante');
    allTestsPassed = false;
  }

  // Vérifier la fonction de déconnexion
  if (layoutFile.includes('Déconnexion') && layoutFile.includes('logoutButton')) {
    console.log('  ✅ Fonction de déconnexion présente');
  } else {
    console.log('  ❌ Fonction de déconnexion manquante');
    allTestsPassed = false;
  }

} catch (error) {
  console.log('  ❌ Erreur lecture _layout.tsx:', error.message);
  allTestsPassed = false;
}

// Test 4: Vérifier les captures d'écran
console.log('\n📋 Test 4: Captures d\'écran');
try {
  const appImages = fs.readFileSync('app_images.html', 'utf8');

  if (appImages.includes('1320x2868')) {
    console.log('  ✅ Captures iPhone 1320x2868 configurées');
  } else {
    console.log('  ❌ Dimensions iPhone incorrectes');
    allTestsPassed = false;
  }

  if (appImages.includes('supportsTablet: false')) {
    console.log('  ✅ Support iPad désactivé dans les instructions');
  } else {
    console.log('  ⚠️ Instructions iPad à vérifier');
  }

} catch (error) {
  console.log('  ❌ Erreur lecture app_images.html:', error.message);
  allTestsPassed = false;
}

// Résultat final
console.log('\n' + '='.repeat(50));
if (allTestsPassed) {
  console.log('🎉 TOUS LES TESTS PASSENT !');
  console.log('✅ L\'app est conforme aux exigences Apple');
  console.log('🚀 Prêt pour soumission à l\'App Store');
} else {
  console.log('❌ CERTAINS TESTS ÉCHOUENT');
  console.log('⚠️ Corrigez les problèmes avant soumission');
}
console.log('='.repeat(50));

// Instructions de soumission
if (allTestsPassed) {
  console.log('\n📋 Instructions de soumission :');
  console.log('1. Construire l\'app : npx eas build --platform ios');
  console.log('2. Uploader vers App Store Connect');
  console.log('3. Vérifier les métadonnées');
  console.log('4. Soumettre pour vérification');
  console.log('5. Temps d\'attente : 24-48 heures');
}

process.exit(allTestsPassed ? 0 : 1);
