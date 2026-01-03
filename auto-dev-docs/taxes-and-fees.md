# Taxes & Fees API

URL: /v2/products/taxes-fees

Calculate all applicable taxes and fees for vehicle sales based on VIN, location, and transaction details

***

title: Taxes & Fees API
description: Calculate all applicable taxes and fees for vehicle sales based on VIN, location, and transaction details
----------------------------------------------------------------------------------------------------------------------

import { Accordion, Accordions } from 'fumadocs-ui/components/accordion'
import { ClickableCodeBlock } from '@/components/clickable-code-block'

Retrieve comprehensive tax and fee calculations for vehicle sales transactions. This API provides accurate, location-specific tax rates and government fees, ensuring compliance with local regulations and transparent pricing for both dealers and consumers.

## Endpoint

```
GET https://api.auto.dev/taxes/{vin}
```

## View in Browser

<ClickableCodeBlock code="https://api.auto.dev/taxes/19UDE2F31MA000428?zip=94020&price=25000&docFee=200" href="https://api.auto.dev/taxes/19UDE2F31MA000428?zip=94020&price=25000&docFee=200" lang="http" />

## Parameters

### Path Parameters

<TypeTable
  type={{
  vin: {
    description: 'The Vehicle Identification Number (e.g. 19UDE2F31MA000428)',
    type: 'string',
    required: true,
  },
}}
/>

### Query Parameters

<TypeTable
  type={{
  price: {
    description: 'The vehicle price (e.g., 25000). Defaults to 25000 if not provided.',
    type: 'number',
    required: false,
  },
  zip: {
    description: 'The ZIP code of the location (e.g. 94020). If not provided, defaults to user zipcode or 94020.',
    type: 'string',
    required: false,
  },
  docFee: {
    description: 'Documentation fee (e.g., 200). Defaults to 200 if not provided.',
    type: 'number',
    required: false,
  },
  tradeIn: {
    description: 'Trade-in value to deduct from taxable amount (e.g., 5000). Defaults to 0 if not provided.',
    type: 'number',
    required: false,
  },
  rate: {
    description: 'Interest rate for financing calculations (e.g., 9.99). Defaults to 9.99 if not provided.',
    type: 'number',
    required: false,
  },
  downPayment: {
    description: 'Down payment amount (e.g., 5000). Defaults to 0 if not provided.',
    type: 'number',
    required: false,
  },
  months: {
    description: 'Loan term in months (e.g., 72). Defaults to 72 if not provided.',
    type: 'number',
    required: false,
  },
}}
/>

## Example Request

```bash tab="curl"
curl -X GET "https://api.auto.dev/taxes/19UDE2F31MA000428?zip=94020&price=25000&docFee=200" \
  -H "Authorization: Bearer YOUR_API_KEY"
```

```javascript tab="JavaScript"
const vin = '19UDE2F31MA000428'
const params = new URLSearchParams({
  zip: '94020',
  price: '25000',
  docFee: '200',
  rate: '9.99',
})

const response = await fetch(`https://api.auto.dev/taxes/${vin}?${params}`, {
  headers: {
    Authorization: 'Bearer YOUR_API_KEY',
  },
})

const taxData = await response.json()
console.log(`Total: $${taxData.totalTaxesAndFees}`)
```

```python tab="Python"
import requests

vin = '19UDE2F31MA000428'
params = {
    'zip': '94020',
    'price': '25000',
    'docFee': '200',
    'rate': '9.99'
}

headers = {
    'Authorization': 'Bearer YOUR_API_KEY'
}

response = requests.get(
    f'https://api.auto.dev/taxes/{vin}',
    headers=headers,
    params=params
)

tax_data = response.json()
print(f"Total: ${tax_data['totalTaxesAndFees']}")
```

```php tab="PHP"
<?php
$vin = '19UDE2F31MA000428';
$params = http_build_query([
    'zip' => '94020',
    'price' => '25000',
    'docFee' => '200',
    'rate' => '9.99'
]);

$curl = curl_init();

curl_setopt_array($curl, [
    CURLOPT_URL => "https://api.auto.dev/taxes/{$vin}?{$params}",
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_HTTPHEADER => [
        'Authorization: Bearer YOUR_API_KEY'
    ]
]);

$response = curl_exec($curl);
curl_close($curl);

