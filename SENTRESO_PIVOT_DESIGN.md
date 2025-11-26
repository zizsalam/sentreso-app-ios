# 🚀 Sentreso Pivot Design: AI Agent-Powered Financial Automation

## 📋 Executive Summary

This document outlines the architecture for pivoting Sentreso into an **AI agent** that autonomously discovers APIs, executes payments, and manages financial operations for West African SMEs. Sentreso's AI agents leverage **Orthogonal's infrastructure** to discover and pay for services programmatically, and **Wave APIs** for payment execution.

**Key Principles:**
- **Sentreso = AI Agent**: The app itself is an intelligent agent that acts on user's behalf
- **Autonomous Discovery**: Agent discovers payment APIs via Orthogonal without manual setup
- **Natural Interaction**: Users speak/type naturally; agent figures out what to do
- **Programmatic Value Flow**: Agent pays for APIs and executes payments automatically
- **Learning & Adaptation**: Agent learns from patterns and optimizes over time
- **Voice-First**: Maintain simple voice interface for all interactions

---

## 🤖 How Sentreso AI Agent Works

### **The Agent Lifecycle:**

1. **User Speaks Naturally**
   - "Payer 50,000 FCFA à Boulangerie ABC"
   - "Rembourser 5% des ventes pour le prêt MFI"

2. **Agent Understands Intent**
   - Extracts: action, amount, recipient
   - Determines: payment type, urgency, context

3. **Agent Discovers APIs (via Orthogonal)**
   - Queries Orthogonal network for payment APIs
   - Receives: Wave API, Orange Money API, MTN API, etc.
   - Each API includes: fees, success rates, speed

4. **Agent Selects Best API**
   - Compares fees, reliability, speed
   - Considers user preferences (from memory)
   - Chooses optimal option

5. **Agent Pays for API (via Orthogonal)**
   - Automatically pays API usage fee
   - No manual payment setup
   - Value flows programmatically

6. **Agent Executes Payment**
   - Calls selected API (e.g., Wave Payout)
   - Executes payment
   - Verifies success

7. **Agent Learns & Adapts**
   - Records experience
   - Learns patterns
   - Optimizes future decisions

### **Example Flow:**

```
User: "Payer 50,000 FCFA à Boulangerie ABC"

Agent internally:
1. Understands: pay supplier, 50k, Boulangerie ABC
2. Discovers APIs via Orthogonal:
   - Wave Payout: 0.5% fee, 99% success
   - Orange Money: 1% fee, 98% success
3. Selects: Wave (lower fee)
4. Pays API fee: 250 FCFA (via Orthogonal)
5. Executes: Wave Payout API call
6. Verifies: Transaction successful
7. Learns: "User pays Boulangerie ABC regularly"

Agent responds: "✅ J'ai payé 50,000 FCFA à Boulangerie ABC via Wave"
```

---

## 🏗️ App Architecture

### **Current Structure**
```
app/(tabs)/
  ├── index.tsx      (Home/Dashboard)
  ├── add.tsx        (Add Transaction)
  ├── voice.tsx      (Voice Recording)
  ├── analytics.tsx  (Financial Analytics)
  └── meeting.tsx    (GIE Meetings)
```

### **New Structure (Pivot - AI Agent Architecture)**
```
app/(tabs)/
  ├── index.tsx           (Home/Dashboard - Agent Status)
  ├── voice.tsx           (Primary Interface - Talk to Agent)
  ├── analytics.tsx       (Financial Analytics - Agent Insights)
  ├── meeting.tsx         (GIE Meetings)
  └── activity.tsx        (NEW: Agent Activity Log)

services/
  ├── aiAgent.ts          (NEW: Core AI Agent Engine)
  ├── orthogonalClient.ts (NEW: Orthogonal API Discovery)
  ├── waveApi.ts          (NEW: Wave Payment Execution)
  └── agentMemory.ts      (NEW: Agent Learning & Memory)
```

---

## 📱 Screen Designs

### **1. Enhanced Home Screen (`index.tsx`) - AI Agent Dashboard**

**New Sections Added:**

#### **A. AI Agent Status Card**
```typescript
// Shows what the agent is doing/has done
- "Agent actif ✅"
- "3 paiements exécutés aujourd'hui"
- "2 APIs découvertes cette semaine"
- Agent confidence score
- Last action timestamp
```

