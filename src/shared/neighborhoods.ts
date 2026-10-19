// Where people can say they're coming from (and where the host wants to eat).
// Coordinates are approximate neighborhood centers: good enough for comparing
// travel times, never anyone's real location.

export const BOROUGHS = [
  'Manhattan',
  'Brooklyn',
  'Queens',
  'The Bronx',
  'Staten Island',
  'New Jersey',
] as const

export type Borough = (typeof BOROUGHS)[number]

export interface Neighborhood {
  id: string
  name: string
  borough: Borough
  lat: number
  lng: number
}

export const ANYWHERE = 'anywhere'

export const NEIGHBORHOODS: Neighborhood[] = [
  // Manhattan
  { id: 'financial-district', name: 'Financial District', borough: 'Manhattan', lat: 40.7075, lng: -74.0113 },
  { id: 'tribeca', name: 'Tribeca', borough: 'Manhattan', lat: 40.7163, lng: -74.0086 },
  { id: 'chinatown', name: 'Chinatown', borough: 'Manhattan', lat: 40.7158, lng: -73.997 },
  { id: 'lower-east-side', name: 'Lower East Side', borough: 'Manhattan', lat: 40.715, lng: -73.9843 },
  { id: 'soho', name: 'SoHo', borough: 'Manhattan', lat: 40.7233, lng: -74.003 },
  { id: 'east-village', name: 'East Village', borough: 'Manhattan', lat: 40.7265, lng: -73.9815 },
  { id: 'greenwich-village', name: 'Greenwich Village', borough: 'Manhattan', lat: 40.7336, lng: -73.999 },
  { id: 'west-village', name: 'West Village', borough: 'Manhattan', lat: 40.7358, lng: -74.0036 },
  { id: 'chelsea', name: 'Chelsea', borough: 'Manhattan', lat: 40.7465, lng: -74.0014 },
  { id: 'flatiron', name: 'Flatiron', borough: 'Manhattan', lat: 40.741, lng: -73.9897 },
  { id: 'gramercy', name: 'Gramercy', borough: 'Manhattan', lat: 40.7368, lng: -73.9845 },
  { id: 'murray-hill', name: 'Murray Hill', borough: 'Manhattan', lat: 40.7479, lng: -73.9757 },
  { id: 'midtown', name: 'Midtown', borough: 'Manhattan', lat: 40.7549, lng: -73.984 },
  { id: 'hells-kitchen', name: "Hell's Kitchen", borough: 'Manhattan', lat: 40.7638, lng: -73.9918 },
  { id: 'upper-west-side', name: 'Upper West Side', borough: 'Manhattan', lat: 40.787, lng: -73.9754 },
  { id: 'upper-east-side', name: 'Upper East Side', borough: 'Manhattan', lat: 40.7736, lng: -73.9566 },
  { id: 'morningside-heights', name: 'Morningside Heights', borough: 'Manhattan', lat: 40.809, lng: -73.962 },
  { id: 'harlem', name: 'Harlem', borough: 'Manhattan', lat: 40.8116, lng: -73.9465 },
  { id: 'washington-heights', name: 'Washington Heights', borough: 'Manhattan', lat: 40.8417, lng: -73.9394 },
  // Brooklyn
  { id: 'williamsburg', name: 'Williamsburg', borough: 'Brooklyn', lat: 40.7081, lng: -73.9571 },
  { id: 'greenpoint', name: 'Greenpoint', borough: 'Brooklyn', lat: 40.7305, lng: -73.9515 },
  { id: 'bushwick', name: 'Bushwick', borough: 'Brooklyn', lat: 40.6944, lng: -73.9213 },
  { id: 'dumbo', name: 'DUMBO', borough: 'Brooklyn', lat: 40.7033, lng: -73.9881 },
  { id: 'brooklyn-heights', name: 'Brooklyn Heights', borough: 'Brooklyn', lat: 40.696, lng: -73.9936 },
  { id: 'downtown-brooklyn', name: 'Downtown Brooklyn', borough: 'Brooklyn', lat: 40.693, lng: -73.9897 },
  { id: 'fort-greene', name: 'Fort Greene', borough: 'Brooklyn', lat: 40.6892, lng: -73.9742 },
  { id: 'clinton-hill', name: 'Clinton Hill', borough: 'Brooklyn', lat: 40.6897, lng: -73.9661 },
  { id: 'bed-stuy', name: 'Bed-Stuy', borough: 'Brooklyn', lat: 40.6872, lng: -73.9418 },
  { id: 'cobble-hill', name: 'Cobble Hill', borough: 'Brooklyn', lat: 40.686, lng: -73.9969 },
  { id: 'carroll-gardens', name: 'Carroll Gardens', borough: 'Brooklyn', lat: 40.6795, lng: -73.9991 },
  { id: 'red-hook', name: 'Red Hook', borough: 'Brooklyn', lat: 40.6734, lng: -74.0083 },
  { id: 'park-slope', name: 'Park Slope', borough: 'Brooklyn', lat: 40.671, lng: -73.9814 },
  { id: 'prospect-heights', name: 'Prospect Heights', borough: 'Brooklyn', lat: 40.6775, lng: -73.9692 },
  { id: 'crown-heights', name: 'Crown Heights', borough: 'Brooklyn', lat: 40.6694, lng: -73.9422 },
  { id: 'flatbush', name: 'Flatbush', borough: 'Brooklyn', lat: 40.6409, lng: -73.959 },
  { id: 'sunset-park', name: 'Sunset Park', borough: 'Brooklyn', lat: 40.6455, lng: -74.0124 },
  { id: 'bay-ridge', name: 'Bay Ridge', borough: 'Brooklyn', lat: 40.6264, lng: -74.0299 },
  // Queens
  { id: 'long-island-city', name: 'Long Island City', borough: 'Queens', lat: 40.7447, lng: -73.9485 },
  { id: 'astoria', name: 'Astoria', borough: 'Queens', lat: 40.7644, lng: -73.9235 },
  { id: 'sunnyside', name: 'Sunnyside', borough: 'Queens', lat: 40.7433, lng: -73.9196 },
  { id: 'jackson-heights', name: 'Jackson Heights', borough: 'Queens', lat: 40.7557, lng: -73.8831 },
  { id: 'ridgewood', name: 'Ridgewood', borough: 'Queens', lat: 40.7043, lng: -73.9018 },
  { id: 'forest-hills', name: 'Forest Hills', borough: 'Queens', lat: 40.7181, lng: -73.8448 },
  { id: 'flushing', name: 'Flushing', borough: 'Queens', lat: 40.7675, lng: -73.8331 },
  // The Bronx
  { id: 'mott-haven', name: 'Mott Haven', borough: 'The Bronx', lat: 40.8091, lng: -73.9229 },
  { id: 'fordham-belmont', name: 'Fordham / Belmont', borough: 'The Bronx', lat: 40.8554, lng: -73.8885 },
  { id: 'riverdale', name: 'Riverdale', borough: 'The Bronx', lat: 40.899, lng: -73.9086 },
  // Staten Island
  { id: 'st-george', name: 'St. George', borough: 'Staten Island', lat: 40.6437, lng: -74.0736 },
  // New Jersey (lots of NYC friend groups have a JC/Hoboken contingent)
  { id: 'hoboken', name: 'Hoboken', borough: 'New Jersey', lat: 40.744, lng: -74.0324 },
  { id: 'jersey-city', name: 'Jersey City (Downtown)', borough: 'New Jersey', lat: 40.7178, lng: -74.0431 },
]

const byId = new Map(NEIGHBORHOODS.map((n) => [n.id, n]))

export function isNeighborhoodId(value: unknown): value is string {
  return typeof value === 'string' && byId.has(value)
}

export function neighborhoodName(id: string): string {
  return byId.get(id)?.name ?? 'somewhere'
}
