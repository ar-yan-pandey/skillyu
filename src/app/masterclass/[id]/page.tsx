'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Button } from '@/components/ui/button';
import { Loader2, Share2 } from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import PaymentModal from '@/components/PaymentModal';
import { supabase } from '@/lib/supabase';
import { Calendar, Clock, User, CreditCard, BookOpen, Home, GraduationCap, Users2 } from 'lucide-react';
import Image from 'next/image';
import React from 'react';

interface Prerequisites {
  required: string[];
  recommended: string[];
}

interface BaseMasterclass {
  id: string;
  title: string;
  description: string;
  mentor_name: string;
  image_url: string | null;
  category: string;
  tags: string[] | null;
  prerequisites?: Prerequisites | null;
}

interface RegularMasterclass extends BaseMasterclass {
  type: 'regular';
  fee: number | null;
  scheduled_date: string;
  scheduled_time: string;
  duration_minutes: number;
  meeting_link: string | null;
}

interface MentorMasterclass extends BaseMasterclass {
  type: 'mentor';
  price: number;
  start_time: string;
  end_time: string;
  max_participants: number;
  current_participants: number;
  status: string;
}

type Masterclass = RegularMasterclass | MentorMasterclass;

type PaymentStatus = 'pending' | 'completed' | 'failed';

interface Registration {
  status: string;
  payment_status: PaymentStatus;
}

const defaultPrerequisites: Prerequisites = {
  required: [],
  recommended: []
};

const defaultMasterclass: RegularMasterclass = {
  id: '',
  title: '',
  description: '',
  mentor_name: '',
  type: 'regular',
  fee: null,
  prerequisites: defaultPrerequisites,
  scheduled_date: '',
  scheduled_time: '',
  duration_minutes: 0,
  image_url: null,
  meeting_link: null,
  category: '',
  tags: []
};

const formatDuration = (minutes: number): string => {
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  
  if (hours === 0) {
    return `${remainingMinutes} minutes`;
  } else if (remainingMinutes === 0) {
    return `${hours} hour${hours > 1 ? 's' : ''}`;
  } else {
    return `${hours} hour${hours > 1 ? 's' : ''} ${remainingMinutes} minutes`;
  }
};

const formatDate = (dateStr: string) => {
  return new Date(dateStr).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

const formatTime = (timeStr: string) => {
  return new Date(`1970-01-01T${timeStr}`).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });
};

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { 
    opacity: 1,
    transition: { duration: 0.5 }
  }
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: { 
    y: 0, 
    opacity: 1,
    transition: { duration: 0.5 }
  }
};

