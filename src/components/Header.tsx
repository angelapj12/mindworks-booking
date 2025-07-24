import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { Button } from './ui/button'
import { User, Shield, Calendar, Users, CreditCard, Menu, X } from 'lucide-react'
import { useState } from 'react'

export function Header() {
  const { user, profile, signOut } = useAuth()
  const location = useLocation()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const isActive = (path: string) => location.pathname === path

  const handleSignOut = async () => {
    try {
      await signOut()
      setMobileMenuOpen(false)
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-900 to-orange-400 rounded-lg flex items-center justify-center">
              <Calendar className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900">MindWorks</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <Link
              to="/"
              className={`text-sm font-medium transition-colors ${
                isActive('/') 
                  ? 'text-blue-900 border-b-2 border-blue-900 pb-1' 
                  : 'text-gray-600 hover:text-blue-900'
              }`}
            >
              Home
            </Link>
            <Link
              to="/classes"
              className={`text-sm font-medium transition-colors ${
                isActive('/classes') 
                  ? 'text-blue-900 border-b-2 border-blue-900 pb-1' 
                  : 'text-gray-600 hover:text-blue-900'
              }`}
            >
              Classes
            </Link>
            <Link
              to="/instructors"
              className={`text-sm font-medium transition-colors ${
                isActive('/instructors') 
                  ? 'text-blue-900 border-b-2 border-blue-900 pb-1' 
                  : 'text-gray-600 hover:text-blue-900'
              }`}
            >
              Instructors
            </Link>
          </nav>

          {/* Desktop Auth Section */}
          <div className="hidden md:flex items-center space-x-4">
            {user ? (
              <>
                {/* Credit Balance */}
                {profile && (
                  <div className="flex items-center space-x-2 bg-orange-50 px-3 py-1 rounded-full">
                    <CreditCard className="h-4 w-4 text-orange-600" />
                    <span className="text-sm font-medium text-orange-700">
                      {profile.credit_balance} credits
                    </span>
                  </div>
                )}

                {/* Dashboard Link */}
                <Link
                  to="/dashboard"
                  className={`flex items-center space-x-1 text-sm font-medium transition-colors ${
                    isActive('/dashboard') 
                      ? 'text-blue-900' 
                      : 'text-gray-600 hover:text-blue-900'
                  }`}
                >
                  <User className="h-4 w-4" />
                  <span>Dashboard</span>
                </Link>

                {/* Admin Link (if admin) */}
                {profile?.role === 'admin' && (
                  <Link
                    to="/admin"
                    className={`flex items-center space-x-1 text-sm font-medium transition-colors ${
                      isActive('/admin') 
                        ? 'text-blue-900' 
                        : 'text-gray-600 hover:text-blue-900'
                    }`}
                  >
                    <Shield className="h-4 w-4" />
                    <span>Admin</span>
                  </Link>
                )}

                {/* User Menu */}
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-600">Hi, {profile?.full_name || user.email}</span>
                  <Button variant="outline" size="sm" onClick={handleSignOut}>
                    Sign Out
                  </Button>
                </div>
              </>
            ) : (
              <div className="flex items-center space-x-3">
                <Link to="/login">
                  <Button variant="outline" size="sm">
                    Sign In
                  </Button>
                </Link>
                <Link to="/register">
                  <Button size="sm" style={{ backgroundColor: '#FFA726' }} className="hover:bg-orange-600 text-white">
                    Get Started
                  </Button>
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? (
              <X className="h-6 w-6" />
            ) : (
              <Menu className="h-6 w-6" />
            )}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-gray-200 py-4">
            <div className="flex flex-col space-y-3">
              <Link
                to="/"
                className="text-base font-medium text-gray-600 hover:text-blue-900 px-2 py-1"
                onClick={() => setMobileMenuOpen(false)}
              >
                Home
              </Link>
              <Link
                to="/classes"
                className="text-base font-medium text-gray-600 hover:text-blue-900 px-2 py-1"
                onClick={() => setMobileMenuOpen(false)}
              >
                Classes
              </Link>
              <Link
                to="/instructors"
                className="text-base font-medium text-gray-600 hover:text-blue-900 px-2 py-1"
                onClick={() => setMobileMenuOpen(false)}
              >
                Instructors
              </Link>

              {user ? (
                <>
                  {profile && (
                    <div className="flex items-center space-x-2 bg-orange-50 px-3 py-2 rounded-md mx-2">
                      <CreditCard className="h-4 w-4 text-orange-600" />
                      <span className="text-sm font-medium text-orange-700">
                        {profile.credit_balance} credits
                      </span>
                    </div>
                  )}
                  
                  <Link
                    to="/dashboard"
                    className="text-base font-medium text-gray-600 hover:text-blue-900 px-2 py-1"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Dashboard
                  </Link>
                  
                  {profile?.role === 'admin' && (
                    <Link
                      to="/admin"
                      className="text-base font-medium text-gray-600 hover:text-blue-900 px-2 py-1"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Admin Panel
                    </Link>
                  )}
                  
                  <div className="px-2 py-1">
                    <div className="text-sm text-gray-600 mb-2">
                      Signed in as {profile?.full_name || user.email}
                    </div>
                    <Button variant="outline" size="sm" onClick={handleSignOut} className="w-full">
                      Sign Out
                    </Button>
                  </div>
                </>
              ) : (
                <div className="flex flex-col space-y-2 px-2">
                  <Link to="/login" onClick={() => setMobileMenuOpen(false)}>
                    <Button variant="outline" size="sm" className="w-full">
                      Sign In
                    </Button>
                  </Link>
                  <Link to="/register" onClick={() => setMobileMenuOpen(false)}>
                    <Button size="sm" style={{ backgroundColor: '#FFA726' }} className="w-full hover:bg-orange-600 text-white">
                      Get Started
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  )
}
