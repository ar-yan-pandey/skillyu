-- Create mentor_masterclass_registrations table
CREATE TABLE IF NOT EXISTS mentor_masterclass_registrations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    masterclass_id UUID NOT NULL REFERENCES mentor_masterclasses(id) ON DELETE CASCADE,
    registered_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, masterclass_id)
);

-- Enable Row Level Security
ALTER TABLE mentor_masterclass_registrations ENABLE ROW LEVEL SECURITY;

-- Policies for mentor_masterclass_registrations table
CREATE POLICY "Only authenticated users can register for mentor masterclasses"
    ON mentor_masterclass_registrations
    FOR INSERT
    TO authenticated
    WITH CHECK (
        auth.uid() = user_id
    );

CREATE POLICY "Users can view their own registrations"
    ON mentor_masterclass_registrations
    FOR SELECT
    TO authenticated
    USING (
        auth.uid() = user_id
    );

CREATE POLICY "Users can delete their own registrations"
    ON mentor_masterclass_registrations
    FOR DELETE
    TO authenticated
    USING (
        auth.uid() = user_id
    );
