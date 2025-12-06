const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY;

export interface PlacePrediction {
  placeId: string;
  description: string;
  mainText: string;
  secondaryText: string;
}

export interface PlaceDetails {
  placeId: string;
  formattedAddress: string;
  name: string;
  lat: number;
  lng: number;
  mapsUrl: string;
}

export function isGoogleMapsConfigured(): boolean {
  return !!GOOGLE_MAPS_API_KEY;
}

export async function getPlaceAutocomplete(input: string): Promise<PlacePrediction[]> {
  if (!GOOGLE_MAPS_API_KEY) {
    throw new Error("Google Maps API key not configured");
  }

  if (!input || input.length < 3) {
    return [];
  }

  const url = new URL("https://maps.googleapis.com/maps/api/place/autocomplete/json");
  url.searchParams.set("input", input);
  url.searchParams.set("key", GOOGLE_MAPS_API_KEY);
  url.searchParams.set("language", "pt-BR");
  url.searchParams.set("components", "country:br");

  const response = await fetch(url.toString());
  const data = await response.json();

  if (data.status !== "OK" && data.status !== "ZERO_RESULTS") {
    console.error("[Google Maps] Autocomplete error:", data.status, data.error_message);
    throw new Error(`Google Maps API error: ${data.status}`);
  }

  return (data.predictions || []).map((prediction: any) => ({
    placeId: prediction.place_id,
    description: prediction.description,
    mainText: prediction.structured_formatting?.main_text || prediction.description,
    secondaryText: prediction.structured_formatting?.secondary_text || "",
  }));
}

export async function getPlaceDetails(placeId: string): Promise<PlaceDetails> {
  if (!GOOGLE_MAPS_API_KEY) {
    throw new Error("Google Maps API key not configured");
  }

  const url = new URL("https://maps.googleapis.com/maps/api/place/details/json");
  url.searchParams.set("place_id", placeId);
  url.searchParams.set("key", GOOGLE_MAPS_API_KEY);
  url.searchParams.set("language", "pt-BR");
  url.searchParams.set("fields", "formatted_address,name,geometry,url");

  const response = await fetch(url.toString());
  const data = await response.json();

  if (data.status !== "OK") {
    console.error("[Google Maps] Place details error:", data.status, data.error_message);
    throw new Error(`Google Maps API error: ${data.status}`);
  }

  const result = data.result;
  return {
    placeId,
    formattedAddress: result.formatted_address,
    name: result.name,
    lat: result.geometry.location.lat,
    lng: result.geometry.location.lng,
    mapsUrl: result.url || `https://www.google.com/maps/place/?q=place_id:${placeId}`,
  };
}
