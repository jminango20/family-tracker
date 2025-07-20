// src/app/dashboard/routes/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../../../../lib/useAuth';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { saveRoute, getUserRoutes, SafeRoute } from '../../../../lib/firebaseUtils';

// Importar MapComponent dinámicamente para evitar problemas de SSR
const MapComponent = dynamic(() => import('../../../components/MapComponent'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-96 bg-gray-200 rounded-lg flex items-center justify-center">
      <span>Cargando mapa...</span>
    </div>
  )
});

interface RoutePoint {
  lat: number;
  lng: number;
  name?: string;
}

export default function RoutesPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [isCreatingRoute, setIsCreatingRoute] = useState(false);
  const [routeName, setRouteName] = useState('');
  const [currentRoute, setCurrentRoute] = useState<RoutePoint[]>([]);
  const [savedRoutes, setSavedRoutes] = useState<SafeRoute[]>([]);
  const [routesLoading, setRoutesLoading] = useState(true);

  // Cargar rutas existentes
  useEffect(() => {
    const loadRoutes = async () => {
      if (user) {
        try {
          const routes = await getUserRoutes(user.uid);
          setSavedRoutes(routes);
        } catch (error) {
          console.error('Error cargando rutas:', error);
        } finally {
          setRoutesLoading(false);
        }
      }
    };

    loadRoutes();
  }, [user]);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Cargando...</div>
      </div>
    );
  }

  if (!user) {
    router.push('/login');
    return null;
  }

  const handleStartCreatingRoute = () => {
    setIsCreatingRoute(true);
    setCurrentRoute([]);
  };

  const handleRouteCreate = (points: RoutePoint[]) => {
    setCurrentRoute(points);
  };

  const handleSaveRoute = async () => {
    if (!routeName.trim()) {
      alert('Por favor ingresa un nombre para la ruta');
      return;
    }

    if (currentRoute.length < 2) {
      alert('La ruta debe tener al menos 2 puntos');
      return;
    }

    try {
      const routeData = {
        name: routeName,
        userId: user!.uid,
        points: currentRoute,
        tolerance: 20,
        active: true
      };

      // Guardar la ruta
      const routeId = await saveRoute(routeData);
      console.log('✅ Ruta guardada con ID:', routeId);
      
      // Mostrar éxito INMEDIATAMENTE
      alert(`✅ Ruta "${routeData.name}" guardada exitosamente!`);
      
      // Limpiar formulario INMEDIATAMENTE
      setRouteName('');
      setCurrentRoute([]);
      setIsCreatingRoute(false);
      
      // Recargar rutas de forma segura
      console.log('🔄 Recargando lista de rutas...');
      const updatedRoutes = await getUserRoutes(user!.uid);
      setSavedRoutes(updatedRoutes);
      console.log('✅ Lista actualizada con', updatedRoutes.length, 'rutas');
      
    } catch (error: unknown) {
      console.error('❌ Error en el proceso:', error);
      alert(`❌ Error: ${(error as Error)?.message || 'Error desconocido'}`);
    }
  };

  const handleCancelRoute = () => {
    setIsCreatingRoute(false);
    setCurrentRoute([]);
    setRouteName('');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.push('/dashboard')}
                className="text-indigo-600 hover:text-indigo-500"
              >
                ← Volver al Dashboard
              </button>
              <h1 className="text-2xl font-bold text-gray-900">Gestión de Rutas Seguras</h1>
            </div>
            <span className="text-sm text-gray-600">{user.email}</span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">        
        {!isCreatingRoute ? (
          // Vista principal - lista de rutas
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold mb-4">Mis Rutas Seguras</h2>
              <p className="text-gray-600 mb-6">
                Crea y gestiona las rutas seguras que tu familia debe seguir.
              </p>
              
              <button
                onClick={handleStartCreatingRoute}
                className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 font-medium"
              >
                + Crear Nueva Ruta
              </button>

              {/* Lista de rutas */}
              <div className="mt-8">
                <h3 className="text-lg font-medium mb-4">Rutas Existentes</h3>
                {savedRoutes.length === 0 ? (
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                    <p className="text-gray-500">No tienes rutas creadas aún.</p>
                    <p className="text-gray-400 text-sm mt-2">
                      Crea tu primera ruta para comenzar a usar el sistema de seguimiento.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {savedRoutes.map((route) => (
                      <div key={route.id} className="bg-gray-50 rounded-lg p-4 border">
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-medium text-gray-900">{route.name}</h4>
                            <p className="text-sm text-gray-600">
                              {route.points.length} puntos • Tolerancia: {route.tolerance}m
                            </p>
                            <p className="text-xs text-gray-500">
                              Creada: {route.createdAt.toLocaleDateString('es-ES')}
                            </p>
                          </div>
                          <div className="flex space-x-2">
                            <span className={`px-2 py-1 text-xs rounded-full ${
                              route.active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                            }`}>
                              {route.active ? 'Activa' : 'Inactiva'}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          // Vista de creación de ruta
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold mb-4">Crear Nueva Ruta</h2>
              
              {/* Formulario de nombre */}
              <div className="mb-6">
                <label htmlFor="routeName" className="block text-sm font-medium text-gray-700 mb-2">
                  Nombre de la ruta
                </label>
                <input
                  id="routeName"
                  type="text"
                  value={routeName}
                  onChange={(e) => setRouteName(e.target.value)}
                  placeholder="Ej: Casa a Colegio, Casa a Guardería"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Mapa */}
              <MapComponent 
                onRouteCreate={handleRouteCreate}
                isCreatingRoute={isCreatingRoute}
              />

              {/* Botones de acción */}
              <div className="flex space-x-4 mt-6">
                <button
                  onClick={handleSaveRoute}
                  disabled={!routeName.trim() || currentRoute.length < 2}
                  className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Guardar Ruta
                </button>
                <button
                  onClick={handleCancelRoute}
                  className="bg-gray-600 text-white px-6 py-2 rounded-lg hover:bg-gray-700"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}