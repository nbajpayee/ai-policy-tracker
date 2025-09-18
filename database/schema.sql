-- AI Policy Tracker Database Schema

-- Create the ai_policies table
CREATE TABLE ai_policies (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    policy_name VARCHAR(500) NOT NULL,
    jurisdiction VARCHAR(200),
    issuing_body VARCHAR(300),
    date_introduced DATE,
    date_enacted DATE,
    status VARCHAR(100) CHECK (status IN ('Proposed', 'Under Review', 'Enacted', 'Amended', 'Repealed', 'Expired')),
    policy_type VARCHAR(150),
    scope_coverage TEXT,
    key_provisions TEXT,
    risk_classification VARCHAR(100) CHECK (risk_classification IN ('Low', 'Medium', 'High', 'Critical')),
    company_obligations TEXT,
    penalties_fines TEXT,
    affected_stakeholders TEXT,
    implementation_notes TEXT,
    latest_update DATE,
    source_reference_link VARCHAR(1000),
    monitoring_org VARCHAR(300),
    notes_commentary TEXT,
    next_review_date DATE,
    confidence_score INTEGER CHECK (confidence_score >= 0 AND confidence_score <= 100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create an index on policy_name for faster searching
CREATE INDEX idx_ai_policies_policy_name ON ai_policies(policy_name);

-- Create an index on jurisdiction for filtering
CREATE INDEX idx_ai_policies_jurisdiction ON ai_policies(jurisdiction);

-- Create an index on status for filtering
CREATE INDEX idx_ai_policies_status ON ai_policies(status);

-- Create an index on date_enacted for sorting
CREATE INDEX idx_ai_policies_date_enacted ON ai_policies(date_enacted);

-- Create an index on risk_classification for filtering
CREATE INDEX idx_ai_policies_risk_classification ON ai_policies(risk_classification);

-- Create a function to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create a trigger to automatically update updated_at
CREATE TRIGGER update_ai_policies_updated_at 
    BEFORE UPDATE ON ai_policies 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS)
ALTER TABLE ai_policies ENABLE ROW LEVEL SECURITY;

-- Create a policy that allows all operations for authenticated users
-- Note: You may want to restrict this based on your authentication requirements
CREATE POLICY "Allow all operations for authenticated users" ON ai_policies
    FOR ALL USING (auth.role() = 'authenticated');

-- Create a policy that allows read access for anonymous users (optional)
CREATE POLICY "Allow read access for anonymous users" ON ai_policies
    FOR SELECT USING (true);
