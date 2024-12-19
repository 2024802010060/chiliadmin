import React, { useState, useEffect } from "react";
import { View, FlatList, StyleSheet, Alert,Button, TouchableOpacity, Modal, Image, Platform } from "react-native";
import { Text, Card, TextInput } from "react-native-paper";
import { Menu, MenuTrigger, MenuOptions, MenuOption } from 'react-native-popup-menu';
import { firestore } from '../firebaseconfig';
import { collection, onSnapshot, doc, updateDoc, deleteDoc, query, orderBy, Timestamp, getDoc, getDocs, where } from 'firebase/firestore';
import { useNavigation } from "@react-navigation/native";
import Icon from 'react-native-vector-icons/MaterialIcons';
import DateTimePicker from '@react-native-community/datetimepicker';


const CustomDatePicker = ({ value, onChange, onClear }) => {
  if (Platform.OS === 'web') {
    return (
      <View style={styles.datePickerContainer}>
        <View style={styles.dateInputContainer}>
          <input
            type="date"
            value={value && !isNaN(value.getTime()) ? value.toISOString().split('T')[0] : ''}
            onChange={(e) => {
              const date = new Date(e.target.value);
              if (!isNaN(date.getTime())) {
                onChange(null, date);
                setIsFilteringByDate(true);
              }
            }}
            onClick={(e) => {
              if (!value || isNaN(value.getTime())) {
                e.preventDefault();
                const today = new Date();
                onChange(null, today);
                setIsFilteringByDate(true);
                setTimeout(() => {
                  e.target.showPicker();
                }, 0);
              }
            }}
            style={{
              border: '1px solid #ddd',
              borderRadius: '4px',
              padding: '8px',
              fontSize: '14px',
              width: '200px',
              outline: 'none',
              cursor: 'pointer',
              '::-webkit-clear-button': {
                display: 'none'
              },
              '::-webkit-inner-spin-button': {
                display: 'none'
              },
              '::-webkit-calendar-picker-indicator': {
                marginRight: '5px',
                cursor: 'pointer'
              }
            }}
          />
          <TouchableOpacity 
            style={styles.clearButton}
            onPress={() => {
              onClear();
              setIsFilteringByDate(false);
            }}>
            <Text style={styles.clearText}>Clear</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  } else {
    return (
      <DateTimePicker
        value={value}
        mode="date"
        display="default"
        onChange={onChange}
      />
    );
  }
};

const Appointadmin = ({navigation}) => {
    const [appointments, setAppointments] = useState([]);
    const [modalVisible, setModalVisible] = useState(false);
    const [modalMessage, setModalMessage] = useState('');
    const [modalTitle, setModalTitle] = useState('');
    const [pendingDeleteId, setPendingDeleteId] = useState(null);
    const [isConfirmModal, setIsConfirmModal] = useState(false);
    const [searchId, setSearchId] = useState('');
    const [dateFilter, setDateFilter] = useState(new Date());
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [isFilteringByDate, setIsFilteringByDate] = useState(true);
    const [filterCompleted, setFilterCompleted] = useState(null);

    useEffect(() => {
        const appointmentsRef = collection(firestore, 'Appointments');
        const q = query(appointmentsRef, orderBy('datetime', 'desc'));

        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            const appointmentsData = [];
            querySnapshot.forEach((doc) => {
                const data = doc.data();
                appointmentsData.push({
                    docId: doc.id,
                    ...data,
                    datetime: data.datetime instanceof Timestamp ? 
                        data.datetime.toDate() : 
                        new Date(data.datetime)
                });
            });
            
            setAppointments(appointmentsData);
        });

        return () => unsubscribe();
    }, []);

    const handleUpdateStatus = async (appointmentId, newStatus) => {
        try {
            if (!appointmentId) {
                setModalTitle("Lỗi");
                setModalMessage("Không tìm thấy mã đơn hàng");
                setIsConfirmModal(false);
                setModalVisible(true);
                return;
            }

            const appointmentsRef = collection(firestore, 'Appointments');
            const q = query(appointmentsRef, where('id', '==', appointmentId));
            const querySnapshot = await getDocs(q);
            
            if (querySnapshot.empty) {
                setModalTitle("Lỗi");
                setModalMessage("Không tìm thấy đơn hàng trong hệ thống");
                setIsConfirmModal(false);
                setModalVisible(true);
                return;
            }

            const docRef = querySnapshot.docs[0].ref;
            await updateDoc(docRef, {
                state: newStatus
            });

            setModalTitle("Thành công");
            setModalMessage("Đã cập nhật trạng thái đơn hàng");
            setIsConfirmModal(false);
            setModalVisible(true);

        } catch (error) {
            console.error("Error updating appointment:", error);
            setModalTitle("Lỗi");
            setModalMessage(`Không thể cập nhật trạng thái đơn hàng: ${error.message}`);
            setIsConfirmModal(false);
            setModalVisible(true);
        }
    };

    const handleDelete = (appointmentId) => {
        setPendingDeleteId(appointmentId);
        setModalTitle("Xác nhận");
        setModalMessage("Bạn có chắc muốn xóa đơn hàng này?");
        setIsConfirmModal(true);
        setModalVisible(true);
    };

    const confirmDelete = async () => {
        try {
            await deleteDoc(doc(firestore, 'Appointments', pendingDeleteId));
            setModalVisible(false);
        } catch (error) {
            console.error("Error deleting appointment:", error);
            setModalTitle("Lỗi");
            setModalMessage("Không thể xóa đơn hàng");
            setIsConfirmModal(false);
            setModalVisible(true);
        }
    };

    const CustomModal = () => (
        <Modal
            animationType="fade"
            transparent={true}
            visible={modalVisible}
            onRequestClose={() => setModalVisible(false)}
        >
            <View style={styles.modalOverlay}>
                <View style={styles.modalContent}>
                    <Text style={styles.modalTitle}>{modalTitle}</Text>
                    <Text style={styles.modalMessage}>{modalMessage}</Text>
                    
                    {isConfirmModal ? (
                        <View style={styles.modalButtons}>
                            <TouchableOpacity 
                                style={[styles.modalButton, styles.cancelButton]}
                                onPress={() => setModalVisible(false)}>
                                <Text style={styles.buttonText}>Hủy</Text>
                            </TouchableOpacity>
                            <TouchableOpacity 
                                style={[styles.modalButton, styles.confirmButton]}
                                onPress={confirmDelete}>
                                <Text style={styles.buttonText}>Xác nhận</Text>
                            </TouchableOpacity>
                        </View>
                    ) : (
                        <TouchableOpacity 
                            style={[styles.modalButton, styles.okButton]}
                            onPress={() => setModalVisible(false)}>
                            <Text style={styles.buttonText}>OK</Text>
                        </TouchableOpacity>
                    )}
                </View>
            </View>
        </Modal>
    );

    const renderItem = ({ item }) => (
        <View style={styles.orderContainer}>
            <View style={styles.orderInfo}>
                <View style={styles.infoRow}>
                    <Image source={require('../assets/user.png')} style={{width: 20, height: 20}} />
                    <Text style={styles.infoText}>{item.fullName}</Text>
                </View>
                <View style={styles.divider} />
                
                <View style={styles.infoRow}>
                    <Image source={require('../assets/call.png')} style={{width: 20, height: 20}} />
                    <Text style={styles.infoText}>{item.phone}</Text>
                </View>
                <View style={styles.divider} />
                
                <View style={styles.infoRow}>
                    <Image source={require('../assets/clock.png')} style={{width: 20, height: 20}} />
                    <Text style={styles.timeText}>{item.datetime.toLocaleString('vi-VN')}</Text>
                    <Image source={require('../assets/assignment.png')} style={{width: 20, height: 20, marginLeft: 12}} />
                    <Text style={styles.timeText}>{item.id}</Text>
                </View>
                <View style={styles.divider} />
                
                <View style={styles.statusContainer}>
                    <View style={[styles.statusBadge, { marginRight: 8 },
                        {backgroundColor: 
                            item.state === 'new' ? '#F44336' :  // Red for 'Chờ xác nhận'
                            item.state === 'delivery' ? '#FF9800' :  // Orange for 'Chờ giao'
                            '#4CAF50'  // Green for 'Đã hoàn tất'
                        }]}>
                        <Text style={styles.statusText}>
                            {item.state === 'new' ? 'Chờ xác nhận' : 
                             item.state === 'delivery' ? 'Chờ giao' : 'Đã hoàn tất'}
                        </Text>
                    </View>
                    <View style={[styles.statusBadge,
                        {backgroundColor: item.appointment === 'paid' ? '#2196F3' : '#F44336'}]}>
                        <Text style={styles.statusText}>
                            {item.appointment === 'paid' ? 'Đã thanh toán' : 'Chưa thanh toán'}
                        </Text>
                    </View>
                </View>
            </View>

            <View style={styles.verticalDivider} />

            <View style={styles.buttonGroup}>
                <TouchableOpacity 
                    style={[styles.button, styles.detailButton]}
                    onPress={() => navigation.navigate('OrderDetail', { order: item })}>
                    <Image source={require('../assets/visibility.png')} style={{width: 22, height: 22}} />
                </TouchableOpacity>

                <TouchableOpacity 
                    style={[styles.button, styles.confirmButton]}
                    onPress={() => handleUpdateStatus(item.id, 'delivery')}>
                    <Image source={require('../assets/correct.png')} style={{width: 22, height: 22}} />
                </TouchableOpacity>

                <TouchableOpacity 
                    style={[styles.button, styles.deleteButton]}
                    onPress={() => handleDelete(item.id)}>
                    <Image source={require('../assets/delete.png')} style={{width: 22, height: 22}} />
                </TouchableOpacity>
            </View>
        </View>
    );

    const filteredAppointments = appointments.filter(appointment => {
        // First check if searching by ID
        if (searchId) {
            return appointment.id.toLowerCase().includes(searchId.toLowerCase());
        }

        // Then check date filter
        if (isFilteringByDate) {
            const appointmentDate = new Date(appointment.datetime);
            const filterDate = new Date(dateFilter);
            return appointmentDate.toDateString() === filterDate.toDateString();
        }

        // Then check completion status
        if (filterCompleted !== null) {
            if (filterCompleted) {
                // Complete orders: state is complete AND appointment is paid
                return appointment.state === 'complete' && appointment.appointment === 'paid';
            } else {
                // Incomplete orders: state is NOT complete OR appointment is NOT paid
                return appointment.state !== 'complete' || appointment.appointment !== 'paid';
            }
        }

        return true; // Show all appointments if no filters are active
    });

    const onDateChange = (event, selectedDate) => {
        setShowDatePicker(false);
        if (selectedDate) {
            setDateFilter(selectedDate);
            setIsFilteringByDate(true);
        }
    };

    const handleClearDate = () => {
        setIsFilteringByDate(false);
        setShowDatePicker(false);
        setDateFilter(new Date());
        setFilterCompleted(null); // Changed to null to indicate no completion filter
        setSearchId('');
    };

    const handleFilterIncomplete = () => {
        setFilterCompleted(false); // Set to false for incomplete orders
        setIsFilteringByDate(false);
    };

    const handleFilterComplete = () => {
        setFilterCompleted(true); // Set to true for complete orders
        setIsFilteringByDate(false);
    };

    return (
        <View style={{flex:1, backgroundColor:"white"}}>
            <CustomModal />
            <View style={styles.header}>
                <Text style={styles.headerText}>Đơn Hàng</Text>
            </View>
            
            <View style={styles.filterContainer}>
                <TextInput
                    style={styles.searchInput}
                    placeholder="Tìm theo ID đơn hàng"
                    value={searchId}
                    onChangeText={setSearchId}
                    mode="outlined"
                    left={<TextInput.Icon icon={require('../assets/search.png')} />}
                />
                <TouchableOpacity 
                    style={styles.dateButton}
                    onPress={() => setShowDatePicker(true)}>
                    <Image source={require('../assets/calendar.png')} style={{width: 20, height: 20}} />
                    <Text style={styles.dateButtonText}>
                        {dateFilter.toLocaleDateString('vi-VN')}
                    </Text>
                </TouchableOpacity>
            </View>

            <View style={styles.filterButtonsContainer}>
                <View style={styles.tabContainer}>
                    <TouchableOpacity
                        style={[
                            styles.tabButton,
                            filterCompleted === false && { backgroundColor: '#F44336' }
                        ]}
                        onPress={handleFilterIncomplete}
                    >
                        <View style={styles.tabContent}>
                            <Text style={[
                                styles.tabText,
                                filterCompleted === false && styles.activeTabText
                            ]}>Chưa hoàn thành</Text>
                        </View>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[
                            styles.tabButton,
                            filterCompleted === true && { backgroundColor: '#4CAF50' }
                        ]}
                        onPress={handleFilterComplete}
                    >
                        <View style={styles.tabContent}>
                            <Text style={[
                                styles.tabText,
                                filterCompleted === true && styles.activeTabText
                            ]}>Đã hoàn thành</Text>
                        </View>
                    </TouchableOpacity>
                </View>
            </View>

            {showDatePicker && (
                <CustomDatePicker
                    value={dateFilter}
                    onChange={onDateChange}
                    onClear={handleClearDate}
                />
            )}

            <FlatList
                data={filteredAppointments}
                renderItem={renderItem}
                keyExtractor={item => item.id}
            />
        </View>
    )
}