#### **B. Agent Activity Feed**
```typescript
// Real-time agent actions
- "Agent a payé 50,000 FCFA à Boulangerie ABC"
- "Agent a découvert une meilleure API pour remboursements"
- "Agent a optimisé le paiement fournisseur"
- "Agent suggère: rembourser prêt MFI maintenant"
```

#### **C. Smart Suggestions**
```typescript
// Agent recommendations
- "Tu as 150,000 FCFA de revenus. Agent suggère de payer fournisseur maintenant?"
- "Agent détecte: stock bas. Veux-tu que j'achète automatiquement?"
- "Agent propose: rembourser 5% des ventes aujourd'hui pour le prêt"
```

**Visual Hierarchy:**
1. Balance Card (existing)
2. Revenue/Expenses (existing)
3. **NEW: AI Agent Status Card**
4. **NEW: Agent Activity Feed**
5. **NEW: Smart Suggestions**
6. Recent Transactions (with agent badges)

---

### **2. Enhanced Voice Screen (`voice.tsx`) - Primary Agent Interface**

**Purpose:** Natural language interaction with AI agent

**Main Sections:**

#### **A. Voice Input (Enhanced)**
```typescript
// User speaks naturally, agent understands intent
Examples:
- "Payer 50,000 FCFA à Boulangerie ABC"
- "Rembourser le prêt MFI maintenant"
- "Quand le stock est bas, achète automatiquement"
- "Rembourse 5% des ventes chaque jour pour le prêt"
- "Trouve la meilleure API pour payer mes fournisseurs"
```

#### **B. Agent Response**
```typescript
// Agent responds with actions taken
- "✅ J'ai découvert l'API Wave Payout. Paiement de 50,000 FCFA exécuté."
- "✅ J'ai configuré le remboursement automatique: 5% des ventes quotidiennes"
- "✅ J'ai trouvé une meilleure API (taux plus bas). Migration en cours..."
- "❌ Erreur: Solde insuffisant. Agent suggère d'attendre demain."
```

#### **C. Agent Memory Display**
```typescript
// Shows what agent learned
- "Agent a appris: Tu paies Boulangerie ABC chaque lundi"
- "Agent a détecté un pattern: Revenus élevés le weekend"
- "Agent optimise: Paiements fournisseurs le matin (meilleur taux)"
```

#### **D. Agent Discovery Status**
```typescript
// Shows APIs agent discovered
- "APIs découvertes: Wave Payout, Orange Money API, MTN Mobile Money"
- "Agent compare les taux en temps réel"
- "Meilleure option: Wave Payout (0.5% vs 1% Orange)"
```

---

### **3. New: Agent Activity Screen (`activity.tsx`)**

**Purpose:** View all agent actions, discoveries, and learnings

**Main Sections:**

#### **A. Agent Actions Timeline**
```typescript
// Chronological log of agent actions
- "14:30 - Agent a payé 50,000 FCFA à Boulangerie ABC via Wave API"
- "14:25 - Agent a découvert API Wave Payout via Orthogonal"
- "14:20 - Agent a analysé les revenus: 150,000 FCFA aujourd'hui"
- "14:15 - Agent a suggéré: Payer fournisseur maintenant"
- "10:00 - Agent a remboursé 5% des ventes (7,500 FCFA) pour prêt MFI"
```

#### **B. API Discoveries**
```typescript
// APIs agent discovered via Orthogonal
interface DiscoveredAPI {
  id: string;
  name: string;
  provider: string;
  type: 'payment' | 'credit' | 'insurance';
  rate: number;
  discovered_at: string;
  used: boolean;
  success_rate: number;
}

// UI shows:
- List of discovered APIs
- Comparison (rates, fees)
- Which APIs agent is using
- Performance metrics
```

#### **C. Agent Learnings**
```typescript
// What agent learned from patterns
- "Agent a appris: Tu paies Boulangerie ABC chaque lundi matin"
- "Agent détecte: Revenus élevés le weekend → optimise remboursements"
- "Agent suggère: Payer fournisseurs le matin (meilleur taux)"
- "Agent a optimisé: Utilise Wave API (0.5% vs 1% Orange)"
```

#### **D. Agent Performance Metrics**
```typescript
// Agent effectiveness
- Total payments executed
- Success rate
- Money saved (vs manual)
- APIs discovered
- Average response time
- User satisfaction (thumbs up/down)
```

