import type { SupabaseClient } from '@supabase/supabase-js';
import { supabase } from './supabaseClient';
import type { Farmer } from './myagroGroups';

export type AgentIntent =
  | 'check_balance'
  | 'check_deadline'
  | 'confirm_receipt'
  | 'greeting'
  | 'ask_question'
  | 'unknown';

const INTENT_KEYWORDS: Record<AgentIntent, string[]> = {
  check_balance: ['solde', 'reste', 'combien', 'amount', 'balance'],
  check_deadline: ['date', 'deadline', 'échéance', 'quand', 'due'],
  confirm_receipt: ['ok', 'bien reçu', 'reçu', 'merci'],
  greeting: ['bonjour', 'salaam', 'hello'],
  ask_question: ['?', 'comment', 'pourquoi'],
  unknown: [],
};

export class AIAgentService {
  constructor(private readonly db: SupabaseClient = supabase) {}

  async understandIntent(message: string): Promise<AgentIntent> {
    const normalized = message.toLowerCase();

    for (const [intent, keywords] of Object.entries(INTENT_KEYWORDS)) {
      if (intent === 'unknown') continue;
      if (keywords.some((word) => normalized.includes(word))) {
        return intent as AgentIntent;
      }
    }

    return 'unknown';
  }

  async getFarmerContext(phone: string): Promise<Farmer | null> {
    const { data, error } = await this.db
      .from('myagro_farmers')
      .select('*')
      .eq('phone', phone)
      .maybeSingle();

    if (error) {
      throw new Error(`getFarmerContext failed: ${error.message}`);
    }

    return data ?? null;
  }

  async generateResponse(intent: AgentIntent, farmer: Farmer | null): Promise<string> {
    if (!farmer) {
      return "Nous n'avons pas trouvé votre dossier. Contactez votre VE.";
    }

    switch (intent) {
      case 'check_balance':
        return this.buildBalanceResponse(farmer);
      case 'check_deadline':
        return this.buildDeadlineResponse(farmer);
      case 'confirm_receipt':
        return 'Merci pour la confirmation. Continuez vos économies !';
      case 'greeting':
        return 'Bonjour ! Comment pouvons-nous vous aider ?';
      case 'ask_question':
        return 'Nous avons noté votre question. Votre VE vous contactera rapidement.';
      default:
        return 'Merci pour votre message. Votre VE vous répondra bientôt.';
    }
  }

  private buildBalanceResponse(farmer: Farmer): string {
    const remaining = Math.max(farmer.package_cost - farmer.savings_progress, 0);
    return `Il vous reste ${remaining.toLocaleString('fr-FR')} FCFA à payer pour votre paquet ${farmer.package_type}. Vous avez déjà épargné ${farmer.savings_progress.toLocaleString('fr-FR')} FCFA.`;
  }

  private buildDeadlineResponse(farmer: Farmer): string {
    const deadline = new Date(farmer.payment_deadline).toLocaleDateString('fr-FR');
    return `La date limite pour votre paquet ${farmer.package_type} est le ${deadline}. Continuez vos économies pour rester à jour.`;
  }
}