const styles = StyleSheet.create({
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
    webDateInput: {
        padding: 10,
        borderRadius: 5,
        borderWidth: 1,
        borderColor: '#666',
        backgroundColor: 'white',
    },
    orderContainer: {
        flexDirection: 'row',
        backgroundColor: '#fff',
        marginHorizontal: 10,
        marginVertical: 8,
        padding: 15,
        borderRadius: 12,
        elevation: 2,
        justifyContent: 'space-between',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#e0e0e0',
    },
    orderInfo: {
        flex: 1,
        marginRight: 15,
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 8,
    },
    divider: {
        height: 1,
        backgroundColor: '#f0f0f0',
        marginVertical: 2,
    },
    verticalDivider: {
        width: 1,
        height: '100%',
        backgroundColor: '#e0e0e0',
        marginHorizontal: 10,
    },
    infoText: {
        marginLeft: 8,
        fontSize: 15,
        color: '#333',
        fontWeight: '500',
    },
    timeText: {
        marginLeft: 8,
        fontSize: 14,
        color: '#666',
    },
    statusBadge: {
        alignSelf: 'flex-start',
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 15,
        marginTop: 8,
    },
    statusText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: 'bold',
        textTransform: 'uppercase',
    },
    buttonGroup: {
        width: 40,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
    },
    button: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#fff',
        alignItems: 'center',
        justifyContent: 'center',
        elevation: 2,
        borderWidth: 1,
        padding: 0,
    },
    detailButton: {
        borderColor: '#2196F3',
    },
    confirmButton: {
        borderColor: '#4CAF50',
    },
    deleteButton: {
        borderColor: '#F44336',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContent: {
        backgroundColor: 'white',
        borderRadius: 20,
        padding: 20,
        width: '80%',
        alignItems: 'center',
        elevation: 5,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 10,
    },
    modalMessage: {
        fontSize: 16,
        marginBottom: 20,
        textAlign: 'center',
    },
    modalButtons: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        width: '100%',
    },
    modalButton: {
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 10,
        minWidth: 100,
        alignItems: 'center',
    },
    cancelButton: {
        backgroundColor: '#f44336',
        marginRight: 10,
    },
    
    okButton: {
        backgroundColor: '#2196F3',
        minWidth: 150,
    },
    buttonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
    },
    statusContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 8,
    },
    filterContainer: {
        flexDirection: 'row',
        padding: 10,
        alignItems: 'center',
        gap: 10,
    },
    searchInput: {
        flex: 1,
        backgroundColor: 'white',
    },
    dateButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'white',
        padding: 10,
        borderRadius: 5,
        borderWidth: 1,
        borderColor: '#666',
        gap: 5,
    },
    dateButtonText: {
        color: '#666',
        fontSize: 14,
    },
    datePickerContainer: {
        position: 'absolute',
        right: 10,
        top: 60,
        backgroundColor: 'white',
        borderRadius: 8,
        padding: 10,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
        zIndex: 1000,
    },
    dateInputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    clearButton: {
        backgroundColor: '#f0f0f0',
        padding: 8,
        borderRadius: 4,
    },
    clearText: {
        color: '#2196F3',
        fontSize: 14,
        fontWeight: '500',
    },
    calendarContainer: {
        backgroundColor: 'white',
        borderRadius: 8,
        overflow: 'hidden',
    },
    filterButtonsContainer: {
        paddingHorizontal: 16,
        paddingVertical: 8,
    },
    tabContainer: {
        flexDirection: 'row',
        backgroundColor: '#F5F5F5',
        borderRadius: 12,
        padding: 4,
    },
    tabButton: {
        flex: 1,
        paddingVertical: 12,
        borderRadius: 8,
    },
    activeTab: {
        backgroundColor: '#FF9800',
    },
    tabContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
    },
    tabIcon: {
        width: 20,
        height: 20,
        tintColor: '#666',
    },
    activeIcon: {
        tintColor: '#FFF',
    },
    tabText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#666',
    },
    activeTabText: {
        color: '#FFF',
    },
});
export default Appointadmin;
