-- Create enum for masterclass categories
CREATE TYPE masterclass_category AS ENUM (
    'technology',
    'marketing',
    'finance',
    'design',
    'business',
    'personal_development',
    'data_science',
    'artificial_intelligence',
    'entrepreneurship',
    'leadership',
    'others'
);

-- Add category column to masterclasses table
ALTER TABLE masterclasses 
ADD COLUMN category masterclass_category NOT NULL DEFAULT 'others';

-- Update existing sample data
UPDATE masterclasses 
SET category = 'technology' 
WHERE title LIKE '%Web Development%';

UPDATE masterclasses 
SET category = 'technology' 
WHERE title LIKE '%React%';

-- Add new sample data with categories
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
    tags,
    category
) VALUES 
(
    'Digital Marketing Fundamentals',
    'https://example.com/marketing.jpg',
    'Sarah Johnson',
    'Learn the essentials of digital marketing including SEO, social media, and content marketing.',
    'paid',
    49.99,
    '{"type": "beginner", "details": null}'::jsonb,
    CURRENT_DATE + INTERVAL '10 days',
    '16:00',
    120,
    'https://meet.google.com/mkt-123-xyz',
    ARRAY['Marketing', 'Digital', 'SEO', 'Social Media'],
    'marketing'
),
(
    'Financial Planning for Startups',
    'https://example.com/finance.jpg',
    'Michael Chang',
    'Master the fundamentals of financial planning and management for early-stage startups.',
    'paid',
    79.99,
    '{"type": "intermediate", "details": "Basic understanding of business finance"}'::jsonb,
    CURRENT_DATE + INTERVAL '15 days',
    '17:00',
    150,
    'https://meet.google.com/fin-456-abc',
    ARRAY['Finance', 'Startup', 'Business', 'Planning'],
    'finance'
);
