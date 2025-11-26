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

export type SMSResult = {
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
  throw new Error('No base64 encoder available for SMSService');
}

export class SMSService {
  private readonly accountSid: string;
  private readonly authToken: string;
  private readonly fromNumber: string;

  constructor(config?: { accountSid?: string; authToken?: string; fromNumber?: string }) {
    this.accountSid = config?.accountSid || getEnv('TWILIO_ACCOUNT_SID') || '';
    this.authToken = config?.authToken || getEnv('TWILIO_AUTH_TOKEN') || '';
    this.fromNumber = config?.fromNumber || getEnv('TWILIO_SMS_NUMBER') || '';

    if (!this.accountSid || !this.authToken || !this.fromNumber) {
      console.warn('SMSService missing configuration.');
    }
  }

  async sendSMS(phone: string, body: string): Promise<SMSResult> {
    if (!this.accountSid || !this.authToken || !this.fromNumber) {
      return { success: false, error: 'Twilio credentials not configured' };
    }

    const payload = new URLSearchParams({
      From: this.fromNumber,
      To: phone,
      Body: body,
    });

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

    const data = await response.json();
    return { success: true, sid: data.sid };
  }
}
