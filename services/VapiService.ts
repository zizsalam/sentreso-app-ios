import { VoiceInput, VapiConfig } from '../types/receipt';
import { Platform, Alert } from 'react-native';
import * as Speech from 'expo-speech';
import * as FileSystem from 'expo-file-system';
import { Audio } from 'expo-av';


interface VoiceProcessingResult {
  type: 'income' | 'expense';
  items: Array<{
    name: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
  }>;
  total: number;
  category: string;
  description: string;
  confidence: number;
}

class VapiService {
  private static instance: VapiService | null = null;
  private config: VapiConfig;
  private isRecording = false;
  private currentTranscript = '';
  private onTranscriptCallback: ((transcript: string) => void) | null = null;
  private onResponseCallback: ((response: any) => void) | null = null;
  private onErrorCallback: ((error: any) => void) | null = null;
  private onInitializedCallback: ((initialized: boolean) => void) | null = null;
  private isInitialized = false;
  private recordingTimeout: NodeJS.Timeout | null = null;
  private recording: Audio.Recording | null = null;
  private audioPermissionGranted = false;

    private async checkIfSimulator(): Promise<boolean> {
    try {
      // Simple check for iOS simulator
      if (Platform.OS === 'ios' && __DEV__) {
        // In development mode on iOS, we'll assume it's a simulator if we can't detect otherwise
        // This is a fallback approach since expo-device might not be available
        console.log('📱 iOS development mode detected - may be simulator');
        return true;
      }
      return false;
    } catch (error) {
      console.log('📱 Could not determine if simulator, assuming real device');
      return false;
    }
  }

  private constructor(config: VapiConfig) {
    this.config = config;
    this.initializeService();
  }

  public static getInstance(config?: VapiConfig): VapiService {
    if (!VapiService.instance) {
      if (!config) {
        throw new Error('VapiService config is required for first initialization');
      }
      VapiService.instance = new VapiService(config);
    } else if (config) {
      // If instance exists but new config provided, reset it
      console.log('🔄 Resetting VAPI instance with new config');
      VapiService.resetInstance();
      VapiService.instance = new VapiService(config);
    }
    return VapiService.instance;
  }

  public static resetInstance(): void {
    VapiService.instance = null;
  }

  // New method to process text input directly (alternative to voice)
  public async processTextInput(text: string): Promise<void> {
    try {
      console.log('📝 Processing text input:', text);

      if (!text.trim()) {
        throw new Error('Empty text input');
      }

      // Simulate processing for text input
      console.log('🔍 Simulating text processing...');
      const simulatedResponse = this.parseVapiResponse(JSON.stringify({
        type: 'expense',
        items: [{ name: 'Transaction manuelle', quantity: 1, unitPrice: 0, totalPrice: 0 }],
        total: 0,
        category: 'divers',
        description: text,
        confidence: 0.8
      }));

      if (this.onTranscriptCallback) {
        this.onTranscriptCallback(text);
      }
      if (this.onResponseCallback) {
        this.onResponseCallback({
          content: JSON.stringify(simulatedResponse),
          transcript: text,
          type: 'assistant-response'
        });
      }

    } catch (error) {
      console.error('❌ Error processing text input:', error);
      if (this.onErrorCallback) {
        this.onErrorCallback(error);
      }
    }
  }

