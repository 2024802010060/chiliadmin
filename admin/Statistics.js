import React, { useState, useEffect } from "react";
import { View, FlatList, StyleSheet, Alert,Button, Dimensions, ScrollView } from "react-native";
import { Text, Card } from "react-native-paper";
import { Menu, MenuTrigger, MenuOptions, MenuOption } from 'react-native-popup-menu';
import { firestore } from '../firebaseconfig';
import { collection, onSnapshot, doc, updateDoc, deleteDoc, query, orderBy, Timestamp } from 'firebase/firestore';
import { useNavigation } from "@react-navigation/native";
import { PieChart, BarChart, LineChart } from "react-native-chart-kit";

const Statistics = ({navigation}) => {
    const [appointments, setAppointments] = useState([]);

    // Thêm hàm formatPrice
    const formatPrice = (price) => {
        return price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    };

    useEffect(() => {
        const appointmentsRef = collection(firestore, 'Appointments');
        const q = query(appointmentsRef, orderBy('datetime', 'desc'));

        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            const appointmentsData = [];
            querySnapshot.forEach((doc) => {
                const data = doc.data();
                appointmentsData.push({
                    id: doc.id,
                    ...data,
                    datetime: data.datetime instanceof Timestamp ? 
                        data.datetime.toDate() : 
                        new Date(data.datetime)
                });
            });
            setAppointments(appointmentsData);
        }, (error) => {
            console.error("Error fetching appointments:", error);
        });

        return () => unsubscribe();
    }, []);

    const getAppointmentStats = () => {
        const statusCount = {
            'new': 0,
            'complete': 0
        };
        
        appointments.forEach(appointment => {
            if (appointment.state in statusCount) {
                statusCount[appointment.state]++;
            }
        });

        const total = statusCount.new + statusCount.complete;
        
        return [
            {
                name: `Đang chờ (${Math.round((statusCount.new / total) * 100)}%)`,
                population: statusCount.new,
                color: "#FF9F40",
                legendFontColor: "#7F7F7F",
                legendFontSize: 13
            },
            {
                name: `Hoàn thành (${Math.round((statusCount.complete / total) * 100)}%)`,
                population: statusCount.complete,
                color: "#4BC0C0",
                legendFontColor: "#7F7F7F",
                legendFontSize: 13
            }
        ];
    };

    const getTopFoodStats = () => {
        const foodCount = {};
        
        appointments.forEach(appointment => {
            if (appointment.services) {
                appointment.services.forEach(service => {
                    if (service.title in foodCount) {
                        foodCount[service.title] += service.quantity;
                    } else {
                        foodCount[service.title] = service.quantity;
                    }
                });
            }
        });

        // Sắp xếp và lấy 5 món ăn được đặt nhiều nhất
        const sortedFoods = Object.entries(foodCount)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 5);

        // Trả về dữ liệu đúng định dạng cho PieChart
        return sortedFoods.map(([name, count], index) => ({
            name: name,
            population: count,
            color: chartColors.topFood[index],
            legendFontColor: '#7F7F7F',
            legendFontSize: 12
        }));
    };

    const getTopCustomersStats = () => {
        const customerStats = {};
        
        appointments.forEach(appointment => {
            if (appointment.fullName) {
                if (!(appointment.fullName in customerStats)) {
                    customerStats[appointment.fullName] = 0;
                }
                // Tính tổng số lượng món ăn trong mỗi đơn hàng
                if (appointment.services) {
                    appointment.services.forEach(service => {
                        customerStats[appointment.fullName] += service.quantity || 0;
                    });
                }
            }
        });

        // Sắp xếp và lấy 5 khách hàng có số lượng món ăn nhiều nhất
        const sortedCustomers = Object.entries(customerStats)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 5);

        return {
            labels: sortedCustomers.map(([name]) => {
                return name.length > 10 ? name.substring(0, 10) + '...' : name;
            }),
            datasets: [{
                data: sortedCustomers.map(([,count]) => count)
            }]
        };
    };

    const getDailyRevenueStats = () => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const foodRevenue = {};
        
        // Kiểm tra xem có đơn hàng nào trong ngày không
        const todayAppointments = appointments.filter(appointment => {
            const appointmentDate = new Date(appointment.datetime);
            appointmentDate.setHours(0, 0, 0, 0);
            return appointmentDate.getTime() === today.getTime();
        });

        // Nếu không có đơn hàng, trả về dữ liệu mặc định với giá trị 0
        if (todayAppointments.length === 0) {
            return {
                labels: ["Chưa có doanh thu"],
                datasets: [{
                    data: [0]
                }]
            };
        }

        todayAppointments.forEach(appointment => {
            if (appointment.services) {
                appointment.services.forEach(service => {
                    if (service.title in foodRevenue) {
                        foodRevenue[service.title] += (service.quantity * service.price);
                    } else {
                        foodRevenue[service.title] = (service.quantity * service.price);
                    }
                });
            }
        });

        // Sắp xếp và lấy 5 món có doanh thu cao nhất
        const sortedRevenue = Object.entries(foodRevenue)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 5);

        return {
            labels: sortedRevenue.map(([name]) => name),
            datasets: [{
                data: sortedRevenue.map(([,revenue]) => revenue)
            }]
        };
    };

    // Thêm hàm tính doanh thu theo tháng
    const getMonthlyRevenueStats = () => {
        const currentDate = new Date();
        const currentMonth = currentDate.getMonth();
        const currentYear = currentDate.getFullYear();
        
        const foodRevenue = {};
        
        // Lọc các đơn hàng trong tháng hiện tại
        const monthlyAppointments = appointments.filter(appointment => {
            const appointmentDate = new Date(appointment.datetime);
            return appointmentDate.getMonth() === currentMonth && 
                   appointmentDate.getFullYear() === currentYear;
        });

        // Nếu không có đơn hàng, trả về dữ liệu mặc định
        if (monthlyAppointments.length === 0) {
            return {
                labels: ["Chưa có doanh thu"],
                datasets: [{
                    data: [0]
                }]
            };
        }

        monthlyAppointments.forEach(appointment => {
            if (appointment.services) {
                appointment.services.forEach(service => {
                    if (service.title in foodRevenue) {
                        foodRevenue[service.title] += (service.quantity * service.price);
                    } else {
                        foodRevenue[service.title] = (service.quantity * service.price);
                    }
                });
            }
        });

        const sortedRevenue = Object.entries(foodRevenue)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 5);

        return {
            labels: sortedRevenue.map(([name]) => name),
            datasets: [{
                data: sortedRevenue.map(([,revenue]) => revenue)
            }]
        };
    };

    // Thêm hàm tính doanh thu theo năm
    const getYearlyRevenueStats = () => {
        const currentYear = new Date().getFullYear();
        
        const foodRevenue = {};
        
        // Lọc các đơn hàng trong năm hiện tại
        const yearlyAppointments = appointments.filter(appointment => {
            const appointmentDate = new Date(appointment.datetime);
            return appointmentDate.getFullYear() === currentYear;
        });

        // Nếu không có đơn hàng, trả về dữ liệu mặc định
        if (yearlyAppointments.length === 0) {
            return {
                labels: ["Chưa có doanh thu"],
                datasets: [{
                    data: [0]
                }]
            };
        }

        yearlyAppointments.forEach(appointment => {
            if (appointment.services) {
                appointment.services.forEach(service => {
                    if (service.title in foodRevenue) {
                        foodRevenue[service.title] += (service.quantity * service.price);
                    } else {
                        foodRevenue[service.title] = (service.quantity * service.price);
                    }
                });
            }
        });

        const sortedRevenue = Object.entries(foodRevenue)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 5);

        return {
            labels: sortedRevenue.map(([name]) => name),
            datasets: [{
                data: sortedRevenue.map(([,revenue]) => revenue)
            }]
        };
    };

    // Hàm làm tròn số lên đến giá trị gần nhất và đẹp hơn
    const roundUpToNearestNice = (num) => {
        if (num === 0) return 0;
        
        // Xác định bậc của số (hàng triệu, nghìn, v.v.)
        const power = Math.floor(Math.log10(num));
        const magnitude = Math.pow(10, power);
        
        // Tìm bội số phù hợp để làm tròn
        const multiplier = num / magnitude;
        let niceMultiplier;
        
        if (multiplier <= 1) niceMultiplier = 1;
        else if (multiplier <= 2) niceMultiplier = 2;
        else if (multiplier <= 5) niceMultiplier = 5;
        else niceMultiplier = 10;
        
        return Math.ceil(num / (magnitude * niceMultiplier)) * magnitude * niceMultiplier;
    };

    // Hàm tạo các mốc giá trị cho trục Y
    const generateYAxisValues = (maxValue) => {
        const step = maxValue / 5; // Chia làm 5 khoảng đều nhau
        const values = [];
        for (let i = 0; i <= 5; i++) {
            values.push(step * i);
        }
        return values;
    };

    return(
        <ScrollView style={styles.container}>
            <Text style={styles.title}>THỐNG KÊ</Text>
            
            {appointments.length > 0 && (
                <>
                    <View style={styles.chartsRow}>
                        <View style={styles.chartContainer}>
                            <Text style={styles.chartTitle}>Top 5 món ăn phổ biến</Text>
                            <PieChart
                                data={getTopFoodStats()}
                                width={Dimensions.get("window").width * 0.45}
                                height={220}
                                chartConfig={chartConfig}
                                accessor={"population"}
                                backgroundColor={"transparent"}
                                paddingLeft={"15"}
                                absolute
                            />
                        </View>
                        <View style={styles.chartContainer}>
                            <Text style={styles.chartTitle}>Trạng thái đơn hàng</Text>
                            <PieChart
                                data={getAppointmentStats()}
                                width={Dimensions.get("window").width * 0.45}
                                height={220}
                                chartConfig={chartConfig}
                                accessor={"population"}
                                backgroundColor={"transparent"}
                                paddingLeft={"15"}
                                absolute
                            />
                        </View>
                    </View>
                    
                    <View style={styles.chartsRow}>
                        <View style={styles.chartContainer}>
                            <Text style={styles.chartTitle}>Top khách hàng</Text>
                            <LineChart
                                data={getTopCustomersStats()}
                                width={Dimensions.get("window").width * 0.45}
                                height={220}
                                chartConfig={{
                                    ...chartConfig,
                                    color: (opacity = 1) => `rgba(63, 81, 181, ${opacity})`,
                                    strokeWidth: 2,
                                    propsForDots: {
                                        r: "6",
                                        strokeWidth: "2",
                                        stroke: "#3F51B5"
                                    }
                                }}
                                bezier
                                style={{
                                    marginVertical: 8,
                                    borderRadius: 16
                                }}
                            />
                        </View>
                        
                        <View style={styles.chartContainer}>
                            <Text style={styles.chartTitle}>Doanh thu hôm nay</Text>
                            <LineChart
                                data={getDailyRevenueStats()}
                                width={Dimensions.get("window").width * 0.45}
                                height={220}
                                chartConfig={{
                                    ...chartConfig,
                                    color: (opacity = 1) => `rgba(76, 175, 80, ${opacity})`,
                                    strokeWidth: 2,
                                    propsForDots: {
                                        r: "6",
                                        strokeWidth: "2",
                                        stroke: "#4CAF50"
                                    },
                                    formatYLabel: (value) => formatPrice(value),
                                }}
                                bezier
                                style={{
                                    marginVertical: 8,
                                    borderRadius: 16
                                }}
                            />
                        </View>
                    </View>
                    
                    <View style={styles.chartsRow}>
                        <View style={styles.chartContainer}>
                            <Text style={styles.chartTitle}>Doanh thu tháng</Text>
                            <LineChart
                                data={getMonthlyRevenueStats()}
                                width={Dimensions.get("window").width * 0.45}
                                height={220}
                                chartConfig={{
                                    ...chartConfig,
                                    color: (opacity = 1) => `rgba(255, 99, 132, ${opacity})`,
                                    strokeWidth: 2,
                                    propsForDots: {
                                        r: "6",
                                        strokeWidth: "2",
                                        stroke: "#FF6384"
                                    },
                                    formatYLabel: (value) => formatPrice(value),
                                    formatValue: (value) => formatPrice(value),
                                }}
                                bezier
                                style={{
                                    marginVertical: 8,
                                    borderRadius: 16
                                }}
                            />
                        </View>
                        
                        <View style={styles.chartContainer}>
                            <Text style={styles.chartTitle}>Doanh thu năm</Text>
                            <LineChart
                                data={getYearlyRevenueStats()}
                                width={Dimensions.get("window").width * 0.45}
                                height={220}
                                chartConfig={{
                                    ...chartConfig,
                                    color: (opacity = 1) => `rgba(153, 102, 255, ${opacity})`,
                                    strokeWidth: 2,
                                    propsForDots: {
                                        r: "6",
                                        strokeWidth: "2",
                                        stroke: "#9966FF"
                                    },
                                    formatYLabel: (value) => formatPrice(value),
                                    formatValue: (value) => formatPrice(value),
                                }}
                                bezier
                                style={{
                                    marginVertical: 8,
                                    borderRadius: 16
                                }}
                            />
                        </View>
                    </View>
                </>
            )}
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
        backgroundColor: '#F8FAFC',
    },
    title: {
        fontSize: 28,
        fontWeight: '900',
        textAlign: 'center',
        marginVertical: 24,
        color: '#1A237E',
        letterSpacing: 1.5,
        textTransform: 'uppercase',
        fontFamily: 'Times New Roman',
    },
    chartsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 24,
    },
    chartContainer: {
        flex: 1,
        margin: 10,
        backgroundColor: '#FFFFFF',
        borderRadius: 24,
        padding: 20,
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 6,
        },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 10,
    },
    chartTitle: {
        fontSize: 18,
        fontWeight: '700',
        textAlign: 'center',
        marginBottom: 20,
        color: '#1A237E',
        paddingHorizontal: 10,
        fontFamily: 'Times New Roman',
    }
});

// Màu sắc cho từng biểu đồ
const chartColors = {
    topFood: ['#FF6384', '#FF9F40', '#FFCD56', '#4BC0C0', '#36A2EB'],
    orderStatus: ['#4CAF50', '#FFA726'],
    revenue: ['#3F51B5', '#7986CB', '#9FA8DA', '#C5CAE9', '#E8EAF6']
};

// Cấu hình chung cho biểu đồ
const chartConfig = {
    backgroundColor: '#FFFFFF',
    backgroundGradientFrom: '#FFFFFF',
    backgroundGradientTo: '#FFFFFF',
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
    style: {
        borderRadius: 16,
    },
    propsForLabels: {
        fontSize: 10,
        fontWeight: '600',
        fontFamily: 'Times New Roman',
    },
    useShadowColorFromDataset: false
};

export default Statistics;
