# Open Recalls API

URL: /v2/products/open-recalls

Access only active, unresolved vehicle recalls requiring immediate attention or repair

***

title: Open Recalls API
description: Access only active, unresolved vehicle recalls requiring immediate attention or repair
---------------------------------------------------------------------------------------------------

import { ClickableCodeBlock } from '@/components/clickable-code-block'

Get currently active and unresolved vehicle recall information from the National Highway Traffic Safety Administration (NHTSA) database. This API filters out completed, closed, or resolved recalls to show only those requiring immediate attention or repair action.

## Endpoint

```
GET https://api.auto.dev/openrecalls/{vin}
```

## View in Browser

<ClickableCodeBlock code="https://api.auto.dev/openrecalls/1FMUK7DHXSGA27345" href="https://api.auto.dev/openrecalls/1FMUK7DHXSGA27345" lang="http" />

## Parameters

<TypeTable
  type={{
  vin: {
    description: '17-character Vehicle Identification Number to retrieve open recalls for',
    type: 'string',
    required: true,
  },
}}
/>

## Example Request

```bash tab="curl"
curl -X GET "https://api.auto.dev/openrecalls/1FMUK7DHXSGA27345" \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json"
```

```javascript tab="JavaScript"
const response = await fetch('https://api.auto.dev/openrecalls/1FMUK7DHXSGA27345', {
  headers: {
    Authorization: 'Bearer YOUR_API_KEY',
    'Content-Type': 'application/json',
  },
})

const openRecalls = await response.json()
console.log(`Found ${openRecalls.data.length} open recalls requiring attention`)
```

```python tab="Python"
import requests

headers = {
    'Authorization': 'Bearer YOUR_API_KEY',
    'Content-Type': 'application/json'
}

response = requests.get(
    'https://api.auto.dev/openrecalls/1FMUK7DHXSGA27345',
    headers=headers
)

open_recalls = response.json()
print(f"Found {len(open_recalls['data'])} open recalls requiring attention")
```

```php tab="PHP"
<?php
$curl = curl_init();

curl_setopt_array($curl, [
    CURLOPT_URL => 'https://api.auto.dev/openrecalls/1FMUK7DHXSGA27345',
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_HTTPHEADER => [
        'Authorization: Bearer YOUR_API_KEY',
        'Content-Type: application/json'
    ],
]);

$response = curl_exec($curl);
curl_close($curl);

$openRecalls = json_decode($response, true);
echo "Found " . count($openRecalls['data']) . " open recalls requiring attention\n";
?>
```

## Response Structure

### Main Response

<TypeTable
  type={{
  data: {
    description: 'Array of open recall records for the specified vehicle',
    type: 'array',
  },
}}
/>

### Open Recall Record Fields

