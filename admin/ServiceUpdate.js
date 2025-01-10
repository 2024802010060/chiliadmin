import React, { useState, useEffect } from "react";
import { View, Image, StyleSheet, TouchableOpacity, Alert, Modal, ActivityIndicator } from 'react-native'
import { Text, TextInput } from "react-native-paper";
import { auth, firestore, storage } from '../firebaseconfig';
import * as ImagePicker from 'expo-image-picker';
import { doc, updateDoc, deleteDoc, collection, getDocs, query, where, addDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { LinearGradient } from 'expo-linear-gradient';
import { ScrollView } from "react-native-gesture-handler";

const ServiceUpdate = ({ route, navigation }) => {
    const { service } = route.params;
    const [title, setTitle] = useState(service.title);
    const [price, setPrice] = useState(service.price);
    const [imagePath, setImagePath] = useState(service.image);
    const [isLoading, setIsLoading] = useState(false);
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false);
    const [displayNumber, setDisplayNumber] = useState('0');
    const [categories, setCategories] = useState([]);
    const TYPE = collection(firestore, "Type");
    const [type, setType] = useState(service.type);
    const [isAddingType, setIsAddingType] = useState(false);
    const [showErrorModal, setShowErrorModal] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const [showDeleteTypeModal, setShowDeleteTypeModal] = useState(false);
    const [typeToDelete, setTypeToDelete] = useState(null);

    const handleDelete = (service) => {
        setShowDeleteConfirmModal(true);
    };
    // Thêm loại sản phẩm mới vào Firebase
    const handleAddType = async (type) => {
        if (!type) {
            showError("Vui lòng nhập loại sản phẩm");
            return;
        }

        setIsAddingType(true);
        try {
            // Check if type already exists
            const querySnapshot = await getDocs(query(TYPE, where("type", "==", type)));
            if (!querySnapshot.empty) {
                showError("Loại sản phẩm này đã tồn tại");
                return;
            }

            await addDoc(TYPE, { type });
            await fetchCategories();
            setType('');
            Alert.alert("Thành công", "Đã thêm loại s��n phẩm mới");
        } catch (error) {
            console.error("Error adding type:", error);
            Alert.alert("Lỗi", "Không thể thêm loại sản phẩm. Vui lòng thử lại.");
        } finally {
            setIsAddingType(false);
        }
    }
    // Xóa loại sản phẩm
    const handleMinusType = async (type) => {
        if (!type) {
            showError("Vui lòng chọn loại sản phẩm cần xóa");
            return;
        }
        setTypeToDelete(type);
        setShowDeleteTypeModal(true);
    };

    const handleConfirmTypeDelete = async () => {
        setShowDeleteTypeModal(false);
        setIsLoading(true);
        
        try {
            const querySnapshot = await getDocs(query(TYPE, where("type", "==", typeToDelete)));
            const deletePromises = querySnapshot.docs.map(doc => deleteDoc(doc.ref));
            await Promise.all(deletePromises);
            
            setIsLoading(false);
            await fetchCategories();
            setType('');
            Alert.alert("Thành công", "Đã xóa thể loại thành công");
        } catch (error) {
            setIsLoading(false);
            console.error("Lỗi khi xóa thể loại:", error);
            showError("Không thể xóa thể loại. Vui lòng thử lại.");
        }
    };

    const handleConfirmDelete = async () => {
        setShowDeleteConfirmModal(false);
        setIsLoading(true);
        
        try {
            await deleteDoc(doc(firestore, 'Services', service.id));
            
            const imageRef = ref(storage, `/services/${service.id}.png`);
            await deleteObject(imageRef);

            setIsLoading(false);
            setShowSuccessModal(true);
        } catch (error) {
            setIsLoading(false);
            console.error("Lỗi khi xóa dịch vụ:", error);
            Alert.alert("Lỗi", "Không thể xóa sản phẩm. Vui lòng thử lại.");
        }
    };
    const handleUpdateService = async () => {
        if (!title.trim()) {
            showError("Vui lòng nhập tên sản phẩm.");
            return;
        }
        if (!price.trim()) {
            showError("Vui lòng nhập giá sản phẩm.");
            return;
        }
        if (!type.trim()) {
            showError("Vui lòng chọn loại sản phẩm.");
            return;
        }
        setIsLoading(true);
        try {
            const serviceRef = doc(firestore, 'Services', service.id);
            await updateDoc(serviceRef, {
                title: title,
                price: price,
                type: type
            });

            if (imagePath !== service.image) {
                const storageRef = ref(storage, `/services/${service.id}.png`);
                const response = await fetch(imagePath);
                const blob = await response.blob();
                
                await uploadBytes(storageRef, blob);
                const imageLink = await getDownloadURL(storageRef);
                await updateDoc(serviceRef, {
                    image: imageLink
                });
            }

            setIsLoading(false);
            setShowSuccessModal(true);
        } catch (error) {
            setIsLoading(false);
            console.error("Lỗi khi cập nhật dịch vụ:", error);
            Alert.alert("Lỗi", "Không thể cập nhật sản phẩm. Vui lòng thử lại.");
        }
    }

    const handleUploadImage = async () => {
        try {
            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                aspect: [4, 3],
                quality: 1,
            });

            if (!result.canceled) {
                setImagePath(result.assets[0].uri);
            }
        } catch (e) {
            console.log(e.message);
        }
    };

    const formatToVND = (value) => {
        return value.replace(/\D/g, '');
    }
    
    const handlePriceChange = (text) => {
        const numericValue = text.replace(/\D/g, '');
        setPrice(numericValue);
    }

    const formatNumber = (num) => {
        const actualNum = Math.floor(num / 1000);
        return actualNum.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    }

    useEffect(() => {
        let currentNumber = 0;
        const targetNumber = parseInt(price);
        const duration = 1; // Thời gian chạy animation (1 giây)
        const steps = 1; // Số bước trong animation
        const increment = targetNumber / steps;
        let step = 0;

        const timer = setInterval(() => {
            step++;
            currentNumber = Math.min(Math.floor(increment * step), targetNumber);
            setDisplayNumber(formatNumber(currentNumber));

            if (currentNumber >= targetNumber) {
                clearInterval(timer);
            }
        }, duration / steps);

        return () => clearInterval(timer);
    }, []); // Chỉ chạy một lần khi component mount

    const fetchCategories = async () => {
        const categorySnapshot = await getDocs(TYPE);
        const categoryList = categorySnapshot.docs.map(doc => doc.data().type);
        setCategories(categoryList);
    };

    useEffect(() => {
        fetchCategories();
    }, []);

    const showError = (message) => {
        setErrorMessage(message);
        setShowErrorModal(true);
    };

    return (
        <ScrollView style={styles.container}>
            <View style={styles.formContainer}>
                <View style={styles.inputContainer}>
                    <View style={styles.leftColumn}>
                        <View style={styles.inputWrapper}>
                            <Text style={styles.label}>Tên sản phẩm :</Text>
                            <TextInput
                                placeholder="Nhập tên sản phẩm"
                                value={title}
                                onChangeText={setTitle}
                                style={styles.textInput}
                                placeholderTextColor="#999"
                            />
                        </View>

                        <View style={styles.inputWrapper}>
                            <Text style={styles.label}>Giá :</Text>
                            <TextInput
                                placeholder="0"
                                value={price}
                                onChangeText={handlePriceChange}
                                keyboardType="numeric"
                                style={styles.textInput}
                                right={<TextInput.Affix text=" VNĐ" />}
                                placeholderTextColor="#999"
                            />
                        </View>

                        <View style={styles.categorySection}>
                            <Text style={styles.label}>Loại sản phẩm :</Text>
                            <TextInput
                                style={styles.textInput}
                                placeholder="Loại sản phẩm"
                                value={type}
                                
                                placeholderTextColor="#999"
                                onChangeText={setType}
                            />
                        </View>
                        <View style={styles.existingCategories}>
                    <View style={styles.categoryHeader}>
                        <Text style={styles.label}>Loại sản phẩm hiện có :</Text>
                        <View style={styles.categoryActions}>
                            <TouchableOpacity onPress={() => handleAddType(type)}>
                                <Image source={require('../assets/addgreen.png')} style={styles.actionIcon} />
                            </TouchableOpacity>
                            <TouchableOpacity onPress={() => handleMinusType(type)}>
                                <Image source={require('../assets/minus.png')} style={styles.actionIcon} />
                            </TouchableOpacity>
                        </View>
                    </View>
                    
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryList}>
                        {categories.map((category, index) => (
                            <TouchableOpacity 
                                key={index} 
                                style={[styles.categoryChip, setType === category && styles.selectedChip]} 
                                onPress={() => {
                                    setType(category);
                                    
                                }}
                            >
                                <Text style={[styles.categoryChipText, setType === category && styles.selectedChipText]}>
                                    {category}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </View>
                    </View>

                    <View style={styles.rightColumn}>
                        <TouchableOpacity 
                            style={styles.uploadButton}
                            onPress={handleUploadImage}
                        >
                            <LinearGradient
                                colors={['#FF9F40', '#FF7C00']}
                                style={styles.uploadGradient}
                            >
                                <Text style={styles.uploadText}>Upload Ảnh</Text>
                            </LinearGradient>
                        </TouchableOpacity>
                        
                        {imagePath ? (
                            <View style={styles.imageContainer}>
                                <Image source={{ uri: imagePath }} style={styles.previewImage} />
                            </View>
                        ) : (
                            <View style={styles.placeholderContainer}>
                                <Text style={styles.placeholderText}>Chưa có ảnh</Text>
                            </View>
                        )}
                    </View>
                </View>

                <View style={styles.buttonContainer}>
                    <View style={styles.buttonRow}>
                        <TouchableOpacity 
                            style={[styles.submitButton, styles.buttonFlex]}
                            onPress={handleUpdateService}
                        >
                            <LinearGradient
                                colors={['#4CAF50', '#45A049']}
                                style={styles.submitGradient}
                            >
                                <Text style={styles.submitText}>Cập nhật sản phẩm</Text>
                            </LinearGradient>
                        </TouchableOpacity>

                        <TouchableOpacity 
                            style={[styles.submitButton, styles.buttonFlex]}
                            onPress={handleDelete}
                        >
                            <LinearGradient
                                colors={['#f44336', '#d32f2f']}
                                style={styles.submitGradient}
                            >
                                <Text style={styles.submitText}>Xoá sản phẩm</Text>
                            </LinearGradient>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>

            <Modal
                visible={showSuccessModal}
                transparent={true}
                animationType="fade"
            >
                <View style={styles.modalContainer}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalText}>Thao tác thành công!</Text>
                        <TouchableOpacity
                            style={[styles.modalButton, { backgroundColor: '#4CAF50' }]}
                            onPress={() => {
                                setShowSuccessModal(false);
                                navigation.navigate("Services");
                            }}
                        >
                            <Text style={[styles.modalButtonText, { color: '#fff' }]}>OK</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            <Modal
                visible={isLoading}
                transparent={true}
                animationType="fade"
            >
                <View style={styles.modalContainer}>
                    <View style={styles.loadingContent}>
                        <ActivityIndicator size="large" color="#4CAF50" />
                        <Text style={styles.loadingText}>Đang xử lý...</Text>
                    </View>
                </View>
            </Modal>

            <Modal
                visible={showDeleteConfirmModal}
                transparent={true}
                animationType="fade"
            >
                <View style={styles.modalContainer}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalText}>Bạn có chắc muốn xóa sản phẩm?</Text>
                        <View style={styles.modalButtonRow}>
                            <TouchableOpacity
                                style={[styles.modalButton, styles.modalButtonCancel]}
                                onPress={() => setShowDeleteConfirmModal(false)}
                            >
                                <Text style={styles.modalButtonText}>Trở lại</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.modalButton, styles.modalButtonDelete]}
                                onPress={handleConfirmDelete}
                            >
                                <Text style={styles.modalButtonText}>Xóa</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            <Modal
                visible={showErrorModal}
                transparent={true}
                animationType="fade"
            >
                <View style={styles.modalContainer}>
                    <View style={styles.modalContent}>
                        <Text style={[styles.modalText, { color: '#f44336' }]}>{errorMessage}</Text>
                        <TouchableOpacity
                            style={[styles.modalButton, { backgroundColor: '#f44336' }]}
                            onPress={() => setShowErrorModal(false)}
                        >
                            <Text style={styles.modalButtonText}>Đóng</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            <Modal
                visible={showDeleteTypeModal}
                transparent={true}
                animationType="fade"
            >
                <View style={styles.modalContainer}>
                    <View style={[styles.modalContent, { alignItems: 'center' }]}>
                        <Text style={[styles.modalText, { textAlign: 'center' }]}>
                            Bạn có chắc muốn xóa loại sản phẩm này?
                        </Text>
                        <View style={[styles.modalButtonRow, { justifyContent: 'center' }]}>
                            <TouchableOpacity
                                style={[styles.modalButton, styles.modalButtonCancel]}
                                onPress={() => setShowDeleteTypeModal(false)}
                            >
                                <Text style={[styles.modalButtonText, { textAlign: 'center' }]}>Trở lại</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.modalButton, styles.modalButtonDelete]}
                                onPress={handleConfirmTypeDelete}
                            >
                                <Text style={[styles.modalButtonText, { textAlign: 'center' }]}>Xóa</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    formContainer: {
        padding: 15,
    },
    inputContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 15,
    },
    leftColumn: {
        flex: 1,
        marginRight: 10,
    },
    rightColumn: {
        width: '35%',
        alignItems: 'center',
        justifyContent: 'flex-start',
    },
    inputWrapper: {
        marginBottom: 15,
    },
    categorySection: {
        marginBottom: 20,
    },
    label: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        lineHeight: 24,
    },
    textInput: {
        backgroundColor: '#f5f5f5',
        borderRadius: 8,
        height: 45,
        borderWidth: 1,
        borderColor: '#ddd',
        paddingHorizontal: 10,
    },
    uploadButton: {
        marginBottom: 10,
    },
    uploadGradient: {
        padding: 12,
        borderRadius: 8,
        alignItems: 'center',
    },
    uploadText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    imageContainer: {
        borderRadius: 15,
        overflow: 'hidden',
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
    },
    previewImage: {
        width: 200,
        height: 180,
        borderRadius: 15,
    },
    placeholderContainer: {
        width: 200,
        height: 180,
        backgroundColor: '#f5f5f5',
        borderRadius: 15,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#ddd',
        borderStyle: 'dashed',
    },
    placeholderText: {
        color: '#999',
        fontSize: 16,
    },
    buttonContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    buttonRow: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 20,
        width: '100%',
        maxWidth: 800,
    },
    submitButton: {
        marginTop: 20,
        flex: 1,
        maxWidth: 200,
    },
    submitGradient: {
        padding: 15,
        borderRadius: 8,
        width: '100%',
        alignItems: 'center',
        justifyContent: 'center',
    },
    submitText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },
    modalContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    modalContent: {
        backgroundColor: '#fff',
        padding: 20,
        borderRadius: 10,
        width: '80%',
        maxWidth: 400,
        alignItems: 'center',
    },
    modalText: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 20,
    },
    modalButton: {
        flex: 1,
        padding: 12,
        borderRadius: 5,
        maxWidth: 120,
        alignItems: 'center',
        justifyContent: 'center',
    },
    modalButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
        textAlign: 'center',
    },
    loadingContent: {
        backgroundColor: '#fff',
        padding: 20,
        borderRadius: 10,
        alignItems: 'center',
    },
    loadingText: {
        fontSize: 18,
        fontWeight: 'bold',
        marginTop: 10,
    },
    modalButtonRow: {
        flexDirection: 'row',
        justifyContent: 'center',
        width: '100%',
        gap: 10,
        marginTop: 10,
        paddingHorizontal: 20,
    },
    modalButtonCancel: {
        backgroundColor: '#757575',
    },
    modalButtonDelete: {
        backgroundColor: '#f44336',
    },
    actionIcon: {
        width: 20,
        height: 20,
        alignSelf: 'center',
    },
    categoryHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
        gap: 10,
    },
    categoryActions: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        height: 24,
    },
    actionIcon: {
        width: 20,
        height: 20,
        alignSelf: 'center',
    },
    categoryList: {
        marginTop: 10,
    },
    categoryChip: {
        paddingHorizontal: 15,
        paddingVertical: 8,
        backgroundColor: '#f0f0f0',
        borderRadius: 20,
        marginRight: 10,
    },
    selectedChip: {
        backgroundColor: '#FFB75E',
    },
    categoryChipText: {
        color: '#333',
    },
    selectedChipText: {
        color: '#fff',
    },
})
export default ServiceUpdate;
