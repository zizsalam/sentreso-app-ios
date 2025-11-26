# 🤖 Sentreso AI Agent Architecture Recommendation

## 📋 Executive Summary

**Recommended Approach: Hybrid Architecture**
- **WhatsApp-Only for Farmers** (end users)
- **Sentreso App for VEs** (management interface)
- **Shared Backend API** (powers both channels)

This hybrid approach maximizes reach, minimizes friction, and leverages existing infrastructure.

---

## 🎯 Analysis of Options

### **Option 1: WhatsApp-Only Operation** ❌ Not Recommended

**Pros:**
- ✅ Zero app download for farmers
- ✅ Universal reach (everyone has WhatsApp)
- ✅ Low literacy friendly
- ✅ No app store approval needed
- ✅ Lower development cost initially

**Cons:**
- ❌ Limited UI for complex management (VE needs)
- ❌ Harder to build rich dashboards
- ❌ WhatsApp Business API limitations
- ❌ Difficult to show analytics/visualizations
- ❌ No offline capability
- ❌ Limited file management (photos, lists)

**Verdict:** Good for farmers, insufficient for VEs who need management tools.

---

### **Option 2: Integrated with Sentreso App** ✅ **RECOMMENDED (Part 1)**

**Pros:**
- ✅ Reuse existing infrastructure (auth, database, UI patterns)
- ✅ Rich management interface for VEs
- ✅ Analytics and visualizations
- ✅ Photo upload for farmer lists
- ✅ Offline capability
- ✅ Already has user type system (merchant, GIE, can add VE)
- ✅ Existing voice recording infrastructure
- ✅ Can leverage existing transaction tracking

**Cons:**
- ❌ Requires app download for VEs
- ❌ App store approval process
- ❌ Not ideal for farmers (too complex)

**Verdict:** Perfect for VEs who need management tools. Not suitable for farmers.

---

### **Option 3: Embedded in myAgro App** ❌ Not Recommended

**Pros:**
- ✅ Direct integration with partner
- ✅ Branded experience

**Cons:**
- ❌ Requires myAgro to build/maintain
- ❌ Less control over roadmap
- ❌ Dependency on partner's priorities
- ❌ Can't use for other clients
- ❌ myAgro may not want to add this complexity

**Verdict:** Too many dependencies, limits flexibility.

---

### **Option 4: Standalone API Service** ⚠️ Partial Solution

**Pros:**
- ✅ Can be used by multiple clients
- ✅ Flexible integration options
- ✅ Reusable across projects

**Cons:**
- ❌ Still need client apps/interfaces
- ❌ Doesn't solve the "where to build UI" question
- ❌ More complex architecture

**Verdict:** Good backend approach, but still need frontend strategy.

---

## ✅ **RECOMMENDED: Hybrid Architecture**

### **Architecture Overview**

```
┌─────────────────────────────────────────────────────────────┐
│                    Shared Backend API                        │
│  (Supabase + Edge Functions + WhatsApp Service + AI Agent)   │
└─────────────────────────────────────────────────────────────┘
         │                              │
         │                              │
    ┌────▼────┐                    ┌────▼────┐
    │         │                    │         │
    │ Farmers │                    │   VEs   │
    │         │                    │         │
    │WhatsApp │                    │ Sentreso│
    │  Bot    │                    │   App   │
    │         │                    │         │
    └─────────┘                    └─────────┘
```

### **How It Works**

#### **1. For Farmers (WhatsApp-Only)**

**Experience:**
- Farmer receives WhatsApp link: "Welcome to your myAgro payment assistant"
- No app download needed
- Everything happens in WhatsApp

**Capabilities:**
- ✅ Receive payment reminders (voice messages)
- ✅ Answer questions: "How much do I owe?" → Agent responds via WhatsApp
- ✅ Confirm receipt: Reply "OK" to reminders
- ✅ Check progress: "What's my savings progress?" → Agent responds
- ✅ Receive deadline alerts

**Technical:**
- WhatsApp Business API (Twilio or Meta)
- AI Agent processes natural language
- Backend API handles logic
- Voice messages via TTS (Wolof, Pulaar)

---

#### **2. For VEs (Sentreso App)**

**Experience:**
- VE downloads Sentreso app (one-time)
- Logs in with existing account
- Sees new "VE Mode" with farmer management tools

**Capabilities:**
- ✅ Create farmer groups
- ✅ Add farmers (text, voice, photo upload)
- ✅ Set reminder schedules ("Send reminders every Wednesday at 7 pm")
- ✅ View farmer lists and progress
- ✅ Send group voice messages
- ✅ Track reminder delivery status
- ✅ Analytics dashboard (who's behind, who's on track)
- ✅ Export reports

**Technical:**
- Extend existing Sentreso app
- Add `userType: 'VE'` to UserContext
- New tabs: `groups.tsx`, `reminders.tsx`, `messages.tsx`
- Reuse existing patterns (GIE mode as reference)
- Same backend API as WhatsApp bot

---

#### **3. Shared Backend (API Layer)**

**Services:**
- `aiAgentService.ts` - Core AI logic (intent understanding, responses)
- `whatsappService.ts` - WhatsApp message sending
- `reminderEngine.ts` - Scheduling and execution
- `farmerGroupsService.ts` - Group/farmer management
- `voiceGenerator.ts` - TTS for local languages

