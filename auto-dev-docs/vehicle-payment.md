# Vehicle Payments API

URL: /v2/products/vehicle-payments

Detailed vehicle financing calculations including loan payments, taxes, fees, and total cost breakdown

***

title: Vehicle Payments API
description: Detailed vehicle financing calculations including loan payments, taxes, fees, and total cost breakdown
-------------------------------------------------------------------------------------------------------------------

import { Accordion, Accordions } from 'fumadocs-ui/components/accordion'
import { ClickableCodeBlock } from '@/components/clickable-code-block'

Calculate detailed vehicle payment information including loan amounts, monthly payments, taxes, fees, and complete cost breakdowns. Get accurate financing estimates based on vehicle details, purchase price, location, and loan terms.

## Endpoint

```
GET https://api.auto.dev/payments/{vin}
```

## View in Browser

<ClickableCodeBlock code="https://api.auto.dev/payments/1C4RJFAG0FC625797?price=25000&zip=55414&docFee=200&tradeIn=0&downPayment=5000&loanTerm=60" href="https://api.auto.dev/payments/1C4RJFAG0FC625797?price=25000&zip=55414&docFee=200&tradeIn=0&downPayment=5000&loanTerm=60" lang="http" />

## Parameters

### Path Parameters

<TypeTable
  type={{
  vin: {
    description: '17-character Vehicle Identification Number',
    type: 'string',
    required: true,
  },
}}
/>

### Query Parameters

<TypeTable
  type={{
  price: {
    description: 'Vehicle sales price',
    type: 'string',
    required: true,
  },
  zip: {
    description: '5-digit ZIP code for tax and fee calculations',
    type: 'string',
    required: true,
  },
  docFee: {
    description: 'Dealer documentation fee',
    type: 'number',
    required: false,
  },
  tradeIn: {
    description: 'Trade-in vehicle value',
    type: 'string',
    required: false,
    default: '0',
  },
  downPayment: {
    description: 'Down payment amount',
    type: 'number',
    required: false,
  },
  loanTerm: {
    description: 'Loan term in months',
    type: 'number',
    required: false,
    default: 60,
  },
}}
/>

## Example Request

```bash tab="curl"
curl -X GET "https://api.auto.dev/payments/1C4RJFAG0FC625797?price=25000&zip=55414&docFee=200&tradeIn=0&downPayment=5000&loanTerm=60" \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json"
```

```javascript tab="JavaScript"
const response = await fetch(
  'https://api.auto.dev/payments/1C4RJFAG0FC625797?price=25000&zip=55414&docFee=200&tradeIn=0&downPayment=5000&loanTerm=60',
  {
    headers: {
      Authorization: 'Bearer YOUR_API_KEY',
      'Content-Type': 'application/json',
    },
  },
)

const payments = await response.json()
console.log(payments.paymentsData)
```

```python tab="Python"
import requests

url = 'https://api.auto.dev/payments/1C4RJFAG0FC625797'
headers = {
    'Authorization': 'Bearer YOUR_API_KEY',
    'Content-Type': 'application/json'
}

params = {
    'price': '25000',
    'zip': '55414',
    'docFee': 200,
    'tradeIn': '0',
    'downPayment': 5000,
    'loanTerm': 60
}

response = requests.get(url, headers=headers, params=params)
payments = response.json()
print(payments['paymentsData'])
```

```php tab="PHP"
<?php
$vin = '1C4RJFAG0FC625797';
$queryParams = http_build_query([
    'price' => '25000',
    'zip' => '55414',
    'docFee' => 200,
    'tradeIn' => '0',
    'downPayment' => 5000,
    'loanTerm' => 60
]);

$url = "https://api.auto.dev/payments/{$vin}?{$queryParams}";

$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, $url);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'Authorization: Bearer YOUR_API_KEY',
    'Content-Type: application/json'
]);

$response = curl_exec($ch);
$payments = json_decode($response, true);
echo json_encode($payments['paymentsData']);
curl_close($ch);
?>
```

## Response Structure

<Accordions type="multiple">
  <Accordion id="main-payment-data" title="Main Payment Data">
    <TypeTable
      type={{
  'paymentsData.loanAmount': {
    description: 'Total amount to be financed after down payment and trade-in',
    type: 'number',
  },
  'paymentsData.loanMonthlyPayment': {
    description: 'Monthly loan payment (principal + interest only)',
    type: 'number',
  },
  'paymentsData.loanMonthlyPaymentWithTaxes': {
    description: 'Monthly payment including taxes and fees',
    type: 'number',
  },
  'paymentsData.totalTaxesAndFees': {
    description: 'Total amount of taxes and fees',
    type: 'number',
  },
}}
    />
  </Accordion>

  <Accordion id="tax-breakdown" title="Tax Breakdown">
    <TypeTable
      type={{
  'taxes.combinedSalesTax': {
    description: 'Total sales tax amount',
    type: 'number',
  },
  'taxes.stateSalesTax': {
    description: 'State-level sales tax',
    type: 'number',
  },
  'taxes.gasGuzzlerTax': {
    description: 'Federal gas guzzler tax (if applicable)',
    type: 'number',
  },
}}
    />
  </Accordion>

  <Accordion id="fee-breakdown" title="Fee Breakdown">
    <TypeTable
      type={{
  'fees.titleFee': {
    description: 'Vehicle title processing fee',
    type: 'number',
  },
  'fees.registrationFee': {
    description: 'Vehicle registration fee',
    type: 'number',
  },
  'fees.dmvFee': {
    description: 'Total DMV-related fees',
    type: 'number',
  },
  'fees.combinedFees': {
    description: 'Sum of all fees',
    type: 'number',
  },
  'fees.docFee': {
    description: 'Dealer documentation fee',
    type: 'number',
  },
}}
    />
  </Accordion>

  <Accordion id="apr-rates" title="APR Rates by Term">
    <TypeTable
      type={{
  'apr.36': {
    description: '36-month loan APR percentage',
    type: 'number',
  },
  'apr.48': {
    description: '48-month loan APR percentage',
    type: 'number',
  },
  'apr.60': {
    description: '60-month loan APR percentage',
    type: 'number',
  },
  'apr.72': {
    description: '72-month loan APR percentage',
    type: 'number',
  },
  'apr.84': {
    description: '84-month loan APR percentage',
    type: 'number',
  },
}}
    />
  </Accordion>