---

### **4. Enhanced Analytics Screen (`analytics.tsx`) - Agent Insights**

**Purpose:** Financial analytics enhanced with agent intelligence

**Main Sections:**

#### **A. Agent-Powered Insights**
```typescript
// AI-generated insights
- "Agent détecte: Tes revenus augmentent de 15% ce mois"
- "Agent suggère: Tu peux rembourser le prêt plus rapidement"
- "Agent optimise: Payer fournisseurs le lundi (meilleur taux)"
- "Agent prévoit: Cash flow positif dans 3 jours"
```

#### **B. Agent Recommendations**
```typescript
// Actionable recommendations
- "Agent recommande: Payer 4 fournisseurs maintenant (économise 2,000 FCFA)"
- "Agent suggère: Rembourser prêt MFI (évite pénalités)"
- "Agent propose: Attendre demain pour paiement (meilleur taux API)"
```

#### **C. Financial Health Score**
```typescript
// Agent-calculated health metrics
- Cash flow score
- Debt-to-income ratio
- Payment reliability score
- Growth trajectory
- Risk indicators
```

#### **D. Agent Performance Impact**
```typescript
// How agent improved finances
- Money saved via API optimization
- Time saved (automated payments)
- Error reduction
- Payment success rate improvement
```

---

## 🗄️ Data Models

### **1. Suppliers Table**
```sql
CREATE TABLE suppliers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id),
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  wave_account TEXT,  -- Wave phone number
  category TEXT CHECK (category IN ('wholesaler', 'distributor', 'service', 'other')),
  payment_method TEXT CHECK (payment_method IN ('wave', 'cash', 'bank')),
  total_owed NUMERIC DEFAULT 0,
  last_payment_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### **2. Loans Table**
```sql
CREATE TABLE loans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id),
  lender_name TEXT NOT NULL,
  lender_type TEXT CHECK (lender_type IN ('mfi', 'supplier', 'family', 'wave', 'other')),
  principal NUMERIC NOT NULL,
  outstanding_balance NUMERIC NOT NULL,
  interest_rate NUMERIC,
  repayment_type TEXT CHECK (repayment_type IN ('fixed', 'revenue_based', 'flexible')),
  repayment_frequency TEXT,  -- 'daily', 'weekly', 'monthly'
  next_payment_date TIMESTAMPTZ,
  auto_repayment_enabled BOOLEAN DEFAULT false,
  wave_account TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### **3. Agent Actions Table**
```sql
CREATE TABLE agent_actions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id),
  intent TEXT NOT NULL,  -- User's original request
  action_type TEXT CHECK (action_type IN ('supplier_payment', 'loan_repayment', 'bill_payment', 'discovery', 'optimization')),
  status TEXT CHECK (status IN ('pending', 'success', 'failed')) DEFAULT 'pending',

  -- API Discovery (JSONB)
  discovered_apis JSONB,  -- List of APIs agent discovered
  selected_api_id TEXT,   -- Which API agent chose
  api_fee_paid NUMERIC,   -- Fee agent paid for API usage

  -- Execution details (JSONB)
  execution_result JSONB,
  -- Example: {
  --   "amount": 50000,
  --   "recipient": "+221771234567",
  --   "transaction_id": "wave_tx_123",
  --   "api_used": "wave_payout",
  --   "execution_time_ms": 1200
  -- }

  -- Learning data
  user_feedback TEXT,  -- 'thumbs_up', 'thumbs_down', null
  learned_patterns JSONB,  -- What agent learned from this

  created_at TIMESTAMPTZ DEFAULT NOW(),
  executed_at TIMESTAMPTZ
);
```

### **4. Discovered APIs Table**
```sql
CREATE TABLE discovered_apis (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id),
  api_id TEXT NOT NULL,  -- API ID from Orthogonal
  api_name TEXT NOT NULL,
  provider TEXT NOT NULL,
  service_type TEXT CHECK (service_type IN ('payment', 'credit', 'insurance', 'other')),

  -- API Details (JSONB)
  api_details JSONB,
  -- Example: {
  --   "fee": 0.005,  -- 0.5%
  --   "min_fee": 100,
  --   "max_fee": 5000,
  --   "speed": "instant",
  --   "region": "west-africa",
  --   "currency": "XOF"
  -- }

  -- Usage stats
  times_used INTEGER DEFAULT 0,
  success_count INTEGER DEFAULT 0,
  failure_count INTEGER DEFAULT 0,
  total_amount_processed NUMERIC DEFAULT 0,

  -- Discovery metadata
  discovered_via TEXT DEFAULT 'orthogonal',  -- 'orthogonal', 'manual', 'recommendation'
  discovered_at TIMESTAMPTZ DEFAULT NOW(),
  last_used_at TIMESTAMPTZ,
  is_preferred BOOLEAN DEFAULT false  -- User/agent preference
);
```

