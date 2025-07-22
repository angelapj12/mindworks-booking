import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { supabase, Booking, CreditTransaction } from '../lib/supabase'
import { Button } from '../components/ui/button'
import { Badge } from '../components/ui/badge'
import { Alert, AlertDescription } from '../components/ui/alert'
import { CreditPurchaseModal } from '../components/CreditPurchaseModal'
import { Calendar, Clock, CreditCard, User, Mail, Phone, AlertCircle, CheckCircle, X, Star, ArrowRight, ShoppingCart } from 'lucide-react'
import { format, parseISO, isAfter, isPast } from 'date-fns'

interface BookingWithDetails {
  id: string
  user_id: string
  class_schedule_id: string
  booking_status: 'confirmed' | 'cancelled' | 'attended' | 'no_show'
  credits_used: number
  booking_time: string
  cancellation_time?: string
  created_at: string
  updated_at: string
  class_schedule: {
    start_time: string
    end_time: string
    notes?: string
    class_types: {
      name: string
      image_url?: string
      duration_minutes: number
    }
    instructors: {
      name: string
      image_url?: string
    }
  }
}

export function DashboardPage() {
  const { user, profile, refreshProfile } = useAuth()
  const [bookings, setBookings] = useState<BookingWithDetails[]>([])
  const [transactions, setTransactions] = useState<CreditTransaction[]>([])
  const [loading, setLoading] = useState(true)
  const [cancellingBooking, setCancellingBooking] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [activeTab, setActiveTab] = useState<'upcoming' | 'history' | 'credits'>('upcoming')
  const [showCreditPurchase, setShowCreditPurchase] = useState(false)

  useEffect(() => {
    if (user) {
      loadUserData()
    }
  }, [user])

  const loadUserData = async () => {
    if (!user) return
    
    setLoading(true)
    try {
      await Promise.all([
        loadBookings(),
        loadTransactions()
      ])
    } finally {
      setLoading(false)
    }
  }

  const loadBookings = async () => {
    if (!user) return

    try {
      // Fetch bookings, class schedules, class types, and instructors separately
      const [bookingsResponse, schedulesResponse, classTypesResponse, instructorsResponse] = await Promise.all([
        supabase
          .from('bookings')
          .select('*')
          .eq('user_id', user.id)
          .order('booking_time', { ascending: false }),
        supabase
          .from('class_schedules')
          .select('*'),
        supabase
          .from('class_types')
          .select('*'),
        supabase
          .from('instructors')
          .select('*')
      ]);

      if (bookingsResponse.error) {
        console.error('Error loading bookings:', bookingsResponse.error)
        return
      }
      if (schedulesResponse.error) {
        console.error('Error loading schedules:', schedulesResponse.error)
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

      const bookings = bookingsResponse.data || [];
      const schedules = schedulesResponse.data || [];
      const classTypes = classTypesResponse.data || [];
      const instructors = instructorsResponse.data || [];

      console.log('Loaded booking data:', { 
        bookings: bookings.length, 
        schedules: schedules.length, 
        classTypes: classTypes.length, 
        instructors: instructors.length 
      });

      // Manually join the data
      const bookingsWithDetails = bookings.map(booking => {
        const schedule = schedules.find(s => s.id === booking.class_schedule_id);
        if (!schedule) return null;

        const classType = classTypes.find(ct => ct.id === schedule.class_type_id);
        const instructor = instructors.find(inst => inst.id === schedule.instructor_id);

        return {
          ...booking,
          class_schedule: {
            start_time: schedule.start_time,
            end_time: schedule.end_time,
            notes: schedule.notes,
            class_types: classType || { name: 'Unknown Class', image_url: null, duration_minutes: 0 },
            instructors: instructor || { name: 'Unknown Instructor', image_url: null }
          }
        };
      }).filter(booking => booking !== null); // Remove bookings without valid schedule data

      console.log('Bookings with details:', bookingsWithDetails.length);
      setBookings(bookingsWithDetails)
    } catch (error) {
      console.error('Error loading bookings:', error)
    }
  }

  const loadTransactions = async () => {
    if (!user) return

    try {
      const { data, error } = await supabase
        .from('credit_transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10)

      if (error) {
        console.error('Error loading transactions:', error)
        return
      }

      setTransactions(data || [])
    } catch (error) {
      console.error('Error loading transactions:', error)
    }
  }

  const handleCancelBooking = async (bookingId: string) => {
    setCancellingBooking(bookingId)
    setError('')
    setSuccess('')

    try {
      const { data, error } = await supabase.functions.invoke('cancel-booking', {
        body: { booking_id: bookingId }
      })

      if (error) {
        throw new Error(error.message || 'Failed to cancel booking')
      }

      setSuccess(data.data.message || 'Booking cancelled successfully')
      await Promise.all([
        loadBookings(),
        loadTransactions(),
        refreshProfile()
      ])
    } catch (error: any) {
      setError(error.message || 'Failed to cancel booking')
    } finally {
      setCancellingBooking(null)
    }
  }

  const handleCreditPurchaseSuccess = async () => {
    setSuccess('Credits purchased successfully!')
    await Promise.all([
      loadTransactions(),
      refreshProfile()
    ])
    setTimeout(() => setSuccess(''), 3000)
  }

  const getUpcomingBookings = () => {
    return bookings.filter(booking => 
      booking.booking_status === 'confirmed' && 
      isAfter(parseISO(booking.class_schedule.start_time), new Date())
    )
  }

  const getPastBookings = () => {
    return bookings.filter(booking => 
      isPast(parseISO(booking.class_schedule.start_time))
    )
  }

  const canCancelBooking = (booking: BookingWithDetails) => {
    if (booking.booking_status !== 'confirmed') return false
    
    const classStartTime = parseISO(booking.class_schedule.start_time)
    const now = new Date()
    const twoHoursBeforeClass = new Date(classStartTime.getTime() - (2 * 60 * 60 * 1000))
    
    return now <= twoHoursBeforeClass
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'bg-green-100 text-green-700'
      case 'cancelled': return 'bg-red-100 text-red-700'
      case 'attended': return 'bg-blue-100 text-blue-700'
      case 'no_show': return 'bg-gray-100 text-gray-700'
      default: return 'bg-gray-100 text-gray-700'
    }
  }

  const getTransactionColor = (type: string) => {
    switch (type) {
      case 'credit_added':
      case 'booking_refund':
        return 'text-green-600'
      case 'credit_deducted':
      case 'booking_payment':
        return 'text-red-600'
      default:
        return 'text-gray-600'
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-900 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-900 to-orange-500 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-3xl font-bold">Welcome back, {profile?.full_name}!</h1>
              <p className="text-blue-100 mt-1">Manage your classes and track your wellness journey</p>
            </div>
            <div className="mt-4 md:mt-0">
              <div className="bg-white/20 rounded-lg p-4 backdrop-blur-sm">
                <div className="flex items-center space-x-2 mb-1">
                  <CreditCard className="h-5 w-5" />
                  <span className="font-semibold">Credit Balance</span>
                </div>
                <div className="text-2xl font-bold">{profile?.credit_balance || 0} credits</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Status Messages */}
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        {success && (
          <Alert className="mb-6 bg-green-50 border-green-200">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-700">{success}</AlertDescription>
          </Alert>
        )}

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Link to="/classes" className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Calendar className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Book New Class</h3>
                <p className="text-sm text-gray-600">Browse available classes</p>
              </div>
              <ArrowRight className="h-5 w-5 text-gray-400" />
            </div>
          </Link>

          <button 
            onClick={() => setShowCreditPurchase(true)}
            className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow w-full text-left"
          >
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <ShoppingCart className="h-6 w-6 text-orange-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900">Purchase Credits</h3>
                <p className="text-sm text-gray-600">Buy credits instantly (demo mode)</p>
              </div>
              <ArrowRight className="h-5 w-5 text-gray-400" />
            </div>
          </button>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <Star className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Total Classes</h3>
                <p className="text-lg font-semibold text-gray-900">{bookings.length}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              <button
                onClick={() => setActiveTab('upcoming')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'upcoming'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Upcoming Classes ({getUpcomingBookings().length})
              </button>
              <button
                onClick={() => setActiveTab('history')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'history'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Class History ({getPastBookings().length})
              </button>
              <button
                onClick={() => setActiveTab('credits')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'credits'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Credit History
              </button>
            </nav>
          </div>

          <div className="p-6">
            {/* Upcoming Classes Tab */}
            {activeTab === 'upcoming' && (
              <div>
                {getUpcomingBookings().length === 0 ? (
                  <div className="text-center py-8">
                    <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No upcoming classes</h3>
                    <p className="text-gray-600 mb-4">Book your next class to get started!</p>
                    <Link to="/classes">
                      <Button className="bg-blue-900 hover:bg-blue-800">
                        Browse Classes
                      </Button>
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {getUpcomingBookings().map(booking => (
                      <div key={booking.id} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex items-start space-x-4">
                            <img 
                              src={booking.class_schedule.class_types.image_url || '/images/class-default.jpg'} 
                              alt={booking.class_schedule.class_types.name}
                              className="w-16 h-16 rounded-lg object-cover"
                            />
                            <div className="flex-1">
                              <h4 className="font-semibold text-gray-900">
                                {booking.class_schedule.class_types.name}
                              </h4>
                              <div className="flex items-center space-x-2 mt-1">
                                <img 
                                  src={booking.class_schedule.instructors.image_url || '/images/instructor-default.jpg'} 
                                  alt={booking.class_schedule.instructors.name}
                                  className="w-5 h-5 rounded-full object-cover"
                                />
                                <span className="text-sm text-gray-600">
                                  {booking.class_schedule.instructors.name}
                                </span>
                              </div>
                              <div className="flex items-center space-x-4 mt-2 text-sm text-gray-600">
                                <div className="flex items-center space-x-1">
                                  <Calendar className="h-4 w-4" />
                                  <span>{format(parseISO(booking.class_schedule.start_time), 'EEEE, MMMM d')}</span>
                                </div>
                                <div className="flex items-center space-x-1">
                                  <Clock className="h-4 w-4" />
                                  <span>
                                    {format(parseISO(booking.class_schedule.start_time), 'h:mm a')} - 
                                    {format(parseISO(booking.class_schedule.end_time), 'h:mm a')}
                                  </span>
                                </div>
                              </div>
                              {booking.class_schedule.notes && (
                                <p className="text-sm text-blue-600 mt-2 bg-blue-50 p-2 rounded">
                                  {booking.class_schedule.notes}
                                </p>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center space-x-3">
                            <Badge className={getStatusColor(booking.booking_status)}>
                              {booking.booking_status}
                            </Badge>
                            {canCancelBooking(booking) && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleCancelBooking(booking.id)}
                                disabled={cancellingBooking === booking.id}
                                className="text-red-600 border-red-300 hover:bg-red-50"
                              >
                                {cancellingBooking === booking.id ? 'Cancelling...' : 'Cancel'}
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Class History Tab */}
            {activeTab === 'history' && (
              <div>
                {getPastBookings().length === 0 ? (
                  <div className="text-center py-8">
                    <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No class history</h3>
                    <p className="text-gray-600">Your completed classes will appear here.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {getPastBookings().map(booking => (
                      <div key={booking.id} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex items-start space-x-4">
                            <img 
                              src={booking.class_schedule.class_types.image_url || '/images/class-default.jpg'} 
                              alt={booking.class_schedule.class_types.name}
                              className="w-16 h-16 rounded-lg object-cover"
                            />
                            <div className="flex-1">
                              <h4 className="font-semibold text-gray-900">
                                {booking.class_schedule.class_types.name}
                              </h4>
                              <div className="flex items-center space-x-2 mt-1">
                                <img 
                                  src={booking.class_schedule.instructors.image_url || '/images/instructor-default.jpg'} 
                                  alt={booking.class_schedule.instructors.name}
                                  className="w-5 h-5 rounded-full object-cover"
                                />
                                <span className="text-sm text-gray-600">
                                  {booking.class_schedule.instructors.name}
                                </span>
                              </div>
                              <div className="flex items-center space-x-4 mt-2 text-sm text-gray-600">
                                <div className="flex items-center space-x-1">
                                  <Calendar className="h-4 w-4" />
                                  <span>{format(parseISO(booking.class_schedule.start_time), 'EEEE, MMMM d, yyyy')}</span>
                                </div>
                                <div className="flex items-center space-x-1">
                                  <Clock className="h-4 w-4" />
                                  <span>
                                    {format(parseISO(booking.class_schedule.start_time), 'h:mm a')}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                          <Badge className={getStatusColor(booking.booking_status)}>
                            {booking.booking_status}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Credit History Tab */}
            {activeTab === 'credits' && (
              <div>
                {transactions.length === 0 ? (
                  <div className="text-center py-8">
                    <CreditCard className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No credit history</h3>
                    <p className="text-gray-600">Your credit transactions will appear here.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {transactions.map(transaction => (
                      <div key={transaction.id} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-b-0">
                        <div className="flex items-center space-x-3">
                          <div className={`w-2 h-2 rounded-full ${
                            transaction.amount > 0 ? 'bg-green-500' : 'bg-red-500'
                          }`}></div>
                          <div>
                            <p className="font-medium text-gray-900">
                              {transaction.description || transaction.transaction_type.replace('_', ' ')}
                            </p>
                            <p className="text-sm text-gray-500">
                              {format(parseISO(transaction.created_at), 'MMM d, yyyy h:mm a')}
                            </p>
                          </div>
                        </div>
                        <div className={`font-semibold ${getTransactionColor(transaction.transaction_type)}`}>
                          {transaction.amount > 0 ? '+' : ''}{transaction.amount} credits
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Credit Purchase Modal */}
      <CreditPurchaseModal
        isOpen={showCreditPurchase}
        onClose={() => setShowCreditPurchase(false)}
        onSuccess={handleCreditPurchaseSuccess}
      />
    </div>
  )
}
