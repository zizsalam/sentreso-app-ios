export interface VoiceInput {
  id: string;
  transcript: string;
  timestamp: Date;
  confidence: number;
}

export interface VapiConfig {
  publicKey: string;
  assistantId: string;
  privateKey: string;
}

export interface TransactionItem {
  name: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  unit?: string;
}

export interface ProcessedTransaction {
  type: 'income' | 'expense' | 'sale';
  items: TransactionItem[];
  total: number;
  category: string;
  description: string;
  confidence: number;
}
