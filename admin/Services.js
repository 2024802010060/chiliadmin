import React, { useState, useEffect } from "react";
import { Image, View, FlatList, TouchableOpacity, Alert, TextInput,StyleSheet, ScrollView } from "react-native";
import { IconButton, Text, TextInput as PaperTextInput } from "react-native-paper";
import { auth, firestore,storage } from '../firebaseconfig';
import { Menu, MenuTrigger, MenuOptions, MenuOption } from 'react-native-popup-menu';
import { collection, onSnapshot, query } from 'firebase/firestore';
import Icon from 'react-native-vector-icons/MaterialIcons';
const Services = ({ navigation }) => {
    const [initialServices, setInitialServices] = useState([]);
    const [services, setServices] = useState([]);
    const [name, setName] = useState('');

    useEffect(() => {
        try {
            const servicesRef = collection(firestore, 'Services');
            const q = query(servicesRef);
            
            const unsubscribe = onSnapshot(q, (querySnapshot) => {
                const services = [];
                querySnapshot.forEach(documentSnapshot => {
                    services.push({
                        ...documentSnapshot.data(),
                        id: documentSnapshot.id,
                    });
                });
                setServices(services);
                setInitialServices(services);
            });

            return () => unsubscribe();
        } catch (error) {
            console.error("Error setting up listener:", error);
        }
    }, []);

    // Thêm hàm formatPrice
    const formatPrice = (price) => {
        return price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    };

    const renderItem = ({ item }) => (
        <TouchableOpacity 
            onPress={() => handleUpdate(item)} 
            style={styles.itemContainer}
        >
            <View style={styles.itemContent}>
                <Image 
                    source={{ uri: item.image }}
                    style={styles.productImage}
                />
                <View style={styles.productInfo}>
                    <Text style={styles.productTitle}>{item.title}</Text>
                    <Text style={styles.productPrice}>{formatPrice(item.price)} VNĐ</Text>
                    {item.description && (
                        <Text style={styles.productDescription} numberOfLines={2}>
                            {item.description}
                        </Text>
                    )}
                </View>
            </View>
        </TouchableOpacity>
    );
    
    const handleUpdate = (service) => {
        navigation.navigate("ServiceUpdate", { service });
    }

    
    
    return (
        <FlatList
            data={services}
            renderItem={renderItem}
            keyExtractor={item => item.id}
            numColumns={2}
            style={{ height: 300 }}
            columnWrapperStyle={{
                gap: 10,
                paddingHorizontal: 10,
            }}
            ListHeaderComponent={
                <>
                    <View style={{ paddingLeft: 20, paddingRight: 20, alignItems: 'center' }}>
                        <PaperTextInput
                            value={name}
                            placeholder="Tìm kiếm"
                            placeholderTextColor="#888"
                            left={
                                <PaperTextInput.Icon 
                                    icon={() => <Image 
                                        source={require('../assets/search.png')} 
                                        style={{ 
                                            width: 20, 
                                            height: 20,
                                            tintColor: '#757575'
                                        }} 
                                    />} 
                                />
                            }
                            mode="outlined"
                            style={{
                                backgroundColor: 'white',
                                marginHorizontal: 15,
                                marginTop: 15,
                            }}
                            outlineStyle={{
                                borderRadius: 25,
                            }}
                            onChangeText={(text) => {
                                setName(text);
                                const result = initialServices.filter(service => service.title.toLowerCase().includes(text.toLowerCase()));
                                setServices(result);
                            }}
                            
                        />
                    </View>
                    <View style={{alignItems: 'center', marginVertical: 20}}>
                        <Image 
                            source={require("../assets/logo.png")}
                            style={{
                                width: 150,
                                height: 150,
                                borderRadius: 75,
                                marginBottom: 10
                            }}
                        />
                    </View>
                    
                    <View style={{
                        flexDirection: "row",
                        alignItems: "center",
                        justifyContent: "space-between",
                        paddingHorizontal: 20,
                        marginBottom: 15,
                        backgroundColor: '#fff',
                        height: 60,
                        shadowColor: '#000',
                        shadowOffset: {width: 0, height: 2},
                        shadowOpacity: 0.1,
                        elevation: 3,
                    }}>
                        <Text style={{
                            fontSize: 22,
                            fontWeight: "bold",
                            color: '#333'
                        }}>
                            Danh sách sản phẩm
                        </Text>
                        <TouchableOpacity 
                            onPress={() => navigation.navigate("AddNewService")}
                            style={{
                                backgroundColor: '#FF8C00',
                                padding: 10,
                                borderRadius: 25,
                            }}
                        >
                            <Image 
                                source={require('../assets/add.png')} 
                                style={{ width: 25, height: 25, tintColor: 'white' }} 
                            />
                        </TouchableOpacity>
                    </View>
                    <View style={{paddingBottom:40}}></View>
                </>
            }
        />
    );
}

export default Services;
const styles = StyleSheet.create({
    
    inputContainerStyle:{
        color:'black',
        borderColor: "black", // Viền ngoài màu đen
        backgroundColor: "white",
        borderWidth: 1, // Độ dày viền
        borderRadius: 10, // Bo tròn góc
        marginTop: 10,
        width: '97%', // Đặt chiều rộng theo tỷ lệ phần trăm
        alignSelf: 'center' // Căn giữa input
    },
    itemContainer: {
        width: '48.5%',
        marginVertical: 5,
        padding: 10,
        borderRadius: 15,
        backgroundColor: '#fff',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 3,
        },
        shadowOpacity: 0.15,
        shadowRadius: 5,
        elevation: 6,
        borderWidth: 1,
        borderColor: '#f0f0f0',
    },
    itemContent: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    productImage: {
        width: 100,
        height: 100,
        borderRadius: 12,
        marginRight: 15,
    },
    productInfo: {
        flex: 1,
    },
    productTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 8,
    },
    productPrice: {
        fontSize: 17,
        color: '#FF8C00',
        fontWeight: '700',
        marginBottom: 5,
    },
    productDescription: {
        fontSize: 14,
        color: '#666',
        lineHeight: 20,
    },
    columnWrapper: {
        justifyContent: 'space-between',
        padding: 5
    },
})
