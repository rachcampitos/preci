/**
 * Fetches real store locations in Lima from OpenStreetMap via Overpass API.
 * Covers: Tambo+, Tottus, Plaza Vea, Metro, Wong, Vivanda, Mass, Makro, Oxxo, Listo, RepShop
 */

interface OSMElement {
  type: 'node' | 'way' | 'relation';
  id: number;
  lat?: number;
  lon?: number;
  center?: { lat: number; lon: number };
  tags?: Record<string, string>;
}

interface OverpassResponse {
  elements: OSMElement[];
}

export interface OSMStoreData {
  name: string;
  type: string;
  chain: string;
  address: string;
  district: string;
  province: string;
  latitude: number;
  longitude: number;
  isOnline: boolean;
  isVerified: boolean;
  osmId: number;
}

const BRAND_MAP: Record<string, { chain: string; type: string }> = {
  'tambo': { chain: 'tambo', type: 'minimarket' },
  'tambo+': { chain: 'tambo', type: 'minimarket' },
  'tottus': { chain: 'tottus', type: 'supermercado' },
  'plaza vea': { chain: 'plaza_vea', type: 'supermercado' },
  'plazavea': { chain: 'plaza_vea', type: 'supermercado' },
  'wong': { chain: 'wong', type: 'supermercado' },
  'vivanda': { chain: 'vivanda', type: 'supermercado' },
  'mass': { chain: 'mass', type: 'minimarket' },
  'makro': { chain: 'makro', type: 'mayorista' },
  'oxxo': { chain: 'oxxo', type: 'minimarket' },
  'listo': { chain: 'listo', type: 'minimarket' },
  'repshop': { chain: 'repshop', type: 'minimarket' },
};

function matchBrand(tags: Record<string, string>): { chain: string; type: string } | null {
  // Check brand tag first (most reliable)
  const brand = (tags.brand || '').toLowerCase().trim();
  for (const [key, value] of Object.entries(BRAND_MAP)) {
    if (brand.includes(key)) return value;
  }

  // Fall back to name tag
  const name = (tags.name || '').toLowerCase().trim();
  for (const [key, value] of Object.entries(BRAND_MAP)) {
    if (name.includes(key)) return value;
  }

  return null;
}

function isMetroSupermarket(tags: Record<string, string>): boolean {
  const name = (tags.name || '').toLowerCase();
  const brand = (tags.brand || '').toLowerCase();
  const shop = (tags.shop || '').toLowerCase();
  return (
    (name.includes('metro') || brand.includes('metro')) &&
    shop === 'supermarket'
  );
}

export async function fetchStoresFromOSM(): Promise<OSMStoreData[]> {
  // Lima metro bbox: south=-12.52, west=-77.19, north=-11.57, east=-76.63
  // Using bbox instead of area search (Overpass area DB doesn't always have Lima indexed)
  const LIMA_BBOX = '(-12.52,-77.19,-11.57,-76.63)';

  const query = `
    [out:json][timeout:90];
    (
      nwr["brand"~"Tambo|Tottus|Plaza Vea|PlazaVea|Wong|Vivanda|Makro|Mass|Oxxo|Listo|RepShop",i]["shop"~"supermarket|convenience",i]${LIMA_BBOX};
      nwr["name"~"Metro",i]["shop"="supermarket"]${LIMA_BBOX};
      nwr["brand"~"Metro",i]["shop"="supermarket"]${LIMA_BBOX};
    );
    out center;
  `;

  const url = 'https://overpass-api.de/api/interpreter';
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `data=${encodeURIComponent(query)}`,
  });

  if (!response.ok) {
    throw new Error(`Overpass API error: ${response.status} ${response.statusText}`);
  }

  const data: OverpassResponse = await response.json();
  const stores: OSMStoreData[] = [];
  const seen = new Set<number>();

  for (const el of data.elements) {
    if (seen.has(el.id)) continue;
    seen.add(el.id);

    const tags = el.tags || {};

    // Get coordinates (nodes have lat/lon, ways/relations have center)
    const lat = el.lat ?? el.center?.lat;
    const lon = el.lon ?? el.center?.lon;
    if (!lat || !lon) continue;

    // Match to our known brands
    let brandInfo: { chain: string; type: string } | null;

    if (isMetroSupermarket(tags)) {
      brandInfo = { chain: 'metro', type: 'supermercado' };
    } else {
      brandInfo = matchBrand(tags);
    }

    if (!brandInfo) continue;

    // Build store name
    const name = tags.name || tags.brand || brandInfo.chain;

    // Extract district from OSM tags
    const district =
      tags['addr:city'] ||
      tags['addr:suburb'] ||
      tags['addr:district'] ||
      '';

    const address =
      [tags['addr:street'], tags['addr:housenumber']].filter(Boolean).join(' ') ||
      tags['addr:full'] ||
      '';

    stores.push({
      name,
      type: brandInfo.type,
      chain: brandInfo.chain,
      address,
      district,
      province: 'Lima',
      latitude: lat,
      longitude: lon,
      isOnline: false,
      isVerified: true,
      osmId: el.id,
    });
  }

  return stores;
}
