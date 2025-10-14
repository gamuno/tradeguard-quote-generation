import { useState } from 'react'
import { Button } from '@/components/ui/button.jsx'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card.jsx'
import { Badge } from '@/components/ui/badge.jsx'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs.jsx'
import { Progress } from '@/components/ui/progress.jsx'
import { Input } from '@/components/ui/input.jsx'
import { Label } from '@/components/ui/label.jsx'
import { Textarea } from '@/components/ui/textarea.jsx'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select.jsx'
import { Checkbox } from '@/components/ui/checkbox.jsx'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group.jsx'
import { 
  Shield, 
  Building, 
  Umbrella, 
  Laptop, 
  DollarSign, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  Users,
  Lock,
  Zap,
  FileText,
  Calculator,
  TrendingUp,
  Eye,
  EyeOff,
  ArrowRight,
  CreditCard,
  Banknote
} from 'lucide-react'
import './App.css'

// Import data from JSON file
import insuranceData from './data/insurance-data.json'

function App() {
  const [activeSection, setActiveSection] = useState('overview')
  const [showCovered, setShowCovered] = useState(true)
  const [selectedPaymentPlan, setSelectedPaymentPlan] = useState('full')
  
  // Next Steps form states
  const [selectedPolicies, setSelectedPolicies] = useState([])
  const [paymentMethod, setPaymentMethod] = useState('')
  const [declineReason, setDeclineReason] = useState('')
  const [comments, setComments] = useState('')
  const [showPaymentForm, setShowPaymentForm] = useState(false)
  const [showDeclineForm, setShowDeclineForm] = useState(false)
  const [showConfirmation, setShowConfirmation] = useState(false)
  const [submissionType, setSubmissionType] = useState('')

  // Credit card form states
  const [cardNumber, setCardNumber] = useState('')
  const [expiryDate, setExpiryDate] = useState('')
  const [cvv, setCvv] = useState('')
  const [cardholderName, setCardholderName] = useState('')

  // Bank account form states
  const [accountNumber, setAccountNumber] = useState('')
  const [routingNumber, setRoutingNumber] = useState('')
  const [accountHolderName, setAccountHolderName] = useState('')
  const [accountType, setAccountType] = useState('')

  const data = insuranceData

  const totalPremium = data.policies.reduce((sum, policy) => sum + policy.premium, 0)
  const totalProtection = data.policies.reduce((sum, policy) => sum + policy.limits.total, 0)

  const paymentPlans = {
    full: { name: 'Full Pay', percentage: 100, payments: 1, fee: 0 },
    two: { name: '2-Pay', percentage: 60, payments: 2, fee: 10 },
    four: { name: '4-Pay', percentage: 40, payments: 4, fee: 10 },
    ten: { name: '10-Pay', percentage: 25.3, payments: 10, fee: 10 }
  }

  const calculatePayment = (plan) => {
    const planData = paymentPlans[plan]
    const firstPayment = (totalPremium * planData.percentage) / 100
    const totalFees = (planData.payments - 1) * planData.fee
    const totalCost = totalPremium + totalFees
    return { firstPayment, totalCost, totalFees }
  }

  const getIconComponent = (iconName) => {
    const icons = {
      Shield, Building, Umbrella, Laptop, DollarSign, CheckCircle, XCircle, 
      AlertTriangle, Users, Lock, Zap, FileText, Calculator, TrendingUp, 
      Eye, EyeOff, ArrowRight, CreditCard, Banknote
    }
    return icons[iconName] || Shield
  }

  const handlePolicySelection = (policyId, checked) => {
    if (checked) {
      setSelectedPolicies([...selectedPolicies, policyId])
    } else {
      setSelectedPolicies(selectedPolicies.filter(id => id !== policyId))
    }
  }

  const calculateSelectedPremium = () => {
    return data.policies
      .filter(policy => selectedPolicies.includes(policy.id))
      .reduce((sum, policy) => sum + policy.premium, 0)
  }

  const submitWebhook = async (payload) => {
    try {
      const response = await fetch(data.webhook.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-make-apikey': data.webhook.apiKey
        },
        body: JSON.stringify(payload)
      })
      return response.ok
    } catch (error) {
      console.error('Webhook submission failed:', error)
      return false
    }
  }

  const handleAcceptSubmission = async () => {
    const payload = {
      client_name: data.client.name,
      decision: 'accept',
      selected_policies: selectedPolicies,
      payment_method: paymentMethod,
      payment_details: paymentMethod === 'credit_card' ? {
        card_number: cardNumber.slice(-4), // Only last 4 digits for security
        cardholder_name: cardholderName
      } : {
        account_holder_name: accountHolderName,
        account_type: accountType
      },
      total_premium: calculateSelectedPremium(),
      agent_email: data.agent.email,
      submission_date: new Date().toISOString().split('T')[0],
      presentation_url: window.location.href
    }

    const success = await submitWebhook(payload)
    if (success) {
      setSubmissionType('accept')
      setShowConfirmation(true)
      setShowPaymentForm(false)
    }
  }

  const handleDeclineSubmission = async () => {
    const payload = {
      client_name: data.client.name,
      decision: 'decline',
      decline_reason: declineReason,
      comments: comments,
      total_premium: totalPremium,
      agent_email: data.agent.email,
      submission_date: new Date().toISOString().split('T')[0],
      presentation_url: window.location.href
    }

    const success = await submitWebhook(payload)
    if (success) {
      setSubmissionType('decline')
      setShowConfirmation(true)
      setShowDeclineForm(false)
    }
  }

  const NavigationCard = ({ section, icon: iconName, title, description, isActive, onClick }) => {
    const Icon = getIconComponent(iconName)
    return (
      <Card 
        className={`cursor-pointer transition-all duration-300 hover:shadow-lg ${
          isActive ? 'ring-2 ring-[#FF5F46] shadow-lg' : ''
        } py-3 gap-2`}
        onClick={onClick}
      >
        <CardHeader className="pb-2 px-4">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${isActive ? 'bg-[#FF5F46] text-white' : 'bg-gray-100'}`}>
              <Icon className="h-5 w-5" />
            </div>
            <div className="leading-tight">
              <CardTitle className="text-base">{title}</CardTitle>
              <CardDescription className="text-xs">{description}</CardDescription>
            </div>
          </div>
        </CardHeader>
      </Card>
    )
  }
  

  const PolicyCard = ({ policy, onClick }) => {
    const Icon = getIconComponent(policy.icon)
    return (
      <Card className="cursor-pointer transition-all duration-300 hover:shadow-lg hover:scale-105" onClick={onClick}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className={`p-3 rounded-lg ${policy.color} text-white`}>
                <Icon className="h-6 w-6" />
              </div>
              <div>
                <CardTitle className="text-lg">{policy.name}</CardTitle>
                <CardDescription>{policy.description}</CardDescription>
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-[#FF5F46]">${policy.premium}</div>
              <div className="text-sm text-gray-500">annual</div>
            </div>
          </div>
        </CardHeader>
      </Card>
    )
  }

  const CoverageExample = ({ examples, type }) => (
    <div className="space-y-4">
      {examples.map((example, index) => (
        <div key={index} className="flex items-start space-x-3 p-3 rounded-lg bg-gray-50">
          {type === 'covered' ? (
            <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
          ) : (
            <XCircle className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
          )}
          <p className="text-sm">{example}</p>
        </div>
      ))}
    </div>
  )

  // Generate navigation sections dynamically
  const navigationSections = [
    { id: 'overview', icon: 'Shield', title: 'Overview', description: 'Portfolio summary' },
    ...data.policies.map(policy => ({
      id: policy.id,
      icon: policy.icon,
      title: policy.shortName || policy.name,
      description: policy.description
    })),
    { id: 'comparison', icon: 'FileText', title: 'Compare', description: 'Side by side' },
    { id: 'investment', icon: 'DollarSign', title: 'Investment', description: 'Cost & payment' },
    { id: 'nextsteps', icon: 'ArrowRight', title: 'Next Steps', description: 'Client decision' }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <img src={data.branding.logoUrl} alt={`${data.agent.company} Insurance`} className="h-8" />
              <div>
                <h1 className="text-xl font-bold text-gray-900">{data.client.name}</h1>
                <p className="text-sm text-gray-500">Insurance Portfolio Presentation</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Badge variant="outline" className="text-[#FF5F46] border-[#FF5F46]">
                Quote Valid: {data.quote.validity}
              </Badge>
              <div className="text-right">
                <div className="text-2xl font-bold text-[#FF5F46]">${totalPremium.toLocaleString()}</div>
                <div className="text-sm text-gray-500">Total Annual Premium</div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Navigation */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
          {navigationSections.map((section) => (
            <NavigationCard
              key={section.id}
              section={section.id}
              icon={section.icon}
              title={section.title}
              description={section.description}
              isActive={activeSection === section.id}
              onClick={() => setActiveSection(section.id)}
            />
          ))}
        </div>

        {/* Content Sections */}
        {activeSection === 'overview' && (
          <div className="space-y-8">
            <div className="text-center">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Comprehensive Protection Portfolio</h2>
              <p className="text-lg text-gray-600 max-w-3xl mx-auto">
                Your business deserves comprehensive protection. This portfolio provides layered coverage 
                across general liability, professional services, and cyber risks with industry-leading 
                {data.carrier.name} insurance products.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {data.policies.map((policy) => (
                <PolicyCard 
                  key={policy.id} 
                  policy={policy} 
                  onClick={() => setActiveSection(policy.id)}
                />
              ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Shield className="h-5 w-5 text-[#FF5F46]" />
                    <span>Total Protection</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-[#FF5F46] mb-2">
                    ${(totalProtection / 1000000).toFixed(1)}M+
                  </div>
                  <p className="text-sm text-gray-600">Combined coverage limits</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Calculator className="h-5 w-5 text-blue-500" />
                    <span>Daily Investment</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-blue-500 mb-2">
                    ${Math.round(totalPremium / 365)}
                  </div>
                  <p className="text-sm text-gray-600">Cost per day</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <TrendingUp className="h-5 w-5 text-green-500" />
                    <span>Value Ratio</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-green-500 mb-2">
                    {Math.round(totalProtection / totalPremium)}:1
                  </div>
                  <p className="text-sm text-gray-600">Protection to premium</p>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* Dynamic Policy Sections */}
        {data.policies.map((policy) => (
          activeSection === policy.id && (
            <div key={policy.id} className="space-y-8">
              <div className="text-center">
                <h2 className="text-3xl font-bold text-gray-900 mb-4">{policy.name}</h2>
                <p className="text-lg text-gray-600">{policy.fullDescription}</p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <Card>
                  <CardHeader>
                    <CardTitle>Coverage Details</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="bg-[#FF5F46]/10 border-l-4 border-[#FF5F46] p-4">
                        <div className="text-2xl font-bold text-[#FF5F46]">${policy.premium}</div>
                        <div className="text-sm text-gray-600">Annual Premium</div>
                      </div>
                      
                      <div className="space-y-3">
                        <h4 className="font-semibold">Coverage Limits</h4>
                        {Object.entries(policy.limits).map(([key, value]) => (
                          key !== 'total' && (
                            <div key={key} className="flex justify-between">
                              <span className="capitalize">{key.replace(/([A-Z])/g, ' $1')}</span>
                              <span className="font-medium">
                                {typeof value === 'number' ? `$${value.toLocaleString()}` : value}
                              </span>
                            </div>
                          )
                        ))}
                      </div>

                      <div className="space-y-3">
                        <h4 className="font-semibold">Key Features</h4>
                        <ul className="space-y-2">
                          {policy.keyFeatures.map((feature, index) => (
                            <li key={index} className="flex items-start space-x-2">
                              <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                              <span className="text-sm">{feature}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle>Coverage Examples</CardTitle>
                      <div className="flex space-x-2">
                        <Button
                          variant={showCovered ? "default" : "outline"}
                          size="sm"
                          onClick={() => setShowCovered(true)}
                          className={showCovered ? "bg-[#FF5F46] hover:bg-[#FF5F46]/90" : ""}
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          What's Covered
                        </Button>
                        <Button
                          variant={!showCovered ? "default" : "outline"}
                          size="sm"
                          onClick={() => setShowCovered(false)}
                          className={!showCovered ? "bg-[#FF5F46] hover:bg-[#FF5F46]/90" : ""}
                        >
                          <EyeOff className="h-4 w-4 mr-2" />
                          What's Not Covered
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <CoverageExample 
                      examples={showCovered ? policy.coverageExamples.covered : policy.coverageExamples.notCovered}
                      type={showCovered ? 'covered' : 'notCovered'}
                    />
                  </CardContent>
                </Card>
              </div>
            </div>
          )
        ))}

        {activeSection === 'comparison' && (
          <div className="space-y-8">
            <div className="text-center">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Policy Comparison Matrix</h2>
              <p className="text-lg text-gray-600">Compare coverage limits, deductibles, and key features across all policies</p>
            </div>

            <Card>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-4 text-left font-semibold">Coverage Area</th>
                        {data.policies.map((policy) => (
                          <th key={policy.id} className="px-6 py-4 text-center font-semibold">{policy.name}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {data.comparisonMatrix.map((row, index) => (
                        <tr key={index} className={index % 2 === 0 ? '' : 'bg-gray-50'}>
                          <td className="px-6 py-4 font-medium">{row.coverageArea}</td>
                          {row.policies.map((coverage, policyIndex) => (
                            <td key={policyIndex} className={`px-6 py-4 text-center ${
                              coverage === 'Not Covered' || coverage === 'Excluded' ? 'text-gray-400' : 
                              row.coverageArea === 'Annual Premium' ? 'font-bold text-[#FF5F46]' : ''
                            }`}>
                              {coverage}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {activeSection === 'investment' && (
          <div className="space-y-8">
            <div className="text-center">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Investment Summary</h2>
              <p className="text-lg text-gray-600">Flexible payment options to fit your cash flow needs</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <Card>
                <CardHeader>
                  <CardTitle>Premium Breakdown</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {data.policies.map((policy) => (
                      <div key={policy.id} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                        <div className="flex items-center space-x-3">
                          <div className={`w-3 h-3 rounded-full ${policy.color}`}></div>
                          <span>{policy.name}</span>
                        </div>
                        <span className="font-semibold">${policy.premium}</span>
                      </div>
                    ))}
                    <div className="border-t pt-4">
                      <div className="flex justify-between items-center text-lg font-bold">
                        <span>Total Annual Premium</span>
                        <span className="text-[#FF5F46]">${totalPremium}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Payment Options</CardTitle>
                </CardHeader>
                <CardContent>
                  <Tabs value={selectedPaymentPlan} onValueChange={setSelectedPaymentPlan}>
                    <TabsList className="grid w-full grid-cols-4">
                      <TabsTrigger value="full">Full</TabsTrigger>
                      <TabsTrigger value="two">2-Pay</TabsTrigger>
                      <TabsTrigger value="four">4-Pay</TabsTrigger>
                      <TabsTrigger value="ten">10-Pay</TabsTrigger>
                    </TabsList>
                    {Object.entries(paymentPlans).map(([key, plan]) => (
                      <TabsContent key={key} value={key} className="mt-4">
                        <div className="space-y-3">
                          <div className="flex justify-between">
                            <span>First Payment</span>
                            <span className="font-semibold">
                              ${Math.round(calculatePayment(key).firstPayment)}
                            </span>
                          </div>
                          {plan.payments > 1 && (
                            <>
                              <div className="flex justify-between">
                                <span>Remaining Payments</span>
                                <span>{plan.payments - 1} × $10 fee</span>
                              </div>
                              <div className="flex justify-between">
                                <span>Total Fees</span>
                                <span>${calculatePayment(key).totalFees}</span>
                              </div>
                            </>
                          )}
                          <div className="border-t pt-3">
                            <div className="flex justify-between font-bold">
                              <span>Total Cost</span>
                              <span className="text-[#FF5F46]">
                                ${calculatePayment(key).totalCost}
                              </span>
                            </div>
                          </div>
                        </div>
                      </TabsContent>
                    ))}
                  </Tabs>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Your Insurance Agent</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center space-x-4 mb-4">
                  <img src={data.agent.headshotUrl} alt={data.agent.name} className="w-16 h-16 rounded-full object-cover" />
                  <div>
                    <p className="font-semibold text-lg">{data.agent.name}</p>
                    <p className="text-sm text-gray-600">{data.agent.company}</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <p><strong>Phone:</strong> {data.agent.phone}</p>
                    <p><strong>Email:</strong> {data.agent.email}</p>
                  </div>
                  <div>
                    <p><strong>Quote Valid:</strong> {data.quote.validity}</p>
                    <p><strong>Effective Date:</strong> {data.quote.effectiveDate}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {activeSection === 'nextsteps' && (
          <div className="space-y-8">
            <div className="text-center">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Next Steps</h2>
              <p className="text-lg text-gray-600">Ready to secure your protection or need more information?</p>
            </div>

            {!showPaymentForm && !showDeclineForm && !showConfirmation && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2 text-[#FF5F46]">
                      <CheckCircle className="h-6 w-6" />
                      <span>Move Forward with Coverage</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-gray-600">Select the policies you'd like to secure and proceed with payment.</p>
                    
                    <div className="space-y-3">
                      <h4 className="font-semibold">Select Coverage:</h4>
                      {data.policies.map((policy) => (
                        <div key={policy.id} className="flex items-center space-x-3 p-3 border rounded-lg">
                          <Checkbox
                            id={policy.id}
                            checked={selectedPolicies.includes(policy.id)}
                            onCheckedChange={(checked) => handlePolicySelection(policy.id, checked)}
                          />
                          <Label htmlFor={policy.id} className="flex-1 cursor-pointer">
                            <div className="flex justify-between">
                              <span>{policy.name}</span>
                              <span className="font-semibold text-[#FF5F46]">${policy.premium}</span>
                            </div>
                          </Label>
                        </div>
                      ))}
                    </div>

                    {selectedPolicies.length > 0 && (
                      <div className="border-t pt-4">
                        <div className="flex justify-between font-bold text-lg">
                          <span>Selected Total:</span>
                          <span className="text-[#FF5F46]">${calculateSelectedPremium()}</span>
                        </div>
                      </div>
                    )}

                    <Button 
                      className="w-full bg-[#FF5F46] hover:bg-[#FF5F46]/90"
                      disabled={selectedPolicies.length === 0}
                      onClick={() => setShowPaymentForm(true)}
                    >
                      Proceed to Payment
                    </Button>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2 text-gray-600">
                      <XCircle className="h-6 w-6" />
                      <span>Decline Coverage</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-gray-600">Help us understand your decision by providing feedback.</p>
                    
                    <div className="space-y-3">
                      <Label htmlFor="decline-reason">Reason for declining:</Label>
                      <Select value={declineReason} onValueChange={setDeclineReason}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a reason" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="too-expensive">Too expensive</SelectItem>
                          <SelectItem value="dont-need-all">Don't need all coverages</SelectItem>
                          <SelectItem value="need-time">Need more time to decide</SelectItem>
                          <SelectItem value="found-elsewhere">Found coverage elsewhere</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-3">
                      <Label htmlFor="comments">Additional comments:</Label>
                      <Textarea
                        id="comments"
                        placeholder="Please share any additional feedback..."
                        value={comments}
                        onChange={(e) => setComments(e.target.value)}
                      />
                    </div>

                    <Button 
                      variant="outline"
                      className="w-full"
                      disabled={!declineReason}
                      onClick={() => setShowDeclineForm(true)}
                    >
                      Submit Feedback
                    </Button>
                  </CardContent>
                </Card>
              </div>
            )}

            {showPaymentForm && (
              <Card className="max-w-2xl mx-auto">
                <CardHeader>
                  <CardTitle>Payment Information</CardTitle>
                  <CardDescription>Choose your payment method to secure your coverage</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-semibold mb-2">Selected Coverage:</h4>
                    {data.policies.filter(p => selectedPolicies.includes(p.id)).map(policy => (
                      <div key={policy.id} className="flex justify-between">
                        <span>{policy.name}</span>
                        <span>${policy.premium}</span>
                      </div>
                    ))}
                    <div className="border-t mt-2 pt-2 font-bold">
                      <div className="flex justify-between">
                        <span>Total:</span>
                        <span className="text-[#FF5F46]">${calculateSelectedPremium()}</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <Label>Payment Method:</Label>
                    <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod}>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="credit_card" id="credit_card" />
                        <Label htmlFor="credit_card" className="flex items-center space-x-2">
                          <CreditCard className="h-4 w-4" />
                          <span>Credit Card</span>
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="bank_account" id="bank_account" />
                        <Label htmlFor="bank_account" className="flex items-center space-x-2">
                          <Banknote className="h-4 w-4" />
                          <span>Bank Account (ACH)</span>
                        </Label>
                      </div>
                    </RadioGroup>
                  </div>

                  {paymentMethod === 'credit_card' && (
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="cardNumber">Card Number</Label>
                          <Input
                            id="cardNumber"
                            placeholder="1234 5678 9012 3456"
                            value={cardNumber}
                            onChange={(e) => setCardNumber(e.target.value)}
                          />
                        </div>
                        <div>
                          <Label htmlFor="cardholderName">Cardholder Name</Label>
                          <Input
                            id="cardholderName"
                            placeholder="John Doe"
                            value={cardholderName}
                            onChange={(e) => setCardholderName(e.target.value)}
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="expiryDate">Expiry Date</Label>
                          <Input
                            id="expiryDate"
                            placeholder="MM/YY"
                            value={expiryDate}
                            onChange={(e) => setExpiryDate(e.target.value)}
                          />
                        </div>
                        <div>
                          <Label htmlFor="cvv">CVV</Label>
                          <Input
                            id="cvv"
                            placeholder="123"
                            value={cvv}
                            onChange={(e) => setCvv(e.target.value)}
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {paymentMethod === 'bank_account' && (
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="accountNumber">Account Number</Label>
                          <Input
                            id="accountNumber"
                            placeholder="123456789"
                            value={accountNumber}
                            onChange={(e) => setAccountNumber(e.target.value)}
                          />
                        </div>
                        <div>
                          <Label htmlFor="routingNumber">Routing Number</Label>
                          <Input
                            id="routingNumber"
                            placeholder="021000021"
                            value={routingNumber}
                            onChange={(e) => setRoutingNumber(e.target.value)}
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="accountHolderName">Account Holder Name</Label>
                          <Input
                            id="accountHolderName"
                            placeholder="John Doe"
                            value={accountHolderName}
                            onChange={(e) => setAccountHolderName(e.target.value)}
                          />
                        </div>
                        <div>
                          <Label htmlFor="accountType">Account Type</Label>
                          <Select value={accountType} onValueChange={setAccountType}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select type" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="checking">Checking</SelectItem>
                              <SelectItem value="savings">Savings</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="flex space-x-4">
                    <Button variant="outline" onClick={() => setShowPaymentForm(false)}>
                      Back
                    </Button>
                    <Button 
                      className="flex-1 bg-[#FF5F46] hover:bg-[#FF5F46]/90"
                      onClick={handleAcceptSubmission}
                      disabled={!paymentMethod || 
                        (paymentMethod === 'credit_card' && (!cardNumber || !cardholderName || !expiryDate || !cvv)) ||
                        (paymentMethod === 'bank_account' && (!accountNumber || !routingNumber || !accountHolderName || !accountType))
                      }
                    >
                      Secure My Coverage
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {showDeclineForm && (
              <Card className="max-w-2xl mx-auto">
                <CardHeader>
                  <CardTitle>Confirm Decline</CardTitle>
                  <CardDescription>We appreciate your feedback</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p><strong>Reason:</strong> {declineReason.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}</p>
                    {comments && <p><strong>Comments:</strong> {comments}</p>}
                  </div>
                  
                  <div className="flex space-x-4">
                    <Button variant="outline" onClick={() => setShowDeclineForm(false)}>
                      Back
                    </Button>
                    <Button 
                      className="flex-1 bg-gray-500 hover:bg-gray-600"
                      onClick={handleDeclineSubmission}
                    >
                      Submit Feedback
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {showConfirmation && (
              <Card className="max-w-2xl mx-auto">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <CheckCircle className="h-6 w-6 text-green-500" />
                    <span>
                      {submissionType === 'accept' ? 'Coverage Application Submitted!' : 'Feedback Submitted!'}
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {submissionType === 'accept' ? (
                    <div>
                      <p className="text-gray-600 mb-4">
                        Thank you for choosing our insurance protection. Your application has been submitted successfully.
                      </p>
                      <div className="bg-green-50 border border-green-200 p-4 rounded-lg">
                        <h4 className="font-semibold text-green-800 mb-2">What happens next:</h4>
                        <ul className="text-sm text-green-700 space-y-1">
                          <li>• Your agent will contact you within 24 hours</li>
                          <li>• We'll process your application and payment</li>
                          <li>• You'll receive policy documents via email</li>
                          <li>• Coverage becomes effective on {data.quote.effectiveDate}</li>
                        </ul>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <p className="text-gray-600 mb-4">
                        Thank you for your feedback. We appreciate you taking the time to review our proposal.
                      </p>
                      <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
                        <p className="text-sm text-blue-700">
                          Your agent may follow up with you to address any concerns or provide additional information.
                        </p>
                      </div>
                    </div>
                  )}
                  
                  <div className="text-center pt-4">
                    <p className="text-sm text-gray-500">
                      Questions? Contact {data.agent.name} at {data.agent.phone} or {data.agent.email}
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default App
