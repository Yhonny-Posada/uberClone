// screens/HistoryScreen.js

import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Modal, ScrollView} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSelector } from 'react-redux';

import { getUserRideHistory } from '../services/rideService';
import { getDriver } from '../services/driverService';
import { getPaymentByRideId } from '../services/paymentService';
import { COLORS } from '../constants/colors';
import { LANGUAGES, PAYMENT_STATUS, VEHICLE_TYPES } from '../firebase/config';

const VEHICLE_NAMES = {
  [VEHICLE_TYPES.ECONOMICO]: 'Económico 🚗',
  [VEHICLE_TYPES.XL]: 'XL 🚐',
  [VEHICLE_TYPES.PREMIUM]: 'Premium 🚘',
};

const TEXTS = {
  [LANGUAGES.ES]: {
    title: 'Historial de viajes',
    completed: 'Completados',
    pending: 'Pendientes',
    cancelled: 'Cancelados',
    totalRides: 'Viajes',
    totalSpent: 'Total gastado',
    noRides: 'Sin viajes aún',
    loading: 'Cargando historial...',
    error: 'Ocurrió un error al cargar',
    route: 'RUTA',
    vehicle: 'VEHÍCULO',
    driver: 'CONDUCTOR',
    paymentStatus: 'ESTADO DE PAGO',
    duration: 'Duración',
    distance: 'Distancia',
    total: 'Total',
    method: 'Método',
    completedPayment: 'Pagado',
    pendingPayment: 'Pendiente',
    failedPayment: 'Fallido',
    close: 'Cerrar',
    from: 'De',
    to: 'Hasta',
  },
  [LANGUAGES.EN]: {
    title: 'Ride History',
    completed: 'Completed',
    pending: 'Pending',
    cancelled: 'Cancelled',
    totalRides: 'Rides',
    totalSpent: 'Total spent',
    noRides: 'No rides yet',
    loading: 'Loading history...',
    error: 'Error loading history',
    route: 'ROUTE',
    vehicle: 'VEHICLE',
    driver: 'DRIVER',
    paymentStatus: 'PAYMENT STATUS',
    duration: 'Duration',
    distance: 'Distance',
    total: 'Total',
    method: 'Method',
    completedPayment: 'Paid',
    pendingPayment: 'Pending',
    failedPayment: 'Failed',
    close: 'Close',
    from: 'From',
    to: 'To',
  }
};

const formatDate = (value, lang = LANGUAGES.ES) => {
  if (!value) return '-';
  const date = value.toDate ? value.toDate() : new Date(value);
  const options = {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  };
  return date.toLocaleDateString(lang === LANGUAGES.ES ? 'es-CO' : 'en-US', options);
};

const formatDistance = (distance) => {
  if (!distance && distance !== 0) return '-';
  const km = distance > 1000 ? (distance / 1000).toFixed(1) : distance;
  return `${km} ${distance > 1000 ? 'km' : 'm'}`;
};

const formatDuration = (duration) => {
  if (!duration && duration !== 0) return '-';
  const min = duration > 60 ? Math.round(duration / 60) : duration;
  return `${min} min`;
};

