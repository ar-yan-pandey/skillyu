'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Calendar, Clock, Plus, Share2 } from 'lucide-react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

interface Registration {
  id: string;
  status: string;
  payment_status: string;
  masterclass_id: string;
  masterclass_details?: {
    title: string;
    description: string;
    image_url: string;
    mentor_name: string;
    scheduled_date: string;
    scheduled_time: string;
    duration_minutes: number;
    category: string;
    meeting_link?: string;
  };
}

interface MentorMasterclass {
  id: string;
  title: string;
  description: string;
  image_url: string;
  category: string;
  start_time: string;
  end_time: string;
  meeting_link?: string;
  mentor_name: string;
  mentor_avatar?: string;
  price?: number;
  max_students?: number;
  status?: string;
}

export default function MyMasterclasses() {
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [mentorMasterclasses, setMentorMasterclasses] = useState<MentorMasterclass[]>([]);
  const [loading, setLoading] = useState(true);
  const [isMentor, setIsMentor] = useState(false);
  const router = useRouter();

  useEffect(() => {
    checkUserRoleAndFetchData();
  }, []);

  async function checkUserRoleAndFetchData() {
    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) {
        console.error('Session error:', sessionError);
        throw sessionError;
      }
      
      if (!session) {
        console.log('No session found, redirecting to login');
        router.push('/');
        return;
      }

      // Check user role
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', session.user.id)
        .single();

      if (profileError) {
        console.error('Error fetching profile:', profileError);
        throw profileError;
      }

      const userIsMentor = profile?.role === 'mentor';
      setIsMentor(userIsMentor);

      if (userIsMentor) {
        await fetchMentorMasterclasses(session.user.id);
      } else {
        await fetchRegistrations(session.user.id);
      }
    } catch (error) {
      console.error('Error in checkUserRoleAndFetchData:', error);
      toast.error('Failed to load your data');
    } finally {
      setLoading(false);
    }
  }

  async function fetchMentorMasterclasses(userId: string) {
    try {
      console.log('Fetching masterclasses for mentor:', userId);
      
      const { data, error } = await supabase
        .from('mentor_masterclasses')
        .select('*')
        .eq('mentor_id', userId);

      if (error) throw error;
      console.log('Found masterclasses:', data);

      const sortedData = (data || []).map(mc => ({
        ...mc,
        mentor_name: 'You'
      })).sort((a, b) => {
        const dateA = new Date(a.start_time);
        const dateB = new Date(b.start_time);
        return dateA.getTime() - dateB.getTime();
      });

      setMentorMasterclasses(sortedData);
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to load masterclasses');
      setMentorMasterclasses([]);
    }
  }

  async function fetchRegistrations(userId: string) {
    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) {
        console.error('Session error:', sessionError);
        throw sessionError;
      }
      
      if (!session) {
        console.log('No session found, redirecting to login');
        router.push('/');
        return;
      }

      console.log('Fetching registrations for user:', session.user.id);

      // Get all registrations
      const { data: regs, error: regError } = await supabase
        .from('masterclass_registrations')
        .select('id, status, payment_status, masterclass_id')
        .eq('user_id', session.user.id);

      if (regError) {
        console.error('Registration fetch error:', regError);
        throw regError;
      }

      if (!regs) {
        console.log('No registrations found');
        setRegistrations([]);
        return;
      }

      console.log('Found registrations:', regs);

      // Process each registration
      const registrationsWithDetails = await Promise.all(
        regs.map(async (reg) => {
          try {
            // Try regular masterclasses first
            let { data: masterclass, error: mcError } = await supabase
              .from('masterclasses')
              .select(`
                title,
                description,
                image_url,
                mentor_name,
                scheduled_date,
                scheduled_time,
                duration_minutes,
                category,
                meeting_link
              `)
              .eq('id', reg.masterclass_id)
              .single();

            // If not found in regular masterclasses, try mentor masterclasses
            if (!masterclass) {
              const { data: mentorMasterclass, error: mentorError } = await supabase
                .from('mentor_masterclasses')
                .select(`
                  title,
                  description,
                  image_url,
                  mentor_id,
                  start_time,
                  end_time,
                  category,
                  meeting_link,
                  profiles!mentor_id (
                    full_name
                  )
                `)
                .eq('id', reg.masterclass_id)
                .single();

              if (mentorMasterclass) {
                const startTime = new Date(mentorMasterclass.start_time);
                masterclass = {
                  title: mentorMasterclass.title,
                  description: mentorMasterclass.description,
                  image_url: mentorMasterclass.image_url,
                  mentor_name: mentorMasterclass.profiles?.full_name || 'Unknown Mentor',
                  scheduled_date: startTime.toISOString().split('T')[0],
                  scheduled_time: startTime.toTimeString().split(' ')[0],
                  duration_minutes: mentorMasterclass.end_time ? 
                    Math.round((new Date(mentorMasterclass.end_time).getTime() - startTime.getTime()) / (1000 * 60)) : 0,
                  category: mentorMasterclass.category,
                  meeting_link: mentorMasterclass.meeting_link,
                };
              }
            }

            if (!masterclass) {
              console.log('No masterclass found for registration:', reg.masterclass_id);
              return reg;
            }

            return {
              ...reg,
              masterclass_details: masterclass
            };
          } catch (error) {
            console.error('Error processing masterclass:', error);
            return reg;
          }
        })
      );

      console.log('Processed registrations:', registrationsWithDetails);

      // Sort registrations by date and time
      const sortedRegistrations = registrationsWithDetails.sort((a, b) => {
        if (!a.masterclass_details || !b.masterclass_details) return 0;
        
        const dateA = new Date(`${a.masterclass_details.scheduled_date}T${a.masterclass_details.scheduled_time}`);
        const dateB = new Date(`${b.masterclass_details.scheduled_date}T${b.masterclass_details.scheduled_time}`);
        const now = new Date();

        // If both are past or both are upcoming, sort by date
        const aIsPast = dateA < now;
        const bIsPast = dateB < now;

        if (aIsPast === bIsPast) {
          return dateA.getTime() - dateB.getTime();
        }

        // If one is past and other is upcoming, upcoming comes first
        return aIsPast ? 1 : -1;
      });

      setRegistrations(sortedRegistrations);
    } catch (error) {
      console.error('Error in fetchRegistrations:', error);
      toast.error('Failed to load your masterclasses');
      setRegistrations([]);
    }
  }

  function formatDate(date: string) {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  function formatTime(time: string) {
    if (time.includes('T')) {
      // Handle ISO string
      return new Date(time).toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });
    }
    return time.slice(0, 5); // Format HH:MM from HH:MM:SS
  }

  const handleShare = async (mc: any) => {
    try {
      const shareUrl = `${window.location.origin}/masterclass/${mc.id}`;
      await navigator.clipboard.writeText(shareUrl);
      toast.success('Link copied to clipboard!');
    } catch (error) {
      console.error('Error sharing:', error);
      toast.error('Failed to copy link');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#4FCDC4]"></div>
      </div>
    );
  }

  if (isMentor) {
    return (
      <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-2xl font-bold text-gray-900">My Masterclasses</h1>
            {isMentor && (
              <button
                onClick={() => router.push('/dashboard/my-masterclasses/create')}
                className="flex items-center gap-2 bg-[#4FCDC4] hover:bg-[#3fa89f] text-white px-4 py-2 rounded-md transition-colors"
              >
                <Plus className="h-5 w-5" />
                Create Masterclass
              </button>
            )}
          </div>

          {mentorMasterclasses.length === 0 ? (
            <div className="text-center py-12">
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Masterclasses Created</h3>
              <p className="text-gray-500">Start by creating your first masterclass!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6">
              {/* Upcoming Masterclasses */}
              {mentorMasterclasses.some(mc => new Date(mc.start_time) >= new Date()) && (
                <>
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">Upcoming Masterclasses</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                    {mentorMasterclasses.map((mc) => {
                      const startDate = new Date(mc.start_time);
                      if (startDate < new Date()) return null;

                      return (
                        <div
                          key={mc.id}
                          className="bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow"
                        >
                          <div className="relative h-48">
                            <Image
                              src={mc.image_url || '/placeholder-masterclass.jpg'}
                              alt={mc.title}
                              fill
                              className="object-cover"
                            />
                          </div>
                          <div className="p-4">
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">
                              {mc.title}
                            </h3>
                            <div className="space-y-2 text-sm text-gray-600">
                              <p className="line-clamp-2">{mc.description}</p>
                              <div className="pt-2 space-y-2 border-t">
                                <div className="flex items-center gap-2">
                                  <Calendar className="h-4 w-4 text-[#4FCDC4]" />
                                  <span>{formatDate(mc.start_time)}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Clock className="h-4 w-4 text-[#4FCDC4]" />
                                  <span>{formatTime(mc.start_time)}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span>Category:</span>
                                  <span className="capitalize">{mc.category}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span>Duration:</span>
                                  <span>{Math.round(
                                    (new Date(mc.end_time).getTime() - new Date(mc.start_time).getTime()) / (1000 * 60)
                                  )} minutes</span>
                                </div>
                                <div className="flex justify-between">
                                  <span>Price:</span>
                                  <span>₹{mc.price || 0}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                  <span>Status:</span>
                                  <div className="flex items-center gap-2">
                                    <span className="capitalize">{mc.status || 'draft'}</span>
                                    {isMentor && (
                                      <button
                                        type="button"
                                        onClick={() => handleShare(mc)}
                                        className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                                      >
                                        <Share2 className="h-5 w-5 text-gray-600" />
                                      </button>
                                    )}
                                  </div>
                                </div>
                                {!isMentor && (
                                  <>
                                    <div className="flex justify-between">
                                      <span>Time:</span>
                                      <span>
                                        {new Date(mc.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                      </span>
                                    </div>
                                    {(() => {
                                      const now = new Date();
                                      const startTime = new Date(mc.start_time);
                                      const oneHourBefore = new Date(startTime.getTime() - 60 * 60 * 1000);
                                      
                                      if (endTime < now) {
                                        return (
                                          <div className="text-gray-500 text-sm mt-2">
                                            This masterclass has ended
                                          </div>
                                        );
                                      } else if (now >= oneHourBefore && now <= endTime) {
                                        return (
                                          <a
                                            href={mc.meeting_link}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="block w-full mt-2 text-center bg-[#4FCDC4] hover:bg-[#3fa89f] text-white py-2 px-4 rounded transition-colors"
                                          >
                                            Join Now
                                          </a>
                                        );
                                      } else {
                                        return (
                                          <div className="text-gray-500 text-sm mt-2">
                                            Join link will be available 1 hour before the masterclass
                                          </div>
                                        );
                                      }
                                    })()}
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}

              {/* Past Masterclasses */}
              {mentorMasterclasses.some(mc => new Date(mc.start_time) < new Date()) && (
                <>
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">Past Masterclasses</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {mentorMasterclasses.map((mc) => {
                      const startDate = new Date(mc.start_time);
                      if (startDate >= new Date()) return null;

                      return (
                        <div
                          key={mc.id}
                          className="bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow opacity-75"
                        >
                          <div className="relative h-48">
                            <Image
                              src={mc.image_url || '/placeholder-masterclass.jpg'}
                              alt={mc.title}
                              fill
                              className="object-cover"
                            />
                          </div>
                          <div className="p-4">
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">
                              {mc.title}
                            </h3>
                            <div className="space-y-2 text-sm text-gray-600">
                              <p className="line-clamp-2">{mc.description}</p>
                              <div className="pt-2 space-y-2 border-t">
                                <div className="flex items-center gap-2">
                                  <Calendar className="h-4 w-4 text-[#4FCDC4]" />
                                  <span>{formatDate(mc.start_time)}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Clock className="h-4 w-4 text-[#4FCDC4]" />
                                  <span>{formatTime(mc.start_time)}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span>Category:</span>
                                  <span className="capitalize">{mc.category}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span>Duration:</span>
                                  <span>{Math.round(
                                    (new Date(mc.end_time).getTime() - new Date(mc.start_time).getTime()) / (1000 * 60)
                                  )} minutes</span>
                                </div>
                                <div className="flex justify-between">
                                  <span>Price:</span>
                                  <span>₹{mc.price || 0}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                  <span>Status:</span>
                                  <div className="flex items-center gap-2">
                                    <span className="capitalize">{mc.status || 'draft'}</span>
                                    {isMentor && (
                                      <button
                                        type="button"
                                        onClick={() => handleShare(mc)}
                                        className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                                      >
                                        <Share2 className="h-5 w-5 text-gray-600" />
                                      </button>
                                    )}
                                  </div>
                                </div>
                                {!isMentor && (
                                  <>
                                    <div className="flex justify-between">
                                      <span>Time:</span>
                                      <span>
                                        {new Date(mc.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                      </span>
                                    </div>
                                    <div className="text-gray-500 text-sm mt-2">
                                      This masterclass has ended
                                    </div>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900">My Registered Masterclasses</h1>
        </div>

        {registrations.length === 0 ? (
          <div className="text-center py-12">
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Masterclasses Found</h3>
            <p className="text-gray-500">You haven't registered for any masterclasses yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            {registrations.some(reg => {
              if (!reg.masterclass_details) return false;
              const classDate = new Date(`${reg.masterclass_details.scheduled_date}T${reg.masterclass_details.scheduled_time}`);
              return classDate >= new Date();
            }) && (
              <>
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Upcoming Masterclasses</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                  {registrations.map((reg) => {
                    if (!reg.masterclass_details) return null;
                    const classDate = new Date(`${reg.masterclass_details.scheduled_date}T${reg.masterclass_details.scheduled_time}`);
                    if (classDate < new Date()) return null;
                    
                    return (
                      <div
                        key={reg.id}
                        className="bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow"
                      >
                        <div className="relative h-48">
                          <Image
                            src={reg.masterclass_details.image_url || '/placeholder-masterclass.jpg'}
                            alt={reg.masterclass_details.title}
                            fill
                            className="object-cover"
                          />
                        </div>
                        <div className="p-4">
                          <h3 className="text-lg font-semibold text-gray-900 mb-2">
                            {reg.masterclass_details.title}
                          </h3>
                          <div className="space-y-2 text-sm text-gray-600">
                            <p className="line-clamp-2">{reg.masterclass_details.description}</p>
                            <div className="pt-2 space-y-2 border-t">
                              <div className="flex items-center gap-2">
                                <Calendar className="h-4 w-4 text-[#4FCDC4]" />
                                <span>{formatDate(reg.masterclass_details.scheduled_date)}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Clock className="h-4 w-4 text-[#4FCDC4]" />
                                <span>{formatTime(reg.masterclass_details.scheduled_time)}</span>
                              </div>
                              <div className="flex justify-between">
                                <span>Mentor:</span>
                                <span className="font-medium">{reg.masterclass_details.mentor_name}</span>
                              </div>
                              <div className="flex justify-between">
                                <span>Category:</span>
                                <span className="capitalize">{reg.masterclass_details.category}</span>
                              </div>
                              <div className="flex justify-between">
                                <span>Duration:</span>
                                <span>{reg.masterclass_details.duration_minutes} minutes</span>
                              </div>
                              <div className="flex justify-between">
                                <span>Status:</span>
                                <span className="capitalize">{reg.status}</span>
                              </div>
                              <div className="flex justify-between">
                                <span>Payment:</span>
                                <span className={`capitalize ${
                                  reg.payment_status === 'completed' || reg.payment_status === 'verified'
                                    ? 'text-green-600'
                                    : reg.payment_status === 'failed'
                                    ? 'text-red-600'
                                    : 'text-yellow-600'
                                }`}>
                                  {reg.payment_status}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span>Time:</span>
                                <span>
                                  {new Date(reg.masterclass_details.scheduled_date + 'T' + reg.masterclass_details.scheduled_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                              </div>
                              {(() => {
                                const now = new Date();
                                const startTime = new Date(reg.masterclass_details.scheduled_date + 'T' + reg.masterclass_details.scheduled_time);
                                const oneHourBefore = new Date(startTime.getTime() - 60 * 60 * 1000);
                                
                                if (startTime < now) {
                                  return (
                                    <div className="text-gray-500 text-sm mt-2">
                                      This masterclass has ended
                                    </div>
                                  );
                                } else if (now >= oneHourBefore && now <= startTime) {
                                  return (
                                    <a
                                      href={reg.masterclass_details.meeting_link}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="block w-full mt-2 text-center bg-[#4FCDC4] hover:bg-[#3fa89f] text-white py-2 px-4 rounded transition-colors"
                                    >
                                      Join Now
                                    </a>
                                  );
                                } else {
                                  return (
                                    <div className="text-gray-500 text-sm mt-2">
                                      Join link will be available 1 hour before the masterclass
                                    </div>
                                  );
                                }
                              })()}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}

            {registrations.some(reg => {
              if (!reg.masterclass_details) return false;
              const classDate = new Date(`${reg.masterclass_details.scheduled_date}T${reg.masterclass_details.scheduled_time}`);
              return classDate < new Date();
            }) && (
              <>
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Past Masterclasses</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {registrations.map((reg) => {
                    if (!reg.masterclass_details) return null;
                    const classDate = new Date(`${reg.masterclass_details.scheduled_date}T${reg.masterclass_details.scheduled_time}`);
                    if (classDate >= new Date()) return null;
                    
                    return (
                      <div
                        key={reg.id}
                        className="bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow opacity-75"
                      >
                        <div className="relative h-48">
                          <Image
                            src={reg.masterclass_details.image_url || '/placeholder-masterclass.jpg'}
                            alt={reg.masterclass_details.title}
                            fill
                            className="object-cover"
                          />
                        </div>
                        <div className="p-4">
                          <h3 className="text-lg font-semibold text-gray-900 mb-2">
                            {reg.masterclass_details.title}
                          </h3>
                          <div className="space-y-2 text-sm text-gray-600">
                            <p className="line-clamp-2">{reg.masterclass_details.description}</p>
                            <div className="pt-2 space-y-2 border-t">
                              <div className="flex items-center gap-2">
                                <Calendar className="h-4 w-4 text-[#4FCDC4]" />
                                <span>{formatDate(reg.masterclass_details.scheduled_date)}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Clock className="h-4 w-4 text-[#4FCDC4]" />
                                <span>{formatTime(reg.masterclass_details.scheduled_time)}</span>
                              </div>
                              <div className="flex justify-between">
                                <span>Mentor:</span>
                                <span className="font-medium">{reg.masterclass_details.mentor_name}</span>
                              </div>
                              <div className="flex justify-between">
                                <span>Category:</span>
                                <span className="capitalize">{reg.masterclass_details.category}</span>
                              </div>
                              <div className="flex justify-between">
                                <span>Duration:</span>
                                <span>{reg.masterclass_details.duration_minutes} minutes</span>
                              </div>
                              <div className="flex justify-between">
                                <span>Status:</span>
                                <span className="capitalize">{reg.status}</span>
                              </div>
                              <div className="flex justify-between">
                                <span>Payment:</span>
                                <span className={`capitalize ${
                                  reg.payment_status === 'completed' || reg.payment_status === 'verified'
                                    ? 'text-green-600'
                                    : reg.payment_status === 'failed'
                                    ? 'text-red-600'
                                    : 'text-yellow-600'
                                }`}>
                                  {reg.payment_status}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span>Time:</span>
                                <span>
                                  {new Date(reg.masterclass_details.scheduled_date + 'T' + reg.masterclass_details.scheduled_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                              </div>
                              <div className="text-gray-500 text-sm mt-2">
                                This masterclass has ended
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
