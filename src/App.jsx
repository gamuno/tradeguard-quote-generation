import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select.jsx'
import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button.jsx'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card.jsx'
import { Badge } from '@/components/ui/badge.jsx'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs.jsx'
import { Progress } from '@/components/ui/progress.jsx'
import { Label } from '@/components/ui/label.jsx'
import { Textarea } from '@/components/ui/textarea.jsx'
import { Checkbox } from '@/components/ui/checkbox.jsx'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group.jsx'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible.jsx'
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
  Banknote,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Phone,
  Mail,
  Clock,
  Award,
  Target,
  Handshake,
  Smartphone,
  HeadphonesIcon,
  FileCheck,
  MessageSquare,
  Calendar,
  Globe,
  Star,
  Wrench,
  Network,
  Bot
} from 'lucide-react'
import './App.css'

function App() {
  const [activeSection, setActiveSection] = useState('overview')
  const [showCovered, setShowCovered] = useState(true)
  const [selectedPaymentPlan, setSelectedPaymentPlan] = useState('full')
  const scrollContainerRef = useRef(null)
  
  // Next Steps form states
  const [selectedPolicies, setSelectedPolicies] = useState([])
  const [declineReason, setDeclineReason] = useState('')
  const [comments, setComments] = useState('')
  const [showDeclineForm, setShowDeclineForm] = useState(false)

  // FAQ state
  const [openFAQ, setOpenFAQ] = useState(null)

  
// quote specific data 
const [data, setData] = useState(null);
const [loading, setLoading] = useState(true);
const [loadError, setLoadError] = useState(null);

useEffect(() => {
  (async () => {
    try {
      const params = new URLSearchParams(window.location.search);
      const urlId = params.get('id');

      // Works in both Vite and Next:
      const isDev =
        (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.MODE !== 'production') ||
        (typeof process !== 'undefined' && process.env && process.env.NODE_ENV !== 'production');

      // Fallback to demo in dev if no id is provided
      const id = urlId || (isDev ? 'demo' : null);
      if (!id) throw new Error('Missing id');

      const res = await fetch(`/quotes/${encodeURIComponent(id)}.json`, {
        headers: { Accept: 'application/json' },
      });
      if (!res.ok) throw new Error('NOT_FOUND');

      const json = await res.json();
      setData(json);
      setLoadError(null);
    } catch (e) {
      setData(null);
      setLoadError(e.message === 'NOT_FOUND' ? 'Quote not found' : 'Missing id');
    } finally {
      setLoading(false);
    }
  })();
}, []);

// === ePayPolicy Prefill helpers (replace or add) ===
const EPAY_BASE = "https://gmpeters.epaypolicy.com";

const toUSDString = (n) => {
  const num = Number(n || 0);
  return num.toFixed(2); // 2 decimals for the query param
};

// Builds: https://gmpeters.epaypolicy.com?amount=123.45&comments=...
const buildEpayPrefillUrl = ({ amount, comments }) => {
  const params = new URLSearchParams({
    amount: toUSDString(amount),
    comments // URLSearchParams will encode newlines as %0A, etc.
  });
  return `${EPAY_BASE}?${params.toString()}`;
};


const brandColor = data?.branding?.primaryColor || '#FF5F46'

// SAFE when data is still null
const totalPremium = (data?.policies ?? []).reduce((sum, policy) => sum + (Number(policy.premium) || 0), 0)
const totalProtection = (data?.policies ?? []).reduce((sum, policy) => sum + (Number(policy?.limits?.total) || 0), 0)
  // existing
const fmt = (n) =>
  n?.toLocaleString?.('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }) ?? '$0'

const resolveFeeForCount = (installments, count) => {
  const base = Number(installments?.perInstallmentFee || 0)
  const ov = (installments?.overrides || []).find(o => Number(o.count) === Number(count))
  return Number(ov?.perInstallmentFee ?? base)
}

// optional: can keep or remove; not used by single-tabset
const computeInstallmentBreakdown = (policy) => {
  const po = policy.paymentOptions
  const inst = po?.installments
  if (!po || !inst || !Array.isArray(inst.counts) || inst.counts.length === 0) return []
  const base = Number(po.totalPremium ?? policy.premium ?? 0)
  const downPct = Number(inst.downPaymentPercent || 0)
  const downPayment = downPct > 0 ? (base * (downPct / 100)) : 0
  const financed = Math.max(base - downPayment, 0)
  return inst.counts.map((countRaw) => {
    const count = Number(countRaw || 0)
    if (count <= 0) return null
    const fee = resolveFeeForCount(inst, count)
    const perPayment = financed / count
    const perPaymentWithFee = perPayment + fee
    const totalFees = fee * count
    const totalPaid = downPayment + (perPaymentWithFee * count)
    return {
      count, perInstallmentFee: fee, downPaymentPercent: downPct, downPayment,
      perPayment, perPaymentWithFee, totalFees, totalPaid
    }
  }).filter(Boolean)
}

// NEW: add these two for the single-tabset
const getAllCounts = (policies) => {
  const set = new Set()
  for (const p of policies) {
    const counts = p?.paymentOptions?.installments?.counts
    if (Array.isArray(counts)) counts.forEach(c => Number.isFinite(+c) && set.add(+c))
  }
  return Array.from(set).sort((a, b) => a - b)
}

const computePlanForCount = (policy, count) => {
  const po = policy?.paymentOptions
  const inst = po?.installments
  if (!po || !inst) return null

  const base = Number(po.totalPremium ?? policy.premium ?? 0)
  const fee  = resolveFeeForCount(inst, count)

  const totalFees = fee * Number(count)
  const totalPaid = base + totalFees

  return {
    count: Number(count),
    perInstallmentFee: fee, // kept for math/debug if needed
    totalFees,
    totalPaid
  }
}

// Allowed counts = intersection across selected policies
const getCountsForPolicy = (policy) =>
  Array.isArray(policy?.paymentOptions?.installments?.counts)
    ? policy.paymentOptions.installments.counts.map(Number).filter(n => Number.isFinite(n))
    : []

const getAllowedCountsForSelection = (policies, selectedIds) => {
  const selected = policies.filter(p => selectedIds.includes(p.id))
  if (selected.length === 0) return []
  let set = new Set(getCountsForPolicy(selected[0]))
  for (const p of selected.slice(1)) {
    const next = new Set(getCountsForPolicy(p))
    set = new Set([...set].filter(x => next.has(x)))
  }
  return [...set].sort((a,b)=>a-b)
}

// Amount calculators
const computePolicyFullAmount = (policy) =>
  Number(policy.paymentOptions?.fullPay?.amount ?? policy.premium ?? policy.paymentOptions?.totalPremium ?? 0)

const computePolicyTotalForCount = (policy, count) => {
  const plan = computePlanForCount(policy, count)
  return Number(plan?.totalPaid ?? 0)
}

// Build a selection summary for the chosen plan
// plan can be "full" or a number (count)
const computeSelectionTotals = (plan, policies, selectedIds) => {
  const selected = policies.filter(p => selectedIds.includes(p.id))
  const perPolicy = selected.map(p => {
    if (plan === 'full') {
      const amount = computePolicyFullAmount(p)
      return { policyId: p.id, policyName: p.name, type: 'full', amount }
    }
    const planObj = computePlanForCount(p, Number(plan))
    return {
      policyId: p.id,
      policyName: p.name,
      type: 'installments',
      count: Number(plan),
      totalFees: Number(planObj?.totalFees ?? 0),
      totalPaid: Number(planObj?.totalPaid ?? 0)
    }
  })

  const grandTotal = perPolicy.reduce(
    (s, row) => s + (row.type === 'full' ? row.amount : row.totalPaid || 0),
    0
  )
  return { perPolicy, grandTotal }
}


  // === Derived metrics ===
const costPerThousand = totalProtection > 0 ? (totalPremium / (totalProtection / 1000)) : 0
const costPerDay = totalPremium > 0 ? (totalPremium / 365) : 0
const roiRatio = totalPremium > 0 ? `${Math.round(totalProtection / totalPremium).toLocaleString()}:1` : '—'

// === Coverage Areas from comparisonMatrix ===
// Include any row where at least one policy isn't "Not Covered"/"Excluded"
const coverageAreas = Array.isArray(data?.comparisonMatrix)
  ? data.comparisonMatrix
      .filter(row =>
        Array.isArray(row.policies) &&
        row.policies.some(p => {
          const v = String(p || '').toLowerCase()
          return v !== 'not covered' && v !== 'excluded' && v !== ''
        })
      )
      .map(row => row.coverageArea)
  : []

// Optional summaries (fallback to empty arrays if not present)
const coverageStrengths = data?.summaries?.coverageStrengths ?? []
const considerations = data?.summaries?.considerations ?? []


  const getIconComponent = (iconName) => {
    const icons = {
      Shield, Building, Umbrella, Laptop, DollarSign, CheckCircle, XCircle, 
      AlertTriangle, Users, Lock, Zap, FileText, Calculator, TrendingUp, 
      Eye, EyeOff, ArrowRight, CreditCard, Banknote, Phone, Mail, Clock,
      Award, Target, Handshake, Smartphone, HeadphonesIcon, FileCheck,
      MessageSquare, Calendar, Globe, Star, Wrench, Network, Bot
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

  // Scrollable navigation functions
  const scrollLeft = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: -200, behavior: 'smooth' })
    }
  }

  const scrollRight = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: 200, behavior: 'smooth' })
    }
  }

  // Auto-scroll to active tab
  useEffect(() => {
    if (scrollContainerRef.current) {
      const activeTab = scrollContainerRef.current.querySelector('.navigation-tab.active')
      if (activeTab) {
        activeTab.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' })
      }
    }
  }, [activeSection])

  // FAQ data
  const faqs = [
    {
      question: "What should I do if I have a claim?",
      answer: "Simply use our online claim forms to submit your information - we handle everything else. Our claims team will guide you through the entire process, from initial reporting to final settlement. You'll have a dedicated claims advocate assigned to your case within 24 hours."
    },
    {
      question: "What if I have a service request or need help?",
      answer: "Our technology makes our service available 24/7. You can submit service requests through our client portal, mobile app, or by calling our dedicated service line. Most requests are handled within 2 hours during business hours."
    },
    {
      question: "How do I add or remove coverage during my policy term?",
      answer: "Changes can be made easily through your online account or by contacting your agent. Most coverage changes take effect within 24-48 hours. We'll provide you with updated documents and confirmation of all changes."
    },
    {
      question: "What is CertAssist and how does it help my business?",
      answer: "CertAssist is our proprietary technology that automates subcontractor compliance tracking. It automatically requests, validates, and follows up on Certificates of Insurance (COIs), saving you hours of administrative work and ensuring you're always compliant."
    },
    {
      question: "How quickly can I get a certificate of insurance?",
      answer: "Basic certificates are available instantly through our client portal 24/7. We also use AI to process custom COIs and contract reviews in minutes, ensuring you are always in compliance with insurance requirements."
    },
    {
      question: "What happens if my business grows or changes?",
      answer: "We proactively monitor your business growth and will reach out to discuss coverage adjustments. Our risk management technology alerts us to potential coverage gaps as your business evolves, ensuring you're always properly protected."
    },
    {
      question: "How do I access my policy documents?",
      answer: "All policy documents are available 24/7 through your secure client portal. You'll also receive email notifications for any policy updates, renewals, or important notices. Documents can be downloaded, shared, or printed as needed."
    },
    {
      question: "What makes TradeGuard different from other insurance brokers?",
      answer: "We combine 30+ years of family industry experience with cutting-edge technology. Unlike traditional brokers who are stuck in the past, or purely digital platforms with no human connection, we provide the perfect balance of high-tech efficiency and high-touch service."
    }
  ]

  // Scrollable navigation tab component
  const ScrollableNavigationTab = ({ section, icon: iconName, title, description, isActive, onClick }) => {
    const Icon = getIconComponent(iconName)
    return (
      <div
        onClick={onClick}
        style={{ 
          width: 'fit-content',
          minWidth: 'auto',
          maxWidth: 'none'
        }}
        className={`navigation-tab flex-shrink-0 cursor-pointer transition-all duration-200 ${
          isActive ? 'active border-[#FF5F46] border-2' : 'border-gray-200 border hover:border-gray-300'
        } rounded-lg p-4 bg-white`}
      >
        <div className="flex items-center space-x-3" style={{ whiteSpace: 'nowrap' }}>
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
            isActive ? 'bg-[#FF5F46] text-white' : 'bg-gray-100 text-gray-600'
          }`}>
            <Icon className="h-5 w-5" />
          </div>
          <div>
            <div className="font-semibold text-gray-900 text-sm" style={{ whiteSpace: 'nowrap' }}>{title}</div>
            <div className="text-xs text-gray-500" style={{ whiteSpace: 'nowrap' }}>{description}</div>
          </div>
        </div>
      </div>
    )
  }

  const PolicyCard = ({ policy, onClick }) => {
    const Icon = getIconComponent(policy.icon)
    return (
      <Card className="cursor-pointer transition-all duration-300 hover:shadow-lg hover:scale-105 border-0 shadow-md" onClick={onClick}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
            <div className="p-3 rounded-lg bg-gray-100 text-gray-500">
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
  ...(data?.policies ?? []).map(policy => ({
    id: policy.id,
    icon: policy.icon,
    title: policy.name,
    description: policy.description
  })),
  { id: 'comparison', icon: 'FileText', title: 'Policy Comparison', description: 'Side by side analysis' },
  { id: 'investment', icon: 'DollarSign', title: 'Investment Summary', description: 'Cost & payment options' },
  { id: 'nextsteps', icon: 'ArrowRight', title: 'Next Steps', description: 'Client decision' },
  { id: 'aboutus', icon: 'Users', title: 'About TradeGuard', description: 'Why choose us' },
  { id: 'faq', icon: 'MessageSquare', title: 'FAQ', description: 'Common questions' }
]
if (loading) {
  return <div className="min-h-screen grid place-items-center">Loading…</div>;
}
if (loadError || !data) {
  return <div className="min-h-screen grid place-items-center">{loadError || 'Error'}</div>;
}
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
{/* Header */}
<header className="bg-white shadow-sm border-b">
  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    <div className="py-4">
      {/* Top row - Logo and Premium */}
      <div className="flex items-center justify-between mb-3 sm:mb-0">
        <img src={data.branding.logoUrl} alt={`${data.agent.company} Insurance`} className="h-6 sm:h-8" />
        <div className="text-right">
          <div className="text-lg sm:text-2xl font-bold text-[#FF5F46]">${totalPremium.toLocaleString()}</div>
          <div className="text-xs sm:text-sm text-gray-500">Total Annual Premium</div>
        </div>
      </div>
      
      {/* Middle row - Client name and description */}
      <div className="text-center sm:text-left mb-3 sm:mb-0">
        <h1 className="text-lg sm:text-xl font-bold text-gray-900">{data.client.name}</h1>
        <p className="text-sm text-gray-500">Insurance Portfolio Presentation</p>
      </div>
      
      {/* Bottom row - Quote validity */}
      <div className="text-center sm:text-right">
        <Badge variant="outline" className="text-[#FF5F46] border-[#FF5F46] text-xs sm:text-sm">
          Quote Valid: {data.quote.validity}
        </Badge>
      </div>
    </div>
  </div>
</header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Scrollable Horizontal Navigation */}
        <div className="relative mb-8">
{/* Left scroll button */}
<button
  onClick={scrollLeft}
  className="absolute left-2 top-1/2 transform -translate-y-1/2 z-10 bg-white shadow-lg rounded-full p-2 hover:bg-gray-50 transition-colors"
  style={{ marginLeft: '8px' }}
>
  <ChevronLeft className="h-4 w-4 text-gray-600" />
</button>

{/* Right scroll button */}
<button
  onClick={scrollRight}
  className="absolute right-2 top-1/2 transform -translate-y-1/2 z-10 bg-white shadow-lg rounded-full p-2 hover:bg-gray-50 transition-colors"
  style={{ marginRight: '8px' }}
>
  <ChevronRight className="h-4 w-4 text-gray-600" />
</button>

          {/* Scrollable container */}
          <div
  ref={scrollContainerRef}
  className="flex gap-4 overflow-x-auto scrollbar-hide py-2 px-12"
  style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
>
            {navigationSections.map((section) => (
              <ScrollableNavigationTab
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
        </div>

        {/* Content Sections */}
        {activeSection === 'overview' && (
          <div className="space-y-8">
            <div className="text-center">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Comprehensive Protection Portfolio</h2>
              <p className="text-lg text-gray-600 max-w-3xl mx-auto">
                Your business deserves comprehensive protection. This portfolio provides layered coverage 
                across general liability, professional services, and cyber risks with industry-leading {data.carrier.name} insurance products.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {data.policies.map((policy) => (
                <PolicyCard 
                  key={policy.id} 
                  policy={policy} 
                  onClick={() => setActiveSection(policy.id)}
                />
              ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="shadow-sm border-0 bg-white">
  <CardContent className="p-8">
    <div className="flex items-center space-x-4 mb-4">
      <TrendingUp className="h-8 w-8 text-[#FF5F46]" />
      <h3 className="text-xl font-semibold text-gray-900">Total Protection Value</h3>
    </div>
    <div className="text-4xl font-bold text-[#FF5F46] mb-2">
  ${(totalProtection / 1000000).toFixed(1)}M
</div>
    <p className="text-lg text-gray-600">Combined liability limits across all policies</p>
  </CardContent>
</Card>

<Card className="shadow-sm border-0 bg-white">
  <CardContent className="p-8">
    <div className="flex items-center space-x-4 mb-4">
      <CheckCircle className="h-8 w-8 text-green-500" />
      <h3 className="text-xl font-semibold text-gray-900">Coverage Areas</h3>
    </div>
    <div className="space-y-3">
  {coverageAreas.length === 0 ? (
    <div className="text-sm text-gray-500">No coverage areas found.</div>
  ) : (
    coverageAreas.map((area, idx) => (
      <div key={idx} className="flex items-center space-x-3">
        <CheckCircle className="h-5 w-5 text-green-500" />
        <span className="text-lg">{area}</span>
      </div>
    ))
  )}
</div>
  </CardContent>
</Card>

<Card className="shadow-sm border-0 bg-white">
  <CardContent className="p-8">
    <div className="flex items-center space-x-4 mb-4">
      <Calculator className="h-8 w-8 text-blue-500" />
      <h3 className="text-xl font-semibold text-gray-900">Cost Efficiency</h3>
    </div>
    <div className="text-4xl font-bold text-blue-600 mb-2">
  ${costPerThousand.toFixed(2)}
</div>
    <p className="text-lg text-gray-600 mb-2">Cost per $1,000 of protection</p>
    <p className="text-base text-gray-500">Exceptional value for comprehensive coverage</p>
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
                <p className="text-2xl font-bold text-[#FF5F46]">${policy.premium} Annual Premium</p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <Card>
                  <CardHeader>
                    <CardTitle>Coverage Limits & Deductibles</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {Object.entries(policy.limits).map(([key, value]) => (
                        key !== 'total' && (
                          <div key={key} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-b-0">
                            <span className="font-medium capitalize">{key.replace(/([A-Z])/g, ' $1')}</span>
                            <span className={`font-semibold ${key.toLowerCase().includes('deductible') || key.toLowerCase().includes('retention') ? 'text-orange-600' : ''}`}>
                              {typeof value === 'number' ? `$${value.toLocaleString()}` : value}
                            </span>
                          </div>
                        )
                      ))}
                      {policy.deductibles && Object.entries(policy.deductibles).map(([key, value]) => (
                        <div key={key} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-b-0">
                          <span className="font-medium capitalize">{key.replace(/([A-Z])/g, ' $1')}</span>
                          <span className="font-semibold text-orange-600">
                            {typeof value === 'number' ? `$${value.toLocaleString()}` : value}
                          </span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Key Features</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {policy.keyFeatures.map((feature, index) => (
                        <div key={index} className="flex items-start space-x-3">
                          <div className="w-5 h-5 rounded-full bg-[#FF5F46] flex items-center justify-center mt-0.5">
                            <CheckCircle className="h-3 w-3 text-white" />
                          </div>
                          <span className="text-sm">{feature}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Real-World Examples</CardTitle>
                    <div className="flex flex-col sm:flex-row gap-2 sm:gap-2 sm:space-x-0">
  <Button
    variant={showCovered ? "default" : "outline"}
    onClick={() => setShowCovered(true)}
    className={`flex-1 sm:flex-none ${showCovered ? "bg-[#FF5F46] hover:bg-[#FF5F46]/90 text-white" : "border-gray-300 text-gray-700 hover:bg-gray-50"}`}
  >
    <Eye className="h-4 w-4 mr-2" />
    What's Covered
  </Button>
  <Button
    variant={!showCovered ? "default" : "outline"}
    onClick={() => setShowCovered(false)}
    className={`flex-1 sm:flex-none ${!showCovered ? "bg-[#FF5F46] hover:bg-[#FF5F46]/90 text-white" : "border-gray-300 text-gray-700 hover:bg-gray-50"}`}
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    <span>Coverage Strengths</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                <div className="space-y-3">
  {coverageStrengths.length === 0 ? (
    <div className="text-sm text-gray-500">No strengths available.</div>
  ) : (
    coverageStrengths.map((item, idx) => (
      <div key={idx} className="flex items-center space-x-2">
        <CheckCircle className="h-4 w-4 text-green-500" />
        <span className="text-sm">{item}</span>
      </div>
    ))
  )}
</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <AlertTriangle className="h-5 w-5 text-yellow-500" />
                    <span>Important Considerations</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                <div className="space-y-3">
  {considerations.length === 0 ? (
    <div className="text-sm text-gray-500">No considerations available.</div>
  ) : (
    considerations.map((item, idx) => (
      <div key={idx} className="flex items-start space-x-2">
        <AlertTriangle className="h-4 w-4 text-yellow-500 mt-0.5" />
        <span className="text-sm">{item}</span>
      </div>
    ))
  )}
</div>
                </CardContent>
              </Card>
            </div>
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
                      <div key={policy.id} className="flex justify-between items-center">
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

{/* PAYMENT OPTIONS — Single Tabset Aggregating All Policies (keeps prior styling) */}
<Card className="mb-6">
  <CardHeader>
    <CardTitle>Payment Options</CardTitle>
    <CardDescription>
      Choose a plan to view per-policy breakdown
    </CardDescription>
  </CardHeader>

  <CardContent>
    {(() => {
      const allCounts = getAllCounts(data.policies)   // e.g., [2,4,10]
      const defaultTab = "full"
      const brandColor = data?.branding?.primaryColor || "#FF5F46"

      return (
        <Tabs defaultValue={defaultTab} className="w-full">
          {/* Triggers — same look as before */}
          <TabsList className="w-full inline-flex h-10 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground overflow-x-auto">
            <TabsTrigger className="flex-1 whitespace-nowrap" value="full">Full Pay</TabsTrigger>
            {allCounts.map((c) => (
              <TabsTrigger
                key={`trig-${c}`}
                value={`count-${c}`}
                className="flex-1 whitespace-nowrap"
              >
                {c}-Payments
              </TabsTrigger>
            ))}
          </TabsList>

          {/* FULL PAY TAB */}
          <TabsContent value="full" className="mt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {data.policies.map((policy) => {
                const po = policy.paymentOptions
                if (!po) return null
                const amount = Number(po.fullPay?.amount ?? policy.premium ?? po.totalPremium ?? 0)
                const discount = Number(po.fullPay?.discountAmount ?? 0)
                return (
                  <div key={`full-${policy.id}`} className="rounded-xl border border-gray-200 p-5 flex items-center justify-between">
                    <div>
                      <div className="text-sm text-gray-500">{policy.name}</div>
                      <div className="text-2xl font-bold">{fmt(amount)}</div>
                      {discount > 0 && (
                        <div className="text-xs text-green-600 mt-1">
                          Saves {fmt(discount)}
                        </div>
                      )}
                    </div>
                    <div className="text-right text-sm text-gray-600">
                      No installment fees
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Full Pay total footer */}
            {(() => {
              const fullTotal = data.policies.reduce((sum, policy) => {
                const po = policy.paymentOptions
                if (!po) return sum
                const amount = Number(po.fullPay?.amount ?? policy.premium ?? po.totalPremium ?? 0)
                return sum + (Number.isFinite(amount) ? amount : 0)
              }, 0)
              return (
                <div className="mt-4 flex justify-end">
                  <div className="text-xl font-bold" style={{ color: brandColor }}>
                    Total Due (Full Pay): {fmt(fullTotal)}
                  </div>
                </div>
              )
            })()}
          </TabsContent>

          {/* COUNT TABS (2-Payments, 4-Payments, 10-Payments, etc.) */}
          {allCounts.map((c) => (
            <TabsContent key={`pane-${c}`} value={`count-${c}`} className="mt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {data.policies.map((policy) => {
                  const po = policy.paymentOptions
                  const counts = po?.installments?.counts
                  if (!po || !Array.isArray(counts) || !counts.includes(c)) return null

                  const plan = computePlanForCount(policy, c)
                  if (!plan) return null

                  return (
         <div key={`p-${policy.id}-${c}`} className="rounded-xl border border-gray-200 p-5">
  <div className="flex items-start justify-between gap-4">
    <div className="space-y-1.5">
      <div className="text-sm text-gray-500">{policy.name}</div>
      <div className="text-lg font-semibold">{c} Payments</div>
      {plan.totalFees > 0 && (
        <div className="text-xs text-gray-600">
          Total fees included: <span className="font-medium">{fmt(plan.totalFees)}</span>
        </div>
      )}
    </div>
    <div className="text-right">
      <div className="text-sm text-gray-500">Total Due</div>
      <div className="text-2xl font-bold leading-tight">{fmt(plan.totalPaid)}</div>
    </div>
  </div>
</div>
                  )
                })}
              </div>

              {/* N-Payments total footer */}
              {(() => {
                const totalForCount = data.policies.reduce((sum, policy) => {
                  const counts = policy?.paymentOptions?.installments?.counts
                  if (!Array.isArray(counts) || !counts.includes(c)) return sum
                  const plan = computePlanForCount(policy, c)
                  const paid = Number(plan?.totalPaid ?? 0)
                  return sum + (Number.isFinite(paid) ? paid : 0)
                }, 0)
                return (
                  <div className="mt-4 flex justify-end">
                    <div className="text-xl font-bold" style={{ color: brandColor }}>
                      Total Paid ({c}-Payments): {fmt(totalForCount)}
                    </div>
                  </div>
                )
              })()}
            </TabsContent>
          ))}
        </Tabs>
      )
    })()}
  </CardContent>
</Card>



            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center space-x-2 text-sm">
                    <Shield className="h-4 w-4 text-[#FF5F46]" />
                    <span>Protection Value</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                <div className="text-2xl font-bold text-[#FF5F46] mb-1">
  ${(totalProtection / 1000000).toFixed(1)}M
</div>
                  <p className="text-xs text-gray-600">Total liability limits</p>
                  <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                    <div className="bg-[#FF5F46] h-2 rounded-full" style={{width: '100%'}}></div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center space-x-2 text-sm">
                    <Calculator className="h-4 w-4 text-blue-500" />
                    <span>Cost Per Day</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                <div className="text-2xl font-bold text-blue-500 mb-1">
  ${costPerDay.toFixed(2)}
</div>
                  <p className="text-xs text-gray-600">Daily protection cost</p>
                  <p className="text-xs text-gray-500 mt-1">Less than a coffee</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center space-x-2 text-sm">
                    <TrendingUp className="h-4 w-4 text-green-500" />
                    <span>ROI Protection</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-500 mb-1">
  {roiRatio}
</div>
                  <p className="text-xs text-gray-600">Protection to premium ratio</p>
                  <p className="text-xs text-gray-500 mt-1">Exceptional value for comprehensive coverage</p>
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

            {!showDeclineForm && (
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
  
  {/* Select Coverage checklist (unchanged) */}
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

  {/* INSERTED: Plan selector + plan-aware total */}
  {selectedPolicies.length > 0 && (() => {
    // intersection of counts across selected policies
    const allowedCounts = getAllowedCountsForSelection(data.policies, selectedPolicies)
    const { grandTotal } = computeSelectionTotals(
      selectedPaymentPlan,        // 'full' or number
      data.policies,
      selectedPolicies
    )

    return (
      <>
        <div className="space-y-3 mt-4">
          <h4 className="font-semibold">Choose Payment Plan:</h4>
          <RadioGroup
            value={String(selectedPaymentPlan)}
            onValueChange={(v) => setSelectedPaymentPlan(v === 'full' ? 'full' : Number(v))}
            className="grid grid-cols-1 sm:grid-cols-4 gap-2"
          >
            <div className="flex items-center space-x-2 border rounded-lg p-2">
              <RadioGroupItem value="full" id="plan-full" />
              <Label htmlFor="plan-full">Full Pay</Label>
            </div>
            {allowedCounts.map((c) => (
              <div key={c} className="flex items-center space-x-2 border rounded-lg p-2">
                <RadioGroupItem value={String(c)} id={`plan-${c}`} />
                <Label htmlFor={`plan-${c}`}>{c}-Payments</Label>
              </div>
            ))}
          </RadioGroup>
        </div>

        <div className="border-t pt-4 flex justify-between font-bold text-lg">
          <span>
            Selected Total ({selectedPaymentPlan === 'full' ? 'Full Pay' : `${selectedPaymentPlan}-Payments`}):
          </span>
          <span className="text-[#FF5F46]">{fmt(grandTotal)}</span>
        </div>
      </>
    )
  })()}

<Button
  className="w-full bg-[#FF5F46] hover:bg-[#FF5F46]/90"
  disabled={selectedPolicies.length === 0}
  onClick={async () => {
  // compute totals with your existing helper
  const { perPolicy, grandTotal } = computeSelectionTotals(
    selectedPaymentPlan, // 'full' or number
    data.policies,
    selectedPolicies
  );

  // list of selected policy names for the Notes line
  const selectedPolicyNames = perPolicy.map(p => p.policyName).join(", ");

  // label for plan line
  const planLabel = selectedPaymentPlan === 'full' ? 'Full Pay' : `${selectedPaymentPlan}-Payments`;

  // quote id from URL (your page already uses this)
  const quoteId = new URLSearchParams(window.location.search).get('id') || 'demo';

  // === NEW: Notes/Comments EXACTLY as requested (multi-line) ===
  //   TradeGuard Payment
  //   Client Name: ...
  //   Decision: accept
  //   Selected Policies: ...
  //   Payment Plan: ...
  //   Total Due: ...
  //   Quote ID: ...
  const comments = [
    `TradeGuard Payment`,
    `Client Name: ${data.client.name}`,
    `Decision: accept`,
    `Selected Policies: ${selectedPolicyNames}`,
    `Payment Plan: ${planLabel}`,
    `Total Due: ${toUSDString(grandTotal)}`,
    `Quote ID: ${quoteId}`
  ].join("\n"); // newline-separated (becomes %0A in the URL)

  // Build the ePay URL with amount + comments
  const epayUrl = buildEpayPrefillUrl({
    amount: grandTotal,
    comments
  });

  // Open ePay in a new tab (keeps your presentation page intact)
  window.open(epayUrl, "_blank", "noopener,noreferrer");
}}

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
          </div>
        )}

        {/* About Us Section */}
        {activeSection === 'aboutus' && (
          <div className="space-y-8">
            <div className="text-center">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Why Choose TradeGuard Insurance?</h2>
              <p className="text-lg text-gray-600 max-w-3xl mx-auto">
                We're revolutionizing insurance for the trades by combining decades of experience with cutting-edge technology.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <Card className="border-l-4 border-l-[#FF5F46]">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-3">
                    <Wrench className="h-6 w-6 text-[#FF5F46]" />
                    <span>Specialized for the Trades</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600">
                    We're not a generalist agency trying to be everything to everyone. TradeGuard is built specifically 
                    for trades businesses, understanding your unique risks, challenges, and opportunities. Our expertise 
                    runs deep in construction, contracting, and skilled trades industries.
                  </p>
                </CardContent>
              </Card>

              <Card className="border-l-4 border-l-blue-500">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-3">
                    <Target className="h-6 w-6 text-blue-500" />
                    <span>The Perfect Balance</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600">
                    Most brokers are either old-school and stuck in the past, or entirely digital with no human connection. 
                    We fill that gap perfectly - combining 30+ years of family industry experience with modern technology 
                    to create a digital-first brokerage that still provides the personal touch you deserve.
                  </p>
                </CardContent>
              </Card>

              <Card className="border-l-4 border-l-green-500">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-3">
                    <Network className="h-6 w-6 text-green-500" />
                    <span>Complete Business Ecosystem</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600">
                    Beyond insurance, we partner with dozens of referral partners to help with any business need. 
                    From marketing and accounting to payroll, billing, and legal services - our partner program 
                    connects you to trusted professionals who understand the trades industry.
                  </p>
                </CardContent>
              </Card>

              <Card className="border-l-4 border-l-purple-500">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-3">
                    <Bot className="h-6 w-6 text-purple-500" />
                    <span>Technology Built for Trades</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600">
                    Our CertAssist tool automates subcontractor compliance tracking, making it effortless to request, 
                    validate, and follow up on all Certificate of Insurance issues. We provide enterprise-level 
                    technology at a fraction of the cost of other vendors.
                  </p>
                </CardContent>
              </Card>
            </div>

            <Card className="bg-gradient-to-r from-[#FF5F46] to-[#FF8A75] text-white">
              <CardHeader>
                <CardTitle className="flex items-center space-x-3 text-white">
                  <Award className="h-6 w-6" />
                  <span>World-Class Risk Management for Everyone</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-white/90 mb-4">
                  Most agencies only provide white-gloved, high-level risk management teams to massive companies. 
                  We believe every company deserves that service, which is why we're building technology to provide 
                  a world-class risk management team in your pocket.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                  <div className="text-center">
                    <div className="text-2xl font-bold">30+</div>
                    <div className="text-sm text-white/80">Years Experience</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold">24/7</div>
                    <div className="text-sm text-white/80">Technology Support</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold">100%</div>
                    <div className="text-sm text-white/80">Trades Focused</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardHeader className="text-center">
                  <Handshake className="h-12 w-12 text-[#FF5F46] mx-auto mb-2" />
                  <CardTitle className="text-lg">Personal Relationships</CardTitle>
                </CardHeader>
                <CardContent className="text-center">
                  <p className="text-sm text-gray-600">
                    You'll work with real people who understand your business and are invested in your success.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="text-center">
                  <Smartphone className="h-12 w-12 text-blue-500 mx-auto mb-2" />
                  <CardTitle className="text-lg">Modern Technology</CardTitle>
                </CardHeader>
                <CardContent className="text-center">
                  <p className="text-sm text-gray-600">
                    Access your policies, submit claims, and manage compliance from anywhere, anytime.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="text-center">
                  <Star className="h-12 w-12 text-yellow-500 mx-auto mb-2" />
                  <CardTitle className="text-lg">Proven Results</CardTitle>
                </CardHeader>
                <CardContent className="text-center">
                  <p className="text-sm text-gray-600">
                    Our clients see reduced claims, improved compliance, and significant time savings.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* FAQ Section */}
        {activeSection === 'faq' && (
          <div className="space-y-8">
            <div className="text-center">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Frequently Asked Questions</h2>
              <p className="text-lg text-gray-600">
                Get answers to common questions about our insurance services and processes.
              </p>
            </div>

            <div className="max-w-4xl mx-auto space-y-4">
              {faqs.map((faq, index) => (
                <Card key={index}>
                  <Collapsible open={openFAQ === index} onOpenChange={() => setOpenFAQ(openFAQ === index ? null : index)}>
                    <CollapsibleTrigger asChild>
                      <CardHeader className="cursor-pointer hover:bg-gray-50 transition-colors">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-left text-lg font-semibold">{faq.question}</CardTitle>
                          {openFAQ === index ? (
                            <ChevronUp className="h-5 w-5 text-gray-500" />
                          ) : (
                            <ChevronDown className="h-5 w-5 text-gray-500" />
                          )}
                        </div>
                      </CardHeader>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <CardContent className="pt-0">
                        <p className="text-gray-600 leading-relaxed">{faq.answer}</p>
                      </CardContent>
                    </CollapsibleContent>
                  </Collapsible>
                </Card>
              ))}
            </div>

            <Card className="bg-orange-50 border-orange-200">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 text-orange-800">
                  <HeadphonesIcon className="h-6 w-6" />
                  <span>Still Have Questions?</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-orange-1000 mb-4">
                  Our team is here to help! Contact us anytime for personalized assistance with your insurance needs.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="flex items-center space-x-2">
                    <Phone className="h-4 w-4 text-orange-900" />
                    <span className="text-sm">{data.agent.phone}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Mail className="h-4 w-4 text-orange-900" />
                    <span className="text-sm">{data.agent.email}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Clock className="h-4 w-4 text-orange-900" />
                    <span className="text-sm">24/7 Online Support</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}

export default App
