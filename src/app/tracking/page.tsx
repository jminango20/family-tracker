// src/app/tracking/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { collection, addDoc, doc, getDoc } from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import { getUserRoutes, isPointInRoute, SafeRoute, getDistanceInMeters } from '../../../lib/firebaseUtils';
import { sendAlert, shouldSendAlert } from '../../../lib/emailAlerts';

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
  const [loading, setLoading] = useState(false); // NUEVO STATE
  // AGREGAR ESTOS ESTADOS después de la línea 24 (después de [loading, setLoading]):
const [parentEmail, setParentEmail] = useState('');
const [previousStatus, setPreviousStatus] = useState<'safe' | 'warning' | 'unknown'>('unknown');


  // NUEVA FUNCIÓN: Validar si el User ID existe
  const validateParentUserId = async (userId: string): Promise<boolean> => {
    try {
      console.log('🔍 Validando User ID:', userId);
      
      // Verificar si tiene rutas creadas (si tiene rutas, es un padre válido)
      const routes = await getUserRoutes(userId);
      const isValid = routes.length > 0;
      
      console.log(isValid ? '✅ User ID válido' : '❌ User ID inválido');
      return isValid;
      
    } catch (error) {
      console.error('❌ Error validando User ID:', error);
      return false;
    }
  };

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
const checkSafetyStatus = async (location: { lat: number; lng: number }) => {
  console.log('🔍 Verificando ubicación:', location);
  console.log('🔍 Rutas disponibles:', safeRoutes.length);
  
  if (safeRoutes.length === 0) {
    console.log('❌ No hay rutas configuradas');
    setStatus('unknown');
    return null;
  }

  let newStatus: 'safe' | 'warning' | 'unknown' = 'warning';
  let activeRoute: string | null = null;

  for (const route of safeRoutes) {
    console.log(`🔍 Verificando ruta: ${route.name} (activa: ${route.active})`);
    
    if (route.active && isPointInRoute(location, route)) {
      console.log(`✅ DENTRO de la ruta: ${route.name}`);
      newStatus = 'safe';
      activeRoute = route.name;
      break;
    } else {
      console.log(`❌ FUERA de la ruta: ${route.name}`);
      
      // DEBUGGING: Mostrar distancias a cada punto
      for (let i = 0; i < route.points.length; i++) {
        const point = route.points[i];
        const distance = getDistanceInMeters(location, point);
        console.log(`   📏 Distancia al ${point.name || `Punto ${i+1}`}: ${distance.toFixed(1)}m (tolerancia: ${route.tolerance}m)`);
      }
    }
  }

  // NUEVA FUNCIONALIDAD: Detectar cambios de estado y enviar alertas
  if (newStatus !== previousStatus && parentEmail) {
    console.log(`🔄 Cambio de estado: ${previousStatus} → ${newStatus}`);
    
    // Solo enviar alerta si sale de ruta (safe → warning) o regresa (warning → safe)
    if ((previousStatus === 'safe' && newStatus === 'warning') || 
        (previousStatus === 'warning' && newStatus === 'safe')) {
      
      const alertType = newStatus === 'warning' ? 'exit_route' : 'enter_route';
      
      // Verificar cooldown para evitar spam
      if (shouldSendAlert(childName, alertType)) {
        console.log(`🚨 Enviando alerta: ${alertType}`);
        
        try {
          await sendAlert({
            childName,
            parentEmail,
            location,
            timestamp: new Date(),
            routeName: activeRoute || undefined,
            alertType
          });
          console.log('✅ Alerta enviada exitosamente');
        } catch (error) {
          console.error('❌ Error enviando alerta:', error);
        }
      }
    }
  }

  // Actualizar estados
  setPreviousStatus(newStatus);
  setStatus(newStatus);
  
  if (newStatus === 'warning') {
    console.log('❌ Fuera de todas las rutas');
    return null;
  }
  
  return activeRoute;
};

  // Enviar ubicación a Firebase
