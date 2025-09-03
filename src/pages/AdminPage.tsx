import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { supabase, Profile, ClassSchedule, Booking } from '../lib/supabase'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Badge } from '../components/ui/badge'
import { Alert, AlertDescription } from '../components/ui/alert'
import { ClassTypeManagementModal } from '../components/ClassTypeManagementModal'
import { InstructorManagementModal } from '../components/InstructorManagementModal'
import { ClassScheduleManagementModal } from '../components/ClassScheduleManagementModal'
import MaterialsManagementModal from '../components/MaterialsManagementModal'
import { 
  Users, 
  Calendar, 
  CreditCard, 
  TrendingUp, 
  Eye, 
  Plus, 
  Edit, 
  Trash2, 
  Search,
  AlertCircle,
  CheckCircle,
  Clock,
  Activity,
  RefreshCw,
  Monitor,
  BarChart3,
  Package,
  User,
  Settings
} from 'lucide-react'
import { format, parseISO, formatDistanceToNow } from 'date-fns'

export function AdminPage() {
  const { user, profile } = useAuth()
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'classes' | 'bookings' | 'class-types' | 'instructors' | 'schedules'>('overview')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  
  // Data states
  const [users, setUsers] = useState<Profile[]>([])
  const [classes, setClasses] = useState<any[]>([])
  const [bookings, setBookings] = useState<any[]>([])
  const [recentActivity, setRecentActivity] = useState<any[]>([])
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date())
  const [autoRefresh, setAutoRefresh] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [classTypes, setClassTypes] = useState<any[]>([])
  const [instructors, setInstructors] = useState<any[]>([])
  const [allSchedules, setAllSchedules] = useState<any[]>([])
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalBookings: 0,
    totalCreditsIssued: 0,
    upcomingClasses: 0,
    todayBookings: 0,
    nearCapacityClasses: 0,
    totalRevenue: 0 // new field
  })
  
  // Credit management
  const [selectedUser, setSelectedUser] = useState<Profile | null>(null)
  const [creditAmount, setCreditAmount] = useState('')
  const [creditDescription, setCreditDescription] = useState('')
  const [creditAction, setCreditAction] = useState<'add' | 'deduct'>('add')
  const [processingCredit, setProcessingCredit] = useState(false)
  
  // Search
  const [searchTerm, setSearchTerm] = useState('')
  
  // Management Modals
  const [classTypeModal, setClassTypeModal] = useState({ isOpen: false, mode: 'create' as 'create' | 'edit', data: null as any })
  const [instructorModal, setInstructorModal] = useState({ isOpen: false, mode: 'create' as 'create' | 'edit', data: null as any })
  const [scheduleModal, setScheduleModal] = useState({ isOpen: false, mode: 'create' as 'create' | 'edit', data: null as any })
  const [materialsModal, setMaterialsModal] = useState({ isOpen: false, classSchedule: null })

  // Export report
  const [exporting, setExporting] = useState(false)

  useEffect(() => {
    loadAdminData()
  }, [])

  // Auto-refresh functionality
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null
    
    if (autoRefresh) {
      interval = setInterval(() => {
        refreshData()
      }, 30000) // Refresh every 30 seconds
    }
    
    return () => {
      if (interval) clearInterval(interval)
    }
  }, [autoRefresh])

  const refreshData = useCallback(async () => {
    if (refreshing) return
    
    setRefreshing(true)
    try {
      await Promise.all([
        loadStats(),
        loadBookings(),
        loadRecentActivity()
      ])
      setLastRefresh(new Date())
    } finally {
      setRefreshing(false)
    }
  }, [refreshing])

  const loadAdminData = async () => {
    setLoading(true)
    try {
      await Promise.all([
        loadUsers(),
        loadClasses(),
        loadBookings(),
        loadStats(),
        loadRecentActivity(),
        loadClassTypes(),
        loadInstructors(),
        loadAllSchedules()
      ])
    } finally {
      setLoading(false)
    }
  }

  const loadRecentActivity = async () => {
    try {
      // Get recent bookings, profiles, schedules, class types, and credit transactions
      const [bookingsResponse, profilesResponse, schedulesResponse, classTypesResponse, transactionsResponse] = await Promise.all([
        supabase
          .from('bookings')
          .select('*')
          .order('booking_time', { ascending: false })
          .limit(10),
        supabase
          .from('profiles')
          .select('*'),
        supabase
          .from('class_schedules')
          .select('*'),
        supabase
          .from('class_types')
          .select('*'),
        supabase
          .from('credit_transactions')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(10)
      ])

      const bookings = bookingsResponse.data || [];
      const profiles = profilesResponse.data || [];
      const schedules = schedulesResponse.data || [];
      const classTypes = classTypesResponse.data || [];
      const transactions = transactionsResponse.data || [];

      const bookingActivities = bookings.map(booking => {
        const profile = profiles.find(p => p.user_id === booking.user_id);
        const schedule = schedules.find(s => s.id === booking.class_schedule_id);
        const classType = schedule ? classTypes.find(ct => ct.id === schedule.class_type_id) : null;

        return {
          id: `booking-${booking.id}`,
          type: 'booking',
          action: booking.booking_status === 'cancelled' ? 'cancelled' : 'booked',
          user: profile?.full_name || 'Unknown User',
          target: classType?.name || 'Unknown Class',
          time: booking.booking_time,
          status: booking.booking_status
        };
      });

      const creditActivities = transactions.map(transaction => {
        const profile = profiles.find(p => p.user_id === transaction.user_id);
        
        return {
          id: `credit-${transaction.id}`,
          type: 'credit',
          action: transaction.amount > 0 ? 'credit_added' : 'credit_used',
          user: profile?.full_name || 'Unknown User',
          target: `${Math.abs(transaction.amount)} credits`,
          time: transaction.created_at,
          description: transaction.description
        };
      });

      // Combine and sort activities
      const allActivities = [...bookingActivities, ...creditActivities]
        .sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
        .slice(0, 15)

      setRecentActivity(allActivities)
    } catch (error) {
      console.error('Error loading recent activity:', error)
    }
  }

  const loadUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error loading users:', error)
        return
      }

      setUsers(data || [])
    } catch (error) {
      console.error('Error loading users:', error)
    }
  }

  const loadClasses = async () => {
    try {
      // Fetch class schedules, class types, and instructors separately
      const [schedulesResponse, classTypesResponse, instructorsResponse] = await Promise.all([
        supabase
          .from('class_schedules')
          .select('*')
          .order('start_time', { ascending: true })
          .gte('start_time', new Date().toISOString()),
        supabase
          .from('class_types')
          .select('*'),
        supabase
          .from('instructors')
          .select('*')
      ]);

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

      const schedules = schedulesResponse.data || [];
      const classTypes = classTypesResponse.data || [];
      const instructors = instructorsResponse.data || [];

      // Manually join the data
      const classesWithDetails = schedules.map(schedule => ({
        ...schedule,
        class_types: classTypes.find(ct => ct.id === schedule.class_type_id),
        instructors: instructors.find(inst => inst.id === schedule.instructor_id)
      })).filter(classItem => classItem.class_types && classItem.instructors);

      setClasses(classesWithDetails)
    } catch (error) {
      console.error('Error loading classes:', error)
    }
  }

  const loadBookings = async () => {
    try {
      // Fetch bookings, profiles, class schedules, class types, and instructors separately
      const [bookingsResponse, profilesResponse, schedulesResponse, classTypesResponse, instructorsResponse] = await Promise.all([
        supabase
          .from('bookings')
          .select('*')
          .order('booking_time', { ascending: false })
          .limit(50),
        supabase
          .from('profiles')
          .select('*'),
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

      const bookings = bookingsResponse.data || [];
      const profiles = profilesResponse.data || [];
      const schedules = schedulesResponse.data || [];
      const classTypes = classTypesResponse.data || [];
      const instructors = instructorsResponse.data || [];

      // Manually join the data
      const bookingsWithDetails = bookings.map(booking => {
        const profile = profiles.find(p => p.user_id === booking.user_id);
        const schedule = schedules.find(s => s.id === booking.class_schedule_id);
        const classType = schedule ? classTypes.find(ct => ct.id === schedule.class_type_id) : null;
        const instructor = schedule ? instructors.find(inst => inst.id === schedule.instructor_id) : null;

        return {
          ...booking,
          profiles: profile,
          class_schedule: schedule ? {
            start_time: schedule.start_time,
            class_types: classType,
            instructors: instructor
          } : null
        };
      }).filter(booking => booking.class_schedule);

      setBookings(bookingsWithDetails)
    } catch (error) {
      console.error('Error loading bookings:', error)
    }
  }

  const loadStats = async () => {
    try {
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const todayISO = today.toISOString()

      // Get total users
      const { count: totalUsers } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })

      // Get total bookings
      const { count: totalBookings } = await supabase
        .from('bookings')
        .select('*', { count: 'exact', head: true })

      // Get today's bookings
      const { count: todayBookings } = await supabase
        .from('bookings')
        .select('*', { count: 'exact', head: true })
        .gte('booking_time', todayISO)

      // Get total credits issued
      const { data: creditData } = await supabase
        .from('credit_transactions')
        .select('amount')
        .in('transaction_type', ['credit_added', 'credit_purchase'])

      const totalCreditsIssued = creditData?.reduce((sum, transaction) => sum + transaction.amount, 0) || 0

      // Get upcoming classes
      const { count: upcomingClasses } = await supabase
        .from('class_schedules')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true)
        .gte('start_time', new Date().toISOString())

      // Get classes near capacity (>80% full)
      const { data: classesData } = await supabase
        .from('class_schedules')
        .select('capacity, enrolled_count')
        .eq('is_active', true)
        .gte('start_time', new Date().toISOString())

      const nearCapacityClasses = classesData?.filter(cls => 
        (cls.enrolled_count / cls.capacity) >= 0.8
      ).length || 0

      // Get total revenue
      const { data: revenueData } = await supabase
        .from('credit_transactions')
        .select('amount')
        .in('transaction_type', ['credit_purchase'])
      const totalRevenue = revenueData?.reduce((sum, transaction) => sum + transaction.amount, 0) || 0

      setStats({
        totalUsers: totalUsers || 0,
        totalBookings: totalBookings || 0,
        totalCreditsIssued,
        upcomingClasses: upcomingClasses || 0,
        todayBookings: todayBookings || 0,
        nearCapacityClasses,
        totalRevenue,
      })
    } catch (error) {
      console.error('Error loading stats:', error)
    }
  }

  const loadClassTypes = async () => {
    try {
      const { data, error } = await supabase
        .from('class_types')
        .select('*')
        .order('name', { ascending: true })

      if (error) {
        console.error('Error loading class types:', error)
        return
      }

      setClassTypes(data || [])
    } catch (error) {
      console.error('Error loading class types:', error)
    }
  }

  const loadInstructors = async () => {
    try {
      const { data, error } = await supabase
        .from('instructors')
        .select('*')
        .order('name', { ascending: true })

      if (error) {
        console.error('Error loading instructors:', error)
        return
      }

      setInstructors(data || [])
    } catch (error) {
      console.error('Error loading instructors:', error)
    }
  }

  const loadAllSchedules = async () => {
    try {
      // Fetch schedules, class types, and instructors separately
      const [schedulesResponse, classTypesResponse, instructorsResponse] = await Promise.all([
        supabase
          .from('class_schedules')
          .select('*')
          .order('start_time', { ascending: true }),
        supabase
          .from('class_types')
          .select('*'),
        supabase
          .from('instructors')
          .select('*')
      ])

      if (schedulesResponse.error) {
        console.error('Error loading schedules:', schedulesResponse.error)
        return
      }

      const schedules = schedulesResponse.data || []
      const classTypesData = classTypesResponse.data || []
      const instructorsData = instructorsResponse.data || []

      // Manually join the data
      const schedulesWithDetails = schedules.map(schedule => ({
        ...schedule,
        class_types: classTypesData.find(ct => ct.id === schedule.class_type_id),
        instructors: instructorsData.find(inst => inst.id === schedule.instructor_id)
      })).filter(schedule => schedule.class_types && schedule.instructors)

      setAllSchedules(schedulesWithDetails)
    } catch (error) {
      console.error('Error loading all schedules:', error)
    }
  }

  const handleCreditManagement = async () => {
    if (!selectedUser || !creditAmount) {
      setError('Please select a user and enter an amount')
      return
    }

    const amount = parseInt(creditAmount)
    if (isNaN(amount) || amount <= 0) {
      setError('Please enter a valid positive number')
      return
    }

    setProcessingCredit(true)
    setError('')
    setSuccess('')

    try {
      const { data, error } = await supabase.functions.invoke('manage-credits', {
        body: {
          target_user_id: selectedUser.user_id,
          amount: amount,
          transaction_type: creditAction === 'add' ? 'credit_added' : 'credit_deducted',
          description: creditDescription || `Admin ${creditAction === 'add' ? 'added' : 'deducted'} credits`
        }
      })

      if (error) {
        throw new Error(error.message || 'Failed to manage credits')
      }

      setSuccess(`Successfully ${creditAction === 'add' ? 'added' : 'deducted'} ${amount} credits ${creditAction === 'add' ? 'to' : 'from'} ${selectedUser.full_name}`)
      
      // Reset form
      setSelectedUser(null)
      setCreditAmount('')
      setCreditDescription('')
      
      // Reload data
      await loadUsers()
      await loadStats()
    } catch (error: any) {
      setError(error.message || 'Failed to manage credits')
    } finally {
      setProcessingCredit(false)
    }
  }

  // Management functions
  const handleManagementSuccess = async () => {
    await Promise.all([
      loadClassTypes(),
      loadInstructors(),
      loadAllSchedules(),
      loadClasses(),
      loadStats()
    ])
    setError('')
    setSuccess('')
  }

  const handleDeleteClassType = async (classType: any) => {
    if (!confirm(`Are you sure you want to delete "${classType.name}"? This action cannot be undone.`)) {
      return
    }

    try {
      const { data, error } = await supabase.functions.invoke('manage-class-types', {
        body: {
          action: 'delete',
          class_type_id: classType.id
        }
      })

      if (error) {
        throw new Error(error.message || 'Failed to delete class type')
      }

      setSuccess(`Class type "${classType.name}" deleted successfully`)
      await handleManagementSuccess()
    } catch (error: any) {
      setError(error.message || 'Failed to delete class type')
    }
  }

  const handleDeleteInstructor = async (instructor: any) => {
    if (!confirm(`Are you sure you want to delete "${instructor.name}"? This action cannot be undone.`)) {
      return
    }

    try {
      const { data, error } = await supabase.functions.invoke('manage-instructors', {
        body: {
          action: 'delete',
          instructor_id: instructor.id
        }
      })

      if (error) {
        throw new Error(error.message || 'Failed to delete instructor')
      }

      setSuccess(`Instructor "${instructor.name}" deleted successfully`)
      await handleManagementSuccess()
    } catch (error: any) {
      setError(error.message || 'Failed to delete instructor')
    }
  }

  const handleDeleteSchedule = async (schedule: any) => {
    if (!confirm(`Are you sure you want to delete this class schedule? This action cannot be undone.`)) {
      return
    }

    try {
      const { data, error } = await supabase.functions.invoke('manage-class-schedules', {
        body: {
          action: 'delete',
          schedule_id: schedule.id
        }
      })

      if (error) {
        throw new Error(error.message || 'Failed to delete schedule')
      }

      setSuccess('Class schedule deleted successfully')
      await handleManagementSuccess()
    } catch (error: any) {
      setError(error.message || 'Failed to delete schedule')
    }
  }

  const handleExportReport = async () => {
    setExporting(true)
    setError('')
    setSuccess('')
    try {
      // Example: Export enrollments, attendance, revenue as CSV
      const { data: enrollments } = await supabase.from('bookings').select('*')
      const { data: attendance } = await supabase.from('attendance').select('*')
      const { data: revenue } = await supabase.from('credit_transactions').select('*').in('transaction_type', ['credit_purchase'])
      // Convert to CSV (simple implementation)
      const toCSV = (arr) => arr.length ? Object.keys(arr[0]).join(',') + '\n' + arr.map(obj => Object.values(obj).join(',')).join('\n') : ''
      const csvData = [
        'Enrollments',
        toCSV(enrollments),
        '',
        'Attendance',
        toCSV(attendance),
        '',
        'Revenue',
        toCSV(revenue)
      ].join('\n')
      // Download CSV
      const blob = new Blob([csvData], { type: 'text/csv' })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'admin_report.csv'
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      setSuccess('Report exported successfully')
    } catch (err) {
      setError('Failed to export report')
    } finally {
      setExporting(false)
    }
  }

  const filteredUsers = users.filter(user => 
    user.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const recentBookings = bookings.slice(0, 10)

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-900 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading admin dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-900 to-orange-500 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Admin Dashboard</h1>
              <p className="text-blue-100 mt-1">Manage users, classes, and monitor platform activity</p>
            </div>
            <Badge className="bg-white/20 text-white backdrop-blur-sm">
              Administrator
            </Badge>
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

        {/* Real-time Status Bar */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className={`w-3 h-3 rounded-full ${refreshing ? 'bg-orange-500 animate-pulse' : 'bg-green-500'}`}></div>
                <span className="text-sm font-medium text-gray-700">
                  {refreshing ? 'Updating...' : 'Live Data'}
                </span>
              </div>
              <div className="text-sm text-gray-500">
                Last updated: {formatDistanceToNow(lastRefresh, { addSuffix: true })}
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setAutoRefresh(!autoRefresh)}
                className={autoRefresh ? 'bg-green-50 border-green-200' : ''}
              >
                <Monitor className="h-4 w-4 mr-2" />
                Auto-refresh {autoRefresh ? 'ON' : 'OFF'}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={refreshData}
                disabled={refreshing}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </div>
        </div>

        {/* Enhanced Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-7 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Users</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalUsers}</p>
              </div>
              <Users className="h-8 w-8 text-blue-600" />
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Bookings</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalBookings}</p>
              </div>
              <Calendar className="h-8 w-8 text-green-600" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Today's Bookings</p>
                <p className="text-2xl font-bold text-gray-900">{stats.todayBookings}</p>
                <p className="text-xs text-green-600">+{stats.todayBookings} today</p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-600" />
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Credits Issued</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalCreditsIssued}</p>
              </div>
              <CreditCard className="h-8 w-8 text-orange-600" />
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Upcoming Classes</p>
                <p className="text-2xl font-bold text-gray-900">{stats.upcomingClasses}</p>
              </div>
              <Clock className="h-8 w-8 text-purple-600" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Near Capacity</p>
                <p className="text-2xl font-bold text-gray-900">{stats.nearCapacityClasses}</p>
                <p className="text-xs text-orange-600">&gt;80% full</p>
              </div>
              <BarChart3 className="h-8 w-8 text-orange-600" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                <p className="text-2xl font-bold text-gray-900">${stats.totalRevenue}</p>
              </div>
              <CreditCard className="h-8 w-8 text-orange-600" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 flex items-center justify-center">
            <Button onClick={handleExportReport} disabled={exporting} className="bg-blue-900 text-white">
              {exporting ? 'Exporting...' : 'Export Report (CSV)'}
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              <button
                onClick={() => setActiveTab('overview')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'overview'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Overview
              </button>
              <button
                onClick={() => setActiveTab('users')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'users'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                User Management
              </button>
              <button
                onClick={() => setActiveTab('classes')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'classes'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Class Management
              </button>
              <button
                onClick={() => setActiveTab('bookings')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'bookings'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Recent Bookings
              </button>
              <button
                onClick={() => setActiveTab('class-types')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'class-types'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Class Types
              </button>
              <button
                onClick={() => setActiveTab('instructors')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'instructors'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Instructors
              </button>
              <button
                onClick={() => setActiveTab('schedules')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'schedules'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Schedules
              </button>
            </nav>
          </div>

          <div className="p-6">
            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <div className="space-y-8">
                {/* Real-time Activity Feed */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                      <Activity className="h-5 w-5 mr-2 text-blue-600" />
                      Live Activity Feed
                    </h3>
                    <Badge className="bg-blue-100 text-blue-700">
                      {recentActivity.length} recent activities
                    </Badge>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4 max-h-96 overflow-y-auto">
                    <div className="space-y-3">
                      {recentActivity.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                          <Activity className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                          <p>No recent activity</p>
                        </div>
                      ) : (
                        recentActivity.map(activity => (
                          <div key={activity.id} className="flex items-start space-x-3 bg-white rounded-lg p-3 border border-gray-200">
                            <div className={`w-3 h-3 rounded-full mt-2 flex-shrink-0 ${
                              activity.type === 'booking' 
                                ? activity.action === 'cancelled' 
                                  ? 'bg-red-500' 
                                  : 'bg-green-500'
                                : activity.action === 'credit_added' 
                                  ? 'bg-blue-500' 
                                  : 'bg-orange-500'
                            }`}></div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between">
                                <p className="font-medium text-gray-900 truncate">
                                  {activity.user}
                                </p>
                                <p className="text-xs text-gray-500 flex-shrink-0 ml-2">
                                  {formatDistanceToNow(parseISO(activity.time), { addSuffix: true })}
                                </p>
                              </div>
                              <p className="text-sm text-gray-600">
                                {activity.type === 'booking' && (
                                  <>
                                    {activity.action === 'cancelled' ? 'Cancelled booking for' : 'Booked'} <span className="font-medium">{activity.target}</span>
                                  </>
                                )}
                                {activity.type === 'credit' && (
                                  <>
                                    {activity.action === 'credit_added' ? 'Received' : 'Used'} <span className="font-medium">{activity.target}</span>
                                  </>
                                )}
                              </p>
                              {activity.description && (
                                <p className="text-xs text-blue-600 mt-1 bg-blue-50 px-2 py-1 rounded">
                                  {activity.description}
                                </p>
                              )}
                            </div>
                            <div className="flex-shrink-0">
                              {activity.status && (
                                <Badge className={`text-xs ${
                                  activity.status === 'confirmed' ? 'bg-green-100 text-green-700' : 
                                  activity.status === 'cancelled' ? 'bg-red-100 text-red-700' : 
                                  'bg-gray-100 text-gray-700'
                                }`}>
                                  {activity.status}
                                </Badge>
                              )}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>

                {/* Credit Management */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Credit Management</h3>
                  <div className="bg-gray-50 rounded-lg p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Select User
                        </label>
                        <select
                          value={selectedUser?.id || ''}
                          onChange={(e) => {
                            const user = users.find(u => u.id === e.target.value)
                            setSelectedUser(user || null)
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="">Choose a user...</option>
                          {users.filter(u => u.role === 'student').map(user => (
                            <option key={user.id} value={user.id}>
                              {user.full_name} ({user.credit_balance} credits)
                            </option>
                          ))}
                        </select>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Action
                        </label>
                        <select
                          value={creditAction}
                          onChange={(e) => setCreditAction(e.target.value as 'add' | 'deduct')}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="add">Add Credits</option>
                          <option value="deduct">Deduct Credits</option>
                        </select>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Amount
                        </label>
                        <Input
                          type="number"
                          min="1"
                          value={creditAmount}
                          onChange={(e) => setCreditAmount(e.target.value)}
                          placeholder="Enter amount"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Description (Optional)
                        </label>
                        <Input
                          type="text"
                          value={creditDescription}
                          onChange={(e) => setCreditDescription(e.target.value)}
                          placeholder="Reason for credit change"
                        />
                      </div>
                    </div>
                    
                    <div className="mt-6">
                      <Button
                        onClick={handleCreditManagement}
                        disabled={!selectedUser || !creditAmount || processingCredit}
                        className="bg-blue-900 hover:bg-blue-800 text-white"
                      >
                        {processingCredit ? 'Processing...' : `${creditAction === 'add' ? 'Add' : 'Deduct'} Credits`}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Users Tab */}
            {activeTab === 'users' && (
              <div>
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-gray-900">User Management</h3>
                  <div className="flex items-center space-x-4">
                    <div className="relative">
                      <Search className="h-5 w-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                      <Input
                        type="text"
                        placeholder="Search users..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 w-64"
                      />
                    </div>
                  </div>
                </div>
                
                <div className="space-y-3">
                  {filteredUsers.map(user => (
                    <div key={user.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
                            <Users className="h-6 w-6 text-gray-600" />
                          </div>
                          <div>
                            <h4 className="font-semibold text-gray-900">{user.full_name}</h4>
                            <p className="text-sm text-gray-600">{user.email}</p>
                            <p className="text-sm text-gray-500">
                              Joined {format(parseISO(user.created_at), 'MMM d, yyyy')}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-4">
                          <div className="text-right">
                            <p className="font-semibold text-gray-900">{user.credit_balance} credits</p>
                            <Badge className={user.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}>
                              {user.role}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Classes Tab */}
            {activeTab === 'classes' && (
              <div>
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-gray-900">Class Management</h3>
                </div>
                
                <div className="space-y-4">
                  {classes.map(classItem => (
                    <div key={classItem.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-4">
                          <img 
                            src={classItem.class_types?.image_url || '/images/class-default.jpg'} 
                            alt={classItem.class_types?.name}
                            className="w-16 h-16 rounded-lg object-cover"
                          />
                          <div>
                            <h4 className="font-semibold text-gray-900">{classItem.class_types?.name}</h4>
                            <p className="text-sm text-gray-600">{classItem.instructors?.name}</p>
                            <div className="flex items-center space-x-4 mt-2 text-sm text-gray-600">
                              <span>{format(parseISO(classItem.start_time), 'MMM d, h:mm a')}</span>
                              <span>{classItem.enrolled_count}/{classItem.capacity} enrolled</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge className={classItem.enrolled_count >= classItem.capacity ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}>
                            {classItem.enrolled_count >= classItem.capacity ? 'Full' : 'Available'}
                          </Badge>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setMaterialsModal({ isOpen: true, classSchedule: classItem })}
                            className="ml-2"
                          >
                            Manage Materials
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Bookings Tab */}
            {activeTab === 'bookings' && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-6">Recent Bookings</h3>
                
                <div className="space-y-3">
                  {bookings.map(booking => (
                    <div key={booking.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                          <div>
                            <h4 className="font-semibold text-gray-900">
                              {booking.profiles?.full_name}
                            </h4>
                            <p className="text-sm text-gray-600">
                              {booking.class_schedule?.class_types?.name} with {booking.class_schedule?.instructors?.name}
                            </p>
                            <p className="text-sm text-gray-500">
                              Booked on {format(parseISO(booking.booking_time), 'MMM d, h:mm a')}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <Badge className={`
                            ${booking.booking_status === 'confirmed' ? 'bg-green-100 text-green-700' : ''}
                            ${booking.booking_status === 'cancelled' ? 'bg-red-100 text-red-700' : ''}
                            ${booking.booking_status === 'attended' ? 'bg-blue-100 text-blue-700' : ''}
                          `}>
                            {booking.booking_status}
                          </Badge>
                          <p className="text-sm text-gray-600 mt-1">
                            {booking.credits_used} credit{booking.credits_used > 1 ? 's' : ''} used
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Class Types Management Tab */}
            {activeTab === 'class-types' && (
              <div>
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                    <Package className="h-5 w-5 mr-2 text-blue-600" />
                    Class Types Management
                  </h3>
                  <Button
                    onClick={() => setClassTypeModal({ isOpen: true, mode: 'create', data: null })}
                    className="bg-gradient-to-r from-blue-900 to-orange-500 hover:from-blue-800 hover:to-orange-600 text-white"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Class Type
                  </Button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {classTypes.map(classType => (
                    <div key={classType.id} className="border border-gray-200 rounded-lg overflow-hidden">
                      <img 
                        src={classType.image_url || '/images/class-default.jpg'} 
                        alt={classType.name}
                        className="w-full h-32 object-cover"
                      />
                      <div className="p-4">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-semibold text-gray-900">{classType.name}</h4>
                          <Badge className={classType.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}>
                            {classType.is_active ? 'Active' : 'Inactive'}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600 mb-3 line-clamp-2">{classType.description}</p>
                        <div className="flex items-center justify-between text-sm text-gray-500 mb-3">
                          <span>{classType.duration_minutes} min</span>
                          <span>{classType.credit_cost} credit{classType.credit_cost > 1 ? 's' : ''}</span>
                          <span className="capitalize">{classType.difficulty_level}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setClassTypeModal({ isOpen: true, mode: 'edit', data: classType })}
                          >
                            <Edit className="h-3 w-3 mr-1" />
                            Edit
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteClassType(classType)}
                            className="text-red-600 hover:text-red-700 hover:border-red-300"
                          >
                            <Trash2 className="h-3 w-3 mr-1" />
                            Delete
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                
                {classTypes.length === 0 && (
                  <div className="text-center py-12">
                    <Package className="h-16 w-16 mx-auto text-gray-300 mb-4" />
                    <h4 className="text-lg font-medium text-gray-900 mb-2">No class types found</h4>
                    <p className="text-gray-600 mb-4">Get started by adding your first class type.</p>
                    <Button
                      onClick={() => setClassTypeModal({ isOpen: true, mode: 'create', data: null })}
                      className="bg-gradient-to-r from-blue-900 to-orange-500 hover:from-blue-800 hover:to-orange-600 text-white"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Class Type
                    </Button>
                  </div>
                )}
              </div>
            )}

            {/* Instructors Management Tab */}
            {activeTab === 'instructors' && (
              <div>
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                    <User className="h-5 w-5 mr-2 text-blue-600" />
                    Instructors Management
                  </h3>
                  <Button
                    onClick={() => setInstructorModal({ isOpen: true, mode: 'create', data: null })}
                    className="bg-gradient-to-r from-blue-900 to-orange-500 hover:from-blue-800 hover:to-orange-600 text-white"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Instructor
                  </Button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {instructors.map(instructor => (
                    <div key={instructor.id} className="border border-gray-200 rounded-lg overflow-hidden">
                      <img 
                        src={instructor.image_url || '/images/instructor-default.jpg'} 
                        alt={instructor.name}
                        className="w-full h-32 object-cover"
                      />
                      <div className="p-4">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-semibold text-gray-900">{instructor.name}</h4>
                          <Badge className={instructor.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}>
                            {instructor.is_active ? 'Active' : 'Inactive'}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">{instructor.specialties}</p>
                        <p className="text-sm text-gray-500 mb-3 line-clamp-2">{instructor.bio}</p>
                        <div className="flex items-center justify-between text-sm text-gray-500 mb-3">
                          <span>{instructor.experience_years} years exp.</span>
                          <div className="flex items-center">
                            <span className="text-yellow-500">★</span>
                            <span className="ml-1">{instructor.rating}</span>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setInstructorModal({ isOpen: true, mode: 'edit', data: instructor })}
                          >
                            <Edit className="h-3 w-3 mr-1" />
                            Edit
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteInstructor(instructor)}
                            className="text-red-600 hover:text-red-700 hover:border-red-300"
                          >
                            <Trash2 className="h-3 w-3 mr-1" />
                            Delete
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                
                {instructors.length === 0 && (
                  <div className="text-center py-12">
                    <User className="h-16 w-16 mx-auto text-gray-300 mb-4" />
                    <h4 className="text-lg font-medium text-gray-900 mb-2">No instructors found</h4>
                    <p className="text-gray-600 mb-4">Get started by adding your first instructor.</p>
                    <Button
                      onClick={() => setInstructorModal({ isOpen: true, mode: 'create', data: null })}
                      className="bg-gradient-to-r from-blue-900 to-orange-500 hover:from-blue-800 hover:to-orange-600 text-white"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Instructor
                    </Button>
                  </div>
                )}
              </div>
            )}

            {/* Class Schedules Management Tab */}
            {activeTab === 'schedules' && (
              <div>
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                    <Calendar className="h-5 w-5 mr-2 text-blue-600" />
                    Class Schedules Management
                  </h3>
                  <Button
                    onClick={() => setScheduleModal({ isOpen: true, mode: 'create', data: null })}
                    className="bg-gradient-to-r from-blue-900 to-orange-500 hover:from-blue-800 hover:to-orange-600 text-white"
                    disabled={classTypes.length === 0 || instructors.length === 0}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Schedule Class
                  </Button>
                </div>
                
                {(classTypes.length === 0 || instructors.length === 0) && (
                  <Alert className="mb-6">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      You need at least one class type and one instructor before you can schedule classes.
                      {classTypes.length === 0 && ' Add class types first.'}
                      {instructors.length === 0 && ' Add instructors first.'}
                    </AlertDescription>
                  </Alert>
                )}
                
                <div className="space-y-4">
                  {allSchedules.map(schedule => (
                    <div key={schedule.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-4">
                          <img 
                            src={schedule.class_types?.image_url || '/images/class-default.jpg'} 
                            alt={schedule.class_types?.name}
                            className="w-16 h-16 rounded-lg object-cover"
                          />
                          <div>
                            <h4 className="font-semibold text-gray-900">{schedule.class_types?.name}</h4>
                            <p className="text-sm text-gray-600">{schedule.instructors?.name}</p>
                            <div className="flex items-center space-x-4 mt-2 text-sm text-gray-600">
                              <span>{format(parseISO(schedule.start_time), 'MMM d, h:mm a')}</span>
                              <span>-</span>
                              <span>{format(parseISO(schedule.end_time), 'h:mm a')}</span>
                              <span className="text-gray-400">|</span>
                              <span>{schedule.enrolled_count}/{schedule.capacity} enrolled</span>
                            </div>
                            {schedule.notes && (
                              <p className="text-sm text-blue-600 mt-1 bg-blue-50 px-2 py-1 rounded">
                                {schedule.notes}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge className={schedule.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}>
                            {schedule.is_active ? 'Active' : 'Inactive'}
                          </Badge>
                          <Badge className={schedule.enrolled_count >= schedule.capacity ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'}>
                            {schedule.enrolled_count >= schedule.capacity ? 'Full' : 'Available'}
                          </Badge>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setScheduleModal({ isOpen: true, mode: 'edit', data: schedule })}
                          >
                            <Edit className="h-3 w-3 mr-1" />
                            Edit
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteSchedule(schedule)}
                            className="text-red-600 hover:text-red-700 hover:border-red-300"
                          >
                            <Trash2 className="h-3 w-3 mr-1" />
                            Delete
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                
                {allSchedules.length === 0 && classTypes.length > 0 && instructors.length > 0 && (
                  <div className="text-center py-12">
                    <Calendar className="h-16 w-16 mx-auto text-gray-300 mb-4" />
                    <h4 className="text-lg font-medium text-gray-900 mb-2">No class schedules found</h4>
                    <p className="text-gray-600 mb-4">Get started by scheduling your first class.</p>
                    <Button
                      onClick={() => setScheduleModal({ isOpen: true, mode: 'create', data: null })}
                      className="bg-gradient-to-r from-blue-900 to-orange-500 hover:from-blue-800 hover:to-orange-600 text-white"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Schedule Class
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Management Modals */}
      <ClassTypeManagementModal
        isOpen={classTypeModal.isOpen}
        onClose={() => setClassTypeModal({ isOpen: false, mode: 'create', data: null })}
        onSuccess={handleManagementSuccess}
        classType={classTypeModal.data}
        mode={classTypeModal.mode}
      />
      
      <InstructorManagementModal
        isOpen={instructorModal.isOpen}
        onClose={() => setInstructorModal({ isOpen: false, mode: 'create', data: null })}
        onSuccess={handleManagementSuccess}
        instructor={instructorModal.data}
        mode={instructorModal.mode}
      />
      
      <ClassScheduleManagementModal
        isOpen={scheduleModal.isOpen}
        onClose={() => setScheduleModal({ isOpen: false, mode: 'create', data: null })}
        onSuccess={handleManagementSuccess}
        classSchedule={scheduleModal.data}
        mode={scheduleModal.mode}
        classTypes={classTypes.filter(ct => ct.is_active)}
        instructors={instructors.filter(inst => inst.is_active)}
      />
      
      <MaterialsManagementModal
        isOpen={materialsModal.isOpen}
        onClose={() => setMaterialsModal({ isOpen: false, classSchedule: null })}
        classSchedule={materialsModal.classSchedule}
        onSuccess={handleManagementSuccess}
      />
    </div>
  )
}
