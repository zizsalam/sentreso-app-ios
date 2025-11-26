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

const TWILIO_API_BASE = 'https://api.twilio.com/2010-04-01';

export type MessageResult = {
  success: boolean;
  sid?: string;
  error?: string;
};

function encodeBasicAuth(username: string, password: string) {
  if (typeof btoa === 'function') {
    return btoa(`${username}:${password}`);
  }
  if (typeof Buffer !== 'undefined') {
    return Buffer.from(`${username}:${password}`).toString('base64');
  }
  throw new Error('No base64 encoder available for WhatsAppService');
}

export class WhatsAppService {
  private readonly accountSid: string;
  private readonly authToken: string;
  private readonly fromNumber: string;

  constructor(config?: { accountSid?: string; authToken?: string; fromNumber?: string }) {
    this.accountSid = config?.accountSid || getEnv('TWILIO_ACCOUNT_SID') || '';
    this.authToken = config?.authToken || getEnv('TWILIO_AUTH_TOKEN') || '';
    this.fromNumber = config?.fromNumber || getEnv('TWILIO_WHATSAPP_NUMBER') || '';

    if (!this.accountSid || !this.authToken || !this.fromNumber) {
      console.warn('WhatsAppService missing configuration. Sending will fail until configured.');
    }
  }

  async sendVoiceMessage(toPhone: string, mediaUrl: string, caption?: string): Promise<MessageResult> {
    return this.sendTwilioMessage({ to: toPhone, mediaUrl, body: caption });
  }

  async sendTextMessage(toPhone: string, body: string): Promise<MessageResult> {
    return this.sendTwilioMessage({ to: toPhone, body });
  }

  private async sendTwilioMessage(params: { to: string; body?: string; mediaUrl?: string }): Promise<MessageResult> {
    if (!this.accountSid || !this.authToken || !this.fromNumber) {
      return { success: false, error: 'Twilio credentials not configured' };
    }

    const payload = new URLSearchParams({
      From: `whatsapp:${this.fromNumber}`,
      To: params.to.startsWith('whatsapp:') ? params.to : `whatsapp:${params.to}`,
    });

    if (params.body) payload.append('Body', params.body);
    if (params.mediaUrl) payload.append('MediaUrl', params.mediaUrl);

    const response = await fetch(`${TWILIO_API_BASE}/Accounts/${this.accountSid}/Messages.json`, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${encodeBasicAuth(this.accountSid, this.authToken)}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: payload.toString(),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return { success: false, error: errorText };
    }

    const body = await response.json();
    return { success: true, sid: body.sid };
  }
}
