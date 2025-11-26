# 📱 Sentreso x myAgro: Voice-Based Savings & Payment Reminder System

## 📋 Executive Summary

A simple, reliable payment reminder system that helps farmers save regularly and pay their packages on time. Village Entrepreneurs (VE) use Sentreso to manage groups of farmers and send automatic WhatsApp voice reminders (or SMS fallback) in local languages (Wolof, Pulaar).

**Key Principles:**
- **Simple**: Low-literacy friendly, no complex setup
- **Voice-First**: WhatsApp voice messages (preferred) or SMS fallback
- **Local Languages**: Wolof, Pulaar support
- **Group Management**: VE creates groups, manages farmers
- **Automatic Reminders**: Weekly savings reminders + payment deadline alerts
- **No Integration Needed**: Works standalone, no external API dependencies

---

## 🎯 Core Use Cases

### **1. VE Creates Farmer Group**
- VE creates a group (e.g., "Village of Ngohé")
- Adds 10-50 women farmers
- For each farmer, enters:
  - Name
  - Phone number
  - Package type (poultry, seed, fertilizer, etc.)
  - Total package cost
  - Payment deadline(s)
  - Recommended weekly savings amount

### **2. Automatic Reminders**
- **Weekly Savings Reminders**: Sent every week
- **Payment Deadline Alerts**: Sent 7 days, 3 days, and 1 day before deadline
- **Encouragement Messages**: Positive reinforcement
- **Optional Training**: 10-15 sec training reinforcement

### **3. VE Management Tools**
- Send group voice notes
- Trigger manual reminders
- View who received/confirmed messages
- Track farmer payment progress

### **4. Farmer Experience**
- Receives friendly voice messages in their language
- Simple confirmation (reply "OK" or tap button)
- Clear, actionable guidance

---

## 🏗️ App Architecture

### **New Structure**
```
app/(tabs)/
  ├── index.tsx           (Home - VE Dashboard)
  ├── groups.tsx          (NEW: Farmer Groups Management)
  ├── reminders.tsx       (NEW: Reminder Management)
  ├── messages.tsx        (NEW: Message History & Status)
  └── voice.tsx           (Enhanced: Voice Recording for Group Messages)

services/
  ├── myagroGroups.ts    (NEW: Group & Farmer Management)
  ├── reminderEngine.ts   (NEW: Reminder Scheduling & Execution)
  ├── whatsappService.ts  (NEW: WhatsApp Voice Message Sending)
  ├── smsService.ts       (NEW: SMS Fallback)
  └── voiceGenerator.ts  (NEW: Voice Message Generation)
```

---

## 📱 Screen Designs

### **1. Home Screen (VE Dashboard) - `index.tsx`**

**Main Sections:**

#### **A. Overview Cards**
```typescript
// Quick stats
- Total groups: 3
- Total farmers: 45
- Upcoming payments: 12 (next 7 days)
- Reminders sent today: 23
```

#### **B. Active Groups List**
```typescript
// Group cards showing:
- Group name (e.g., "Village of Ngohé")
- Number of farmers
- Upcoming payments count
- Last reminder sent
- Quick action: "Voir groupe"
```

#### **C. Quick Actions**
```typescript
- "Créer nouveau groupe" button
- "Envoyer rappel manuel" button
- "Voir messages envoyés" button
```

---

### **2. Groups Screen (`groups.tsx`) - NEW**

**Main Sections:**

#### **A. Groups List**
```typescript
interface FarmerGroup {
  id: string;
  name: string;
  village: string;
  ve_id: string;
  farmer_count: number;
  created_at: string;
  language: 'wolof' | 'pulaar' | 'french';
}
```

**UI:**
- Search bar
- Filter by village
- Group cards with:
  - Group name
  - Village
  - Number of farmers
  - Language
  - Quick actions

#### **B. Create/Edit Group**
```typescript
// Form fields:
- Group name (required)
- Village name (required)
- Language preference: Wolof / Pulaar / French
- Description (optional)
```

