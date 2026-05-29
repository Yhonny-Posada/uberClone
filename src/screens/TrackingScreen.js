import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useDispatch, useSelector } from 'react-redux';
import { setRideStatus, resetRide } from '../store';
import { subscribeToRideUpdates, updateRideStatus } from '../services/rideService';
import { COLORS } from '../constants/colors';
import MapView, { Marker } from 'react-native-maps';

const TrackingScreen = ({ navigation }) => {
  const dispatch = useDispatch();
  const ride = useSelector(state => state.ride);

  const [status, setStatus] = useState(ride.status || 'pending');
  const [driver, setDriverLocal] = useState(ride?.driver || null);
  const [eta, setEta] = useState(ride?.eta || null);
  const [rating, setRating] = useState(0);
  const [loading, setLoading] = useState(true);
  const [region, setRegion] = useState(null);
  const [driverPosition, setDriverPosition] = useState(null);

  useEffect(() => {
    if (!ride?.rideId) {
      setLoading(false);
      return;
    }

    const unsubscribe = subscribeToRideUpdates(ride.rideId, (doc) => {
      if (doc) {
        const newStatus = doc.status || 'pending';
        setStatus(newStatus);
        setDriverLocal(doc?.driver || ride?.driver || null);
        setEta(doc?.eta || ride?.eta || null);

        if (doc?.driver?.lat && doc?.driver?.lng) {
          setDriverPosition({
            latitude: doc.driver.lat,
            longitude: doc.driver.lng
          });
        }

        dispatch(setRideStatus(newStatus));
      }
      setLoading(false);
    });

    return () => {
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, [ride?.rideId, ride?.driver, ride?.eta, dispatch]);

  const handleCancel = async () => {
    Alert.alert(
      'Cancelar viaje',
      '¿Estás seguro que quieres cancelar este viaje?',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Sí, cancelar',
          style: 'destructive',
          onPress: async () => {
            if (ride?.rideId) {
              await updateRideStatus(ride.rideId, 'cancelled');
            }
            dispatch(resetRide());
            navigation?.navigate('Home');
          },
        },
      ]
    );
  };

  useEffect(() => {
    if (ride?.origin?.lat && ride?.origin?.lng) {
      setRegion({
        latitude: ride.origin.lat,
        longitude: ride.origin.lng,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      });
    }
  }, [ride?.origin]);

  const handleFinish = async () => {
    if (ride?.rideId) {
      await updateRideStatus(ride.rideId, 'completed', { rating: rating });
    }
    dispatch(resetRide());
    navigation?.navigate('History');
  };

  const statusLabel = () => {
    if (loading) return 'Cargando estado...';
    switch (status) {
      case 'pending':
        return 'Viaje pendiente';
      case 'accepted':
        return eta ? `Conductor en camino · ${eta} min` : 'Conductor en camino';
      case 'in_progress':
        return 'Viaje en curso';
      case 'completed':
        return '¡Llegaste a tu destino!';
      case 'cancelled':
        return 'Viaje cancelado';
      default:
        return 'Estado del viaje';
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.mapContainer}>
        <Text style={styles.mapTitle}>🗺️ Seguimiento del viaje</Text>

        {region ? (
          <MapView
            style={styles.map}
            region={region}
            showsUserLocation={true}
            followsUserLocation={status === 'accepted' || status === 'in_progress'}
          >

            {ride?.origin && (
              <Marker
                coordinate={{ latitude: ride.origin.lat, longitude: ride.origin.lng }}
                title="Origen"
              >
                <Text>📍</Text>
              </Marker>
            )}

            {ride?.destination && (
              <Marker
                coordinate={{ latitude: ride.destination.lat, longitude: ride.destination.lng }}
                title="Destino"
              >
                <Text>🏁</Text>
              </Marker>
            )}

            {driverPosition && (status === 'accepted' || status === 'in_progress') && (
              <Marker
                coordinate={driverPosition}
                title="Conductor"
              >
                <Text>🚗</Text>
              </Marker>
            )}

          </MapView>
        ) : (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={COLORS.primary} />
          </View>
        )}

        <View style={styles.markersContainer}>
          <View style={styles.originMarker}>
            <Text style={styles.markerText}>📍 {ride?.origin?.name || 'Origen'}</Text>
          </View>
          <View style={styles.destMarker}>
            <Text style={styles.markerText}>🏁 {ride?.destination?.name || 'Destino'}</Text>
          </View>
        </View>
      </View>

      <View style={styles.panel}>
        <View style={styles.statusRow}>
          <View
            style={[
              styles.statusDot,
              { backgroundColor: status === 'pending' ? COLORS.gray : COLORS.green },
            ]}
          />
          <Text style={styles.statusText}>{statusLabel()}</Text>
        </View>

        {driver ? (
          <View style={styles.driverCard}>
            <View style={styles.driverAvatar}>
              <Text style={styles.driverAvatarText}>👨</Text>
            </View>
            <View style={styles.driverInfo}>
              <Text style={styles.driverName}>{driver?.name || 'Conductor'}</Text>
              <Text style={styles.driverVehicle}>{driver?.vehicle || 'Vehículo asignado'}</Text>
              {driver?.rating != null && <Text style={styles.driverRating}>⭐ {driver.rating}</Text>}
            </View>
          </View>
        ) : (
          <View style={styles.driverCard}>
            <Text style={styles.noDriverText}>No hay conductor asignado aún.</Text>
          </View>
        )}

        {ride?.estimatedFare != null && status !== 'completed' && (
          <View style={styles.fareRow}>
            <Text style={styles.fareLabel}>Tarifa estimada:</Text>
            <Text style={styles.fareValue}>${ride.estimatedFare.toLocaleString('es-CO')} COP</Text>
          </View>
        )}

        {status === 'completed' && (
          <View style={styles.ratingContainer}>
            <Text style={styles.ratingTitle}>Califica tu viaje</Text>
            <View style={styles.starsRow}>
              {[1, 2, 3, 4, 5].map((star) => (
                <TouchableOpacity key={star} onPress={() => setRating(star)}>
                  <Text style={[styles.star, star <= rating && styles.starFilled]}>{'★'}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity
              style={[styles.finishBtn, rating === 0 && styles.finishBtnDisabled]}
              onPress={handleFinish}
              disabled={rating === 0}
            >
              <Text style={styles.finishBtnText}>Finalizar</Text>
            </TouchableOpacity>
          </View>
        )}

        {(status === 'pending' || status === 'accepted') && (
          <TouchableOpacity style={styles.cancelBtn} onPress={handleCancel}>
            <Text style={styles.cancelBtnText}>Cancelar viaje</Text>
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
};

export default TrackingScreen;

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.primary },
  mapContainer: {
    flex: 1,
    backgroundColor: '#466086',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  mapTitle: { color: COLORS.white, fontSize: 16, fontWeight: 'bold', marginTop: 10, position: 'absolute', top: 10, zIndex: 1 },
  map: { ...StyleSheet.absoluteFillObject, borderRadius: 12 },
  markersContainer: { position: 'absolute', bottom: 20, left: 20, zIndex: 1 },
  originMarker: { marginBottom: 8, backgroundColor: 'rgba(0,0,0,0.5)', padding: 4, borderRadius: 4 },
  destMarker: { backgroundColor: 'rgba(0,0,0,0.5)', padding: 4, borderRadius: 4 },
  markerText: { color: COLORS.white, fontSize: 12 },
  panel: { backgroundColor: COLORS.darkGray, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 16, paddingBottom: 32 },
  statusRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  statusDot: { width: 12, height: 12, borderRadius: 6, marginRight: 10 },
  statusText: { color: COLORS.white, fontSize: 16, fontWeight: 'bold' },
  driverCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.cardBg, borderRadius: 12, padding: 12, marginBottom: 12 },
  driverAvatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: COLORS.lightGray, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  driverAvatarText: { fontSize: 24 },
  driverInfo: { flex: 1 },
  driverName: { color: COLORS.white, fontSize: 15, fontWeight: 'bold' },
  driverVehicle: { color: COLORS.gray, fontSize: 12, marginTop: 2 },
  driverRating: { color: COLORS.gray, fontSize: 12, marginTop: 2 },
  noDriverText: { color: COLORS.gray, fontSize: 14 },
  fareRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderTopWidth: 1, borderTopColor: COLORS.lightGray },
  fareLabel: { color: COLORS.gray, fontSize: 14 },
  fareValue: { color: COLORS.white, fontSize: 18, fontWeight: 'bold' },
  ratingContainer: { alignItems: 'center', paddingVertical: 8 },
  ratingTitle: { color: COLORS.white, fontSize: 16, fontWeight: 'bold', marginBottom: 12 },
  starsRow: { flexDirection: 'row', marginBottom: 16 },
  star: { fontSize: 36, color: COLORS.lightGray, marginRight: 8 },
  starFilled: { color: '#FFD700' },
  finishBtn: { backgroundColor: COLORS.green, borderRadius: 30, paddingVertical: 14, paddingHorizontal: 40 },
  finishBtnDisabled: { opacity: 0.4 },
  finishBtnText: { color: COLORS.primary, fontSize: 16, fontWeight: 'bold' },
  cancelBtn: { alignItems: 'center', paddingVertical: 14 },
  cancelBtnText: { color: COLORS.red, fontSize: 15 },
  loadingContainer: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center' },
});