### **5. Agent Memory Table**
```sql
CREATE TABLE agent_memory (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id),

  -- Memory type
  memory_type TEXT CHECK (memory_type IN ('pattern', 'preference', 'insight', 'optimization')),

  -- Memory content (JSONB)
  memory_data JSONB NOT NULL,
  -- Example patterns:
  -- {
  --   "type": "payment_frequency",
  --   "supplier": "Boulangerie ABC",
  --   "frequency": "weekly",
  --   "day_of_week": "monday",
  --   "average_amount": 50000,
  --   "confidence": 0.95
  -- }

  -- Learning metadata
  confidence_score NUMERIC DEFAULT 0.5,  -- 0-1
  evidence_count INTEGER DEFAULT 1,  -- How many times pattern observed
  last_observed TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### **6. Enhanced Transactions Table**
```sql
-- Add new columns to existing transactions table
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS agent_action_id UUID REFERENCES agent_actions(id);
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS supplier_id UUID REFERENCES suppliers(id);
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS loan_id UUID REFERENCES loans(id);
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS wave_transaction_id TEXT;
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS api_used TEXT;  -- Which API agent used
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS payment_status TEXT CHECK (payment_status IN ('pending', 'completed', 'failed'));
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS executed_by_agent BOOLEAN DEFAULT false;
```

---

## ⚙️ AI Agent Architecture

### **1. Core AI Agent Engine (`services/aiAgent.ts`)**

```typescript
// Sentreso AI Agent - Core Intelligence
export class SentresoAgent {
  private orthogonalClient: OrthogonalClient;
  private waveClient: WaveAPIClient;
  private memory: AgentMemory;

  // Main agent interface - processes user intent
  async processIntent(
    userInput: string,  // Voice or text input
    userId: string
  ): Promise<AgentResponse> {
    // 1. Understand intent (NLP)
    const intent = await this.understandIntent(userInput);

    // 2. Discover required APIs via Orthogonal
    const apis = await this.discoverAPIs(intent);

    // 3. Select best API (compare rates, fees)
    const selectedAPI = await this.selectBestAPI(apis, intent);

    // 4. Pay for API usage (via Orthogonal)
    await this.payForAPI(selectedAPI);

    // 5. Execute action (payment, loan repayment, etc.)
    const result = await this.executeAction(selectedAPI, intent);

    // 6. Learn from result
    await this.memory.recordExperience(intent, selectedAPI, result);

    return {
      success: true,
      message: `✅ Agent a exécuté: ${intent.action}`,
      transactionId: result.transactionId,
      apiUsed: selectedAPI.name
    };
  }

  // Understand user intent from natural language
  private async understandIntent(input: string): Promise<AgentIntent> {
    // Use LLM to extract:
    // - Action type (pay, repay, buy, etc.)
    // - Entity (supplier name, loan, etc.)
    // - Amount (if specified)
    // - Conditions (when, if, etc.)
  }

  // Discover APIs via Orthogonal
  private async discoverAPIs(intent: AgentIntent): Promise<DiscoveredAPI[]> {
    return await this.orthogonalClient.discover({
      service: intent.serviceType,  // 'payment', 'credit', etc.
      region: 'west-africa',
      currency: 'XOF'
    });
  }

  // Select best API based on rates, fees, reliability
  private async selectBestAPI(apis: DiscoveredAPI[], intent: AgentIntent): Promise<DiscoveredAPI> {
    // Compare:
    // - Transaction fees
    // - Success rate
    // - Speed
    // - User preferences (from memory)
    return apis.sort((a, b) => {
      // Optimize for lowest cost + highest reliability
      return (a.fee + a.failureCost) - (b.fee + b.failureCost);
    })[0];
  }

