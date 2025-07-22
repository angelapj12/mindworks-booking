import { useState, useEffect } from 'react'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Alert, AlertDescription } from './ui/alert'
import { supabase } from '../lib/supabase'
import { X, Calendar, AlertCircle, CheckCircle } from 'lucide-react'
import { format } from 'date-fns'

interface ClassSchedule {
  id?: string
  class_type_id: string
  instructor_id: string
  start_time: string
  end_time: string
  capacity: number
  enrolled_count?: number
  notes: string
  is_active: boolean
}

interface ClassType {
  id: string
  name: string
  duration_minutes: number
}

interface Instructor {
  id: string
  name: string
}

interface ClassScheduleManagementModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  classSchedule?: ClassSchedule | null
  mode: 'create' | 'edit'
  classTypes: ClassType[]
  instructors: Instructor[]
}

export function ClassScheduleManagementModal({
  isOpen,
  onClose,
  onSuccess,
  classSchedule,
  mode,
  classTypes,
  instructors
}: ClassScheduleManagementModalProps) {
  const [formData, setFormData] = useState<ClassSchedule>({
    class_type_id: '',
    instructor_id: '',
    start_time: '',
    end_time: '',
    capacity: 20,
    notes: '',
    is_active: true
  })
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    if (classSchedule && mode === 'edit') {
      // Format dates for datetime-local input
      const startDate = new Date(classSchedule.start_time)
      const endDate = new Date(classSchedule.end_time)
      
      setFormData({
        ...classSchedule,
        start_time: format(startDate, "yyyy-MM-dd'T'HH:mm"),
        end_time: format(endDate, "yyyy-MM-dd'T'HH:mm")
      })
    } else {
      setFormData({
        class_type_id: '',
        instructor_id: '',
        start_time: '',
        end_time: '',
        capacity: 20,
        notes: '',
        is_active: true
      })
    }
  }, [classSchedule, mode, isOpen])

  if (!isOpen) return null

  const handleSubmit = async () => {
    if (!formData.class_type_id) {
      setError('Class type is required')
      return
    }

    if (!formData.instructor_id) {
      setError('Instructor is required')
      return
    }

    if (!formData.start_time || !formData.end_time) {
      setError('Start and end times are required')
      return
    }

    const startTime = new Date(formData.start_time)
    const endTime = new Date(formData.end_time)

    if (endTime <= startTime) {
      setError('End time must be after start time')
      return
    }

    setProcessing(true)
    setError('')
    setSuccess('')

    try {
      const submitData = {
        ...formData,
        start_time: startTime.toISOString(),
        end_time: endTime.toISOString()
      }

      const { data, error } = await supabase.functions.invoke('manage-class-schedules', {
        body: {
          action: mode === 'create' ? 'create' : 'update',
          schedule_data: submitData,
          schedule_id: classSchedule?.id
        }
      })

      if (error) {
        throw new Error(error.message || `Failed to ${mode} class schedule`)
      }

      setSuccess(data.data.message || `Class schedule ${mode}d successfully!`)
      setTimeout(() => {
        onSuccess()
        onClose()
      }, 1500)
    } catch (error: any) {
      setError(error.message || `Failed to ${mode} class schedule`)
    } finally {
      setProcessing(false)
    }
  }

  const handleChange = (field: keyof ClassSchedule, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleClassTypeChange = (classTypeId: string) => {
    const selectedClassType = classTypes.find(ct => ct.id === classTypeId)
    handleChange('class_type_id', classTypeId)
    
    // Auto-calculate end time based on class duration if start time is set
    if (formData.start_time && selectedClassType) {
      const startTime = new Date(formData.start_time)
      const endTime = new Date(startTime.getTime() + selectedClassType.duration_minutes * 60000)
      handleChange('end_time', format(endTime, "yyyy-MM-dd'T'HH:mm"))
    }
  }

  const handleStartTimeChange = (startTime: string) => {
    handleChange('start_time', startTime)
    
    // Auto-calculate end time based on selected class type duration
    if (startTime && formData.class_type_id) {
      const selectedClassType = classTypes.find(ct => ct.id === formData.class_type_id)
      if (selectedClassType) {
        const start = new Date(startTime)
        const end = new Date(start.getTime() + selectedClassType.duration_minutes * 60000)
        handleChange('end_time', format(end, "yyyy-MM-dd'T'HH:mm"))
      }
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-900 to-orange-500 rounded-lg flex items-center justify-center">
              <Calendar className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                {mode === 'create' ? 'Schedule New Class' : 'Edit Class Schedule'}
              </h2>
              <p className="text-sm text-gray-600">Manage class scheduling</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
            disabled={processing}
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
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

          {/* Form */}
          <div className="space-y-6">
            {/* Class and Instructor Selection */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Class Type *
                </label>
                <select
                  value={formData.class_type_id}
                  onChange={(e) => handleClassTypeChange(e.target.value)}
                  disabled={processing}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select class type...</option>
                  {classTypes.map(classType => (
                    <option key={classType.id} value={classType.id}>
                      {classType.name} ({classType.duration_minutes} min)
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Instructor *
                </label>
                <select
                  value={formData.instructor_id}
                  onChange={(e) => handleChange('instructor_id', e.target.value)}
                  disabled={processing}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select instructor...</option>
                  {instructors.map(instructor => (
                    <option key={instructor.id} value={instructor.id}>
                      {instructor.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Date and Time */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Start Time *
                </label>
                <Input
                  type="datetime-local"
                  value={formData.start_time}
                  onChange={(e) => handleStartTimeChange(e.target.value)}
                  disabled={processing}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  End Time *
                </label>
                <Input
                  type="datetime-local"
                  value={formData.end_time}
                  onChange={(e) => handleChange('end_time', e.target.value)}
                  disabled={processing}
                />
              </div>
            </div>

            {/* Capacity */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Class Capacity
              </label>
              <Input
                type="number"
                min="1"
                max="50"
                value={formData.capacity}
                onChange={(e) => handleChange('capacity', parseInt(e.target.value) || 20)}
                disabled={processing}
              />
              <p className="text-sm text-gray-500 mt-1">
                Maximum number of students for this class
              </p>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Notes (Optional)
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => handleChange('notes', e.target.value)}
                rows={3}
                placeholder="Special instructions or notes for this class..."
                disabled={processing}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Status */}
            {mode === 'edit' && (
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={formData.is_active}
                  onChange={(e) => handleChange('is_active', e.target.checked)}
                  disabled={processing}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="is_active" className="text-sm font-medium text-gray-700">
                  Active (visible to students)
                </label>
              </div>
            )}

            {/* Current Enrollment (for edit mode) */}
            {mode === 'edit' && formData.enrolled_count !== undefined && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-medium text-blue-900 mb-2">Current Enrollment</h4>
                <p className="text-sm text-blue-700">
                  {formData.enrolled_count} of {formData.capacity} spots filled
                </p>
                {formData.enrolled_count > 0 && (
                  <p className="text-xs text-blue-600 mt-1">
                    ⚠️ Note: Reducing capacity below current enrollment will require manual intervention
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200 bg-gray-50">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={processing}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={processing}
            className="bg-gradient-to-r from-blue-900 to-orange-500 hover:from-blue-800 hover:to-orange-600 text-white"
          >
            {processing ? 'Saving...' : mode === 'create' ? 'Schedule Class' : 'Update Schedule'}
          </Button>
        </div>
      </div>
    </div>
  )
}
