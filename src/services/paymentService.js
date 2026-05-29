import { Firestore, COLLECTIONS, PAYMENT_STATUS } from "../firebase/config";

const paymentsCollection = Firestore.collection(COLLECTIONS.PAYMENTS);

export const createPayment = async (data) => {
  if (!data.rideId || !data.userId || !data.amount) throw new Error("Datos de pago incompletos");
  return await paymentsCollection.add({
    ...data,
    status: PAYMENT_STATUS.PENDING,
    createdAt: Firestore.FieldValue.serverTimestamp()
  });
};

export const updatePaymentStatus = async (id, status) => {
  if (!id || !Object.values(PAYMENT_STATUS).includes(status)) throw new Error("Estado inválido");
  return await paymentsCollection.doc(id).update({ status });
};

export const getPaymentByRideId = async (rideId) => {
  if (!rideId) return null;
  try {
    const snapshot = await paymentsCollection.where("rideId", "==", rideId).limit(1).get();
    return snapshot.empty ? null : { id: snapshot.docs[0].id, ...snapshot.docs[0].data() };
  } catch (e) {
    console.error("Error obteniendo pago:", e);
    return null;
  }
};