export default function MasterclassDetails() {
  const params = useParams();
  const masterclassId = params?.id as string;
  const router = useRouter();
  const [masterclass, setMasterclass] = useState<Masterclass | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [imageLoading, setImageLoading] = useState(true);
  const [isRegistered, setIsRegistered] = useState(false);
  const [prerequisites, setPrerequisites] = useState<Prerequisites>(defaultPrerequisites);
  const [countdown, setCountdown] = useState<{ days: number; hours: number; minutes: number; seconds: number } | null>(null);
  const [hasPassed, setHasPassed] = useState(false);
  const [isMentor, setIsMentor] = useState(false);
  const [registrationCount, setRegistrationCount] = useState(0);
  const [showPayment, setShowPayment] = useState(false);
  const [registering, setRegistering] = useState(false);
  const [withdrawing, setWithdrawing] = useState(false);
  const [registrationStatus, setRegistrationStatus] = useState<string | null>(null);
  const hasRequiredPrerequisites = prerequisites?.required?.length > 0;
  const hasRecommendedPrerequisites = prerequisites?.recommended?.length > 0;

  useEffect(() => {
    const fetchMasterclassDetails = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const id = masterclassId;
        if (!id) {
          throw new Error('No masterclass ID provided');
        }
        
        // Try to fetch from regular masterclasses first
        let { data: regularData, error: regularError } = await supabase
          .from('masterclasses')
          .select('*')
          .eq('id', id)
          .single();

        if (regularError && regularError.code !== 'PGRST116') {
          throw regularError;
        }

        if (regularData) {
          const processedData: RegularMasterclass = {
            ...regularData,
            type: 'regular',
            prerequisites: regularData.prerequisites || defaultPrerequisites,
            meeting_link: regularData.meeting_link || null,
            tags: Array.isArray(regularData.tags) ? regularData.tags : [],
            image_url: regularData.image_url || '/placeholder-masterclass.jpg',
            fee: Number(regularData.fee || 0)
          };
          setMasterclass(processedData);
          setPrerequisites(processedData.prerequisites || defaultPrerequisites);
        } else {
          // If not found in regular masterclasses, try mentor masterclasses
          const { data: mentorData, error: mentorError } = await supabase
            .from('mentor_masterclasses')
            .select(`
              *,
              profiles:mentor_id (
                full_name
              )
            `)
            .eq('id', id)
            .single();

          if (mentorError) {
            throw mentorError;
          }

          if (mentorData) {
            const processedData: MentorMasterclass = {
              id: mentorData.id,
              title: mentorData.title,
              description: mentorData.description,
              mentor_name: mentorData.profiles?.full_name || 'Unknown Mentor',
              image_url: mentorData.image_url || '/placeholder-masterclass.jpg',
              category: mentorData.category,
              tags: Array.isArray(mentorData.tags) ? mentorData.tags : [],
              prerequisites: mentorData.prerequisites || defaultPrerequisites,
              type: 'mentor',
              price: Number(mentorData.price || 0),
              start_time: mentorData.start_time,
              end_time: mentorData.end_time,
              max_participants: mentorData.max_participants,
              current_participants: mentorData.current_participants,
              status: mentorData.status
            };
            setMasterclass(processedData);
            setPrerequisites(processedData.prerequisites || defaultPrerequisites);
          } else {
            throw new Error(`Masterclass not found with ID: ${id}`);
          }
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to load masterclass details';
        console.error('Error in fetchMasterclassDetails:', err);
        setError(errorMessage);
        toast.error(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    fetchMasterclassDetails();
  }, [masterclassId]);

  useEffect(() => {
    async function checkRegistrationStatus() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;

        if (!masterclass) return;

        const { data: existingReg } = await supabase
          .from('masterclass_registrations')
          .select('id, status, payment_status')
          .eq('user_id', session.user.id)
          .eq('masterclass_id', masterclassId)
          .single();

        setIsRegistered(!!existingReg);
        setRegistrationStatus(
          existingReg?.payment_status === 'pending' 
            ? 'Payment Verification Pending'
            : existingReg?.status
        );
      } catch (error) {
        console.error('Error checking registration status:', error);
        setIsRegistered(false);
      }
    }

    checkRegistrationStatus();
  }, [masterclassId, masterclass]);

  useEffect(() => {
    async function checkMentorStatus() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          setIsMentor(false);
          return;
        }

        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', session.user.id)
          .single();

        if (profileError) {
          if (profileError.code !== 'PGRST116') {
            console.error('Error checking profile:', profileError);
          }
          setIsMentor(false);
          return;
        }

        setIsMentor(profileData?.role === 'mentor');
      } catch (error) {
        console.error('Error checking mentor status:', error);
        setIsMentor(false);
      }
    }

    checkMentorStatus();
  }, []);

  useEffect(() => {
    async function checkRegistrationCount() {
      if (!masterclass) return;

      try {
        let count = 0;
        const { count: regCount, error } = await supabase
          .from('masterclass_registrations')
          .select('id', { count: 'exact' })
          .eq('masterclass_id', masterclassId)
          .eq('status', 'registered');

        if (error) {
          console.error('Error checking registration count:', error);
          return;
        }
        count = regCount || 0;
        setRegistrationCount(count);
      } catch (error) {
        console.error('Error checking registration count:', error);
      }
    }

    checkRegistrationCount();
  }, [masterclassId, masterclass]);

  useEffect(() => {
    if (!masterclass) return;

    const updateCountdown = () => {
      const targetDate = new Date(
        masterclass.type === 'regular'
          ? `${masterclass.scheduled_date} ${masterclass.scheduled_time}`
          : masterclass.start_time
      );
      const now = new Date();
      const difference = targetDate.getTime() - now.getTime();

      if (difference <= 0) {
        setHasPassed(true);
        setCountdown(null);
        return;
      }

      const days = Math.floor(difference / (1000 * 60 * 60 * 24));
      const hours = Math.floor((difference / (1000 * 60 * 60)) % 24);
      const minutes = Math.floor((difference / 1000 / 60) % 60);
      const seconds = Math.floor((difference / 1000) % 60);

      setCountdown({ days, hours, minutes, seconds });
      setHasPassed(false);
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);

    return () => clearInterval(interval);
  }, [masterclass]);

  const handleRegister = async () => {
    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) throw sessionError;
      if (!session) {
        // Redirect to root (login) page with return URL
        const returnUrl = `/masterclass/${params.id}`;
        router.push(`/?returnUrl=${encodeURIComponent(returnUrl)}`);
        return;
      }

      setShowPayment(true);
    } catch (err) {
      console.error('Error starting registration:', err);
      setError('Failed to start registration process');
    }
  };

  const handleWithdraw = async () => {
    try {
      setWithdrawing(true);

      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user?.id) {
        router.push('/auth');
        return;
      }

      // Check if it's a mentor masterclass
      const { data: mentorMasterclass } = await supabase
        .from('mentor_masterclasses')
        .select('*')
        .eq('id', masterclassId)
        .maybeSingle();

      // Delete from masterclass_registrations
      const { error: deleteError } = await supabase
        .from('masterclass_registrations')
        .delete()
        .eq('user_id', session.user.id)
        .eq('masterclass_id', masterclassId);

      if (deleteError) {
        console.error('Withdrawal error:', deleteError);
        toast.error('Failed to withdraw from masterclass');
        return;
      }

      // Update participant count for mentor masterclass
      if (mentorMasterclass) {
        const { error: updateError } = await supabase
          .from('mentor_masterclasses')
          .update({ 
            current_participants: Math.max(0, mentorMasterclass.current_participants - 1)
          })
          .eq('id', masterclassId);

        if (updateError) {
          console.error('Failed to update participant count:', updateError);
        }
      }

      setIsRegistered(false);
      toast.success('Successfully withdrawn from masterclass');
    } catch (error) {
      console.error('Error:', error);
      toast.error('An error occurred while withdrawing');
    } finally {
      setWithdrawing(false);
    }
  };

  const handlePaymentSubmit = async (transactionId: string | null) => {
    if (!masterclass) return;

    try {
      setRegistering(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const amount = masterclass.type === 'regular' ? masterclass.fee : masterclass.price;

      // Insert registration with payment details
      const { error: regError } = await supabase
        .from('masterclass_registrations')
        .insert({
          user_id: session.user.id,
          masterclass_id: masterclass.id,
          status: 'registered',
          payment_status: amount === 0 ? 'completed' : 'pending',
          transaction_id: transactionId,
          payment_amount: amount,
          payment_date: new Date().toISOString()
        });

      if (regError) throw regError;

      setIsRegistered(true);
      setRegistrationStatus(
        amount === 0 ? 'Registered' : 'Payment Verification Pending'
      );
      setShowPayment(false);
      router.refresh();
    } catch (err) {
      console.error('Error registering:', err);
      setError('Failed to complete registration');
    } finally {
      setRegistering(false);
    }
  };

  const handleShare = async () => {
    try {
      const shareUrl = window.location.href;
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
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#4fcdc4]"></div>
      </div>
    );
  }

  if (error || !masterclass) {
    return (
      <div className="min-h-screen bg-gray-50 py-8 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Error</h1>
          <p className="text-gray-600 mb-6">{error || 'Masterclass not found'}</p>
          <Button onClick={() => router.push('/')} variant="outline">
            Go Home
          </Button>
        </div>
      </div>
    );
  }

  return (
    <AnimatePresence mode="wait">
      <motion.div 
        key="masterclass-details"
        initial="hidden"
        animate="visible"
        variants={containerVariants}
        className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8"
      >
        <div className="max-w-6xl mx-auto space-y-6">
          <div className="grid lg:grid-cols-5 gap-6 items-center">
            {/* Left side - Image Card */}
            <motion.div 
              variants={containerVariants}
              className="lg:col-span-2 flex items-center justify-center"
            >
              <div className="bg-white rounded-2xl shadow-lg overflow-hidden max-w-md w-full">
                <div className="relative aspect-square w-full">
                  <Image
                    src={masterclass.image_url || '/placeholder-masterclass.jpg'}
                    alt={masterclass.title}
                    fill
                    className={cn(
                      "object-cover transition-opacity duration-300",
                      imageLoading ? "opacity-0" : "opacity-100"
                    )}
                    onLoad={() => setImageLoading(false)}
                    priority
                  />
                  {imageLoading && (
                    <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#4FCDC4]"></div>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>

            {/* Right side - Content Card */}
            <motion.div 
              variants={containerVariants}
              className="lg:col-span-3 bg-white rounded-2xl shadow-lg h-fit"
            >
              <div className="p-6">
                {/* Title section */}
                <motion.h1 
                  variants={itemVariants}
                  className="text-2xl font-bold mb-2 text-gray-900"
                >
                  {masterclass.title}
                </motion.h1>
                <motion.div 
                  variants={itemVariants}
                  className="flex items-center gap-2 text-sm mb-4"
                >
                  <span className="px-2 py-0.5 bg-[#4FCDC4]/20 text-[#4FCDC4] rounded-full">
                    {masterclass.type === 'mentor' ? 'MENTOR CLASS' : 'MASTERCLASS'}
                  </span>
                  <span className="px-2 py-0.5 bg-gray-100 text-gray-800 rounded-full">
                    {masterclass.category}
                  </span>
                </motion.div>

                {/* Countdown Timer */}
                {countdown && (
                  <motion.div 
                    variants={itemVariants}
                    className="bg-[#4FCDC4]/5 rounded-lg p-4 mb-6"
                  >
                    <h3 className="text-sm font-medium text-[#4FCDC4] mb-3">Time until masterclass starts:</h3>
                    <div className="grid grid-cols-4 gap-2 text-center">
                      <div className="bg-white rounded-lg p-2 shadow-sm">
                        <div className="text-xl font-bold text-[#4FCDC4]">{countdown.days}</div>
                        <div className="text-xs text-gray-500">Days</div>
                      </div>
                      <div className="bg-white rounded-lg p-2 shadow-sm">
                        <div className="text-xl font-bold text-[#4FCDC4]">{countdown.hours}</div>
                        <div className="text-xs text-gray-500">Hours</div>
                      </div>
                      <div className="bg-white rounded-lg p-2 shadow-sm">
                        <div className="text-xl font-bold text-[#4FCDC4]">{countdown.minutes}</div>
                        <div className="text-xs text-gray-500">Minutes</div>
                      </div>
                      <div className="bg-white rounded-lg p-2 shadow-sm">
                        <div className="text-xl font-bold text-[#4FCDC4]">{countdown.seconds}</div>
                        <div className="text-xs text-gray-500">Seconds</div>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* Main content */}
                <motion.div 
                  variants={itemVariants}
                  className="space-y-4"
                >
                  {/* Quick Info */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-gray-500" />
                      <div>
                        <p className="text-sm font-medium">Date</p>
                        <p className="text-sm text-gray-500">
                          {masterclass?.type === 'regular'
                            ? formatDate(masterclass.scheduled_date)
                            : formatDate(masterclass.start_time)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-gray-500" />
                      <div>
                        <p className="text-sm font-medium">Time</p>
                        <p className="text-sm text-gray-500">
                          {masterclass?.type === 'regular'
                            ? formatTime(masterclass.scheduled_time)
                            : `${formatTime(masterclass.start_time?.split('T')[1])} - ${formatTime(masterclass.end_time?.split('T')[1])}`}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <CreditCard className="h-4 w-4 text-gray-500" />
                      <div>
                        <p className="text-sm font-medium">Fee</p>
                        <p className="text-sm text-gray-500">₹{masterclass?.price || masterclass?.fee || 0}</p>
                      </div>
                    </div>
                  </div>

                  {masterclass?.type === 'regular' && (
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <Clock className="h-4 w-4" />
                      <span>Duration: {formatDuration(masterclass.duration_minutes)}</span>
                    </div>
                  )}

                  {/* Instructor */}
                  <div>
                    <h2 className="text-base font-semibold mb-2">Instructor</h2>
                    <div className="flex items-center gap-3 p-2 bg-gray-50 rounded-lg">
                      <div className="w-8 h-8 bg-[#4FCDC4]/20 rounded-full flex items-center justify-center">
                        <User className="h-4 w-4 text-[#4FCDC4]" />
                      </div>
                      <div>
                        <h3 className="font-medium text-sm text-gray-900">{masterclass.mentor_name}</h3>
                        <p className="text-xs text-gray-500">Expert Instructor</p>
                      </div>
                    </div>
                  </div>

                  {/* Description */}
                  <div>
                    <h2 className="text-base font-semibold mb-2">About this Masterclass</h2>
                    <p className="text-sm text-gray-600">{masterclass.description}</p>
                  </div>

                  {/* Prerequisites - Only for regular masterclasses */}
                  {masterclass.type === 'regular' && (hasRequiredPrerequisites || hasRecommendedPrerequisites) && (
                    <div>
                      <h2 className="text-base font-semibold mb-2">Prerequisites</h2>
                      <div className="space-y-2">
                        {hasRequiredPrerequisites && (
                          <div className="bg-red-50 p-2 rounded-lg">
                            <h3 className="text-xs font-medium text-red-800 mb-1">Required:</h3>
                            <ul className="list-disc list-inside text-red-700 space-y-0.5 text-xs">
                              {prerequisites.required.map((req, i) => (
                                <li key={i}>{req}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                        {hasRecommendedPrerequisites && (
                          <div className="bg-[#4FCDC4]/10 p-2 rounded-lg">
                            <h3 className="text-xs font-medium text-[#4FCDC4] mb-1">Recommended:</h3>
                            <ul className="list-disc list-inside text-[#4FCDC4] space-y-0.5 text-xs">
                              {prerequisites.recommended.map((rec, i) => (
                                <li key={i}>{rec}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Topics */}
                  {masterclass.tags && masterclass.tags.length > 0 && (
                    <div>
                      <h2 className="text-base font-semibold mb-2">Topics Covered</h2>
                      <div className="flex flex-wrap gap-1.5">
                        {masterclass.tags.map((tag, index) => (
                          <span
                            key={index}
                            className="px-2 py-0.5 bg-gray-100 text-gray-800 rounded-full text-xs"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex flex-col gap-4 pt-3 mt-4 border-t">
                    <div className="flex gap-2">
                      {isMentor ? (
                        <Button
                          disabled
                          className="flex-1 bg-gray-100 text-gray-600 cursor-not-allowed"
                        >
                          Mentors cannot register for masterclasses
                        </Button>
                      ) : hasPassed ? (
                        <Button
                          disabled
                          className="flex-1 bg-gray-400 text-white h-9 cursor-not-allowed"
                        >
                          Registrations Closed
                        </Button>
                      ) : isRegistered ? (
                        <Button
                          onClick={handleWithdraw}
                          disabled={withdrawing}
                          className="flex-1 bg-red-500 hover:bg-red-600 text-white h-9"
                        >
                          {withdrawing ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Withdrawing...
                            </>
                          ) : (
                            'Withdraw from Masterclass'
                          )}
                        </Button>
                      ) : (
                        <Button
                          onClick={handleRegister}
                          disabled={registering}
                          className="flex-1 bg-[#4FCDC4] hover:bg-[#4FCDC4]/90 text-white h-9"
                        >
                          {registering ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Registering...
                            </>
                          ) : (
                            <>Register {masterclass?.type === 'regular' ? 
                              `(₹${masterclass.fee || 0})` : 
                              `(₹${masterclass.price || 0})`}</>
                          )}
                        </Button>
                      )}

                      <Button 
                        onClick={handleShare}
                        variant="outline" 
                        className="flex items-center gap-2"
                      >
                        <Share2 className="h-4 w-4" />
                        Share
                      </Button>
                    </div>

                    {isRegistered && registrationStatus === 'Payment Verification Pending' && (
                      <p className="text-center text-yellow-600 text-sm">
                        Payment verification pending. We'll notify you once verified.
                      </p>
                    )}
                  </div>
                </motion.div>
              </div>
            </motion.div>
          </div>

          {/* Navigation Buttons */}
          <motion.div 
            variants={containerVariants}
            className="flex flex-col sm:flex-row gap-3 justify-center items-center pt-4"
          >
            <Button
              variant="outline"
              className="w-full sm:w-auto flex items-center gap-2 bg-white"
              onClick={() => router.push('/dashboard/my-masterclasses')}
            >
              <BookOpen className="h-4 w-4" />
              My Masterclasses
            </Button>
            <Button
              variant="outline"
              className="w-full sm:w-auto flex items-center gap-2 bg-white"
              onClick={() => router.push('/')}
            >
              <Home className="h-4 w-4" />
              Browse All Masterclasses
            </Button>
            <Button
              variant="outline"
              className="w-full sm:w-auto flex items-center gap-2 bg-white"
              onClick={() => router.push('/dashboard/my-track')}
            >
              <GraduationCap className="h-4 w-4" />
              My Track
            </Button>
          </motion.div>
        </div>
      </motion.div>
      <PaymentModal
        isOpen={showPayment}
        onClose={() => setShowPayment(false)}
        amount={Number(masterclass?.type === 'regular' ? masterclass.fee : masterclass?.price || 0)}
        masterclassTitle={masterclass?.title || ''}
        onSubmit={handlePaymentSubmit}
      />
    </AnimatePresence>
  );
}
