import { useState, useRef, useEffect, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { MapPin, ExternalLink, Loader2, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface PlacePrediction {
  placeId: string;
  description: string;
  mainText: string;
  secondaryText: string;
}

interface PlaceDetails {
  placeId: string;
  formattedAddress: string;
  name: string;
  lat: number;
  lng: number;
  mapsUrl: string;
}

interface LocationPickerProps {
  value?: string;
  locationUrl?: string;
  onLocationChange: (location: string) => void;
  onLocationUrlChange: (url: string) => void;
  placeholder?: string;
  disabled?: boolean;
}

export function LocationPicker({
  value = "",
  locationUrl = "",
  onLocationChange,
  onLocationUrlChange,
  placeholder = "Digite o endereco ou nome do local",
  disabled = false,
}: LocationPickerProps) {
  const [inputValue, setInputValue] = useState(value);
  const [predictions, setPredictions] = useState<PlacePrediction[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [isMapsConfigured, setIsMapsConfigured] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    setInputValue(value);
  }, [value]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fetchPredictions = useCallback(async (input: string) => {
    if (input.length < 3) {
      setPredictions([]);
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`/api/maps/autocomplete?input=${encodeURIComponent(input)}`);
      if (!response.ok) {
        if (response.status === 503) {
          setIsMapsConfigured(false);
        }
        return;
      }
      const data = await response.json();
      setPredictions(data.predictions || []);
      setShowDropdown(true);
    } catch (error) {
      console.error("Failed to fetch predictions:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    onLocationChange(newValue);

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    if (isMapsConfigured && newValue.length >= 3) {
      debounceRef.current = setTimeout(() => {
        fetchPredictions(newValue);
      }, 300);
    } else {
      setPredictions([]);
      setShowDropdown(false);
    }
  };

  const handleSelectPlace = async (prediction: PlacePrediction) => {
    setIsLoading(true);
    setShowDropdown(false);
    
    try {
      const response = await fetch(`/api/maps/details?placeId=${encodeURIComponent(prediction.placeId)}`);
      if (!response.ok) {
        throw new Error("Failed to fetch place details");
      }
      const data: PlaceDetails = await response.json();
      
      setInputValue(data.formattedAddress);
      onLocationChange(data.formattedAddress);
      onLocationUrlChange(data.mapsUrl);
    } catch (error) {
      console.error("Failed to fetch place details:", error);
      setInputValue(prediction.description);
      onLocationChange(prediction.description);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClear = () => {
    setInputValue("");
    onLocationChange("");
    onLocationUrlChange("");
    setPredictions([]);
  };

  return (
    <div ref={containerRef} className="relative">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={inputValue}
            onChange={handleInputChange}
            placeholder={placeholder}
            disabled={disabled}
            className="pl-9 pr-8"
            data-testid="input-location"
          />
          {isLoading && (
            <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
          )}
          {!isLoading && inputValue && (
            <button
              type="button"
              onClick={handleClear}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        {locationUrl && (
          <Button
            type="button"
            variant="outline"
            size="icon"
            asChild
            data-testid="button-open-maps"
          >
            <a href={locationUrl} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="h-4 w-4" />
            </a>
          </Button>
        )}
      </div>

      {showDropdown && predictions.length > 0 && (
        <div className="absolute z-50 mt-1 w-full rounded-md border bg-popover shadow-lg">
          <ul className="max-h-60 overflow-auto py-1">
            {predictions.map((prediction) => (
              <li key={prediction.placeId}>
                <button
                  type="button"
                  onClick={() => handleSelectPlace(prediction)}
                  className={cn(
                    "flex w-full items-start gap-2 px-3 py-2 text-left hover-elevate active-elevate-2",
                    "text-sm"
                  )}
                  data-testid={`option-place-${prediction.placeId}`}
                >
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                  <div className="min-w-0 flex-1">
                    <div className="font-medium truncate">{prediction.mainText}</div>
                    {prediction.secondaryText && (
                      <div className="text-xs text-muted-foreground truncate">
                        {prediction.secondaryText}
                      </div>
                    )}
                  </div>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {!isMapsConfigured && (
        <p className="mt-1 text-xs text-muted-foreground">
          Autocomplete indisponivel. Digite o endereco manualmente.
        </p>
      )}
    </div>
  );
}
