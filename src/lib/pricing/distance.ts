/**
 * Future-ready distance calculation adapter.
 * Currently uses manually entered km; swap implementation for Maps/Mapbox later.
 */
export type DistanceInput = {
  originAddress: string;
  destinationAddress: string;
};

export type DistanceResult = {
  distanceKm: number | null;
  source: "manual" | "maps" | "mapbox";
};

export async function resolveDistanceKm(
  manualKm: number | null | undefined,
  // Reserved for Google Maps / Mapbox adapters
  _input?: DistanceInput
): Promise<DistanceResult> {
  void _input;
  if (manualKm == null || Number.isNaN(Number(manualKm))) {
    return { distanceKm: null, source: "manual" };
  }
  return { distanceKm: Number(manualKm), source: "manual" };
}
