import 'dotenv/config';
import * as bcrypt from 'bcrypt';
import { PrismaClient } from '../src/generated/prisma/client';
import {
  UserRole,
  OrderStatus,
  ShippingMethod,
  PaymentType,
  PaymentStatus,
  EscrowStatus,
  ShipmentStatus,
  VehicleSource,
  VehicleType,
  VehicleStatus,
  NotificationType,
  InspectionCondition,
  SourcingRequestStatus,
} from '../src/generated/prisma/enums';

const prisma = new PrismaClient();

const defaultCategories = [
  { slug: 'electric', label: 'Electric', fuel: 'Electric', bodyStyle: null, sortOrder: 0 },
  { slug: 'suv', label: 'SUV', bodyStyle: 'suv', fuel: null, sortOrder: 1 },
  { slug: 'sedan', label: 'Sedan', bodyStyle: 'sedan', fuel: null, sortOrder: 2 },
  { slug: 'pickup-truck', label: 'Pickup Truck', bodyStyle: 'truck', fuel: null, sortOrder: 3 },
  { slug: 'luxury', label: 'Luxury', bodyStyle: null, fuel: null, luxuryMakes: ['Mercedes-Benz', 'BMW', 'Lexus', 'Audi', 'Porsche'], priceMin: 50000, sortOrder: 4 },
  { slug: 'crossover', label: 'Crossover', bodyStyle: 'crossover', fuel: null, sortOrder: 5 },
  { slug: 'hybrid', label: 'Hybrid', fuel: 'Hybrid', bodyStyle: null, sortOrder: 6 },
  { slug: 'diesel', label: 'Diesel', fuel: 'Diesel', bodyStyle: null, sortOrder: 7 },
  { slug: 'coupe', label: 'Coupe', bodyStyle: 'coupe', fuel: null, sortOrder: 8 },
  { slug: 'hatchback', label: 'Hatchback', bodyStyle: 'hatchback', fuel: null, sortOrder: 9 },
  { slug: 'wagon', label: 'Wagon', bodyStyle: 'wagon', fuel: null, sortOrder: 10 },
  { slug: 'convertible', label: 'Convertible', bodyStyle: 'convertible', fuel: null, sortOrder: 11 },
  { slug: 'minivan', label: 'Minivan', bodyStyle: 'minivan', fuel: null, sortOrder: 12 },
  { slug: 'plug-in-hybrid', label: 'Plug-in Hybrid', fuel: 'Plug-In Hybrid', bodyStyle: null, sortOrder: 13 },
  { slug: 'van', label: 'Van', bodyStyle: 'van', fuel: null, sortOrder: 14 },
];

const defaultTrending = [
  {
    make: 'Mercedes-Benz',
    model: null,
    yearStart: 2020,
    yearEnd: 2025,
    label: 'Popular Luxury',
    sortOrder: 0,
    maxFetchCount: 2,
  },
  {
    make: 'BMW',
    model: null,
    yearStart: 2020,
    yearEnd: 2025,
    label: 'Hot in Europe',
    sortOrder: 1,
    maxFetchCount: 2,
  },
  {
    make: 'Lexus',
    model: null,
    yearStart: 2019,
    yearEnd: 2025,
    label: 'Hot in Africa',
    sortOrder: 2,
    maxFetchCount: 2,
  },
  {
    make: 'Toyota',
    model: 'Camry',
    yearStart: 2020,
    yearEnd: 2024,
    label: 'Best Seller',
    sortOrder: 3,
    maxFetchCount: 2,
  },
  {
    make: 'Rolls-Royce',
    model: null,
    yearStart: 2018,
    yearEnd: 2025,
    label: 'Ultra Luxury',
    sortOrder: 4,
    maxFetchCount: 2,
  },
  {
    make: 'Lexus',
    model: 'LX 570',
    yearStart: 2018,
    yearEnd: 2024,
    label: 'Premium SUV',
    sortOrder: 5,
    maxFetchCount: 2,
  },
  {
    make: 'Lexus',
    model: 'RX 350',
    yearStart: 2019,
    yearEnd: 2025,
    label: 'Comfort SUV',
    sortOrder: 6,
    maxFetchCount: 2,
  },
];

// Recommended for you: fetch from Auto.dev per definition (like Trending), with a reason per row
const defaultRecommended = [
  {
    make: 'BMW',
    model: 'X5',
    yearStart: 2023,
    yearEnd: 2025,
    reason: 'Near-new, under 15k miles, exceptional condition at this price',
    sortOrder: 0,
    maxFetchCount: 3,
  },
  {
    make: 'Toyota',
    model: 'Highlander',
    yearStart: 2022,
    yearEnd: 2025,
    reason: 'Reliable family SUV, low mileage, great resale value',
    sortOrder: 1,
    maxFetchCount: 3,
  },
  {
    make: 'Lexus',
    model: 'RX 350',
    yearStart: 2022,
    yearEnd: 2025,
    reason: 'Luxury comfort and reliability, popular for Nigerian roads',
    sortOrder: 2,
    maxFetchCount: 3,
  },
  {
    make: 'Honda',
    model: 'CR-V',
    yearStart: 2022,
    yearEnd: 2025,
    reason: 'Top safety ratings, fuel-efficient, holds value',
    sortOrder: 3,
    maxFetchCount: 3,
  },
  {
    make: 'Mercedes-Benz',
    model: 'GLE',
    yearStart: 2022,
    yearEnd: 2025,
    reason: 'Premium SUV with strong demand in Africa',
    sortOrder: 4,
    maxFetchCount: 2,
  },
  {
    make: 'Toyota',
    model: 'Camry',
    yearStart: 2022,
    yearEnd: 2025,
    reason: 'Best-selling sedan, low cost of ownership',
    sortOrder: 5,
    maxFetchCount: 2,
  },
];

