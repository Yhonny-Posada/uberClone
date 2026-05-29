// src/services/driverService.js
import { Firestore } from "../firebase/config"; 
import { COLLECTIONS, VEHICLE_TYPES } from "../constants/firebase";

const driversCollection = Firestore.collection(COLLECTIONS.DRIVERS);

export const createDriver = async (uid, data) => {
  if (!uid || !data) throw new Error("Datos incompletos");
  if (!data.fullName || data.fullName.length > 50) throw new Error("Nombre inválido");
  if (!data.phone || !/^\d{10}$/.test(data.phone)) throw new Error("Celular inválido");
  if (!data.vehicleType || !Object.values(VEHICLE_TYPES).includes(data.vehicleType)) throw new Error("Tipo de vehículo inválido");
  if (!data.licensePlate || data.licensePlate.trim() === "") throw new Error("Placa obligatoria");

  return await driversCollection.doc(uid).set({
    ...data,
    isAvailable: true,
    role: "driver",
    createdAt: Firestore.FieldValue.serverTimestamp(),
    location: new Firestore.GeoPoint(0, 0)
  });
};

export const updateDriverLocation = async (uid, lat, lng) => {
  if (!uid || lat === undefined || lng === undefined) throw new Error("Datos incompletos");
  return await driversCollection.doc(uid).update({
    location: new Firestore.GeoPoint(lat, lng),
    lastUpdate: Firestore.FieldValue.serverTimestamp()
  });
};

export const setAvailability = async (uid, value) => {
  if (!uid || typeof value !== "boolean") throw new Error("Valor inválido");
  return await driversCollection.doc(uid).update({ isAvailable: value });
};

export const getAvailableDrivers = async (vehicleType) => {
  if (!vehicleType) throw new Error("Tipo requerido");
  const snapshot = await driversCollection
    .where("isAvailable", "==", true)
    .where("vehicleType", "==", vehicleType)
    .limit(10)
    .get();
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

export const getDriver = async (uid) => {
  const doc = await driversCollection.doc(uid).get();
  return doc.exists ? { id: doc.id, ...doc.data() } : null;
};

export const updateDriver = async (uid, updateData) => {
  if (!uid) throw new Error("ID obligatorio");
  return await driversCollection.doc(uid).update({
    ...updateData,
    updatedAt: Firestore.FieldValue.serverTimestamp()
  });
};