# Global VIN Decode API

URL: /v2/products/vin-decode

Decode any global VIN to access comprehensive vehicle data and specifications

***

title: Global VIN Decode API
description: Decode any global VIN to access comprehensive vehicle data and specifications
------------------------------------------------------------------------------------------

import { ClickableCodeBlock } from '@/components/clickable-code-block'

The VIN Decode API provides comprehensive vehicle information from any valid 17-character Vehicle Identification Number (VIN) worldwide. Supports vehicles from North America, Europe, Asia, and other global markets.

## Endpoint

```
GET https://api.auto.dev/vin/{vin}
```

## View in Browser

<ClickableCodeBlock code="https://api.auto.dev/vin/3GCUDHEL3NG668790" href="https://api.auto.dev/vin/3GCUDHEL3NG668790" lang="http" />

## Parameters

<TypeTable
  type={{
  vin: {
    description: '17-character Vehicle Identification Number',
    type: 'string',
    required: true,
  },
}}
/>

## Example Request

```bash tab="curl"
curl -X GET "https://api.auto.dev/vin/3GCUDHEL3NG668790" \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json"
```

```javascript tab="JavaScript"
const response = await fetch('https://api.auto.dev/vin/3GCUDHEL3NG668790', {
  headers: {
    Authorization: 'Bearer YOUR_API_KEY',
    'Content-Type': 'application/json',
  },
})

const result = await response.json()
console.log(result.make)
```

```python tab="Python"
import requests

headers = {
    'Authorization': 'Bearer YOUR_API_KEY',
    'Content-Type': 'application/json'
}

response = requests.get(
    'https://api.auto.dev/vin/3GCUDHEL3NG668790',
    headers=headers
)

result = response.json()
print(result)
```

```php tab="PHP"
<?php
$curl = curl_init();

curl_setopt_array($curl, [
    CURLOPT_URL => 'https://api.auto.dev/vin/3GCUDHEL3NG668790',
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_HTTPHEADER => [
        'Authorization: Bearer YOUR_API_KEY',
        'Content-Type: application/json'
    ],
]);

$response = curl_exec($curl);
curl_close($curl);

$result = json_decode($response, true);
print_r($result);
?>
```

## Example Response

```json
{
  "vin": "3GCUDHEL3NG668790",
  "vinValid": true,
  "wmi": "3GC",
  "origin": "Mexico",
  "squishVin": "3GCUDHELNG",
  "checkDigit": "3",
  "checksum": true,
  "type": "Active",
  "make": "Chevrolet",
  "model": "Silverado 1500",
  "trim": "ZR2",
  "style": "4x4 4dr Crew Cab 5.8 ft. SB",
  "body": "Truck",
  "engine": "5.3L V8 OHV 16V FFV",
  "drive": "4WD",
  "transmission": "Automatic",
  "vehicle": {
    "vin": "3GCUDHEL3NG668790",
    "year": 2022,
    "make": "Chevrolet",
    "model": "Silverado 1500",
    "manufacturer": "General Motors de Mexico"
  },
  "ambiguous": false
}
```

## Response Structure

<TypeTable
  type={{
  vin: {
    description: 'Vehicle Identification Number',
    type: 'string',
  },
  vinValid: {
    description: 'Whether the VIN is valid and properly formatted',
    type: 'boolean',
  },
  wmi: {
    description: 'World Manufacturer Identifier (first 3 characters)',
    type: 'string',
  },
  origin: {
    description: 'Country of manufacture',
    type: 'string',
  },
  squishVin: {
    description: 'VIN with model year and check digit removed',
    type: 'string',
  },
  checkDigit: {
    description: 'The 9th character used for VIN validation',
    type: 'string',
  },
  checksum: {
    description: 'Whether the VIN checksum is valid',
    type: 'boolean',
  },
  type: {
    description: 'Vehicle type classification',
    type: 'string',
  },
  make: {
    description: 'Vehicle manufacturer',
    type: 'string',
  },
  model: {
    description: 'Vehicle model name',
    type: 'string',
  },
  trim: {
    description: 'Trim level designation',
    type: 'string',
  },
  style: {
    description: 'Body style and configuration (e.g., "4x4 4dr Crew Cab 5.8 ft. SB")',
    type: 'string',
  },
  body: {
    description: 'Vehicle body class',
    type: 'string',
  },
  engine: {
    description: 'Engine description',
    type: 'string',
  },
  drive: {
    description: 'Drivetrain configuration',
    type: 'string',
  },
  transmission: {
    description: 'Transmission type',
    type: 'string',
  },
  'vehicle.vin': {
    description: 'Vehicle Identification Number (nested object)',
    type: 'string',
  },
  'vehicle.year': {
    description: 'Model year (nested object)',
    type: 'number',
  },
  'vehicle.make': {
    description: 'Vehicle manufacturer (nested object)',
    type: 'string',
  },
  'vehicle.model': {
    description: 'Vehicle model name (nested object)',
    type: 'string',
  },
  'vehicle.manufacturer': {
    description: 'Full manufacturer name (nested object)',
    type: 'string',
  },
  ambiguous: {
    description: 'Whether the VIN corresponds to multiple possible vehicle trims',
    type: 'boolean',
  },
}}
/>

## Use Cases

* **Vehicle Identification**: Validate VIN format and verify vehicle authenticity for purchase decisions
* **Insurance Applications**: Get essential vehicle details for policy creation and risk assessment
* **Fleet Management**: Track and catalog vehicle information across large fleets and inventory systems

## Error Responses

### Invalid VIN

```json
{
  "status": 400,
  "error": "VIN must be exactly 17 characters containing only letters and numbers (excluding I, O, Q)",
  "code": "INVALID_VIN_FORMAT",
  "path": "/vin/123Invalid",
  "requestId": "a1b2c3d4e5f6g7h8"
}
```

### VIN Not Found

```json
{
  "status": 404,
  "error": "No vehicle data found for the provided VIN",
  "code": "VIN_NOT_FOUND",
  "path": "/vin/3GCUDHEL3NG668790",
  "requestId": "b2c3d4e5f6g7h8i9"
}
```

## Interactive API Reference

Ready to test this endpoint? Use our interactive API playground to make live requests and see real responses.

<Card title="Try VIN Decode API" href="/v2/reference/decodeVin" description="Test this endpoint with your API key and explore live responses" />

## Plan Availability

* **Starter**: ✅ Available
* **Growth**: ✅ Available
* **Scale**: ✅ Available

See [pricing](https://auto.dev/pricing) for plan details and signup.
