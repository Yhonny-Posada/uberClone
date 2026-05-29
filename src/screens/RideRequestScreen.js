import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, FlatList, ActivityIndicator, PermissionsAndroid, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MapView, { Marker, Polyline } from 'react-native-maps';
import { useDispatch, useSelector } from 'react-redux';
import { setOrigin, setDestination, setSelectedVehicle, setEstimatedFare, setRideStatus, setRideId } from '../store';
import { createRide } from '../services/rideService';
import { GOOGLE_MAPS_API_KEY } from '../constants/config'; 
import { COLORS } from '../constants/colors';

const VEHICLES = [
  { id: 'economic', name: 'Económico', icon: '🚗', seats: '4 pasajeros', price: 12000 },
  { id: 'xl', name: 'XL', icon: '🚐', seats: '6 pasajeros', price: 18000 },
  { id: 'premium', name: 'Premium', icon: '🚘', seats: 'Lujo · 4 pas.', price: 25000 },
];

const RideRequestScreen = ({ navigation }) => {
  const dispatch = useDispatch();
  const ride = useSelector(state => state.ride);
  const user = useSelector(state => state.auth.user);

  const [originText, setOriginText] = useState(ride.origin?.name || '');
  const [destinationText, setDestinationText] = useState(ride.destination?.name || '');
  const [showVehicles, setShowVehicles] = useState(false);
  const [originCoords, setOriginCoords] = useState(null);
  const [destinationCoords, setDestinationCoords] = useState(null);
  const [region, setRegion] = useState(null);
  const [places, setPlaces] = useState([]);
  const [loadingPlaces, setLoadingPlaces] = useState(false);
  const [routeCoords, setRouteCoords] = useState([]);
  const [loadingRoute, setLoadingRoute] = useState(false);

  useEffect(() => {
    if (originCoords && destinationCoords) {
      fetchRoute(originCoords, destinationCoords);
      setShowVehicles(true);
    } else {
      setShowVehicles(false);
      setRouteCoords([]);
    }
  }, [originCoords, destinationCoords]);

  const requestLocationPermission = async () => {
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          {
            title: "Permiso de Ubicación",
            message: "Necesitamos acceder a tu ubicación",
            buttonPositive: "Aceptar"
          }
        );
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      } catch (err) {
        console.warn(err);
        return false;
      }
    } else {
      return true;
    }
  };

  useEffect(() => {
    (async () => {
      const hasPermission = await requestLocationPermission();
      if (!hasPermission) return;

      try {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            const { latitude, longitude } = pos.coords;
            setRegion({ latitude, longitude, latitudeDelta: 0.01, longitudeDelta: 0.01 });
            setOriginCoords({ latitude, longitude });
          },
          (err) => {
            Alert.alert("Error", "No se pudo obtener tu ubicación");
          },
          { enableHighAccuracy: true, timeout: 10000, maximumAge: 10000 }
        );
      } catch {}
    })();
  }, []);

  const fetchPlaces = async (input, setResults) => {
    if (!input || input.length < 3) {
      setResults([]);
      return;
    }
    setLoadingPlaces(true);
    try {
      const res = await fetch(
        `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(input)}&key=${GOOGLE_MAPS_API_KEY}&language=es&components=country:co`
      );
      const data = await res.json();
      if (data.status === "OK") {
        setResults(data.predictions || []);
      } else {
        console.warn("Error API:", data.status);
        setResults([]);
      }
    } catch (e) {
      console.error("Error buscando lugares:", e);
      setResults([]);
    }
    setLoadingPlaces(false);
  };

  const fetchPlaceDetails = async (placeId, setCoords, setText) => {
    try {
      const res = await fetch(
        `https://maps.googleapis.com/maps/api/place/details/json?placeid=${placeId}&key=${GOOGLE_MAPS_API_KEY}`
      );
      const data = await res.json();
      if (data.status === "OK") {
        const loc = data.result.geometry.location;
        setCoords({ latitude: loc.lat, longitude: loc.lng });
        setText(data.result.name);
      }
    } catch (e) {
      console.error("Error detalle lugar:", e);
    }
  };

  const fetchRoute = async (origin, destination) => {
    setLoadingRoute(true);
    try {
      const res = await fetch(
        `https://maps.googleapis.com/maps/api/directions/json?origin=${origin.latitude},${origin.longitude}&destination=${destination.latitude},${destination.longitude}&key=${GOOGLE_MAPS_API_KEY}`
      );
      const data = await res.json();
      if (data.routes && data.routes.length > 0) {
        const points = decodePolyline(data.routes[0].overview_polyline.points);
        setRouteCoords(points);
      } else {
        setRouteCoords([]);
      }
    } catch (e) {
      setRouteCoords([]);
    }
    setLoadingRoute(false);
  };

  function decodePolyline(encoded) {
    let points = [];
    let index = 0, len = encoded.length;
    let lat = 0, lng = 0;
    while (index < len) {
      let b, shift = 0, result = 0;
      do {
        b = encoded.charCodeAt(index++) - 63;
        result |= (b & 0x1f) << shift;
        shift += 5;
      } while (b >= 0x20);
      let dlat = ((result & 1) ? ~(result >> 1) : (result >> 1));
      lat += dlat;
      shift = 0;
      result = 0;
      do {
        b = encoded.charCodeAt(index++) - 63;
        result |= (b & 0x1f) << shift;
        shift += 5;
      } while (b >= 0x20);
      let dlng = ((result & 1) ? ~(result >> 1) : (result >> 1));
      lng += dlng;
      points.push({ latitude: lat / 1e5, longitude: lng / 1e5 });
    }
    return points;
  }

  const handleSelectVehicle = (vehicleId) => {
    dispatch(setSelectedVehicle(vehicleId));
    const vehicle = VEHICLES.find(v => v.id === vehicleId);
    dispatch(setEstimatedFare(vehicle.price));
  };

  const handleRequestRide = async () => {
    if (!originText.trim() || !destinationText.trim()) {
      Alert.alert('Aviso', 'Debes escribir origen y destino.');
      return;
    }
    if (!ride.selectedVehicle) {
      Alert.alert('Aviso', 'Por favor selecciona un tipo de vehículo.');
      return;
    }
    if (!user?.uid) {
      Alert.alert('Aviso', 'Debes iniciar sesión para solicitar un viaje.');
      return;
    }

    try {
      dispatch(setRideStatus('pending'));
      const rideRef = await createRide({
        userId: user.uid,
        origin: { name: originText.trim(), ...originCoords },
        destination: { name: destinationText.trim(), ...destinationCoords },
        vehicleType: ride.selectedVehicle,
        price: ride.estimatedFare,
      });
      dispatch(setRideId(rideRef.id));
      navigation?.navigate('Tracking');
    } catch (error) {
      dispatch(setRideStatus('idle'));
      Alert.alert('Error', error.message || 'No se pudo solicitar el viaje.');
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.mapContainer}>
        {region ? (
          <MapView
            style={styles.map}
            region={region}
            showsUserLocation
            showsMyLocationButton
          >
            {originCoords && <Marker coordinate={originCoords} title="Origen" />}
            {destinationCoords && <Marker coordinate={destinationCoords} title="Destino" />}
            {routeCoords.length > 0 && <Polyline coordinates={routeCoords} strokeWidth={4} strokeColor="#2196F3" />}
          </MapView>
        ) : (
          <ActivityIndicator size="large" color={COLORS.green} style={{ flex: 1 }} />
        )}
      </View>

      <View style={styles.panel}>
        <Text style={styles.panelTitle}>¿A dónde vas?</Text>

        <Text style={styles.fieldLabel}>Origen</Text>
        <TextInput
          style={styles.searchInput}
          value={originText}
          onChangeText={(text) => {
            setOriginText(text);
            fetchPlaces(text, setPlaces);
          }}
          placeholder="Escribe origen..."
          placeholderTextColor={COLORS.gray}
        />
        {loadingPlaces && <ActivityIndicator size="small" color={COLORS.green} />}
        {places.length > 0 && originText && (
          <FlatList
            data={places}
            keyExtractor={item => item.place_id}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.placeItem}
                onPress={() => {
                  fetchPlaceDetails(item.place_id, setOriginCoords, setOriginText);
                  setPlaces([]);
                }}
              >
                <Text style={styles.placeText}>{item.description}</Text>
              </TouchableOpacity>
            )}
            style={styles.placesList}
          />
        )}

        <Text style={styles.fieldLabel}>Destino</Text>
        <TextInput
          style={styles.searchInput}
          value={destinationText}
          onChangeText={(text) => {
            setDestinationText(text);
            fetchPlaces(text, setPlaces);
          }}
          placeholder="Escribe destino..."
          placeholderTextColor={COLORS.gray}
        />
        {loadingPlaces && <ActivityIndicator size="small" color={COLORS.green} />}
        {places.length > 0 && destinationText && (
          <FlatList
            data={places}
            keyExtractor={item => item.place_id}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.placeItem}
                onPress={() => {
                  fetchPlaceDetails(item.place_id, setDestinationCoords, setDestinationText);
                  setPlaces([]);
                }}
              >
                <Text style={styles.placeText}>{item.description}</Text>
              </TouchableOpacity>
            )}
            style={styles.placesList}
          />
        )}

        {showVehicles && (
          <View>
            <Text style={styles.vehicleTitle}>Selecciona tu vehículo</Text>
            {VEHICLES.map(vehicle => (
              <TouchableOpacity
                key={vehicle.id}
                style={[
                  styles.vehicleCard,
                  ride.selectedVehicle === vehicle.id && styles.vehicleCardSelected,
                ]}
                onPress={() => handleSelectVehicle(vehicle.id)}
              >
                <Text style={styles.vehicleIcon}>{vehicle.icon}</Text>
                <View style={styles.vehicleInfo}>
                  <Text style={styles.vehicleName}>{vehicle.name}</Text>
                  <Text style={styles.vehicleSeats}>{vehicle.seats}</Text>
                </View>
                <Text style={styles.vehiclePrice}>
                  ${vehicle.price.toLocaleString('es-CO')}
                </Text>
              </TouchableOpacity>
            ))}

            <TouchableOpacity
              style={[styles.requestBtn, !ride.selectedVehicle && styles.requestBtnDisabled]}
              onPress={handleRequestRide}
              disabled={!ride.selectedVehicle}
            >
              <Text style={styles.requestBtnText}>Solicitar viaje</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
};

export default RideRequestScreen;

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.primary },
  mapContainer: { height: 260, width: '100%', backgroundColor: '#0D1117' },
  map: { flex: 1, width: '100%', height: '100%' },
  placesList: { maxHeight: 120, backgroundColor: COLORS.inputBg, borderRadius: 8, marginBottom: 8 },
  placeItem: { padding: 12, borderBottomWidth: 1, borderBottomColor: COLORS.lightGray },
  placeText: { color: COLORS.gray, fontSize: 14 },
  panel: { backgroundColor: COLORS.darkGray, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 16, paddingBottom: 32 },
  panelTitle: { color: COLORS.white, fontSize: 18, fontWeight: 'bold', marginBottom: 12 },
  fieldLabel: { color: COLORS.gray, fontSize: 13, marginBottom: 4, marginTop: 8 },
  searchInput: { backgroundColor: COLORS.inputBg, borderRadius: 10, borderWidth: 1, borderColor: COLORS.green, paddingHorizontal: 14, paddingVertical: 10, color: COLORS.white, fontSize: 14, marginBottom: 8 },
  vehicleTitle: { color: COLORS.white, fontSize: 16, fontWeight: 'bold', marginTop: 12, marginBottom: 8 },
  vehicleCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.cardBg, borderRadius: 10, padding: 12, marginBottom: 8, borderWidth: 1.5, borderColor: COLORS.lightGray },
  vehicleCardSelected: { borderColor: COLORS.green, backgroundColor: '#001a00' },
  vehicleIcon: { fontSize: 26, marginRight: 12 },
  vehicleInfo: { flex: 1 },
  vehicleName: { color: COLORS.white, fontSize: 15, fontWeight: 'bold' },
  vehicleSeats: { color: COLORS.gray, fontSize: 12, marginTop: 2 },
  vehiclePrice: { color: COLORS.white, fontSize: 15, fontWeight: 'bold' },
  requestBtn: { backgroundColor: COLORS.green, borderRadius: 30, paddingVertical: 16, alignItems: 'center', marginTop: 8 },
  requestBtnDisabled: { opacity: 0.4 },
  requestBtnText: { color: COLORS.primary, fontSize: 16, fontWeight: 'bold' },
});