#### **C. Group Detail View**
```typescript
// Shows:
- Group info
- Farmers list
- Payment schedule overview
- Reminder settings
- Quick actions:
  - "Ajouter agriculteur"
  - "Envoyer message groupe"
  - "Voir rappels"
  - "Paramètres"
```

#### **D. Add/Edit Farmer**
```typescript
interface Farmer {
  id: string;
  group_id: string;
  name: string;
  phone: string;
  package_type: 'poultry' | 'seed' | 'fertilizer' | 'other';
  package_cost: number;
  payment_deadline: string;
  weekly_savings_target: number;
  language: 'wolof' | 'pulaar' | 'french';
  created_at: string;
}

// Form fields:
- Name (required)
- Phone number (required, validated)
- Package type (dropdown)
- Package cost (required)
- Payment deadline (date picker)
- Weekly savings target (required)
- Language preference (defaults to group language)
```

#### **E. Farmers List in Group**
```typescript
// Shows farmers with:
- Name
- Phone
- Package type
- Payment deadline
- Savings progress (visual indicator)
- Status: "On track" / "Behind" / "Paid"
- Quick actions:
  - "Envoyer rappel"
  - "Modifier"
  - "Voir historique"
```

---

### **3. Reminders Screen (`reminders.tsx`) - NEW**

**Main Sections:**

#### **A. Reminder Schedule Overview**
```typescript
// Calendar view or list view
- Today's reminders: 5
- This week: 23
- Upcoming: 12
```

#### **B. Reminder Rules**
```typescript
interface ReminderRule {
  id: string;
  group_id: string;
  farmer_id?: string;  // null = group-wide
  type: 'weekly_savings' | 'payment_deadline' | 'encouragement' | 'training';
  frequency: 'weekly' | 'daily' | 'custom';
  days_before_deadline?: number;  // For payment reminders
  enabled: boolean;
  message_template: string;
  language: 'wolof' | 'pulaar' | 'french';
}
```

**UI:**
- List of active reminder rules
- Toggle enable/disable
- Edit rule
- Test reminder (send now)

#### **C. Create Reminder Rule**
```typescript
// Step 1: Choose type
- Weekly savings reminder
- Payment deadline alert
- Encouragement message
- Training reinforcement

// Step 2: Configure
- Target: All farmers / Specific farmer
- Frequency
- Days before deadline (if applicable)
- Message template

// Step 3: Preview & activate
```

---

### **4. Messages Screen (`messages.tsx`) - NEW**

**Main Sections:**

#### **A. Message History**
```typescript
interface SentMessage {
  id: string;
  group_id: string;
  farmer_id?: string;
  type: 'reminder' | 'manual' | 'group_voice';
  channel: 'whatsapp' | 'sms';
  content: string;
  voice_url?: string;
  status: 'sent' | 'delivered' | 'read' | 'failed';
  farmer_confirmed: boolean;
  sent_at: string;
  confirmed_at?: string;
}
```

**UI:**
- Filter by: Group, Farmer, Type, Status, Date
- Message list with:
  - Recipient name
  - Message type
  - Channel (WhatsApp/SMS icon)
  - Status indicator
  - Confirmation status
  - Timestamp

#### **B. Message Status Details**
```typescript
// Shows:
- Message content
- Recipient info
- Delivery status
- Confirmation status
- Retry option (if failed)
```

#### **C. Confirmation Tracking**
```typescript
// Dashboard showing:
- Messages sent: 150
- Confirmed: 120 (80%)
- Not confirmed: 30 (20%)
- Failed: 0

// Per farmer confirmation rate
```

---

### **5. Enhanced Voice Screen (`voice.tsx`)**

**New Features:**

#### **A. Group Voice Message**
```typescript
// VE can record voice message for group
- Select group
- Record voice message (max 60 seconds)
- Preview
- Send to all farmers in group
- Option to save as template
```