**Database:**
- Same Supabase database
- Tables: `myagro_groups`, `myagro_farmers`, `reminder_rules`, `sent_messages`
- Shared with Sentreso app

**Edge Functions:**
- Background jobs (daily reminder checks)
- WhatsApp webhook handlers
- Voice message generation

---

## 🎯 Why This Hybrid Approach Works

### **1. Maximizes Reach**
- **Farmers:** No barrier to entry (WhatsApp)
- **VEs:** Rich management tools (app)

### **2. Right Tool for Right User**
- **Farmers:** Simple, voice-first, no learning curve
- **VEs:** Powerful management, analytics, bulk operations

### **3. Leverages Existing Infrastructure**
- Reuse Sentreso app codebase
- Reuse Supabase database
- Reuse authentication
- Reuse UI patterns (GIE mode as template)

### **4. Cost Effective**
- Single backend to maintain
- WhatsApp costs only for farmers (who need it)
- App development amortized across all Sentreso features

### **5. Scalable**
- Can add more channels later (SMS, Telegram)
- Can add more client apps (web dashboard, partner apps)
- Backend API is channel-agnostic

---

## 🏗️ Implementation Strategy

### **Phase 1: Backend API (Week 1-2)**
- [ ] Database schema (groups, farmers, reminders)
- [ ] AI Agent service (intent understanding)
- [ ] WhatsApp service integration
- [ ] Reminder engine
- [ ] Edge functions for background jobs

### **Phase 2: WhatsApp Bot (Week 3-4)**
- [ ] WhatsApp Business API setup
- [ ] Natural language processing
- [ ] Voice message generation (TTS)
- [ ] Webhook handlers
- [ ] Testing with farmers

### **Phase 3: Sentreso App Integration (Week 5-6)**
- [ ] Add `userType: 'VE'` to UserContext
- [ ] Create VE onboarding flow
- [ ] Build Groups screen
- [ ] Build Reminders screen
- [ ] Build Messages screen
- [ ] Reuse existing UI patterns

### **Phase 4: Connect Both Channels (Week 7-8)**
- [ ] Ensure WhatsApp bot uses same API
- [ ] Test end-to-end flows
- [ ] Analytics dashboard
- [ ] User testing

---

## 📊 Comparison Matrix

| Feature | WhatsApp-Only | Sentreso App | Hybrid (Recommended) |
|---------|--------------|--------------|---------------------|
| **Farmer Reach** | ✅ 100% | ❌ ~30% (app download) | ✅ 100% (WhatsApp) |
| **VE Management** | ❌ Limited | ✅ Full featured | ✅ Full featured |
| **Development Cost** | Low | Medium | Medium (shared backend) |
| **Maintenance** | Medium | Medium | Low (single backend) |
| **Analytics** | ❌ Limited | ✅ Rich | ✅ Rich (for VEs) |
| **Offline Support** | ❌ No | ✅ Yes | ✅ Yes (for VEs) |
| **Photo Upload** | ⚠️ Limited | ✅ Full | ✅ Full (for VEs) |
| **Voice Messages** | ✅ Native | ✅ Via app | ✅ Both channels |
| **Scalability** | ⚠️ WhatsApp limits | ✅ Unlimited | ✅ Unlimited |

---

## 🎯 User Journeys

### **Farmer Journey (WhatsApp)**
```
1. VE adds farmer to group (via Sentreso app)
2. Farmer receives WhatsApp: "Welcome! You're enrolled in poultry package"
3. Weekly: Farmer receives voice reminder via WhatsApp
4. Farmer asks: "How much do I owe?" → Agent responds via WhatsApp
5. Farmer confirms: Replies "OK" → System updates
6. Deadline: Farmer receives alert → Agent responds with progress
```

### **VE Journey (Sentreso App)**
```
1. VE opens Sentreso app
2. Switches to "VE Mode" (or selects during onboarding)
3. Creates group: "Village of Ngohé"
4. Adds farmers:
   - Text input
   - Voice: "Add Awa Diallo, phone 771234567, poultry package, 25000 FCFA"
   - Photo: Upload list → AI extracts farmers
5. Sets reminders: "Send weekly reminders every Wednesday at 7 pm"
6. Views dashboard: See who's behind, who's on track
7. Sends group message: Records voice → Sends to all farmers
8. Tracks delivery: See who received/confirmed messages
```

---

## 🔄 Alternative: Progressive Enhancement

If you want to start simpler, consider this progression:

### **Stage 1: WhatsApp-Only MVP** (2-3 weeks)
- Build WhatsApp bot for farmers
- Simple reminder system
- Basic Q&A
- Manual VE management (via WhatsApp too, or simple web form)

### **Stage 2: Add Sentreso App** (3-4 weeks)
- Build VE management in Sentreso app
- Connect to same backend
- Rich analytics and dashboards

### **Stage 3: Enhance Both** (ongoing)
- Add more AI capabilities
- Add more channels (SMS fallback)
- Add more features

**This allows you to:**
- Launch faster (WhatsApp bot first)
- Validate with farmers
- Then add management tools for VEs

---

## 💡 Final Recommendation

**Go with Hybrid Architecture:**
1. **WhatsApp-Only for Farmers** - Maximum reach, zero friction
2. **Sentreso App for VEs** - Rich management, reuse existing code
3. **Shared Backend API** - Single source of truth, cost effective

