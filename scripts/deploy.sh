#!/bin/bash

# Script de déploiement Sentreso Finance
# Usage: ./scripts/deploy.sh <version> <message> [--build]

set -e

VERSION=$1
MESSAGE=$2
BUILD_NEW=${3:-""}

if [ -z "$VERSION" ] || [ -z "$MESSAGE" ]; then
  echo "❌ Usage: ./scripts/deploy.sh <version> <message> [--build]"
  echo ""
  echo "Examples:"
  echo "  ./scripts/deploy.sh 1.2.0 'Nouvelles fonctionnalités GIE'"
  echo "  ./scripts/deploy.sh 1.2.1 'Correction bugs' --build"
  exit 1
fi

echo "🚀 Déploiement Sentreso Finance v$VERSION"
echo "📝 Message: $MESSAGE"
echo ""

# Vérifier que nous sommes dans le bon répertoire
if [ ! -f "app.json" ]; then
  echo "❌ Erreur: app.json non trouvé. Exécutez ce script depuis la racine du projet."
  exit 1
fi

# 1. Mettre à jour app.json
echo "📝 Mise à jour de la version dans app.json..."
node -e "
const fs = require('fs');
const appJson = JSON.parse(fs.readFileSync('app.json', 'utf8'));

// Mettre à jour la version
appJson.expo.version = '$VERSION';

// Incrémenter les build numbers
const currentIosBuild = parseInt(appJson.expo.ios.buildNumber);
const currentAndroidBuild = parseInt(appJson.expo.android.versionCode);

appJson.expo.ios.buildNumber = String(currentIosBuild + 1);
appJson.expo.android.versionCode = currentAndroidBuild + 1;

// Activer les OTA updates si pas déjà fait
if (!appJson.expo.updates) {
  appJson.expo.updates = {
    enabled: true,
    checkAutomatically: 'ON_LOAD',
    fallbackToCacheTimeout: 0,
    url: 'https://u.expo.dev/98d358f0-9c1a-4f1d-8df4-68c3da5e331d'
  };
}

// Mettre à jour runtimeVersion avec la nouvelle version
appJson.expo.runtimeVersion = '$VERSION';

fs.writeFileSync('app.json', JSON.stringify(appJson, null, 2));
console.log('✅ Version mise à jour:');
console.log('   - Version:', '$VERSION');
console.log('   - iOS Build:', String(currentIosBuild + 1));
console.log('   - Android Build:', currentAndroidBuild + 1);
"

# 2. Publier OTA update
echo ""
echo "📡 Publication de la mise à jour OTA..."
eas update --branch production --message "$MESSAGE"

if [ "$?" -eq 0 ]; then
  echo "✅ Mise à jour OTA publiée avec succès!"
else
  echo "❌ Erreur lors de la publication OTA"
  exit 1
fi

# 3. Optionnel: Créer un nouveau build
if [ "$BUILD_NEW" == "--build" ]; then
  echo ""
  echo "📦 Création d'un nouveau build complet..."

  read -p "Créer le build Android? (y/n) " -n 1 -r
  echo
  if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "📦 Build Android en cours..."
    eas build --platform android --profile production
  fi

  read -p "Créer le build iOS? (y/n) " -n 1 -r
  echo
  if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "📦 Build iOS en cours..."
    eas build --platform ios --profile production
  fi
fi

echo ""
echo "✅ Déploiement terminé!"
echo ""
echo "📋 Prochaines étapes:"
echo "   1. Vérifier la mise à jour: eas update:list"
echo "   2. Tester sur un appareil réel"
echo "   3. Informer les utilisateurs de la mise à jour"
echo ""