#### **B. Voice Templates**
```typescript
// Pre-recorded templates in local languages
- Weekly savings reminder (Wolof)
- Weekly savings reminder (Pulaar)
- Payment deadline alert (Wolof)
- Payment deadline alert (Pulaar)
- Encouragement message (Wolof)
- Encouragement message (Pulaar)
```

---

## 🗄️ Data Models

### **1. Farmer Groups Table**
```sql
CREATE TABLE myagro_groups (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ve_id UUID REFERENCES auth.users(id),
  name TEXT NOT NULL,
  village TEXT NOT NULL,
  language TEXT CHECK (language IN ('wolof', 'pulaar', 'french')) DEFAULT 'wolof',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### **2. Farmers Table**
```sql
CREATE TABLE myagro_farmers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  group_id UUID REFERENCES myagro_groups(id),
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
```

### **3. Reminder Rules Table**
```sql
CREATE TABLE reminder_rules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  group_id UUID REFERENCES myagro_groups(id),
  farmer_id UUID REFERENCES myagro_farmers(id),  -- NULL = group-wide
  type TEXT CHECK (type IN ('weekly_savings', 'payment_deadline', 'encouragement', 'training')),
  frequency TEXT CHECK (frequency IN ('weekly', 'daily', 'custom')),
  days_before_deadline INTEGER,  -- For payment reminders
  enabled BOOLEAN DEFAULT true,
  message_template TEXT,
  language TEXT CHECK (language IN ('wolof', 'pulaar', 'french')),
  next_send_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### **4. Sent Messages Table**
```sql
CREATE TABLE sent_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  group_id UUID REFERENCES myagro_groups(id),
  farmer_id UUID REFERENCES myagro_farmers(id),
  reminder_rule_id UUID REFERENCES reminder_rules(id),
  type TEXT CHECK (type IN ('reminder', 'manual', 'group_voice')),
  channel TEXT CHECK (channel IN ('whatsapp', 'sms')),
  content TEXT,
  voice_url TEXT,
  status TEXT CHECK (status IN ('sent', 'delivered', 'read', 'failed')) DEFAULT 'sent',
  farmer_confirmed BOOLEAN DEFAULT false,
  confirmation_method TEXT,  -- 'whatsapp_reply', 'sms_reply', 'button_click'
  sent_at TIMESTAMPTZ DEFAULT NOW(),
  delivered_at TIMESTAMPTZ,
  confirmed_at TIMESTAMPTZ,
  error_message TEXT
);
```

---

## ⚙️ Core Services

### **1. Reminder Engine (`services/reminderEngine.ts`)**

```typescript
// Core reminder scheduling and execution
export class ReminderEngine {
  // Schedule reminders based on rules
  async scheduleReminders(): Promise<void> {
    // Get all active reminder rules
    // Calculate next send time
    // Queue reminders
  }

  // Execute reminder (called by background job)
  async executeReminder(reminderId: string): Promise<void> {
    // Get reminder rule
    // Generate message (text + voice)
    // Send via WhatsApp (preferred) or SMS
    // Record in sent_messages
  }

  // Check payment deadlines
  async checkPaymentDeadlines(): Promise<void> {
    // Find farmers with upcoming deadlines
    // Send alerts: 7 days, 3 days, 1 day before
  }

  // Generate reminder message
  private generateMessage(
    rule: ReminderRule,
    farmer: Farmer
  ): { text: string; voiceTemplate?: string } {
    // Generate personalized message
    // Include: name, package type, amount, deadline
    // Use appropriate language
  }
}
```

### **2. WhatsApp Service (`services/whatsappService.ts`)**

