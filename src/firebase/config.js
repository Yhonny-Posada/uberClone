// src/firebase/config.js
import app from '@react-native-firebase/app';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import storage from '@react-native-firebase/storage';

const firebaseApp = app();

export const Firestore = firestore();
export const Auth = auth();
export const Storage = storage();

export default firebaseApp;