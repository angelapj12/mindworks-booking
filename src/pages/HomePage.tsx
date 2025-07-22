import { Link } from 'react-router-dom'
import { Button } from '../components/ui/button'
import { useAuth } from '../contexts/AuthContext'
import { Calendar, Users, CreditCard, Star, ArrowRight, CheckCircle } from 'lucide-react'

export function HomePage() {
  const { user } = useAuth()

  return (
    <div className="bg-white">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-blue-900 via-blue-800 to-orange-500 text-white">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              Transform Your
              <span className="block text-orange-200">Mind & Body</span>
            </h1>
            <p className="text-xl md:text-2xl mb-8 text-blue-100 max-w-3xl mx-auto">
              Join thousands of students in their wellness journey. Book classes, track progress, 
              and achieve your goals with our comprehensive education platform.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              {user ? (
                <Link to="/classes">
                  <Button size="lg" className="bg-orange-500 hover:bg-orange-600 text-white px-8 py-3 text-lg">
                    Browse Classes
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
              ) : (
                <>
                  <Link to="/register">
                    <Button size="lg" className="bg-orange-500 hover:bg-orange-600 text-white px-8 py-3 text-lg">
                      Get Started Free
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </Button>
                  </Link>
                  <Link to="/classes">
                    <Button variant="outline" size="lg" className="border-white text-white hover:bg-white hover:text-blue-900 px-8 py-3 text-lg">
                      Explore Classes
                    </Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Why Choose MindWorks?
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Experience seamless class booking with real-time availability and credit-based payments
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-200 text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Calendar className="h-8 w-8 text-blue-900" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Real-Time Booking</h3>
              <p className="text-gray-600">
                Book classes instantly with live availability updates. Never worry about double bookings or full classes.
              </p>
            </div>

            <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-200 text-center">
              <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <CreditCard className="h-8 w-8 text-orange-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Credit System</h3>
              <p className="text-gray-600">
                Flexible credit-based payments. Purchase credits and use them for any class. New students get 10 free credits!
              </p>
            </div>

            <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-200 text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Users className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Expert Instructors</h3>
              <p className="text-gray-600">
                Learn from certified professionals with years of experience in yoga, fitness, dance, and martial arts.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Popular Classes Preview */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Popular Classes
            </h2>
            <p className="text-xl text-gray-600">
              Discover our most loved classes across different disciplines
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {[
              { name: 'Hatha Yoga', credits: 1, duration: '60 min', image: '/images/class-hatha-yoga.jpg' },
              { name: 'HIIT Training', credits: 2, duration: '45 min', image: '/images/class-hiit.jpg' },
              { name: 'Contemporary Dance', credits: 1, duration: '90 min', image: '/images/class-contemporary.jpg' },
              { name: 'Karate', credits: 2, duration: '75 min', image: '/images/class-karate.jpg' }
            ].map((classItem, index) => (
              <div key={index} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
                <img 
                  src={classItem.image} 
                  alt={classItem.name}
                  className="w-full h-48 object-cover"
                />
                <div className="p-6">
                  <h3 className="font-semibold text-gray-900 mb-2">{classItem.name}</h3>
                  <div className="flex items-center justify-between text-sm text-gray-600">
                    <span>{classItem.duration}</span>
                    <span className="bg-orange-100 text-orange-700 px-2 py-1 rounded-full">
                      {classItem.credits} credit{classItem.credits > 1 ? 's' : ''}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="text-center">
            <Link to="/classes">
              <Button size="lg" className="bg-blue-900 hover:bg-blue-800">
                View All Classes
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-16 bg-blue-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
                Start Your Wellness Journey Today
              </h2>
              <p className="text-lg text-gray-600 mb-8">
                Join a community committed to growth, health, and personal development. 
                Our platform makes it easy to find classes that fit your schedule and goals.
              </p>
              
              <ul className="space-y-4 mb-8">
                {[
                  'Real-time class availability and instant booking',
                  'Flexible credit system - pay as you go',
                  'Professional instructors with proven expertise',
                  'Easy cancellation policy with credit refunds',
                  'Track your progress and class history',
                  'Mobile-friendly platform for booking on the go'
                ].map((benefit, index) => (
                  <li key={index} className="flex items-start space-x-3">
                    <CheckCircle className="h-5 w-5 text-green-600 mt-1 flex-shrink-0" />
                    <span className="text-gray-700">{benefit}</span>
                  </li>
                ))}
              </ul>

              {!user && (
                <Link to="/register">
                  <Button size="lg" className="bg-orange-500 hover:bg-orange-600">
                    Join Now - Get 10 Free Credits
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <img 
                src="/images/class-vinyasa.png" 
                alt="Yoga class" 
                className="rounded-lg shadow-md h-48 w-full object-cover"
              />
              <img 
                src="/images/class-pilates.jpg" 
                alt="Pilates class" 
                className="rounded-lg shadow-md h-48 w-full object-cover mt-8"
              />
              <img 
                src="/images/class-jazz.jpeg" 
                alt="Dance class" 
                className="rounded-lg shadow-md h-48 w-full object-cover -mt-4"
              />
              <img 
                src="/images/class-meditation.jpeg" 
                alt="Meditation" 
                className="rounded-lg shadow-md h-48 w-full object-cover mt-4"
              />
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-gradient-to-r from-blue-900 to-orange-500 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Ready to Transform Your Life?
          </h2>
          <p className="text-xl mb-8 text-blue-100">
            Join thousands of students who have already started their wellness journey with MindWorks.
          </p>
          
          {user ? (
            <Link to="/dashboard">
              <Button size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-blue-900 px-8 py-3 text-lg">
                Go to Dashboard
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          ) : (
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/register">
                <Button size="lg" className="bg-orange-500 hover:bg-orange-600 px-8 py-3 text-lg">
                  Start Free Today
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link to="/classes">
                <Button size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-blue-900 px-8 py-3 text-lg">
                  Browse Classes
                </Button>
              </Link>
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
