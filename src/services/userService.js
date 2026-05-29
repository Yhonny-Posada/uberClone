// src/services/userService.js
import { Auth, Firestore, Storage } from "../firebase/config"; 
import { COLLECTIONS, LANGUAGES } from "../constants/firebase";

const usersCollection = Firestore.collection(COLLECTIONS.USERS); 


export const createUser = async (uid, userData) => {
  if (!uid || !userData) throw new Error("ID y datos obligatorios");
  
  if (!userData.fullName || userData.fullName.trim() === "" || userData.fullName.length > 50) {
    throw new Error("El nombre es obligatorio y máximo 50 caracteres");
  }
  if (!userData.phone || !/^\d{10}$/.test(userData.phone)) {
    throw new Error("El celular debe ser numérico y obligatorio");
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!userData.email || !emailRegex.test(userData.email)) {
    throw new Error("Correo inválido (debe tener @ y dominio)");
  }
  if (!userData.language || !Object.values(LANGUAGES).includes(userData.language)) {
    userData.language = LANGUAGES.ES;
  }
  if (!userData.profileImage) userData.profileImage = "";

  return await usersCollection.doc(uid).set({
    ...userData,
    createdAt: Firestore.FieldValue.serverTimestamp(),
    role: "user",
    gender: userData.gender || ""
  });
};

export const getUser = async (uid) => {
  if (!uid) throw new Error("UID obligatorio");
  const doc = await usersCollection.doc(uid).get();
  return doc.exists ? { id: doc.id, ...doc.data() } : null;
};

export const updateUser = async (uid, updateData) => {
  if (!uid) throw new Error("UID obligatorio");
  return await usersCollection.doc(uid).update({
    ...updateData,
    updatedAt: Firestore.FieldValue.serverTimestamp()
  });
};