# Vehicle Listings API

URL: /v2/products/vehicle-listings

Access millions of active vehicle listings with real-time pricing and availability

***

title: Vehicle Listings API
description: Access millions of active vehicle listings with real-time pricing and availability
-----------------------------------------------------------------------------------------------

import { Accordion, Accordions } from 'fumadocs-ui/components/accordion'
import { ClickableCodeBlock } from '@/components/clickable-code-block'

Get comprehensive vehicle listings from U.S. physical & online dealers in seconds. Our Vehicle Listings API provides detailed vehicle information, dealership data, specifications, and market pricing.

## Endpoint

```
GET https://api.auto.dev/listings
GET https://api.auto.dev/listings/{vin}
```

Returns vehicle listings. Without a VIN, returns an array of listings (typically 100 per page). With a VIN, returns a single specific listing.

## View in Browser

<ClickableCodeBlock code="https://api.auto.dev/listings" href="https://api.auto.dev/listings" lang="http" />

## Parameters

<TypeTable
  type={{
  vin: {
    description:
      '17-character Vehicle Identification Number to find a specific listing for (optional path parameter)',
    type: 'string',
  },
}}
/>

## Pagination

Pagination is supported for large result sets.

Use the `page` parameter to navigate through the results. For example, `page=2` will return the second page of results.

Limit the number of results per page using the `limit` parameter. For example, `limit=10` will return 10 results per page.

<TypeTable
  type={{
  page: {
    description: 'Page number to retrieve (starting from 1)',
    type: 'number',
    default: '1',
  },
  limit: {
    description: 'Number of listings to return per page (1-100)',
    type: 'number',
    default: '100',
  },
}}
/>

<ClickableCodeBlock code="https://api.auto.dev/listings?page=2&limit=50" href="https://api.auto.dev/listings?page=2&limit=50" lang="http" />

## Location Filtering

Filter listings by geographic location using the `zip` and `distance` parameters.

<TypeTable
  type={{
  zip: {
    description: '5-digit ZIP code to center the search around',
    type: 'string',
  },
  distance: {
    description: 'Radius in miles from the ZIP code to include in results',
    type: 'number',
    default: '50',
  },
}}
/>

<ClickableCodeBlock code="https://api.auto.dev/listings?zip=33132&distance=50" href="https://api.auto.dev/listings?zip=33132&distance=50" lang="http" />

## Search Listings

Simply make a GET request to listings with your desired search parameters. You can filter by make, model, year, price, mileage, and more. Add `.not` to the end of the parameter name to exclude values. Use commas to specify multiple values.

<ClickableCodeBlock code="https://api.auto.dev/listings?vehicle.make=ford&vehicle.model=mustang" href="https://api.auto.dev/listings?vehicle.make=ford&vehicle.model=mustang" lang="http" />

<ClickableCodeBlock code="https://api.auto.dev/listings?vehicle.fuel.not=*gas*,diesel" href="https://api.auto.dev/listings?vehicle.fuel.not=*gas*,diesel" lang="http" />

<Accordions type="multiple">
  <Accordion title="Vehicle Filters" id="vehicle-filters">
    <TypeTable
      type={{
  'vehicle.squishVin': {
    description:
      'The WMI and vehicle descriptor section of the VIN (first 11 characters minus the check digit). Use comma for multiple: 1FA6P8AMF5,137FA5733E',
    type: 'string',
  },
  'vehicle.year': {
    description: 'The year of the vehicle. Use specific year (2018) or range (2018-2020)',
    type: 'number',
  },
  'vehicle.make': {
    description: 'Vehicle manufacturer. Use comma for multiple: Ford,Chevrolet',
    type: 'string',
  },
  'vehicle.model': {
    description: 'Vehicle model. Use comma for multiple: F-150,Silverado',
    type: 'string',
  },
  'vehicle.trim': {
    description: 'Trim level. Use comma for multiple: XLT,LT',
    type: 'string',
  },
  'vehicle.bodyStyle': {
    description: 'Body style. Use comma for multiple: sedan,coupe',
    type: 'string',
  },
  'vehicle.engine': {
    description: 'Engine size. Use comma for multiple: 2.0L,3.5L',
    type: 'string',
  },
  'vehicle.transmission': {
    description: 'Transmission type. Use comma for multiple: automatic,manual',
    type: 'string',
  },
  'vehicle.interiorColor': {
    description: 'Interior color. Use comma for multiple: black,gray',
    type: 'string',
  },
  'vehicle.exteriorColor': {
    description: 'Exterior color. Use comma for multiple: white,black',
    type: 'string',
  },
  'vehicle.doors': {
    description: 'Number of doors (2, 4, 5)',
    type: 'number',
  },
}}
    />
  </Accordion>

  <Accordion title="Retail Listing Filters" id="retail-filters">
    <TypeTable
      type={{
  'retailListing.price': {
    description: 'Vehicle price. Use range: 10000-20000',
    type: 'number',
  },
  'retailListing.state': {
    description: 'State where vehicle is located (e.g., CA)',
    type: 'string',
  },
  'retailListing.miles': {
    description: 'Vehicle mileage. Use range: 10000-20000',
    type: 'number',
  },
}}
    />
  </Accordion>

  <Accordion title="Wholesale Listing Filters" id="wholesale-filters">
    <TypeTable
      type={{
  'wholesaleListing.buyNowPrice': {
    description: 'Wholesale buy now price. Use range: 10000-20000',
    type: 'number',
  },
  'wholesaleListing.state': {
    description: 'State where vehicle is located (e.g., CA)',
    type: 'string',
  },
  'wholesaleListing.miles': {
    description: 'Vehicle mileage. Use range: 10000-20000',
    type: 'number',
  },
}}
    />
  </Accordion>