<TypeTable
  type={{
  manufacturer: {
    description: 'Vehicle manufacturer who issued the recall',
    type: 'string',
  },
  nhtsaCampaignNumber: {
    description: 'Unique NHTSA recall campaign identifier',
    type: 'string',
  },
  parkIt: {
    description: 'Critical safety flag - vehicle should not be driven until repaired',
    type: 'boolean',
  },
  parkOutSide: {
    description: 'Critical safety flag - vehicle should be parked away from structures',
    type: 'boolean',
  },
  overTheAirUpdate: {
    description: 'Whether recall can be resolved via software update without dealer visit',
    type: 'boolean',
  },
  reportReceivedDate: {
    description: 'Date NHTSA received the recall report (DD/MM/YYYY format)',
    type: 'string',
  },
  component: {
    description: 'Vehicle component or system affected by the recall',
    type: 'string',
  },
  summary: {
    description: 'Detailed description of the recall issue and affected vehicles',
    type: 'string',
  },
  consequence: {
    description: 'Potential safety consequences if the recall is not addressed',
    type: 'string',
  },
  remedy: {
    description: 'Manufacturer instructions for resolving the recall issue',
    type: 'string',
  },
  notes: {
    description: 'Additional notes and contact information for vehicle owners',
    type: 'string',
  },
  recallStatus: {
    description: 'Current status of the recall (Open, In Progress, Remedy Available)',
    type: 'string',
  },
  expectedRemediationDate: {
    description: 'Expected date when remedy will be available (if applicable)',
    type: 'string',
  },
  modelYear: {
    description: 'Vehicle model year',
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

### Vehicle with Open Recalls

```json
{
  "data": [
    {
      "manufacturer": "Ford Motor Company",
      "nhtsaCampaignNumber": "25V239000",
      "parkIt": false,
      "parkOutSide": false,
      "overTheAirUpdate": false,
      "reportReceivedDate": "11/04/2025",
      "component": "POWER TRAIN:AUTOMATIC TRANSMISSION:CONTROL MODULE:SOFTWARE",
      "summary": "Ford Motor Company (Ford) is recalling certain 2025 Explorer vehicles.  The powertrain control module (PCM) may reset while driving, which can damage the park system or cause an engine stall.",
      "consequence": "A damaged park system can result in a vehicle rollaway when the vehicle is placed in park without the parking brake applied.  An engine stall while driving can result in a sudden loss of drive power.  Either of these scenarios can increase the risk of a crash.",
      "remedy": "Dealers will update the powertrain control module software, free of charge.  Owner notification letters were mailed June 6, 2025. Owners may contact Ford customer service at 1-866-436-7332.  Ford's number for this recall is 25S35.",
      "notes": "Owners may also contact the National Highway Traffic Safety Administration Vehicle Safety Hotline at 888-327-4236 (TTY 888-275-9171) or go to nhtsa.gov.",
      "modelYear": "2025",
      "make": "FORD",
      "model": "EXPLORER"
    }
  ]
}
```

### Vehicle with No Open Recalls

When a valid VIN has no open recalls, the API returns an empty array:

```json
{
  "data": []
}
```

**Note**: This means all recalls have been completed, resolved, or the vehicle has no recall history.

## Critical Safety Classifications

### Immediate Action Required

* **Park It** (`parkIt: true`) - **DO NOT DRIVE** - Vehicle poses immediate safety risk and should not be operated until repaired
* **Park Outside** (`parkOutSide: true`) - **FIRE/EXPLOSION RISK** - Vehicle should be parked away from structures, garages, and other vehicles

### Resolution Methods

* **Over-the-Air Update** (`overTheAirUpdate: true`) - Can be resolved via software update without dealership visit
* **Dealer Service Required** - Physical repair or part replacement needed at authorized service center

### Recall Status Types

* **Open** - Recall announced, remedy not yet available
* **Remedy Available** - Fix is available, customer action required
* **In Progress** - Customer has scheduled or begun remedy process

## Use Cases

* **Pre-Purchase Inspections**: Identify vehicles requiring immediate attention before sale
* **Safety Alert Systems**: Notify owners of critical recalls requiring immediate action
* **Fleet Management**: Prioritize vehicles needing urgent recall remediation
* **Insurance Risk Assessment**: Evaluate vehicles with unresolved safety issues

## Differences from Vehicle Recalls API

| Feature           | Vehicle Recalls API      | Open Recalls API                    |
| ----------------- | ------------------------ | ----------------------------------- |
| **Scope**         | All historical recalls   | Only active/unresolved recalls      |
| **Use Case**      | Complete recall history  | Immediate action items              |
| **Status Filter** | All statuses             | Open, In Progress, Remedy Available |
| **Response Size** | Larger (historical data) | Smaller (active only)               |

## Error Responses

### Invalid VIN

```json
{
  "status": 400,
  "error": "VIN must be exactly 17 characters containing only letters and numbers (excluding I, O, Q)",
  "code": "INVALID_VIN_FORMAT",
  "path": "/openrecalls/1GYKPD",
  "requestId": "a1b2c3d4e5f6g7h8"
}
```

### VIN Not Found

```json
{
  "status": 404,
  "error": "No vehicle data found for the provided VIN",
  "code": "VIN_NOT_FOUND",
  "path": "/openrecalls/WP0AF2A99KS165242",
  "requestId": "b2c3d4e5f6g7h8i9"
}
```

## Interactive API Reference

Ready to test this endpoint? Use our interactive API playground to make live requests and see real responses.

<Card title="Try Open Recalls API" href="/v2/reference/getOpenRecalls" description="Test this endpoint with your API key and explore live responses" />

## Plan Availability

* **Starter**: ❌ Not available
* **Growth**: ❌ Not available
* **Scale**: ✅ Available

See [pricing](https://auto.dev/pricing) for plan details and signup.
