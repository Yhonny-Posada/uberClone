// store/index.js
import { configureStore, createSlice } from '@reduxjs/toolkit';

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    user: null,
  },
  reducers: {
    setUser: (state, action) => {
      state.user = action.payload;
    },

    updateProfile: (state, action) => {
      state.user = { ...state.user, ...action.payload };
    },

    logout: (state) => {
      state.user = null;
    },
  },
});

const rideSlice = createSlice({
  name: 'ride',
  initialState: {
    origin: null,
    destination: null,
    selectedVehicle: null,
    estimatedFare: null,
    status: 'idle',
    driver: null,
    history: [],
    rideId: null,
  },
  reducers: {
    setOrigin: (state, action) => {
      state.origin = action.payload;
    },

    setDestination: (state, action) => {
      state.destination = action.payload;
    },

    setSelectedVehicle: (state, action) => {
      state.selectedVehicle = action.payload;
    },

    setEstimatedFare: (state, action) => {
      state.estimatedFare = action.payload;
    },

    setRideStatus: (state, action) => {
      state.status = action.payload;
    },

    setDriver: (state, action) => {
      state.driver = action.payload;
    },

    setRideId: (state, action) => {
      state.rideId = action.payload;
    },

    addToHistory: (state, action) => {
      state.history.unshift(action.payload);
    },

    resetRide: (state) => {
      state.origin = null;
      state.destination = null;
      state.selectedVehicle = null;
      state.estimatedFare = null;
      state.status = 'idle';
      state.driver = null;
      state.rideId = null;
    },
  },
});

const paymentSlice = createSlice({
  name: 'payment',
  initialState: {
    selectedMethod: 'cash',
    cards: [],
  },
  reducers: {
    setSelectedMethod: (state, action) => {
      state.selectedMethod = action.payload;
    },

    addCard: (state, action) => {
      state.cards.push(action.payload);
    },

    removeCard: (state, action) => {
      state.cards = state.cards.filter(card => card.id !== action.payload);
    },
  },
});

export const store = configureStore({
  reducer: {
    auth: authSlice.reducer,
    ride: rideSlice.reducer,
    payment: paymentSlice.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
});

export const { setUser, updateProfile, logout } = authSlice.actions;

export const {
  setOrigin,
  setDestination,
  setSelectedVehicle,
  setEstimatedFare,
  setRideStatus,
  setDriver,
  setRideId,
  addToHistory,
  resetRide,
} = rideSlice.actions;

export const { setSelectedMethod, addCard, removeCard } = paymentSlice.actions;