-- Create mentor_masterclasses table
CREATE TABLE IF NOT EXISTS mentor_masterclasses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    mentor_id UUID NOT NULL REFERENCES profiles(id),
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    category TEXT NOT NULL,
    image_url TEXT,
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ NOT NULL,
    max_participants INTEGER NOT NULL DEFAULT 100,
    current_participants INTEGER NOT NULL DEFAULT 0,
    price DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    status TEXT NOT NULL DEFAULT 'draft',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT valid_times CHECK (end_time > start_time)
);

-- Create function to validate mentor role
CREATE OR REPLACE FUNCTION check_mentor_role()
RETURNS TRIGGER AS $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = NEW.mentor_id 
        AND role = 'mentor'
    ) THEN
        RAISE EXCEPTION 'Only mentors can create masterclasses';
    END IF;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for mentor validation
CREATE TRIGGER validate_mentor_role
    BEFORE INSERT OR UPDATE ON mentor_masterclasses
    FOR EACH ROW
    EXECUTE FUNCTION check_mentor_role();

-- Enable RLS
ALTER TABLE mentor_masterclasses ENABLE ROW LEVEL SECURITY;

-- Policies for mentor_masterclasses
CREATE POLICY "Mentors can create their own masterclasses"
    ON mentor_masterclasses FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'mentor'
        )
        AND mentor_id = auth.uid()
    );

CREATE POLICY "Mentors can update their own masterclasses"
    ON mentor_masterclasses FOR UPDATE
    TO authenticated
    USING (mentor_id = auth.uid())
    WITH CHECK (mentor_id = auth.uid());

CREATE POLICY "Mentors can delete their own masterclasses"
    ON mentor_masterclasses FOR DELETE
    TO authenticated
    USING (mentor_id = auth.uid());

CREATE POLICY "Everyone can view published masterclasses"
    ON mentor_masterclasses FOR SELECT
    USING (status = 'published');

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for updating updated_at
CREATE TRIGGER update_mentor_masterclasses_updated_at
    BEFORE UPDATE ON mentor_masterclasses
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Add masterclass_type column to masterclass_registrations
ALTER TABLE masterclass_registrations 
ADD COLUMN masterclass_type text NOT NULL DEFAULT 'regular';

-- Add check constraint to ensure valid masterclass_type
ALTER TABLE masterclass_registrations
ADD CONSTRAINT valid_masterclass_type CHECK (masterclass_type IN ('regular', 'mentor'));
