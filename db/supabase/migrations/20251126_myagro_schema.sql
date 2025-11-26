-- Migration: myAgro reminder system core tables
-- Generated on 2025-11-26

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS myagro_groups (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ve_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  village TEXT NOT NULL,
  language TEXT CHECK (language IN ('wolof','pulaar','french')) DEFAULT 'wolof',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS myagro_farmers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  group_id UUID REFERENCES myagro_groups(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  package_type TEXT CHECK (package_type IN ('poultry','seed','fertilizer','other')),
  package_cost NUMERIC NOT NULL,
  payment_deadline TIMESTAMPTZ NOT NULL,
  weekly_savings_target NUMERIC NOT NULL,
  language TEXT CHECK (language IN ('wolof','pulaar','french')),
  savings_progress NUMERIC DEFAULT 0,
  payment_status TEXT CHECK (payment_status IN ('pending','on_track','behind','paid')) DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS reminder_rules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  group_id UUID REFERENCES myagro_groups(id) ON DELETE CASCADE,
  farmer_id UUID REFERENCES myagro_farmers(id) ON DELETE CASCADE,
  type TEXT CHECK (type IN ('weekly_savings','payment_deadline','encouragement','training')),
  frequency TEXT CHECK (frequency IN ('weekly','daily','custom')),
  days_before_deadline INTEGER,
  enabled BOOLEAN DEFAULT true,
  message_template TEXT,
  language TEXT CHECK (language IN ('wolof','pulaar','french')),
  next_send_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS sent_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  group_id UUID REFERENCES myagro_groups(id) ON DELETE CASCADE,
  farmer_id UUID REFERENCES myagro_farmers(id) ON DELETE CASCADE,
  reminder_rule_id UUID REFERENCES reminder_rules(id) ON DELETE SET NULL,
  type TEXT CHECK (type IN ('reminder','manual','group_voice')),
  channel TEXT CHECK (channel IN ('whatsapp','sms')),
  content TEXT,
  voice_url TEXT,
  status TEXT CHECK (status IN ('sent','delivered','read','failed')) DEFAULT 'sent',
  farmer_confirmed BOOLEAN DEFAULT FALSE,
  confirmation_method TEXT,
  sent_at TIMESTAMPTZ DEFAULT NOW(),
  delivered_at TIMESTAMPTZ,
  confirmed_at TIMESTAMPTZ,
  error_message TEXT
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_myagro_farmers_group_id ON myagro_farmers(group_id);
CREATE INDEX IF NOT EXISTS idx_reminder_rules_group_id ON reminder_rules(group_id);
CREATE INDEX IF NOT EXISTS idx_sent_messages_farmer_id ON sent_messages(farmer_id);
CREATE INDEX IF NOT EXISTS idx_sent_messages_rule_id ON sent_messages(reminder_rule_id);

-- Updated_at triggers
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER myagro_groups_set_updated_at
BEFORE UPDATE ON myagro_groups
FOR EACH ROW EXECUTE PROCEDURE set_updated_at();

CREATE TRIGGER myagro_farmers_set_updated_at
BEFORE UPDATE ON myagro_farmers
FOR EACH ROW EXECUTE PROCEDURE set_updated_at();

CREATE TRIGGER reminder_rules_set_updated_at
BEFORE UPDATE ON reminder_rules
FOR EACH ROW EXECUTE PROCEDURE set_updated_at();

-- RLS Policies
ALTER TABLE myagro_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE myagro_farmers ENABLE ROW LEVEL SECURITY;
ALTER TABLE reminder_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE sent_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "VEs select groups" ON myagro_groups;
CREATE POLICY "VEs select groups" ON myagro_groups
  FOR SELECT USING (auth.uid() = ve_id);

DROP POLICY IF EXISTS "VEs insert groups" ON myagro_groups;
CREATE POLICY "VEs insert groups" ON myagro_groups
  FOR INSERT WITH CHECK (auth.uid() = ve_id);

DROP POLICY IF EXISTS "VEs update groups" ON myagro_groups;
CREATE POLICY "VEs update groups" ON myagro_groups
  FOR UPDATE USING (auth.uid() = ve_id);

DROP POLICY IF EXISTS "VEs select farmers" ON myagro_farmers;
CREATE POLICY "VEs select farmers" ON myagro_farmers
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM myagro_groups g
      WHERE g.id = group_id AND g.ve_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "VEs insert farmers" ON myagro_farmers;
CREATE POLICY "VEs insert farmers" ON myagro_farmers
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM myagro_groups g
      WHERE g.id = group_id AND g.ve_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "VEs update farmers" ON myagro_farmers;
CREATE POLICY "VEs update farmers" ON myagro_farmers
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM myagro_groups g
      WHERE g.id = group_id AND g.ve_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "VEs select reminders" ON reminder_rules;
CREATE POLICY "VEs select reminders" ON reminder_rules
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM myagro_groups g
      WHERE g.id = group_id AND g.ve_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "VEs insert reminders" ON reminder_rules;
CREATE POLICY "VEs insert reminders" ON reminder_rules
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM myagro_groups g
      WHERE g.id = group_id AND g.ve_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "VEs update reminders" ON reminder_rules;
CREATE POLICY "VEs update reminders" ON reminder_rules
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM myagro_groups g
      WHERE g.id = group_id AND g.ve_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "VEs select sent messages" ON sent_messages;
CREATE POLICY "VEs select sent messages" ON sent_messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM myagro_groups g
      WHERE g.id = group_id AND g.ve_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "VEs insert sent messages" ON sent_messages;
CREATE POLICY "VEs insert sent messages" ON sent_messages
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM myagro_groups g
      WHERE g.id = group_id AND g.ve_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "VEs update sent messages" ON sent_messages;
CREATE POLICY "VEs update sent messages" ON sent_messages
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM myagro_groups g
      WHERE g.id = group_id AND g.ve_id = auth.uid()
    )
  );
