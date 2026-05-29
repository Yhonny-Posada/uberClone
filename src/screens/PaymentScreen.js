import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert, Modal, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useDispatch, useSelector } from 'react-redux';
import { setSelectedMethod, addCard, removeCard } from '../store';
import { COLORS } from '../constants/colors';

const PAYMENT_METHODS = [
  { id: 'stripe', name: 'Tarjeta Crédito/Débito (Stripe)', icon: '💳', label: 'Stripe' },
  { id: 'mercadopago', name: 'Mercado Pago', icon: '🟡', label: 'MP' },
  { id: 'cash', name: 'Efectivo', icon: '💵', label: null },
];

const PaymentScreen = ({ navigation }) => {
  const dispatch = useDispatch();
  const payment = useSelector(state => state.payment);

  const [modalVisible, setModalVisible] = useState(false);

  const [cardNumber, setCardNumber] = useState('');
  const [cardHolder, setCardHolder] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvv, setCvv] = useState('');

  const [errors, setErrors] = useState({});

  const validateCard = () => {
    const newErrors = {};
    const cleanNumber = cardNumber.replace(/\s/g, '');

    if (!cleanNumber) {
      newErrors.cardNumber = 'Número de tarjeta requerido';
    } else if (!/^\d{16}$/.test(cleanNumber)) {
      newErrors.cardNumber = 'Debe tener 16 dígitos';
    }

    if (!cardHolder || cardHolder.trim().length < 3) {
      newErrors.cardHolder = 'Nombre del titular requerido';
    }

    if (!expiry) {
      newErrors.expiry = 'Fecha de vencimiento requerida';
    } else if (!/^\d{2}\/\d{2}$/.test(expiry)) {
      newErrors.expiry = 'Formato inválido, usa MM/AA';
    }

    if (!cvv || !/^\d{3,4}$/.test(cvv)) {
      newErrors.cvv = 'Código CVV inválido';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleCardNumberChange = (text) => {
    const clean = text.replace(/\D/g, '').slice(0, 16);
    const formatted = clean.replace(/(\d{4})/g, '$1 ').trim();
    setCardNumber(formatted);
  };

  const handleExpiryChange = (text) => {
    const clean = text.replace(/\D/g, '').slice(0, 4);
    if (clean.length >= 2) {
      setExpiry(clean.slice(0, 2) + '/' + clean.slice(2));
    } else {
      setExpiry(clean);
    }
  };

  const handleSaveCard = () => {
    if (!validateCard()) return;
    const last4 = cardNumber.replace(/\s/g, '').slice(-4);
    dispatch(addCard({
      id: Date.now().toString(),
      last4,
      holder: cardHolder,
      expiry,
    }));
    Alert.alert('Tarjeta agregada', 'Tu tarjeta se guardó correctamente.');
    setCardNumber('');
    setCardHolder('');
    setExpiry('');
    setCvv('');
    setErrors({});
    setModalVisible(false);
  };

  const handleStripePayment = () => {

    const stripeUrl = 'https://buy.stripe.com/test/your_valid_link'; 
    
    if (!stripeUrl || stripeUrl.includes('your_valid_link')) {
      Alert.alert(
        'Configuración requerida', 
        'El enlace de pago de Stripe no está configurado. Debes colocar tu enlace real en el código.'
      );
      return;
    }

    Linking.openURL(stripeUrl)
      .catch(() => Alert.alert('Error', 'No se pudo abrir el enlace de pago de Stripe'));
  };

  const handleMercadoPagoPayment = () => {
    
    const preferenceId = 'TU_ID_DE_PREFERENCIA_GENERADO'; 
    
    if (!preferenceId || preferenceId === 'TU_ID_DE_PREFERENCIA_GENERADO') {
      Alert.alert(
        'Configuración requerida', 
        'Falta el ID de preferencia de Mercado Pago. Debes generarlo en tu cuenta y pegarlo aquí.'
      );
      return;
    }

    const mpUrl = `https://www.mercadopago.com.co/checkout/v1/redirect?preference-id=${preferenceId}`;
    Linking.openURL(mpUrl)
      .catch(() => Alert.alert('Error', 'No se pudo abrir el enlace de Mercado Pago'));
  };

  const handleDeleteCard = (id) => {
    Alert.alert(
      'Eliminar tarjeta',
      '¿Estás seguro de eliminar esta tarjeta?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Eliminar', style: 'destructive', onPress: () => dispatch(removeCard(id)) }
      ]
    );
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation?.goBack()}>
          <Text style={styles.backBtn}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Métodos de Pago</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.content}>
        <Text style={styles.sectionTitle}>Selecciona un método</Text>

        {PAYMENT_METHODS.map(method => (
          <TouchableOpacity
            key={method.id}
            style={[
              styles.methodRow,
              payment.selectedMethod === method.id && styles.methodRowSelected,
            ]}
            onPress={() => dispatch(setSelectedMethod(method.id))}
          >
            <Text style={styles.methodIcon}>{method.icon}</Text>
            <Text style={styles.methodName}>{method.name}</Text>
            {method.label && (
              <View style={[styles.radio, payment.selectedMethod === method.id && styles.radioSelected]}>
                {payment.selectedMethod === method.id && <View style={styles.radioDot} />}
              </View>
            )}
          </TouchableOpacity>
        ))}

        {payment.selectedMethod === 'stripe' && (
          <View style={styles.cardsSection}>
            <TouchableOpacity style={styles.saveCardBtn} onPress={() => setModalVisible(true)}>
              <Text style={styles.saveCardBtnText}>Agregar nueva tarjeta</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.saveCardBtn, { backgroundColor: COLORS.blue || '#007bff', marginTop: 10 }]} onPress={handleStripePayment}>
              <Text style={styles.saveCardBtnText}>Pagar con Stripe</Text>
            </TouchableOpacity>

            {payment.cards.length > 0 ? (
              <View style={{ marginTop: 20 }}>
                <Text style={styles.modalTitle}>Tus tarjetas</Text>
                {payment.cards.map(card => (
                  <View key={card.id} style={styles.cardRow}>
                    <Text style={styles.cardIcon}>💳</Text>
                    <View style={styles.cardInfo}>
                      <Text style={styles.cardNumber}>•••• {card.last4}</Text>
                      <Text style={styles.cardHolder}>{card.holder}</Text>
                      <Text style={styles.cardHolder}>{card.expiry}</Text>
                    </View>
                    <TouchableOpacity onPress={() => handleDeleteCard(card.id)}>
                      <Text style={[styles.deleteIcon, { color: COLORS.red }]}>🗑️</Text>
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            ) : (
              <View style={styles.emptyCards}>
                <Text style={styles.emptyCardsText}>No tienes tarjetas guardadas</Text>
              </View>
            )}
          </View>
        )}

        {payment.selectedMethod === 'mercadopago' && (
          <View style={styles.infoBox}>
            <TouchableOpacity style={styles.saveCardBtn} onPress={handleMercadoPagoPayment}>
              <Text style={styles.saveCardBtnText}>Ir a Mercado Pago</Text>
            </TouchableOpacity>
            <Text style={styles.infoText}>
              Serás redirigido al sitio seguro de Mercado Pago para completar tu pago.
            </Text>
          </View>
        )}

        {payment.selectedMethod === 'cash' && (
          <View style={styles.infoBox}>
            <Text style={styles.infoText}>
              Paga directamente al conductor al momento de recibir tu servicio.
            </Text>
          </View>
        )}

        <Text style={styles.securityText}>🔒 Todos los pagos son seguros y encriptados</Text>
      </ScrollView>

      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Agregar Tarjeta</Text>

            <Text style={styles.fieldLabel}>Número de tarjeta</Text>
            <TextInput
              style={[styles.fieldInput, errors.cardNumber && styles.fieldInputError]}
              value={cardNumber}
              onChangeText={handleCardNumberChange}
              placeholder="1234 5678 9012 3456"
              placeholderTextColor={COLORS.gray}
              keyboardType="numeric"
              maxLength={19}
            />
            {errors.cardNumber && <Text style={styles.fieldError}>{errors.cardNumber}</Text>}

            <Text style={styles.fieldLabel}>Titular</Text>
            <TextInput
              style={[styles.fieldInput, errors.cardHolder && styles.fieldInputError]}
              value={cardHolder}
              onChangeText={setCardHolder}
              placeholder="Como aparece en la tarjeta"
              placeholderTextColor={COLORS.gray}
              autoCapitalize="words"
            />
            {errors.cardHolder && <Text style={styles.fieldError}>{errors.cardHolder}</Text>}

            <View style={styles.rowFields}>
              <View style={styles.fieldColFirst}>
                <Text styles={styles.fieldLabel}>Vencimiento</Text>
                <TextInput
                  style={[styles.fieldInput, errors.expiry && styles.fieldInputError]}
                  value={expiry}
                  onChangeText={handleExpiryChange}
                  placeholder="MM/AA"
                  placeholderTextColor={COLORS.gray}
                  keyboardType="number-pad"
                />
                {errors.expiry && <Text style={styles.fieldError}>{errors.expiry}</Text>}
              </View>
              <View style={styles.fieldColLast}>
                <Text style={styles.fieldLabel}>CVV</Text>
                <TextInput
                  style={[styles.fieldInput, errors.cvv && styles.fieldInputError]}
                  value={cvv}
                  onChangeText={(text) => setCvv(text.replace(/\D/g, '').slice(0, 4))}
                  placeholder="123"
                  placeholderTextColor={COLORS.gray}
                  keyboardType="number-pad"
                  secureTextEntry
                />
                {errors.cvv && <Text style={styles.fieldError}>{errors.cvv}</Text>}
              </View>
            </View>

            <TouchableOpacity style={styles.saveCardBtn} onPress={handleSaveCard}>
              <Text style={styles.saveCardBtnText}>Guardar tarjeta</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.cancelModalBtn} onPress={() => setModalVisible(false)}>
              <Text style={styles.cancelModalText}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

