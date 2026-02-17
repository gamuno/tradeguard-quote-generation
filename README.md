# Dynamic Insurance Presentation App

A fully dynamic React application for creating interactive insurance presentations. This app reads data from a JSON file and generates a professional presentation with payment processing and webhook integration.

## Features

- **Fully Dynamic**: All content driven by JSON data file
- **Interactive Navigation**: Smooth section transitions with visual feedback
- **Payment Processing**: Credit card and bank account forms
- **Webhook Integration**: Automatic submission to Make.com automation
- **Responsive Design**: Works on desktop, tablet, and mobile
- **Professional Branding**: Customizable colors, logos, and styling

## Quick Start

1. **Install Dependencies**
   ```bash
   cd dynamic-insurance-app
   npm install
   ```

2. **Update Data File**
   Edit `src/data/insurance-data.json` with your quote information

3. **Run Development Server**
   ```bash
   npm run dev
   ```

4. **Build for Production**
   ```bash
   npm run build
   ```

## Data Structure

The app is driven by `src/data/insurance-data.json`. Here's the complete schema:

### Client Information
```json
{
  "client": {
    "name": "Company Name",
    "address": "Business Address",
    "industry": "Industry Type"
  }
}
```

### Agent Information
```json
{
  "agent": {
    "name": "Agent Name",
    "company": "Agency Name",
    "phone": "Phone Number",
    "email": "Email Address",
    "headshotUrl": "URL to agent photo"
  }
}
```

### Insurance Carrier
```json
{
  "carrier": {
    "name": "Carrier Name",
    "amRating": "A.M. Best Rating",
    "financialStrength": "Rating Description"
  }
}
```

### Quote Details
```json
{
  "quote": {
    "number": "Quote Number",
    "date": "Quote Date",
    "validity": "Validity Period",
    "effectiveDate": "Policy Period",
    "expirationDate": "Expiration Date"
  }
}
```

### Branding
```json
{
  "branding": {
    "primaryColor": "#FF5F46",
    "logoUrl": "URL to company logo"
  }
}
```

### Webhook Configuration
```json
{
  "webhook": {
    "url": "Make.com webhook URL",
    "apiKey": "API key for authentication"
  }
}
```

### Policies Array
Each policy in the policies array should have:

```json
{
  "id": "unique_id",
  "name": "Policy Name",
  "shortName": "Short Name",
  "description": "Brief description",
  "fullDescription": "Detailed description",
  "icon": "Lucide icon name",
  "color": "Tailwind color class",
  "premium": 1000,
  "limits": {
    "coverageType1": 1000000,
    "coverageType2": 2000000,
    "total": 3000000
  },
  "deductibles": {
    "property": 1000,
    "liability": 0
  },
  "keyFeatures": [
    "Feature 1",
    "Feature 2"
  ],
  "coverageExamples": {
    "covered": [
      "Example of covered scenario"
    ],
    "notCovered": [
      "Example of excluded scenario"
    ]
  }
}
```

### Comparison Matrix
```json
{
  "comparisonMatrix": [
    {
      "coverageArea": "Coverage Type",
      "policies": ["Policy 1 Limit", "Policy 2 Limit", "Policy 3 Limit"]
    }
  ]
}
```

## Customization

### Adding New Policy Types
1. Add policy object to `policies` array in JSON
2. Include all required fields (id, name, premium, limits, etc.)
3. The app will automatically generate navigation and sections

### Changing Branding
1. Update `branding.primaryColor` in JSON
2. Replace `branding.logoUrl` with your logo
3. Update `agent.headshotUrl` with agent photo

### Modifying Webhook
1. Update `webhook.url` with your Make.com endpoint
2. Set `webhook.apiKey` for authentication
3. Webhook payload includes all form data and presentation URL

## Webhook Payload

### Accept Coverage
```json
{
  "client_name": "Company Name",
  "decision": "accept",
  "selected_policies": ["policy1", "policy2"],
  "payment_method": "credit_card",
  "payment_details": {
    "card_number": "****1234",
    "cardholder_name": "John Doe"
  },
  "total_premium": 2000,
  "agent_email": "agent@company.com",
  "submission_date": "2025-10-14",
  "presentation_url": "https://presentation-url.com"
}
```

### Decline Coverage
```json
{
  "client_name": "Company Name",
  "decision": "decline",
  "decline_reason": "too-expensive",
  "comments": "Additional feedback",
  "total_premium": 2000,
  "agent_email": "agent@company.com",
  "submission_date": "2025-10-14",
  "presentation_url": "https://presentation-url.com"
}
```

## Available Icons

The app uses Lucide React icons. Available icons include:
- Shield, Building, Umbrella, Laptop
- DollarSign, CheckCircle, XCircle, AlertTriangle
- Users, Lock, Zap, FileText
- Calculator, TrendingUp, Eye, EyeOff
- ArrowRight, CreditCard, Banknote

## Deployment

### 1. Deploy the app (this repo)

The project includes `vercel.json` and is set up for **Vercel**. To ship your code changes (e.g. taxes & fees UI, ePay amount):

**Option A – Vercel linked to GitHub**
1. Commit and push to your main branch:
   ```bash
   git add .
   git commit -m "Add taxes & fees support, ePay total includes fees"
   git push origin main
   ```
2. Vercel will build and deploy automatically if the repo is connected.

**Option B – Manual build and deploy**
1. Build locally:
   ```bash
   npm run build
   ```
2. Deploy the `dist` folder to your host (Vercel CLI, Netlify, AWS S3, GitHub Pages, etc.).

### 2. Extraction prompt and workflow (separate from app deploy)

- **Vellum:** Use the prompt and schema in `vellum-extraction-prompt.json`. Copy or import it into your Vellum workflow so the model returns `quote.taxesAndFees`. No “deploy” from this repo—you update the workflow in Vellum.
- **Make.com:** Point the scenario at the updated Vellum prompt (or the same schema). When Make.com pushes new quote JSON to GitHub, include the `quote.taxesAndFees` field so the deployed app can read it.

### 3. Quote JSON and presentation URLs

The app loads quote data from `/quotes/<id>.json` (files in `public/quotes/`). When Make.com (or your pipeline) adds or updates a quote file in this repo and the app is redeployed, the new or updated presentation URL will serve that data. Ensure the extracted JSON includes `quote.taxesAndFees` so the UI and ePay amount are correct.

## Development

### Project Structure
```
src/
├── components/ui/     # Reusable UI components
├── data/             # JSON data files
├── App.jsx           # Main application component
├── main.jsx          # React entry point
├── index.css         # Global styles
└── App.css           # Component styles
```

### Key Features
- **Dynamic Sections**: Automatically generates navigation and content based on policies in JSON
- **Payment Forms**: Complete credit card and bank account forms with validation
- **Webhook Integration**: Secure submission to external automation systems
- **Responsive Design**: Mobile-first design that works on all devices
- **Professional Styling**: Clean, modern interface with customizable branding

## Support

For questions or issues:
1. Check the JSON schema matches the expected format
2. Verify all required fields are present
3. Test webhook URL is accessible
4. Ensure image URLs are publicly accessible

This app provides a complete solution for dynamic insurance presentations with professional styling and full automation integration.
