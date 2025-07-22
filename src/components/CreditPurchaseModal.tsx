import { useState } from 'react'
import { Button } from './ui/button'
import { Alert, AlertDescription } from './ui/alert'
import { supabase } from '../lib/supabase'
import { CreditCard, X, Package, Zap, Star, AlertCircle, CheckCircle } from 'lucide-react'

interface CreditPurchaseModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

interface CreditPackage {
  id: string
  name: string
  credits: number
  price: number
  popular?: boolean
  description: string
  icon: React.ReactNode
}

const creditPackages: CreditPackage[] = [
  {
    id: 'starter',
    name: 'Starter Pack',
    credits: 5,
    price: 50,
    description: 'Perfect for trying out new classes',
    icon: <Package className="h-6 w-6" />
  },
  {
    id: 'regular',
    name: 'Regular Pack',
    credits: 10,
    price: 90,
    popular: true,
    description: 'Best value for regular attendees',
    icon: <Zap className="h-6 w-6" />
  },
  {
    id: 'premium',
    name: 'Premium Pack',
    credits: 20,
    price: 150,
    description: 'For the dedicated wellness enthusiast',
    icon: <Star className="h-6 w-6" />
  }
]

export function CreditPurchaseModal({ isOpen, onClose, onSuccess }: CreditPurchaseModalProps) {
  const [selectedPackage, setSelectedPackage] = useState<string>('')
  const [purchasing, setPurchasing] = useState(false)
  const [processing, setProcessing] = useState(false)
  const [showPaymentForm, setShowPaymentForm] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [paymentForm, setPaymentForm] = useState({
    cardNumber: '1234 5678 9012 3456',
    expiryDate: '12/25',
    cvv: '123',
    cardholderName: 'John Doe'
  })

  if (!isOpen) return null

  const handleContinueToPayment = () => {
    if (!selectedPackage) {
      setError('Please select a credit package')
      return
    }
    setError('')
    setShowPaymentForm(true)
  }

  const handleBackToPackages = () => {
    setShowPaymentForm(false)
    setPaymentForm({
      cardNumber: '1234 5678 9012 3456',
      expiryDate: '12/25',
      cvv: '123',
      cardholderName: 'John Doe'
    })
    setError('')
  }

  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '')
    const matches = v.match(/\d{4,16}/g)
    const match = matches && matches[0] || ''
    const parts = []
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4))
    }
    if (parts.length) {
      return parts.join(' ')
    } else {
      return v
    }
  }

  const formatExpiryDate = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '')
    if (v.length >= 2) {
      return v.substring(0, 2) + '/' + v.substring(2, 4)
    }
    return v
  }

  const handlePaymentFormChange = (field: string, value: string) => {
    let formattedValue = value
    if (field === 'cardNumber') {
      formattedValue = formatCardNumber(value)
    } else if (field === 'expiryDate') {
      formattedValue = formatExpiryDate(value)
    } else if (field === 'cvv') {
      formattedValue = value.replace(/[^0-9]/g, '').substring(0, 4)
    }
    
    setPaymentForm(prev => ({ ...prev, [field]: formattedValue }))
  }

  const validatePaymentForm = () => {
    if (!paymentForm.cardNumber || paymentForm.cardNumber.replace(/\s/g, '').length < 16) {
      setError('Please enter a valid card number')
      return false
    }
    if (!paymentForm.expiryDate || paymentForm.expiryDate.length < 5) {
      setError('Please enter a valid expiry date')
      return false
    }
    if (!paymentForm.cvv || paymentForm.cvv.length < 3) {
      setError('Please enter a valid CVV')
      return false
    }
    if (!paymentForm.cardholderName.trim()) {
      setError('Please enter the cardholder name')
      return false
    }
    return true
  }

  const handleMockPayment = async () => {
    console.log('handleMockPayment called')
    console.log('paymentForm:', paymentForm)
    
    if (!validatePaymentForm()) {
      console.log('Payment form validation failed')
      return
    }

    const packageData = creditPackages.find(pkg => pkg.id === selectedPackage)
    if (!packageData) {
      console.log('Package data not found')
      return
    }

    console.log('Starting payment processing...')
    setPurchasing(true)
    setProcessing(true)
    setError('')
    setSuccess('')

    try {
      // Simulate payment processing time
      await new Promise(resolve => setTimeout(resolve, 2500))

      const { data, error } = await supabase.functions.invoke('purchase-credits', {
        body: {
          credits_amount: packageData.credits,
          package_type: packageData.name,
          amount_paid: packageData.price,
          payment_method: 'Mock Payment - ' + paymentForm.cardNumber.slice(-4)
        }
      })

      if (error) {
        throw new Error(error.message || 'Failed to process payment')
      }

      setProcessing(false)
      setSuccess(`Payment successful! ${packageData.credits} credits added to your account.`)
      
      setTimeout(() => {
        onSuccess()
        onClose()
        // Reset state
        setShowPaymentForm(false)
        setSelectedPackage('')
        setPaymentForm({
          cardNumber: '1234 5678 9012 3456',
          expiryDate: '12/25',
          cvv: '123',
          cardholderName: 'John Doe'
        })
      }, 2500)
    } catch (error: any) {
      setError(error.message || 'Payment failed. Please try again.')
      setProcessing(false)
    } finally {
      setPurchasing(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto relative z-10">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-900 to-orange-500 rounded-lg flex items-center justify-center">
              <CreditCard className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Purchase Credits</h2>
              <p className="text-sm text-gray-600">Choose your credit package</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
            disabled={purchasing}
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

          {/* Demo Notice */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-white text-xs font-bold">!</span>
              </div>
              <div>
                <h3 className="font-medium text-blue-900 mb-1">Demo Mode</h3>
                <p className="text-sm text-blue-700">
                  This is a mock payment system. No real charges will be made. Credits will be added instantly to your account.
                </p>
              </div>
            </div>
          </div>

          {!showPaymentForm ? (
            /* Credit Packages */
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Select Credit Package</h3>
              
              {creditPackages.map((pkg) => (
                <button
                  key={pkg.id}
                  type="button"
                  className={`relative border-2 rounded-lg p-4 cursor-pointer transition-all w-full text-left ${
                    selectedPackage === pkg.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  } ${purchasing ? 'opacity-50 cursor-not-allowed' : ''}`}
                  onClick={() => !purchasing && setSelectedPackage(pkg.id)}
                  disabled={purchasing}
                >
                  {pkg.popular && (
                    <div className="absolute -top-2 left-1/2 transform -translate-x-1/2">
                      <span className="bg-gradient-to-r from-orange-500 to-orange-600 text-white text-xs font-bold px-3 py-1 rounded-full">
                        Most Popular
                      </span>
                    </div>
                  )}
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                        selectedPackage === pkg.id 
                          ? 'bg-blue-500 text-white' 
                          : 'bg-gray-100 text-gray-600'
                      }`}>
                        {pkg.icon}
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900">{pkg.name}</h4>
                        <p className="text-sm text-gray-600">{pkg.description}</p>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <div className="text-2xl font-bold text-gray-900">{pkg.credits}</div>
                      <div className="text-sm text-gray-600">credits</div>
                      <div className="text-lg font-semibold text-green-600">${pkg.price}</div>
                    </div>
                  </div>
                  
                  {selectedPackage === pkg.id && (
                    <div className="absolute top-2 right-2 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center pointer-events-none">
                      <CheckCircle className="h-4 w-4 text-white" />
                    </div>
                  )}
                </button>
              ))}
            </div>
          ) : (
            /* Payment Form */
            <div className="space-y-6">
              {/* Order Summary */}
              {selectedPackage && (
                <div className="bg-gray-50 rounded-lg p-4 mb-6">
                  <h3 className="font-semibold text-gray-900 mb-2">Order Summary</h3>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{creditPackages.find(pkg => pkg.id === selectedPackage)?.name}</p>
                      <p className="text-sm text-gray-600">{creditPackages.find(pkg => pkg.id === selectedPackage)?.credits} credits</p>
                    </div>
                    <div className="text-lg font-semibold">${creditPackages.find(pkg => pkg.id === selectedPackage)?.price}</div>
                  </div>
                </div>
              )}

              {/* Payment Processing Animation */}
              {processing && (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-900 mx-auto mb-4"></div>
                  <p className="text-gray-600 font-medium">Processing payment...</p>
                  <p className="text-sm text-gray-500">Please wait while we process your transaction</p>
                </div>
              )}

              {/* Payment Form */}
              {!processing && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900">Payment Information</h3>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Card Number *
                    </label>
                    <input
                      type="text"
                      placeholder="1234 5678 9012 3456"
                      value={paymentForm.cardNumber}
                      onChange={(e) => handlePaymentFormChange('cardNumber', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      maxLength={19}
                      disabled={purchasing}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Expiry Date *
                      </label>
                      <input
                        type="text"
                        placeholder="MM/YY"
                        value={paymentForm.expiryDate}
                        onChange={(e) => handlePaymentFormChange('expiryDate', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        maxLength={5}
                        disabled={purchasing}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        CVV *
                      </label>
                      <input
                        type="text"
                        placeholder="123"
                        value={paymentForm.cvv}
                        onChange={(e) => handlePaymentFormChange('cvv', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        maxLength={4}
                        disabled={purchasing}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Cardholder Name *
                    </label>
                    <input
                      type="text"
                      placeholder="John Doe"
                      value={paymentForm.cardholderName}
                      onChange={(e) => handlePaymentFormChange('cardholderName', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      disabled={purchasing}
                    />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50">
          <div className="text-sm text-gray-600">
            {selectedPackage && (
              <span>
                {creditPackages.find(pkg => pkg.id === selectedPackage)?.credits} credits for 
                ${creditPackages.find(pkg => pkg.id === selectedPackage)?.price}
              </span>
            )}
          </div>
          
          <div className="flex items-center space-x-3">
            {!showPaymentForm ? (
              /* Package Selection Buttons */
              <>
                <Button
                  variant="outline"
                  onClick={onClose}
                  disabled={purchasing}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleContinueToPayment}
                  disabled={!selectedPackage || purchasing}
                  className="bg-gradient-to-r from-blue-900 to-orange-500 hover:from-blue-800 hover:to-orange-600 text-white"
                >
                  Continue to Payment
                </Button>
              </>
            ) : (
              /* Payment Form Buttons */
              <>
                <Button
                  variant="outline"
                  onClick={handleBackToPackages}
                  disabled={purchasing}
                >
                  ← Back
                </Button>
                <Button
                  variant="outline"
                  onClick={onClose}
                  disabled={purchasing}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleMockPayment}
                  disabled={purchasing || processing}
                  className="bg-gradient-to-r from-blue-900 to-orange-500 hover:from-blue-800 hover:to-orange-600 text-white"
                >
                  {purchasing ? 'Processing...' : processing ? 'Processing...' : 'Complete Purchase'}
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
