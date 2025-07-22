import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Badge } from '../components/ui/badge'
import { supabase, ClassSchedule, ClassType, Instructor } from '../lib/supabase'
import { Calendar, Clock, Users, CreditCard, Search, Filter, MapPin, Star } from 'lucide-react'
import { format, parseISO, isAfter } from 'date-fns'
import { BookingModal } from '../components/BookingModal'

interface ClassWithDetails extends ClassSchedule {
  class_type: ClassType
  instructor: Instructor
}

export function ClassesPage() {
  const { user, profile } = useAuth()
  const [classes, setClasses] = useState<ClassWithDetails[]>([])
  const [filteredClasses, setFilteredClasses] = useState<ClassWithDetails[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedClassType, setSelectedClassType] = useState('')
  const [classTypes, setClassTypes] = useState<ClassType[]>([])
  const [selectedClass, setSelectedClass] = useState<ClassWithDetails | null>(null)
  const [showBookingModal, setShowBookingModal] = useState(false)

  useEffect(() => {
    loadClasses()
    loadClassTypes()
  }, [])

  useEffect(() => {
    filterClasses()
  }, [classes, searchTerm, selectedClassType])

  const loadClasses = async () => {
    try {
      setLoading(true)
      
      // Fetch class schedules, class types, and instructors separately
      const [schedulesResponse, classTypesResponse, instructorsResponse] = await Promise.all([
        supabase
          .from('class_schedules')
          .select('*')
          .eq('is_active', true)
          .gte('start_time', new Date().toISOString())
          .order('start_time', { ascending: true }),
        supabase
          .from('class_types')
          .select('*')
          .eq('is_active', true),
        supabase
          .from('instructors')
          .select('*')
          .eq('is_active', true)
      ]);

      if (schedulesResponse.error) {
        console.error('Error loading class schedules:', schedulesResponse.error)
        return
      }
      if (classTypesResponse.error) {
        console.error('Error loading class types:', classTypesResponse.error)
        return
      }
      if (instructorsResponse.error) {
        console.error('Error loading instructors:', instructorsResponse.error)
        return
      }

      const schedules = schedulesResponse.data || [];
      const classTypes = classTypesResponse.data || [];
      const instructors = instructorsResponse.data || [];

      console.log('Loaded data:', { schedules: schedules.length, classTypes: classTypes.length, instructors: instructors.length });

      // Manually join the data
      const classesWithDetails = schedules.map(schedule => ({
        ...schedule,
        class_type: classTypes.find(ct => ct.id === schedule.class_type_id),
        instructor: instructors.find(inst => inst.id === schedule.instructor_id)
      })).filter(classItem => classItem.class_type && classItem.instructor); // Only include classes with valid references

      console.log('Classes with details:', classesWithDetails.length);
      setClasses(classesWithDetails)
    } catch (error) {
      console.error('Error loading classes:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadClassTypes = async () => {
    try {
      const { data, error } = await supabase
        .from('class_types')
        .select('*')
        .eq('is_active', true)
        .order('name')

      if (error) {
        console.error('Error loading class types:', error)
        return
      }

      setClassTypes(data || [])
    } catch (error) {
      console.error('Error loading class types:', error)
    }
  }

  const filterClasses = () => {
    let filtered = classes

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(classItem => 
        classItem.class_type.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        classItem.instructor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (classItem.class_type.description || '').toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Filter by class type
    if (selectedClassType) {
      filtered = filtered.filter(classItem => classItem.class_type.id === selectedClassType)
    }

    setFilteredClasses(filtered)
  }

  const handleBookClass = (classItem: ClassWithDetails) => {
    if (!user) {
      // Redirect to login if not authenticated
      window.location.href = '/login'
      return
    }

    setSelectedClass(classItem)
    setShowBookingModal(true)
  }

  const handleBookingSuccess = () => {
    setShowBookingModal(false)
    setSelectedClass(null)
    // Reload classes to update availability
    loadClasses()
  }

  const isClassFull = (classItem: ClassWithDetails) => {
    return classItem.enrolled_count >= classItem.capacity
  }

  const getAvailabilityText = (classItem: ClassWithDetails) => {
    const spotsLeft = classItem.capacity - classItem.enrolled_count
    if (spotsLeft === 0) return 'Full'
    if (spotsLeft === 1) return '1 spot left'
    if (spotsLeft <= 3) return `${spotsLeft} spots left`
    return `${spotsLeft} spots available`
  }

  const getAvailabilityColor = (classItem: ClassWithDetails) => {
    const spotsLeft = classItem.capacity - classItem.enrolled_count
    if (spotsLeft === 0) return 'text-red-600 bg-red-50'
    if (spotsLeft <= 3) return 'text-orange-600 bg-orange-50'
    return 'text-green-600 bg-green-50'
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-900 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading classes...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Section */}
      <div className="bg-gradient-to-r from-blue-900 to-orange-500 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">Our Classes</h1>
            <p className="text-xl text-blue-100 max-w-2xl mx-auto">
              Discover and book from our wide range of wellness classes. 
              Real-time availability ensures you never miss out.
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="h-5 w-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
              <Input
                type="text"
                placeholder="Search classes, instructors..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Class Type Filter */}
            <div className="md:w-64">
              <select
                value={selectedClassType}
                onChange={(e) => setSelectedClassType(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">All Class Types</option>
                {classTypes.map(type => (
                  <option key={type.id} value={type.id}>{type.name}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Results Count */}
        <div className="mb-6">
          <p className="text-gray-600">
            Showing {filteredClasses.length} of {classes.length} upcoming classes
          </p>
        </div>

        {/* Classes Grid */}
        {filteredClasses.length === 0 ? (
          <div className="text-center py-12">
            <Calendar className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No classes found</h3>
            <p className="text-gray-600">
              {classes.length === 0 
                ? 'No upcoming classes are currently scheduled.' 
                : 'Try adjusting your search criteria.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredClasses.map(classItem => (
              <div key={classItem.id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
                {/* Class Image */}
                <div className="relative h-48">
                  <img 
                    src={classItem.class_type.image_url || '/images/class-default.jpg'} 
                    alt={classItem.class_type.name}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-3 left-3">
                    <Badge className="bg-white text-gray-900 font-medium">
                      {classItem.class_type.credit_cost} credit{classItem.class_type.credit_cost > 1 ? 's' : ''}
                    </Badge>
                  </div>
                  <div className="absolute top-3 right-3">
                    <Badge className={getAvailabilityColor(classItem)}>
                      {getAvailabilityText(classItem)}
                    </Badge>
                  </div>
                </div>

                {/* Class Details */}
                <div className="p-6">
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    {classItem.class_type.name}
                  </h3>
                  
                  {/* Instructor */}
                  <div className="flex items-center space-x-2 mb-3">
                    <img 
                      src={classItem.instructor.image_url || '/images/instructor-default.jpg'} 
                      alt={classItem.instructor.name}
                      className="w-8 h-8 rounded-full object-cover"
                    />
                    <span className="text-sm text-gray-600">{classItem.instructor.name}</span>
                  </div>

                  {/* Class Info */}
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                      <Calendar className="h-4 w-4" />
                      <span>
                        {format(parseISO(classItem.start_time), 'EEEE, MMMM d')}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                      <Clock className="h-4 w-4" />
                      <span>
                        {format(parseISO(classItem.start_time), 'h:mm a')} - {format(parseISO(classItem.end_time), 'h:mm a')}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                      <Users className="h-4 w-4" />
                      <span>
                        {classItem.enrolled_count}/{classItem.capacity} enrolled
                      </span>
                    </div>
                  </div>

                  {/* Description */}
                  {classItem.class_type.description && (
                    <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                      {classItem.class_type.description}
                    </p>
                  )}

                  {/* Notes */}
                  {classItem.notes && (
                    <p className="text-xs text-blue-600 mb-4 bg-blue-50 p-2 rounded">
                      {classItem.notes}
                    </p>
                  )}

                  {/* Action Button */}
                  <Button
                    onClick={() => handleBookClass(classItem)}
                    disabled={isClassFull(classItem)}
                    className={`w-full ${
                      isClassFull(classItem)
                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        : user
                          ? 'bg-blue-900 hover:bg-blue-800 text-white'
                          : 'bg-orange-500 hover:bg-orange-600 text-white'
                    }`}
                  >
                    {isClassFull(classItem) ? (
                      'Class Full'
                    ) : user ? (
                      <>Book Now ({classItem.class_type.credit_cost} credit{classItem.class_type.credit_cost > 1 ? 's' : ''})</>
                    ) : (
                      'Sign In to Book'
                    )}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Booking Modal */}
      {showBookingModal && selectedClass && (
        <BookingModal
          classSchedule={selectedClass}
          onClose={() => setShowBookingModal(false)}
          onSuccess={handleBookingSuccess}
        />
      )}
    </div>
  )
}
