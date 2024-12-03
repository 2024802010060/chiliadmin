import React, { useState, useEffect } from "react";
import { View, FlatList, TouchableOpacity, Alert, StyleSheet } from "react-native";
import { Text, TextInput, Button } from "react-native-paper";
import { firestore } from '../firebaseconfig';
import { collection, query, where, onSnapshot, doc, deleteDoc, updateDoc } from 'firebase/firestore';
import { useMyContextProvider } from "../index";

const Customers = () => {
    const [customers, setCustomers] = useState([]);
    const [selectedCustomer, setSelectedCustomer] = useState(null);
    const [editMode, setEditMode] = useState(false);
    const [updatedCustomer, setUpdatedCustomer] = useState({});
    const [controller, dispatch] = useMyContextProvider();
    const { userLogin } = controller;
    
    useEffect(() => {
        try {
            const customersRef = collection(firestore, 'USERS');
            const q = query(customersRef, where('role', '==', 'customer'));
            
            const unsubscribe = onSnapshot(q, (querySnapshot) => {
                const customersData = [];
                querySnapshot.forEach((doc) => {
                    customersData.push({
                        ...doc.data(),
                        id: doc.email,
                    });
                });
                setCustomers(customersData);
            }, (error) => {
                console.error("Error fetching customers:", error);
            });

            return () => unsubscribe();
        } catch (error) {
            console.error("Error setting up customer listener:", error);
        }
    }, []);

    const handleDelete = (customerId) => {
        Alert.alert(
            "Cảnh báo",
            "Bạn có chắc chắn muốn xóa khách hàng này?",
            [
                { text: "Hủy", style: "cancel" },
                {
                    text: "Xóa",
                    onPress: async () => {
                        try {
                            await deleteDoc(doc(firestore, 'USERS', customerId));
                            setSelectedCustomer(null);
                        } catch (error) {
                            console.error("Lỗi khi xóa khách hàng:", error);
                        }
                    }
                }
            ]
        );
    };

    const handleSave = async () => {
        try {
            const customerRef = doc(firestore, 'USERS', selectedCustomer.id);
            await updateDoc(customerRef, updatedCustomer);
            setEditMode(false);
            setSelectedCustomer(updatedCustomer);
        } catch (error) {
            console.error("Lỗi khi cập nhật khách hàng:", error);
        }
    };

    const toggleCustomerDetails = (customer) => {
        if (selectedCustomer && selectedCustomer.id === customer.id) {
            setSelectedCustomer(null);
            setEditMode(false);
        } else {
            setSelectedCustomer(customer);
            setUpdatedCustomer(customer);
            setEditMode(false);
        }
    };

    const handleEdit = () => {
        setEditMode(true);
    };

    const renderItem = ({ item }) => (
        <View style={{ margin: 10, padding: 10, borderRadius: 15, marginVertical: 5, backgroundColor: '#E0EEE0' }}>
            <TouchableOpacity onPress={() => toggleCustomerDetails(item)} style={{ padding: 15, borderRadius: 15 }}>
                <Text style={{ fontSize: 18, fontWeight: "bold" }}>{item.email}</Text>
            </TouchableOpacity>
            {selectedCustomer && selectedCustomer.id === item.id && (
                <View style={{ marginTop: 10 }}>
                    {editMode ? (
                        <View>
                            <TextInput
                                label="Email"
                                value={updatedCustomer.email}
                                onChangeText={(text) => setUpdatedCustomer({ ...updatedCustomer, email: text })}
                                style={{ marginBottom: 10 }}
                            />
                            <TextInput
                                label="Password"
                                value={updatedCustomer.password}
                                onChangeText={(text) => setUpdatedCustomer({ ...updatedCustomer, password: text })}
                                style={{ marginBottom: 10 }}
                            />
                            <TextInput
                                label="Full Name"
                                value={updatedCustomer.fullName}
                                onChangeText={(text) => setUpdatedCustomer({ ...updatedCustomer, fullName: text })}
                                style={{ marginBottom: 10 }}
                            />
                            <TextInput
                                label="Address"
                                value={updatedCustomer.address}
                                onChangeText={(text) => setUpdatedCustomer({ ...updatedCustomer, address: text })}
                                style={{ marginBottom: 10 }}
                            />
                            <TextInput
                                label="Phone"
                                value={updatedCustomer.phone}
                                onChangeText={(text) => setUpdatedCustomer({ ...updatedCustomer, phone: text })}
                                style={{ marginBottom: 10 }}
                            />
                            <TextInput
                                label="Role"
                                value={updatedCustomer.role}
                                onChangeText={(text) => setUpdatedCustomer({ ...updatedCustomer, role: text })}
                                style={{ marginBottom: 10 }}
                            />
                            <Button mode="contained" onPress={handleSave} style={{ marginBottom: 10 }}>
                                Lưu
                            </Button>
                            <Button mode="contained" onPress={() => setEditMode(false)}>
                                Trở lại
                            </Button>
                        </View>
                    ) : (
                        <View >
                            <Text style={styles.text}>Email: {item.email}</Text>
                            <Text style={styles.text}>Mật khẩu: {item.password}</Text>
                            <Text style={styles.text}>Tên: {item.fullName}</Text>
                            <Text style={styles.text}>Địa chỉ: {item.address}</Text>
                            <Text style={styles.text}>Điện thoại: {item.phone}</Text>
                            <Text style={styles.text}>Cấp bậc: {item.role}</Text>
                            <View style={{
                                flexDirection: "row",
                                alignItems: "center",
                                justifyContent: "space-between"
                            }}>
                            <Button mode="contained" onPress={handleEdit} style={{ marginTop: 10, backgroundColor:"white"}} textColor="black">
                                Chỉnh sửa
                            </Button>
                            <Button mode="contained" onPress={() => handleDelete(item.id)} style={{ marginTop: 10, backgroundColor: 'red' }}>
                                Xoá
                            </Button>
                            </View>
                        </View>
                    )}
                </View>
            )}
        </View>
        
    );

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.headerText}>Khách hàng</Text>
                
            </View>
           
            <FlatList
                data={customers}
                renderItem={renderItem}
                keyExtractor={item => item.id}
            />
        </View>
     
    );
}
const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: 'white',
    },
    text: {
        fontSize: 17, fontWeight: "bold"
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 15,
        backgroundColor: 'orange',
    },
    headerText: {
        color: 'black',
        fontSize: 25,
        fontWeight: 'bold',
    },
    logoutIcon: {
        width: 30,
        height: 30,
    },
    list: {
        padding: 10,
    },
    card: {
        margin: 10,
        borderRadius: 8,
        elevation: 3,
        backgroundColor: 'white',
    },
    title: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    dateTime: {
        color: 'gray',
        marginTop: 5,
    },
    menuOption: {
        fontSize: 16,
        padding: 10,
    },
});
export default Customers;
