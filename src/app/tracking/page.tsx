// src/app/tracking/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import { getUserRoutes, isPointInRoute, SafeRoute } from '../../../lib/firebaseUtils';

interface LocationData {
  lat: number;
  lng: number;
  timestamp: Date;
  isInSafeRoute: boolean;
  nearestRoute?: string;
}

export default function TrackingPage() {
  const [currentLocation, setCurrentLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locationHistory, setLocationHistory] = useState<LocationData[]>([]);
  const [safeRoutes, setSafeRoutes] = useState<SafeRoute[]>([]);
  const [isTracking, setIsTracking] = useState(false);
  const [status, setStatus] = useState<'safe' | 'warning' | 'unknown'>('unknown');
  const [childName, setChildName] = useState('');
  const [parentUserId, setParentUserId] = useState('');
  const [isSetup, setIsSetup] = useState(false);

  // Obtener ubicación del dispositivo
  const getCurrentLocation = (): Promise<{ lat: number; lng: number }> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocalización no soportada'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        (error) => {
          reject(error);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 30000,
        }
      );
    });
  };

  // Cargar rutas del padre
  const loadSafeRoutes = async () => {
    if (!parentUserId) return;
    
    try {
      console.log('🔄 Cargando rutas seguras...');
      const routes = await getUserRoutes(parentUserId);
      setSafeRoutes(routes);
      console.log('✅ Rutas cargadas:', routes.length);
    } catch (error) {
      console.error('❌ Error cargando rutas:', error);
    }
  };

  // Verificar si está en ruta segura
  const checkSafetyStatus = (location: { lat: number; lng: number }) => {
    if (safeRoutes.length === 0) {
      setStatus('unknown');
      return null;
    }

    for (const route of safeRoutes) {
      if (route.active && isPointInRoute(location, route)) {
        setStatus('safe');
        return route.name;
      }
    }

    setStatus('warning');
    return null;
  };

  // Enviar ubicación a Firebase
  const sendLocationToFirebase = async (locationData: LocationData) => {
    try {
      await addDoc(collection(db, 'tracking'), {
        childName,
        parentUserId,
        location: {
          lat: locationData.lat,
          lng: locationData.lng,
        },
        timestamp: locationData.timestamp,
        isInSafeRoute: locationData.isInSafeRoute,
        nearestRoute: locationData.nearestRoute,
        status: status,
      });
      console.log('✅ Ubicación enviada a Firebase');
    } catch (error) {
      console.error('❌ Error enviando ubicación:', error);
    }
  };

  // Proceso principal de tracking
  const trackLocation = async () => {
    try {
      console.log('🔄 Obteniendo ubicación...');
      const location = await getCurrentLocation();
      setCurrentLocation(location);

      const nearestRoute = checkSafetyStatus(location);
      
      const locationData: LocationData = {
        lat: location.lat,
        lng: location.lng,
        timestamp: new Date(),
        isInSafeRoute: status === 'safe',
        nearestRoute: nearestRoute || undefined,
      };

      setLocationHistory(prev => [locationData, ...prev.slice(0, 9)]); // Mantener últimas 10
      
      if (isSetup) {
        await sendLocationToFirebase(locationData);
      }

    } catch (error) {
      console.error('❌ Error obteniendo ubicación:', error);
      setStatus('unknown');
    }
  };

  // Iniciar tracking automático
  useEffect(() => {
    if (!isTracking || !isSetup) return;

    const interval = setInterval(() => {
      trackLocation();
    }, 2 * 60 * 1000); // Cada 2 minutos

    // Primera ejecución inmediata
    trackLocation();

    return () => clearInterval(interval);
  }, [isTracking, isSetup, safeRoutes]);

  // Cargar rutas cuando se configura
  useEffect(() => {
    if (parentUserId) {
      loadSafeRoutes();
    }
  }, [parentUserId]);

  const handleSetup = () => {
    if (childName.trim() && parentUserId.trim()) {
      setIsSetup(true);
      loadSafeRoutes();
    }
  };

  const toggleTracking = () => {
    setIsTracking(!isTracking);
    if (!isTracking) {
      trackLocation(); // Primera ubicación inmediata
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'safe': return 'bg-green-500';
      case 'warning': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusText = () => {
    switch (status) {
      case 'safe': return '✅ En ruta segura';
      case 'warning': return '⚠️ Fuera de ruta';
      default: return '❓ Verificando...';
    }
  };

  if (!isSetup) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-md p-8 max-w-md w-full">
          <h1 className="text-2xl font-bold text-center mb-6">Family Tracker</h1>
          <p className="text-gray-600 text-center mb-6">
            Configuración inicial para el seguimiento
          </p>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tu nombre
              </label>
              <input
                type="text"
                value={childName}
                onChange={(e) => setChildName(e.target.value)}
                placeholder="Ej: María, Juan, etc."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ID del padre/madre
              </label>
              <input
                type="text"
                value={parentUserId}
                onChange={(e) => setParentUserId(e.target.value)}
                placeholder="Pídele este código a tu padre/madre"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs text-gray-500 mt-1">
                El padre debe ir al Dashboard y copiar su User ID
              </p>
            </div>

            <button
              onClick={handleSetup}
              disabled={!childName.trim() || !parentUserId.trim()}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              Configurar Tracking
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className={`${getStatusColor()} text-white`}>
        <div className="max-w-md mx-auto px-4 py-6">
          <h1 className="text-xl font-bold text-center">Hola, {childName}!</h1>
          <p className="text-center text-sm opacity-90">
            {getStatusText()}
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-md mx-auto px-4 py-6 space-y-6">
        
        {/* Control de tracking */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-lg font-semibold mb-4">Control de Seguimiento</h2>
          
          <button
            onClick={toggleTracking}
            className={`w-full py-3 px-4 rounded-lg font-medium ${
              isTracking 
                ? 'bg-red-600 text-white hover:bg-red-700' 
                : 'bg-green-600 text-white hover:bg-green-700'
            }`}
          >
            {isTracking ? '⏹️ Detener Seguimiento' : '▶️ Iniciar Seguimiento'}
          </button>

          {isTracking && (
            <p className="text-sm text-gray-600 mt-2 text-center">
              📍 Enviando ubicación cada 2 minutos
            </p>
          )}
        </div>

        {/* Ubicación actual */}
        {currentLocation && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="font-semibold mb-3">📍 Mi Ubicación Actual</h3>
            <div className="text-sm text-gray-600 space-y-1">
              <p>Latitud: {currentLocation.lat.toFixed(6)}</p>
              <p>Longitud: {currentLocation.lng.toFixed(6)}</p>
            </div>
          </div>
        )}

        {/* Rutas seguras disponibles */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="font-semibold mb-3">🛡️ Rutas Seguras ({safeRoutes.length})</h3>
          {safeRoutes.length > 0 ? (
            <div className="space-y-2">
              {safeRoutes.map((route) => (
                <div key={route.id} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                  <span className="text-sm">{route.name}</span>
                  <span className={`text-xs px-2 py-1 rounded ${
                    route.active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                  }`}>
                    {route.active ? 'Activa' : 'Inactiva'}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500">No hay rutas configuradas</p>
          )}
        </div>

        {/* Historial */}
        {locationHistory.length > 0 && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="font-semibold mb-3">📋 Últimas Ubicaciones</h3>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {locationHistory.map((loc, index) => (
                <div key={index} className="text-xs p-2 bg-gray-50 rounded">
                  <div className="flex justify-between">
                    <span>{loc.timestamp.toLocaleTimeString()}</span>
                    <span className={loc.isInSafeRoute ? 'text-green-600' : 'text-red-600'}>
                      {loc.isInSafeRoute ? '✅ Seguro' : '⚠️ Fuera'}
                    </span>
                  </div>
                  {loc.nearestRoute && (
                    <p className="text-gray-600">Ruta: {loc.nearestRoute}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}