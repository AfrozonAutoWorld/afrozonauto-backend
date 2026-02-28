import 'dotenv/config';
import { PrismaClient } from '../src/generated/prisma/client';

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
    if (existing) continue;
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
      },
    });
  }
  console.log('Seed completed.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
