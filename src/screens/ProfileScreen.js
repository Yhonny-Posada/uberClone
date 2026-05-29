// screens/ProfileScreen.js
import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert, Modal} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useDispatch, useSelector } from 'react-redux';
import { updateProfile } from '../store';
import { updateUser } from '../services/userService';
import { COLORS } from '../constants/colors';
import { launchImageLibrary } from 'react-native-image-picker';
import { storage } from '../firebase/config';

const GENDER_OPTIONS = ['Masculino', 'Femenino', 'Otro', 'Prefiero no decir'];

const TABS = ['Personal', 'Seguridad', 'Preferencias'];

const ProfileScreen = ({ navigation }) => {
  const dispatch = useDispatch();
  const user = useSelector(state => state.auth.user);

  const [activeTab, setActiveTab] = useState('Personal');

  const [fullName, setFullName] = useState(user?.fullName || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [gender, setGender] = useState(user?.gender || '');
  const [email, setEmail] = useState(user?.email || '');
  const [language, setLanguage] = useState(user?.language || 'es');

  const [currentPass, setCurrentPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');

  const [errors, setErrors] = useState({});

  const [genderModalVisible, setGenderModalVisible] = useState(false);

  const validate = () => {
    const newErrors = {};

    if (!fullName || fullName.trim().length === 0) {
      newErrors.fullName = 'El nombre es requerido';
    } else if (fullName.length > 50) {
      newErrors.fullName = 'Máximo 50 caracteres';
    }

    if (!phone || phone.trim().length === 0) {
      newErrors.phone = 'El celular es requerido';
    } else if (!/^\d{10}$/.test(phone)) {
      newErrors.phone = 'Debe tener 10 dígitos';
    }

    if (!gender) {
      newErrors.gender = 'Selecciona un género';
    }

    if (!email || email.trim().length === 0) {
      newErrors.email = 'El correo es requerido';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = 'Formato inválido. Ejemplo: correo@dominio.com';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validatePassword = () => {
    const newErrors = {};
    if (!currentPass) newErrors.currentPass = 'Ingresa tu contraseña actual';
    if (!newPass || newPass.length < 6) newErrors.newPass = 'La nueva contraseña debe tener al menos 6 caracteres';
    if (newPass !== confirmPass) newErrors.confirmPass = 'Las contraseñas no coinciden';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChangePhoto = async (uid) => {
    try {
      const result = await launchImageLibrary({
        mediaType: 'photo',
        quality: 0.8,
        includeBase64: false
      });

      if (result.didCancel) return;

      if (result.assets && result.assets.length > 0) {
        const file = result.assets[0];
        const reference = storage().ref(`profileImages/${uid}.jpg`);
        await reference.putFile(file.uri);
        const downloadURL = await reference.getDownloadURL();

        await updateUser(uid, { profileImage: downloadURL });
        dispatch(updateProfile({ profileImage: downloadURL }));
        Alert.alert('Foto actualizada', 'Tu foto de perfil fue cambiada correctamente.');
      }
    } catch (error) {
      Alert.alert('Error', error.message || 'No se pudo cambiar la foto.');
    }
  };

  const handleSave = async () => {
    try {
      if (activeTab === 'Personal') {
        if (!validate()) return;

        if (user?.uid) {
          await updateUser(user.uid, { fullName, phone, gender, email, language });
        }
        dispatch(updateProfile({ fullName, phone, gender, email, language }));
        Alert.alert('Guardado', 'Tu perfil fue actualizado correctamente.');
      }

      if (activeTab === 'Seguridad') {
        if (!validatePassword()) return;
        // Aquí iría la lógica para actualizar contraseña en Firebase/Auth
        setCurrentPass('');
        setNewPass('');
        setConfirmPass('');
        Alert.alert('Contraseña actualizada', 'Tu contraseña se cambió con éxito.');
      }

      if (activeTab === 'Preferencias') {
        Alert.alert('Guardado', 'Preferencias actualizadas.');
      }
    } catch (error) {
      Alert.alert('Error', error.message || 'No se pudo guardar la información.');
    }
  };

  // Eliminar cuenta
  const handleDeleteAccount = () => {
    Alert.alert(
      'Eliminar cuenta',
      '¿Estás seguro? Esta acción es permanente y no se puede deshacer.',
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Eliminar', 
          style: 'destructive',
          onPress: async () => {
            try {
              // Lógica para eliminar usuario en BD y Auth
              Alert.alert('Cuenta eliminada', 'Hasta luego.', [
                { onPress: () => navigation.reset({ index: 0, routes: [{ name: 'Auth' }] }) }
              ]);
            } catch (e) {
              Alert.alert('Error', 'No se pudo eliminar la cuenta');
            }
          }
        }
      ]
    );
  };

  // Renderizado: Pestaña Información Personal
  const renderPersonal = () => (
    <ScrollView contentContainerStyle={styles.tabContent}>
      {/* Foto de perfil */}
      <View style={styles.avatarContainer}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {fullName ? fullName[0].toUpperCase() : '?'}
          </Text>
        </View>
        <TouchableOpacity 
          style={styles.changePhotoBtn} 
          onPress={() => handleChangePhoto(user?.uid)}
        >
          <Text style={styles.changePhotoText}>Cambiar foto</Text>
        </TouchableOpacity>
      </View>

      {/* Nombre completo */}
      <Text style={styles.label}>Nombre completo</Text>
      <TextInput
        style={[styles.input, errors.fullName && styles.inputError]}
        value={fullName}
        onChangeText={text => {
          setFullName(text);
          setErrors(prev => ({ ...prev, fullName: null }));
        }}
        placeholder="Escriba su nombre completo"
        placeholderTextColor={COLORS.gray}
        maxLength={50}
      />
      {errors.fullName && <Text style={styles.errorText}>{errors.fullName}</Text>}
      <Text style={styles.charCount}>{fullName.length}/50</Text>

      {/* Celular */}
      <Text style={styles.label}>Número de celular</Text>
      <TextInput
        style={[styles.input, errors.phone && styles.inputError]}
        value={phone}
        onChangeText={text => {
          setPhone(text.replace(/\D/g, ''));
          setErrors(prev => ({ ...prev, phone: null }));
        }}
        placeholder="Escriba su número de celular"
        placeholderTextColor={COLORS.gray}
        keyboardType="phone-pad"
      />
      {errors.phone && <Text style={styles.errorText}>{errors.phone}</Text>}

      {/* Género */}
      <Text style={styles.label}>Género</Text>
      <TouchableOpacity
        style={[styles.input, styles.selectInput, errors.gender && styles.inputError]}
        onPress={() => setGenderModalVisible(true)}
      >
        <Text style={gender ? styles.selectText : styles.selectPlaceholder}>
          {gender || 'Seleccionar género'}
        </Text>
        <Text style={styles.arrow}>▾</Text>
      </TouchableOpacity>
      {errors.gender && <Text style={styles.errorText}>{errors.gender}</Text>}

      {/* Correo */}
      <Text style={styles.label}>Correo electrónico</Text>
      <TextInput
        style={[styles.input, errors.email && styles.inputError]}
        value={email}
        onChangeText={text => {
          setEmail(text);
          setErrors(prev => ({ ...prev, email: null }));
        }}
        placeholder="Escriba su correo electrónico"
        placeholderTextColor={COLORS.gray}
        keyboardType="email-address"
        autoCapitalize="none"
      />
      {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}

      {/* Idioma */}
      <Text style={styles.label}>Idioma</Text>
      <View style={styles.languageRow}>
        <TouchableOpacity
          style={[styles.langBtn, language === 'es' && styles.langBtnActive, styles.langBtnMargin]}
          onPress={() => setLanguage('es')}
        >
          <Text style={styles.langFlag}>🇨🇴</Text>
          <Text style={[styles.langText, language === 'es' && styles.langTextActive]}>
            Español
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.langBtn, language === 'en' && styles.langBtnActive]}
          onPress={() => setLanguage('en')}
        >
          <Text style={styles.langFlag}>🇺🇸</Text>
          <Text style={[styles.langText, language === 'en' && styles.langTextActive]}>
            English
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );

  const renderSecurity = () => (
    <ScrollView contentContainerStyle={styles.tabContent}>
      <Text style={styles.label}>Contraseña actual</Text>
      <TextInput
        style={[styles.input, errors.currentPass && styles.inputError]}
        placeholder="••••••••"
        placeholderTextColor={COLORS.gray}
        secureTextEntry
        value={currentPass}
        onChangeText={setCurrentPass}
      />
      {errors.currentPass && <Text style={styles.errorText}>{errors.currentPass}</Text>}

      <Text style={styles.label}>Nueva contraseña</Text>
      <TextInput
        style={[styles.input, errors.newPass && styles.inputError]}
        placeholder="••••••••"
        placeholderTextColor={COLORS.gray}
        secureTextEntry
        value={newPass}
        onChangeText={setNewPass}
      />
      {errors.newPass && <Text style={styles.errorText}>{errors.newPass}</Text>}

      <Text style={styles.label}>Confirmar contraseña</Text>
      <TextInput
        style={[styles.input, errors.confirmPass && styles.inputError]}
        placeholder="••••••••"
        placeholderTextColor={COLORS.gray}
        secureTextEntry
        value={confirmPass}
        onChangeText={setConfirmPass}
      />
      {errors.confirmPass && <Text style={styles.errorText}>{errors.confirmPass}</Text>}
    </ScrollView>
  );

  const renderPreferences = () => (
    <ScrollView contentContainerStyle={styles.tabContent}>
      <View style={styles.prefRow}>
        <Text style={styles.prefText}>Notificaciones push</Text>
        <Text style={styles.prefValue}>Activadas</Text>
      </View>
      <View style={styles.prefRow}>
        <Text style={styles.prefText}>Ubicación</Text>
        <Text style={styles.prefValue}>Siempre</Text>
      </View>
      <TouchableOpacity style={styles.deleteBtn} onPress={handleDeleteAccount}>
        <Text style={styles.deleteBtnText}>Eliminar cuenta</Text>
      </TouchableOpacity>
    </ScrollView>
  );

  return (
    <SafeAreaView style={styles.safe}>
      {/* Encabezado */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation?.goBack()}>
          <Text style={styles.backBtn}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Mi Perfil</Text>
        <View style={styles.headerSpacer} />
      </View>

      {/* Pestañas */}
      <View style={styles.tabBar}>
        {TABS.map(tab => (
          <TouchableOpacity
            key={tab}
            style={[styles.tabItem, activeTab === tab && styles.tabItemActive]}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
              {tab}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Contenido según pestaña */}
      {activeTab === 'Personal' && renderPersonal()}
      {activeTab === 'Seguridad' && renderSecurity()}
      {activeTab === 'Preferencias' && renderPreferences()}

      {/* Botón Guardar */}
      <View style={styles.footer}>
        <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
          <Text style={styles.saveBtnText}>Guardar cambios</Text>
        </TouchableOpacity>
      </View>

      {/* Modal Seleccionar Género */}
      <Modal
        visible={genderModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setGenderModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Seleccionar Género</Text>
            {GENDER_OPTIONS.map(option => (
              <TouchableOpacity
                key={option}
                style={styles.modalOption}
                onPress={() => {
                  setGender(option);
                  setErrors(prev => ({ ...prev, gender: null }));
                  setGenderModalVisible(false);
                }}
              >
                <Text style={[styles.modalOptionText, gender === option && styles.modalOptionSelected]}>
                  {option}
                </Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity
              style={styles.modalCancel}
              onPress={() => setGenderModalVisible(false)}
            >
              <Text style={styles.modalCancelText}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

export default ProfileScreen;

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
  // Pestañas
  tabBar: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
  },
  tabItem: { flex: 1, alignItems: 'center', paddingVertical: 14 },
  tabItemActive: { borderBottomWidth: 2, borderBottomColor: COLORS.green },
  tabText: { color: COLORS.gray, fontSize: 14 },
  tabTextActive: { color: COLORS.green, fontWeight: 'bold' },
  // Contenido
  tabContent: { padding: 16, paddingBottom: 40 },
  // Avatar
  avatarContainer: { alignItems: 'center', marginBottom: 24 },
  avatar: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: COLORS.darkGray,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: COLORS.green,
  },
  avatarText: { color: COLORS.green, fontSize: 32, fontWeight: 'bold' },
  changePhotoBtn: { marginTop: 8 },
  changePhotoText: { color: COLORS.green, fontSize: 14 },
  // Formulario
  label: { color: COLORS.gray, fontSize: 13, marginBottom: 6, marginTop: 12 },
  input: {
    backgroundColor: COLORS.inputBg,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.lightGray,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: COLORS.white,
    fontSize: 15,
  },
  inputError: { borderColor: COLORS.red },
  errorText: { color: COLORS.red, fontSize: 12, marginTop: 4 },
  charCount: { color: COLORS.gray, fontSize: 11, textAlign: 'right', marginTop: 4 },
  // Selector
  selectInput: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  selectText: { color: COLORS.white, fontSize: 15 },
  selectPlaceholder: { color: COLORS.gray, fontSize: 15 },
  arrow: { color: COLORS.gray },
  // Idioma
  languageRow: { flexDirection: 'row', marginTop: 4 },
  langBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 10, borderWidth: 1, borderColor: COLORS.lightGray,
    backgroundColor: COLORS.inputBg,
  },
  langBtnActive: { borderColor: COLORS.green },
  langBtnMargin: { marginRight: 12 },
  langFlag: { fontSize: 20, marginRight: 8 },
  langText: { color: COLORS.gray, fontSize: 14 },
  langTextActive: { color: COLORS.green, fontWeight: 'bold' },
  // Preferencias
  prefRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: COLORS.lightGray,
  },
  prefText: { color: COLORS.white, fontSize: 15 },
  prefValue: { color: COLORS.gray, fontSize: 15 },
  deleteBtn: { marginTop: 32, alignItems: 'center' },
  deleteBtnText: { color: COLORS.red, fontSize: 15 },
  // Pie de página
  footer: { padding: 16, borderTopWidth: 1, borderTopColor: COLORS.lightGray },
  saveBtn: {
    backgroundColor: COLORS.green, borderRadius: 30,
    paddingVertical: 16, alignItems: 'center',
  },
  saveBtnText: { color: COLORS.primary, fontSize: 16, fontWeight: 'bold' },
  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  modalBox: {
    backgroundColor: COLORS.darkGray,
    borderTopLeftRadius: 20, borderTopRightRadius: 20,
    padding: 20, paddingBottom: 40,
  },
  modalTitle: { color: COLORS.white, fontSize: 18, fontWeight: 'bold', marginBottom: 16 },
  modalOption: { paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: COLORS.lightGray },
  modalOptionText: { color: COLORS.gray, fontSize: 16 },
  modalOptionSelected: { color: COLORS.green, fontWeight: 'bold' },
  modalCancel: { marginTop: 16, alignItems: 'center' },
  modalCancelText: { color: COLORS.gray, fontSize: 15 },
});