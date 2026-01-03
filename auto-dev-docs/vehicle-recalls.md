# Vehicle Recalls API

URL: /v2/products/vehicle-recalls

Access NHTSA vehicle recall data including safety notices, remediation steps, and compliance information

***

title: Vehicle Recalls API
description: Access NHTSA vehicle recall data including safety notices, remediation steps, and compliance information
---------------------------------------------------------------------------------------------------------------------

import { ClickableCodeBlock } from '@/components/clickable-code-block'

Get comprehensive vehicle recall information from the National Highway Traffic Safety Administration (NHTSA) database. Access detailed recall notices, safety information, remediation steps, and compliance data for any vehicle to ensure driver and passenger safety.

## Endpoint

```
GET https://api.auto.dev/recalls/{vin}
```

## View in Browser

<ClickableCodeBlock code="https://api.auto.dev/recalls/WP0AF2A99KS165242" href="https://api.auto.dev/recalls/WP0AF2A99KS165242" lang="http" />

## Parameters

<TypeTable
  type={{
  vin: {
    description: '17-character Vehicle Identification Number to retrieve recalls for',
    type: 'string',
    required: true,
  },
}}
/>

## Example Request

```bash tab="curl"
curl -X GET "https://api.auto.dev/recalls/WP0AF2A99KS165242" \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json"
```

```javascript tab="JavaScript"
const response = await fetch('https://api.auto.dev/recalls/WP0AF2A99KS165242', {
  headers: {
    Authorization: 'Bearer YOUR_API_KEY',
    'Content-Type': 'application/json',
  },
})

const recalls = await response.json()
console.log(`Found ${recalls.data.length} recalls`)
```

```python tab="Python"
import requests

headers = {
    'Authorization': 'Bearer YOUR_API_KEY',
    'Content-Type': 'application/json'
}

response = requests.get(
    'https://api.auto.dev/recalls/WP0AF2A99KS165242',
    headers=headers
)

recalls = response.json()
print(f"Found {len(recalls['data'])} recalls")
```

```php tab="PHP"
<?php
$curl = curl_init();

curl_setopt_array($curl, [
    CURLOPT_URL => 'https://api.auto.dev/recalls/WP0AF2A99KS165242',
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_HTTPHEADER => [
        'Authorization: Bearer YOUR_API_KEY',
        'Content-Type: application/json'
    ],
]);

$response = curl_exec($curl);
curl_close($curl);

$recalls = json_decode($response, true);
echo "Found " . count($recalls['data']) . " recalls\n";
?>
```

## Response Structure

### Main Response

<TypeTable
  type={{
  data: {
    description: 'Array of recall records for the specified vehicle',
    type: 'array',
  },
}}
/>

### Recall Record Fields

<TypeTable
  type={{
  manufacturer: {
    description: 'Vehicle manufacturer name (e.g., "Porsche Cars North America, Inc.")',
    type: 'string',
  },
  nhtsaCampaignNumber: {
    description: 'Official NHTSA recall campaign number',
    type: 'string',
  },
  parkIt: {
    description: 'Whether vehicle should not be driven until repaired',
    type: 'boolean',
  },
  parkOutSide: {
    description: 'Whether vehicle should be parked outside due to fire risk',
    type: 'boolean',
  },
  overTheAirUpdate: {
    description: 'Whether recall can be resolved via software update',
    type: 'boolean',
  },
  reportReceivedDate: {
    description: 'Date NHTSA received the recall report (DD/MM/YYYY format)',
    type: 'string',
  },
  component: {
    description: 'Vehicle component affected by the recall',
    type: 'string',
  },
  summary: {
    description: 'Brief description of the recall issue',
    type: 'string',
  },
  consequence: {
    description: 'Potential consequences if issue is not addressed',
    type: 'string',
  },
  remedy: {
    description: 'Detailed remediation steps and dealer instructions',
    type: 'string',
  },
  notes: {
    description: 'Additional notes and contact information',
    type: 'string',
  },
  modelYear: {
    description: 'Model year of affected vehicle',
    type: 'string',
  },
  make: {
    description: 'Vehicle make (manufacturer)',
    type: 'string',
  },
  model: {
    description: 'Vehicle model name',
    type: 'string',
  },
}}
/>

## Example Response

### Vehicle with Recalls

```json
{
  "data": [
    {
      "manufacturer": "Porsche Cars North America, Inc.",
      "nhtsaCampaignNumber": "21V201000",
      "parkIt": false,
      "parkOutSide": false,
      "overTheAirUpdate": false,
      "reportReceivedDate": "24/03/2021",
      "component": "SUSPENSION:REAR",
      "summary": "Porsche Cars North America, Inc. (Porsche) is recalling certain 2019 Porsche 911 Speedster, 2020 Porsche 911 Carrera S Coupe, Carrera 4S Coupe, and Carrera S Cabriolet vehicles.  The screw connection on the rear axle upper control arm may be loose.",
      "consequence": "A loose connection may fail, causing driving instability and increasing the risk of a crash.",
      "remedy": "Porsche will notify owners, and dealers will rework and tighten the screw connection on the rear axle upper control arm, free of charge.  Owner notification letters were mailed May 21, 2021.  Owners may contact Porsche customer service at 1-800-767-7243.  Porsche's number for this recall is AMA6.",
      "notes": "Owners may also contact the National Highway Traffic Safety Administration Vehicle Safety Hotline at 1-888-327-4236 (TTY 1-800-424-9153), or go to www.safercar.gov.",
      "modelYear": "2019",
      "make": "PORSCHE",
      "model": "911"
    }
  ]
}
```

### Vehicle with No Recalls

When a valid VIN has no recalls, the API returns an empty array:

```json
{
  "data": []
}
```

**Note**: Currently, invalid VINs also return empty arrays, but this should be changed to return proper HTTP error responses (see Error Responses section below).

## Safety Alert Classifications

### Critical Safety Flags

* **Park It** (`parkIt: true`) - Vehicle should not be driven until repaired due to immediate safety risk
* **Park Outside** (`parkOutSide: true`) - Vehicle should be parked away from structures due to fire/explosion risk
* **Over-the-Air Update** (`overTheAirUpdate: true`) - Recall can be resolved via software update without dealer visit

### Component Categories

Common recall components include:

* **Safety-Critical**: BRAKES, STEERING, AIRBAGS, FUEL SYSTEM, ELECTRICAL SYSTEM
* **Visibility**: EXTERIOR LIGHTING, VISIBILITY, INSTRUMENT PANEL
* **Structural**: SEATS, DOORS, BODY

## Use Cases

* **Vehicle Safety Apps**: Check for open recalls before purchase decisions and during ownership
* **Dealership Systems**: Alert customers about recall notifications and schedule service appointments
* **Fleet Management**: Monitor recall status across vehicle inventory and prioritize critical repairs

## Error Responses

### Invalid VIN

```json
{
  "status": 400,
  "error": "VIN must be exactly 17 characters containing only letters and numbers (excluding I, O, Q)",
  "code": "INVALID_VIN_FORMAT",
  "path": "/recalls/1GYKPD",
  "requestId": "a1b2c3d4e5f6g7h8"
}
```

## Interactive API Reference

Ready to test this endpoint? Use our interactive API playground to make live requests and see real responses.

<Card title="Try Vehicle Recalls API" href="/v2/reference/getVehicleRecalls" description="Test this endpoint with your API key and explore live responses" />

## Plan Availability

* **Starter**: ❌ Not available
* **Growth**: ✅ Available
* **Scale**: ✅ Available

See [pricing](https://auto.dev/pricing) for plan details and signup.
