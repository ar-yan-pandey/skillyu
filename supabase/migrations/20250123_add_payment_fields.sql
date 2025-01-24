-- Create payment status enum
DO $$ BEGIN
    CREATE TYPE payment_status_enum AS ENUM ('pending', 'completed', 'failed');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Add payment fields to masterclass_registrations table
ALTER TABLE IF EXISTS masterclass_registrations 
    ADD COLUMN IF NOT EXISTS transaction_id TEXT,
    ADD COLUMN IF NOT EXISTS payment_status payment_status_enum DEFAULT 'pending',
    ADD COLUMN IF NOT EXISTS payment_amount NUMERIC,
    ADD COLUMN IF NOT EXISTS payment_date TIMESTAMPTZ;
