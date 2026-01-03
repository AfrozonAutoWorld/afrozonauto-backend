# Specifications API

URL: /v2/products/specifications

Comprehensive vehicle specifications including engine details, features, measurements, and options by VIN

***

title: Specifications API
description: Comprehensive vehicle specifications including engine details, features, measurements, and options by VIN
----------------------------------------------------------------------------------------------------------------------

import { Accordion, Accordions } from 'fumadocs-ui/components/accordion'
import { ClickableCodeBlock } from '@/components/clickable-code-block'

Get detailed vehicle specifications including engine details, features, measurements, colors, options, and complete technical data for any vehicle by VIN. Access comprehensive spec data organized by category for easy integration.

## Endpoint

```
GET https://api.auto.dev/specs/{vin}
```

## View in Browser

<ClickableCodeBlock code="https://api.auto.dev/specs/WP0AF2A99KS165242" href="https://api.auto.dev/specs/WP0AF2A99KS165242" lang="http" />

## Parameters

<TypeTable
  type={{
  vin: {
    description: '17-character Vehicle Identification Number to retrieve specifications for',
    type: 'string',
    required: true,
  },
}}
/>

## Example Request

```bash tab="curl"
curl -X GET "https://api.auto.dev/specs/WP0AF2A99KS165242" \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json"
```

```javascript tab="JavaScript"
const response = await fetch('https://api.auto.dev/specs/WP0AF2A99KS165242', {
  headers: {
    Authorization: 'Bearer YOUR_API_KEY',
    'Content-Type': 'application/json',
  },
})

const specs = await response.json()
console.log(specs.specs)
```

```python tab="Python"
import requests

headers = {
    'Authorization': 'Bearer YOUR_API_KEY',
    'Content-Type': 'application/json'
}

response = requests.get(
    'https://api.auto.dev/specs/WP0AF2A99KS165242',
    headers=headers
)

specs = response.json()
print(specs['specs'])
```

```php tab="PHP"
<?php
$curl = curl_init();

curl_setopt_array($curl, [
    CURLOPT_URL => 'https://api.auto.dev/specs/WP0AF2A99KS165242',
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_HTTPHEADER => [
        'Authorization: Bearer YOUR_API_KEY',
        'Content-Type: application/json'
    ],
]);

$response = curl_exec($curl);
curl_close($curl);

$specs = json_decode($response, true);
print_r($specs['specs']);
?>
```

## Response Structure

