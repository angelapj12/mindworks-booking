import { useState, useEffect } from 'react'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Alert, AlertDescription } from './ui/alert'
import { supabase, ClassType } from '../lib/supabase'
import { X, Package, AlertCircle, CheckCircle } from 'lucide-react'

interface ClassTypeManagementModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  classType?: ClassType | null
  mode: 'create' | 'edit'
}

// Form data interface that matches our form inputs
interface ClassTypeFormData {
  name: string
  description: string
  credit_cost: number
  duration_minutes: number
  max_capacity: number
  image_url: string
  is_active: boolean
}

const classImages = [
  { value: '/images/class-hatha.jpg', label: 'Hatha Yoga' },
  { value: '/images/class-vinyasa.png', label: 'Vinyasa Flow' },
  { value: '/images/class-hiit.jpg', label: 'HIIT Training' },
  { value: '/images/class-strength.jpg', label: 'Strength Training' },
  { value: '/images/class-contemporary.jpg', label: 'Contemporary Dance' },
  { value: '/images/class-jazz.jpeg', label: 'Jazz Dance' },
  { value: '/images/class-karate.jpg', label: 'Martial Arts' },
  { value: '/images/class-pilates.jpg', label: 'Pilates' },
  { value: '/images/class-meditation.jpeg', label: 'Meditation' },
  { value: '/images/class-default.jpg', label: 'Default' }
]

export function ClassTypeManagementModal({
  isOpen,
  onClose,
  onSuccess,
  classType,
  mode
}: ClassTypeManagementModalProps) {
  const [formData, setFormData] = useState<ClassTypeFormData>({
    name: '',
    description: '',
    credit_cost: 1,
    duration_minutes: 60,
    max_capacity: 20,
    image_url: '/images/class-default.jpg',
    is_active: true
  })
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    if (classType && mode === 'edit') {
      setFormData({
        name: classType.name || '',
        description: classType.description || '',
        credit_cost: classType.credit_cost || 1,
        duration_minutes: classType.duration_minutes || 60,
        max_capacity: classType.max_capacity || 20,
        image_url: classType.image_url || '/images/class-default.jpg',
        is_active: classType.is_active
      })
    } else {
      setFormData({
        name: '',
        description: '',
        credit_cost: 1,
        duration_minutes: 60,
        max_capacity: 20,
        image_url: '/images/class-default.jpg',
        is_active: true
      })
    }
  }, [classType, mode, isOpen])

  if (!isOpen) return null

  const handleSubmit = async () => {
    console.log('Class type form submission started', { mode, formData });
    
    if (!formData.name.trim()) {
      setError('Class name is required')
      return
    }

    setProcessing(true)
    setError('')
    setSuccess('')

    try {
      // Prepare data for submission
      const submitData = {
        name: formData.name,
        description: formData.description || null,
        credit_cost: formData.credit_cost,
        duration_minutes: formData.duration_minutes,
        max_capacity: formData.max_capacity,
        image_url: formData.image_url,
        is_active: formData.is_active
      }

      let result
      if (mode === 'create') {
        result = await supabase
          .from('class_types')
          .insert(submitData)
          .select()
      } else {
        result = await supabase
          .from('class_types')
          .update(submitData)
          .eq('id', classType?.id)
          .select()
      }

      if (result.error) {
        console.error('Database error:', result.error);
        throw new Error(result.error.message || `Failed to ${mode} class type`)
      }

      console.log('Success! Result:', result);
      setSuccess(`Class type ${mode}d successfully!`)
      setTimeout(() => {
        console.log('Calling onSuccess and onClose');
        onSuccess()
        onClose()
      }, 1500)
    } catch (error: any) {
      console.error('Error in handleSubmit:', error);
      setError(error.message || `Failed to ${mode} class type`)
    } finally {
      setProcessing(false)
    }
  }

  const handleChange = (field: keyof ClassTypeFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-900 to-orange-500 rounded-lg flex items-center justify-center">
              <Package className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                {mode === 'create' ? 'Add New Class Type' : 'Edit Class Type'}
              </h2>
              <p className="text-sm text-gray-600">Manage class type information</p>
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
            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Class Name *
                </label>
                <Input
                  value={formData.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  placeholder="e.g., Hatha Yoga"
                  disabled={processing}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Credit Cost *
                </label>
                <Input
                  type="number"
                  min="1"
                  max="10"
                  value={formData.credit_cost}
                  onChange={(e) => handleChange('credit_cost', parseInt(e.target.value))}
                  disabled={processing}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => handleChange('description', e.target.value)}
                rows={3}
                placeholder="Brief description of the class..."
                disabled={processing}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Class Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Duration (minutes)
                </label>
                <Input
                  type="number"
                  min="15"
                  max="180"
                  step="15"
                  value={formData.duration_minutes}
                  onChange={(e) => handleChange('duration_minutes', parseInt(e.target.value))}
                  disabled={processing}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Max Capacity
                </label>
                <Input
                  type="number"
                  min="1"
                  max="100"
                  value={formData.max_capacity}
                  onChange={(e) => handleChange('max_capacity', parseInt(e.target.value))}
                  disabled={processing}
                />
              </div>
            </div>

            {/* Image Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Class Image
              </label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {classImages.map(image => (
                  <div
                    key={image.value}
                    className={`relative border-2 rounded-lg p-2 cursor-pointer transition-all ${
                      formData.image_url === image.value
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    } ${processing ? 'opacity-50 cursor-not-allowed' : ''}`}
                    onClick={() => !processing && handleChange('image_url', image.value)}
                  >
                    <img
                      src={image.value}
                      alt={image.label}
                      className="w-full h-20 object-cover rounded"
                    />
                    <p className="text-xs text-center mt-1 text-gray-600">{image.label}</p>
                    {formData.image_url === image.value && (
                      <div className="absolute top-1 right-1 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                        <CheckCircle className="h-3 w-3 text-white" />
                      </div>
                    )}
                  </div>
                ))}
              </div>
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
            onClick={() => {
              console.log('Submit button clicked!');
              handleSubmit();
            }}
            disabled={processing}
            className="bg-gradient-to-r from-blue-900 to-orange-500 hover:from-blue-800 hover:to-orange-600 text-white"
          >
            {processing ? 'Saving...' : mode === 'create' ? 'Create Class Type' : 'Update Class Type'}
          </Button>
        </div>
      </div>
    </div>
  )
}
