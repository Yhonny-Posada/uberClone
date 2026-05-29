// src/constants/firebase.js

export const COLLECTIONS = {
  USERS: "users",
  DRIVERS: "drivers",
  RIDES: "rides",
  PAYMENTS: "payments",
  LOCATIONS: "locations"
};

export const RIDE_STATUS = {
  PENDING: "pending",
  SEARCHING: "searching",
  ACCEPTED: "accepted",
  IN_PROGRESS: "in_progress",
  COMPLETED: "completed",
  CANCELLED: "cancelled"
};

export const PAYMENT_STATUS = {
  PENDING: "pending",
  COMPLETED: "completed",
  FAILED: "failed",
  REFUNDED: "refunded"
};

export const VEHICLE_TYPES = {
  ECONOMICO: "economico",
  XL: "xl",
  PREMIUM: "premium"
};

export const LANGUAGES = {
  ES: "es",
  EN: "en"
};

export const PAYMENT_METHODS = {
  CASH: "cash",
  CARD: "card",
  TRANSFER: "transfer"
};