import { StyleSheet, Text, TouchableOpacity, View, Alert, ToastAndroid } from 'react-native';
import React, { useState } from 'react';
import { TextInput, HelperText } from 'react-native-paper';

import { auth, firestore,storage } from '../firebaseconfig';
import { useNavigation } from '@react-navigation/native';
import {logout,  useMyContextProvider } from '../index';
import { getAuth, EmailAuthProvider, reauthenticateWithCredential, updatePassword } from 'firebase/auth';
import { doc, updateDoc, getFirestore } from 'firebase/firestore';

const ChangePasswordad = () => {
  const [currentPass, setCurrentPass] = useState('');
  const [password, setPassword] = useState('');
  const hasErrorPass = () => password.length < 6
  const navigation = useNavigation();

  const reauthenticate = () => {
    const auth = getAuth();
    const user = auth.currentUser;
    const credential = EmailAuthProvider.credential(user.email, currentPass);
    return reauthenticateWithCredential(user, credential);
  };
  
  const handleChangePassword = async () => {
    try {
      const auth = getAuth();
      const user = auth.currentUser;
      const db = getFirestore();
      
      if (!user) {
        Alert.alert('Lỗi', 'Người dùng hiện tại không tồn tại');
        return;
      }

      await reauthenticate();
      await updatePassword(user, password);
      
      const userRef = doc(db, 'USERS', user.email);
      await updateDoc(userRef, {
        password: password
      });

      Alert.alert('Thành công', 'Cập nhật mật khẩu thành công, vui lòng đăng nhập lại');
      navigation.navigate("Login");
    } catch (error) {
      console.error(error);
      Alert.alert('Lỗi', 'Đổi mật khẩu thất bại');
    }
  };
  
  return (
    <View style={styles.container}>
      <Text style={styles.textform}>Mật khẩu hiện tại</Text>
      <TextInput
        style={styles.input}
        value={currentPass}
        onChangeText={setCurrentPass}
        secureTextEntry
      />

      <Text style={styles.textform}>Mật khẩu mới</Text>
      <TextInput
        style={styles.input}
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />
      <HelperText style={{alignSelf:'flex-start', marginLeft:3, marginTop:5}} 
      type="error" visible={hasErrorPass()}>
        Mật khẩu mới phải từ 6 kí tự trở lên</HelperText>
      <TouchableOpacity style={styles.button} onPress={handleChangePassword}>
        <Text style={styles.buttonText}>Đổi mật khẩu</Text>
      </TouchableOpacity>
    </View>
  );
};

export default ChangePasswordad;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    margin: 30,
  },
  textform: {
    marginBottom: 8,
    fontSize: 17,
  },
  input: {
    backgroundColor: 'white',
    borderColor: '#80bfff',
    borderWidth: 1,
    marginBottom: 10,
  },
  button: {
    marginTop: 20,
    backgroundColor: 'orange',
    padding: 10,
    borderRadius: 10,
  },
  buttonText: {
    textAlign: 'center',
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
