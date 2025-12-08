import { useState, useEffect } from "react";
import { MapPin, ExternalLink, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface GoogleMapEmbedProps {
  address?: string;
  placeId?: string;
  locationUrl?: string;
  height?: string;
  className?: string;
  showOpenButton?: boolean;
}

export function GoogleMapEmbed({
  address,
  placeId,
  locationUrl,
  height = "300px",
  className = "",
  showOpenButton = true,
}: GoogleMapEmbedProps) {
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    async function checkMapsConfig() {
      try {
        const response = await fetch("/api/maps/config");
        if (response.ok) {
          const data = await response.json();
          if (data.configured && data.publicKey) {
            setApiKey(data.publicKey);
          }
        }
      } catch (error) {
        console.error("Failed to check maps config:", error);
      } finally {
        setIsLoading(false);
      }
    }
    checkMapsConfig();
  }, []);

  const handleIframeError = () => {
    setHasError(true);
  };

  const getEmbedUrl = () => {
    if (!apiKey) return null;
    
    if (placeId) {
      return `https://www.google.com/maps/embed/v1/place?key=${apiKey}&q=place_id:${placeId}`;
    }
    
    if (address) {
      return `https://www.google.com/maps/embed/v1/place?key=${apiKey}&q=${encodeURIComponent(address)}`;
    }
    
    return null;
  };

  const getMapsUrl = () => {
    if (locationUrl) return locationUrl;
    if (address) return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
    return null;
  };

  const embedUrl = getEmbedUrl();
  const mapsUrl = getMapsUrl();

  if (isLoading) {
    return (
      <div 
        className={`flex items-center justify-center bg-muted/30 rounded-md ${className}`}
        style={{ height }}
      >
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!embedUrl || hasError) {
    const displayAddress = address || (placeId ? "Ver localizacao" : null);
    return (
      <div 
        className={`flex flex-col items-center justify-center bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-800 rounded-md ${className}`}
        style={{ height }}
        data-testid="map-fallback-container"
      >
        <MapPin className="h-12 w-12 text-muted-foreground mb-4" />
        {displayAddress ? (
          <>
            <p className="text-sm text-muted-foreground text-center px-4 mb-4">
              {displayAddress}
            </p>
            {mapsUrl && showOpenButton && (
              <Button variant="outline" size="sm" asChild data-testid="button-open-maps-fallback">
                <a href={mapsUrl} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Abrir no Google Maps
                </a>
              </Button>
            )}
          </>
        ) : (
          <p className="text-sm text-muted-foreground">
            Endereco nao configurado
          </p>
        )}
      </div>
    );
  }

  return (
    <div className={`relative ${className}`} style={{ height }}>
      <iframe
        src={embedUrl}
        width="100%"
        height="100%"
        style={{ border: 0 }}
        allowFullScreen
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
        onError={handleIframeError}
        title="Google Maps"
        className="rounded-md"
      />
      {mapsUrl && showOpenButton && (
        <div className="absolute bottom-3 right-3">
          <Button variant="secondary" size="sm" asChild className="shadow-md" data-testid="button-open-maps">
            <a href={mapsUrl} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="h-4 w-4 mr-2" />
              Abrir
            </a>
          </Button>
        </div>
      )}
    </div>
  );
}
