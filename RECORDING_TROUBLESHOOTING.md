# Recording Flow Troubleshooting Guide

## Common Issues and Solutions

### 1. Audio Permission Issues

**Symptoms:**
- "Audio permission not granted" error
- Recording button doesn't work
- App crashes when trying to record

**Solutions:**
- Check that `expo-av` plugin is added to `app.json`
- Ensure microphone permissions are properly configured in `app.json`
- On iOS: Check `NSMicrophoneUsageDescription` in `infoPlist`
- On Android: Check `android.permission.RECORD_AUDIO` in permissions array

**Debug Steps:**
```javascript
// Check permission status
const { status } = await Audio.requestPermissionsAsync();
console.log('Audio permission status:', status);
```

### 2. VAPI Configuration Issues

**Symptoms:**
- "Missing VAPI configuration" error
- "VAPI library not available" error
- Recording starts but no response received

**Solutions:**
- Verify VAPI keys are valid and not expired
- Check internet connection
- Ensure `@vapi-ai/web` package is installed
- Verify assistant ID is correct

**Debug Steps:**
```javascript
// Check VAPI configuration
console.log('VAPI Config:', {
  publicKey: config.publicKey ? '***' + config.publicKey.slice(-4) : 'missing',
  assistantId: config.assistantId ? '***' + config.assistantId.slice(-4) : 'missing'
});
```

### 3. Platform-Specific Issues

**Web Platform:**
- VAPI web library might not load properly
- Browser microphone permissions
- HTTPS requirement for microphone access

**Mobile Platform:**
- Audio recording permissions
- Audio mode configuration
- Background audio restrictions

### 4. Network and Connectivity Issues

**Symptoms:**
- Recording starts but processing never completes
- "Connection test failed" error
- Timeout errors

**Solutions:**
- Check internet connection
- Verify VAPI service is accessible
- Check firewall/proxy settings

### 5. Audio Recording Issues

**Symptoms:**
- Recording starts but no audio is captured
- Audio quality issues
- Recording stops unexpectedly

**Solutions:**
- Check microphone hardware
- Verify audio mode configuration
- Test with different recording options

## Debug Commands

### Run Debug Script
```bash
node debug-recording.js
```

### Check Dependencies
```bash
npm list expo-av
npm list @vapi-ai/web
```

### Test Audio Permissions
```javascript
import { Audio } from 'expo-av';

// Request permissions
const { status } = await Audio.requestPermissionsAsync();
console.log('Permission status:', status);

// Configure audio mode
await Audio.setAudioModeAsync({
  allowsRecordingIOS: true,
  playsInSilentModeIOS: true,
  staysActiveInBackground: false,
  shouldDuckAndroid: true,
});
```

### Test VAPI Connection
```javascript
// Test VAPI library loading
try {
  const Vapi = require('@vapi-ai/web');
  console.log('VAPI library loaded successfully');
} catch (error) {
  console.error('VAPI library error:', error);
}
```

## Error Log Analysis

### Common Error Messages:

1. **"Audio permission not granted"**
   - Solution: Grant microphone permissions in device settings

2. **"Missing VAPI configuration"**
   - Solution: Check VAPI keys in voice.tsx configuration

3. **"VAPI library not available"**
   - Solution: Install @vapi-ai/web package

4. **"Connection test failed"**
   - Solution: Check internet connection and VAPI service status

5. **"Recording timeout reached"**
   - Solution: Check audio input and VAPI processing

## Testing Checklist

- [ ] Audio permissions granted
- [ ] VAPI configuration valid
- [ ] Internet connection stable
- [ ] Microphone hardware working
- [ ] App.json properly configured
- [ ] Dependencies installed correctly
- [ ] Platform-specific settings correct

## Fallback Options

If VAPI recording fails, the app provides:
1. **Manual Input Form** - Direct transaction entry
2. **Simulated Processing** - Local voice processing for testing
3. **Error Recovery** - Retry mechanisms and user guidance

## Support

For additional help:
1. Check console logs for detailed error information
2. Run the debug script to identify specific issues
3. Verify all configuration settings
4. Test on different devices/platforms