const HistoryScreen = ({ navigation }) => {
  const user = useSelector(state => state.auth.user);
  const currentLang = user?.language || LANGUAGES.ES;
  const t = TEXTS[currentLang];

  const [rideHistory, setRideHistory] = useState([]);
  const [filteredRides, setFilteredRides] = useState([]);
  const [selectedRide, setSelectedRide] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('all'); // all, completed, pending, cancelled

  const loadHistory = useCallback(async () => {
    let isMounted = true;
    if (!user?.uid) {
      if (isMounted) {
        setRideHistory([]);
        setFilteredRides([]);
        setLoading(false);
      }
      return;
    }

    setLoading(true);
    setError(null);

    try {

      const history = await getUserRideHistory(user.uid);
      
      const validHistory = history.filter(ride => 
        ride && 
        ride.origin?.name && 
        ride.destination?.name && 
        ride.createdAt
      );

      if (isMounted) {
        setRideHistory(validHistory);
        setFilteredRides(validHistory);
      }
    } catch (err) {
      if (isMounted) {
        setError(err.message || t.error);
        setRideHistory([]);
        setFilteredRides([]);
      }
    } finally {
      if (isMounted) setLoading(false);
    }

    return () => { isMounted = false };
  }, [user?.uid, t.error]);

  useEffect(() => {
    if (activeTab === 'all') {
      setFilteredRides(rideHistory);
    } else {
      const filtered = rideHistory.filter(ride => ride.status === activeTab);
      setFilteredRides(filtered);
    }
  }, [activeTab, rideHistory]);

  const handlePressRide = async (item) => {
    try {

      const paymentData = await getPaymentByRideId(item.id);
      
      let driverData = null;
      if (item.driverId) {
        driverData = await getDriver(item.driverId);
      }

      setSelectedRide({
        ...item,
        payment: paymentData,
        driver: driverData
      });
      setModalVisible(true);
    } catch (err) {
      console.warn('Error cargando detalles:', err);
      setSelectedRide(item);
      setModalVisible(true);
    }
  };

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  const completedRidesCount = rideHistory.filter(h => h.status === 'completed').length;
  const totalSpent = rideHistory
    .filter(h => h.status === 'completed' && h.payment?.status === PAYMENT_STATUS.COMPLETED)
    .reduce((total, h) => total + (h.price || 0), 0);

  const renderItem = ({ item }) => {
    const cancelled = item.status === 'cancelled';
    const isPending = item.status === 'pending';
    const paymentStatus = item.payment?.status;

    return (
      <TouchableOpacity
        style={styles.rideItem}
        onPress={() => handlePressRide(item)}
        activeOpacity={0.8}
      >
        <View style={[
          styles.rideIcon, 
          { backgroundColor: cancelled ? '#2a0000' : isPending ? '#2a2000' : '#001a00' }
        ]}> 
          <Text style={styles.rideIconText}>{cancelled ? '✕' : isPending ? '⏱' : '🚗'}</Text>
        </View>

        <View style={styles.rideContent}>
          <Text style={styles.rideDestination} numberOfLines={1}>
            {item.destination.name}
          </Text>
          <Text style={styles.rideOrigin} numberOfLines={1}>
            {t.from}: {item.origin.name}
          </Text>
          <Text style={styles.rideDate}>{formatDate(item.createdAt, currentLang)}</Text>
          
          {paymentStatus && (
            <Text style={[
              styles.paymentTag, 
              { 
                color: paymentStatus === PAYMENT_STATUS.COMPLETED ? COLORS.green : 
                       paymentStatus === PAYMENT_STATUS.PENDING ? '#ffcc00' : COLORS.red 
              }
            ]}>
              {paymentStatus === PAYMENT_STATUS.COMPLETED ? t.completedPayment : 
               paymentStatus === PAYMENT_STATUS.PENDING ? t.pendingPayment : t.failedPayment}
            </Text>
          )}
        </View>

        <View style={styles.rideRight}>
          {cancelled ? (
            <Text style={styles.cancelledText}>{t.cancelled}</Text>
          ) : (
            <Text style={styles.rideFare}>${((item.price || 0)).toLocaleString(currentLang === LANGUAGES.ES ? 'es-CO' : 'en-US')}</Text>
          )}
          <Text style={styles.chevron}>›</Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation?.goBack()}>
          <Text style={styles.backBtn}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t.title}</Text>
        <View style={styles.headerSpacer} />
      </View>

      <View style={styles.summary}>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryValue}>{completedRidesCount}</Text>
          <Text style={styles.summaryLabel}>{t.totalRides}</Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryItem}>
          <Text style={[styles.summaryValue, { color: COLORS.green }]}>${totalSpent.toLocaleString(currentLang === LANGUAGES.ES ? 'es-CO' : 'en-US')}</Text>
          <Text style={styles.summaryLabel}>{t.totalSpent}</Text>
        </View>
      </View>

      <View style={styles.tabsContainer}>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'all' && styles.activeTab]} 
          onPress={() => setActiveTab('all')}
        >
          <Text style={[styles.tabText, activeTab === 'all' && styles.activeTabText]}>Todos</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'completed' && styles.activeTab]} 
          onPress={() => setActiveTab('completed')}
        >
          <Text style={[styles.tabText, activeTab === 'completed' && styles.activeTabText]}>{t.completed}</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'pending' && styles.activeTab]} 
          onPress={() => setActiveTab('pending')}
        >
          <Text style={[styles.tabText, activeTab === 'pending' && styles.activeTabText]}>{t.pending}</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'cancelled' && styles.activeTab]} 
          onPress={() => setActiveTab('cancelled')}
        >
          <Text style={[styles.tabText, activeTab === 'cancelled' && styles.activeTabText]}>{t.cancelled}</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={filteredRides}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>🚗</Text>
            <Text style={styles.emptyTitle}>{loading ? t.loading : t.noRides}</Text>
            <Text style={styles.emptySub}>
              {loading ? '' : error || t.noRides}
            </Text>
          </View>
        }
      />

      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <ScrollView>
              {selectedRide && (
                <View>
                  <Text style={styles.modalTitle}>
                    {selectedRide.status === 'completed' ? '✓ ' : 
                     selectedRide.status === 'cancelled' ? '✕ ' : '⏱ '}
                    {selectedRide.status === 'completed' ? t.completed : 
                     selectedRide.status === 'cancelled' ? t.cancelled : t.pending}
                  </Text>
                  <Text style={styles.modalDate}>{formatDate(selectedRide.createdAt, currentLang)}</Text>

                  <View style={styles.modalDivider} />

                  <Text style={styles.modalSectionTitle}>{t.route}</Text>
                  <Text style={styles.modalOrigin}>📍 {selectedRide.origin.name}</Text>
                  <Text style={styles.modalDest}>🏁 {selectedRide.destination.name}</Text>

                  {selectedRide.status === 'completed' && (
                    <View>
                      <View style={styles.modalDivider} />
                      <View style={styles.statsRow}>
                        <View style={styles.statItem}>
                          <Text style={styles.statValue}>{formatDuration(selectedRide.duration)}</Text>
                          <Text style={styles.statLabel}>{t.duration}</Text>
                        </View>
                        <View style={styles.statItem}>
                          <Text style={styles.statValue}>{formatDistance(selectedRide.distance)}</Text>
                          <Text style={styles.statLabel}>{t.distance}</Text>
                        </View>
                        <View style={styles.statItem}>
                          <Text style={[styles.statValue, { color: COLORS.green }]}>${(selectedRide.price || 0).toLocaleString(currentLang === LANGUAGES.ES ? 'es-CO' : 'en-US')}</Text>
                          <Text style={styles.statLabel}>{t.total}</Text>
                        </View>
                      </View>
                    </View>
                  )}

                  {selectedRide.vehicleType && VEHICLE_NAMES[selectedRide.vehicleType] && (
                    <View>
                      <View style={styles.modalDivider} />
                      <Text style={styles.modalSectionTitle}>{t.vehicle}</Text>
                      <Text style={styles.modalInfo}>{VEHICLE_NAMES[selectedRide.vehicleType]}</Text>
                    </View>
                  )}

                  {selectedRide.driver && (
                    <View>
                      <View style={styles.modalDivider} />
                      <Text style={styles.modalSectionTitle}>{t.driver}</Text>
                      <Text style={styles.modalInfo}>👤 {selectedRide.driver.fullName || '-'}</Text>
                      <Text style={styles.modalInfo}>📞 {selectedRide.driver.phone || '-'}</Text>
                    </View>
                  )}

                  {selectedRide.payment && (
                    <View>
                      <View style={styles.modalDivider} />
                      <Text style={styles.modalSectionTitle}>{t.paymentStatus}</Text>
                      <Text style={styles.modalInfo}>
                        Estado: {
                          selectedRide.payment.status === PAYMENT_STATUS.COMPLETED ? t.completedPayment : 
                          selectedRide.payment.status === PAYMENT_STATUS.PENDING ? t.pendingPayment : t.failedPayment
                        }
                      </Text>
                      {selectedRide.payment.method && (
                        <Text style={styles.modalInfo}>{t.method}: {selectedRide.payment.method === 'stripe' ? 'Stripe' : 'Mercado Pago'}</Text>
                      )}
                    </View>
                  )}

                  <View style={styles.modalDivider} />
                  <Text style={styles.modalInfoSmall}>ID: {selectedRide.id}</Text>
                </View>
              )}
            </ScrollView>

            <TouchableOpacity style={styles.closeBtn} onPress={() => setModalVisible(false)}>
              <Text style={styles.closeBtnText}>{t.close}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