  // Pay for API usage via Orthogonal
  private async payForAPI(api: DiscoveredAPI): Promise<void> {
    // Agent automatically pays API fee
    // No user interaction needed
    await this.orthogonalClient.payForAPI(api.id, api.fee);
  }

  // Execute the actual action
  private async executeAction(api: DiscoveredAPI, intent: AgentIntent): Promise<ActionResult> {
    switch (intent.action) {
      case 'pay_supplier':
        return await this.executeSupplierPayment(api, intent);
      case 'repay_loan':
        return await this.executeLoanRepayment(api, intent);
      case 'pay_bill':
        return await this.executeBillPayment(api, intent);
      default:
        throw new Error('Unknown action');
    }
  }

  // Proactive agent actions (runs in background)
  async runProactiveChecks(userId: string): Promise<void> {
    // Agent checks:
    // - Low inventory → suggest/execute supplier payment
    // - Revenue threshold reached → execute pay-as-you-sell
    // - Loan payment due → execute repayment
    // - Better API available → suggest migration
  }
}
```

### **2. Orthogonal Client (`services/orthogonalClient.ts`)**

```typescript
// Orthogonal Protocol Client - API Discovery & Payment
export class OrthogonalClient {
  private apiKey: string;
  private networkUrl: string;

  // Discover APIs available for a service
  async discover(params: {
    service: string;  // 'payment', 'credit', 'insurance', etc.
    region?: string;
    currency?: string;
  }): Promise<DiscoveredAPI[]> {
    // Query Orthogonal network
    // Returns list of available APIs with:
    // - Provider name
    // - Fees/rates
    // - Success rate
    // - Speed
  }

  // Agent pays for API usage
  async payForAPI(apiId: string, amount: number): Promise<PaymentResult> {
    // Agent automatically pays API fee
    // Value flows programmatically
    // No manual payment setup needed
  }

  // Execute payment via discovered API
  async executePayment(
    apiId: string,
    params: PaymentParams
  ): Promise<TransactionResult> {
    // Agent uses discovered API
    // Payment executed automatically
  }

  // Compare APIs for best option
  async compareAPIs(apis: DiscoveredAPI[]): Promise<DiscoveredAPI> {
    // Agent compares:
    // - Fees
    // - Reliability
    // - Speed
    // - User preferences
    return bestAPI;
  }
}
```

### **3. Wave API Integration (`services/waveApi.ts`)**

```typescript
// Wave API client - Used when Wave is selected as best API
export class WaveAPIClient {
  private apiKey: string;
  private baseUrl: string;

  // Payout to Wave account (called by agent)
  async payout(params: {
    amount: number;
    recipient_phone: string;
    description?: string;
  }): Promise<WaveTransaction> {
    // Agent executes payment via Wave API
    // Returns transaction ID for tracking
  }

  // Check balance (agent checks before executing)
  async getBalance(): Promise<number> {
    // Agent verifies sufficient balance
  }

  // Get transaction status (agent verifies success)
  async getTransactionStatus(transactionId: string): Promise<WaveTransactionStatus> {
    // Agent confirms payment completed
  }
}
```

### **4. Agent Memory (`services/agentMemory.ts`)**

```typescript
// Agent Learning & Memory System
export class AgentMemory {
  // Record experience for learning
  async recordExperience(
    intent: AgentIntent,
    api: DiscoveredAPI,
    result: ActionResult
  ): Promise<void> {
    // Store:
    // - What user asked for
    // - Which API was used
    // - Success/failure
    // - User feedback (if any)
  }

  // Learn patterns
  async learnPatterns(userId: string): Promise<LearnedPattern[]> {
    // Analyze:
    // - Payment frequency
    // - Preferred suppliers
    // - Best times to pay
    // - Optimal API choices
  }

  // Get recommendations based on learned patterns
  async getRecommendations(userId: string): Promise<Recommendation[]> {
    // Suggest:
    // - When to pay suppliers
    // - Which APIs to use
    // - Optimal payment timing
  }

  // Remember user preferences
  async rememberPreference(
    userId: string,
    key: string,
    value: any
  ): Promise<void> {
    // Store user preferences:
    // - Preferred payment times
    // - Risk tolerance
    // - API preferences
  }
}
```

### **5. Background Agent Process**

```typescript
// Agent runs proactive checks in background
// Options:
// 1. Supabase Edge Functions (cron)
// 2. Cloud Functions (Firebase/Google Cloud)
// 3. In-app background tasks (React Native Background Jobs)

