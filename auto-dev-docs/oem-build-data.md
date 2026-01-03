# OEM Build Data API

URL: /v2/products/oem-build-data

Retrieve complete vehicle build information including trim, colors, options, and MSRP data

***

title: OEM Build Data API
description: Retrieve complete vehicle build information including trim, colors, options, and MSRP data
-------------------------------------------------------------------------------------------------------

import { Accordion, Accordions } from 'fumadocs-ui/components/accordion'
import { ClickableCodeBlock } from '@/components/clickable-code-block'

Retrieve complete vehicle build information based on the VIN, including exact trim details, drivetrain, engine specifications, interior/exterior colors, factory options, and MSRP data. This comprehensive API provides the most detailed vehicle information available from OEM build records.

## Endpoint

```
GET https://api.auto.dev/build/{vin}
```

## View in Browser

<ClickableCodeBlock code="https://api.auto.dev/build/WP0AF2A99KS165242" href="https://api.auto.dev/build/WP0AF2A99KS165242" lang="http" />

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
curl -X GET "https://api.auto.dev/build/WP0AF2A99KS165242" \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json"
```

```javascript tab="JavaScript"
const response = await fetch('https://api.auto.dev/build/WP0AF2A99KS165242', {
  headers: {
    Authorization: 'Bearer YOUR_API_KEY',
    'Content-Type': 'application/json',
  },
})

const buildData = await response.json()
console.log(buildData.build)
```

```python tab="Python"
import requests

headers = {
    'Authorization': 'Bearer YOUR_API_KEY',
    'Content-Type': 'application/json'
}

response = requests.get(
    'https://api.auto.dev/build/WP0AF2A99KS165242',
    headers=headers
)

build_data = response.json()
print(build_data['build'])
```

```php tab="PHP"
<?php
$curl = curl_init();

curl_setopt_array($curl, [
    CURLOPT_URL => 'https://api.auto.dev/build/WP0AF2A99KS165242',
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_HTTPHEADER => [
        'Authorization: Bearer YOUR_API_KEY',
        'Content-Type: application/json'
    ],
]);

$response = curl_exec($curl);
curl_close($curl);

$buildData = json_decode($response, true);
print_r($buildData['build']);
?>
```

## Response Structure

<Accordions type="multiple">
  <Accordion id="basic-vehicle-info" title="Basic Vehicle Information">
    <TypeTable
      type={{
  'build.vin': {
    description: 'Vehicle Identification Number',
    type: 'string',
  },
  'build.year': {
    description: 'Model year',
    type: 'number',
  },
  'build.make': {
    description: 'Vehicle manufacturer',
    type: 'string',
  },
  'build.model': {
    description: 'Vehicle model name',
    type: 'string',
  },
  'build.trim': {
    description: 'Complete trim designation',
    type: 'string',
  },
  'build.series': {
    description: 'Vehicle series or sub-model',
    type: 'string',
  },
  'build.style': {
    description: 'Body style designation (e.g., "4D Crossover")',
    type: 'string',
  },
  'build.drivetrain': {
    description: 'Drivetrain configuration (e.g., "RWD", "AWD")',
    type: 'string',
  },
}}
    />
  </Accordion>

  <Accordion id="mechanical-specs" title="Mechanical Specifications">
    <TypeTable
      type={{
  'build.engine': {
    description: 'Complete engine specification with displacement, configuration, and horsepower',
    type: 'string',
  },
  'build.transmission': {
    description: 'Transmission type and configuration',
    type: 'string',
  },
  'build.confidence': {
    description: 'Data accuracy confidence score (0-1)',
    type: 'number',
  },
}}
    />
  </Accordion>

  <Accordion id="color-info" title="Color Information">
    <TypeTable
      type={{
  'build.interiorColor': {
    description: 'Interior color name and hex code mapping',
    type: 'object',
  },
  'build.exteriorColor': {
    description: 'Exterior color name and hex code mapping',
    type: 'object',
  },
}}
    />
  </Accordion>

  <Accordion id="options-pricing" title="Factory Options & Pricing">
    <TypeTable
      type={{
  'build.options': {
    description: 'Factory option codes mapped to descriptions',
    type: 'object',
  },
  'build.optionsMsrp': {
    description: 'Total MSRP value of factory options in USD',
    type: 'number',
  },
}}
    />
  </Accordion>
</Accordions>

## Example Response

```json
{
  "build": {
    "vin": "WP0AF2A99KS165242",
    "year": 2019,
    "make": "Porsche",
    "model": "911",
    "trim": "GT3 RS Coupe",
    "series": "GT3 RS",
    "style": "2D Coupe",
    "drivetrain": "RWD",
    "engine": "4L H-6 gasoline direct injection, DOHC, VarioCam Plus variable valve control, premium unleaded, engine with 520HP",
    "transmission": "PDK 7-speed auto-shift manual",
    "confidence": 0.995,
    "interiorColor": {
      "Black": "#000000"
    },
    "exteriorColor": {
      "GT Silver Metallic": "#A2A2A2"
    },
    "options": {
      "474": "Front Axle Lift System",
      "QR5": "Chrono Package with Preparation For Lap Trigger",
      "U2": "GT Silver Metallic",
      "XDH": "Wheels Painted in Satin Platinum"
    },
    "optionsMsrp": 8950
  }
}
```

## Use Cases

* **Appraisal Services**: Factor in factory options and original colors for accurate vehicle valuations
* **Insurance Underwriting**: Use confidence scores and build specifications for risk assessment
* **Parts & Service**: Match exact factory option codes for correct parts ordering

## Error Responses

### Invalid VIN

```json
{
  "status": 400,
  "error": "VIN must be exactly 17 characters containing only letters and numbers (excluding I, O, Q)",
  "code": "INVALID_VIN_FORMAT",
  "path": "/build/123Invalid",
  "requestId": "a1b2c3d4e5f6g7h8"
}
```

### VIN Not Found

```json
{
  "status": 404,
  "error": "No vehicle data found for the provided VIN",
  "code": "VIN_NOT_FOUND",
  "path": "/build/WP0AF2A99KS165242",
  "requestId": "b2c3d4e5f6g7h8i9"
}
```

### VIN Decode Failed

```json
{
  "status": 400,
  "error": "Unable to decode vehicle information from VIN",
  "code": "VIN_DECODE_FAILED",
  "path": "/build/1FMDE0AP0SLA20048",
  "requestId": "976d19586b52612e"
}
```

## Interactive API Reference

Ready to test this endpoint? Use our interactive API playground to make live requests and see real responses.

<Card title="Try OEM Build Data API" href="/v2/reference/getOemBuildData" description="Test this endpoint with your API key and explore live responses" />

## Plan Availability

* **Starter**: ❌ Not available
* **Growth**: ✅ Available
* **Scale**: ✅ Available

See [pricing](https://auto.dev/pricing) for plan details and signup.
