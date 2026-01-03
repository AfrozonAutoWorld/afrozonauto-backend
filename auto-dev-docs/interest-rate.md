# Interest Rates API

URL: /v2/products/interest-rates

Current auto loan interest rates and financing options based on vehicle and borrower profile

***

title: Interest Rates API
description: Current auto loan interest rates and financing options based on vehicle and borrower profile
---------------------------------------------------------------------------------------------------------

import { ClickableCodeBlock } from '@/components/clickable-code-block'

Get current interest rates for auto loans, leases, and other financing options. Retrieve personalized rates based on vehicle details, credit score, location, and loan terms.

## Endpoint

```
GET https://api.auto.dev/apr/{vin}
```

## View in Browser

<ClickableCodeBlock code="https://api.auto.dev/apr/1C4HJXEN5MW592818?year=2021&make=Jeep&model=Wrangler&zip=37129&creditScore=720&vehicleAge=3&vehicleMileage=36000" href="https://api.auto.dev/apr/1C4HJXEN5MW592818?year=2021&make=Jeep&model=Wrangler&zip=37129&creditScore=720&vehicleAge=3&vehicleMileage=36000" lang="http" />

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
  year: {
    description: 'Model year of the vehicle',
    type: 'number',
    required: true,
  },
  make: {
    description: 'Vehicle manufacturer',
    type: 'string',
    required: true,
  },
  model: {
    description: 'Vehicle model name',
    type: 'string',
    required: true,
  },
  zip: {
    description: '5-digit ZIP code for location-based rates',
    type: 'string',
    required: true,
  },
  creditScore: {
    description: 'Credit score for rate calculation',
    type: 'string',
    required: true,
  },
  vehicleAge: {
    description: 'Age of the vehicle in years',
    type: 'number',
    required: false,
  },
  vehicleMileage: {
    description: 'Current vehicle mileage',
    type: 'string',
    required: false,
  },
}}
/>

## Example Request

```bash tab="curl"
curl -X GET "https://api.auto.dev/apr/1C4HJXEN5MW592818?year=2021&make=Jeep&model=Wrangler&zip=37129&creditScore=720&vehicleAge=3&vehicleMileage=36000" \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json"
```

```javascript tab="JavaScript"
const response = await fetch(
  'https://api.auto.dev/apr/1C4HJXEN5MW592818?year=2021&make=Jeep&model=Wrangler&zip=37129&creditScore=720&vehicleAge=3&vehicleMileage=36000',
  {
    headers: {
      Authorization: 'Bearer YOUR_API_KEY',
      'Content-Type': 'application/json',
    },
  },
)

const rates = await response.json()
console.log(rates.apr)
```

```python tab="Python"
import requests

url = 'https://api.auto.dev/apr/1C4HJXEN5MW592818'
headers = {
    'Authorization': 'Bearer YOUR_API_KEY',
    'Content-Type': 'application/json'
}

params = {
    'year': 2021,
    'make': 'Jeep',
    'model': 'Wrangler',
    'zip': '37129',
    'creditScore': '720',
    'vehicleAge': 3,
    'vehicleMileage': '36000'
}

response = requests.get(url, headers=headers, params=params)
rates = response.json()
print(rates['apr'])
```

```php tab="PHP"
<?php
$vin = '1C4HJXEN5MW592818';
$queryParams = http_build_query([
    'year' => 2021,
    'make' => 'Jeep',
    'model' => 'Wrangler',
    'zip' => '37129',
    'creditScore' => '720',
    'vehicleAge' => 3,
    'vehicleMileage' => '36000'
]);

$url = "https://api.auto.dev/apr/{$vin}?{$queryParams}";

$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, $url);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'Authorization: Bearer YOUR_API_KEY',
    'Content-Type: application/json'
]);

$response = curl_exec($ch);
$rates = json_decode($response, true);
echo json_encode($rates['apr']);
curl_close($ch);
?>
```

## Response Structure

<TypeTable
  type={{
  vehicle: {
    description: 'Vehicle information used for rate calculation',
    type: 'object',
  },
  'vehicle.vin': {
    description: 'Vehicle Identification Number',
    type: 'string',
  },
  'vehicle.year': {
    description: 'Model year',
    type: 'number',
  },
  'vehicle.make': {
    description: 'Vehicle manufacturer',
    type: 'string',
  },
  'vehicle.model': {
    description: 'Vehicle model',
    type: 'string',
  },
  zip: {
    description: 'ZIP code used for location-based rates',
    type: 'string',
  },
  creditScore: {
    description: 'Credit score used for rate calculation',
    type: 'string',
  },
  vehicleAge: {
    description: 'Age of vehicle in years',
    type: 'number',
  },
  vehicleMileage: {
    description: 'Vehicle mileage',
    type: 'string',
  },
  apr: {
    description: 'Interest rates by loan term in months',
    type: 'object',
  },
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

## Example Response

```json
{
  "vehicle": {
    "vin": "1C4HJXEN5MW592818",
    "year": 2021,
    "make": "Jeep",
    "model": "Wrangler"
  },
  "zip": "37129",
  "creditScore": "720",
  "vehicleAge": 3,
  "vehicleMileage": "36000",
  "apr": {
    "36": 7.644,
    "48": 7.644,
    "60": 7.524,
    "72": 7.663,
    "84": 8.263
  }
}
```

## Error Responses

### Invalid VIN

```json
{
  "status": 400,
  "error": "VIN must be exactly 17 characters containing only letters and numbers (excluding I, O, Q)",
  "code": "INVALID_VIN_FORMAT",
  "path": "/apr/123Invalid",
  "requestId": "a1b2c3d4e5f6g7h8"
}
```

### VIN Not Found

```json
{
  "status": 404,
  "error": "No vehicle data found for the provided VIN",
  "code": "VIN_NOT_FOUND",
  "path": "/apr/WP0AF2A99KS165242",
  "requestId": "b2c3d4e5f6g7h8i9"
}
```

## Interactive API Reference

Ready to test this endpoint? Use our interactive API playground to make live requests and see real responses.

<Card title="Try Interest Rates API" href="/v2/reference/getInterestRates" description="Test this endpoint with your API key and explore live responses" />

## Plan Availability

* **Starter**: ❌ Not available
* **Growth**: ✅ Available
* **Scale**: ✅ Available

See [pricing](https://auto.dev/pricing) for plan details and signup.
