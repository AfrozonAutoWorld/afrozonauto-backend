# Total Cost of Ownership API

URL: /v2/products/total-cost-ownership

Comprehensive 5-year vehicle ownership cost analysis including depreciation, fuel, and maintenance

***

title: Total Cost of Ownership API
description: Comprehensive 5-year vehicle ownership cost analysis including depreciation, fuel, and maintenance
---------------------------------------------------------------------------------------------------------------

import { Accordion, Accordions } from 'fumadocs-ui/components/accordion'
import { ClickableCodeBlock } from '@/components/clickable-code-block'

Calculate comprehensive Total Cost of Ownership (TCO) for any vehicle over a 5-year period. Get detailed breakdowns of all ownership costs including depreciation, fuel, maintenance, repairs, insurance, taxes, and financing.

## Endpoint

```
GET https://api.auto.dev/tco/{vin}
```

## View in Browser

<ClickableCodeBlock code="https://api.auto.dev/tco/WP0AF2A99KS165242?zip=90210&milesPerYear=12000" href="https://api.auto.dev/tco/WP0AF2A99KS165242?zip=90210&milesPerYear=12000" lang="http" />

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
  zip: {
    description: '5-digit ZIP code for location-based calculations (insurance, taxes, fees)',
    type: 'string',
    required: false,
    default: 'Auto-detected based on user location',
  },
  fromZip: {
    description: '5-digit ZIP code for delivery/transport calculations',
    type: 'string',
    required: false,
  },
}}
/>

## Example Request

```bash tab="curl"
curl -X GET "https://api.auto.dev/tco/WP0AF2A99KS165242?zip=76548&fromZip=60695" \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json"
```

```javascript tab="JavaScript"
const vin = 'WP0AF2A99KS165242'
const params = new URLSearchParams({
  zip: '76548',
  fromZip: '60695',
})

const response = await fetch(`https://api.auto.dev/tco/${vin}?${params}`, {
  headers: {
    Authorization: 'Bearer YOUR_API_KEY',
    'Content-Type': 'application/json',
  },
})

const tco = await response.json()
console.log(`Total 5-year cost: $${tco.tco.total.tcoPrice}`)
console.log(`Average cost per mile: $${tco.tco.total.averageCostPerMile}`)
```

```python tab="Python"
import requests

vin = 'WP0AF2A99KS165242'
params = {
    'zip': '76548',
    'fromZip': '60695'
}

headers = {
    'Authorization': 'Bearer YOUR_API_KEY',
    'Content-Type': 'application/json'
}

response = requests.get(f'https://api.auto.dev/tco/{vin}', params=params, headers=headers)
tco = response.json()
print(f"Total 5-year cost: ${tco['tco']['total']['tcoPrice']}")
```

```php tab="PHP"
<?php
$vin = 'WP0AF2A99KS165242';
$query = http_build_query([
    'zip' => '76548',
    'fromZip' => '60695'
]);

$curl = curl_init();

curl_setopt_array($curl, [
    CURLOPT_URL => "https://api.auto.dev/tco/{$vin}?{$query}",
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_HTTPHEADER => [
        'Authorization: Bearer YOUR_API_KEY',
        'Content-Type: application/json'
    ],
]);

$response = curl_exec($curl);
curl_close($curl);

