ALTER TABLE masterclass_registrations
ADD COLUMN transaction_id text,
ADD COLUMN payment_status text DEFAULT 'pending' CHECK (payment_status IN ('pending', 'verified', 'rejected')),
ADD COLUMN payment_amount numeric(10,2);
