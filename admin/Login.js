import React, { useEffect, useState } from 'react';
import { Image, View, TouchableOpacity, StyleSheet } from 'react-native';
import { TextInput, Button, Text, HelperText } from 'react-native-paper';
import { useMyContextProvider, login } from '../index';


const Login = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [controller, dispatch] = useMyContextProvider();
  const { userLogin } = controller;
  const [showPassword, setShowPassword] = useState(false);
  const [disableLogin, setDisableLogin] = useState(true);
  const hasErrorEmail = () => !email.includes("@");
  const hasErrorPassword = () => password.length < 6;

  useEffect(() => {
    setDisableLogin(email.trim() === '' || password.trim() === '' || hasErrorEmail() || hasErrorPassword());
  }, [email, password, hasErrorEmail, hasErrorPassword]);

  useEffect(() => {
    if (userLogin != null) {
      if (userLogin.role === "admin")
        navigation.navigate("Admin")
      else if (userLogin.role === "user")
        navigation.navigate("Admin")
    }
  }, [userLogin])

  const handleLogin = () => {
    login(dispatch, email, password);
    console.log(email, password);
  };

  return (
    <View style={styles.container}>
      <View style={styles.formContainer}>
        <Image 
          source={require("../assets/logo.png")}
          style={styles.logo}
        />
        <Text style={styles.title}>Đăng nhập</Text>
        <Button
          onPress={() => {
            setEmail('admin@gmail.com');
            setPassword('123456');
          }}
        >
          
        </Button>
        <TextInput
          label="Email"
          value={email}
          onChangeText={setEmail}
          style={styles.input}
          mode="outlined"
          outlineColor="#FF8C00"
          activeOutlineColor="#FF8C00"
          left={<TextInput.Icon icon="email" color="#FF8C00" />}
        />
        <HelperText type="error" visible={hasErrorEmail()}>
          Địa chỉ Email không hợp lệ
        </HelperText>

        <TextInput
          label="Mật khẩu" 
          value={password}
          onChangeText={setPassword}
          style={styles.input}
          mode="outlined"
          outlineColor="#FF8C00"
          activeOutlineColor="#FF8C00"
          secureTextEntry={!showPassword}
          left={<TextInput.Icon icon="lock" color="#FF8C00" />}
          right={
            <TextInput.Icon 
              icon={showPassword ? "eye" : "eye-off"}
              color="#FF8C00"
              onPress={() => setShowPassword(!showPassword)}
            />
          }
        />
        <HelperText type="error" visible={hasErrorPassword()}>
          Mật khẩu phải có ít nhất 6 ký tự
        </HelperText>

        <TouchableOpacity 
          style={[styles.loginButton, disableLogin && styles.disabledButton]}
          onPress={handleLogin}
          disabled={disableLogin}
        >
          <Text style={styles.loginButtonText}>Đăng nhập</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          onPress={() => navigation.navigate("ForgotPassword")}
          style={styles.forgotPassword}
        >
          <Text style={styles.forgotPasswordText}>Quên mật khẩu?</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default Login;
const styles = StyleSheet.create({
  container: {
    flex: 1,
    
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    alignItems: 'center',
    justifyContent: 'center',
  },
  formContainer: {
    width: '100%',
    maxWidth: 400,
    padding: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 15,
    backdropFilter: 'blur(5px)',
    boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.37)',
    margin: 20,
  },
  logo: {
    width: 120,
    height: 120,
    resizeMode: 'contain',
    alignSelf: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FF8C00',
    textAlign: 'center',
    marginBottom: 30,
  },
  input: {
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 5,
  },
  loginButton: {
    backgroundColor: '#FF8C00',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  disabledButton: {
    backgroundColor: '#FFCC33',
  },
  loginButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  forgotPassword: {
    marginTop: 15,
    alignItems: 'center',
  },
  forgotPasswordText: {
    color: '#FF8C00',
    fontSize: 14,
    fontWeight: '500',
  }
});