  // Real-time call integration (basic placeholder)
  async startCall(): Promise<void> {
    try {
      console.log('📞 Starting real-time Vapi call...');
      const response = await fetch('https://api.vapi.ai/call', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.privateKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          assistantId: this.config.assistantId,
          voice: true
        }),
      });
      const result = await response.json();
      console.log('✅ Vapi call started:', result);
      // TODO: For real-time audio, integrate with Vapi WebSocket/SDK here
      if (this.onTranscriptCallback) {
        this.onTranscriptCallback('Appel vocal démarré. Parlez de votre transaction.');
      }
      // Simulate assistant greeting
      setTimeout(() => {
        if (this.onTranscriptCallback) {
          this.onTranscriptCallback('Bonjour, je suis Awa de Sentreso. Quelle transaction souhaitez-vous enregistrer ?');
        }
      }, 1000);
    } catch (error) {
      console.error('❌ Error starting Vapi call:', error);
      if (this.onErrorCallback) {
        this.onErrorCallback(error);
      }
    }
  }

  async endCall(): Promise<void> {
    try {
      console.log('📞 Ending real-time Vapi call...');
      // TODO: End the call/session via Vapi API or WebSocket if needed
      if (this.onTranscriptCallback) {
        this.onTranscriptCallback('Appel vocal terminé.');
      }
    } catch (error) {
      console.error('❌ Error ending Vapi call:', error);
      if (this.onErrorCallback) {
        this.onErrorCallback(error);
      }
    }
  }

  private async initializeService(): Promise<void> {
    // Prevent multiple initializations
    if (this.isInitialized) {
      console.log('⚠️ VAPI service already initialized, skipping...');
      return;
    }

    try {
      console.log('🎤 Initializing VAPI service...');
      console.log('📱 Platform:', Platform.OS);
      console.log('🔑 VAPI Config:', {
        publicKey: this.config.publicKey ? '***' + this.config.publicKey.slice(-4) : 'missing',
        assistantId: this.config.assistantId ? '***' + this.config.assistantId.slice(-4) : 'missing',
        hasPrivateKey: !!this.config.privateKey
      });

      // Request audio permissions for mobile
      if (Platform.OS !== 'web') {
        console.log('🎤 Requesting audio permissions...');
        const { status } = await Audio.requestPermissionsAsync();
        this.audioPermissionGranted = status === 'granted';
        console.log('🎤 Audio permission status:', status);

        if (!this.audioPermissionGranted) {
          console.warn('⚠️ Audio permission not granted');
          Alert.alert(
            'Permission Requise',
            'L\'accès au microphone est nécessaire pour l\'enregistrement vocal.',
            [{ text: 'OK' }]
          );
        }

        // Configure audio mode for recording
        console.log('🎤 Configuring audio mode...');
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: true,
          playsInSilentModeIOS: true,
          staysActiveInBackground: false,
          shouldDuckAndroid: true,
        });
        console.log('✅ Audio mode configured successfully');
      }

      this.isInitialized = true;
      setTimeout(() => {
        if (this.onInitializedCallback) {
          this.onInitializedCallback(this.audioPermissionGranted || Platform.OS === 'web');
        }
      }, 500);

      console.log('✅ VAPI service initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize VAPI service:', error);
      console.error('❌ Error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        platform: Platform.OS
      });
      this.isInitialized = false;
      if (this.onInitializedCallback) {
        this.onInitializedCallback(false);
      }
    }
  }

  async startRecording(): Promise<void> {
    if (this.isRecording) {
      console.log('⚠️ Recording already in progress');
      return;
    }

    console.log('🎤 Starting VAPI voice recording...');
    console.log('📱 Platform:', Platform.OS);
    console.log('🔧 Service initialized:', this.isInitialized);
    console.log('🎤 Audio permission granted:', this.audioPermissionGranted);

    this.isRecording = true;
    this.currentTranscript = '';

    // Clear any existing timeout
    if (this.recordingTimeout) {
      clearTimeout(this.recordingTimeout);
    }

    // Set a maximum recording time of 30 seconds
    this.recordingTimeout = setTimeout(() => {
      if (this.isRecording) {
        console.log('⏰ Recording timeout reached, stopping...');
        this.stopRecording();
      }
    }, 30000) as unknown as NodeJS.Timeout;

    try {
      // Use real VAPI REST API for all platforms
      console.log('📱 Using real VAPI REST API...');
      await this.startMobileVapiRecording();
    } catch (error) {
      console.error('❌ Error starting VAPI recording:', error);
      console.error('❌ Error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        platform: Platform.OS,
        isInitialized: this.isInitialized,
        audioPermissionGranted: this.audioPermissionGranted
      });
      this.isRecording = false;
      if (this.onErrorCallback) {
        this.onErrorCallback(error);
      }
    }
  }



  private async startMobileVapiRecording(): Promise<void> {
    try {
      console.log('📱 Starting real VAPI voice recording...');
      console.log('🎤 Audio permission status:', this.audioPermissionGranted);

      if (!this.audioPermissionGranted) {
        throw new Error('Audio permission not granted');
      }

      // For iOS, we'll try a different approach that works better with Expo Go
      if (Platform.OS === 'ios') {
        console.log('📱 iOS device detected - using iOS-optimized recording');
      }

      // Record audio using Expo Audio
      await this.startMobileRecording();

      console.log('✅ Mobile recording started successfully - waiting for user to stop recording');

    } catch (error) {
      console.error('❌ Error starting real VAPI mobile recording:', error);
      throw error;
    }
  }

  private async startMobileRecording(): Promise<void> {
    try {
      console.log('📱 Starting mobile audio recording...');
      console.log('🎤 Audio permission status:', this.audioPermissionGranted);

      if (!this.audioPermissionGranted) {
        console.error('❌ Audio permission not granted');
        throw new Error('Audio permission not granted. Please grant microphone access in settings.');
      }

      // Check if recording is already in progress
      if (this.recording) {
        console.warn('⚠️ Recording already exists, stopping previous recording...');
        await this.recording.stopAndUnloadAsync();
        this.recording = null;
      }

      console.log('🎤 Creating new audio recording...');

      // Use iOS-optimized recording options
      let recordingOptions;

      if (Platform.OS === 'ios') {
        // For iOS, use LOW_QUALITY preset which is more reliable with Expo Go
        recordingOptions = Audio.RecordingOptionsPresets.LOW_QUALITY;
        console.log('📱 Using LOW_QUALITY preset for iOS compatibility');
      } else {
        recordingOptions = Audio.RecordingOptionsPresets.HIGH_QUALITY;
      }

      // Create a new recording with platform-specific options
      let recording;
      let retryCount = 0;
      const maxRetries = Platform.OS === 'ios' ? 3 : 1;

      while (retryCount < maxRetries) {
        try {
          console.log(`🎤 Attempt ${retryCount + 1} to create recording...`);

          const result = await Audio.Recording.createAsync(
            recordingOptions,
            (status) => {
              console.log('🎤 Recording status update:', status);
            },
            100 // Update interval in ms
          );

          recording = result.recording;
          console.log('✅ Mobile recording created successfully');
          break;

        } catch (error) {
          retryCount++;
          console.warn(`⚠️ Recording attempt ${retryCount} failed:`, error);



          if (retryCount >= maxRetries) {
            throw error;
          }

          // Wait a bit before retrying
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }

      this.recording = recording || null;
      console.log('✅ Mobile recording started successfully');
      console.log('🎤 Recording object created successfully');

        } catch (error) {
      console.error('❌ Error starting mobile recording:', error);
      console.error('❌ Error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        audioPermissionGranted: this.audioPermissionGranted,
        platform: Platform.OS
      });

      // If it's the iOS simulator error, provide helpful message
      if (error instanceof Error && error.message === 'iOS_SIMULATOR_NO_AUDIO') {
        console.log('📱 iOS Simulator detected - cannot record audio');
        console.log('💡 Please use a real device or the text input option');
        if (this.onErrorCallback) {
          this.onErrorCallback({
            code: 'IOS_SIMULATOR_NO_AUDIO',
            message: 'Voice recording is not available in iOS Simulator. Please use a real device or the text input option.',
            type: 'simulator_limitation'
          });
        }
        return;
      }

      throw error;
    }
  }

  async stopRecording(): Promise<void> {
    console.log('⏹️ Stopping VAPI recording');
    this.isRecording = false;

    if (this.recordingTimeout) {
      clearTimeout(this.recordingTimeout);
      this.recordingTimeout = null;
    }



    // Stop mobile recording if active
    if (this.recording) {
      await this.processMobileRecording();
    }
  }

  private async processMobileRecording(): Promise<void> {
    try {
      if (!this.recording) {
        console.log('⚠️ No recording to process');
        return;
      }

      console.log('⏹️ Processing mobile recording...');

      // Stop the recording and get the URI
      await this.recording.stopAndUnloadAsync();
      const uri = this.recording.getURI();
      this.recording = null;

      if (!uri) {
        throw new Error('No audio file generated');
      }

      console.log('🎵 Audio file saved:', uri);

      // Send to real VAPI REST API with the audio file
      await this.sendToVapiRestApi(uri);

    } catch (error) {
      console.error('❌ Error processing mobile recording:', error);
      if (this.onErrorCallback) {
        this.onErrorCallback(error);
      }
    }
  }



  private async sendToVapiRestApi(audioUri?: string): Promise<void> {
    try {
      console.log('🌐 Sending audio to VAPI REST API...');

      let finalAudioUri = audioUri;

      // If no audio URI provided, try to get it from the recording
      if (!finalAudioUri && this.recording) {
        await this.recording.stopAndUnloadAsync();
        const uri = this.recording.getURI();
        this.recording = null;
        if (uri) {
          finalAudioUri = uri;
        }
      }

      if (!finalAudioUri) {
        throw new Error('No audio file available');
      }

      console.log('🎵 Audio file ready for VAPI:', finalAudioUri);

      // Read the audio file as base64
      const audioBase64 = await FileSystem.readAsStringAsync(finalAudioUri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      // Prepare the request to VAPI REST API
      const requestBody = {
        audio: audioBase64,
        assistantId: this.config.assistantId
      };

      // Use only the correct endpoint and auth
      const response = await fetch('https://api.vapi.ai/transcriptions', {
            method: 'POST',
            headers: {
          'Authorization': `Bearer ${this.config.privateKey}`,
              'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
          });

      console.log('📡 VAPI /transcriptions response status:', response.status);

          if (response.ok) {
            const result = await response.json();
        console.log('✅ VAPI /transcriptions response:', result);
            // Process the response
            if (result.transcript) {
              this.currentTranscript = result.transcript;
              if (this.onTranscriptCallback) {
                this.onTranscriptCallback(result.transcript);
              }
            }
            if (result.response) {
              this.handleVapiResponse(result.response);
            }
        return;
          } else {
            const errorText = await response.text();
        console.error('❌ VAPI /transcriptions failed:', response.status, errorText);
        throw new Error(`VAPI API error: ${response.status} ${response.statusText} - ${errorText}`);
          }
    } catch (error) {
      console.error('❌ Error sending to VAPI /transcriptions:', error);
      throw error;
    }
  }



  private handleVapiResponse(response: any): void {
    try {
      // Parse the VAPI response and extract transaction data
      const responseText = response.content || response.message || '';
      const processedData = this.parseVapiResponse(responseText);

      if (this.onResponseCallback) {
        this.onResponseCallback({
          type: 'assistant-response',
          content: JSON.stringify(processedData),
          transcript: this.currentTranscript
        });
      }
    } catch (error) {
      console.error('Error processing VAPI response:', error);
      throw error;
    }
  }

  private showManualInputFallback(): void {
    console.log('📝 Showing manual input fallback...');

    if (this.onErrorCallback) {
      this.onErrorCallback({
        type: 'manual-input-required',
        message: 'Veuillez saisir manuellement votre transaction'
      });
    }
  }

  onTranscript(callback: (transcript: string) => void): void {
    this.onTranscriptCallback = callback;
  }

  onResponse(callback: (response: any) => void): void {
    this.onResponseCallback = callback;
  }

  onError(callback: (error: any) => void): void {
    this.onErrorCallback = callback;
  }

  onInitialized(callback: (initialized: boolean) => void): void {
    this.onInitializedCallback = callback;
  }

  clearCallbacks(): void {
    this.onTranscriptCallback = null;
    this.onResponseCallback = null;
    this.onErrorCallback = null;
    this.onInitializedCallback = null;
  }



  private parseVapiResponse(responseText: string): VoiceProcessingResult {
    try {
      // Try to parse JSON response from VAPI
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);

        return {
          type: parsed.type || 'expense',
          items: [{
            name: parsed.client || parsed.description || 'Transaction',
            quantity: 1,
            unitPrice: parsed.amount || 0,
            totalPrice: parsed.amount || 0,
          }],
          total: parsed.amount || 0,
          category: parsed.category || 'divers',
          description: parsed.description || this.currentTranscript,
          confidence: parsed.confidence || 0.8
        };
      }
    } catch (error) {
      console.error('Error parsing VAPI JSON response:', error);
    }

    // If VAPI response parsing fails, throw an error
    throw new Error('Failed to parse VAPI response');
  }
}

export default VapiService;