// Example: Supabase Edge Function
export async function runAgentProactiveChecks() {
  // Get all active users
  const users = await getActiveUsers();

  for (const user of users) {
    const agent = new SentresoAgent();

    // Agent proactively:
    // 1. Checks inventory levels
    // 2. Monitors revenue thresholds
    // 3. Checks loan payment due dates
    // 4. Discovers better APIs
    // 5. Suggests optimizations

    await agent.runProactiveChecks(user.id);
  }
}

// Agent decision-making examples:
async function checkInventoryAndPaySupplier(userId: string) {
  const agent = new SentresoAgent();
  const inventory = await getInventory(userId);

  if (inventory.stock < inventory.threshold) {
    // Agent discovers supplier payment APIs
    const apis = await agent.discoverAPIs({
      service: 'supplier_payment',
      supplier: inventory.supplier
    });

    // Agent selects best API
    const bestAPI = await agent.selectBestAPI(apis);

    // Agent pays API fee and executes payment
    await agent.processIntent(
      `Payer ${inventory.supplier} pour réapprovisionnement`,
      userId
    );
  }
}

async function checkRevenueAndRepayLoan(userId: string) {
  const agent = new SentresoAgent();
  const revenue = await getDailyRevenue(userId);
  const loans = await getActiveLoans(userId);

  for (const loan of loans) {
    if (loan.repayment_type === 'revenue_based') {
      const amount = revenue * (loan.percentage / 100);

      // Agent discovers loan repayment APIs
      const apis = await agent.discoverAPIs({
        service: 'loan_repayment',
        lender: loan.lender_name
      });

      // Agent executes repayment
      await agent.processIntent(
        `Rembourser ${amount} FCFA pour prêt ${loan.lender_name}`,
        userId
      );
    }
  }
}
```

---

## 🔄 User Flows (AI Agent Interactions)

### **Flow 1: User Requests Supplier Payment (Natural Language)**

```
1. User opens voice screen
2. User says: "Payer 50,000 FCFA à Boulangerie ABC"
3. Agent processes:
   a. Understands intent: pay supplier
   b. Discovers payment APIs via Orthogonal:
      - Wave Payout API (0.5% fee)
      - Orange Money API (1% fee)
      - MTN Mobile Money API (0.8% fee)
   c. Agent selects: Wave Payout (lowest fee)
   d. Agent pays API fee automatically (via Orthogonal)
   e. Agent executes payment via Wave API
4. Agent responds: "✅ J'ai payé 50,000 FCFA à Boulangerie ABC via Wave"
5. Transaction appears in history with "🤖 Agent" badge
6. Agent learns: "User pays Boulangerie ABC regularly"
```

### **Flow 2: Agent Proactively Repays Loan**

```
1. Agent runs background check (daily)
2. Agent detects:
   - Daily revenue: 150,000 FCFA
   - Active loan: MFI XYZ (5% revenue-based repayment)
   - Amount due: 7,500 FCFA