// Specialty vehicles: more \"special\" use cases – trucks, vans, and high-performance
const defaultSpecialty = [
  {
    make: 'Ford',
    model: 'F-150',
    yearStart: 2021,
    yearEnd: 2025,
    reason: 'America’s best-selling pickup, ideal for work and utility use',
    sortOrder: 0,
    maxFetchCount: 3,
  },
  {
    make: 'RAM',
    model: '1500',
    yearStart: 2021,
    yearEnd: 2025,
    reason: 'Full-size truck with premium interior and towing capability',
    sortOrder: 1,
    maxFetchCount: 3,
  },
  {
    make: 'Mercedes-Benz',
    model: 'Sprinter',
    yearStart: 2019,
    yearEnd: 2025,
    reason: 'High-roof cargo and passenger vans perfect for business fleets',
    sortOrder: 2,
    maxFetchCount: 3,
  },
  {
    make: 'Ford',
    model: 'Transit',
    yearStart: 2019,
    yearEnd: 2025,
    reason: 'Versatile commercial van platform for logistics and conversions',
    sortOrder: 3,
    maxFetchCount: 3,
  },
  {
    make: 'Jeep',
    model: 'Wrangler',
    yearStart: 2020,
    yearEnd: 2025,
    reason: 'Off-road focused 4x4, ideal for adventure and rugged terrain',
    sortOrder: 4,
    maxFetchCount: 2,
  },
  {
    make: 'Porsche',
    model: '911',
    yearStart: 2019,
    yearEnd: 2025,
    reason: 'Iconic high-performance sports car for enthusiasts',
    sortOrder: 5,
    maxFetchCount: 2,
  },
];

// ─── Admin Data Seed ─────────────────────────────────────────────────────────