export default PaymentScreen;

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.primary },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderBottomWidth: 1, borderBottomColor: COLORS.lightGray },
  backBtn: { color: COLORS.white, fontSize: 22 },
  headerTitle: { color: COLORS.white, fontSize: 18, fontWeight: 'bold' },
  headerSpacer: { width: 30 },
  content: { padding: 16, paddingBottom: 40 },
  sectionTitle: { color: COLORS.gray, fontSize: 13, fontWeight: 'bold', marginBottom: 10, marginTop: 8 },
  methodRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.cardBg, borderRadius: 10, padding: 14, marginBottom: 8, borderWidth: 1.5, borderColor: COLORS.lightGray },
  methodRowSelected: { borderColor: COLORS.green, backgroundColor: '#001a00' },
  methodIcon: { fontSize: 22, marginRight: 12 },
  methodName: { flex: 1, color: COLORS.white, fontSize: 15 },
  radio: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: COLORS.gray, alignItems: 'center', justifyContent: 'center' },
  radioSelected: { borderColor: COLORS.green },
  radioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: COLORS.green },
  cardsSection: { marginTop: 16 },
  emptyCards: { alignItems: 'center', paddingVertical: 24 },
  emptyCardsText: { color: COLORS.gray, fontSize: 14 },
  cardRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.cardBg, borderRadius: 10, padding: 12, marginBottom: 8, borderWidth: 1, borderColor: COLORS.lightGray, gap: 12 },
  cardIcon: { fontSize: 22 },
  cardInfo: { flex: 1 },
  cardNumber: { color: COLORS.white, fontSize: 15, fontWeight: 'bold' },
  cardHolder: { color: COLORS.gray, fontSize: 12, marginTop: 2 },
  deleteIcon: { fontSize: 18 },
  infoBox: { backgroundColor: COLORS.darkGray, borderRadius: 10, padding: 16, marginTop: 16, borderWidth: 1, borderColor: COLORS.lightGray },
  infoText: { color: COLORS.gray, fontSize: 14, lineHeight: 20, marginTop: 10 },
  securityText: { color: COLORS.gray, fontSize: 12, textAlign: 'center', marginTop: 24 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  modalBox: { backgroundColor: COLORS.darkGray, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, paddingBottom: 40 },
  modalTitle: { color: COLORS.white, fontSize: 18, fontWeight: 'bold', marginBottom: 16 },
  fieldLabel: { color: COLORS.gray, fontSize: 13, marginBottom: 6, marginTop: 12 },
  fieldInput: { backgroundColor: COLORS.inputBg, borderRadius: 10, borderWidth: 1, borderColor: COLORS.lightGray, paddingHorizontal: 14, paddingVertical: 12, color: COLORS.white, fontSize: 15 },
  fieldInputError: { borderColor: COLORS.red },
  fieldError: { color: COLORS.red, fontSize: 12, marginTop: 4 },
  rowFields: { flexDirection: 'row', marginTop: 4 },
  fieldColFirst: { flex: 1, marginRight: 8 },
  fieldColLast: { flex: 1 },
  saveCardBtn: { backgroundColor: COLORS.green, borderRadius: 30, paddingVertical: 14, alignItems: 'center', marginTop: 20 },
  saveCardBtnText: { color: COLORS.primary, fontSize: 16, fontWeight: 'bold' },
  cancelModalBtn: { alignItems: 'center', paddingVertical: 14 },
  cancelModalText: { color: COLORS.gray, fontSize: 15 },
});