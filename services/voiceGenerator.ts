/* eslint-disable no-console */
declare const Buffer: any;
declare const Deno: { env: { get(key: string): string | undefined } } | undefined;

const getEnv = (key: string): string | undefined => {
  if (typeof process !== 'undefined' && process.env?.[key]) {
    return process.env[key];
  }
  if (typeof Deno !== 'undefined' && typeof Deno.env?.get === 'function') {
    return Deno.env.get(key);
  }
  return undefined;
};

export type VoiceLanguage = 'wolof' | 'pulaar' | 'french';

export class VoiceGenerator {
  private readonly endpoint = getEnv('VOICE_TTS_ENDPOINT');
  private readonly apiKey = getEnv('VOICE_TTS_API_KEY');
  private readonly templateBase = getEnv('VOICE_TEMPLATE_BASE_URL');

  async generateVoice(text: string, language: VoiceLanguage): Promise<string> {
    if (this.endpoint && this.apiKey) {
      const response = await fetch(this.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({ text, language }),
      });

      if (!response.ok) {
        console.warn('Voice generation failed, falling back to text payload');
      } else {
        const data = await response.json();
        if (data.url) return data.url as string;
      }
    }

    return this.buildFallbackDataUrl(text, language);
  }

  async getTemplate(templateKey: string, language: VoiceLanguage): Promise<string> {
    if (!this.templateBase) {
      throw new Error('VOICE_TEMPLATE_BASE_URL not configured');
    }
    return `${this.templateBase}/${language}/${templateKey}.mp3`;
  }

  async personalizeTemplate(templateUrl: string, variables: Record<string, string>): Promise<string> {
    const query = new URLSearchParams(variables).toString();
    return `${templateUrl}?${query}`;
  }

  private buildFallbackDataUrl(text: string, language: VoiceLanguage): string {
    const payload = JSON.stringify({ text, language, generatedAt: new Date().toISOString() });
    const base64 = typeof btoa === 'function'
      ? btoa(payload)
      : Buffer.from(payload).toString('base64');
    return `data:application/json;base64,${base64}`;
  }
}