**Start with:**
- Phase 1: Backend API + WhatsApp bot (MVP for farmers)
- Phase 2: Add Sentreso app integration (VE management)

This gives you:
- ✅ Fast time to market (WhatsApp bot is quick)
- ✅ Maximum farmer reach
- ✅ Powerful VE tools
- ✅ Reusable infrastructure
- ✅ Scalable architecture

---

## 🚀 Next Steps

1. **Decide on WhatsApp provider** (Twilio vs Meta Business API)
2. **Design database schema** (reuse MYAGRO_REMINDER_SYSTEM.md)
3. **Build backend API** (AI Agent service, reminder engine)
4. **Build WhatsApp bot** (natural language, voice messages)
5. **Extend Sentreso app** (add VE mode, reuse GIE patterns)
6. **Test end-to-end** (farmer via WhatsApp, VE via app)

---

## 📋 Detailed Implementation Plan

### **Phase 1: Backend API Foundation (Week 1-2)**

#### **Task 1.1: Database Schema Setup**
**Files:** `supabase/migrations/YYYYMMDD_myagro_schema.sql`

**Actions:**
- [ ] Create `myagro_groups` table
- [ ] Create `myagro_farmers` table
- [ ] Create `reminder_rules` table
- [ ] Create `sent_messages` table
- [ ] Add RLS policies (VEs can only access their own groups)
- [ ] Create indexes on foreign keys and frequently queried columns
- [ ] Add triggers for `updated_at` timestamps

**SQL Schema:**
```sql
-- Groups table
CREATE TABLE myagro_groups (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ve_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  village TEXT NOT NULL,
  language TEXT CHECK (language IN ('wolof', 'pulaar', 'french')) DEFAULT 'wolof',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Farmers table
CREATE TABLE myagro_farmers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  group_id UUID REFERENCES myagro_groups(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  package_type TEXT CHECK (package_type IN ('poultry', 'seed', 'fertilizer', 'other')),
  package_cost NUMERIC NOT NULL,
  payment_deadline TIMESTAMPTZ NOT NULL,
  weekly_savings_target NUMERIC NOT NULL,
  language TEXT CHECK (language IN ('wolof', 'pulaar', 'french')),
  savings_progress NUMERIC DEFAULT 0,
  payment_status TEXT CHECK (payment_status IN ('pending', 'on_track', 'behind', 'paid')) DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Reminder rules table
CREATE TABLE reminder_rules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  group_id UUID REFERENCES myagro_groups(id) ON DELETE CASCADE,
  farmer_id UUID REFERENCES myagro_farmers(id) ON DELETE CASCADE,
  type TEXT CHECK (type IN ('weekly_savings', 'payment_deadline', 'encouragement', 'training')),
  frequency TEXT CHECK (frequency IN ('weekly', 'daily', 'custom')),
  days_before_deadline INTEGER,
  enabled BOOLEAN DEFAULT true,
  message_template TEXT,
  language TEXT CHECK (language IN ('wolof', 'pulaar', 'french')),
  next_send_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Sent messages table
CREATE TABLE sent_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  group_id UUID REFERENCES myagro_groups(id) ON DELETE CASCADE,
  farmer_id UUID REFERENCES myagro_farmers(id) ON DELETE CASCADE,
  reminder_rule_id UUID REFERENCES reminder_rules(id) ON DELETE SET NULL,
  type TEXT CHECK (type IN ('reminder', 'manual', 'group_voice')),
  channel TEXT CHECK (channel IN ('whatsapp', 'sms')),
  content TEXT,
  voice_url TEXT,
  status TEXT CHECK (status IN ('sent', 'delivered', 'read', 'failed')) DEFAULT 'sent',
  farmer_confirmed BOOLEAN DEFAULT false,
  confirmation_method TEXT,
  sent_at TIMESTAMPTZ DEFAULT NOW(),
  delivered_at TIMESTAMPTZ,
  confirmed_at TIMESTAMPTZ,
  error_message TEXT
);

-- RLS Policies
ALTER TABLE myagro_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE myagro_farmers ENABLE ROW LEVEL SECURITY;
ALTER TABLE reminder_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE sent_messages ENABLE ROW LEVEL SECURITY;

-- VEs can only access their own groups
CREATE POLICY "VEs can view own groups" ON myagro_groups
  FOR SELECT USING (auth.uid() = ve_id);

CREATE POLICY "VEs can create own groups" ON myagro_groups
  FOR INSERT WITH CHECK (auth.uid() = ve_id);

CREATE POLICY "VEs can update own groups" ON myagro_groups
  FOR UPDATE USING (auth.uid() = ve_id);

-- Similar policies for farmers, reminder_rules, sent_messages
```

**Dependencies:** None
**Testing:** Run migration, verify tables created, test RLS policies

---

#### **Task 1.2: Core Services - Group Management**
**Files:** `services/myagroGroups.ts`

**Actions:**
- [ ] Create `MyAgroGroupsService` class
- [ ] Implement `createGroup(data)` method
- [ ] Implement `getGroups(veId)` method
- [ ] Implement `getGroup(groupId)` with farmers
- [ ] Implement `updateGroup(groupId, data)` method
- [ ] Implement `deleteGroup(groupId)` method
- [ ] Implement `addFarmer(groupId, data)` method
- [ ] Implement `updateFarmer(farmerId, data)` method
- [ ] Implement `deleteFarmer(farmerId)` method
- [ ] Implement `updateSavingsProgress(farmerId, amount)` method
- [ ] Implement `markPaymentPaid(farmerId)` method