async function seedAdminData() {
  console.log('Seeding admin data...');

  const passwordHash = await bcrypt.hash('Password123!', 10);

  // ── 1. Users ────────────────────────────────────────────────────────────────

  const superAdmin = await prisma.user.upsert({
    where: { email: 'super.admin@afrozon.com' },
    create: {
      email: 'super.admin@afrozon.com',
      fullName: 'Super Admin',
      passwordHash,
      role: UserRole.SUPER_ADMIN,
      emailVerified: true,
      isActive: true,
    },
    update: {},
  });

  const opsAdmin = await prisma.user.upsert({
    where: { email: 'ops.admin@afrozon.com' },
    create: {
      email: 'ops.admin@afrozon.com',
      fullName: 'Operations Admin',
      passwordHash,
      role: UserRole.OPERATIONS_ADMIN,
      emailVerified: true,
      isActive: true,
    },
    update: {},
  });

  const buyerUsers = await Promise.all([
    prisma.user.upsert({
      where: { email: 'aisha.bello@example.com' },
      create: {
        email: 'aisha.bello@example.com',
        fullName: 'Aisha Bello',
        phone: '+2348012345678',
        passwordHash,
        role: UserRole.BUYER,
        emailVerified: true,
        isActive: true,
      },
      update: {},
    }),
    prisma.user.upsert({
      where: { email: 'chukwuemeka.obi@example.com' },
      create: {
        email: 'chukwuemeka.obi@example.com',
        fullName: 'Chukwuemeka Obi',
        phone: '+2348023456789',
        passwordHash,
        role: UserRole.BUYER,
        emailVerified: true,
        isActive: true,
      },
      update: {},
    }),
    prisma.user.upsert({
      where: { email: 'fatima.hassan@example.com' },
      create: {
        email: 'fatima.hassan@example.com',
        fullName: 'Fatima Hassan',
        phone: '+2348034567890',
        passwordHash,
        role: UserRole.BUYER,
        emailVerified: true,
        isActive: true,
      },
      update: {},
    }),
    prisma.user.upsert({
      where: { email: 'kwame.asante@example.com' },
      create: {
        email: 'kwame.asante@example.com',
        fullName: 'Kwame Asante',
        phone: '+233244123456',
        passwordHash,
        role: UserRole.BUYER,
        emailVerified: true,
        currency: 'GHS',
        isActive: true,
      },
      update: {},
    }),
    prisma.user.upsert({
      where: { email: 'ngozi.nwosu@example.com' },
      create: {
        email: 'ngozi.nwosu@example.com',
        fullName: 'Ngozi Nwosu',
        phone: '+2348045678901',
        passwordHash,
        role: UserRole.BUYER,
        emailVerified: true,
        isActive: true,
      },
      update: {},
    }),
  ]);

  const sellerUsers = await Promise.all([
    prisma.user.upsert({
      where: { email: 'autohub.lagos@example.com' },
      create: {
        email: 'autohub.lagos@example.com',
        fullName: 'AutoHub Lagos',
        phone: '+2341234567890',
        passwordHash,
        role: UserRole.SELLER,
        emailVerified: true,
        isActive: true,
      },
      update: {},
    }),
    prisma.user.upsert({
      where: { email: 'premium.cars.abuja@example.com' },
      create: {
        email: 'premium.cars.abuja@example.com',
        fullName: 'Premium Cars Abuja',
        phone: '+2349012345678',
        passwordHash,
        role: UserRole.SELLER,
        emailVerified: true,
        isActive: true,
      },
      update: {},
    }),
  ]);

  // ── 2. Profiles ─────────────────────────────────────────────────────────────

  const allUsers = [superAdmin, opsAdmin, ...buyerUsers, ...sellerUsers];
  const profileData = [
    { firstName: 'Super', lastName: 'Admin' },
    { firstName: 'Operations', lastName: 'Admin' },
    { firstName: 'Aisha', lastName: 'Bello' },
    { firstName: 'Chukwuemeka', lastName: 'Obi' },
    { firstName: 'Fatima', lastName: 'Hassan' },
    { firstName: 'Kwame', lastName: 'Asante' },
    { firstName: 'Ngozi', lastName: 'Nwosu' },
    { firstName: 'AutoHub', lastName: 'Lagos', businessName: 'AutoHub Lagos Ltd', isSeller: true },
    { firstName: 'Premium', lastName: 'Cars', businessName: 'Premium Cars Abuja', isSeller: true },
  ];

  for (let i = 0; i < allUsers.length; i++) {
    const existing = await prisma.profile.findUnique({ where: { userId: allUsers[i].id } });
    if (!existing) {
      await prisma.profile.create({
        data: {
          userId: allUsers[i].id,
          firstName: profileData[i].firstName,
          lastName: profileData[i].lastName,
          businessName: (profileData[i] as any).businessName ?? undefined,
          isSeller: (profileData[i] as any).isSeller ?? false,
          isVerified: true,
          sellerStatus: (profileData[i] as any).isSeller ? 'APPROVED' : 'NOT_APPLIED',
        },
      });
    }
  }

  // ── 3. Addresses ─────────────────────────────────────────────────────────────

  for (const buyer of buyerUsers) {
    const profile = await prisma.profile.findUnique({ where: { userId: buyer.id } });
    if (profile) {
      const addressExists = await prisma.address.findFirst({ where: { profileId: profile.id } });
      if (!addressExists) {
        await prisma.address.create({
          data: {
            profileId: profile.id,
            type: 'NORMAL',
            street: '14 Broad Street',
            city: 'Lagos',
            state: 'Lagos',
            country: 'Nigeria',
            isDefault: true,
          },
        });
      }
    }
  }

  // ── 4. Vehicles ──────────────────────────────────────────────────────────────

  const vehicleDefs = [
    {
      vin: 'SEED1TOYOTA2022001',
      slug: 'seed-2022-toyota-camry-001',
      make: 'Toyota', model: 'Camry', year: 2022,
      vehicleType: VehicleType.SEDAN,
      priceUsd: 28500,
      mileage: 18400,
      transmission: 'Automatic',
      fuelType: 'Gasoline',
      exteriorColor: 'Pearl White',
      thumbnail: 'https://res.cloudinary.com/demo/image/upload/v1/samples/car_01.jpg',
      status: VehicleStatus.AVAILABLE,
    },
    {
      vin: 'SEED2LEXUS2021002',
      slug: 'seed-2021-lexus-rx350-002',
      make: 'Lexus', model: 'RX 350', year: 2021,
      vehicleType: VehicleType.SUV,
      priceUsd: 46000,
      mileage: 24300,
      transmission: 'Automatic',
      fuelType: 'Gasoline',
      exteriorColor: 'Nebula Gray',
      thumbnail: 'https://res.cloudinary.com/demo/image/upload/v1/samples/car_02.jpg',
      status: VehicleStatus.AVAILABLE,
    },
    {
      vin: 'SEED3BMW2023003',
      slug: 'seed-2023-bmw-x5-003',
      make: 'BMW', model: 'X5', year: 2023,
      vehicleType: VehicleType.SUV,
      priceUsd: 72000,
      mileage: 8100,
      transmission: 'Automatic',
      fuelType: 'Gasoline',
      exteriorColor: 'Alpine White',
      thumbnail: 'https://res.cloudinary.com/demo/image/upload/v1/samples/car_03.jpg',
      status: VehicleStatus.AVAILABLE,
    },
    {
      vin: 'SEED4BENZ2020004',
      slug: 'seed-2020-mercedes-gle-004',
      make: 'Mercedes-Benz', model: 'GLE 450', year: 2020,
      vehicleType: VehicleType.SUV,
      priceUsd: 55000,
      mileage: 41000,
      transmission: 'Automatic',
      fuelType: 'Gasoline',
      exteriorColor: 'Obsidian Black',
      thumbnail: 'https://res.cloudinary.com/demo/image/upload/v1/samples/car_04.jpg',
      status: VehicleStatus.SOLD,
    },
    {
      vin: 'SEED5HONDA2022005',
      slug: 'seed-2022-honda-crv-005',
      make: 'Honda', model: 'CR-V', year: 2022,
      vehicleType: VehicleType.SUV,
      priceUsd: 31000,
      mileage: 15600,
      transmission: 'Automatic',
      fuelType: 'Gasoline',
      exteriorColor: 'Sonic Gray',
      thumbnail: 'https://res.cloudinary.com/demo/image/upload/v1/samples/car_05.jpg',
      status: VehicleStatus.AVAILABLE,
    },
    {
      vin: 'SEED6TOYOTA2021006',
      slug: 'seed-2021-toyota-highlander-006',
      make: 'Toyota', model: 'Highlander', year: 2021,
      vehicleType: VehicleType.SUV,
      priceUsd: 42000,
      mileage: 29700,
      transmission: 'Automatic',
      fuelType: 'Gasoline',
      exteriorColor: 'Midnight Black',
      thumbnail: 'https://res.cloudinary.com/demo/image/upload/v1/samples/car_06.jpg',
      status: VehicleStatus.PENDING,
    },
    {
      vin: 'SEED7PORSCHE2019007',
      slug: 'seed-2019-porsche-911-007',
      make: 'Porsche', model: '911 Carrera', year: 2019,
      vehicleType: VehicleType.COUPE,
      priceUsd: 110000,
      mileage: 12500,
      transmission: 'Automatic',
      fuelType: 'Gasoline',
      exteriorColor: 'Guards Red',
      thumbnail: 'https://res.cloudinary.com/demo/image/upload/v1/samples/car_07.jpg',
      status: VehicleStatus.AVAILABLE,
    },
    {
      vin: 'SEED8FORD2023008',
      slug: 'seed-2023-ford-f150-008',
      make: 'Ford', model: 'F-150', year: 2023,
      vehicleType: VehicleType.TRUCK,
      priceUsd: 48000,
      mileage: 5200,
      transmission: 'Automatic',
      fuelType: 'Gasoline',
      exteriorColor: 'Atlas Blue',
      thumbnail: 'https://res.cloudinary.com/demo/image/upload/v1/samples/car_08.jpg',
      status: VehicleStatus.AVAILABLE,
    },
  ];

  const vehicles: any[] = [];
  for (const v of vehicleDefs) {
    const vehicle = await prisma.vehicle.upsert({
      where: { vin: v.vin },
      create: {
        ...v,
        source: VehicleSource.MANUAL,
        dealerName: 'Afrozon Direct',
        dealerState: 'CA',
        dealerCity: 'Los Angeles',
        isActive: true,
        addedByName: 'Super Admin',
      },
      update: {},
    });
    vehicles.push(vehicle);
  }

  // ── 5. Orders ────────────────────────────────────────────────────────────────

  const now = new Date();
  const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 15);
  const thisMonth = new Date(now.getFullYear(), now.getMonth(), 5);

  const makeSnapshot = (v: any) => ({
    make: v.make, model: v.model, year: v.year,
    vin: v.vin, thumbnail: v.thumbnail ?? null,
    priceUsd: v.priceUsd, source: 'MANUAL',
  });

  type OrderDef = {
    requestNumber: string;
    userId: string;
    vehicleIdx: number;
    status: OrderStatus;
    quotedPriceUsd?: number;
    depositAmountUsd?: number;
    totalLandedCostUsd?: number;
    shippingMethod: ShippingMethod;
    priority?: any;
    createdAt?: Date;
  };

  const orderDefs: OrderDef[] = [
    // ── Pending (show on admin dashboard)
    {
      requestNumber: 'AFZ-26-03-000001',
      userId: buyerUsers[0].id,
      vehicleIdx: 0,
      status: OrderStatus.PENDING_QUOTE,
      shippingMethod: ShippingMethod.RORO,
    },
    {
      requestNumber: 'AFZ-26-03-000002',
      userId: buyerUsers[1].id,
      vehicleIdx: 1,
      status: OrderStatus.QUOTE_SENT,
      quotedPriceUsd: 46000,
      totalLandedCostUsd: 58700,
      shippingMethod: ShippingMethod.CONTAINER,
    },
    {
      requestNumber: 'AFZ-26-03-000003',
      userId: buyerUsers[2].id,
      vehicleIdx: 2,
      status: OrderStatus.QUOTE_ACCEPTED,
      quotedPriceUsd: 72000,
      depositAmountUsd: 7200,
      totalLandedCostUsd: 91500,
      shippingMethod: ShippingMethod.CONTAINER,
      priority: 'HIGH',
    },
    {
      requestNumber: 'AFZ-26-03-000004',
      userId: buyerUsers[3].id,
      vehicleIdx: 4,
      status: OrderStatus.DEPOSIT_PENDING,
      quotedPriceUsd: 31000,
      depositAmountUsd: 3100,
      totalLandedCostUsd: 39200,
      shippingMethod: ShippingMethod.RORO,
    },
    {
      requestNumber: 'AFZ-26-03-000005',
      userId: buyerUsers[4].id,
      vehicleIdx: 7,
      status: OrderStatus.QUOTE_SENT,
      quotedPriceUsd: 48000,
      totalLandedCostUsd: 62000,
      shippingMethod: ShippingMethod.RORO,
      priority: 'URGENT',
    },
    // ── In-progress
    {
      requestNumber: 'AFZ-26-02-000006',
      userId: buyerUsers[0].id,
      vehicleIdx: 5,
      status: OrderStatus.INSPECTION_COMPLETE,
      quotedPriceUsd: 42000,
      depositAmountUsd: 4200,
      totalLandedCostUsd: 53500,
      shippingMethod: ShippingMethod.CONTAINER,
      createdAt: lastMonth,
    },
    {
      requestNumber: 'AFZ-26-02-000007',
      userId: buyerUsers[1].id,
      vehicleIdx: 3,
      status: OrderStatus.IN_TRANSIT,
      quotedPriceUsd: 55000,
      depositAmountUsd: 5500,
      totalLandedCostUsd: 69800,
      shippingMethod: ShippingMethod.RORO,
      createdAt: lastMonth,
    },
    // ── Delivered (last month - completed)
    {
      requestNumber: 'AFZ-25-12-000008',
      userId: buyerUsers[2].id,
      vehicleIdx: 1,
      status: OrderStatus.DELIVERED,
      quotedPriceUsd: 46000,
      depositAmountUsd: 4600,
      totalLandedCostUsd: 58500,
      shippingMethod: ShippingMethod.RORO,
      createdAt: new Date(2025, 11, 10),
    },
    // ── Delivered (this month - for revenue)
    {
      requestNumber: 'AFZ-26-03-000009',
      userId: buyerUsers[3].id,
      vehicleIdx: 6,
      status: OrderStatus.DELIVERED,
      quotedPriceUsd: 110000,
      depositAmountUsd: 11000,
      totalLandedCostUsd: 138000,
      shippingMethod: ShippingMethod.CONTAINER,
      createdAt: thisMonth,
      priority: 'HIGH',
    },
    // ── Cancelled
    {
      requestNumber: 'AFZ-26-02-000010',
      userId: buyerUsers[4].id,
      vehicleIdx: 0,
      status: OrderStatus.CANCELLED,
      quotedPriceUsd: 28500,
      shippingMethod: ShippingMethod.RORO,
      createdAt: lastMonth,
    },
  ];

  const orders: any[] = [];
  for (const def of orderDefs) {
    const existing = await prisma.order.findUnique({ where: { requestNumber: def.requestNumber } });
    if (existing) {
      orders.push(existing);
      continue;
    }
    const order = await prisma.order.create({
      data: {
        requestNumber: def.requestNumber,
        userId: def.userId,
        vehicleId: vehicles[def.vehicleIdx].id,
        vehicleSnapshot: makeSnapshot(vehicles[def.vehicleIdx]),
        status: def.status,
        quotedPriceUsd: def.quotedPriceUsd,
        depositAmountUsd: def.depositAmountUsd,
        totalLandedCostUsd: def.totalLandedCostUsd,
        shippingMethod: def.shippingMethod,
        destinationCountry: 'Nigeria',
        destinationCity: 'Lagos',
        priority: def.priority ?? 'NORMAL',
        vehicleSource: 'IN_HOUSE',
        createdAt: def.createdAt ?? now,
      },
    });
    orders.push(order);
  }

  // ── 6. Payments ──────────────────────────────────────────────────────────────

  type PaymentDef = {
    orderIdx: number;
    userId: string;
    amountUsd: number;
    paymentType: PaymentType;
    status: PaymentStatus;
    escrowStatus: EscrowStatus;
    transactionRef: string;
    completedAt?: Date;
  };

  const paymentDefs: PaymentDef[] = [
    // Delivered (Dec 2025) — deposit + balance
    {
      orderIdx: 7, userId: buyerUsers[2].id,
      amountUsd: 4600, paymentType: PaymentType.DEPOSIT,
      status: PaymentStatus.COMPLETED, escrowStatus: EscrowStatus.RELEASED,
      transactionRef: 'TXN-SEED-001',
      completedAt: new Date(2025, 11, 12),
    },
    {
      orderIdx: 7, userId: buyerUsers[2].id,
      amountUsd: 53900, paymentType: PaymentType.BALANCE,
      status: PaymentStatus.COMPLETED, escrowStatus: EscrowStatus.RELEASED,
      transactionRef: 'TXN-SEED-002',
      completedAt: new Date(2026, 0, 15),
    },
    // Delivered (this month) — deposit + balance
    {
      orderIdx: 8, userId: buyerUsers[3].id,
      amountUsd: 11000, paymentType: PaymentType.DEPOSIT,
      status: PaymentStatus.COMPLETED, escrowStatus: EscrowStatus.RELEASED,
      transactionRef: 'TXN-SEED-003',
      completedAt: new Date(2026, 1, 20),
    },
    {
      orderIdx: 8, userId: buyerUsers[3].id,
      amountUsd: 127000, paymentType: PaymentType.BALANCE,
      status: PaymentStatus.COMPLETED, escrowStatus: EscrowStatus.RELEASED,
      transactionRef: 'TXN-SEED-004',
      completedAt: new Date(2026, 2, 5),
    },
    // In-transit — deposit paid (last month)
    {
      orderIdx: 6, userId: buyerUsers[1].id,
      amountUsd: 5500, paymentType: PaymentType.DEPOSIT,
      status: PaymentStatus.COMPLETED, escrowStatus: EscrowStatus.HELD,
      transactionRef: 'TXN-SEED-005',
      completedAt: new Date(2026, 1, 5),
    },
    // Inspection complete — deposit paid (last month)
    {
      orderIdx: 5, userId: buyerUsers[0].id,
      amountUsd: 4200, paymentType: PaymentType.DEPOSIT,
      status: PaymentStatus.COMPLETED, escrowStatus: EscrowStatus.HELD,
      transactionRef: 'TXN-SEED-006',
      completedAt: new Date(2026, 1, 10),
    },
  ];

  for (const p of paymentDefs) {
    const existing = await prisma.payment.findUnique({ where: { transactionRef: p.transactionRef } });
    if (existing) continue;
    await prisma.payment.create({
      data: {
        orderId: orders[p.orderIdx].id,
        userId: p.userId,
        amountUsd: p.amountUsd,
        paymentType: p.paymentType,
        status: p.status,
        escrowStatus: p.escrowStatus,
        transactionRef: p.transactionRef,
        paymentProvider: 'paystack',
        paymentMethod: 'BANK_TRANSFER',
        completedAt: p.completedAt,
      },
    });
  }

  // ── 7. Admin Notes ───────────────────────────────────────────────────────────

  const adminNoteSeeds = [
    {
      orderId: orders[1].id,
      userId: buyerUsers[1].id,
      createdById: opsAdmin.id,
      note: 'Quote sent via email. Customer has been informed about shipping timeline (45-60 days via RORO).',
      category: 'communication',
    },
    {
      orderId: orders[2].id,
      userId: buyerUsers[2].id,
      createdById: superAdmin.id,
      note: 'High-value order. Deposit invoice generated and sent. Awaiting payment confirmation.',
      category: 'finance',
    },
    {
      orderId: orders[5].id,
      userId: buyerUsers[0].id,
      createdById: opsAdmin.id,
      note: 'Inspection passed. All 4 findings are minor cosmetic. Customer approved the report.',
      category: 'inspection',
    },
    {
      orderId: orders[6].id,
      userId: buyerUsers[1].id,
      createdById: opsAdmin.id,
      note: 'Vehicle loaded on MV Ocean Star. ETA Lagos port: April 12, 2026. Bill of lading attached.',
      category: 'shipping',
    },
    {
      orderId: orders[9].id,
      userId: buyerUsers[4].id,
      createdById: superAdmin.id,
      note: 'Order cancelled by customer. No payment received. Slot freed for another buyer.',
      category: 'cancellation',
    },
    {
      userId: buyerUsers[3].id,
      createdById: opsAdmin.id,
      note: 'VIP customer — Kwame Asante. Has completed 2 orders. Eligible for loyalty pricing on next order.',
      category: 'customer',
    },
  ];

  for (const n of adminNoteSeeds) {
    const existing = await prisma.adminNote.findFirst({
      where: { note: n.note, createdById: n.createdById },
    });
    if (!existing) {
      await prisma.adminNote.create({ data: n });
    }
  }

  // ── 8. Activity Logs ─────────────────────────────────────────────────────────

  const activitySeeds = [
    {
      userId: buyerUsers[0].id,
      orderId: orders[0].id,
      action: 'order_created',
      entityType: 'order',
      entityId: orders[0].id,
      description: `New order ${orders[0].requestNumber} created by Aisha Bello for 2022 Toyota Camry`,
      performedBy: buyerUsers[0].id,
    },
    {
      userId: buyerUsers[1].id,
      orderId: orders[1].id,
      action: 'status_changed',
      entityType: 'order',
      entityId: orders[1].id,
      description: `Order ${orders[1].requestNumber} status updated to QUOTE_SENT`,
      performedBy: opsAdmin.id,
    },
    {
      userId: buyerUsers[2].id,
      orderId: orders[2].id,
      action: 'status_changed',
      entityType: 'order',
      entityId: orders[2].id,
      description: `Order ${orders[2].requestNumber} quote accepted by Fatima Hassan`,
      performedBy: buyerUsers[2].id,
    },
    {
      userId: buyerUsers[3].id,
      orderId: orders[3].id,
      action: 'order_created',
      entityType: 'order',
      entityId: orders[3].id,
      description: `New order ${orders[3].requestNumber} created by Kwame Asante for 2022 Honda CR-V`,
      performedBy: buyerUsers[3].id,
    },
    {
      userId: buyerUsers[0].id,
      orderId: orders[5].id,
      action: 'payment_received',
      entityType: 'payment',
      entityId: orders[5].id,
      description: `Deposit of $4,200 received for order ${orders[5].requestNumber}`,
      performedBy: opsAdmin.id,
      metadata: { amount: 4200, currency: 'USD', type: 'DEPOSIT' },
    },
    {
      userId: buyerUsers[1].id,
      orderId: orders[6].id,
      action: 'shipment_update',
      entityType: 'shipment',
      entityId: orders[6].id,
      description: `Order ${orders[6].requestNumber} vehicle loaded and shipped via RORO. Vessel: MV Tera Star`,
      performedBy: opsAdmin.id,
    },
    {
      userId: buyerUsers[3].id,
      orderId: orders[8].id,
      action: 'order_delivered',
      entityType: 'order',
      entityId: orders[8].id,
      description: `Order ${orders[8].requestNumber} successfully delivered to Kwame Asante in Lagos`,
      performedBy: opsAdmin.id,
    },
    {
      userId: buyerUsers[4].id,
      orderId: orders[9].id,
      action: 'order_cancelled',
      entityType: 'order',
      entityId: orders[9].id,
      description: `Order ${orders[9].requestNumber} cancelled by Ngozi Nwosu. No payment collected.`,
      performedBy: buyerUsers[4].id,
    },
  ];

  for (const a of activitySeeds) {
    const existing = await prisma.activityLog.findFirst({
      where: { action: a.action, orderId: a.orderId ?? undefined, entityId: a.entityId },
    });
    if (!existing) {
      await prisma.activityLog.create({ data: a });
    }
  }

  // ── 9. Notifications ─────────────────────────────────────────────────────────

  const notificationSeeds = [
    {
      userId: buyerUsers[0].id,
      orderId: orders[0].id,
      type: NotificationType.ORDER_CREATED,
      title: 'Order Submitted',
      message: `Your order ${orders[0].requestNumber} has been submitted. Our team will prepare a quote shortly.`,
      actionUrl: `/orders/${orders[0].id}`,
      actionLabel: 'View Order',
    },
    {
      userId: buyerUsers[1].id,
      orderId: orders[1].id,
      type: NotificationType.ORDER_STATUS_CHANGED,
      title: 'Quote Ready',
      message: `Your quote for order ${orders[1].requestNumber} is ready. Please review and respond.`,
      actionUrl: `/orders/${orders[1].id}`,
      actionLabel: 'View Quote',
    },
    {
      userId: buyerUsers[2].id,
      orderId: orders[2].id,
      type: NotificationType.ORDER_STATUS_CHANGED,
      title: 'Deposit Invoice Sent',
      message: `Your deposit invoice for order ${orders[2].requestNumber} has been sent. Please complete payment.`,
      actionUrl: `/orders/${orders[2].id}`,
      actionLabel: 'Pay Deposit',
    },
    {
      userId: buyerUsers[0].id,
      orderId: orders[5].id,
      type: NotificationType.PAYMENT_RECEIVED,
      title: 'Payment Confirmed',
      message: `Your deposit of $4,200 for order ${orders[5].requestNumber} has been confirmed.`,
      actionUrl: `/orders/${orders[5].id}`,
      actionLabel: 'View Order',
      isRead: true,
    },
    {
      userId: buyerUsers[1].id,
      orderId: orders[6].id,
      type: NotificationType.SHIPMENT_UPDATE,
      title: 'Your Car is on the Way',
      message: `Good news! Your vehicle has been loaded and is now in transit. Estimated arrival: April 12, 2026.`,
      actionUrl: `/orders/${orders[6].id}`,
      actionLabel: 'Track Shipment',
    },
    {
      userId: buyerUsers[3].id,
      orderId: orders[8].id,
      type: NotificationType.ORDER_DELIVERED,
      title: 'Vehicle Delivered!',
      message: `Your 2019 Porsche 911 Carrera has been successfully delivered. Enjoy your new ride!`,
      actionUrl: `/orders/${orders[8].id}`,
      actionLabel: 'View Order',
      isRead: true,
    },
  ];

  for (const n of notificationSeeds) {
    const existing = await prisma.notification.findFirst({
      where: { userId: n.userId, type: n.type, orderId: n.orderId ?? undefined },
    });
    if (!existing) {
      await prisma.notification.create({
        data: {
          userId: n.userId,
          orderId: n.orderId,
          type: n.type,
          title: n.title,
          message: n.message,
          actionUrl: n.actionUrl,
          actionLabel: n.actionLabel,
          isRead: (n as any).isRead ?? false,
        },
      });
    }
  }

  // ── 10. Inspections ──────────────────────────────────────────────────────────

  const inspectionExists5 = await prisma.inspection.findUnique({ where: { orderId: orders[5].id } });
  if (!inspectionExists5) {
    await prisma.inspection.create({
      data: {
        orderId: orders[5].id,
        inspectorName: 'Mike Thompson',
        inspectorCompany: 'AutoCheck USA',
        inspectionDate: new Date(2026, 1, 8),
        inspectionLocation: 'Houston, TX',
        overallCondition: InspectionCondition.GOOD,
        findings: [
          { category: 'Exterior', item: 'Paint', condition: 'Good', notes: 'Minor scuff on rear bumper' },
          { category: 'Interior', item: 'Seats', condition: 'Excellent', notes: 'No tears or stains' },
          { category: 'Engine', item: 'Oil level', condition: 'Good', notes: 'Recently serviced' },
          { category: 'Tyres', item: 'Tread depth', condition: 'Good', notes: '7mm all round' },
        ],
        recommended: true,
        estimatedValue: 43500,
        customerApproved: true,
        approvedAt: new Date(2026, 1, 9),
      },
    });
  }

  const inspectionExists6 = await prisma.inspection.findUnique({ where: { orderId: orders[6].id } });
  if (!inspectionExists6) {
    await prisma.inspection.create({
      data: {
        orderId: orders[6].id,
        inspectorName: 'Carlos Rivera',
        inspectorCompany: 'Pro Vehicle Inspect',
        inspectionDate: new Date(2026, 0, 28),
        inspectionLocation: 'Miami, FL',
        overallCondition: InspectionCondition.EXCELLENT,
        findings: [
          { category: 'Exterior', item: 'Body panels', condition: 'Excellent', notes: 'No dents or damage' },
          { category: 'Engine', item: 'Performance', condition: 'Excellent', notes: 'All systems normal' },
        ],
        recommended: true,
        estimatedValue: 56000,
        customerApproved: true,
        approvedAt: new Date(2026, 0, 29),
      },
    });
  }

  // ── 11. Shipments ─────────────────────────────────────────────────────────────

  const shipmentExists6 = await prisma.shipment.findUnique({ where: { orderId: orders[6].id } });
  if (!shipmentExists6) {
    await prisma.shipment.create({
      data: {
        orderId: orders[6].id,
        shippingMethod: ShippingMethod.RORO,
        carrier: 'Atlantic Shipping Lines',
        carrierTrackingNumber: 'ATL-2026-0087443',
        originPort: 'Port of Baltimore',
        destinationPort: 'Tin Can Island Port, Lagos',
        originCountry: 'USA',
        destinationCountry: 'Nigeria',
        vesselName: 'MV Tera Star',
        vesselNumber: 'VS-20260201',
        bookingNumber: 'BK-2026-88123',
        status: ShipmentStatus.IN_TRANSIT,
        bookedAt: new Date(2026, 1, 3),
        departedDate: new Date(2026, 1, 12),
        etaPort: new Date(2026, 3, 12),
        trackingUpdates: [
          { date: new Date(2026, 1, 3).toISOString(), status: 'BOOKED', location: 'Baltimore, MD', description: 'Booking confirmed' },
          { date: new Date(2026, 1, 10).toISOString(), status: 'AT_PORT', location: 'Port of Baltimore', description: 'Vehicle received at port' },
          { date: new Date(2026, 1, 12).toISOString(), status: 'LOADED', location: 'Port of Baltimore', description: 'Vehicle loaded onto MV Tera Star' },
          { date: new Date(2026, 1, 13).toISOString(), status: 'IN_TRANSIT', location: 'Atlantic Ocean', description: 'Vessel departed' },
        ],
        deliveryAddress: '14 Broad Street, Lagos Island, Lagos',
        deliveryContactName: 'Chukwuemeka Obi',
        deliveryContactPhone: '+2348023456789',
      },
    });
  }

  const shipmentExists7 = await prisma.shipment.findUnique({ where: { orderId: orders[7].id } });
  if (!shipmentExists7) {
    await prisma.shipment.create({
      data: {
        orderId: orders[7].id,
        shippingMethod: ShippingMethod.RORO,
        carrier: 'West Africa Cargo Lines',
        originPort: 'Port of Houston',
        destinationPort: 'Apapa Port, Lagos',
        status: ShipmentStatus.DELIVERED,
        bookedAt: new Date(2025, 11, 20),
        departedDate: new Date(2025, 11, 28),
        arrivedPortDate: new Date(2026, 1, 10),
        clearedCustomsDate: new Date(2026, 1, 16),
        deliveredDate: new Date(2026, 1, 22),
        trackingUpdates: [
          { date: new Date(2025, 11, 28).toISOString(), status: 'IN_TRANSIT', location: 'Gulf of Mexico', description: 'Vessel en route' },
          { date: new Date(2026, 1, 10).toISOString(), status: 'ARRIVED', location: 'Apapa, Lagos', description: 'Vessel arrived at port' },
          { date: new Date(2026, 1, 16).toISOString(), status: 'CLEARED', location: 'Apapa Port', description: 'Customs cleared' },
          { date: new Date(2026, 1, 22).toISOString(), status: 'DELIVERED', location: 'Lagos', description: 'Vehicle delivered to customer' },
        ],
        deliveryAddress: 'No 5 Murtala Mohammed Way, Lagos',
      },
    });
  }

  // ── 12. Testimonials ─────────────────────────────────────────────────────────

  const testimonialSeeds = [
    {
      userId: buyerUsers[2].id,
      orderId: orders[7].id,
      customerName: 'Fatima Hassan',
      customerCity: 'Lagos',
      customerCountry: 'Nigeria',
      rating: 5,
      comment: "Absolutely seamless experience from start to finish. My Lexus RX 350 arrived in perfect condition within the estimated timeframe. Afrozon's team kept me informed at every step. Highly recommended!",
      vehicleSnapshot: makeSnapshot(vehicles[1]),
      isApproved: true,
      isFeatured: true,
      publishedAt: new Date(2026, 1, 25),
      approvedBy: opsAdmin.id,
    },
    {
      userId: buyerUsers[3].id,
      orderId: orders[8].id,
      customerName: 'Kwame Asante',
      customerCity: 'Accra',
      customerCountry: 'Ghana',
      rating: 5,
      comment: 'Ordering a Porsche 911 from the US seemed daunting, but Afrozon made it effortless. The whole process was transparent and professional. My car arrived in pristine condition!',
      vehicleSnapshot: makeSnapshot(vehicles[6]),
      isApproved: true,
      isFeatured: true,
      publishedAt: new Date(2026, 2, 10),
      approvedBy: superAdmin.id,
    },
  ];

  for (const t of testimonialSeeds) {
    const existing = await prisma.testimonial.findFirst({
      where: { userId: t.userId, orderId: t.orderId },
    });
    if (!existing) {
      await prisma.testimonial.create({ data: t });
    }
  }

  // ── 13. Sourcing Requests ────────────────────────────────────────────────────

  const sourcingSeeds = [
    {
      requestNumber: 'SRC-26-03-0001',
      userId: buyerUsers[4].id,
      status: SourcingRequestStatus.NEW,
      make: 'Toyota', model: 'Land Cruiser',
      yearFrom: 2021, yearTo: 2024,
      condition: 'USED',
      budgetUsd: '65000',
      shippingMethod: ShippingMethod.RORO,
      timeline: 'ASAP',
      firstName: 'Ngozi', lastName: 'Nwosu',
      email: 'ngozi.nwosu@example.com',
      phoneNumber: '08045678901',
      deliveryCity: 'Abuja',
    },
    {
      requestNumber: 'SRC-26-03-0002',
      status: SourcingRequestStatus.NEW,
      make: 'Range Rover', model: 'Sport',
      yearFrom: 2022, yearTo: 2025,
      condition: 'USED',
      budgetUsd: '90000',
      shippingMethod: ShippingMethod.CONTAINER,
      timeline: '1-3',
      firstName: 'Emeka', lastName: 'Adeyemi',
      email: 'emeka.adeyemi@gmail.com',
      phoneCode: '+234',
      phoneNumber: '08056789012',
      deliveryCity: 'Lagos',
    },
    {
      requestNumber: 'SRC-26-02-0003',
      userId: buyerUsers[0].id,
      status: SourcingRequestStatus.CONTACTED,
      make: 'Lexus', model: 'GX 460',
      yearFrom: 2020, yearTo: 2023,
      condition: 'USED',
      budgetUsd: '55000',
      shippingMethod: ShippingMethod.RORO,
      timeline: '3-6',
      firstName: 'Aisha', lastName: 'Bello',
      email: 'aisha.bello@example.com',
      phoneNumber: '08012345678',
      deliveryCity: 'Kano',
    },
  ];

  for (const s of sourcingSeeds) {
    const existing = await prisma.sourcingRequest.findUnique({ where: { requestNumber: s.requestNumber } });
    if (!existing) {
      await prisma.sourcingRequest.create({ data: s });
    }
  }

  console.log('Admin data seeding complete.');
  console.log('\n── Admin Credentials ────────────────────────────────');
  console.log('  Super Admin:  super.admin@afrozon.com  / Password123!');
  console.log('  Ops Admin:    ops.admin@afrozon.com    / Password123!');
  console.log('  Buyer:        aisha.bello@example.com  / Password123!');
  console.log('─────────────────────────────────────────────────────\n');
}

