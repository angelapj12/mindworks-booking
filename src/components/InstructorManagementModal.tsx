import { useState, useEffect } from 'react'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Alert, AlertDescription } from './ui/alert'
import { supabase, Instructor } from '../lib/supabase'
import { X, User, AlertCircle, CheckCircle } from 'lucide-react'

interface InstructorManagementModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  instructor?: Instructor | null
  mode: 'create' | 'edit'
}
  const instructorImages = [
  { value: '/images/instructor-sarah.jpg', label: 'Sarah' },
  { value: '/images/instructor-mike.jpg', label: 'Mike' },
  { value: '/images/instructor-emily.jpg', label: 'Emily' },
  { value: '/images/instructor-david.jpg', label: 'David' },
  { value: '/images/instructor-lisa.jpg', label: 'Lisa' },
  { value: '/images/instructor-default.jpg', label: 'Default' }
]

// Form data interface that matches the form inputs
interface InstructorFormData {
  name: string
  bio: string
  specialties: string // Will be converted to/from array
  email: string
  phone: string
  image_url: string
  is_active: boolean
}

export function InstructorManagementModal({
  isOpen,
  onClose,
  onSuccess,
  instructor,
  mode
}: InstructorManagementModalProps) {
  const [formData, setFormData] = useState<InstructorFormData>({
    name: '',
    bio: '',
    specialties: '',
    email: '',
    phone: '',
    image_url: '/images/instructor-default.jpg',
    is_active: true
  })

interface InstructorManagementModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  instructor?: Instructor | null
  mode: 'create' | 'edit'
}

  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    if (instructor && mode === 'edit') {
      setFormData({
        name: instructor.name || '',
        bio: instructor.bio || '',
        specialties: Array.isArray(instructor.specialties) ? instructor.specialties.join(', ') : '',
        email: instructor.email || '',
        phone: instructor.phone || '',
        image_url: instructor.image_url || '/images/instructor-default.jpg',
        is_active: instructor.is_active
      })
    } else {
      setFormData({
        name: '',
        bio: '',
        specialties: '',
        email: '',
        phone: '',
        image_url: '/images/instructor-default.jpg',
        is_active: true
      })
    }
  }, [instructor, mode, isOpen])

  if (!isOpen) return null

  const handleSubmit = async () => {
    console.log('Form submission started', { mode, formData });
    
    if (!formData.name.trim()) {
      setError('Instructor name is required')
      return
    }

    if (!formData.specialties.trim()) {
      setError('Specialties are required')
      return
    }

    setProcessing(true)
    setError('')
    setSuccess('')

    try {
      // Convert specialties string to array
      const specialtiesArray = formData.specialties
        .split(',')
        .map(s => s.trim())
        .filter(s => s.length > 0)

      const submitData = {
        name: formData.name,
        bio: formData.bio || null,
        specialties: specialtiesArray,
        email: formData.email || null,
        phone: formData.phone || null,
        image_url: formData.image_url,
        is_active: formData.is_active
      }

      let result
      if (mode === 'create') {
        result = await supabase
          .from('instructors')
          .insert(submitData)
          .select()
      } else {
        result = await supabase
          .from('instructors')
          .update(submitData)
          .eq('id', instructor?.id)
          .select()
      }

      if (result.error) {
        console.error('Database error:', result.error);
        throw new Error(result.error.message || `Failed to ${mode} instructor`)
      }

      console.log('Success! Result:', result);
      setSuccess(`Instructor ${mode}d successfully!`)
      setTimeout(() => {
        console.log('Calling onSuccess and onClose');
        onSuccess()
        onClose()
      }, 1500)
    } catch (error: any) {
      console.error('Error in handleSubmit:', error);
      setError(error.message || `Failed to ${mode} instructor`)
    } finally {
      setProcessing(false)
    }
  }

  const handleChange = (field: keyof InstructorFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-900 to-orange-500 rounded-lg flex items-center justify-center">
              <User className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                {mode === 'create' ? 'Add New Instructor' : 'Edit Instructor'}
              </h2>
              <p className="text-sm text-gray-600">Manage instructor information</p>
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
                  Full Name *
                </label>
                <Input
                  value={formData.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  placeholder="e.g., Sarah Johnson"
                  disabled={processing}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Specialties *
              </label>
              <Input
                value={formData.specialties}
                onChange={(e) => handleChange('specialties', e.target.value)}
                placeholder="e.g., Hatha Yoga, Meditation, Mindfulness"
                disabled={processing}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Bio
              </label>
              <textarea
                value={formData.bio}
                onChange={(e) => handleChange('bio', e.target.value)}
                rows={4}
                placeholder="Brief biography and background..."
                disabled={processing}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Contact Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email
                </label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleChange('email', e.target.value)}
                  placeholder="instructor@mindworks.com"
                  disabled={processing}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone
                </label>
                <Input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => handleChange('phone', e.target.value)}
                  placeholder="(555) 123-4567"
                  disabled={processing}
                />
              </div>
            </div>

            {/* Image Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Profile Image
              </label>
              <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
                {instructorImages.map(image => (
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
                      className="w-full h-16 object-cover rounded"
                    />
                    <p className="text-xs text-center mt-1 text-gray-600">{image.label}</p>
                    {formData.image_url === image.value && (
                      <div className="absolute top-1 right-1 w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
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
                  Active (available for classes)
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
            {processing ? 'Saving...' : mode === 'create' ? 'Create Instructor' : 'Update Instructor'}
          </Button>
        </div>
      </div>
    </div>
  )
}
