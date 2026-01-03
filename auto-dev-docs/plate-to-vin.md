# Plate-to-VIN API

URL: /v2/products/plate-to-vin

Convert US license plates to VIN numbers and retrieve comprehensive vehicle information

***

title: Plate-to-VIN API
description: Convert US license plates to VIN numbers and retrieve comprehensive vehicle information
----------------------------------------------------------------------------------------------------

import { ClickableCodeBlock } from '@/components/clickable-code-block'

Quickly decode any US license plate to get the VIN, year, make, model, and comprehensive vehicle information. This powerful API connects license plate data to detailed vehicle records across all 50 states.

## Endpoint

```
GET https://api.auto.dev/plate/{plateState}/{plateNumber}?state={state}
```

## View in Browser

<ClickableCodeBlock code="https://api.auto.dev/plate/CA/ABC123" href="https://api.auto.dev/plate/CA/ABC123" lang="http" />

## Parameters

<TypeTable
  type={{
  plate: {
    description: 'US license plate number to lookup',
    type: 'string',
    required: true,
  },
  state: {
    description: '2-letter state code where the plate is registered (e.g., CA, NY, TX)',
    type: 'string',
    required: true,
  },
}}
/>

## Example Request

```bash tab="curl"
curl -X GET "https://api.auto.dev/plate/CA/ABC123" \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json"
```

```javascript tab="JavaScript"
const response = await fetch('https://api.auto.dev/plate/CA/ABC123', {
  headers: {
    Authorization: 'Bearer YOUR_API_KEY',
    'Content-Type': 'application/json',
  },
})

const plateData = await response.json()
console.log(plateData.vehicle)
```

```python tab="Python"
import requests

headers = {
    'Authorization': 'Bearer YOUR_API_KEY',
    'Content-Type': 'application/json'
}

response = requests.get(
    'https://api.auto.dev/plate/CA/ABC123',
    headers=headers
)

plate_data = response.json()
print(plate_data['vehicle'])
```

```php tab="PHP"
<?php
$curl = curl_init();

curl_setopt_array($curl, [
    CURLOPT_URL => 'https://api.auto.dev/plate/CA/ABC123',
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_HTTPHEADER => [
        'Authorization: Bearer YOUR_API_KEY',
        'Content-Type: application/json'
    ],
]);

$response = curl_exec($curl);
curl_close($curl);

$plateData = json_decode($response, true);
print_r($plateData['vehicle']);
?>
```

## Response Structure

<TypeTable
  type={{
  vin: {
    description: 'Complete 17-character Vehicle Identification Number',
    type: 'string',
  },
  year: {
    description: 'Model year of the vehicle',
    type: 'number',
  },
  make: {
    description: 'Vehicle manufacturer name',
    type: 'string',
  },
  model: {
    description: 'Vehicle model name',
    type: 'string',
  },
  trim: {
    description: 'Complete trim designation',
    type: 'string',
  },
  drivetrain: {
    description: 'Vehicle drivetrain configuration',
    type: 'string',
  },
  engine: {
    description: 'Engine specification',
    type: 'string',
  },
  transmission: {
    description: 'Transmission type',
    type: 'string',
  },
  isDefault: {
    description: 'Whether this is the default configuration for the VIN',
    type: 'boolean',
  },
}}
/>

## Example Response

```json
{
  "vin": "1N4BL4BV3LC205823",
  "year": 2020,
  "make": "Nissan",
  "model": "Altima",
  "trim": "2.5 S Sedan 4D",
  "drivetrain": "FWD",
  "engine": "4-Cyl, 2.5 Liter",
  "transmission": "Automatic, Xtronic CVT",
  "isDefault": true
}
```

## State Coverage

The Plate-to-VIN API supports license plate lookups across all 50 US states with varying coverage levels by region.

### Supported Plate Formats

* **Standard plates**: ABC123, 123ABC, AB1234
* **Vanity plates**: Custom personalized plates
* **Commercial plates**: Truck, taxi, and fleet vehicles
* **Special formats**: Plates with hyphens (AB-123) are automatically handled

## Error Responses

### Invalid License Plate

```json
{
  "status": 400,
  "error": "License plate must be 2-8 alphanumeric characters",
  "code": "INVALID_PLATE_FORMAT",
  "path": "/plate/CA/ABC12345XYZ",
  "requestId": "a1b2c3d4e5f6g7h8"
}
```

### Invalid State Code

```json
{
  "status": 400,
  "error": "State must be a valid 2-letter US state code (e.g., CA, NY, TX)",
  "code": "INVALID_STATE_CODE",
  "path": "/plate/XX/ABC123",
  "requestId": "b2c3d4e5f6g7h8i9"
}
```

### No Data Found

```json
{
  "status": 404,
  "error": "License plate found but no vehicle data available",
  "code": "NO_DATA_FOUND",
  "path": "/plate/CA/ABC123",
  "requestId": "d4e5f6g7h8i9j0k1"
}
```

### Plate Not Found

```json
{
  "status": 404,
  "error": "No vehicle found for the provided license plate",
  "code": "PLATE_NOT_FOUND",
  "path": "/plate/CA/XYZ999",
  "requestId": "c3d4e5f6g7h8i9j0"
}
```

## Interactive API Reference

Ready to test this endpoint? Use our interactive API playground to make live requests and see real responses.

<Card title="Try Plate-to-VIN API" href="/v2/reference/convertPlateToVin" description="Test this endpoint with your API key and explore live responses" />

## Plan Availability

* **Starter**: ❌ Not available
* **Growth**: ❌ Not available
* **Scale**: ✅ Available

See [pricing](https://auto.dev/pricing) for plan details and signup.
