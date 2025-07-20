// src/app/page.tsx
'use client';

import Link from 'next/link';
import { useAuth } from '../../lib/useAuth';

export default function Home() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Cargando...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Family Tracker
        </h1>
        <p className="text-lg text-gray-600 mb-8">
          Sistema de seguimiento familiar con rutas seguras
        </p>
        
        {user ? (
          <div className="space-y-4">
            <p className="text-green-600">¡Bienvenido! Estás autenticado como: {user.email}</p>
            <Link 
              href="/dashboard"
              className="inline-block bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700"
            >
              Ir al Dashboard
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-gray-600">Inicia sesión para gestionar las rutas seguras de tu familia</p>
            <Link 
              href="/login"
              className="inline-block bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700"
            >
              Iniciar Sesión
            </Link>
          </div>
        )}
        
        <div className="bg-white rounded-lg shadow-md p-6 max-w-md mx-auto mt-8">
          <h2 className="text-xl font-semibold mb-4">Estado del Proyecto</h2>
          <div className="space-y-2 text-left">
            <div className="flex items-center">
              <span className="w-3 h-3 bg-green-500 rounded-full mr-2"></span>
              <span>Paso 1: Setup inicial ✓</span>
            </div>
            <div className="flex items-center">
              <span className="w-3 h-3 bg-orange-500 rounded-full mr-2"></span>
              <span>Paso 2: Autenticación (en progreso)</span>
            </div>
            <div className="flex items-center">
              <span className="w-3 h-3 bg-gray-300 rounded-full mr-2"></span>
              <span>Paso 3: Dashboard con mapas</span>
            </div>
            <div className="flex items-center">
              <span className="w-3 h-3 bg-gray-300 rounded-full mr-2"></span>
              <span>Paso 4: Sistema de tracking</span>
            </div>
            <div className="flex items-center">
              <span className="w-3 h-3 bg-gray-300 rounded-full mr-2"></span>
              <span>Paso 5: Alertas</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}