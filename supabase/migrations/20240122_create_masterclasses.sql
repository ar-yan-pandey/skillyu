-- Create enum for masterclass type
CREATE TYPE masterclass_type AS ENUM ('free', 'paid');

-- Create enum for prerequisite type
CREATE TYPE prerequisite_type AS ENUM ('none', 'beginner', 'intermediate', 'advanced');

-- Create masterclasses table
CREATE TABLE IF NOT EXISTS masterclasses (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    image_url TEXT,
    mentor_name VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    type masterclass_type NOT NULL DEFAULT 'free',
    fee DECIMAL(10, 2), -- NULL if free
    prerequisites JSON DEFAULT '{"type": "none", "details": null}'::jsonb,
    scheduled_date DATE NOT NULL,
    scheduled_time TIME NOT NULL,
    duration_minutes INTEGER NOT NULL,
    meeting_link TEXT,
    tags TEXT[] DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add a check constraint to ensure fee is not null when type is paid
ALTER TABLE masterclasses 
ADD CONSTRAINT check_paid_fee 
CHECK (
    (type = 'free' AND fee IS NULL) OR 
    (type = 'paid' AND fee IS NOT NULL AND fee > 0)
);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_masterclasses_updated_at
    BEFORE UPDATE ON masterclasses
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create RLS policies
ALTER TABLE masterclasses ENABLE ROW LEVEL SECURITY;

-- Policy for viewing masterclasses (everyone can view basic info)
CREATE POLICY "Everyone can view masterclasses"
    ON masterclasses FOR SELECT
    USING (true);

-- Function to check if meeting link should be visible
CREATE OR REPLACE FUNCTION is_meeting_link_visible(scheduled_date DATE, scheduled_time TIME)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN (
        scheduled_date = CURRENT_DATE AND 
        scheduled_time - INTERVAL '1 hour' <= LOCALTIME AND
        scheduled_time + INTERVAL '2 hours' >= LOCALTIME
    ) OR (
        scheduled_date < CURRENT_DATE
    );
END;
$$ LANGUAGE plpgsql;

-- Create a view for safe masterclass access
CREATE OR REPLACE VIEW masterclasses_safe AS
SELECT 
    m.*,
    CASE 
        WHEN is_meeting_link_visible(m.scheduled_date, m.scheduled_time) THEN m.meeting_link
        ELSE NULL
    END as visible_meeting_link
FROM masterclasses m;

-- Create registrations table
CREATE TABLE IF NOT EXISTS masterclass_registrations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    masterclass_id UUID REFERENCES masterclasses(id) ON DELETE CASCADE,
    status VARCHAR(20) DEFAULT 'registered',
    payment_status VARCHAR(20) DEFAULT 'not_required',
    payment_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, masterclass_id)
);

-- Create trigger for masterclass_registrations updated_at
CREATE TRIGGER update_masterclass_registrations_updated_at
    BEFORE UPDATE ON masterclass_registrations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- RLS for masterclass_registrations
ALTER TABLE masterclass_registrations ENABLE ROW LEVEL SECURITY;

-- Users can view their own registrations
CREATE POLICY "Users can view own registrations"
    ON masterclass_registrations FOR SELECT
    USING (auth.uid() = user_id);

-- Users can insert their own registrations
CREATE POLICY "Users can insert own registrations"
    ON masterclass_registrations FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Users can update their own registrations
CREATE POLICY "Users can update own registrations"
    ON masterclass_registrations FOR UPDATE
    USING (auth.uid() = user_id);

-- Sample data for testing
INSERT INTO masterclasses (
    title,
    image_url,
    mentor_name,
    description,
    type,
    fee,
    prerequisites,
    scheduled_date,
    scheduled_time,
    duration_minutes,
    meeting_link,
    tags
) VALUES 
(
    'Introduction to Web Development',
    'https://example.com/web-dev.jpg',
    'John Doe',
    'Learn the basics of web development including HTML, CSS, and JavaScript.',
    'free',
    NULL,
    '{"type": "beginner", "details": null}'::jsonb,
    CURRENT_DATE + INTERVAL '7 days',
    '14:00',
    120,
    'https://meet.google.com/abc-defg-hij',
    ARRAY['Web Development', 'Programming', 'Frontend']
),
(
    'Advanced React Patterns',
    'https://example.com/react.jpg',
    'Jane Smith',
    'Deep dive into advanced React patterns and best practices.',
    'paid',
    29.99,
    '{"type": "intermediate", "details": "Basic knowledge of React and JavaScript required"}'::jsonb,
    CURRENT_DATE + INTERVAL '14 days',
    '15:00',
    180,
    'https://meet.google.com/xyz-uvwx-yz',
    ARRAY['React', 'JavaScript', 'Frontend', 'Advanced']
);
