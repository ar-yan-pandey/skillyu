'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { Search, Clock, Calendar, IndianRupee, BadgeCheck } from 'lucide-react'
import { debounce } from 'lodash'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

interface Masterclass {
  id: string
  title: string
  mentor_name: string
  scheduled_date?: string
  scheduled_time?: string
  start_time?: string
  end_time?: string
  tags: string[]
  category: MasterclassCategory
  status: 'upcoming' | 'past' | 'draft' | 'published'
  image_url: string
  is_free: boolean
  fee?: number
  price?: number
  description: string
  max_participants?: number
  current_participants?: number
  type: 'regular' | 'mentor'
}

enum MasterclassCategory {
  TECHNOLOGY = 'technology',
  BUSINESS = 'business',
  DESIGN = 'design',
  MARKETING = 'marketing',
  PERSONAL_DEVELOPMENT = 'personal_development'
}

export default function DashboardPage() {
  const router = useRouter()
  const [masterclasses, setMasterclasses] = useState<Masterclass[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState<MasterclassCategory | 'all'>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('')

  // Debounce search query updates
  const debouncedSetSearchQuery = useCallback(
    debounce((value: string) => {
      setDebouncedSearchQuery(value)
    }, 300),
    []
  )

  // Handle search input
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setSearchQuery(value)
    debouncedSetSearchQuery(value)
  }

  // Memoize filtered masterclasses
  const filteredMasterclasses = useMemo(() => {
    return masterclasses.filter(mc => {
      const matchesCategory = selectedCategory === 'all' || mc.category === selectedCategory
      const searchTerm = (debouncedSearchQuery || '').toLowerCase()
      const matchesSearch = !debouncedSearchQuery || 
        (mc.title?.toLowerCase() || '').includes(searchTerm) ||
        (mc.mentor_name?.toLowerCase() || '').includes(searchTerm) ||
        (mc.tags || []).some(tag => (tag?.toLowerCase() || '').includes(searchTerm))
      
      return matchesCategory && matchesSearch
    })
  }, [masterclasses, selectedCategory, debouncedSearchQuery])

  // Memoize category counts
  const categoryCounts = useMemo(() => {
    const counts = new Map<MasterclassCategory | 'all', number>()
    counts.set('all', masterclasses.length)
    
    Object.values(MasterclassCategory).forEach(category => {
      counts.set(category, masterclasses.filter(mc => mc.category === category).length)
    })
    
    return counts
  }, [masterclasses])

  useEffect(() => {
    const fetchMasterclasses = async () => {
      try {
        setLoading(true)
        console.log('Fetching masterclasses...');
        
        // Fetch regular masterclasses
        const { data: regularData, error: regularError } = await supabase
          .from('masterclasses')
          .select('*')
          .order('scheduled_date', { ascending: true });

        if (regularError) {
          console.error('Error fetching regular masterclasses:', regularError);
          toast.error('Failed to load regular masterclasses');
          return;
        }

        // Fetch mentor masterclasses
        const { data: mentorData, error: mentorError } = await supabase
          .from('mentor_masterclasses')
          .select(`
            id,
            title,
            description,
            category,
            image_url,
            start_time,
            end_time,
            max_participants,
            current_participants,
            price,
            status,
            profiles:mentor_id (
              full_name
            )
          `)
          .eq('status', 'published')
          .order('start_time', { ascending: true });

        if (mentorError) {
          console.error('Error fetching mentor masterclasses:', mentorError);
          toast.error('Failed to load mentor masterclasses');
          return;
        }

        // Process regular masterclasses
        const processedRegularData = (regularData || []).map(mc => ({
          ...mc,
          image_url: mc.image_url || '/placeholder-masterclass.jpg',
          is_free: mc.fee === null,
          status: new Date(mc.scheduled_date + ' ' + mc.scheduled_time) > new Date() ? 'upcoming' : 'past',
          type: 'regular' as const
        }));

        // Process mentor masterclasses
        const processedMentorData = (mentorData || []).map(mc => ({
          ...mc,
          mentor_name: mc.profiles?.full_name || 'Unknown Mentor',
          image_url: mc.image_url || '/placeholder-masterclass.jpg',
          is_free: mc.price === 0,
          fee: mc.price,
          status: new Date(mc.start_time) > new Date() ? 'upcoming' : 'past',
          type: 'mentor' as const,
          tags: [] // Add any tags if needed
        }));

        // Combine and set all masterclasses
        const allMasterclasses = [...processedRegularData, ...processedMentorData];
        console.log('All masterclasses:', allMasterclasses);
        setMasterclasses(allMasterclasses);
      } catch (error) {
        console.error('Error in fetchMasterclasses:', error);
        toast.error('Failed to load masterclasses');
      } finally {
        setLoading(false);
      }
    };

    fetchMasterclasses();
  }, []);

  const handleMasterclassClick = (masterclass: Masterclass) => {
    console.log('Navigating to masterclass:', masterclass.id);
    router.push(`/masterclass/${masterclass.id}`);
  };

  const upcomingMasterclasses = filteredMasterclasses.filter(mc => mc.status === 'upcoming')
  const pastMasterclasses = filteredMasterclasses.filter(mc => mc.status === 'past')

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#4fcdc4]"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Search and Categories Section */}
      <div className="bg-white rounded-xl shadow-sm">
        <div className="p-6 border-b border-gray-100">
          <div className="flex flex-col md:flex-row md:items-center gap-4 justify-between">
            <div className="flex-1 max-w-2xl">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="search"
                  placeholder="Search masterclasses by title, mentor, or tags..."
                  className="block w-full pl-10 pr-3 py-3 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#4fcdc4] focus:border-transparent transition-all"
                  value={searchQuery}
                  onChange={handleSearchChange}
                />
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <span className="whitespace-nowrap">{filteredMasterclasses.length} masterclasses available</span>
            </div>
          </div>
        </div>

        <div className="p-4 overflow-x-auto">
          <div className="flex gap-2 min-w-max px-2">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-4 py-2 rounded-lg transition-all ${
                selectedCategory === 'all'
                  ? 'bg-[#0f1c36] text-white shadow-md'
                  : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
              }`}
            >
              All Categories
              <span className="ml-2 text-sm opacity-75">({categoryCounts.get('all')})</span>
            </button>
            {Object.values(MasterclassCategory).map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-4 py-2 rounded-lg transition-all whitespace-nowrap ${
                  selectedCategory === category
                    ? 'bg-[#0f1c36] text-white shadow-md'
                    : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                }`}
              >
                {category.charAt(0).toUpperCase() + category.slice(1).replace(/_/g, ' ')}
                <span className="ml-2 text-sm opacity-75">({categoryCounts.get(category)})</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Upcoming Masterclasses */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="text-xl font-semibold mb-4">Upcoming Masterclasses</h2>
        {upcomingMasterclasses.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No upcoming masterclasses found</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {upcomingMasterclasses.map((masterclass) => (
              <div
                key={masterclass.id}
                onClick={() => handleMasterclassClick(masterclass)}
                className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-all group cursor-pointer"
              >
                {/* Image Section */}
                <div className="relative aspect-[4/3] overflow-hidden">
                  <Image
                    src={masterclass.image_url || '/placeholder-masterclass.jpg'}
                    alt={masterclass.title}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute top-2 left-2 flex gap-1">
                    <span className="px-1.5 py-0.5 bg-[#4fcdc4] text-white text-[10px] font-medium rounded">
                      {masterclass.category.charAt(0).toUpperCase() + masterclass.category.slice(1).replace(/_/g, ' ')}
                    </span>
                    {masterclass.is_free && (
                      <span className="px-1.5 py-0.5 bg-green-100 text-green-700 text-[10px] font-medium rounded">
                        Free
                      </span>
                    )}
                    {masterclass.type === 'mentor' && (
                      <span className="px-1.5 py-0.5 bg-blue-100 text-blue-700 text-[10px] font-medium rounded">
                        Mentor Class
                      </span>
                    )}
                  </div>
                  {!masterclass.is_free && (
                    <div className="absolute top-2 right-2">
                      <span className="px-1.5 py-0.5 bg-blue-100 text-blue-700 text-[10px] font-medium rounded flex items-center gap-0.5">
                        <IndianRupee className="h-2.5 w-2.5" />
                        {masterclass.fee || masterclass.price}
                      </span>
                    </div>
                  )}
                </div>

                <div className="p-2.5">
                  {/* Date and Time */}
                  <div className="flex items-center gap-1 text-[10px] text-gray-500 mb-1.5">
                    <Calendar className="h-3 w-3" />
                    <span>
                      {masterclass.type === 'mentor'
                        ? new Date(masterclass.start_time!).toLocaleString(undefined, {
                            dateStyle: 'medium',
                            timeStyle: 'short'
                          })
                        : new Date(masterclass.scheduled_date + ' ' + masterclass.scheduled_time).toLocaleString(undefined, {
                            dateStyle: 'medium',
                            timeStyle: 'short'
                          })}
                    </span>
                  </div>

                  {/* Title and Mentor */}
                  <h3 className="text-xs font-semibold text-gray-900 mb-1.5 line-clamp-2 group-hover:text-[#4fcdc4] transition-colors">
                    {masterclass.title}
                  </h3>

                  <div className="flex items-center gap-1.5 mb-2">
                    <div className="relative w-5 h-5 rounded-full bg-gray-100 flex items-center justify-center text-[#4fcdc4] text-[10px] font-medium">
                      {(masterclass.mentor_name || 'M').charAt(0).toUpperCase()}
                      {masterclass.type === 'regular' && (
                        <div className="absolute -bottom-0.5 -right-0.5">
                          <BadgeCheck className="h-2.5 w-2.5 text-blue-500 fill-white" />
                        </div>
                      )}
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-900 font-medium flex items-center gap-1">
                        {masterclass.mentor_name || 'Mentor Name'}
                      </p>
                      <p className="text-[8px] text-gray-500">Mentor</p>
                    </div>
                  </div>

                  {/* Action Button */}
                  <button className="w-full px-2.5 py-1 bg-[#0f1c36] hover:bg-[#162844] text-white rounded transition-colors flex items-center justify-center gap-1 text-xs">
                    {!masterclass.is_free && <IndianRupee className="h-2.5 w-2.5" />}
                    Join Now
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Past Masterclasses */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="text-xl font-semibold mb-4">Past Masterclasses</h2>
        {pastMasterclasses.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No past masterclasses found</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {pastMasterclasses.map((masterclass) => (
              <div
                key={masterclass.id}
                onClick={() => handleMasterclassClick(masterclass)}
                className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-all group cursor-pointer"
              >
                {/* Image Section */}
                <div className="relative aspect-[4/3] overflow-hidden">
                  <Image
                    src={masterclass.image_url || '/placeholder-masterclass.jpg'}
                    alt={masterclass.title}
                    fill
                    className="object-cover filter grayscale group-hover:grayscale-0 transition-all duration-300"
                  />
                  <div className="absolute top-2 left-2 flex gap-1">
                    <span className="px-1.5 py-0.5 bg-gray-500 text-white text-[10px] font-medium rounded">
                      {masterclass.category.charAt(0).toUpperCase() + masterclass.category.slice(1).replace(/_/g, ' ')}
                    </span>
                    {masterclass.is_free && (
                      <span className="px-1.5 py-0.5 bg-gray-100 text-gray-700 text-[10px] font-medium rounded">
                        Free
                      </span>
                    )}
                    {masterclass.type === 'mentor' && (
                      <span className="px-1.5 py-0.5 bg-gray-100 text-gray-700 text-[10px] font-medium rounded">
                        Mentor Class
                      </span>
                    )}
                  </div>
                  {!masterclass.is_free && (
                    <div className="absolute top-2 right-2">
                      <span className="px-1.5 py-0.5 bg-gray-100 text-gray-600 text-[10px] font-medium rounded flex items-center gap-0.5">
                        <IndianRupee className="h-2.5 w-2.5" />
                        {masterclass.fee || masterclass.price}
                      </span>
                    </div>
                  )}
                </div>

                <div className="p-2.5">
                  {/* Date and Time */}
                  <div className="flex items-center gap-1 text-[10px] text-gray-500 mb-1.5">
                    <Clock className="h-3 w-3" />
                    <span>
                      {masterclass.type === 'mentor'
                        ? new Date(masterclass.start_time!).toLocaleString(undefined, {
                            dateStyle: 'medium',
                            timeStyle: 'short'
                          })
                        : new Date(masterclass.scheduled_date + ' ' + masterclass.scheduled_time).toLocaleString(undefined, {
                            dateStyle: 'medium',
                            timeStyle: 'short'
                          })}
                    </span>
                  </div>

                  {/* Title and Mentor */}
                  <h3 className="text-xs font-semibold text-gray-900 mb-1.5 line-clamp-2 group-hover:text-[#4fcdc4] transition-colors">
                    {masterclass.title}
                  </h3>

                  <div className="flex items-center gap-1.5 mb-2">
                    <div className="relative w-5 h-5 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 text-[10px] font-medium">
                      {(masterclass.mentor_name || 'M').charAt(0).toUpperCase()}
                      {masterclass.type === 'regular' && (
                        <div className="absolute -bottom-0.5 -right-0.5">
                          <BadgeCheck className="h-2.5 w-2.5 text-blue-500 fill-white" />
                        </div>
                      )}
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-900 font-medium flex items-center gap-1">
                        {masterclass.mentor_name || 'Mentor Name'}
                      </p>
                      <p className="text-[8px] text-gray-500">Mentor</p>
                    </div>
                  </div>

                  {/* Action Button */}
                  <button className="w-full px-2.5 py-1 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded transition-colors flex items-center justify-center gap-1 text-xs">
                    <Clock className="h-2.5 w-2.5" />
                    Watch Recording
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