**Code Structure:**
```typescript
// services/myagroGroups.ts
import { supabase } from './supabaseClient';

export interface FarmerGroup {
  id: string;
  ve_id: string;
  name: string;
  village: string;
  language: 'wolof' | 'pulaar' | 'french';
  created_at: string;
  updated_at: string;
}

export interface Farmer {
  id: string;
  group_id: string;
  name: string;
  phone: string;
  package_type: 'poultry' | 'seed' | 'fertilizer' | 'other';
  package_cost: number;
  payment_deadline: string;
  weekly_savings_target: number;
  language: 'wolof' | 'pulaar' | 'french';
  savings_progress: number;
  payment_status: 'pending' | 'on_track' | 'behind' | 'paid';
  created_at: string;
  updated_at: string;
}

export class MyAgroGroupsService {
  async createGroup(data: {
    name: string;
    village: string;
    language: 'wolof' | 'pulaar' | 'french';
  }): Promise<FarmerGroup> {
    // Implementation
  }

  async getGroups(veId: string): Promise<FarmerGroup[]> {
    // Implementation
  }

  async getGroup(groupId: string): Promise<FarmerGroup & { farmers: Farmer[] }> {
    // Implementation
  }

  async addFarmer(groupId: string, data: {
    name: string;
    phone: string;
    package_type: string;
    package_cost: number;
    payment_deadline: string;
    weekly_savings_target: number;
    language?: string;
  }): Promise<Farmer> {
    // Implementation
  }

  // ... other methods
}
```

**Dependencies:** Task 1.1 (database schema)
**Testing:** Unit tests for each method, test error handling

---

#### **Task 1.3: AI Agent Service Foundation**
**Files:** `services/aiAgentService.ts`

**Actions:**
- [ ] Create `AIAgentService` class
- [ ] Implement `understandIntent(message)` - classify user intent
- [ ] Implement `generateResponse(intent, context)` - generate appropriate response
- [ ] Add intent types: `check_balance`, `check_deadline`, `confirm_receipt`, `ask_question`
- [ ] Implement context retrieval (farmer data, payment status)
- [ ] Add response templates in French/Wolof/Pulaar

**Code Structure:**
```typescript
// services/aiAgentService.ts
export type Intent =
  | 'check_balance'
  | 'check_deadline'
  | 'confirm_receipt'
  | 'ask_question'
  | 'greeting'
  | 'unknown';

export interface AgentContext {
  farmerId?: string;
  farmerName?: string;
  phone?: string;
  packageType?: string;
  savingsProgress?: number;
  packageCost?: number;
  paymentDeadline?: string;
  daysUntilDeadline?: number;
}

export class AIAgentService {
  async understandIntent(message: string, language?: string): Promise<Intent> {
    // Simple keyword matching initially
    // Can be enhanced with LLM later
  }

  async generateResponse(
    intent: Intent,
    context: AgentContext,
    language: 'wolof' | 'pulaar' | 'french' = 'french'
  ): Promise<string> {
    // Generate personalized response based on intent and context
  }

  async getFarmerContext(phone: string): Promise<AgentContext | null> {
    // Retrieve farmer data from database
  }
}
```

**Dependencies:** Task 1.1 (database schema)
**Testing:** Test intent recognition, test response generation for each intent

---

#### **Task 1.4: Reminder Engine Core**
**Files:** `services/reminderEngine.ts`

**Actions:**
- [ ] Create `ReminderEngine` class
- [ ] Implement `scheduleReminders()` - calculate next send times
- [ ] Implement `executeReminder(reminderId)` - send reminder
- [ ] Implement `checkPaymentDeadlines()` - find upcoming deadlines
- [ ] Implement `generateMessage(rule, farmer)` - create personalized message
- [ ] Add reminder rule CRUD operations

**Code Structure:**
```typescript
// services/reminderEngine.ts
export interface ReminderRule {
  id: string;
  group_id: string;
  farmer_id?: string;
  type: 'weekly_savings' | 'payment_deadline' | 'encouragement' | 'training';
  frequency: 'weekly' | 'daily' | 'custom';
  days_before_deadline?: number;
  enabled: boolean;
  message_template?: string;
  language: 'wolof' | 'pulaar' | 'french';
  next_send_at?: string;
}

export class ReminderEngine {
  async scheduleReminders(): Promise<void> {
    // Get all active reminder rules
    // Calculate next_send_at based on frequency
    // Update reminder_rules table
  }

  async executeReminder(reminderId: string): Promise<void> {
    // Get reminder rule
    // Get farmer(s) to send to
    // Generate message
    // Send via WhatsApp (or SMS fallback)
    // Record in sent_messages
  }

  async checkPaymentDeadlines(): Promise<void> {
    // Find farmers with deadlines in 7, 3, 1 days
    // Create/execute payment deadline reminders
  }

  private generateMessage(
    rule: ReminderRule,
    farmer: Farmer
  ): { text: string; variables: Record<string, string> } {
    // Generate personalized message with variables
  }
}
```