const sendLocationToFirebase = async (locationData: LocationData) => {
  try {
    // Preparar datos sin valores undefined
    const dataToSend = {
      childName,
      parentUserId,
      location: {
        lat: locationData.lat,
        lng: locationData.lng,
      },
      timestamp: locationData.timestamp,
      isInSafeRoute: locationData.isInSafeRoute,
      status: status,
      // Solo incluir nearestRoute si existe
      ...(locationData.nearestRoute && { nearestRoute: locationData.nearestRoute })
    };

    console.log('📤 Enviando a Firebase:', dataToSend);

    await addDoc(collection(db, 'tracking'), dataToSend);
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

      const nearestRoute = await checkSafetyStatus(location);
      
      const locationData: LocationData = {
        lat: location.lat,
        lng: location.lng,
        timestamp: new Date(),
        isInSafeRoute: status === 'safe',
        ...(nearestRoute && { nearestRoute })
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

  // FUNCIÓN HANDLESETUP ACTUALIZADA CON VALIDACIÓN
  const handleSetup = async () => {
    if (!childName.trim() || !parentUserId.trim() || !parentEmail.trim()) {
      alert('Por favor completa todos los campos');
      return;
    }

    // Mostrar loading
    setLoading(true);
    
    try {
      // Validar que el User ID existe
      const isValidParent = await validateParentUserId(parentUserId);
      
      if (!isValidParent) {
        alert('❌ User ID inválido. Verifica que el código sea correcto y que el padre tenga rutas configuradas.');
        setLoading(false);
        return;
      }
      
      // Si es válido, continuar
      setIsSetup(true);
      await loadSafeRoutes();
      alert('✅ Configuración exitosa! Conectado con el padre.');
      
    } catch (error) {
      console.error('Error en setup:', error);
      alert('❌ Error al validar. Intenta de nuevo.');
    } finally {
      setLoading(false);
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
          <h1 className="text-2xl font-bold text-center text-gray-900">Family Tracker</h1>
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
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-600 text-gray-900"
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
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-600 text-gray-900"
              />
              <p className="text-xs text-gray-500 mt-1">
                El padre debe ir al Dashboard y copiar su User ID
              </p>
            </div>
            {/* AQUÍ VA EL CAMPO DE EMAIL */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email del padre/madre
              </label>
              <input
                type="email"
                value={parentEmail}
                onChange={(e) => setParentEmail(e.target.value)}
                placeholder="padre@email.com"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-600 text-gray-900"
              />
              <p className="text-xs text-gray-500 mt-1">
                Para recibir alertas automáticas
              </p>
            </div>

            {/* BOTÓN ACTUALIZADO CON LOADING */}
            <button
              onClick={handleSetup}
              disabled={!childName.trim() || !parentUserId.trim() || !parentEmail.trim() || loading}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? '🔍 Verificando...' : 'Configurar Tracking'}
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
          <h2 className="text-lg font-medium text-gray-900">Control de Seguimiento</h2>
          
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
            <h3 className="font-bold mb-3 text-gray-900">📍 Mi Ubicación Actual</h3>
            <div className="text-sm text-gray-600 space-y-1">
              <p>Latitud: {currentLocation.lat.toFixed(6)}</p>
              <p>Longitud: {currentLocation.lng.toFixed(6)}</p>
            </div>
          </div>
        )}

        {/* Rutas seguras disponibles */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="font-semibold font-medium text-gray-900">🛡️ Rutas Seguras ({safeRoutes.length})</h3>
          {safeRoutes.length > 0 ? (
            <div className="space-y-2">
              {safeRoutes.map((route) => (
                <div key={route.id} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                  <span className="text-sm font-medium text-gray-500">{route.name}</span>
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
            <h3 className="font-medium text-gray-900">📋 Últimas Ubicaciones</h3>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {locationHistory.map((loc, index) => (
                <div key={index} className="text-xs p-2 bg-gray-50 rounded">
                  <div className="flex justify-between font-medium text-gray-500">
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