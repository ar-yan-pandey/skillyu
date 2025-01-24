import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
  try {
    console.log('Starting to seed masterclass data...');
    
    // Sample masterclass data
    const masterclasses = [
      {
        title: 'Introduction to Web Development',
        description: 'Learn the basics of HTML, CSS, and JavaScript in this comprehensive masterclass.',
        mentor_name: 'John Doe',
        type: 'live',
        fee: 999,
        prerequisites: {
          "required": ["Basic computer knowledge"],
          "recommended": ["Basic HTML understanding"]
        },
        scheduled_date: '2025-02-01',
        scheduled_time: '10:00:00',
        duration_minutes: 120,
        image_url: 'https://images.unsplash.com/photo-1461749280684-dccba630e2f6',
        meeting_link: 'https://meet.google.com/example',
        category: 'technology',
        tags: ['web development', 'programming', 'frontend']
      },
      {
        title: 'Digital Marketing Essentials',
        description: 'Master the fundamentals of digital marketing and grow your online presence.',
        mentor_name: 'Jane Smith',
        type: 'live',
        fee: 799,
        prerequisites: {
          "required": ["None"],
          "recommended": ["Social media experience"]
        },
        scheduled_date: '2025-02-05',
        scheduled_time: '14:00:00',
        duration_minutes: 90,
        image_url: 'https://images.unsplash.com/photo-1432888622747-4eb9a8f2c293',
        meeting_link: 'https://meet.google.com/example2',
        category: 'marketing',
        tags: ['digital marketing', 'social media', 'SEO']
      },
      {
        title: 'UI/UX Design Workshop',
        description: 'Create beautiful and user-friendly interfaces with modern design principles.',
        mentor_name: 'Alex Johnson',
        type: 'live',
        fee: 1299,
        prerequisites: {
          "required": ["Basic design knowledge"],
          "recommended": ["Figma or Sketch experience"]
        },
        scheduled_date: '2025-02-10',
        scheduled_time: '11:00:00',
        duration_minutes: 150,
        image_url: 'https://images.unsplash.com/photo-1561070791-2526d30994b5',
        meeting_link: 'https://meet.google.com/example3',
        category: 'design',
        tags: ['UI design', 'UX design', 'web design']
      }
    ];

    console.log('Inserting masterclass data...');
    
    // Insert sample data into the masterclasses table
    const { data, error } = await supabase
      .from('masterclasses')
      .insert(masterclasses)
      .select();

    if (error) {
      console.error('Error inserting masterclass data:', error);
      throw error;
    }

    console.log('Successfully inserted masterclass data:', data);

    return NextResponse.json({ 
      message: 'Sample data seeded successfully',
      masterclasses: data 
    });
  } catch (error) {
    console.error('Error seeding data:', error);
    return NextResponse.json({ error: 'Failed to seed data' }, { status: 500 });
  }
}
