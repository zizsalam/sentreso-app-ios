// Debug script for recording functionality
// Run with: node debug-recording.js

const { Platform } = require('react-native');

console.log('🔍 Debugging Recording Flow');
console.log('==========================');

// Check platform
console.log('📱 Platform:', Platform.OS);

// Check if expo-av is available
try {
  const { Audio } = require('expo-av');
  console.log('✅ expo-av is available');

  // Test audio mode configuration
  Audio.setAudioModeAsync({
    allowsRecordingIOS: true,
    playsInSilentModeIOS: true,
    staysActiveInBackground: false,
    shouldDuckAndroid: true,
  }).then(() => {
    console.log('✅ Audio mode configured successfully');
  }).catch((error) => {
    console.error('❌ Audio mode configuration failed:', error);
  });

} catch (error) {
  console.error('❌ expo-av not available:', error);
}

// Check if VAPI library is available
try {
  const Vapi = require('@vapi-ai/web');
  console.log('✅ @vapi-ai/web is available');
} catch (error) {
  console.error('❌ @vapi-ai/web not available:', error);
}

// Test VAPI configuration
const testConfig = {
  publicKey: '1712f176-2888-4793-863c-3feb69fed10f',
  assistantId: '440685e5-c134-47cc-94ec-be9d333b0bef',
  privateKey: 'a1e984ef-09bc-4c3f-91ad-ece7df857d2b'
};

console.log('🔑 VAPI Configuration:');
console.log('  - Public Key:', testConfig.publicKey ? '***' + testConfig.publicKey.slice(-4) : 'missing');
console.log('  - Assistant ID:', testConfig.assistantId ? '***' + testConfig.assistantId.slice(-4) : 'missing');
console.log('  - Private Key:', testConfig.privateKey ? '***' + testConfig.privateKey.slice(-4) : 'missing');

console.log('\n🎯 Debug complete. Check the output above for any issues.');
