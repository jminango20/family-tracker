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
    const docRef = await addDoc(collection(db, 'routes'), {
      ...routeData,
      createdAt: new Date(),
    });
    
    console.log('Ruta guardada con ID:', docRef.id);
    return docRef.id;
  } catch (error) {
    console.error('Error guardando ruta:', error);
    throw error;
  }
};

// Obtener rutas de un usuario
export const getUserRoutes = async (userId: string): Promise<SafeRoute[]> => {
  try {
    const q = query(
      collection(db, 'routes'),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    const routes: SafeRoute[] = [];
    
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      routes.push({
        id: doc.id,
        name: data.name,
        userId: data.userId,
        points: data.points,
        tolerance: data.tolerance,
        createdAt: data.createdAt.toDate(),
        active: data.active,
      });
    });
    
    return routes;
  } catch (error) {
    console.error('Error obteniendo rutas:', error);
    throw error;
  }
};

// Función para verificar si un punto está dentro de la ruta (geofencing básico)
export const isPointInRoute = (
  currentPoint: { lat: number; lng: number },
  route: SafeRoute
): boolean => {
  const tolerance = route.tolerance || 20; // metros por defecto
  
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