async function main() {
  console.log('Seeding vehicle categories...');
  for (const c of defaultCategories) {
    await prisma.vehicleCategory.upsert({
      where: { slug: c.slug },
      create: {
        slug: c.slug,
        label: c.label,
        bodyStyle: c.bodyStyle ?? undefined,
        fuel: c.fuel ?? undefined,
        luxuryMakes: (c as any).luxuryMakes ?? [],
        priceMin: (c as any).priceMin ?? undefined,
        sortOrder: c.sortOrder,
        isActive: true,
      },
      update: {
        label: c.label,
        bodyStyle: c.bodyStyle ?? undefined,
        fuel: c.fuel ?? undefined,
        luxuryMakes: (c as any).luxuryMakes ?? [],
        priceMin: (c as any).priceMin ?? undefined,
        sortOrder: c.sortOrder,
      },
    });
  }
  console.log('Seeding trending definitions...');
  for (const t of defaultTrending) {
    const existing = await prisma.trendingDefinition.findFirst({
      where: { make: t.make, model: t.model ?? null, yearStart: t.yearStart, yearEnd: t.yearEnd },
    });
    if (existing) continue;
    await prisma.trendingDefinition.create({
      data: {
        make: t.make,
        model: t.model ?? undefined,
        yearStart: t.yearStart,
        yearEnd: t.yearEnd,
        label: t.label ?? undefined,
        sortOrder: t.sortOrder,
        maxFetchCount: (t as any).maxFetchCount ?? undefined,
        isActive: true,
      },
    });
  }
  console.log('Seeding recommended definitions...');
  for (const r of defaultRecommended) {
    const existing = await prisma.recommendedDefinition.findFirst({
      where: {
        make: r.make,
        model: r.model ?? null,
        yearStart: r.yearStart,
        yearEnd: r.yearEnd,
      },
    });

    if (existing) {
      await prisma.recommendedDefinition.update({
        where: { id: existing.id },
        data: {
          reason: r.reason ?? existing.reason ?? undefined,
          sortOrder: r.sortOrder,
          maxFetchCount: (r as any).maxFetchCount ?? existing.maxFetchCount ?? 2,
          isActive: true,
          forRecommended: true,
          forSpecialty: existing.forSpecialty, // preserve any existing specialty flags
        },
      });
      continue;
    }

    await prisma.recommendedDefinition.create({
      data: {
        make: r.make,
        model: r.model ?? undefined,
        yearStart: r.yearStart,
        yearEnd: r.yearEnd,
        reason: r.reason ?? undefined,
        sortOrder: r.sortOrder,
        maxFetchCount: (r as any).maxFetchCount ?? 2,
        isActive: true,
        forRecommended: true,
        forSpecialty: false,
      },
    });
  }

  console.log('Seeding specialty definitions...');
  for (const s of defaultSpecialty) {
    const existing = await prisma.recommendedDefinition.findFirst({
      where: {
        make: s.make,
        model: s.model ?? null,
        yearStart: s.yearStart,
        yearEnd: s.yearEnd,
      },
    });

    if (existing) {
      await prisma.recommendedDefinition.update({
        where: { id: existing.id },
        data: {
          reason: s.reason ?? existing.reason ?? undefined,
          sortOrder: s.sortOrder,
          maxFetchCount: (s as any).maxFetchCount ?? existing.maxFetchCount ?? 2,
          isActive: true,
          forSpecialty: true,
        },
      });
      continue;
    }

    await prisma.recommendedDefinition.create({
      data: {
        make: s.make,
        model: s.model ?? undefined,
        yearStart: s.yearStart,
        yearEnd: s.yearEnd,
        reason: s.reason ?? undefined,
        sortOrder: s.sortOrder,
        maxFetchCount: (s as any).maxFetchCount ?? 2,
        isActive: true,
        forRecommended: false,
        forSpecialty: true,
      },
    });
  }
  await seedAdminData();
  console.log('Seed completed.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
