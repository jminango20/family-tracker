// src/app/page.tsx
export default function Home() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Family Tracker
        </h1>
        <p className="text-lg text-gray-600 mb-8">
          Sistema de seguimiento familiar con rutas seguras
        </p>
        
        <div className="bg-white rounded-lg shadow-md p-6 max-w-md mx-auto">
          <h2 className="text-xl font-semibold mb-4">Estado del Proyecto</h2>
          <div className="space-y-2 text-left">
            <div className="flex items-center">
              <span className="w-3 h-3 bg-green-500 rounded-full mr-2"></span>
              <span>Paso 1: Setup inicial ✓</span>
            </div>
            <div className="flex items-center">
              <span className="w-3 h-3 bg-gray-300 rounded-full mr-2"></span>
              <span>Paso 2: Autenticación</span>
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