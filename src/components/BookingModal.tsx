import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { supabase, ClassSchedule, ClassType, Instructor } from '../lib/supabase'
import { Button } from './ui/button'
import { Badge } from './ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog'
import { Calendar, Clock, Users, CreditCard, AlertCircle, CheckCircle, X, User } from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { Alert, AlertDescription } from './ui/alert'

interface ClassWithDetails extends ClassSchedule {
  class_type: ClassType
  instructor: Instructor
}

interface BookingModalProps {
  classSchedule: ClassWithDetails
  onClose: () => void
  onSuccess: () => void
}

export function BookingModal({ classSchedule, onClose, onSuccess }: BookingModalProps) {
  const { user, profile, refreshProfile } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const handleBooking = async () => {
    if (!user || !profile) {
      setError('You must be logged in to book a class')
      return
    }

    if (profile.credit_balance < classSchedule.class_type.credit_cost) {
      setError(`You need ${classSchedule.class_type.credit_cost} credits but only have ${profile.credit_balance}. Please contact admin to purchase more credits.`)
      return
    }

    setLoading(true)
    setError('')

    try {
      const { data, error: bookingError } = await supabase.functions.invoke('book-class', {
        body: {
          class_schedule_id: classSchedule.id
        }
      })

      if (bookingError) {
        throw new Error(bookingError.message || 'Failed to book class')
      }

      setSuccess(true)
      await refreshProfile() // Refresh user profile to update credit balance
      
      // Close modal after 2 seconds
      setTimeout(() => {
        onSuccess()
      }, 2000)

    } catch (error: any) {
      console.error('Booking error:', error)
      setError(error.message || 'Failed to book class. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const getSpotsLeft = () => {
    return classSchedule.capacity - classSchedule.enrolled_count
  }

  const isClassFull = () => {
    return getSpotsLeft() <= 0
  }

  if (success) {
    return (
      <Dialog open={true} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-md bg-white">
          <div className="text-center py-6">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="h-10 w-10 text-green-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Booking Confirmed!</h3>
            <p className="text-gray-600 mb-4">
              You've successfully booked <strong>{classSchedule.class_type.name}</strong>
            </p>
            <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
              <p className="text-sm text-green-700">
                {classSchedule.class_type.credit_cost} credit{classSchedule.class_type.credit_cost > 1 ? 's' : ''} deducted from your account
              </p>
            </div>
            <p className="text-sm text-gray-500">
              Check your dashboard for booking details and cancellation options.
            </p>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg bg-white">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Book Class</span>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <X className="h-5 w-5" />
            </button>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Class Details */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-start space-x-4">
              <img 
                src={classSchedule.class_type.image_url || '/images/class-default.jpg'} 
                alt={classSchedule.class_type.name}
                className="w-16 h-16 rounded-lg object-cover"
              />
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900">
                  {classSchedule.class_type.name}
                </h3>
                <div className="flex items-center space-x-2 mt-1">
                  <img 
                    src={classSchedule.instructor.image_url || '/images/instructor-default.jpg'} 
                    alt={classSchedule.instructor.name}
                    className="w-6 h-6 rounded-full object-cover"
                  />
                  <span className="text-sm text-gray-600">{classSchedule.instructor.name}</span>
                </div>
              </div>
              <Badge className="bg-orange-100 text-orange-700">
                {classSchedule.class_type.credit_cost} credit{classSchedule.class_type.credit_cost > 1 ? 's' : ''}
              </Badge>
            </div>
          </div>

          {/* Schedule Info */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center space-x-3">
              <Calendar className="h-5 w-5 text-gray-400" />
              <div>
                <p className="text-sm font-medium text-gray-900">
                  {format(parseISO(classSchedule.start_time), 'EEEE, MMMM d')}
                </p>
                <p className="text-xs text-gray-500">{format(parseISO(classSchedule.start_time), 'yyyy')}</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Clock className="h-5 w-5 text-gray-400" />
              <div>
                <p className="text-sm font-medium text-gray-900">
                  {format(parseISO(classSchedule.start_time), 'h:mm a')}
                </p>
                <p className="text-xs text-gray-500">
                  {classSchedule.class_type.duration_minutes} minutes
                </p>
              </div>
            </div>
          </div>

          {/* Availability */}
          <div className="flex items-center justify-between bg-blue-50 rounded-lg p-3">
            <div className="flex items-center space-x-2">
              <Users className="h-5 w-5 text-blue-600" />
              <span className="text-sm font-medium text-blue-900">Availability</span>
            </div>
            <div className="text-right">
              <p className="text-sm font-semibold text-blue-900">
                {getSpotsLeft()} of {classSchedule.capacity} spots left
              </p>
              <p className="text-xs text-blue-600">
                {classSchedule.enrolled_count} already enrolled
              </p>
            </div>
          </div>

          {/* User Credits */}
          {profile && (
            <div className="flex items-center justify-between bg-orange-50 rounded-lg p-3">
              <div className="flex items-center space-x-2">
                <CreditCard className="h-5 w-5 text-orange-600" />
                <span className="text-sm font-medium text-orange-900">Your Credits</span>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold text-orange-900">
                  {profile.credit_balance} available
                </p>
                <p className="text-xs text-orange-600">
                  {profile.credit_balance - classSchedule.class_type.credit_cost} after booking
                </p>
              </div>
            </div>
          )}

          {/* Class Description */}
          {classSchedule.class_type.description && (
            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-2">About this class</h4>
              <p className="text-sm text-gray-600">{classSchedule.class_type.description}</p>
            </div>
          )}

          {/* Notes */}
          {classSchedule.notes && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-sm text-blue-700">
                <strong>Note:</strong> {classSchedule.notes}
              </p>
            </div>
          )}

          {/* Error Alert */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Action Buttons */}
          <div className="flex space-x-3">
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1"
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleBooking}
              disabled={loading || isClassFull() || (profile && profile.credit_balance < classSchedule.class_type.credit_cost)}
              className="flex-1 bg-blue-900 hover:bg-blue-800 text-white"
            >
              {loading ? (
                <div className="flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Booking...</span>
                </div>
              ) : isClassFull() ? (
                'Class Full'
              ) : profile && profile.credit_balance < classSchedule.class_type.credit_cost ? (
                'Insufficient Credits'
              ) : (
                `Book for ${classSchedule.class_type.credit_cost} credit${classSchedule.class_type.credit_cost > 1 ? 's' : ''}`
              )}
            </Button>
          </div>

          {/* Cancellation Policy */}
          <div className="text-xs text-gray-500 text-center">
            <p>
              ℹ️ Cancellation policy: Full refund if cancelled at least 2 hours before class starts
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