3. Agent discovers loan repayment APIs via Orthogonal
4. Agent selects best API (compares rates)
5. Agent pays API fee and executes repayment
6. User receives notification: "🤖 Agent a remboursé 7,500 FCFA pour prêt MFI XYZ"
7. Transaction appears with agent badge
8. Agent learns: "User prefers daily loan repayments"
```

### **Flow 3: Agent Discovers Better API & Optimizes**

```
1. Agent runs weekly optimization check
2. Agent discovers new API via Orthogonal:
   - New provider: "FastPay API" (0.3% fee vs Wave's 0.5%)
3. Agent compares:
   - FastPay: 0.3% fee, 98% success rate
   - Wave: 0.5% fee, 99% success rate
4. Agent suggests: "J'ai trouvé une meilleure API (FastPay, 0.3% vs 0.5%). Migrer?"
5. User approves (or agent auto-migrates if confidence high)
6. Agent switches to FastPay for future payments
7. Agent saves user money on each transaction
8. Agent learns: "User prefers cost optimization"
```

### **Flow 4: Pay-As-You-Sell (Agent Autonomous)**

```
1. User says: "Quand j'ai 150,000 FCFA de revenus, paie 40% à Distributeur ABC"
2. Agent understands:
   - Trigger: revenue threshold (150,000 FCFA)
   - Action: pay supplier (40% = 60,000 FCFA)
3. Agent monitors daily revenue
4. When threshold reached:
   a. Agent discovers payment APIs
   b. Agent selects best option
   c. Agent pays API fee
   d. Agent executes payment (60,000 FCFA)
5. User receives: "✅ Agent a payé 60,000 FCFA à Distributeur ABC (seuil atteint)"
6. Agent learns pattern for future optimizations
```

### **Flow 5: Agent Suggests Action Based on Patterns**

```
1. Agent analyzes user patterns:
   - User pays "Boulangerie ABC" every Monday
   - Current day: Monday
   - Stock level: Low
   - Balance: Sufficient
2. Agent proactively suggests:
   "🤖 Agent suggère: Payer Boulangerie ABC maintenant? (Tu paies habituellement le lundi)"
3. User confirms: "Oui"
4. Agent:
   a. Discovers APIs
   b. Selects best
   c. Pays fee
   d. Executes payment
5. Agent learns: "User appreciates proactive suggestions"
```

---

## 🎨 UX Principles

### **1. Progressive Disclosure**
- Basic users see simple interface
- Advanced features hidden behind "Mode Professionnel" toggle
- Automation features in separate tab (not cluttering home)

### **2. Voice-First Maintained**
- Users can still record transactions by voice
- New: "Payer fournisseur [nom]" voice command
- New: "Rembourser prêt [lender]" voice command

### **3. Visual Feedback**
- Automation status clearly visible
- Success/failure indicators
- Real-time updates when automation executes

### **4. Trust & Transparency**
- Show automation logs
- Allow manual override
- Clear error messages
- Wave transaction IDs for verification

---

## 🔌 Integration Points

### **1. Orthogonal Integration (Core - API Discovery & Payment)**

```typescript
// services/orthogonalClient.ts
export const orthogonal = {
  // Agent discovers payment APIs
  async discoverPaymentAPIs(service: string, region: string) {
    // Query Orthogonal network
    // Returns: Wave API, Orange Money API, MTN API, etc.
    // Each with: fees, success rates, speed
  },

  // Agent pays for API usage (programmatic value flow)
  async payForAPI(apiId: string, fee: number) {
    // Agent automatically pays API fee
    // No manual payment setup needed
    // Value flows like data
  },

  // Agent executes payment via discovered API
  async executePayment(apiId: string, params: PaymentParams) {
    // Agent uses discovered API
    // Payment executed automatically
    // Returns transaction result
  },

  // Agent compares APIs for optimization
  async compareAPIs(apis: DiscoveredAPI[]) {
    // Agent evaluates:
    // - Fees
    // - Reliability
    // - Speed
    // - User preferences
    return bestAPI;
  }
};
```

### **2. Wave API Integration (Execution Layer)**

```typescript
// services/waveApi.ts
// Used when Wave is selected as best API by agent
export const waveAPI = {
  // Payout endpoint (called by agent)
  async payout(amount: number, phone: string, description: string) {
    // Agent calls Wave Payout API
    // Store transaction ID
    // Return result
  },

  // Balance check (agent verifies before payment)
  async getBalance() {
    // Agent checks balance
    // Ensures sufficient funds
  },

  // Transaction status (agent verifies success)
  async getTransactionStatus(txId: string) {
    // Agent confirms payment completed
    // Updates transaction status
  }
};
```

### **3. Other Payment APIs (Discovered via Orthogonal)**

```typescript
// Agent can discover and use:
// - Orange Money API
// - MTN Mobile Money API
// - Bank APIs
// - Other payment providers

// All discovered via Orthogonal
// All paid for programmatically
// All executed by agent automatically
```

---

## 📊 Analytics & Reporting

### **New Analytics Sections:**

1. **Automation Performance**
   - Success rate
   - Total automated payments
   - Money saved vs manual
   - Error trends

2. **Supplier Analytics**
   - Top suppliers by volume
   - Payment frequency
   - Average payment amount
   - Payment trends

3. **Loan Analytics**
   - Repayment progress
   - Outstanding balances
   - Repayment velocity
   - Risk indicators

---

## 🚀 Implementation Roadmap

### **Phase 1: Foundation (Weeks 1-2)**
- [ ] Database schema migration
- [ ] Suppliers table & CRUD
- [ ] Loans table & CRUD
- [ ] Basic UI screens

### **Phase 2: Automation Engine (Weeks 3-4)**
- [ ] Automation rules table
- [ ] Trigger evaluators
- [ ] Action executors
- [ ] Background job scheduler

### **Phase 3: Wave Integration (Weeks 5-6)**
- [ ] Wave API client
- [ ] Payout integration
- [ ] Transaction status tracking
- [ ] Error handling

### **Phase 4: Advanced Features (Weeks 7-8)**
- [ ] Pay-as-you-sell automation
- [ ] Multi-supplier split payments
- [ ] Revenue-based loan repayments
- [ ] AI-optimized flexible repayments

### **Phase 5: Polish & Testing (Weeks 9-10)**
- [ ] UX improvements
- [ ] Error handling
- [ ] Analytics dashboard
- [ ] User testing

---

## 🔒 Security & Compliance

1. **Wave API Keys**: Store securely, never expose
2. **User Permissions**: Only user can manage their automations
3. **Transaction Verification**: Always verify Wave transaction status
4. **Error Recovery**: Retry logic for failed payments
5. **Audit Logs**: Track all automation executions

---

## 📝 Voice Commands (AI Agent Interface)

### **Natural Language Commands (Agent Understands):**

```
"Payer [nom fournisseur] [montant]"
→ Agent discovers APIs, pays fee, executes payment

"Rembourser prêt [lender] [montant]"
→ Agent finds best repayment API, executes

"Quand [condition], paie [montant] à [fournisseur]"
→ Agent sets up conditional payment, monitors, executes

"Rembourse [X]% des ventes pour le prêt [lender]"
→ Agent monitors revenue, executes daily repayments

"Trouve la meilleure API pour payer mes fournisseurs"
→ Agent discovers & compares APIs, suggests best

"Optimise mes paiements"
→ Agent analyzes patterns, suggests improvements

"Voir ce que l'agent a fait"
→ Shows agent activity log

"Agent, apprends que je paie [fournisseur] chaque lundi"
→ Agent records pattern for future use
```

### **Agent Proactive Communications:**

```
Agent: "🤖 J'ai détecté que ton stock est bas. Veux-tu que je paie le fournisseur maintenant?"

Agent: "🤖 J'ai trouvé une meilleure API (0.3% vs 0.5%). Migrer?"

Agent: "🤖 Tes revenus sont élevés aujourd'hui. Je suggère de rembourser le prêt maintenant."

Agent: "🤖 J'ai appris que tu paies Boulangerie ABC chaque lundi. Veux-tu que je le fasse automatiquement?"
```

---

## 🎯 Success Metrics

1. **Adoption**
   - % of users with at least 1 automation
   - Average automations per user
   - Automation execution frequency

2. **Performance**
   - Automation success rate (target: >95%)
   - Average time saved per user
   - Error rate

3. **Business Impact**
   - Total automated payments volume
   - User retention (automation users vs non-users)
   - Revenue from premium features

---

## 🔮 Future Enhancements

1. **Orthogonal Integration**
   - Auto-discover payment APIs
   - Compare rates across providers
   - Agent-driven payment optimization

2. **AI-Powered Insights**
   - Predict cash flow needs
   - Optimize payment timing
   - Suggest automation rules

3. **Multi-Currency Support**
   - Support XOF, NGN, GHS, etc.
   - Auto-conversion
   - Cross-border payments

4. **Supplier Network**
   - Connect with other Sentreso users
   - Shared supplier database
   - Trust scores

---

## 📚 Technical Stack

- **Frontend**: React Native (Expo)
- **Backend**: Supabase (PostgreSQL, Edge Functions)
- **Payment APIs**: Wave Mobile Money
- **Automation**: Background jobs (Supabase Cron / Cloud Functions)
- **Future**: Orthogonal protocol for API discovery

---

## 🎨 Design System

### **Colors**
- Primary: `#10B981` (Green - existing)
- Automation: `#6366F1` (Indigo - new)
- Warning: `#F59E0B` (Amber)
- Error: `#EF4444` (Red - existing)

### **Icons**
- Suppliers: `Truck` or `Package`
- Loans: `CreditCard` or `DollarSign`
- Automation: `Zap` or `Settings`
- Wave: `Wave` (custom)

---

## 📞 Support & Documentation

- In-app help center
- Video tutorials for automation setup
- FAQ section
- Customer support chat

---

**End of Design Document**