export default HistoryScreen;

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.primary },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
  },
  backBtn: { color: COLORS.white, fontSize: 22 },
  headerTitle: { color: COLORS.white, fontSize: 18, fontWeight: 'bold' },
  headerSpacer: { width: 30 },
  summary: {
    flexDirection: 'row',
    backgroundColor: COLORS.darkGray,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
  },
  summaryItem: { flex: 1, alignItems: 'center', paddingVertical: 16 },
  summaryValue: { color: COLORS.white, fontSize: 20, fontWeight: 'bold' },
  summaryLabel: { color: COLORS.gray, fontSize: 12, marginTop: 2 },
  summaryDivider: { width: 1, backgroundColor: COLORS.lightGray, marginVertical: 12 },
  
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: COLORS.darkGray,
    paddingHorizontal: 8,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
  },
  tab: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 20,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  activeTab: { backgroundColor: COLORS.green },
  tabText: { color: COLORS.gray, fontSize: 13 },
  activeTabText: { color: COLORS.white, fontWeight: 'bold' },

  list: { padding: 16 },
  rideItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.cardBg,
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: COLORS.lightGray,
  },
  rideIcon: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  rideIconText: { fontSize: 22 },
  rideContent: { flex: 1 },
  rideDestination: { color: COLORS.white, fontSize: 14, fontWeight: 'bold' },
  rideOrigin: { color: COLORS.gray, fontSize: 12, marginTop: 2 },
  rideDate: { color: COLORS.gray, fontSize: 11, marginTop: 2 },
  paymentTag: { fontSize: 10, marginTop: 2, fontWeight: 'bold' },
  rideRight: { alignItems: 'flex-end' },
  rideFare: { color: COLORS.white, fontSize: 14, fontWeight: 'bold', marginBottom: 4 },
  cancelledText: { color: COLORS.red, fontSize: 12 },
  chevron: { color: COLORS.gray, fontSize: 18 },
  empty: { alignItems: 'center', paddingTop: 80 },
  emptyIcon: { fontSize: 50, marginBottom: 16 },
  emptyTitle: { color: COLORS.white, fontSize: 18, fontWeight: 'bold' },
  emptySub: { color: COLORS.gray, fontSize: 14, marginTop: 8 },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  modalBox: {
    backgroundColor: COLORS.darkGray,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '80%',
  },
  modalTitle: { color: COLORS.white, fontSize: 18, fontWeight: 'bold' },
  modalDate: { color: COLORS.gray, fontSize: 13, marginTop: 4 },
  modalDivider: { height: 1, backgroundColor: COLORS.lightGray, marginVertical: 16 },
  modalSectionTitle: { color: COLORS.gray, fontSize: 11, fontWeight: 'bold', marginBottom: 8 },
  modalOrigin: { color: COLORS.white, fontSize: 14, marginBottom: 8 },
  modalDest: { color: COLORS.white, fontSize: 14 },
  statsRow: { flexDirection: 'row' },
  statItem: { flex: 1, alignItems: 'center' },
  statValue: { color: COLORS.white, fontSize: 16, fontWeight: 'bold' },
  statLabel: { color: COLORS.gray, fontSize: 11, marginTop: 2 },
  modalInfo: { color: COLORS.white, fontSize: 15, marginBottom: 4 },
  modalInfoSmall: { color: COLORS.gray, fontSize: 12, textAlign: 'right' },
  closeBtn: { paddingVertical: 16, alignItems: 'center', marginTop: 8 },
  closeBtnText: { color: COLORS.gray, fontSize: 15 },
});