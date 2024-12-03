import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, Button } from 'react-native-paper';
import { auth, firestore } from '../firebaseconfig';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { Timestamp } from 'firebase/firestore';

const OrderDetail = ({ route, navigation }) => {
    const { order } = route.params;
    const [orderData, setOrderData] = useState('');
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchOrderData = async () => {
            console.log("Order ID received:", order?.id);
            
            if (!order?.id) {
                setError('Không có ID đơn hàng');
                return;
            }

            try {
                setError();
                setOrderData(null);

                const appointmentsRef = collection(firestore, 'Appointments');
                const querySnapshot = await getDocs(query(appointmentsRef, where('id', '==', order.id)));
                
                if (!querySnapshot.empty) {
                    const doc = querySnapshot.docs[0];
                    const data = doc.data();
                    if (!data) {
                        throw new Error('Dữ liệu đơn hàng không hợp lệ');
                    }
                    
                    setOrderData({
                        id: doc.id,
                        ...data,
                        datetime: data.datetime instanceof Timestamp ? 
                            data.datetime : 
                            new Date(data.datetime)
                    });
                } else {
                    setError('Không tìm thấy đơn hàng');
                }
            } catch (error) {
                setError('Lỗi khi lấy dữ liệu: ' + error.message);
                console.error("Lỗi khi lấy dữ liệu đơn hàng: ", error);
            }
        };

        fetchOrderData();
    }, [order?.id]);

    console.log("Current state:", { orderData, error });
    // Thêm hàm formatPrice
    const formatPrice = (price) => {
        return price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    };
    return (
        <View style={styles.container}>
            <Text style={styles.title}>Chi tiết đơn hàng</Text>
            <ScrollView style={styles.scrollView}>
                {orderData ? (
                    <View style={styles.orderDetails}>
                        <View style={styles.card}>
                            <Text style={styles.status}>
                                Trạng thái: 
                                <Text style={[
                                    styles.statusValue,
                                    {color: orderData.state === 'new' ? '#FFA500' : 
                                           orderData.state === 'complete' ? '#4CAF50' : '#000'}
                                ]}>
                                    {orderData.state === 'new' ? ' Đang duyệt' : 
                                     orderData.state === 'complete' ? ' Đã hoàn thành' : 
                                     orderData.state}
                                </Text>
                            </Text>
                            <Text style={styles.datetime}>
                                <Text style={styles.label}>Thời gian: </Text>
                                {orderData.datetime ? 
                                    (orderData.datetime instanceof Timestamp ? 
                                        orderData.datetime.toDate().toLocaleString() : 
                                        new Date(orderData.datetime).toLocaleString()
                                    ) : 'Không xác định'}
                            </Text>
                            <View style={styles.divider} />
                            <Text style={styles.totalPrice}>
                                <Text style={styles.label}>Tổng tiền: </Text>
                                <Text style={styles.priceValue}>{formatPrice(orderData.totalPrice)} vnđ</Text>
                            </Text>
                            <Text style={styles.paymentStatus}>
                                <Text style={styles.label}>Thanh toán: </Text>
                                <Text style={[
                                    styles.paymentStatusValue,
                                    {color: orderData.appointment === 'paid' ? '#4CAF50' : '#FF5722'}
                                ]}>
                                    {orderData.appointment === 'paid' ? 'Đã thanh toán' : 'Chưa thanh toán'}
                                </Text>
                            </Text>
                        </View>

                        <Text style={styles.summaryTitle}>Tóm tắt đơn hàng</Text>
                        {Array.isArray(orderData.services) ? (
                            orderData.services.map((service, index) => (
                                <View key={index} style={styles.serviceContainer}>
                                    <View style={styles.serviceRow}>
                                        <View style={styles.serviceInfo}>
                                            <Text style={styles.serviceTitle}>{service.title}</Text>
                                            <Text style={styles.quantity}>Số lượng: x{service.quantity}</Text>
                                        </View>
                                        <Text style={styles.servicePrice}>{formatPrice(service.price)} vnđ</Text>
                                    </View>
                                </View>
                            ))
                        ) : (
                            <Text style={styles.noServices}>Không có dịch vụ nào</Text>
                        )}
                    </View>
                ) : (
                    <View style={styles.loadingContainer}>
                        <Text style={styles.loadingText}>Đang tải dữ liệu...</Text>
                    </View>
                )}
            </ScrollView>
            <Button 
                mode="contained" 
                onPress={() => navigation.navigate("PaymentZalo", { orderId: orderData.id })} 
                style={[styles.button, { maxWidth: 300, maxHeight: 50, alignSelf: 'center' }]}
                labelStyle={styles.buttonLabel}
            >
                Thanh toán online
            </Button>
        </View>
    );
};

export default OrderDetail;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 16,
        backgroundColor: '#F5F5F5',
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        marginBottom: 24,
        color: '#333',
        textAlign: 'center',
    },
    card: {
        backgroundColor: '#FFF',
        borderRadius: 12,
        padding: 16,
        marginBottom: 20,
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    label: {
        color: '#666',
        fontWeight: '500',
    },
    status: {
        fontSize: 18,
        marginBottom: 12,
    },
    statusValue: {
        fontWeight: 'bold',
    },
    datetime: {
        fontSize: 16,
        marginBottom: 12,
        color: '#333',
    },
    divider: {
        height: 1,
        backgroundColor: '#E0E0E0',
        marginVertical: 12,
    },
    totalPrice: {
        fontSize: 20,
        marginBottom: 12,
    },
    priceValue: {
        fontWeight: 'bold',
        color: '#2196F3',
    },
    paymentStatus: {
        fontSize: 16,
    },
    paymentStatusValue: {
        fontWeight: 'bold',
    },
    summaryTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        marginBottom: 16,
        color: '#333',
        marginTop: 8,
    },
    serviceContainer: {
        backgroundColor: '#FFF',
        borderRadius: 8,
        padding: 16,
        marginBottom: 12,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
    },
    serviceRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    serviceInfo: {
        flex: 1,
    },
    serviceTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#333',
        marginBottom: 4,
    },
    quantity: {
        fontSize: 14,
        color: '#666',
    },
    servicePrice: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#2196F3',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        fontSize: 16,
        color: '#666',
    },
    button: {
        marginTop: 20,
        paddingVertical: 8,
        backgroundColor: '#2196F3',
        borderRadius: 8,
    },
    buttonLabel: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    noServices: {
        textAlign: 'center',
        color: '#666',
        fontSize: 16
    },
    scrollView: {
        flex: 1,
    },
});