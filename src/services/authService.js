import { auth } from "../firebase/config";
import { createUser } from "./userService";
import { createDriver } from "./driverServices";

export const registerUser = async (email, password, userData) => {
  try {
    const userCredential = await auth().createUserWithEmailAndPassword(email, password);
    const uid = userCredential.user.uid;
    await createUser(uid, userData);
    return userCredential;
  } catch (error) {
    throw error;
  }
};

export const registerDriver = async (email, password, driverData) => {
  try {
    const userCredential = await auth().createUserWithEmailAndPassword(email, password);
    const uid = userCredential.user.uid;
    await createDriver(uid, driverData);
    return userCredential;
  } catch (error) {
    throw error;
  }
};

export const login = async (email, password) => {
  return await auth().signInWithEmailAndPassword(email, password);
};

export const logout = async () => {
  return await auth().signOut();
};

export const getCurrentUser = () => {
  return auth().currentUser;
};