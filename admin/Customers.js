import React, { useState, useEffect } from "react";
import { View, FlatList, TouchableOpacity, Alert, StyleSheet, ScrollView, Image } from "react-native";
import { Text, TextInput, Button, Menu } from "react-native-paper";
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
    const [menuVisible, setMenuVisible] = useState(false);
    const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 });
    const [searchQuery, setSearchQuery] = useState('');

    const roles = ['admin', 'user', 'customer'];
    
    useEffect(() => {
        try {
            const usersRef = collection(firestore, 'USERS');
            const q = query(usersRef, where('role', 'in', ['user', 'customer']));
            
            const unsubscribe = onSnapshot(q, (querySnapshot) => {
                const usersData = [];
                querySnapshot.forEach((doc) => {
                    usersData.push({
                        ...doc.data(),
                        id: doc.id,
                    });
                });
                setCustomers(usersData);
            }, (error) => {
                console.error("Error fetching users:", error);
            });

            return () => unsubscribe();
        } catch (error) {
            console.error("Error setting up users listener:", error);
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

    const filteredCustomers = customers.filter(customer =>
        customer.email.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const renderEditForm = () => {
        if (!selectedCustomer || !editMode) return null;
        
        return (
            <ScrollView style={styles.editFormContainer}>
                <View style={styles.editForm}>
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
                    <View style={styles.roleSelector}>
                        <Text style={styles.roleSelectorLabel}>Chọn cấp bậc:</Text>
                        <View style={styles.roleButtons}>
                            {roles.map((role) => (
                                <Button
                                    key={role}
                                    mode={updatedCustomer.role === role ? "contained" : "outlined"}
                                    onPress={() => setUpdatedCustomer({ ...updatedCustomer, role: role })}
                                    style={styles.roleButton}
                                >
                                    {role}
                                </Button>
                            ))}
                        </View>
                    </View>
                    <View style={styles.formButtons}>
                        <Button 
                            mode="contained" 
                            onPress={handleSave} 
                            style={styles.saveButton}
                            icon={() => <Image source={require('../assets/correct.png')} style={{ width: 20, height: 20 }} />}
                        >
                            Lưu
                        </Button>
                        <Button 
                            mode="contained" 
                            onPress={() => setEditMode(false)}
                            style={styles.cancelButton}
                            icon={() => <Image source={require('../assets/close.png')} style={{ width: 15, height: 15, tintColor: 'white' }} />}
                        >
                            Trở lại
                        </Button>
                    </View>
                </View>
            </ScrollView>
        );
    };

    const renderItem = ({ item }) => {
        if (editMode) return null;
        
        return (
            <View style={styles.customerCard}>
                <TouchableOpacity 
                    onPress={() => toggleCustomerDetails(item)} 
                    style={styles.customerHeader}
                >
                    <Text style={styles.customerEmail} numberOfLines={1} ellipsizeMode="tail">
                        {item.email}
                    </Text>
                </TouchableOpacity>
                {selectedCustomer && selectedCustomer.id === item.id && !editMode && (
                    <View style={styles.customerDetails}>
                        <Text style={styles.detailText}>Mật khẩu: {'*'.repeat(item.password?.length || 0)}</Text>
                        <Text style={styles.detailText}>Tên: {item.fullName}</Text>
                        <Text style={styles.detailText}>Địa chỉ: {item.address}</Text>
                        <Text style={styles.detailText}>Điện thoại: {item.phone}</Text>
                        <Text style={styles.detailText}>Cấp bậc: {item.role}</Text>
                        <View style={styles.buttonContainer}>
                            <Button 
                                mode="contained" 
                                onPress={handleEdit} 
                                style={styles.editButton}
                                icon={() => <Image source={require('../assets/compose.png')} style={{ width: 20, height: 20 }} />}
                            >
                                Chỉnh sửa
                            </Button>
                            <Button 
                                mode="contained" 
                                onPress={() => handleDelete(item.id)} 
                                style={styles.deleteButton}
                                icon={() => <Image source={require('../assets/delete.png')} style={{ width: 20, height: 20 }} />}
                            >
                                Xoá
                            </Button>
                        </View>
                    </View>
                )}
            </View>
        );
    };

    const renderColumns = () => {
        const users = filteredCustomers.filter(user => user.role === 'user');
        const customers = filteredCustomers.filter(user => user.role === 'customer');

        return (
            <View style={styles.columnsContainer}>
                <View style={styles.column}>
                    <Text style={styles.columnHeader}>Nhân viên</Text>
                    <FlatList
                        data={users}
                        renderItem={renderItem}
                        keyExtractor={item => item.id}
                    />
                </View>
                <View style={styles.column}>
                    <Text style={styles.columnHeader}>Khách hàng</Text>
                    <FlatList
                        data={customers}
                        renderItem={renderItem}
                        keyExtractor={item => item.id}
                    />
                </View>
            </View>
        );
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.headerText}>Khách hàng</Text>
            </View>
            
            <TextInput
                placeholder="Tìm kiếm theo email..."
                value={searchQuery}
                onChangeText={setSearchQuery}
                style={styles.searchInput}
                mode="outlined"
                right={searchQuery ? (
                    <TextInput.Icon 
                        icon={() => <Image source={require('../assets/close.png')} style={{ width: 20, height: 20 }} />}
                        onPress={() => setSearchQuery('')}
                    />
                ) : null}
            />
           
            {editMode ? renderEditForm() : (
                renderColumns()
            )}
        </View>
    );
}
const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F0F2F5',
        paddingBottom: 20,
    },
    header: {
        padding: 20,
        backgroundColor: '#FF9800',
        elevation: 8,
        borderBottomLeftRadius: 15,
        borderBottomRightRadius: 15,
    },
    headerText: {
        color: 'black',
        fontSize: 26,
        fontWeight: 'bold',
        textAlign: 'center',
    },
    searchInput: {
        margin: 15,
        marginTop: 20,
        backgroundColor: 'white',
        elevation: 4,
        borderRadius: 25,
        height: 50,
        fontSize: 16,
    },
    customerCard: {
        marginVertical: 8,
        borderRadius: 15,
        backgroundColor: 'white',
        elevation: 4,
        borderWidth: 1,
        borderColor: '#E8E8E8',
        overflow: 'hidden',
        width: '100%',
        minHeight: 60,
    },
    customerHeader: {
        padding: 20,
        backgroundColor: '#FAFAFA',
        borderBottomWidth: 1,
        borderBottomColor: '#EEEEEE',
    },
    customerEmail: {
        fontSize: 16,
        fontWeight: "600",
        color: '#1A1A1A',
        letterSpacing: 0.5,
        flexWrap: 'wrap',
    },
    customerDetails: {
        padding: 20,
    },
    detailText: {
        fontSize: 16,
        marginBottom: 12,
        color: '#424242',
        lineHeight: 24,
        flexWrap: 'wrap',
    },
    buttonContainer: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginTop: 20,
        paddingHorizontal: 15,
        marginBottom: 10,
    },
    editButton: {
        flex: 1,
        marginRight: 10,
        backgroundColor: '#FF9800',
        borderRadius: 10,
        elevation: 2,
        paddingVertical: 8,
    },
    deleteButton: {
        flex: 1,
        marginLeft: 10,
        backgroundColor: '#FF5252',
        borderRadius: 10,
        elevation: 2,
        paddingVertical: 8,
    },
    editFormContainer: {
        flex: 1,
        paddingTop: 10,
    },
    editForm: {
        margin: 15,
        padding: 20,
        backgroundColor: 'white',
        borderRadius: 15,
        elevation: 4,
        borderWidth: 1,
        borderColor: '#E8E8E8',
    },
    roleSelector: {
        marginVertical: 20,
    },
    roleSelectorLabel: {
        fontSize: 16,
        marginBottom: 15,
        color: '#424242',
        fontWeight: '600',
    },
    roleButtons: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        flexWrap: 'wrap',
        gap: 10,
    },
    roleButton: {
        minWidth: 100,
        borderRadius: 8,
    },
    formButtons: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 25,
        gap: 15,
    },
    saveButton: {
        flex: 1,
        backgroundColor: '#4CAF50',
        borderRadius: 10,
        elevation: 2,
        paddingVertical: 8,
    },
    cancelButton: {
        flex: 1,
        backgroundColor: '#9E9E9E',
        borderRadius: 10,
        elevation: 2,
        paddingVertical: 8,
    },
    row: {
        flex: 1,
        justifyContent: 'space-between',
        paddingHorizontal: 7,
    },
    columnsContainer: {
        flex: 1,
        flexDirection: 'row',
        paddingHorizontal: 20,
    },
    column: {
        flex: 1,
        paddingHorizontal: 15,
        height: '100%',
    },
    columnHeader: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 10,
        color: '#424242',
    },
});
export default Customers;