</Accordions>

## Example Response

```json
{
  "vehicle": {
    "vin": "1C4RJFAG0FC625797",
    "year": "2015",
    "make": "Jeep",
    "model": "Grand Cherokee"
  },
  "criteria": {
    "price": "25000",
    "zip": "55414",
    "docFee": 200,
    "tradeIn": "0"
  },
  "paymentsData": {
    "loanAmount": 21952.49,
    "loanMonthlyPayment": 363.83,
    "loanMonthlyPaymentWithTaxes": 399.35,
    "totalTaxesAndFees": 1952.49,
    "taxes": {
      "combinedSalesTax": 1625,
      "stateSalesTax": 1625,
      "gasGuzzlerTax": 0
    },
    "fees": {
      "titleFee": 8.25,
      "registrationFee": 70.99,
      "dmvFee": 48.25,
      "combinedFees": 327.49,
      "docFee": 200,
      "dmvFees": {
        "Filing Fee": 7,
        "License Plate Fee": 15.5,
        "Public Safety Vehicle Fee": 3.5,
        "Technology Fee": 2.25,
        "Wheelage Tax": 20
      }
    },
    "calculationCriteria": {
      "numberOfMonths": 60,
      "financeRate": 3.5,
      "downPayment": 5000,
      "tradeIn": 0,
      "tradeInOwedAmount": 0,
      "salesPrice": 25000,
      "conditionalIncentiveAmount": 0,
      "primaryIncentiveAmount": 0,
      "docFee": 200,
      "zipCode": "55414",
      "styleId": 200701040,
      "marketValue": 25000,
      "withConcreteTaxesAndFees": true,
      "applyLimits": true,
      "msrp": 25000,
      "lowerLimit": false
    }
  },
  "apr": {
    "36": 9.25,
    "48": 9.25,
    "60": 9.25,
    "72": 9.25,
    "84": 9.25
  },
  "totalTaxesAndFees": 1952.49,
  "taxes": {
    "combinedSalesTax": 1625,
    "stateSalesTax": 1625,
    "gasGuzzlerTax": 0
  },
  "fees": {
    "titleFee": 8.25,
    "registrationFee": 70.99,
    "dmvFee": 48.25,
    "combinedFees": 327.49,
    "docFee": 200,
    "dmvFees": {
      "Filing Fee": 7,
      "License Plate Fee": 15.5,
      "Public Safety Vehicle Fee": 3.5,
      "Technology Fee": 2.25,
      "Wheelage Tax": 20
    }
  }
}
```

## Use Cases

* **Payment Calculators**: Build interactive tools for customers to estimate monthly payments and total costs
* **Dealership Finance**: Calculate financing options and present payment scenarios to customers
* **Auto Lending**: Evaluate loan structures and payment terms for different borrower profiles

## Error Responses

### Invalid VIN

```json
{
  "status": 400,
  "error": "VIN must be exactly 17 characters containing only letters and numbers (excluding I, O, Q)",
  "code": "INVALID_VIN_FORMAT",
  "path": "/payments/123Invalid",
  "requestId": "a1b2c3d4e5f6g7h8"
}
```

### VIN Not Found

```json
{
  "status": 404,
  "error": "No vehicle data found for the provided VIN",
  "code": "VIN_NOT_FOUND",
  "path": "/payments/WP0AF2A99KS165242",
  "requestId": "b2c3d4e5f6g7h8i9"
}
```

### Source Error

```json
{
  "status": 503,
  "error": "Payment calculation service temporarily unavailable",
  "code": "SOURCE_ERROR",
  "path": "/payments/1GYKPDRSXSZ102995",
  "requestId": "c3d4e5f6g7h8i9j0"
}
```

## Interactive API Reference

Ready to test this endpoint? Use our interactive API playground to make live requests and see real responses.

<Card title="Try Vehicle Payments API" href="/v2/reference/calculateVehiclePayments" description="Test this endpoint with your API key and explore live responses" />

## Plan Availability

* **Starter**: ❌ Not available
* **Growth**: ✅ Available
* **Scale**: ✅ Available

See [pricing](https://auto.dev/pricing) for plan details and signup.