```typescript
// WhatsApp voice message sending
export class WhatsAppService {
  // Send voice message via WhatsApp
  async sendVoiceMessage(
    phone: string,
    voiceUrl: string,
    caption?: string
  ): Promise<MessageResult> {
    // Use WhatsApp Business API or Twilio WhatsApp API
    // Send voice message
    // Return delivery status
  }

  // Send text message (fallback)
  async sendTextMessage(
    phone: string,
    message: string
  ): Promise<MessageResult> {
    // Send text via WhatsApp
  }

  // Check delivery status
  async checkDeliveryStatus(messageId: string): Promise<DeliveryStatus> {
    // Check if message delivered/read
  }
}
```

### **3. SMS Service (`services/smsService.ts`)**

```typescript
// SMS fallback service
export class SMSService {
  // Send SMS (fallback when WhatsApp fails)
  async sendSMS(
    phone: string,
    message: string
  ): Promise<MessageResult> {
    // Use Twilio, Africa's Talking, or similar
    // Send SMS
  }
}
```

### **4. Voice Generator (`services/voiceGenerator.ts`)**

```typescript
// Generate voice messages in local languages
export class VoiceGenerator {
  // Generate voice from text (TTS)
  async generateVoice(
    text: string,
    language: 'wolof' | 'pulaar' | 'french'
  ): Promise<string> {
    // Use TTS service (e.g., Google TTS, Azure TTS)
    // Support for Wolof and Pulaar
    // Return voice file URL
  }

  // Use pre-recorded templates
  async getTemplate(
    templateType: string,
    language: 'wolof' | 'pulaar' | 'french'
  ): Promise<string> {
    // Return pre-recorded voice template URL
  }

  // Personalize template
  async personalizeTemplate(
    templateUrl: string,
    variables: Record<string, string>
  ): Promise<string> {
    // Insert farmer name, amounts, etc. into template
    // Return personalized voice URL
  }
}
```

### **5. MyAgro Groups Service (`services/myagroGroups.ts`)**

```typescript
// Group and farmer management
export class MyAgroGroupsService {
  // Create group
  async createGroup(data: CreateGroupInput): Promise<FarmerGroup>

  // Add farmer to group
  async addFarmer(groupId: string, data: CreateFarmerInput): Promise<Farmer>

  // Get group with farmers
  async getGroup(groupId: string): Promise<FarmerGroupWithFarmers>

  // Update farmer savings progress
  async updateSavingsProgress(
    farmerId: string,
    amount: number
  ): Promise<void>

  // Mark payment as paid
  async markPaymentPaid(farmerId: string): Promise<void>
}
```

---

## 🔄 User Flows

### **Flow 1: VE Creates Group & Adds Farmers**

```
1. VE opens Sentreso
2. Taps "Créer nouveau groupe"
3. Fills form:
   - Name: "Village of Ngohé"
   - Village: "Ngohé"
   - Language: Wolof
4. Saves group
5. Taps "Ajouter agriculteur"
6. For each farmer:
   - Name: "Aissatou Diallo"
   - Phone: "+221771234567"
   - Package: Poultry
   - Cost: 25,000 FCFA
   - Deadline: 2024-03-15
   - Weekly savings: 2,000 FCFA
7. Saves farmer
8. Repeats for all farmers (10-50)
```

### **Flow 2: Automatic Weekly Savings Reminder**

```
1. Reminder engine runs (daily check)
2. Finds all active "weekly_savings" reminder rules
3. For each farmer:
   a. Generates personalized message:
      "Salaam Aissatou. This is your weekly reminder for your poultry package.
       Try to save 2,000 FCFA this week to stay on track.
       You have saved 8,000 FCFA so far. You are doing great!"
   b. Generates voice message (Wolof TTS or template)
   c. Sends via WhatsApp (preferred)
   d. If WhatsApp fails, sends SMS fallback
   e. Records in sent_messages table
4. Farmer receives voice message
5. Farmer confirms (replies "OK" or taps button)
6. System updates confirmation status
```

### **Flow 3: Payment Deadline Alert**