**Dependencies:** Task 1.1, Task 1.2
**Testing:** Test scheduling logic, test message generation, test deadline detection

---

### **Phase 2: WhatsApp Bot Integration (Week 3-4)**

#### **Task 2.1: WhatsApp Service Setup**
**Files:** `services/whatsappService.ts`

**Actions:**
- [ ] Choose WhatsApp provider (Twilio recommended for MVP)
- [ ] Set up Twilio account and get credentials
- [ ] Create `WhatsAppService` class
- [ ] Implement `sendVoiceMessage(phone, voiceUrl, caption)` method
- [ ] Implement `sendTextMessage(phone, message)` method
- [ ] Implement `checkDeliveryStatus(messageId)` method
- [ ] Add error handling and retry logic
- [ ] Store Twilio credentials in Supabase secrets

**Code Structure:**
```typescript
// services/whatsappService.ts
import twilio from 'twilio';

export interface MessageResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

export class WhatsAppService {
  private client: twilio.Twilio;

  constructor() {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    this.client = twilio(accountSid, authToken);
  }

  async sendVoiceMessage(
    phone: string,
    voiceUrl: string,
    caption?: string
  ): Promise<MessageResult> {
    try {
      const message = await this.client.messages.create({
        from: `whatsapp:${process.env.TWILIO_WHATSAPP_NUMBER}`,
        to: `whatsapp:${phone}`,
        mediaUrl: [voiceUrl],
        body: caption || '',
      });
      return { success: true, messageId: message.sid };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async sendTextMessage(phone: string, message: string): Promise<MessageResult> {
    // Implementation
  }

  async checkDeliveryStatus(messageId: string): Promise<string> {
    // Implementation
  }
}
```

**Dependencies:** None (external service)
**Testing:** Test sending messages, test error handling, verify delivery

---

#### **Task 2.2: WhatsApp Webhook Handler**
**Files:** `supabase/functions/whatsapp-webhook/index.ts`

**Actions:**
- [ ] Create Supabase Edge Function for WhatsApp webhook
- [ ] Implement webhook endpoint to receive incoming messages
- [ ] Parse incoming message (text, voice, confirmation)
- [ ] Route to AI Agent service
- [ ] Send response back via WhatsApp
- [ ] Update `sent_messages` table with confirmations
- [ ] Configure webhook URL in Twilio dashboard

**Code Structure:**
```typescript
// supabase/functions/whatsapp-webhook/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

serve(async (req) => {
  const { message, from, type } = await req.json();

  // Get farmer context
  const farmer = await getFarmerByPhone(from);

  // Understand intent
  const intent = await aiAgent.understandIntent(message);

  // Generate response
  const response = await aiAgent.generateResponse(intent, farmer);

  // Send response
  await whatsappService.sendTextMessage(from, response);

  // Update confirmation if needed
  if (intent === 'confirm_receipt') {
    await updateMessageConfirmation(farmer.id);
  }

  return new Response(JSON.stringify({ success: true }), {
    headers: { 'Content-Type': 'application/json' },
  });
});
```

**Dependencies:** Task 1.3 (AI Agent), Task 2.1 (WhatsApp Service)
**Testing:** Test webhook with sample messages, test intent routing, test confirmations

---

#### **Task 2.3: Voice Message Generation**
**Files:** `services/voiceGenerator.ts`

**Actions:**
- [ ] Create `VoiceGenerator` class
- [ ] Research TTS options (Google TTS, Azure TTS, or pre-recorded templates)
- [ ] Implement `generateVoice(text, language)` method
- [ ] Implement `getTemplate(templateType, language)` method
- [ ] Implement `personalizeTemplate(templateUrl, variables)` method
- [ ] Set up cloud storage for voice files (Supabase Storage)
- [ ] Add caching for generated voices

**Code Structure:**
```typescript
// services/voiceGenerator.ts
export class VoiceGenerator {
  async generateVoice(
    text: string,
    language: 'wolof' | 'pulaar' | 'french'
  ): Promise<string> {
    // Use TTS service or return pre-recorded template URL
    // Store in Supabase Storage
    // Return public URL
  }

  async getTemplate(
    templateType: 'weekly_reminder' | 'deadline_alert' | 'encouragement',
    language: 'wolof' | 'pulaar' | 'french'
  ): Promise<string> {
    // Return pre-recorded template URL
  }

  async personalizeTemplate(
    templateUrl: string,
    variables: { name: string; amount: string; days: string }
  ): Promise<string> {
    // For MVP: Use text replacement in message
    // Future: Audio editing to insert personalized segments
  }
}
```

**Dependencies:** None (can use simple text messages initially)
**Testing:** Test voice generation, test template retrieval, verify storage

---

#### **Task 2.4: SMS Fallback Service**
**Files:** `services/smsService.ts`

