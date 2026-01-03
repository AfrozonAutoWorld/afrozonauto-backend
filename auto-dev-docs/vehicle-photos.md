# Vehicle Photos API

URL: /v2/products/vehicle-photos

High-quality vehicle images and photo galleries for listings and inventory

***

title: Vehicle Photos API
description: High-quality vehicle images and photo galleries for listings and inventory
---------------------------------------------------------------------------------------

Retrieve a collection of high-quality retail images for a specific vehicle based on its VIN. Get comprehensive photo collections including exterior, interior, and detail shots from dealer listings and auction sources.

## Endpoint

```
GET https://api.auto.dev/photos/{vin}
```

## Parameters

<TypeTable
  type={{
  vin: {
    description: '17-character Vehicle Identification Number to retrieve photos for',
    type: 'string',
    required: true,
  },
}}
/>

## Example Request

```bash tab="curl"
curl -X GET "https://api.auto.dev/photos/1FTEW1C52PFA86825" \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json"
```

```javascript tab="JavaScript"
const response = await fetch('https://api.auto.dev/photos/1FTEW1C52PFA86825', {
  headers: {
    Authorization: 'Bearer YOUR_API_KEY',
    'Content-Type': 'application/json',
  },
})

const photos = await response.json()
console.log(`Found ${photos.data.retail.length} retail photos`)
```

```python tab="Python"
import requests

headers = {
    'Authorization': 'Bearer YOUR_API_KEY',
    'Content-Type': 'application/json'
}

response = requests.get(
    'https://api.auto.dev/photos/1FTEW1C52PFA86825',
    headers=headers
)

photos = response.json()
print(f"Retail photos: {len(photos['data']['retail'])}")
```

```php tab="PHP"
<?php
$curl = curl_init();

curl_setopt_array($curl, [
    CURLOPT_URL => 'https://api.auto.dev/photos/1FTEW1C52PFA86825',
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_HTTPHEADER => [
        'Authorization: Bearer YOUR_API_KEY',
        'Content-Type: application/json'
    ],
]);

$response = curl_exec($curl);
curl_close($curl);

$photos = json_decode($response, true);
echo "Retail photos: " . count($photos['data']['retail']) . "\n";
?>
```

## Response Structure

<TypeTable
  type={{
  'data.retail': {
    description: 'Array of retail photo URLs from dealer listings',
    type: 'string[]',
  },
}}
/>

## Example Response

### Vehicle with Photos

```json
{
  "data": {
    "retail": [
      "https://api.auto.dev/photos/retail/1FTEW1C52PFA86825-1.jpg",
      "https://api.auto.dev/photos/retail/1FTEW1C52PFA86825-2.jpg",
      "https://api.auto.dev/photos/retail/1FTEW1C52PFA86825-3.jpg",
      "https://api.auto.dev/photos/retail/1FTEW1C52PFA86825-4.jpg",
      "https://api.auto.dev/photos/retail/1FTEW1C52PFA86825-5.jpg",
      "https://api.auto.dev/photos/retail/1FTEW1C52PFA86825-6.jpg",
      "https://api.auto.dev/photos/retail/1FTEW1C52PFA86825-7.jpg",
      "https://api.auto.dev/photos/retail/1FTEW1C52PFA86825-8.jpg",
      "https://api.auto.dev/photos/retail/1FTEW1C52PFA86825-9.jpg",
      "https://api.auto.dev/photos/retail/1FTEW1C52PFA86825-10.jpg",
      "https://api.auto.dev/photos/retail/1FTEW1C52PFA86825-11.jpg",
      "https://api.auto.dev/photos/retail/1FTEW1C52PFA86825-12.jpg",
      "https://api.auto.dev/photos/retail/1FTEW1C52PFA86825-13.jpg",
      "https://api.auto.dev/photos/retail/1FTEW1C52PFA86825-14.jpg",
      "https://api.auto.dev/photos/retail/1FTEW1C52PFA86825-15.jpg",
      "https://api.auto.dev/photos/retail/1FTEW1C52PFA86825-16.jpg",
      "https://api.auto.dev/photos/retail/1FTEW1C52PFA86825-17.jpg",
      "https://api.auto.dev/photos/retail/1FTEW1C52PFA86825-18.jpg",
      "https://api.auto.dev/photos/retail/1FTEW1C52PFA86825-19.jpg",
      "https://api.auto.dev/photos/retail/1FTEW1C52PFA86825-20.jpg",
      "https://api.auto.dev/photos/retail/1FTEW1C52PFA86825-21.jpg"
    ]
  }
}
```

### Vehicle without Photos

When no photos are available for a VIN, the API returns empty arrays instead of an error:

```json
{
  "data": {
    "retail": []
  }
}
```

## Photo Collection Details

### Photo Sources

**Retail Photos**: Professional dealer listings and inventory photos

* **Format**: JPEG images hosted on Auto.dev CDN
* **URL Pattern**: `https://api.auto.dev/photos/{source}/{vin}-{number}.jpg`
* **Availability**: Retail photos are more common; wholesale may be empty

### Typical Photo Content

Collections include exterior shots, interior views, engine bay, detail shots, and any damage documentation. Photos are ordered by importance with primary exterior views first, followed by additional angles, interior, and detail shots.

## Image Specifications

<TypeTable
  type={{
  format: {
    description: 'Image file format',
    type: 'string',
    default: 'JPEG',
  },
  quality: {
    description: 'Image quality level',
    type: 'string',
    default: 'High-resolution retail/auction quality',
  },
  dimensions: {
    description: 'Typical image dimensions',
    type: 'string',
    default: 'Varies (typically 800x600 to 1200x800)',
  },
  cdn_hosting: {
    description: 'Content delivery network',
    type: 'string',
    default: 'api.auto.dev',
  },
  url_pattern: {
    description: 'Photo URL structure',
    type: 'string',
    default: 'https://api.auto.dev/photos/{source}/{vin}-{number}.jpg',
  },
}}
/>

## Error Responses

### Invalid VIN

```json
{
  "status": 404,
  "error": "This vehicle does not have any photos available. Please try a different VIN.",
  "code": "RESOURCE_NOT_FOUND",
  "path": "/photos/123Invalid",
  "requestId": "966d92f81daff05e"
}
```

## Interactive API Reference

Ready to test this endpoint? Use our interactive API playground to make live requests and see real responses.

<Card title="Try Vehicle Photos API" href="/v2/reference/getVehiclePhotos" description="Test this endpoint with your API key and explore live responses" />

## Plan Availability

* **Starter**: ✅ Available
* **Growth**: ✅ Available
* **Scale**: ✅ Available

See [pricing](https://auto.dev/pricing) for plan details and signup.