```
1. Reminder engine checks payment deadlines daily
2. Finds farmers with deadlines:
   - 7 days away → Send alert
   - 3 days away → Send alert
   - 1 day away → Send urgent alert
3. For each alert:
   a. Generates message:
      "Aissatou, your payment of 25,000 FCFA for poultry package is due in 3 days.
       You have saved 20,000 FCFA. Please save 5,000 FCFA more to complete payment."
   b. Sends via WhatsApp
   c. Records in sent_messages
4. VE sees alert in dashboard
5. VE can send additional group message if needed
```

### **Flow 4: VE Sends Group Voice Message**

```
1. VE opens group detail
2. Taps "Envoyer message groupe"
3. Records voice message (max 60 seconds)
4. Preview message
5. Taps "Envoyer"
6. System:
   a. Sends to all farmers in group via WhatsApp
   b. Records in sent_messages (type: 'group_voice')
   c. Tracks delivery status
7. Farmers receive voice message
8. VE can see who received/confirmed
```

### **Flow 5: Farmer Confirms Receipt**

```
1. Farmer receives WhatsApp voice message
2. Farmer listens to message
3. Farmer replies "OK" or taps confirmation button
4. System:
   a. Detects confirmation (WhatsApp webhook or SMS reply)
   b. Updates sent_messages.farmer_confirmed = true
   c. Updates confirmed_at timestamp
5. VE sees confirmation in messages screen
```

---

## 🎨 Message Templates

### **Weekly Savings Reminder (Wolof)**
```
"Salaam [Name]. Nii laa jëfandikoo ci yëngu-yëngu bii ci paket bii [package type].
Jëfandikoo 2,000 FCFA ci ayu-benn. Yaw laa ame ci [savings so far] FCFA.
Yaw laa ame ci [amount remaining] FCFA. Yaw laa ame ci [days remaining] ayu-benn.
Yaw laa ame ci [days remaining] ayu-benn. Yaw laa ame ci [days remaining] ayu-benn."
```

**Translation:**
"Hello [Name]. This is your weekly reminder for your [package type] package.
Try to save 2,000 FCFA this week to stay on track.
You have saved [savings so far] FCFA so far.
You need [amount remaining] FCFA more.
You have [days remaining] days left. You are doing great!"
```

### **Payment Deadline Alert (Wolof)**
```
"Salaam [Name]. Paiement bii ci [amount] FCFA ci paket bii [package type]
dina am ci [days] ayu-benn. Yaw laa ame ci [savings] FCFA.
Jëfandikoo [amount needed] FCFA ci ayu-benn."
```

**Translation:**
"Hello [Name]. Your payment of [amount] FCFA for [package type] package
is due in [days] days. You have saved [savings] FCFA.
Please save [amount needed] FCFA more."
```

### **Encouragement Message (Wolof)**
```
"Salaam [Name]. Yaw laa ame ci [savings] FCFA. Yaw laa ame ci [percentage]% ci paket bii.
Yaw laa ame ci [days] ayu-benn. Yaw laa ame ci [days] ayu-benn."
```

**Translation:**
"Hello [Name]. You have saved [savings] FCFA. That's [percentage]% of your package.
You have [days] days left. Keep going! You are doing great!"
```

---

## 🔧 Technical Implementation

### **1. WhatsApp Integration Options**

**Option A: Twilio WhatsApp API**
```typescript
// Pros: Reliable, good delivery tracking
// Cons: Requires Twilio account, costs per message
const twilio = require('twilio');
const client = twilio(accountSid, authToken);

