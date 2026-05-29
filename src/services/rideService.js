import { Firestore, COLLECTIONS, RIDE_STATUS } from "../firebase/config";

const ridesCollection = Firestore.collection(COLLECTIONS.RIDES);

export const createRide = async (rideData) => {
  if (!rideData.userId || !rideData.origin || !rideData.destination) throw new Error("Faltan datos del viaje");
  return await ridesCollection.add({
    userId: rideData.userId,
    driverId: null,
    origin: rideData.origin,
    destination: rideData.destination,
    distance: rideData.distance || 0,
    duration: rideData.duration || 0,
    price: rideData.price || 0,
    vehicleType: rideData.vehicleType,
    status: RIDE_STATUS.PENDING,
    createdAt: Firestore.FieldValue.serverTimestamp()
  });
};

export const updateRideStatus = async (rideId, RIDE_STATUS) => {
  if (!rideId || !Object.values(STATUS).includes(status)) throw new Error("Estado no permitido");
  return await ridesCollection.doc(rideId).update({ status });
};

export const assignDriver = async (rideId, driverId) => {
  if (!rideId || !driverId) throw newError("Datos incompletos");
  return await ridesCollection.doc(rideId).update({ driverId, status: RIDE_STATUS.ACCEPTED });
};

export const getUserRideHistory = async (userId) => {
  if (!userId) return [];
  try {
    const snapshot = await ridesCollection.where("userId", "==", userId).orderBy("createdAt", "desc").get();
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (e) {
    console.error("Error cargando historial:", e);
    return [];
  }
};

export const subscribeToRideUpdates = (rideId, callback) => {
  if (!rideId) return () => {};
  return ridesCollection.doc(rideId).onSnapshot(doc => {
    callback(doc.exists ? {id: doc.id, ...doc.data()} : null);
  }, (error) => {
    console.error("Error en suscripción:", error);
    callback(null);
  });
};