**Actions:**
- [ ] Create `SMSService` class
- [ ] Implement `sendSMS(phone, message)` method
- [ ] Integrate with Twilio SMS API (or Africa's Talking)
- [ ] Add fallback logic in reminder engine (try WhatsApp, then SMS)
- [ ] Update message status tracking

**Code Structure:**
```typescript
// services/smsService.ts
export class SMSService {
  async sendSMS(phone: string, message: string): Promise<MessageResult> {
    // Use Twilio SMS API
    // Return success/error
  }
}
```

**Dependencies:** Task 2.1 (can reuse Twilio client)
**Testing:** Test SMS sending, test fallback logic

---

### **Phase 3: Sentreso App Integration (Week 5-6)**

#### **Task 3.1: Extend User Type System**
**Files:**
- `contexts/UserContext.tsx`
- `components/UserTypeOnboarding.tsx`
- `components/UserTypeSwitchModal.tsx`

**Actions:**
- [ ] Add `'VE'` to `UserDetails` interface in `UserContext.tsx`
- [ ] Update `UserTypeOnboarding.tsx` to include VE option
- [ ] Update `UserTypeSwitchModal.tsx` to support VE switching
- [ ] Add VE-specific onboarding flow
- [ ] Update user type validation

**Code Changes:**
```typescript
// contexts/UserContext.tsx
interface UserDetails {
  name: string;
  phone: string;
  email?: string;
  userType?: 'merchant' | 'GIE' | 'VE';  // Add VE
  address?: string;
}

// components/UserTypeOnboarding.tsx
// Add third option:
<TouchableOpacity
  style={styles.optionCard}
  onPress={() => handleSelectType('VE')}
>
  <View style={styles.iconContainer}>
    <Users size={32} color="#8B5CF6" />
  </View>
  <Text style={styles.optionTitle}>Village Entrepreneur</Text>
  <Text style={styles.optionDescription}>
    Pour gérer les groupes d'agriculteurs myAgro
  </Text>
</TouchableOpacity>
```

**Dependencies:** None
**Testing:** Test onboarding flow, test user type switching, verify persistence

---

#### **Task 3.2: Add VE Tabs to Navigation**
**Files:** `app/(tabs)/_layout.tsx`

**Actions:**
- [ ] Add conditional rendering for VE tabs
- [ ] Add `groups.tsx` tab (Groups management)
- [ ] Add `reminders.tsx` tab (Reminder management)
- [ ] Add `messages.tsx` tab (Message history)
- [ ] Update tab icons and labels
- [ ] Ensure tabs only show for VE user type

**Code Changes:**
```typescript
// app/(tabs)/_layout.tsx
const veMode = userDetails?.userType === 'VE';

{veMode && (
  <>
    <Tabs.Screen
      name="groups"
      options={{
        title: 'Groupes',
        tabBarIcon: ({ size, color }) => (
          <Users size={22} color={color} />
        ),
      }}
    />
    <Tabs.Screen
      name="reminders"
      options={{
        title: 'Rappels',
        tabBarIcon: ({ size, color }) => (
          <Bell size={22} color={color} />
        ),
      }}
    />
    <Tabs.Screen
      name="messages"
      options={{
        title: 'Messages',
        tabBarIcon: ({ size, color }) => (
          <MessageSquare size={22} color={color} />
        ),
      }}
    />
  </>
)}
```

**Dependencies:** Task 3.1
**Testing:** Verify tabs appear only for VE users, test navigation

---

#### **Task 3.3: Build Groups Screen**
**Files:** `app/(tabs)/groups.tsx`

**Actions:**
- [ ] Create Groups screen component
- [ ] Implement groups list view
- [ ] Add "Create Group" button and modal
- [ ] Implement group detail view
- [ ] Add farmers list within group
- [ ] Add "Add Farmer" functionality
- [ ] Add edit/delete group functionality
- [ ] Add search and filter
- [ ] Integrate with `MyAgroGroupsService`
- [ ] Add loading and error states
- [ ] Style to match existing app design

**Screen Structure:**
```typescript
// app/(tabs)/groups.tsx
export default function GroupsScreen() {
  const { userDetails } = useUserDetails();
  const [groups, setGroups] = useState<FarmerGroup[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);

  // Fetch groups
  // Create group
  // Add farmer
  // Edit/delete operations

  return (
    <View>
      {/* Groups list */}
      {/* Create group modal */}
      {/* Group detail view */}
      {/* Add farmer modal */}
    </View>
  );
}
```

**Dependencies:** Task 1.2 (MyAgroGroupsService), Task 3.1, Task 3.2
**Testing:** Test CRUD operations, test UI interactions, verify data persistence

---

#### **Task 3.4: Build Reminders Screen**
**Files:** `app/(tabs)/reminders.tsx`

**Actions:**
- [ ] Create Reminders screen component
- [ ] Display reminder rules list
- [ ] Add "Create Reminder Rule" functionality
- [ ] Implement reminder rule editing
- [ ] Add enable/disable toggle
- [ ] Show reminder schedule overview
- [ ] Add "Test Reminder" functionality
- [ ] Integrate with `ReminderEngine`
- [ ] Add calendar view for scheduled reminders
- [ ] Style to match existing app design

**Screen Structure:**
```typescript
// app/(tabs)/reminders.tsx
export default function RemindersScreen() {
  const [reminderRules, setReminderRules] = useState<ReminderRule[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);

  // Fetch reminder rules
  // Create reminder rule
  // Edit reminder rule
  // Toggle enable/disable
  // Test reminder

  return (
    <View>
      {/* Reminder rules list */}
      {/* Create reminder rule modal */}
      {/* Reminder schedule overview */}
    </View>
  );
}
```

**Dependencies:** Task 1.4 (ReminderEngine), Task 3.1, Task 3.2
**Testing:** Test reminder rule CRUD, test scheduling, test enable/disable

---

#### **Task 3.5: Build Messages Screen**
**Files:** `app/(tabs)/messages.tsx`

**Actions:**
- [ ] Create Messages screen component
- [ ] Display sent messages list
- [ ] Add filters (by group, farmer, type, status, date)
- [ ] Show message details (content, status, confirmation)
- [ ] Add retry functionality for failed messages
- [ ] Display confirmation statistics
- [ ] Add export functionality
- [ ] Integrate with database queries
- [ ] Style to match existing app design

**Screen Structure:**
```typescript
// app/(tabs)/messages.tsx
export default function MessagesScreen() {
  const [messages, setMessages] = useState<SentMessage[]>([]);
  const [filters, setFilters] = useState({});

  // Fetch messages with filters
  // Retry failed messages
  // View message details

  return (
    <View>
      {/* Filters */}
      {/* Messages list */}
      {/* Message details modal */}
      {/* Statistics */}
    </View>
  );
}
```

**Dependencies:** Task 1.1 (database schema), Task 3.1, Task 3.2
**Testing:** Test message listing, test filters, test retry functionality

---

#### **Task 3.6: Enhance Home Screen for VE Mode**
**Files:** `app/(tabs)/index.tsx`

**Actions:**
- [ ] Add conditional rendering for VE dashboard
- [ ] Display overview cards (total groups, farmers, upcoming payments)
- [ ] Show active groups list
- [ ] Add quick actions (create group, send reminder)
- [ ] Display recent activity
- [ ] Add analytics summary
- [ ] Style to match existing design

**Code Changes:**
```typescript
// app/(tabs)/index.tsx
const { userDetails } = useUserDetails();
const isVE = userDetails?.userType === 'VE';

if (isVE) {
  return <VEDashboard />;
}

// Existing merchant/GIE dashboard
```

**Dependencies:** Task 3.1, Task 3.2
**Testing:** Test dashboard display, test quick actions, verify data accuracy

---

### **Phase 4: Integration & Background Jobs (Week 7-8)**

#### **Task 4.1: Background Job Scheduler**
**Files:** `supabase/functions/reminder-scheduler/index.ts`

**Actions:**
- [ ] Create Supabase Edge Function for reminder scheduling
- [ ] Implement daily cron job to check reminders
- [ ] Call `ReminderEngine.scheduleReminders()`
- [ ] Call `ReminderEngine.checkPaymentDeadlines()`
- [ ] Set up pg_cron in Supabase
- [ ] Add error handling and logging
- [ ] Test cron execution

**Code Structure:**
```typescript
// supabase/functions/reminder-scheduler/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { ReminderEngine } from '../../services/reminderEngine.ts';

serve(async (req) => {
  const reminderEngine = new ReminderEngine();

  // Schedule reminders
  await reminderEngine.scheduleReminders();

  // Check payment deadlines
  await reminderEngine.checkPaymentDeadlines();

  return new Response(JSON.stringify({ success: true }), {
    headers: { 'Content-Type': 'application/json' },
  });
});
```

**SQL Setup:**
```sql
-- Create pg_cron job
SELECT cron.schedule(
  'daily-reminder-check',
  '0 9 * * *', -- Every day at 9 AM
  $$
  SELECT
    net.http_post(
      url := 'https://YOUR_PROJECT.supabase.co/functions/v1/reminder-scheduler',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer YOUR_ANON_KEY'
      )
    ) AS request_id;
  $$
);
```

**Dependencies:** Task 1.4 (ReminderEngine), Task 2.1 (WhatsApp Service)
**Testing:** Test cron execution, verify reminders are scheduled correctly

---

#### **Task 4.2: Reminder Execution Service**
**Files:** `supabase/functions/execute-reminder/index.ts`

**Actions:**
- [ ] Create Edge Function to execute individual reminders
- [ ] Get reminder rule from database
- [ ] Generate message using ReminderEngine
- [ ] Generate voice using VoiceGenerator
- [ ] Send via WhatsAppService
- [ ] Update sent_messages table
- [ ] Handle errors and retries
- [ ] Update next_send_at for recurring reminders

**Code Structure:**
```typescript
// supabase/functions/execute-reminder/index.ts
serve(async (req) => {
  const { reminderId } = await req.json();

  const reminderEngine = new ReminderEngine();
  await reminderEngine.executeReminder(reminderId);

  return new Response(JSON.stringify({ success: true }));
});
```

**Dependencies:** Task 1.4, Task 2.1, Task 2.3
**Testing:** Test reminder execution end-to-end, test error handling

---

#### **Task 4.3: Connect WhatsApp Bot to Backend API**
**Files:** `supabase/functions/whatsapp-webhook/index.ts` (update)

**Actions:**
- [ ] Ensure webhook uses same services as app
- [ ] Integrate with MyAgroGroupsService for farmer lookup
- [ ] Integrate with AIAgentService for responses
- [ ] Update sent_messages on incoming messages
- [ ] Handle voice messages from farmers
- [ ] Add rate limiting
- [ ] Add logging and monitoring

**Dependencies:** Task 1.2, Task 1.3, Task 2.2
**Testing:** Test end-to-end WhatsApp flow, test AI responses

---

#### **Task 4.4: Analytics Dashboard**
**Files:** `app/(tabs)/analytics.tsx` (enhance for VE mode)

**Actions:**
- [ ] Add VE-specific analytics view
- [ ] Display metrics: total groups, farmers, reminders sent
- [ ] Show confirmation rates
- [ ] Display payment completion rates
- [ ] Add charts (using existing chart library)
- [ ] Show per-group statistics
- [ ] Add date range filters
- [ ] Export analytics data

**Dependencies:** Task 3.1, Task 3.2
**Testing:** Test analytics calculations, test chart rendering, verify data accuracy

---

### **Phase 5: Testing & Polish (Week 9-10)**

#### **Task 5.1: End-to-End Testing**
**Actions:**
- [ ] Test complete farmer journey (WhatsApp)
- [ ] Test complete VE journey (app)
- [ ] Test reminder scheduling and execution
- [ ] Test payment deadline alerts
- [ ] Test confirmation tracking
- [ ] Test error scenarios
- [ ] Test edge cases (no internet, failed sends)
- [ ] Performance testing

**Test Scenarios:**
1. VE creates group → adds farmers → sets reminders → reminders sent → farmers confirm
2. Farmer asks questions via WhatsApp → receives responses
3. Payment deadline approaching → alerts sent → VE sees in dashboard
4. WhatsApp fails → SMS fallback works
5. Multiple groups → reminders sent correctly

---

#### **Task 5.2: Language Accuracy**
**Actions:**
- [ ] Review all French translations
- [ ] Test Wolof message templates (with native speaker)
- [ ] Test Pulaar message templates (with native speaker)
- [ ] Verify voice message quality
- [ ] Update templates based on feedback
- [ ] Add more personalized message variations

---

#### **Task 5.3: UI/UX Polish**
**Actions:**
- [ ] Review all VE screens for consistency
- [ ] Ensure French-only interface (no dollar signs, no icons per user preference)
- [ ] Add loading states everywhere
- [ ] Add error messages in French
- [ ] Improve empty states
- [ ] Add helpful tooltips
- [ ] Optimize for mobile screens
- [ ] Test on iOS and Android

---

#### **Task 5.4: Documentation**
**Actions:**
- [ ] Document API endpoints
- [ ] Create user guide for VEs (in French)
- [ ] Document WhatsApp bot commands
- [ ] Create troubleshooting guide
- [ ] Document deployment process
- [ ] Update README with new features

---

### **Phase 6: Deployment & Launch (Week 11-12)**

#### **Task 6.1: Production Setup**
**Actions:**
- [ ] Set up production Supabase project
- [ ] Configure production WhatsApp credentials
- [ ] Set up production edge functions
- [ ] Configure production cron jobs
- [ ] Set up monitoring and alerts
- [ ] Configure backup strategy

---

#### **Task 6.2: App Store Submission**
**Actions:**
- [ ] Update app version
- [ ] Update app description (mention VE mode)
- [ ] Prepare screenshots for VE features
- [ ] Submit to App Store (iOS)
- [ ] Submit to Play Store (Android)
- [ ] Monitor for approval

---

#### **Task 6.3: Pilot Testing**
**Actions:**
- [ ] Select pilot VEs
- [ ] Onboard pilot VEs
- [ ] Create test groups with real farmers
- [ ] Monitor system performance
- [ ] Collect feedback
- [ ] Iterate based on feedback

---

## 📊 Task Dependencies Graph

```
Phase 1:
  1.1 (Database) → 1.2 (Groups Service) → 1.3 (AI Agent) → 1.4 (Reminder Engine)

Phase 2:
  2.1 (WhatsApp Service) → 2.2 (Webhook) → 2.3 (Voice) → 2.4 (SMS)

Phase 3:
  3.1 (User Type) → 3.2 (Tabs) → 3.3 (Groups Screen) → 3.4 (Reminders Screen) → 3.5 (Messages Screen) → 3.6 (Home Screen)

Phase 4:
  1.4 + 2.1 → 4.1 (Scheduler) → 4.2 (Execution) → 4.3 (Integration) → 4.4 (Analytics)

Phase 5 & 6:
  All previous phases → Testing → Deployment
```

---

## 🎯 Success Criteria

**Phase 1 Complete:**
- ✅ Database schema deployed and tested
- ✅ All core services implemented and tested
- ✅ Basic CRUD operations working

**Phase 2 Complete:**
- ✅ WhatsApp messages sending successfully
- ✅ Webhook receiving and processing messages
- ✅ AI agent responding to farmer questions
- ✅ Voice messages working (or text fallback)

**Phase 3 Complete:**
- ✅ VE can create groups and add farmers via app
- ✅ VE can set reminder rules via app
- ✅ VE can view message history via app
- ✅ All screens styled and functional

**Phase 4 Complete:**
- ✅ Reminders scheduling automatically
- ✅ Reminders executing and sending
- ✅ WhatsApp bot fully integrated
- ✅ Analytics dashboard showing metrics

**Phase 5 Complete:**
- ✅ All end-to-end flows tested
- ✅ Languages verified
- ✅ UI polished
- ✅ Documentation complete

**Phase 6 Complete:**
- ✅ Production environment live
- ✅ App submitted to stores
- ✅ Pilot testing underway

---

**End of Implementation Plan**

---

**End of Recommendation**
