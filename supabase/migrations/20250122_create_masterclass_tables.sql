-- Create enum types if they don't exist
DO $$ BEGIN
    CREATE TYPE masterclass_type AS ENUM ('live', 'recorded');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE masterclass_category AS ENUM ('technology', 'business', 'design', 'marketing', 'other');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Drop existing tables if they exist (be careful with this in production!)
DROP TABLE IF EXISTS masterclass_registrations;
DROP TABLE IF EXISTS masterclasses CASCADE;

-- Create masterclasses table
CREATE TABLE IF NOT EXISTS masterclasses (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title VARCHAR NOT NULL,
    image_url TEXT,
    mentor_name VARCHAR NOT NULL,
    description TEXT,
    type masterclass_type NOT NULL,
    fee NUMERIC,
    prerequisites JSON,
    scheduled_date DATE NOT NULL,
    scheduled_time TIME NOT NULL,
    duration_minutes INT4 NOT NULL,
    meeting_link TEXT,
    tags _text,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    category masterclass_category NOT NULL
);

-- Create masterclass_registrations table
CREATE TABLE IF NOT EXISTS masterclass_registrations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    masterclass_id UUID NOT NULL,
    registered_at TIMESTAMPTZ DEFAULT NOW(),
    status TEXT DEFAULT 'registered',
    UNIQUE(user_id, masterclass_id)
);

-- Add a function to validate masterclass_id
CREATE OR REPLACE FUNCTION validate_masterclass_id()
RETURNS TRIGGER AS $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM masterclasses WHERE id = NEW.masterclass_id
        UNION
        SELECT 1 FROM mentor_masterclasses WHERE id = NEW.masterclass_id
    ) THEN
        RAISE EXCEPTION 'Invalid masterclass_id: %', NEW.masterclass_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for masterclass_id validation
DROP TRIGGER IF EXISTS validate_masterclass_id_trigger ON masterclass_registrations;
CREATE TRIGGER validate_masterclass_id_trigger
    BEFORE INSERT OR UPDATE ON masterclass_registrations
    FOR EACH ROW
    EXECUTE FUNCTION validate_masterclass_id();

-- Enable Row Level Security
ALTER TABLE masterclasses ENABLE ROW LEVEL SECURITY;
ALTER TABLE masterclass_registrations ENABLE ROW LEVEL SECURITY;

-- Policies for masterclasses table
CREATE POLICY "Anyone can view masterclasses"
    ON masterclasses
    FOR SELECT
    USING (true);

-- Policies for masterclass_registrations table
CREATE POLICY "Users can view their own registrations"
    ON masterclass_registrations
    FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "Users can register for masterclasses"
    ON masterclass_registrations
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can withdraw from masterclasses"
    ON masterclass_registrations
    FOR DELETE
    TO authenticated
    USING (auth.uid() = user_id);

-- Create an index for faster lookups
CREATE INDEX IF NOT EXISTS masterclass_registrations_user_id_idx ON masterclass_registrations(user_id);
CREATE INDEX IF NOT EXISTS masterclass_registrations_masterclass_id_idx ON masterclass_registrations(masterclass_id);

-- Create a function to check if a user is registered for a masterclass
CREATE OR REPLACE FUNCTION is_registered_for_masterclass(masterclass_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 
        FROM masterclass_registrations 
        WHERE masterclass_id = $1 
        AND user_id = auth.uid()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