$tco = json_decode($response, true);
echo "Total 5-year cost: $" . $tco['tco']['total']['tcoPrice'] . "\n";
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
    type: 'number',
  },
  'vehicle.make': {
    description: 'Vehicle manufacturer',
    type: 'string',
  },
  'vehicle.model': {
    description: 'Vehicle model name',
    type: 'string',
  },
  'vehicle.manufacturer': {
    description: 'Full manufacturer name',
    type: 'string',
  },
  zip: {
    description: 'ZIP code used for location-based calculations',
    type: 'string',
  },
}}
    />
  </Accordion>

  <Accordion id="total-costs" title="Total 5-Year Costs">
    <TypeTable
      type={{
  'tco.total.federalTaxCredit': {
    description: 'Federal tax credits available (electric vehicles)',
    type: 'number',
  },
  'tco.total.insurance': {
    description: 'Total insurance costs over 5 years',
    type: 'number',
  },
  'tco.total.maintenance': {
    description: 'Total maintenance costs over 5 years',
    type: 'number',
  },
  'tco.total.repairs': {
    description: 'Total repair costs over 5 years',
    type: 'number',
  },
  'tco.total.taxesAndFees': {
    description: 'Total taxes and fees over 5 years',
    type: 'number',
  },
  'tco.total.financeInterest': {
    description: 'Total financing interest over 5 years',
    type: 'number',
  },
  'tco.total.depreciation': {
    description: 'Total depreciation over 5 years',
    type: 'number',
  },
  'tco.total.fuel': {
    description: 'Total fuel costs over 5 years',
    type: 'number',
  },
  'tco.total.tcoPrice': {
    description: 'Total cost of ownership over 5 years',
    type: 'number',
  },
  'tco.total.averageCostPerMile': {
    description: 'Average cost per mile over 5 years',
    type: 'number',
  },
}}
    />
  </Accordion>

  <Accordion id="yearly-breakdown" title="Year-by-Year Breakdown">
    <TypeTable
      type={{
  'tco.years.{1-5}': {
    description: 'Cost breakdown for each year of ownership',
    type: 'object',
  },
  'tco.years.{1-5}.insurance': {
    description: 'Insurance costs for the year',
    type: 'number',
  },
  'tco.years.{1-5}.maintenance': {
    description: 'Maintenance costs for the year',
    type: 'number',
  },
  'tco.years.{1-5}.repairs': {
    description: 'Repair costs for the year',
    type: 'number',
  },
  'tco.years.{1-5}.taxesAndFees': {
    description: 'Taxes and fees for the year',
    type: 'number',
  },
  'tco.years.{1-5}.financeInterest': {
    description: 'Financing interest for the year',
    type: 'number',
  },
  'tco.years.{1-5}.depreciation': {
    description: 'Depreciation for the year',
    type: 'number',
  },
  'tco.years.{1-5}.fuel': {
    description: 'Fuel costs for the year',
    type: 'number',
  },
  'tco.years.{1-5}.tcoPrice': {
    description: 'Total cost for the year',
    type: 'number',
  },
  'tco.years.{1-5}.averageCostPerMile': {
    description: 'Average cost per mile for the year',
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
    "vin": "WP0AF2A99KS165242",
    "year": 2019,
    "make": "Porsche",
    "model": "911",
    "manufacturer": "Dr Ing HCF Porsch Ag"
  },
  "zip": "90210",
  "tco": {
    "total": {
      "federalTaxCredit": 0,
      "insurance": 12110,
      "maintenance": 13788,
      "repairs": 11874,
      "taxesAndFees": 12164,
      "financeInterest": 20657,
      "depreciation": 44236,
      "fuel": 25000,
      "tcoPrice": 139829,
      "averageCostPerMile": 1.86
    },
    "years": {
      "1": {
        "insurance": 2281,
        "maintenance": 2006,
        "repairs": 2038,
        "taxesAndFees": 9728,
        "financeInterest": 7077,
        "depreciation": 13474,
        "fuel": 4709,
        "tcoPrice": 41313,
        "averageCostPerMile": 1.86
      },
      "2": {
        "insurance": 2349,
        "maintenance": 147,
        "repairs": 2195,
        "taxesAndFees": 684,
        "financeInterest": 5710,
        "depreciation": 7566,
        "fuel": 4850,
        "tcoPrice": 23501,
        "averageCostPerMile": 1.86
      },
      "3": {
        "insurance": 2420,
        "maintenance": 6898,
        "repairs": 2364,
        "taxesAndFees": 635,
        "financeInterest": 4241,
        "depreciation": 8510,
        "fuel": 4996,
        "tcoPrice": 30064,
        "averageCostPerMile": 1.86
      },
      "4": {
        "insurance": 2493,
        "maintenance": 694,
        "repairs": 2543,
        "taxesAndFees": 579,
        "financeInterest": 2663,
        "depreciation": 6296,
        "fuel": 5145,
        "tcoPrice": 20413,
        "averageCostPerMile": 1.86
      },
      "5": {
        "insurance": 2567,
        "maintenance": 4043,
        "repairs": 2734,
        "taxesAndFees": 538,
        "financeInterest": 966,
        "depreciation": 8390,
        "fuel": 5300,
        "tcoPrice": 24538,
        "averageCostPerMile": 1.86
      }
    }
  }
}
```

## Cost Component Analysis

The TCO calculation includes five main cost components:

* **Depreciation** - Vehicle value loss over time (largest cost factor)
* **Fuel Costs** - Based on EPA ratings and local fuel prices
* **Financing Interest** - Loan interest payments over ownership period
* **Insurance** - Annual insurance premiums based on vehicle and location
* **Maintenance & Repairs** - Scheduled maintenance and expected repairs

## Use Cases

* **Vehicle Purchase Decisions**: Compare total ownership costs between different vehicles before buying
* **Fleet Management**: Evaluate long-term costs for fleet vehicle selection and budget planning
* **Lease vs Buy Analysis**: Calculate comprehensive costs to determine optimal vehicle acquisition strategy

## Error Responses

### Invalid Location

```json
{
  "status": 400,
  "error": "Invalid ZIP code format. ZIP code must be 5 digits (e.g., 90210) or 5+4 format (e.g., 90210-1234)",
  "code": "INVALID_LOCATION",
  "path": "/tco/1GYKPDRSXSZ102995?zip=ABCDE",
  "requestId": "d4e5f6g7h8i9j0k1"
}
```

### Invalid VIN

```json
{
  "status": 400,
  "error": "VIN must be exactly 17 characters",
  "code": "INVALID_VIN_FORMAT",
  "path": "/tco/123Invalid",
  "requestId": "a1b2c3d4e5f6g7h8"
}
```

## Interactive API Reference

Ready to test this endpoint? Use our interactive API playground to make live requests and see real responses.

<Card title="Try Total Cost of Ownership API" href="/v2/reference/getTotalCostOfOwnership" description="Test this endpoint with your API key and explore live responses" />

## Plan Availability

* **Starter**: ❌ Not available
* **Growth**: ✅ Available
* **Scale**: ✅ Available

See [pricing](https://auto.dev/pricing) for plan details and signup.
