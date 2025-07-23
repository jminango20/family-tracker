// src/components/MapComponent.tsx
'use client';

import { useEffect, useState, useCallback } from 'react';
import { GoogleMap, Marker, Polyline, useLoadScript } from '@react-google-maps/api';

interface RoutePoint {
  lat: number;
  lng: number;
  name?: string;
}

interface MapComponentProps {
  onRouteCreate?: (points: RoutePoint[]) => void;
  isCreatingRoute?: boolean;
}

// Configuración del mapa
const mapContainerStyle = {
  width: '100%',
  height: '400px',
};

const defaultCenter = {
  lat: -22.839296, // Tu ubicación actual
  lng: -47.074509,
};

const mapOptions = {
  zoom: 15,
  mapTypeId: 'roadmap' as google.maps.MapTypeId,
  disableDefaultUI: false,
  zoomControl: true,
  streetViewControl: false,
  mapTypeControl: false,
  fullscreenControl: false,
};

export default function MapComponent({ onRouteCreate, isCreatingRoute = false }: MapComponentProps) {
  const [routePoints, setRoutePoints] = useState<RoutePoint[]>([]);

  // Cargar Google Maps
  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!,
  });

  // Manejar clics en el mapa
  const handleMapClick = useCallback((event: google.maps.MapMouseEvent) => {
    if (isCreatingRoute && event.latLng) {
      const lat = event.latLng.lat();
      const lng = event.latLng.lng();
      
      const newPoint: RoutePoint = { 
        lat, 
        lng, 
        name: `Punto ${routePoints.length + 1}` 
      };
      
      const updatedPoints = [...routePoints, newPoint];
      setRoutePoints(updatedPoints);
      
      if (onRouteCreate) {
        onRouteCreate(updatedPoints);
      }
      
      console.log(`📍 Punto agregado: ${lat.toFixed(6)}, ${lng.toFixed(6)}`);
    }
  }, [isCreatingRoute, routePoints, onRouteCreate]);

  const clearRoute = () => {
    setRoutePoints([]);
    if (onRouteCreate) {
      onRouteCreate([]);
    }
  };

  const finishRoute = () => {
    if (routePoints.length >= 2 && onRouteCreate) {
      onRouteCreate(routePoints);
      alert(`✅ Ruta creada con ${routePoints.length} puntos!`);
    } else {
      alert('❌ Necesitas al menos 2 puntos para crear una ruta');
    }
  };

  // Manejo de errores
  if (loadError) {
    return (
      <div className="w-full h-96 bg-red-50 rounded-lg flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600">❌ Error cargando Google Maps</p>
          <p className="text-sm text-red-500">Verifica tu API Key</p>
        </div>
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className="w-full h-96 bg-gray-200 rounded-lg flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
          <span>Cargando Google Maps...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Controles del mapa */}
      {isCreatingRoute && (
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
          <h3 className="font-semibold text-blue-900 mb-2">🗺️ Crear Ruta Segura con Google Maps</h3>
          <p className="text-blue-700 text-sm mb-3">
            Haz clic en el mapa para agregar puntos a la ruta. Necesitas mínimo 2 puntos.
            <br />
            <strong>Tolerancia: 50 metros</strong> (mucho más preciso que antes)
          </p>
          <div className="flex space-x-2">
            <button
              onClick={finishRoute}
              disabled={routePoints.length < 2}
              className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 disabled:opacity-50 text-sm"
            >
              ✅ Finalizar Ruta ({routePoints.length} puntos)
            </button>
            <button
              onClick={clearRoute}
              className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 text-sm"
            >
              🗑️ Limpiar
            </button>
          </div>
        </div>
      )}

      {/* Google Maps */}
      <div className="rounded-lg overflow-hidden border shadow-md">
        <GoogleMap
          mapContainerStyle={mapContainerStyle}
          zoom={15}
          center={defaultCenter}
          options={mapOptions}
          onClick={handleMapClick}
        >
          {/* Marcadores para cada punto */}
          {routePoints.map((point, index) => (
            <Marker
              key={index}
              position={{ lat: point.lat, lng: point.lng }}
              title={point.name || `Punto ${index + 1}`}
              label={{
                text: String(index + 1),
                color: 'white',
                fontWeight: 'bold',
              }}
            />
          ))}
          
          {/* Línea conectando los puntos */}
          {routePoints.length > 1 && (
            <Polyline
              path={routePoints.map(p => ({ lat: p.lat, lng: p.lng }))}
              options={{
                strokeColor: '#2563eb',
                strokeOpacity: 0.8,
                strokeWeight: 4,
              }}
            />
          )}
        </GoogleMap>
      </div>

      {/* Info de la ruta actual */}
      {routePoints.length > 0 && (
        <div className="bg-gray-50 p-4 rounded-lg">
          <h4 className="font-medium mb-2">📍 Puntos de la ruta:</h4>
          <div className="text-sm text-gray-600 space-y-1 max-h-32 overflow-y-auto">
            {routePoints.map((point, index) => (
              <div key={index} className="flex justify-between">
                <span>{index + 1}. {point.name}</span>
                <span className="font-mono text-xs">
                  {point.lat.toFixed(6)}, {point.lng.toFixed(6)}
                </span>
              </div>
            ))}
          </div>
          <div className="mt-2 text-xs text-blue-600">
            💡 Con Google Maps: Tolerancia de solo 50 metros (súper preciso)
          </div>
        </div>
      )}
    </div>
  );
}