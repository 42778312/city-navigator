import tariffConfig from '@/config/taxiTariff.json';

export type TariffType = 'day' | 'night';

export interface PriceBreakdown {
  tariffType: TariffType;
  tariffName: string;
  tariffIcon: string;
  baseFare: number;
  distancePrice: number;
  totalPrice: number;
  distance: number;
  priceDetails: {
    tier: string;
    km: number;
    pricePerKm: number;
    subtotal: number;
  }[];
}

/**
 * Determines the current tariff type based on time and day of week
 * Day: Monday-Saturday 06:00-22:00
 * Night: Monday-Saturday 22:00-06:00 + Sunday all day
 */
export function getCurrentTariffType(date: Date = new Date()): TariffType {
  const dayOfWeek = date.getDay(); // 0 = Sunday, 1 = Monday, etc.
  const hour = date.getHours();

  // Sunday is always night tariff
  if (dayOfWeek === 0) {
    return 'night';
  }

  // Monday-Saturday: day tariff from 06:00 to 22:00
  if (hour >= 6 && hour < 22) {
    return 'day';
  }

  // Night tariff for hours 22:00-06:00
  return 'night';
}

/**
 * Calculates the distance price based on tiered pricing
 * First 5km: 3.00€/km
 * After 5km: 2.80€/km
 */
function calculateDistancePrice(
  distanceKm: number,
  distancePricing: { fromKm: number; toKm: number | null; pricePerKm: number }[]
): { total: number; details: PriceBreakdown['priceDetails'] } {
  let remainingDistance = distanceKm;
  let total = 0;
  const details: PriceBreakdown['priceDetails'] = [];

  for (const tier of distancePricing) {
    if (remainingDistance <= 0) break;

    const tierStart = tier.fromKm;
    const tierEnd = tier.toKm ?? Infinity;
    const tierRange = tierEnd - tierStart;

    // Calculate how much distance falls into this tier
    const distanceInTier = Math.min(remainingDistance, tierRange);
    const subtotal = distanceInTier * tier.pricePerKm;

    if (distanceInTier > 0) {
      details.push({
        tier: tier.toKm ? `${tier.fromKm}-${tier.toKm} km` : `>${tier.fromKm} km`,
        km: Math.round(distanceInTier * 100) / 100,
        pricePerKm: tier.pricePerKm,
        subtotal: Math.round(subtotal * 100) / 100,
      });

      total += subtotal;
      remainingDistance -= distanceInTier;
    }
  }

  return { total: Math.round(total * 100) / 100, details };
}

/**
 * Calculates the full taxi fare based on distance and current time
 */
export function calculateTaxiFare(
  distanceKm: number,
  date: Date = new Date()
): PriceBreakdown {
  const tariffType = getCurrentTariffType(date);
  const tariff = tariffConfig.tariffs[tariffType];

  const { total: distancePrice, details: priceDetails } = calculateDistancePrice(
    distanceKm,
    tariff.distancePricing
  );

  const totalPrice = tariff.baseFare + distancePrice;

  return {
    tariffType,
    tariffName: tariff.name,
    tariffIcon: tariff.icon,
    baseFare: tariff.baseFare,
    distancePrice: Math.round(distancePrice * 100) / 100,
    totalPrice: Math.round(totalPrice * 100) / 100,
    distance: distanceKm,
    priceDetails,
  };
}

/**
 * Format price in EUR
 */
export function formatPrice(price: number): string {
  return `€${price.toFixed(2)}`;
}

/**
 * Get tariff info for display
 */
export function getTariffInfo(tariffType: TariffType) {
  return tariffConfig.tariffs[tariffType];
}
