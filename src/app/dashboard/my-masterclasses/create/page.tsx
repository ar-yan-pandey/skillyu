'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { Info } from 'lucide-react';

export default function CreateMasterclass() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    start_time: '',
    end_time: '',
    max_participants: 100,
    price: 0,
    image_url: '',
    meeting_link: ''
  });

  useEffect(() => {
    checkMentorAccess();
  }, [router]);

  async function checkMentorAccess() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('Please login first');
        router.push('/login');
        return;
      }

      const { data: profile, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      if (error || !profile) {
        toast.error('Error checking access');
        router.push('/dashboard');
        return;
      }

      if (profile.role !== 'mentor') {
        toast.error('Only mentors can access this page');
        router.push('/dashboard');
        return;
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error checking access');
      router.push('/dashboard');
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Validate times
      const startTime = new Date(formData.start_time);
      const endTime = new Date(formData.end_time);
      
      if (startTime < new Date()) {
        throw new Error('Start time must be in the future');
      }
      
      if (endTime <= startTime) {
        throw new Error('End time must be after start time');
      }

      const { error } = await supabase
        .from('mentor_masterclasses')
        .insert({
          mentor_id: user.id,
          ...formData,
          status: 'draft'
        });

      if (error) throw error;

      // Show success message with approval info
      toast.success(
        <div className="space-y-2">
          <p className="font-medium">Masterclass Created Successfully!</p>
          <p className="text-sm text-gray-600">Your masterclass is now under review. It will be published once approved by our team.</p>
        </div>,
        {
          duration: 5000, // Show for 5 seconds
          className: "bg-white"
        }
      );

      // Redirect after a short delay
      setTimeout(() => {
        router.push('/dashboard/my-masterclasses');
      }, 2000);

    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Create New Masterclass</h1>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800">
            <p className="flex items-center gap-2">
              <Info className="h-4 w-4" />
              <span>Your masterclass will be reviewed by our team before being published. This helps maintain quality and relevance for our users.</span>
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 bg-white shadow-sm rounded-lg p-6">
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700">
              Title *
            </label>
            <input
              type="text"
              id="title"
              name="title"
              required
              value={formData.title}
              onChange={handleChange}
              className="mt-1 block w-full rounded-lg border border-gray-200 px-3 py-2 text-gray-900 placeholder-gray-400 focus:border-[#4fcdc4] focus:outline-none focus:ring-[#4fcdc4] sm:text-sm"
              placeholder="Enter masterclass title"
            />
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700">
              Description *
            </label>
            <textarea
              id="description"
              name="description"
              required
              rows={4}
              value={formData.description}
              onChange={handleChange}
              className="mt-1 block w-full rounded-lg border border-gray-200 px-3 py-2 text-gray-900 placeholder-gray-400 focus:border-[#4fcdc4] focus:outline-none focus:ring-[#4fcdc4] sm:text-sm"
              placeholder="Describe your masterclass"
            />
          </div>

          <div>
            <label htmlFor="category" className="block text-sm font-medium text-gray-700">
              Category *
            </label>
            <select
              id="category"
              name="category"
              required
              value={formData.category}
              onChange={handleChange}
              className="mt-1 block w-full rounded-lg border border-gray-200 px-3 py-2 text-gray-900 focus:border-[#4fcdc4] focus:outline-none focus:ring-[#4fcdc4] sm:text-sm"
            >
              <option value="">Select a category</option>
              <option value="technology">Technology</option>
              <option value="business">Business</option>
              <option value="design">Design</option>
              <option value="marketing">Marketing</option>
              <option value="personal-development">Personal Development</option>
            </select>
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div>
              <label htmlFor="start_time" className="block text-sm font-medium text-gray-700">
                Start Time *
              </label>
              <input
                type="datetime-local"
                id="start_time"
                name="start_time"
                required
                value={formData.start_time}
                onChange={handleChange}
                className="mt-1 block w-full rounded-lg border border-gray-200 px-3 py-2 text-gray-900 focus:border-[#4fcdc4] focus:outline-none focus:ring-[#4fcdc4] sm:text-sm"
              />
            </div>

            <div>
              <label htmlFor="end_time" className="block text-sm font-medium text-gray-700">
                End Time *
              </label>
              <input
                type="datetime-local"
                id="end_time"
                name="end_time"
                required
                value={formData.end_time}
                onChange={handleChange}
                className="mt-1 block w-full rounded-lg border border-gray-200 px-3 py-2 text-gray-900 focus:border-[#4fcdc4] focus:outline-none focus:ring-[#4fcdc4] sm:text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div>
              <label htmlFor="max_participants" className="block text-sm font-medium text-gray-700">
                Maximum Participants
              </label>
              <input
                type="number"
                id="max_participants"
                name="max_participants"
                min="1"
                value={formData.max_participants}
                onChange={handleChange}
                className="mt-1 block w-full rounded-lg border border-gray-200 px-3 py-2 text-gray-900 focus:border-[#4fcdc4] focus:outline-none focus:ring-[#4fcdc4] sm:text-sm"
              />
            </div>

            <div>
              <label htmlFor="price" className="block text-sm font-medium text-gray-700">
                Price (₹)
              </label>
              <input
                type="number"
                id="price"
                name="price"
                min="0"
                step="0.01"
                value={formData.price}
                onChange={handleChange}
                className="mt-1 block w-full rounded-lg border border-gray-200 px-3 py-2 text-gray-900 focus:border-[#4fcdc4] focus:outline-none focus:ring-[#4fcdc4] sm:text-sm"
              />
            </div>
          </div>

          <div>
            <label htmlFor="image_url" className="block text-sm font-medium text-gray-700">
              Image URL
            </label>
            <input
              type="url"
              id="image_url"
              name="image_url"
              value={formData.image_url}
              onChange={handleChange}
              className="mt-1 block w-full rounded-lg border border-gray-200 px-3 py-2 text-gray-900 placeholder-gray-400 focus:border-[#4fcdc4] focus:outline-none focus:ring-[#4fcdc4] sm:text-sm"
              placeholder="https://example.com/image.jpg"
            />
          </div>

          <div>
            <label htmlFor="meeting_link" className="block text-sm font-medium text-gray-700">
              Meeting Link *
            </label>
            <div className="mt-1 space-y-2">
              <input
                type="url"
                id="meeting_link"
                name="meeting_link"
                required
                value={formData.meeting_link}
                onChange={handleChange}
                className="block w-full rounded-lg border border-gray-200 px-3 py-2 text-gray-900 placeholder-gray-400 focus:border-[#4fcdc4] focus:outline-none focus:ring-[#4fcdc4] sm:text-sm"
                placeholder="https://meet.google.com/xxx-xxxx-xxx"
              />
              <p className="text-sm text-gray-500">
                This link will be shared with registered participants 1 hour before the masterclass starts.
              </p>
            </div>
          </div>

          <div className="flex gap-4 pt-4">
            <Button
              type="submit"
              className="flex-1 bg-[#4FCDC4] hover:bg-[#4FCDC4]/90 text-white font-medium"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create Masterclass'
              )}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              className="flex-1"
            >
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
