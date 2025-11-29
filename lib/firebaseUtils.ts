// lib/firebaseUtils.ts
import { 
  collection, 
  addDoc, 
  getDocs, 
  query, 
  where, 
  orderBy,
  deleteDoc,
  doc,
  updateDoc
} from 'firebase/firestore';
import { db } from './firebase';

export interface RoutePoint {
  lat: number;
  lng: number;
  name?: string;
}

export interface SafeRoute {
  id?: string;
  name: string;
  userId: string;
  points: RoutePoint[];
  tolerance: number; // metros
  createdAt: Date;
  active: boolean;
}

// Guardar una nueva ruta
export const saveRoute = async (routeData: Omit<SafeRoute, 'id' | 'createdAt'>) => {
  try {
    console.log('🔄 Intentando guardar ruta:', routeData);
    console.log('🔄 Database instance:', db);
    
    // Datos simplificados para test
    const simplifiedData = {
      name: routeData.name,
      userId: routeData.userId,
      points: routeData.points,
      tolerance: routeData.tolerance,
      active: routeData.active,
      createdAt: new Date(),
      timestamp: Date.now() // Backup timestamp
    };
    
    console.log('🔄 Datos a guardar:', simplifiedData);
    
    const docRef = await addDoc(collection(db, 'routes'), simplifiedData);
    
    console.log('✅ Ruta guardada con ID:', docRef.id);
    return docRef.id;
  } catch (error) {
    console.error('❌ Error detallado guardando ruta:', error);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    console.error('❌ Error code:', (error as any)?.code);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    console.error('❌ Error message:', (error as any)?.message);
    throw error;
  }
};

// Obtener rutas de un usuario
export const getUserRoutes = async (userId: string): Promise<SafeRoute[]> => {
  try {
    console.log('🔄 Obteniendo rutas para usuario:', userId);
    
    const routesRef = collection(db, 'routes');
    const q = query(routesRef, where('userId', '==', userId));
    
    const querySnapshot = await getDocs(q);
    const routes: SafeRoute[] = [];
    
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      console.log('📄 Documento encontrado:', doc.id, data);
      
      const route: SafeRoute = {
        id: doc.id,
        name: data.name || 'Sin nombre',
        userId: data.userId || userId,
        points: Array.isArray(data.points) ? data.points : [],
        tolerance: typeof data.tolerance === 'number' ? data.tolerance : 5000,
        createdAt: data.createdAt && data.createdAt.toDate ? data.createdAt.toDate() : new Date(),
        active: typeof data.active === 'boolean' ? data.active : true,
      };
      
      routes.push(route);
    });
    
    routes.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    
    console.log('✅ Rutas obtenidas exitosamente:', routes.length);
    return routes;
    
  } catch (error) {
    console.error('❌ Error obteniendo rutas:', error);
    return [];
  }
};

// Función para verificar si un punto está dentro de la ruta (geofencing básico)
export const isPointInRoute = (
  currentPoint: { lat: number; lng: number },
  route: SafeRoute
): boolean => {
  const tolerance = Math.max(route.tolerance || 20, 200);
  
  console.log(`🔍 Usando tolerancia: ${tolerance}m para ruta ${route.name}`);

  
  for (const routePoint of route.points) {
    const distance = getDistanceInMeters(currentPoint, routePoint);
    if (distance <= tolerance) {
      return true; // Está dentro del área segura
    }
  }
  
  return false; // Fuera de la ruta segura
};

// Calcular distancia entre dos puntos en metros (fórmula Haversine)
export const getDistanceInMeters = (
  point1: { lat: number; lng: number },
  point2: { lat: number; lng: number }
): number => {
  const R = 6371e3; // Radio de la Tierra en metros
  const φ1 = (point1.lat * Math.PI) / 180;
  const φ2 = (point2.lat * Math.PI) / 180;
  const Δφ = ((point2.lat - point1.lat) * Math.PI) / 180;
  const Δλ = ((point2.lng - point1.lng) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // Distancia en metros
};

// Alias para compatibilidad con el tracking
export const calculateDistance = getDistanceInMeters;