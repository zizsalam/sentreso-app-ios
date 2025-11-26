import type { SupabaseClient } from '@supabase/supabase-js';
import { supabase } from './supabaseClient';
import type { Farmer } from './myagroGroups';

export type ReminderRule = {
  id: string;
  group_id: string;
  farmer_id?: string | null;
  type: 'weekly_savings' | 'payment_deadline' | 'encouragement' | 'training';
  frequency: 'weekly' | 'daily' | 'custom';
  days_before_deadline?: number | null;
  enabled: boolean;
  message_template?: string | null;
  language: 'wolof' | 'pulaar' | 'french';
  next_send_at?: string | null;
};

export type GeneratedReminder = {
  farmer: Farmer;
  textMessage: string;
  metadata: {
    ruleId: string;
    type: ReminderRule['type'];
    language: ReminderRule['language'];
  };
};

export type ReminderExecutionResult = {
  reminders: GeneratedReminder[];
};

export class ReminderEngine {
  constructor(private readonly db: SupabaseClient = supabase) {}

  async scheduleReminders(): Promise<void> {
    const { data: rules, error } = await this.db
      .from<ReminderRule>('reminder_rules')
      .select('*')
      .eq('enabled', true);

    if (error) {
      throw new Error(`scheduleReminders failed: ${error.message}`);
    }

    const now = Date.now();
    const updates = (rules || [])
      .map((rule) => ({ rule, nextSendAt: this.computeNextSendAt(rule, now) }))
      .filter(({ nextSendAt }) => !!nextSendAt && nextSendAt > now + 5 * 60 * 1000); // ensure at least 5 min in future

    await Promise.all(
      updates.map(async ({ rule, nextSendAt }) => {
        if (!nextSendAt) return;
        const { error: updateError } = await this.db
          .from('reminder_rules')
          .update({ next_send_at: new Date(nextSendAt).toISOString() })
          .eq('id', rule.id);
        if (updateError) {
          throw new Error(`Failed to update reminder ${rule.id}: ${updateError.message}`);
        }
      })
    );
  }

  async executeReminder(reminderId: string): Promise<ReminderExecutionResult> {
    const rule = await this.getRule(reminderId);
    const farmers = await this.resolveFarmers(rule);

    const reminders = farmers.map((farmer) => ({
      farmer,
      textMessage: this.generateMessage(rule, farmer),
      metadata: {
        ruleId: rule.id,
        type: rule.type,
        language: rule.language,
      },
    }));

    return { reminders };
  }

  async checkPaymentDeadlines(): Promise<GeneratedReminder[]> {
    const now = new Date();
    const targetDays = [7, 3, 1];
    const reminders: GeneratedReminder[] = [];

    for (const days of targetDays) {
      const start = new Date(now);
      start.setDate(now.getDate() + days);
      const end = new Date(start);
      end.setHours(23, 59, 59, 999);

      const { data, error } = await this.db
        .from<Farmer>('myagro_farmers')
        .select('*')
        .gte('payment_deadline', start.toISOString())
        .lte('payment_deadline', end.toISOString())
        .neq('payment_status', 'paid');

      if (error) {
        throw new Error(`checkPaymentDeadlines failed: ${error.message}`);
      }

      (data || []).forEach((farmer) => {
        reminders.push({
          farmer,
          textMessage: this.generateDeadlineAlert(farmer, days),
          metadata: {
            ruleId: 'deadline-auto',
            type: 'payment_deadline',
            language: farmer.language,
          },
        });
      });
    }

    return reminders;
  }

  private async getRule(reminderId: string): Promise<ReminderRule> {
    const { data, error } = await this.db
      .from<ReminderRule>('reminder_rules')
      .select('*')
      .eq('id', reminderId)
      .single();

    if (error) {
      throw new Error(`Reminder rule not found: ${error.message}`);
    }

    return data;
  }

  private async resolveFarmers(rule: ReminderRule): Promise<Farmer[]> {
    if (rule.farmer_id) {
      const { data, error } = await this.db
        .from<Farmer>('myagro_farmers')
        .select('*')
        .eq('id', rule.farmer_id)
        .maybeSingle();

      if (error) {
        throw new Error(`resolveFarmers failed: ${error.message}`);
      }

      return data ? [data] : [];
    }

    const { data, error } = await this.db
      .from<Farmer>('myagro_farmers')
      .select('*')
      .eq('group_id', rule.group_id);

    if (error) {
      throw new Error(`resolveFarmers failed: ${error.message}`);
    }

    return data || [];
  }

  private computeNextSendAt(rule: ReminderRule, now: number): number | null {
    const base = rule.next_send_at ? new Date(rule.next_send_at).getTime() : now;
    const increment = this.getFrequencyIncrement(rule.frequency);
    return increment ? base + increment : null;
  }

  private getFrequencyIncrement(frequency: ReminderRule['frequency']): number | null {
    switch (frequency) {
      case 'daily':
        return 24 * 60 * 60 * 1000;
      case 'weekly':
        return 7 * 24 * 60 * 60 * 1000;
      default:
        return null;
    }
  }

  private generateMessage(rule: ReminderRule, farmer: Farmer): string {
    if (rule.message_template) {
      return this.interpolateTemplate(rule.message_template, farmer);
    }

    switch (rule.type) {
      case 'weekly_savings':
        return `Bonjour ${farmer.name}. Pensez à économiser ${farmer.weekly_savings_target.toLocaleString('fr-FR')} FCFA cette semaine pour votre paquet ${farmer.package_type}.`;
      case 'encouragement':
        return `Bravo ${farmer.name}! Vous avez déjà économisé ${farmer.savings_progress.toLocaleString('fr-FR')} FCFA. Continuez ainsi.`;
      case 'training':
        return `Rappel formation: votre VE partage un conseil cette semaine pour le paquet ${farmer.package_type}.`;
      case 'payment_deadline':
      default:
        return this.generateDeadlineAlert(farmer, rule.days_before_deadline || 0);
    }
  }

  private generateDeadlineAlert(farmer: Farmer, days: number): string {
    const deadline = new Date(farmer.payment_deadline).toLocaleDateString('fr-FR');
    if (days <= 0) {
      return `${farmer.name}, votre paiement de ${farmer.package_cost.toLocaleString('fr-FR')} FCFA est dû aujourd'hui (${deadline}).`;
    }
    return `${farmer.name}, il reste ${days} jours avant la date limite (${deadline}). Il reste ${Math.max(farmer.package_cost - farmer.savings_progress, 0).toLocaleString('fr-FR')} FCFA à payer.`;
  }

  private interpolateTemplate(template: string, farmer: Farmer): string {
    return template
      .replaceAll('{{name}}', farmer.name)
      .replaceAll('{{package_type}}', farmer.package_type)
      .replaceAll('{{weekly_savings}}', farmer.weekly_savings_target.toLocaleString('fr-FR'))
      .replaceAll('{{savings_progress}}', farmer.savings_progress.toLocaleString('fr-FR'))
      .replaceAll('{{amount_remaining}}', Math.max(farmer.package_cost - farmer.savings_progress, 0).toLocaleString('fr-FR'))
      .replaceAll('{{deadline}}', new Date(farmer.payment_deadline).toLocaleDateString('fr-FR'));
  }
}