await client.messages.create({
  from: 'whatsapp:+14155238886',
  to: `whatsapp:${phone}`,
  mediaUrl: [voiceUrl],
  body: caption
});
```

**Option B: WhatsApp Business API (Official)**
```typescript
// Pros: Official, best delivery
// Cons: Requires business verification, more complex setup
// Use Meta Graph API
```

**Option C: Africa's Talking WhatsApp**
```typescript
// Pros: Africa-focused, good rates
// Cons: Limited documentation
```

### **2. SMS Fallback**

**Option A: Twilio SMS**
```typescript
await client.messages.create({
  from: '+1234567890',
  to: phone,
  body: message
});
```

**Option B: Africa's Talking SMS**
```typescript
// Good rates for West Africa
```

### **3. Voice Generation**

**Option A: Text-to-Speech (TTS)**
```typescript
// Google Cloud TTS (supports Wolof, Pulaar)
// Azure TTS
// Amazon Polly
```

**Option B: Pre-recorded Templates**
```typescript
// Record templates in studio
// Store in cloud storage
// Personalize with farmer name/amounts
```

### **4. Background Job Scheduler**

**Option A: Supabase Edge Functions (Cron)**
```typescript
// Run daily at 9 AM
// Check reminder rules
// Execute reminders
```

**Option B: Cloud Functions**
```typescript
// Firebase Cloud Functions
// Google Cloud Functions
```

---

## 📊 Analytics & Reporting

### **VE Dashboard Metrics**
- Total groups
- Total farmers
- Upcoming payments
- Reminders sent (today/week/month)
- Confirmation rate
- Payment completion rate

### **Per Group Metrics**
- Number of farmers
- Payment status breakdown
- Reminder delivery rate
- Confirmation rate
- Savings progress

### **Per Farmer Metrics**
- Savings progress
- Payment status
- Reminders received
- Confirmations sent
- Days until deadline

---

## 🚀 Implementation Roadmap

### **Phase 1: Core Group Management (Week 1-2)**
- [ ] Database schema (groups, farmers, reminders)
- [ ] Groups screen (create, list, edit)
- [ ] Farmers screen (add, list, edit)
- [ ] Basic UI

### **Phase 2: Reminder Engine (Week 3-4)**
- [ ] Reminder rules table
- [ ] Reminder scheduling logic
- [ ] Message generation
- [ ] Background job setup

### **Phase 3: WhatsApp Integration (Week 5-6)**
- [ ] WhatsApp service setup
- [ ] Voice message sending
- [ ] Delivery tracking
- [ ] SMS fallback

### **Phase 4: Voice Generation (Week 7-8)**
- [ ] TTS integration (Wolof, Pulaar)
- [ ] Pre-recorded templates
- [ ] Message personalization
- [ ] Voice file storage

### **Phase 5: Confirmation Tracking (Week 9-10)**
- [ ] WhatsApp webhook for replies
- [ ] Confirmation detection
- [ ] Status tracking
- [ ] Analytics dashboard

### **Phase 6: Testing & Polish (Week 11-12)**
- [ ] User testing with VEs
- [ ] Language accuracy check
- [ ] Performance optimization
- [ ] Documentation

---

## 🔒 Security & Privacy

1. **Phone Number Privacy**: Encrypt phone numbers at rest
2. **Message Content**: Store messages securely
3. **VE Authentication**: Only VEs can access their groups
4. **Farmer Data**: GDPR-compliant data handling
5. **WhatsApp Compliance**: Follow WhatsApp Business Policy

---

## 💰 Cost Considerations

### **WhatsApp Messages**
- Twilio: ~$0.005 per message
- 100 farmers × 4 reminders/month = 400 messages = $2/month per group

### **SMS Fallback**
- Twilio: ~$0.0075 per SMS
- Africa's Talking: ~$0.01 per SMS

### **Voice Generation**
- TTS: ~$0.01 per minute
- Pre-recorded: One-time cost, free storage

### **Storage**
- Supabase: Free tier sufficient for start

---

## 🎯 Success Metrics

1. **Adoption**
   - Number of VEs using system
   - Number of groups created
   - Number of farmers enrolled

2. **Engagement**
   - Reminder delivery rate (target: >95%)
   - Confirmation rate (target: >70%)
   - Farmer retention

3. **Impact**
   - Payment completion rate improvement
   - Savings consistency
   - On-time payment rate

---

**End of Design Document**


