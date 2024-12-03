import React, { useState, useEffect } from "react"
import { View, Image,StyleSheet, Alert,TouchableOpacity, Modal, ActivityIndicator } from "react-native"
import { Text, TextInput } from "react-native-paper"
import { firestore, storage } from '../firebaseconfig';

import * as ImagePicker from 'expo-image-picker';
import { useMyContextProvider } from "../index"
import { ScrollView } from "react-native-gesture-handler"

import { collection, addDoc, updateDoc, doc, getDocs, query, where, deleteDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { LinearGradient } from 'expo-linear-gradient';

const AddNewService = ({navigation}) => {
    // === STATE QUẢN LÝ DỮ LIỆU ===
    const [controller, dispatch] = useMyContextProvider()  // Context để quản lý trạng thái chung của ứng dụng
    const {userLogin} = controller                        // Thông tin người dùng đang đăng nhập
    const [imagePath, setImagePath] = useState('')        // Lưu đường dẫn của ảnh sản phẩm
    const [title, setTitle] = useState('')                // Lưu tên sản phẩm
    const [price, setPrice] = useState('')                // Lưu giá sản phẩm
    const [type, setType] = useState('')                  // Lưu loại sản phẩm
    const SERVICES = collection(firestore, "Services")    // Kết nối với bảng Services trong Firestore
    const TYPE = collection(firestore, "Type")            // Kết nối với bảng Type trong Firestore
    const [categories, setCategories] = useState([])      // Mảng chứa danh sách các loại sản phẩm
    const [isLoading, setIsLoading] = useState(false)     // Quản lý trạng thái đang tải
    const [showSuccessModal, setShowSuccessModal] = useState(false) // Điều khiển hiển thị thông báo thành công
    
    // Lấy danh sách loại sản phẩm từ Firebase
    const fetchCategories = async () => {
        const categorySnapshot = await getDocs(query(TYPE));
        const categoryList = categorySnapshot.docs.map(doc => doc.data().type);
        setCategories(categoryList);
    };
    
    // Load danh sách loại sản phẩm khi component được tạo
    useEffect(() => {
        fetchCategories();
    }, []);
    
    // Xử lý thêm sản phẩm mới vào Firebase
    const handleAddNewService = async () => {
        console.log("Starting handleAddNewService"); // Debug log

        if (!imagePath) {
            Alert.alert("Lỗi", "Vui lòng chọn ảnh cho sản phẩm.");
            return;
        }
        if (!title.trim()) {
            Alert.alert("Lỗi", "Vui lòng nhập tên sản phẩm.");
            return;
        }
        if (!price.trim()) {
            Alert.alert("Lỗi", "Vui lòng nhập giá sản phẩm.");
            return;
        }
        if (!type.trim()) {
            Alert.alert("Lỗi", "Vui lòng chọn loại sản phẩm.");
            return;
        }

        setIsLoading(true);
        try {
            console.log("Adding document to Firestore"); // Debug log
            const docRef = await addDoc(SERVICES, {
                title,
                price: price + '000',
                type,
                create: userLogin.email
            });

            console.log("Document added, uploading image"); // Debug log
            const response = await fetch(imagePath);
            const blob = await response.blob();

            const storageRef = ref(storage, `/services/${docRef.id}.png`);
            await uploadBytes(storageRef, blob);
            const downloadURL = await getDownloadURL(storageRef);

            console.log("Image uploaded, updating document"); // Debug log
            await updateDoc(doc(firestore, "Services", docRef.id), {
                id: docRef.id,
                image: downloadURL
            });

            setIsLoading(false);
            setShowSuccessModal(true);
        } catch (error) {
            console.error(error);
            setIsLoading(false);
            Alert.alert("Lỗi", "Không thể thêm sản phẩm. Vui lòng thử lại.");
        }
    };
    // Thêm loại sản phẩm mới vào Firebase
    const handleAddType = (type) => {
        addDoc(TYPE, {
            type
        })
        .then(() => {
            fetchCategories();
            setType('');
        })
        .catch(error => {
            console.error("Error adding type:", error);
            Alert.alert("Lỗi", "Không thể thêm loại sản phẩm. Vui lòng thử lại.");
        });
    }
    // Xử lý xóa loại sản phẩm
    const handleMinusType = (type) => {
        Alert.alert(
            "Cảnh báo!",
            "Bạn có chắc muốn xóa thể loại này không?",
            [
                {
                    text: "Trở lại",
                    style: "cancel"
                },
                {
                    text: "Xóa",
                    onPress: () => {
                        getDocs(query(TYPE, where("type", "==", type)))
                            .then((querySnapshot) => {
                                // Delete each matching document
                                querySnapshot.docs.forEach((doc) => {
                                    deleteDoc(doc.ref);
                                });
                                console.log("Thể loại đã được xóa thành công!");
                                // Fetch categories again after deletion
                                fetchCategories();
                                setType('');
                            })
                            .catch(error => {
                                console.error("Lỗi khi xóa dịch vụ:", error);
                            });
                    },
                    style: "default"
                }
            ]
        );
    }
    
    // Xử lý chọn ảnh từ thư viện
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

    // Định dạng số thành tiền VND
    const formatToVND = (value) => {
        // Remove non-digit characters
        const numericValue = value.replace(/\D/g, '');
        // Format to VND
        return numericValue ? numericValue.replace(/\B(?=(\d{3})+(?!\d))/g, '.') + '': '';
    }

    const handlePriceChange = (text) => {
        // Remove all non-digit characters
        const numericValue = text.replace(/\D/g, '');
        // Format and set the new value without moving the cursor
        const formattedValue = numericValue ? formatToVND(numericValue) : '';
        setPrice(formattedValue);
    }

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
                                right={<TextInput.Affix text=".000 VNĐ" />}
                                placeholderTextColor="#999"
                            />
                        </View>
                        <View style={styles.categorySection}>
                    <Text style={styles.label}>Loại sản phẩm :</Text>
                    <TextInput
                        placeholder="Loại sản phẩm"
                        value={type}
                        onChangeText={setType}
                        style={styles.textInput}
                        placeholderTextColor="#999"
                    />
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
                        
                        {imagePath !== "" ? (
                            <View style={styles.imageContainer}>
                                <Image 
                                    source={{uri: imagePath}}
                                    style={styles.previewImage}
                                />
                            </View>
                        ) : (
                            <View style={styles.placeholderContainer}>
                                <Text style={styles.placeholderText}>Chưa có ảnh</Text>
                            </View>
                        )}
                    </View>
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
                                style={[styles.categoryChip, type === category && styles.selectedChip]} 
                                onPress={() => setType(category)}
                            >
                                <Text style={[styles.categoryChipText, type === category && styles.selectedChipText]}>
                                    {category}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </View>

                <View style={styles.buttonContainer}>
                    <TouchableOpacity 
                        style={styles.submitButton}
                        onPress={handleAddNewService}
                    >
                        <LinearGradient
                            colors={['#4CAF50', '#45A049']}
                            style={styles.submitGradient}
                        >
                            <Text style={styles.submitText}>Thêm sản phẩm</Text>
                        </LinearGradient>
                    </TouchableOpacity>
                </View>
            </View>
            <Modal
                visible={showSuccessModal}
                transparent={true}
                animationType="fade"
            >
                <View style={styles.modalContainer}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalText}>Thêm sản phẩm thành công!</Text>
                        <TouchableOpacity
                            style={styles.modalButton}
                            onPress={() => {
                                setShowSuccessModal(false);
                                navigation.navigate("Services");
                            }}
                        >
                            <Text style={styles.modalButtonText}>OK</Text>
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
        </ScrollView>
    );
}; 
const styles = StyleSheet.create({
    formContainer: {
        flex: 1,
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
    title: {
        fontSize: 20, 
        fontWeight: 'bold',
        paddingBottom: 15
    },
    textinput: {
        fontSize: 20,
        marginBottom: 10, 
        borderWidth: 1, 
        borderRadius: 10
    },
    uploadButton: {
        marginBottom: 10,
    },
    previewImage: {
        width: 200, 
        height: 180,
        borderRadius: 15,
    },
    buttonadd:{
        margin: 40, 
        backgroundColor:"orange",
    },
    categoryButton: {
        alignItems: 'center',
        justifyContent: 'center',
        padding: 10,
        backgroundColor: '#f0f0f0',
        borderRadius: 10,
        borderWidth: 1,
        borderColor: 'black',
    },
    buttonText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: 'black',
    },
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    headerGradient: {
        padding: 20,
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#fff',
    },
    formContainer: {
        padding: 15,
    },
    inputWrapper: {
        marginBottom: 15,
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
    categorySection: {
        marginBottom: 20,
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
    submitButton: {
        marginTop: 20,
    },
    submitGradient: {
        padding: 15,
        borderRadius: 8,
        maxWidth: 400,
        alignItems: 'center',
    },
    submitText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
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
    buttonContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.5)',
    },
    modalContent: {
        backgroundColor: 'white',
        padding: 20,
        borderRadius: 10,
        alignItems: 'center',
        width: '80%',
        maxWidth: 300,
    },
    modalText: {
        fontSize: 16,
        marginBottom: 20,
        textAlign: 'center',
        color: '#333',
    },
    modalButton: {
        backgroundColor: '#4CAF50',
        paddingHorizontal: 30,
        paddingVertical: 10,
        borderRadius: 5,
    },
    modalButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
    },
    loadingContent: {
        backgroundColor: 'white',
        padding: 20,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
        width: '80%',
        maxWidth: 200,
    },
    loadingText: {
        marginTop: 10,
        fontSize: 16,
        color: '#333',
    },
})
export default AddNewService;

