// src/app/dashboard/page.tsx
'use client';

import { useAuth } from '../../../lib/useAuth';
import { signOut } from 'firebase/auth';
import { auth } from '../../../lib/firebase';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function Dashboard() {
  const { user, loading } = useAuth();
  const router = useRouter();

  // Redirect si no está autenticado
  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.push('/');
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Cargando...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Redirigiendo al login...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <h1 className="text-2xl font-bold text-gray-900">Family Tracker Dashboard</h1>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">Bienvenido, {user.email}</span>
              <button
                onClick={handleLogout}
                className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 text-sm"
              >
                Cerrar Sesión
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          
          {/* Card: Rutas Seguras */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4 text-gray-900">Rutas Seguras</h2>
            <p className="text-gray-600 mb-4">Gestiona las rutas seguras para tu familia</p>
            <button className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700">
              Crear Nueva Ruta
            </button>
            <div className="mt-4 text-sm text-gray-500">
              📍 0 rutas configuradas
            </div>
          </div>

          {/* Card: Personas Monitoreadas */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4 text-gray-900">Personas</h2>
            <p className="text-gray-600 mb-4">Administra quién puede ser monitoreado</p>
            <button className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700">
              Agregar Persona
            </button>
            <div className="mt-4 text-sm text-gray-500">
              👥 0 personas configuradas
            </div>
          </div>

          {/* Card: Alertas */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4 text-gray-900">Alertas</h2>
            <p className="text-gray-600 mb-4">Historial de notificaciones</p>
            <button className="w-full bg-purple-600 text-white py-2 px-4 rounded-md hover:bg-purple-700">
              Ver Alertas
            </button>
            <div className="mt-4 text-sm text-gray-500">
              🔔 0 alertas recientes
            </div>
          </div>

        </div>

        {/* Estado del Proyecto */}
        <div className="mt-8 bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Estado del Proyecto</h2>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="flex items-center space-x-2">
              <span className="w-3 h-3 bg-green-500 rounded-full"></span>
              <span className="text-sm">Setup inicial ✓</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="w-3 h-3 bg-green-500 rounded-full"></span>
              <span className="text-sm">Autenticación ✓</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="w-3 h-3 bg-orange-500 rounded-full"></span>
              <span className="text-sm">Dashboard con mapas</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="w-3 h-3 bg-gray-300 rounded-full"></span>
              <span className="text-sm">Sistema de tracking</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="w-3 h-3 bg-gray-300 rounded-full"></span>
              <span className="text-sm">Alertas</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}