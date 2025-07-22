import { useState, useEffect } from 'react'
import { supabase, Instructor } from '../lib/supabase'
import { Badge } from '../components/ui/badge'
import { Mail, Phone, Star, Users } from 'lucide-react'

export function InstructorsPage() {
  const [instructors, setInstructors] = useState<Instructor[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadInstructors()
  }, [])

  const loadInstructors = async () => {
    try {
      setLoading(true)
      
      const { data, error } = await supabase
        .from('instructors')
        .select('*')
        .eq('is_active', true)
        .order('name')

      if (error) {
        console.error('Error loading instructors:', error)
        return
      }

      setInstructors(data || [])
    } catch (error) {
      console.error('Error loading instructors:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-900 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading instructors...</p>
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
            <h1 className="text-4xl md:text-5xl font-bold mb-4">Our Expert Instructors</h1>
            <p className="text-xl text-blue-100 max-w-2xl mx-auto">
              Meet our certified professionals who are passionate about guiding your wellness journey. 
              Each instructor brings years of experience and specialized expertise.
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {instructors.length === 0 ? (
          <div className="text-center py-12">
            <Users className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No instructors found</h3>
            <p className="text-gray-600">Our instructor profiles will be available soon.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {instructors.map(instructor => (
              <div key={instructor.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
                {/* Instructor Photo */}
                <div className="relative h-64">
                  <img 
                    src={instructor.image_url || '/images/instructor-default.jpg'} 
                    alt={instructor.name}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
                  <div className="absolute bottom-4 left-4 right-4">
                    <h3 className="text-xl font-bold text-white mb-1">{instructor.name}</h3>
                    {instructor.specialties && instructor.specialties.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {instructor.specialties.slice(0, 2).map((specialty, index) => (
                          <Badge key={index} className="bg-white/20 text-white text-xs backdrop-blur-sm">
                            {specialty}
                          </Badge>
                        ))}
                        {instructor.specialties.length > 2 && (
                          <Badge className="bg-white/20 text-white text-xs backdrop-blur-sm">
                            +{instructor.specialties.length - 2} more
                          </Badge>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Instructor Details */}
                <div className="p-6">
                  {/* Specialties */}
                  {instructor.specialties && instructor.specialties.length > 0 && (
                    <div className="mb-4">
                      <h4 className="text-sm font-semibold text-gray-900 mb-2">Specialties</h4>
                      <div className="flex flex-wrap gap-2">
                        {instructor.specialties.map((specialty, index) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            {specialty}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Bio */}
                  {instructor.bio && (
                    <div className="mb-4">
                      <h4 className="text-sm font-semibold text-gray-900 mb-2">About</h4>
                      <p className="text-sm text-gray-600 leading-relaxed">
                        {instructor.bio}
                      </p>
                    </div>
                  )}

                  {/* Contact Info */}
                  <div className="space-y-2">
                    {instructor.email && (
                      <div className="flex items-center space-x-2 text-sm text-gray-600">
                        <Mail className="h-4 w-4" />
                        <span>{instructor.email}</span>
                      </div>
                    )}
                    {instructor.phone && (
                      <div className="flex items-center space-x-2 text-sm text-gray-600">
                        <Phone className="h-4 w-4" />
                        <span>{instructor.phone}</span>
                      </div>
                    )}
                  </div>

                  {/* Rating placeholder */}
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <div className="flex items-center space-x-1">
                      {[1, 2, 3, 4, 5].map(star => (
                        <Star key={star} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      ))}
                      <span className="text-sm text-gray-600 ml-2">5.0 (Professional Certified)</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Call to Action */}
        <div className="mt-16 text-center">
          <div className="bg-gradient-to-r from-blue-900 to-orange-500 rounded-xl text-white p-8">
            <h2 className="text-2xl md:text-3xl font-bold mb-4">
              Ready to Start Your Journey?
            </h2>
            <p className="text-lg text-blue-100 mb-6">
              Our expert instructors are here to guide you every step of the way. 
              Book a class today and experience the difference professional guidance makes.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a 
                href="/classes" 
                className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
              >
                Browse Classes
              </a>
              <a 
                href="/register" 
                className="bg-white text-blue-900 hover:bg-gray-100 px-6 py-3 rounded-lg font-semibold transition-colors"
              >
                Get Started
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