$taxData = json_decode($response, true);
echo "Total: $" . $taxData['totalTaxesAndFees'];
?>
```

## Response Structure

<Accordions type="multiple">
  <Accordion id="vehicle-info" title="Vehicle Information">
    <TypeTable
      type={{
  'vehicle.vin': {
    description: 'Vehicle Identification Number',
    type: 'string',
  },
  'vehicle.year': {
    description: 'Model year',
    type: 'string',
  },
  'vehicle.make': {
    description: 'Vehicle manufacturer',
    type: 'string',
  },
  'vehicle.model': {
    description: 'Vehicle model name',
    type: 'string',
  },
}}
    />
  </Accordion>

  <Accordion id="calculation-criteria" title="Calculation Criteria">
    <TypeTable
      type={{
  'criteria.price': {
    description: 'Vehicle sale price used for calculations',
    type: 'number',
  },
  'criteria.zip': {
    description: 'ZIP code for tax jurisdiction lookup',
    type: 'string',
  },
  'criteria.docFee': {
    description: 'Documentation fee included in calculation',
    type: 'number',
  },
  'criteria.tradeIn': {
    description: 'Trade-in value deducted from taxable amount',
    type: 'string',
  },
}}
    />
  </Accordion>

  <Accordion id="summary" title="Summary">
    <TypeTable
      type={{
  totalTaxesAndFees: {
    description: 'Total amount of all taxes and fees combined',
    type: 'number',
  },
}}
    />
  </Accordion>

  <Accordion id="tax-breakdown" title="Tax Breakdown">
    <TypeTable
      type={{
  'taxes.stateSalesTax': {
    description: 'State-level sales tax amount',
    type: 'number',
  },
  'taxes.countySalesTax': {
    description: 'County-level sales tax amount',
    type: 'number',
  },
  'taxes.citySalesTax': {
    description: 'City-level sales tax amount',
    type: 'number',
  },
  'taxes.districtSalesTax': {
    description: 'Special district sales tax amount',
    type: 'number',
  },
  'taxes.combinedSalesTax': {
    description: 'Total of all sales taxes',
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
    description: 'Standard DMV processing fee',
    type: 'number',
  },
  'fees.docFee': {
    description: 'Dealer documentation fee',
    type: 'number',
  },
  'fees.combinedFees': {
    description: 'Total of all government fees',
    type: 'number',
  },
  'fees.dmvFees': {
    description: 'Detailed breakdown of DMV-specific fees',
    type: 'object',
  },
}}
    />
  </Accordion>
</Accordions>

## Example Response

```json
{
  "vehicle": {
    "vin": "19UDE2F31MA000428",
    "year": 2021,
    "make": "Acura",
    "model": "ILX"
  },
  "criteria": {
    "price": "85000",
    "zip": "90210",
    "docFee": 200,
    "tradeIn": 0
  },
  "totalTaxesAndFees": 9585.5,
  "taxes": {
    "citySalesTax": 637.5,
    "combinedSalesTax": 8500,
    "countySalesTax": 212.5,
    "districtSalesTax": 2550,
    "stateSalesTax": 5100,
    "gasGuzzlerTax": 0
  },
  "fees": {
    "titleFee": 23,
    "registrationFee": 65,
    "dmvFee": 797.5,
    "combinedFees": 1085.5,
    "docFee": 200,
    "dmvFees": {
      "Air Quality Fee": 6,
      "Alternative Fuel/Technology Fee": 3,
      "Auto theft deterrence/DUI fee": 2,
      "Fingerprint ID Fee": 1,
      "Highway Patrol Fee": 29,
      "Reflectorized license plate fee": 1,
      "Service Authority for Freeway Emergencies fee": 1,
      "Smog Abatement Fee": 12,
      "Transfer Fee": 15,
      "Transportation Improvement Fee": 175,
      "Vehicle License Fee": 552.5
    }
  }
}
```

## Use Cases

* **Dealership Sales Calculator**: Build accurate "out-the-door" pricing for customers including all taxes and fees
* **Multi-State Comparison**: Compare total registration costs across different states for purchase optimization
* **Financing Integration**: Calculate accurate amounts to finance including all applicable taxes and fees

## Error Responses

### Invalid Request

```json
{
  "status": 400,
  "error": "Oops! Something went wrong while fetching your taxes.",
  "code": "INVALID_REQUEST",
  "path": "/taxes/WP0AF2A99KS165242?zip=12345",
  "requestId": "b2c3d4e5f6g7h8i9",
  "suggestion": "Please check zip code: 12345"
}
```

### Invalid VIN

```json
{
  "status": 400,
  "error": "VIN must be exactly 17 characters containing only letters and numbers (excluding I, O, Q)",
  "code": "INVALID_VIN_FORMAT",
  "path": "/taxes/123Invalid",
  "requestId": "a1b2c3d4e5f6g7h8"
}
```

### VIN Not Found

```json
{
  "status": 404,
  "error": "No vehicle data found for the provided VIN",
  "code": "VIN_NOT_FOUND",
  "path": "/taxes/WP0AF2A99KS165242",
  "requestId": "c3d4e5f6g7h8i9j0"
}
```

## Interactive API Reference

Ready to test this endpoint? Use our interactive API playground to make live requests and see real responses.

<Card title="Try Taxes & Fees API" href="/v2/reference/calculateTaxesAndFees" description="Test this endpoint with your API key and explore live responses" />

## Plan Availability

* **Starter**: ❌ Not available
* **Growth**: ❌ Not available
* **Scale**: ✅ Available

See [pricing](https://auto.dev/pricing) for plan details and signup.
