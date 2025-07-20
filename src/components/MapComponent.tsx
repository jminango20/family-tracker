// src/components/MapComponent.tsx
'use client';

import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix para los iconos de Leaflet en Next.js
// eslint-disable-next-line @typescript-eslint/no-explicit-any
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface RoutePoint {
  lat: number;
  lng: number;
  name?: string;
}

interface MapComponentProps {
  onRouteCreate?: (points: RoutePoint[]) => void;
  isCreatingRoute?: boolean;
}

// Componente para manejar clics en el mapa
function MapClickHandler({ onMapClick, isActive }: { onMapClick: (lat: number, lng: number) => void, isActive: boolean }) {
  useMapEvents({
    click: (e) => {
      if (isActive) {
        onMapClick(e.latlng.lat, e.latlng.lng);
      }
    },
  });
  return null;
}

export default function MapComponent({ onRouteCreate, isCreatingRoute = false }: MapComponentProps) {
  const [routePoints, setRoutePoints] = useState<RoutePoint[]>([]);
  const [mounted, setMounted] = useState(false);

  // Para evitar errores de hidratación con Next.js
  useEffect(() => {
    setMounted(true);
  }, []);

  const handleMapClick = (lat: number, lng: number) => {
    if (isCreatingRoute) {
      const newPoint: RoutePoint = { lat, lng, name: `Punto ${routePoints.length + 1}` };
      const updatedPoints = [...routePoints, newPoint];
      setRoutePoints(updatedPoints);
      
      if (onRouteCreate) {
        onRouteCreate(updatedPoints);
      }
    }
  };

  const clearRoute = () => {
    setRoutePoints([]);
    if (onRouteCreate) {
      onRouteCreate([]);
    }
  };

  const finishRoute = () => {
    if (routePoints.length >= 2 && onRouteCreate) {
      onRouteCreate(routePoints);
      alert(`Ruta creada con ${routePoints.length} puntos!`);
    } else {
      alert('Necesitas al menos 2 puntos para crear una ruta');
    }
  };

  if (!mounted) {
    return (
      <div className="w-full h-96 bg-gray-200 rounded-lg flex items-center justify-center">
        <span>Cargando mapa...</span>
      </div>
    );
  }

  // Posición inicial (Quito, Ecuador)
  const defaultPosition: [number, number] = [-0.1807, -78.4678];

  return (
    <div className="space-y-4">
      {/* Controles del mapa */}
      {isCreatingRoute && (
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
          <h3 className="font-semibold text-blue-900 mb-2">Crear Ruta Segura</h3>
          <p className="text-blue-700 text-sm mb-3">
            Haz clic en el mapa para agregar puntos a la ruta. Necesitas mínimo 2 puntos.
          </p>
          <div className="flex space-x-2">
            <button
              onClick={finishRoute}
              disabled={routePoints.length < 2}
              className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 disabled:opacity-50 text-sm"
            >
              Finalizar Ruta ({routePoints.length} puntos)
            </button>
            <button
              onClick={clearRoute}
              className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 text-sm"
            >
              Limpiar
            </button>
          </div>
        </div>
      )}

      {/* El mapa */}
      <div className="h-96 w-full rounded-lg overflow-hidden border">
        <MapContainer
          center={defaultPosition}
          zoom={13}
          style={{ height: '100%', width: '100%' }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          
          {/* Handler para clics en el mapa */}
          <MapClickHandler onMapClick={handleMapClick} isActive={isCreatingRoute} />
          
          {/* Marcadores para cada punto de la ruta */}
          {routePoints.map((point, index) => (
            <Marker key={index} position={[point.lat, point.lng]}>
              <Popup>
                <div>
                  <strong>{point.name || `Punto ${index + 1}`}</strong>
                  <br />
                  Lat: {point.lat.toFixed(6)}
                  <br />
                  Lng: {point.lng.toFixed(6)}
                </div>
              </Popup>
            </Marker>
          ))}
          
          {/* Línea conectando los puntos */}
          {routePoints.length > 1 && (
            <Polyline 
              positions={routePoints.map(p => [p.lat, p.lng])}
              color="blue"
              weight={4}
              opacity={0.7}
            />
          )}
        </MapContainer>
      </div>

      {/* Info de la ruta actual */}
      {routePoints.length > 0 && (
        <div className="bg-gray-50 p-3 rounded-lg">
          <h4 className="font-medium mb-2">Puntos de la ruta:</h4>
          <div className="text-sm text-gray-600 space-y-1">
            {routePoints.map((point, index) => (
              <div key={index}>
                {index + 1}. {point.name} - ({point.lat.toFixed(4)}, {point.lng.toFixed(4)})
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}