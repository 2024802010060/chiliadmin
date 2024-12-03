import React, { useEffect } from "react";
import { Text } from "react-native-paper";
import { View, StyleSheet, Button, Image, Platform, ScrollView, TouchableOpacity } from "react-native";
import { useMyContextProvider } from "../index";
import { signOut } from 'firebase/auth';
import { auth } from '../firebaseconfig';
import ChangePasswordad from "./ChangePasswordad";
import { useNavigation } from '@react-navigation/native';

const Profile = () => {
    const [controller, dispatch] = useMyContextProvider();
    const { userLogin } = controller;
    const navigation = useNavigation();
    
    useEffect(() => {
        if(userLogin == null)
            navigation.navigate("Login")
    }, [userLogin])

    const handleLogout = async () => {
        try {
            await signOut(auth);
            dispatch({ type: "LOGOUT" });
        } catch (error) {
            console.error("Lỗi đăng xuất:", error);
        }
    };

    const handleEdit = () => {
       
        navigation.navigate('ChangePasswordad');
    };

    return (
        <ScrollView style={styles.safeArea} contentContainerStyle={styles.scrollContent}>
            <View style={styles.container}>
                {userLogin !== null && (
                    <View style={styles.card}> 
                        <View style={styles.header}> 
                            <Image source={require('../assets/account.png')} 
                                style={styles.profileImage} />
                            <Text style={styles.headerText}>{userLogin.fullName}</Text>
                        </View>
                        
                        <View style={styles.infoRow}>
                            <Image source={require('../assets/phone.png')} 
                                style={styles.icon} />
                            <Text style={styles.label}>Điện thoại: </Text>
                            <Text>{userLogin.phone}</Text>
                        </View>

                        <View style={styles.infoRow}>
                            <Image source={require('../assets/email.png')} 
                                style={styles.icon} />
                            <Text style={styles.label}>Email: </Text>
                            <Text>{userLogin.email}</Text>
                        </View>

                        <View style={styles.infoRow}>
                            <Image source={require('../assets/padlock.png')} 
                                style={styles.icon} />
                            <Text style={styles.label}>Mật khẩu: </Text>
                            <Text>{'*'.repeat(userLogin.password.length)}</Text>
                        </View>

                        <View style={styles.infoRow}>
                            <Image source={require('../assets/place.png')} 
                                style={styles.icon} />
                            <Text style={styles.label}>Địa chỉ: </Text>
                            <Text>{userLogin.address}</Text>
                        </View>

                        <View style={styles.contactRow}>
                            <Image source={require('../assets/question.png')} 
                                style={styles.icon} />
                            <Text style={styles.label}>Liên hệ: </Text>
                            <Text>Sđt: 0343377477 - Mail: Chilick@gmail.com</Text>
                        </View>
                    </View> 
                )}
                
                <View style={styles.buttonContainer}>
                    <TouchableOpacity style={styles.buttonWrapper} onPress={handleEdit}>
                        <Text style={styles.buttonText}>Đổi mật khẩu</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.buttonWrapper} onPress={handleLogout}>
                        <Text style={styles.buttonText}>Đăng xuất</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </ScrollView>
    )
}
export default Profile;
const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    scrollContent: {
        flexGrow: 1,
        
    },
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
        ...(Platform.OS === 'web' ? {
            
            alignSelf: 'center',
            width: '100%',
            
        } : {})
    },
    card: {
        padding: 15,
        backgroundColor: '#fff',
        borderRadius: 10,
        margin: 15,
        marginTop: 20,
        ...(Platform.OS === 'web' ? {
            boxShadow: '0px 2px 5px rgba(0,0,0,0.1)'
        } : {
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.25,
            shadowRadius: 3.84,
            elevation: 5,
        })
    },
    header: {
        alignItems: 'center',
        backgroundColor: '#FF8C00',
        flexDirection: 'row',
        padding: 15,
        borderRadius: 8,
        marginBottom: 15
    },
    profileImage: {
        width: 60,
        height: 60,
        marginRight: 15,
        tintColor: 'white'
    },
    headerText: {
        fontSize: 20,
        color: 'white',
        fontWeight: 'bold'
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0'
    },
    icon: {
        width: 24,
        height: 24,
        marginRight: 10
    },
    label: {
        fontWeight: 'bold',
        marginRight: 5,
        minWidth: 80
    },
    buttonContainer: {
        padding: 20,
        marginTop: 'auto',
        gap: 15,
        maxWidth: 450,
        alignSelf: 'center',
        width: '100%'
    },
    buttonWrapper: {
        backgroundColor: '#FF8C00',
        borderRadius: 8,
        padding: 12,
        alignItems: 'center',
        justifyContent: 'center',
        elevation: 2,
        height: 45,
        ...(Platform.OS === 'web' ? {
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            ':hover': {
                backgroundColor: '#ff9f2f',
                transform: 'translateY(-1px)'
            }
        } : {
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.25,
            shadowRadius: 3.84,
        })
    },
    contactRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0'
    },
    buttonText: {
        color: '#FFFFFF',
        fontSize: 18,
        fontWeight: 'bold'
    }
});