</Accordions>

For example, to find Toyota Camrys under $30k in California:

<ClickableCodeBlock code="https://api.auto.dev/listings?vehicle.make=Toyota&vehicle.model=Camry&retailListing.price=1-30000&retailListing.state=CA" href="https://api.auto.dev/listings?vehicle.make=Toyota&vehicle.model=Camry&retailListing.price=1-30000&retailListing.state=CA" lang="http" />

## Example Request

```bash tab="curl"
curl -X GET "https://api.auto.dev/listings/10ARJYBS7RC154562" \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json"
```

```javascript tab="JavaScript"
const response = await fetch('https://api.auto.dev/listings/10ARJYBS7RC154562', {
  headers: {
    Authorization: 'Bearer YOUR_API_KEY',
    'Content-Type': 'application/json',
  },
})

const result = await response.json()
const listings = result.data
console.log(`Found ${listings.length} listings`)
listings.forEach((listing) => {
  console.log(
    `${listing.vehicle.year} ${listing.vehicle.make} ${listing.vehicle.model} - $${listing.retailListing?.price || 0}`,
  )
})
```

```python tab="Python"
import requests

headers = {
    'Authorization': 'Bearer YOUR_API_KEY',
    'Content-Type': 'application/json'
}

response = requests.get(
    'https://api.auto.dev/listings/10ARJYBS7RC154562',
    headers=headers
)

result = response.json()
for listing in result['data']:
    vehicle = listing['vehicle']
    price = listing['retailListing']['price'] if listing['retailListing'] else 0
    print(f"{vehicle['year']} {vehicle['make']} {vehicle['model']} - ${price}")
```

```php tab="PHP"
<?php
$curl = curl_init();

curl_setopt_array($curl, [
    CURLOPT_URL => 'https://api.auto.dev/listings/10ARJYBS7RC154562',
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_HTTPHEADER => [
        'Authorization: Bearer YOUR_API_KEY',
        'Content-Type: application/json'
    ],
]);

$response = curl_exec($curl);
curl_close($curl);

$result = json_decode($response, true);
foreach ($result['data'] as $listing) {
    $vehicle = $listing['vehicle'];
    $price = $listing['retailListing']['price'] ?? 0;
    echo "{$vehicle['year']} {$vehicle['make']} {$vehicle['model']} - \${$price}\n";
}
?>
```

## Response Structure

### Single Listing Object Structure

Both endpoints return listing objects with the same structure, but wrapped differently:

* **`/listings`** wraps them in: `{data: [array of listing objects]}`
* **`/listings/{vin}`** wraps them in: `{data: {single listing object}}`

Each listing object contains:

<Accordions type="multiple">
  <Accordion title="Basic Listing Fields" id="basic-listing">
    <TypeTable
      type={{
  vin: {
    description: 'Vehicle Identification Number',
    type: 'string',
  },
  location: {
    description: 'Geographic coordinates [longitude, latitude]',
    type: 'number[]',
  },
  createdAt: {
    description: 'Timestamp when the listing was created (YYYY-MM-DD HH:MM:SS UTC)',
    type: 'string',
  },
  online: {
    description: 'Whether the listing is available online',
    type: 'boolean',
  },
}}
    />
  </Accordion>

  <Accordion title="Vehicle Information" id="vehicle-info">
    <TypeTable
      type={{
  'vehicle.vin': {
    description: 'Vehicle Identification Number',
    type: 'string',
  },
  'vehicle.squishVin': {
    description: 'VIN with model year and check digit removed',
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
  'vehicle.trim': {
    description: 'Trim level designation',
    type: 'string',
  },
  'vehicle.drivetrain': {
    description: 'Drivetrain configuration (4WD, AWD, FWD, RWD)',
    type: 'string',
  },
  'vehicle.engine': {
    description: 'Engine description and fuel type',
    type: 'string',
  },
  'vehicle.fuel': {
    description: 'Fuel type (Gasoline, Plug-In Hybrid, etc.)',
    type: 'string',
  },
  'vehicle.transmission': {
    description: 'Transmission type',
    type: 'string',
  },
  'vehicle.confidence': {
    description: 'Data accuracy confidence score (0.0 to 1.0)',
    type: 'number',
  },
  'vehicle.doors': {
    description: 'Number of doors',
    type: 'number',
  },
  'vehicle.seats': {
    description: 'Seating capacity',
    type: 'number',
  },
  'vehicle.exteriorColor': {
    description: 'Exterior color name',
    type: 'string',
  },
  'vehicle.interiorColor': {
    description: 'Interior color name',
    type: 'string',
  },
}}
    />
  </Accordion>

  <Accordion title="Retail Listing Details" id="retail-listing">
    <TypeTable
      type={{
  'retailListing.vdp': {
    description: 'Vehicle detail page URL',
    type: 'string',
  },
  'retailListing.price': {
    description: 'Current asking price in USD',
    type: 'number',
  },
  'retailListing.miles': {
    description: 'Vehicle mileage/odometer reading',
    type: 'number',
  },
  'retailListing.used': {
    description: 'Whether this is a used vehicle listing',
    type: 'boolean',
  },
  'retailListing.cpo': {
    description: 'Certified Pre-Owned status',
    type: 'boolean',
  },
  'retailListing.carfaxUrl': {
    description: 'Carfax vehicle history report URL',
    type: 'string',
  },
  'retailListing.dealer': {
    description: 'Dealership name',
    type: 'string',
  },
  'retailListing.city': {
    description: 'Dealership city',
    type: 'string',
  },
  'retailListing.state': {
    description: 'Dealership state abbreviation',
    type: 'string',
  },
  'retailListing.zip': {
    description: 'Dealership ZIP code',
    type: 'string',
  },
  'retailListing.primaryImage': {
    description: 'Primary vehicle photo URL',
    type: 'string',
  },
  'retailListing.photoCount': {
    description: 'Total number of photos available',
    type: 'number',
  },
}}
    />
  </Accordion>

  <Accordion title="Additional Data Fields" id="additional-data">
    <TypeTable
      type={{
  wholesaleListing: {
    description: 'Wholesale listing information (typically null)',
    type: 'object | null',
  },
  history: {
    description: 'Vehicle history information (typically null)',
    type: 'object | null',
  },
}}
    />
  </Accordion>
</Accordions>

## Example Responses

<Accordions type="single">
  <Accordion title="Single VIN Response (/listings/{vin})" id="single-vin-response">
    When querying a specific VIN, the API returns a single listing object wrapped in a `data` property:

    ```json
    {
      "data": {
        "@id": "https://api.auto.dev/listings/10ARJYBS7RC154562",
        "vin": "10ARJYBS7RC154562",
        "location": [-77.0334, 40.2476],
        "createdAt": "2025-09-14 14:04:06",
        "online": true,
        "vehicle": {
          "vin": "10ARJYBS7RC154562",
          "squishVin": "10ARJYBSRC",
          "year": 2024,
          "make": "Jeep",
          "model": "Grand Cherokee",
          "trim": "4xe",
          "drivetrain": "4WD",
          "engine": "Plug-In Hybrid",
          "fuel": "Plug-In Hybrid",
          "transmission": "Automatic",
          "confidence": 0.005,
          "doors": 4,
          "seats": 5
        },
        "wholesaleListing": null,
        "retailListing": {
          "vdp": "http://details.vast.com/details/cars/ob-48ae10cec45c5264c0c05239af7ac2c3eda678223f9171ac63be6a3107cd3db63b027b96ef83ac88fd6ccb42933d4f3c6bf26f82a637df6dbf6160746a741de2e12135dcbeff82654b855069fa243842784cfba33bf3b93b6d5a9156baa8b0f948d0b715b4936664c48f9fdb248501ca1a015077c28df814c6ae254e205e6b8afb7f16011f22412ebedeee38685f0721f74c31246e538ff42db94d2ceb09e6950fb15e40f90d9a2a0fa486f173a58cc4/?pl=19",
          "price": 0,
          "used": false,
          "cpo": false,
          "carfaxUrl": "https://www.carfax.com/VehicleHistory/p/Report.cfx?vin=10ARJYBS7RC154562&partner=FRD_2",
          "dealer": "Faulkner Dodge Ram Mechanicsburg New",
          "city": "Mechanicsburg",
          "state": "PA",
          "zip": "17050",
          "primaryImage": "https://retail.photos.vin/10ARJYBS7RC154562-1.jpg",
          "photoCount": 1
        },
        "history": null
      }
    }
    ```
  </Accordion>

  <Accordion title="All Listings Response (/listings)" id="all-listings-response">
    When querying all listings, the API returns an array of listing objects in the `data` property:

    ```json
    {
      "data": [
        {
          "@id": "https://api.auto.dev/listings/10ARJYBS7RC154562",
          "vin": "10ARJYBS7RC154562",
          "location": [-77.0334, 40.2476],
          "createdAt": "2025-09-14 14:04:06",
          "online": true,
          "vehicle": {
            "vin": "10ARJYBS7RC154562",
            "squishVin": "10ARJYBSRC",
            "year": 2024,
            "make": "Jeep",
            "model": "Grand Cherokee",
            "trim": "4xe",
            "drivetrain": "4WD",
            "engine": "Plug-In Hybrid",
            "fuel": "Plug-In Hybrid",
            "transmission": "Automatic",
            "confidence": 0.005,
            "doors": 4,
            "seats": 5
          },
          "wholesaleListing": null,
          "retailListing": {
            "vdp": "http://details.vast.com/details/cars/ob-48ae10cec45c5264c0c05239af7ac2c3eda678223f9171ac63be6a3107cd3db63b027b96ef83ac88fd6ccb42933d4f3c6bf26f82a637df6dbf6160746a741de2e12135dcbeff82654b855069fa243842784cfba33bf3b93b6d5a9156baa8b0f948d0b715b4936664c48f9fdb248501ca1a015077c28df814c6ae254e205e6b8afb7f16011f22412ebedeee38685f0721f74c31246e538ff42db94d2ceb09e6950fb15e40f90d9a2a0fa486f173a58cc4/?pl=19",
            "price": 0,
            "used": false,
            "cpo": false,
            "carfaxUrl": "https://www.carfax.com/VehicleHistory/p/Report.cfx?vin=10ARJYBS7RC154562&partner=FRD_2",
            "dealer": "Faulkner Dodge Ram Mechanicsburg New",
            "city": "Mechanicsburg",
            "state": "PA",
            "zip": "17050",
            "primaryImage": "https://retail.photos.vin/10ARJYBS7RC154562-1.jpg",
            "photoCount": 1
          },
          "history": null
        },
        {
          "@id": "https://api.auto.dev/listings/137ZA90311E190871",
          "vin": "137ZA90311E190871",
          "location": [-86.111777, 39.924385],
          "createdAt": "2025-02-27 01:56:02",
          "online": false,
          "vehicle": {
            "vin": "137ZA90311E190871",
            "squishVin": "137ZA9031E",
            "year": 2001,
            "make": "AM General",
            "model": "Hummer",
            "trim": "Open Top"
          },
          "wholesaleListing": {
            "auction": "OVE",
            "miles": 89868
          },
          "retailListing": {
            "price": 119000,
            "dealer": "Indy Cars & Trucks",
            "city": "Indianapolis",
            "state": "IN"
          },
          "history": {
            "accidents": false,
            "ownerCount": 7
          }
        }
      ]
    }
    ```
  </Accordion>
</Accordions>

## Error Responses

### Invalid Parameter

```json
{
  "status": 400,
  "error": "Invalid parameter provided: make. This parameter does not exist in this endpoint.",
  "code": "INVALID_PARAMETER",
  "path": "/listings",
  "requestId": "966e8386bb38f095"
}
```

### Invalid VIN

```json
{
  "status": 400,
  "error": "Invalid VIN format: \"123INVALID\" - VIN must be exactly 17 characters",
  "code": "INVALID_VIN_FORMAT",
  "path": "/listings/123INVALID",
  "requestId": "a1b2c3d4e5f6g7h8"
}
```

### VIN Not Found

```json
{
  "status": 404,
  "error": "Resource \"WP0AF2A99KS165242\" not found",
  "code": "RESOURCE_NOT_FOUND",
  "path": "/listings/WP0AF2A99KS165242",
  "requestId": "966716ac29ed8147"
}
```

## Interactive API Reference

Ready to test these endpoints? Use our interactive API playground to make live requests and see real responses.

<Cards>
  <Card title="Search Vehicle Listings" href="/v2/reference/searchVehicleListings" description="Search and filter through millions of vehicle listings with advanced criteria" />

  <Card title="Get Vehicle Listing by VIN" href="/v2/reference/getVehicleListingByVin" description="Retrieve detailed listing information for a specific vehicle by VIN" />
</Cards>

## Plan Availability

* **Starter**: ✅ Available
* **Growth**: ✅ Available
* **Scale**: ✅ Available

See [pricing](https://auto.dev/pricing) for plan details and signup.
