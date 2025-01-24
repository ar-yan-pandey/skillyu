'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { motion } from 'framer-motion';
import { Clock, BookOpen } from 'lucide-react';
import { toast } from 'sonner';
import Image from 'next/image';
import Link from 'next/link';

interface Masterclass {
  id: string;
  title: string;
  description: string;
  image_url: string;
  mentor_name: string;
  scheduled_date?: string;
  scheduled_time?: string;
  start_time?: string;
  duration_minutes?: number;
  category: string;
  is_mentor: boolean;
  status: string;
}

interface Metrics {
  totalRegistrations: number;
  confirmedRegistrations: number;
  completedRegistrations: number;
  totalHours: number;
  categories: { [key: string]: number };
  completedMasterclasses: Masterclass[];
  pendingMasterclasses: Masterclass[];
}

export default function MyTrackPage() {
  const router = useRouter();
  const [metrics, setMetrics] = useState<Metrics>({
    totalRegistrations: 0,
    confirmedRegistrations: 0,
    completedRegistrations: 0,
    totalHours: 0,
    categories: {},
    completedMasterclasses: [],
    pendingMasterclasses: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchMetrics() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          router.push('/');
          return;
        }

        // Get all registrations with their related masterclasses
        const { data: registrations, error } = await supabase
          .from('masterclass_registrations')
          .select(`
            *,
            masterclasses (
              id, title, description, image_url, mentor_name, 
              scheduled_date, scheduled_time, duration_minutes, category
            ),
            mentor_masterclasses (
              id, title, description, image_url, mentor_name,
              start_time, end_time, category
            )
          `)
          .eq('user_id', session.user.id);

        if (error) throw error;

        // Process registrations
        let totalMinutes = 0;
        const categories: { [key: string]: number } = {};
        
        // Separate completed and pending registrations
        const completedRegistrations = registrations.filter(r => 
          r.payment_status === 'completed' || r.payment_status === 'verified'
        );
        const pendingRegistrations = registrations.filter(r => 
          r.payment_status === 'pending'
        );

        // Process completed masterclasses
        const processedCompleted = completedRegistrations
          .map(reg => {
            const masterclass = reg.masterclasses || reg.mentor_masterclasses;
            if (!masterclass) return null;

            // Calculate duration
            if (reg.masterclasses) {
              totalMinutes += masterclass.duration_minutes || 0;
            } else if (reg.mentor_masterclasses && masterclass.start_time && masterclass.end_time) {
              const duration = Math.round(
                (new Date(masterclass.end_time).getTime() - new Date(masterclass.start_time).getTime()) / (1000 * 60)
              );
              totalMinutes += duration;
            }

            // Update categories count
            categories[masterclass.category] = (categories[masterclass.category] || 0) + 1;

            return {
              ...masterclass,
              is_mentor: !reg.masterclasses,
              status: 'completed'
            };
          })
          .filter(Boolean) as Masterclass[];

        // Process pending masterclasses
        const processedPending = pendingRegistrations
          .map(reg => {
            const masterclass = reg.masterclasses || reg.mentor_masterclasses;
            if (!masterclass) return null;

            return {
              ...masterclass,
              is_mentor: !reg.masterclasses,
              status: 'pending'
            };
          })
          .filter(Boolean) as Masterclass[];

        // Update metrics
        setMetrics({
          totalRegistrations: registrations.length,
          confirmedRegistrations: completedRegistrations.length,
          completedRegistrations: completedRegistrations.length,
          totalHours: Math.round(totalMinutes / 60),
          categories,
          completedMasterclasses: processedCompleted,
          pendingMasterclasses: processedPending
        });
      } catch (error) {
        console.error('Error:', error);
        toast.error('Failed to load your track metrics');
      } finally {
        setLoading(false);
      }
    }

    fetchMetrics();
  }, [router]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#4FCDC4]"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900">My Learning Track</h1>
          <p className="mt-2 text-gray-600">Track your progress and achievements</p>
        </div>

        {/* Top Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Total Registrations & Hours */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white p-6 rounded-2xl shadow-sm"
          >
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-[#4FCDC4]/10 rounded-full">
                  <BookOpen className="h-6 w-6 text-[#4FCDC4]" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">Masterclasses</h3>
                  <div className="mt-1 space-y-1">
                    <p className="text-sm text-gray-600">Total: {metrics.totalRegistrations}</p>
                    <p className="text-sm text-gray-600">Confirmed: {metrics.confirmedRegistrations}</p>
                    <p className="text-sm text-gray-600">Completed: {metrics.completedRegistrations}</p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Categories */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white p-6 rounded-2xl shadow-sm"
          >
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Categories</h2>
            <div className="space-y-3">
              {Object.entries(metrics.categories).map(([category, count]) => (
                <div key={category} className="flex justify-between items-center">
                  <span className="text-gray-600 capitalize">{category.replace('_', ' ')}</span>
                  <span className="text-lg font-semibold text-gray-900">{count}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Completed Masterclasses */}
        <div className="bg-white p-6 rounded-2xl shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">Completed Masterclasses</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {metrics.completedMasterclasses.map((masterclass) => (
              <Link
                key={masterclass.id}
                href={`/masterclass/${masterclass.id}`}
                className="block bg-white rounded-lg shadow overflow-hidden hover:shadow-md transition-shadow"
              >
                <div className="relative h-48 w-full">
                  {masterclass.image_url && (
                    <Image
                      src={masterclass.image_url}
                      alt={masterclass.title}
                      fill
                      className="object-cover"
                    />
                  )}
                </div>
                <div className="p-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">{masterclass.title}</h3>
                  <p className="text-sm text-gray-600 mb-2">by {masterclass.mentor_name}</p>
                  <div className="flex items-center text-sm text-gray-500">
                    <Clock className="h-4 w-4 mr-1" />
                    <span>
                      {masterclass.scheduled_date
                        ? new Date(masterclass.scheduled_date).toLocaleDateString()
                        : 'Date TBD'}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Pending Masterclasses */}
        <div className="bg-white p-6 rounded-2xl shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">Pending Masterclasses</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {metrics.pendingMasterclasses.map((masterclass) => (
              <Link
                key={masterclass.id}
                href={`/masterclass/${masterclass.id}`}
                className="block bg-white rounded-lg shadow overflow-hidden hover:shadow-md transition-shadow"
              >
                <div className="relative h-48 w-full">
                  {masterclass.image_url && (
                    <Image
                      src={masterclass.image_url}
                      alt={masterclass.title}
                      fill
                      className="object-cover"
                    />
                  )}
                </div>
                <div className="p-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">{masterclass.title}</h3>
                  <p className="text-sm text-gray-600 mb-2">by {masterclass.mentor_name}</p>
                  <div className="flex items-center text-sm text-gray-500">
                    <Clock className="h-4 w-4 mr-1" />
                    <span>
                      {masterclass.scheduled_date
                        ? new Date(masterclass.scheduled_date).toLocaleDateString()
                        : 'Date TBD'}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