<Accordions type="multiple">
  <Accordion title="Vehicle Information" id="vehicle-info">
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
}}
    />
  </Accordion>

  <Accordion title="Basic Specifications" id="basic-specs">
    <TypeTable
      type={{
  'specs.name': {
    description: 'Complete trim and specification name',
    type: 'string',
  },
  'specs.totalSeating': {
    description: 'Total seating capacity',
    type: 'number',
  },
  'specs.price.baseMsrp': {
    description: 'Manufacturer Suggested Retail Price',
    type: 'number',
  },
  'specs.price.baseInvoice': {
    description: 'Dealer invoice price',
    type: 'number',
  },
}}
    />
  </Accordion>

  <Accordion title="Engine Specifications" id="engine-specs">
    <TypeTable
      type={{
  'specs.features.engine.baseEngineSize': {
    description: 'Engine displacement (e.g., "4.0 L")',
    type: 'string',
  },
  'specs.features.engine.cylinders': {
    description: 'Engine configuration (e.g., "flat 6")',
    type: 'string',
  },
  'specs.features.engine.horsepower': {
    description: 'Engine horsepower rating with RPM',
    type: 'string',
  },
  'specs.features.engine.torque': {
    description: 'Engine torque rating with RPM',
    type: 'string',
  },
  'specs.features.engine.baseEngineType': {
    description: 'Fuel type (e.g., "gas")',
    type: 'string',
  },
  'specs.features.engine.valves': {
    description: 'Number of valves',
    type: 'string',
  },
  'specs.features.engine.camType': {
    description: 'Camshaft configuration',
    type: 'string',
  },
  'specs.features.engine.valveTiming': {
    description: 'Valve timing type',
    type: 'string',
  },
  'specs.features.engine.directInjection': {
    description: 'Direct injection availability',
    type: 'boolean',
  },
}}
    />
  </Accordion>

  <Accordion title="Measurements & Dimensions" id="measurements">
    <TypeTable
      type={{
  'specs.features.measurements.length': {
    description: 'Overall vehicle length',
    type: 'string',
  },
  'specs.features.measurements.height': {
    description: 'Overall vehicle height',
    type: 'string',
  },
  'specs.features.measurements.wheelbase': {
    description: 'Wheelbase measurement',
    type: 'string',
  },
  'specs.features.measurements.curbWeight': {
    description: 'Vehicle curb weight',
    type: 'string',
  },
  'specs.features.measurements.grossWeight': {
    description: 'Gross vehicle weight',
    type: 'string',
  },
  'specs.features.measurements.maximumPayload': {
    description: 'Maximum payload capacity',
    type: 'string',
  },
  'specs.features.measurements.overallWidthWithMirrors': {
    description: 'Total width including mirrors',
    type: 'string',
  },
  'specs.features.measurements.overallWidthWithoutMirrors': {
    description: 'Width excluding mirrors',
    type: 'string',
  },
  'specs.features.measurements.manufacturer060MphAccelerationTime': {
    description: 'Manufacturer-rated 0-60 mph acceleration time',
    type: 'string',
  },
  'specs.features.measurements.turningCircle': {
    description: 'Turning circle diameter',
    type: 'string',
  },
  'specs.features.measurements.maximumCargoCapacity': {
    description: 'Maximum cargo capacity',
    type: 'string',
  },
  'specs.features.measurements.countryOfFinalAssembly': {
    description: 'Country where vehicle was assembled',
    type: 'string',
  },
}}
    />
  </Accordion>

  <Accordion title="Fuel Economy" id="fuel-economy">
    <TypeTable
      type={{
  'specs.features.fuel.fuelType': {
    description: 'Required fuel type',
    type: 'string',
  },
  'specs.features.fuel.epaCombinedMpg': {
    description: 'EPA combined MPG rating',
    type: 'string',
  },
  'specs.features.fuel.epaCity/highwayMpg': {
    description: 'EPA city/highway MPG ratings',
    type: 'string',
  },
  'specs.features.fuel.fuelTankCapacity': {
    description: 'Fuel tank capacity',
    type: 'string',
  },
  'specs.features.fuel.rangeInMiles (city/hwy)': {
    description: 'Estimated driving range',
    type: 'string',
  },
}}
    />
  </Accordion>

  <Accordion title="Drive Train" id="drive-train">
    <TypeTable
      type={{
  'specs.features.driveTrain.driveType': {
    description: 'Drive wheel configuration (e.g., "rear wheel drive")',
    type: 'string',
  },
  'specs.features.driveTrain.transmission': {
    description: 'Transmission type and configuration',
    type: 'string',
  },
  'specs.features.driveTrain.rearLimitedSlipDifferential': {
    description: 'Rear limited slip differential availability',
    type: 'boolean',
  },
  'specs.features.driveTrain.rearLockingDifferential': {
    description: 'Rear locking differential availability',
    type: 'boolean',
  },
}}
    />
  </Accordion>

  <Accordion title="Color Options" id="color-options">
    <TypeTable
      type={{
  'specs.color.exterior': {
    description: 'Array of available exterior colors',
    type: 'array',
  },
  'specs.color.exterior[].name': {
    description: 'Color name',
    type: 'string',
  },
  'specs.color.exterior[].rgb': {
    description: 'RGB color values',
    type: 'string',
  },
  'specs.color.interior': {
    description: 'Array of available interior colors',
    type: 'array',
  },
  'specs.color.interior[].name': {
    description: 'Interior color/material name',
    type: 'string',
  },
  'specs.color.interior[].rgb': {
    description: 'RGB color values',
    type: 'string',
  },
}}
    />
  </Accordion>

  <Accordion title="Additional Response Fields" id="additional-fields">
    ### Warranty Information

    <TypeTable
      type={{
  'specs.features.warranty.basic': {
    description: 'Basic warranty coverage',
    type: 'string',
  },
  'specs.features.warranty.drivetrain': {
    description: 'Drivetrain warranty coverage',
    type: 'string',
  },
  'specs.features.warranty.rust': {
    description: 'Corrosion/rust warranty',
    type: 'string',
  },
  'specs.features.warranty.roadsideAssistance': {
    description: 'Roadside assistance coverage',
    type: 'string',
  },
  'specs.features.warranty.freeMaintenance': {
    description: 'Free maintenance period',
    type: 'string',
  },
}}
    />

    ### Ordered Features

    <TypeTable
      type={{
  'specs.orderedFeatures': {
    description: 'Array of feature categories with organized data',
    type: 'array',
  },
  'specs.orderedFeatures[].category': {
    description: 'Feature category name (e.g., "Engine", "Safety")',
    type: 'string',
  },
  'specs.orderedFeatures[].categoryGroup': {
    description: 'High-level grouping (e.g., "Mechanical", "Interior")',
    type: 'string',
  },
  'specs.orderedFeatures[].features': {
    description: 'Object containing category-specific features',
    type: 'object',
  },
}}
    />

    ### Style Attributes

    <TypeTable
      type={{
  'specs.styleAttributes.electric': {
    description: 'Whether vehicle is electric',
    type: 'boolean',
  },
  'specs.styleAttributes.pluginElectric': {
    description: 'Whether vehicle is plug-in electric',
    type: 'boolean',
  },
  'specs.styleAttributes.truck': {
    description: 'Whether vehicle is classified as a truck',
    type: 'boolean',
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
  "specs": {
    "name": "GT3 RS 2dr Coupe (4.0L 6cyl 7AM)",
    "price": {
      "baseMsrp": 187500,
      "baseInvoice": 168750
    },
    "totalSeating": 2,
    "color": {
      "exterior": [
        {
          "name": "Lizard Green",
          "rgb": "87,178,44"
        },
        {
          "name": "Miami Blue",
          "rgb": "3,161,192"
        },
        {
          "name": "Racing Yellow",
          "rgb": "229,200,38"
        },
        {
          "name": "Guards Red",
          "rgb": "175,26,28"
        }
      ],
      "interior": [
        {
          "name": "Black, leather/sueded microfiber",
          "rgb": "0,0,0"
        },
        {
          "name": "Black/Lizard Green, leather/sueded microfiber",
          "rgb": "0,0,0"
        }
      ]
    },
    "features": {
      "engine": {
        "torque": "346 lb-ft @ 6000 rpm",
        "baseEngineSize": "4.0 L",
        "horsepower": "520 hp @ 8250 rpm",
        "valves": "24",
        "baseEngineType": "gas",
        "directInjection": true,
        "valveTiming": "Variable",
        "cylinders": "flat 6",
        "camType": "Double overhead cam (DOHC)"
      },
      "fuel": {
        "epaCombinedMpg": "16 MPG",
        "epaCity/highwayMpg": "15/19 MPG",
        "rangeInMiles (city/hwy)": "253.5/321.1 mi.",
        "fuelTankCapacity": "16.9 gal.",
        "fuelType": "premium unleaded (required)"
      },
      "measurements": {
        "maximumCargoCapacity": "4.4 cu.ft.",
        "countryOfFinalAssembly": "Germany",
        "wheelbase": "96.6 in.",
        "curbWeight": "3153 lbs.",
        "grossWeight": "3953 lbs.",
        "cargoCapacity,AllSeatsInPlace": "4.4 cu.ft.",
        "maximumPayload": "800 lbs.",
        "overallWidthWithMirrors": "77.9 in.",
        "length": "179.4 in.",
        "manufacturer060MphAccelerationTime": "3.0 seconds",
        "turningCircle": "36.4 ft.",
        "height": "51.1 in.",
        "overallWidthWithoutMirrors": "74.0 in."
      },
      "driveTrain": {
        "driveType": "rear wheel drive",
        "rearLockingDifferential": true,
        "rearLimitedSlipDifferential": true,
        "transmission": "7-speed automated manual"
      },
      "warranty": {
        "basic": "4 yr./ 50000 mi.",
        "drivetrain": "4 yr./ 50000 mi.",
        "freeMaintenance": "1 yr./ 10000 mi.",
        "rust": "12 yr./ unlimited mi.",
        "roadsideAssistance": "4 yr./ 50000 mi."
      },
      "safety": {
        "4WheelAbs": true,
        "daytimeRunningLights": true,
        "engineImmobilizer": true,
        "postCollisionSafetySystem": true,
        "frontHeadAirbags": true,
        "dualFrontSideMountedAirbags": true,
        "passengerAirbagOccupantSensingDeactivation": true,
        "stabilityControl": true,
        "tirePressureMonitoring": true,
        "tractionControl": true
      },
      "frontseats": {
        "heightAdjustablePassengerSeat": true,
        "heightAdjustableDriverSeat": true,
        "sportFrontSeats": true,
        "2WayPowerPassengerSeat": true,
        "leather/suededMicrofiber": true,
        "2WayPowerDriverSeat": true
      }
    },
    "orderedFeatures": [
      {
        "category": "Fuel",
        "categoryGroup": "Mechanical",
        "features": {
          "fuelType": "Premium unleaded (required)",
          "epaCity/highwayMpg": "15/19 MPG",
          "epaCombinedMpg": "16 MPG",
          "rangeInMiles (city/hwy)": "253.5/321.1 mi.",
          "fuelTankCapacity": "16.9 gal."
        }
      },
      {
        "category": "Engine",
        "categoryGroup": "Mechanical",
        "features": {
          "baseEngineSize": "4.0 L",
          "cylinders": "Flat 6",
          "baseEngineType": "Gas",
          "horsepower": "520 hp @ 8250 rpm",
          "torque": "346 lb-ft @ 6000 rpm",
          "valves": "24",
          "camType": "Double overhead cam (DOHC)",
          "valveTiming": "Variable",
          "directInjection": true
        }
      }
    ],
    "typeCategories": {
      "performancesports": {
        "id": 10,
        "name": "Performance/Sports"
      },
      "coupe": {
        "id": 2,
        "name": "Coupe"
      },
      "luxury": {
        "id": 8,
        "name": "Luxury"
      }
    },
    "styleAttributes": {
      "electric": false,
      "pluginElectric": false,
      "truck": false
    }
  }
}
```

## Feature Categories

The API returns comprehensive feature data organized into the following categories through the `orderedFeatures` array:

<Accordions type="multiple">
  <Accordion title="Mechanical Systems" id="mechanical-systems">
    **Engine**:

    * Engine displacement, configuration, and type
    * Horsepower and torque ratings with RPM
    * Valve configuration and timing systems
    * Direct injection and fuel delivery

    **Drive Train**:

    * Transmission type and gear count
    * Drive wheel configuration (FWD, RWD, AWD, 4WD)
    * Differential options (limited slip, locking)
    * Transfer case specifications

    **Fuel**:

    * Fuel type requirements (regular, premium, etc.)
    * EPA city, highway, and combined MPG ratings
    * Fuel tank capacity and estimated range
    * Fuel system specifications

    **Suspension**:

    * Front and rear suspension types
    * Stabilizer bar configurations
    * Performance suspension options
  </Accordion>

  <Accordion title="Exterior Features" id="exterior-features">
    **Measurements**:

    * Overall dimensions (length, width, height)
    * Wheelbase and track measurements
    * Weight specifications (curb, gross, payload)
    * Performance metrics (0-60 acceleration)
    * Cargo and storage capacities

    **Tires and Wheels**:

    * Wheel sizes and materials
    * Tire specifications and performance ratings
    * Available wheel finishes and options

    **Exterior Options**:

    * Lighting packages and LED systems
    * Body kit and aerodynamic elements
    * Mirror and trim options
    * Paint and finish selections
  </Accordion>

  <Accordion title="Interior Features" id="interior-features">
    **Seating**:

    * Seating capacity and configurations
    * Seat materials and adjustability options
    * Heating, cooling, and massage features
    * Memory and power adjustments

    **Comfort & Convenience**:

    * Climate control systems (single/dual zone)
    * Infotainment and connectivity features
    * Storage compartments and cup holders
    * Power accessories and convenience features

    **Interior Options**:

    * Premium material selections
    * Color and trim combinations
    * Ambient lighting packages
    * Technology and luxury upgrades
  </Accordion>

  <Accordion title="Safety & Security" id="safety-security">
    **Active Safety**:

    * Collision avoidance and mitigation systems
    * Driver assistance technologies
    * Stability and traction control systems
    * Emergency braking and steering assist

    **Passive Safety**:

    * Airbag systems and configurations
    * Structural safety reinforcements
    * Child safety systems and LATCH
    * Security and anti-theft systems

    **Safety & Security Options**:

    * Advanced driver assistance packages
    * Security system upgrades
    * Emergency response features
  </Accordion>

  <Accordion title="Technology & Entertainment" id="technology-entertainment">
    **In Car Entertainment**:

    * Audio system specifications and speakers
    * Infotainment display and interface
    * Smartphone integration (Apple CarPlay, Android Auto)
    * Navigation and mapping systems
    * Satellite radio and streaming services

    **Telematics**:

    * Connected services and remote access
    * Vehicle tracking and stolen vehicle assistance
    * Over-the-air update capabilities
    * Emergency and concierge services
  </Accordion>

  <Accordion title="Packages & Options" id="packages-options">
    **Packages**:

    * Manufacturer option packages
    * Performance and appearance packages
    * Luxury and convenience bundles
    * Special edition and delivery options

    **Mechanical Options**:

    * Performance upgrades and modifications
    * Suspension and handling packages
    * Brake system upgrades
    * Powertrain enhancements
  </Accordion>
</Accordions>

## Use Cases

* **Vehicle Comparison Tools**: Compare detailed specifications across multiple vehicles for purchase decisions with organized feature categories
* **Automotive Marketplaces**: Display comprehensive vehicle features and specifications in listings with proper categorization
* **Configuration Builders**: Help customers select vehicle options and packages based on available features and categories

## Error Responses

### Invalid VIN

```json
{
  "status": 400,
  "error": "VIN must be 17 characters long",
  "code": "INVALID_VIN_FORMAT",
  "path": "/specs/123Invalid",
  "requestId": "966d9900bef4356c-IAD"
}
```

### VIN Not Found

```json
{
  "status": 404,
  "error": "No vehicle data found for the provided VIN",
  "code": "VIN_NOT_FOUND",
  "path": "/specs/WP0AF2A99KS165242",
  "requestId": "f8g7h6i5j4k3l2m1"
}
```

## Interactive API Reference

Ready to test this endpoint? Use our interactive API playground to make live requests and see real responses.

<Card title="Try Vehicle Specifications API" href="/v2/reference/getVehicleSpecifications" description="Test this endpoint with your API key and explore live responses" />

## Plan Availability

* **Starter**: ❌ Not available
* **Growth**: ✅ Available
* **Scale**: ✅ Available

See [pricing](https://auto.dev/pricing) for plan details and signup.
