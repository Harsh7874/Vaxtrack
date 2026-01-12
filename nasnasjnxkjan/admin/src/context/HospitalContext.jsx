import { createContext, useState } from "react";
import axios from 'axios';
import { toast } from 'react-toastify';

export const HospitalContext = createContext();

const HospitalContextProvider = (props) => {
    const backendUrl = import.meta.env.VITE_BACKEND_URL;

    const [hToken, setHToken] = useState(localStorage.getItem('hToken') ? localStorage.getItem('hToken') : '');
    const [appointments, setAppointments] = useState([]);
    const [dashData, setDashData] = useState(false);
    const [profileData, setProfileData] = useState(false);
    const [inventory, setInventory] = useState([]); // New state for inventory

    // Fetch vaccine inventory
    const getInventory = async () => {
        try {
            const { data } = await axios.get(backendUrl + '/api/hospitalb/listing', {
                headers: { hToken }
            });
            if (data.success) {
                setInventory(data.vaccines);
            } else {
                toast.error(data.message);
            }
        } catch (error) {
            console.log(error);
            toast.error(error.message);
        }
    };

    // Existing functions (unchanged)
    const getAppointments = async () => {
        try {
            const { data } = await axios.get(backendUrl + '/api/hospital/appointments', { headers: { hToken } });
            if (data.success) {
                setAppointments(data.appointments.reverse());
            } else {
                toast.error(data.message);
            }
        } catch (error) {
            console.log(error);
            toast.error(error.message);
        }
    };

    const getProfileData = async () => {
        try {
            const { data } = await axios.get(backendUrl + '/api/hospital/profile', { headers: { hToken } });
            setProfileData(data.profileData);
        } catch (error) {
            console.log(error);
            toast.error(error.message);
        }
    };

    const cancelAppointment = async (appointmentId) => {
        try {
            const { data } = await axios.post(backendUrl + '/api/hospital/cancel-appointment', { appointmentId }, { headers: { hToken } });
            if (data.success) {
                toast.success(data.message);
                getAppointments();
                getDashData();
            } else {
                toast.error(data.message);
            }
        } catch (error) {
            toast.error(error.message);
            console.log(error);
        }
    };

    const completeAppointment = async (appointmentId) => {
        try {
            const { data } = await axios.post(backendUrl + '/api/hospital/complete-appointment', { appointmentId }, { headers: { hToken } });
            if (data.success) {
                toast.success(data.message);
                getAppointments();
                getDashData();
            } else {
                toast.error(data.message);
            }
        } catch (error) {
            toast.error(error.message);
            console.log(error);
        }
    };

    const getDashData = async () => {
        try {
            const { data } = await axios.get(backendUrl + '/api/hospital/dashboard', { headers: { hToken } });
            if (data.success) {
                setDashData(data.dashData);
            } else {
                toast.error(data.message);
            }
        } catch (error) {
            console.log(error);
            toast.error(error.message);
        }
    };

    const value = {
        hToken,
        setHToken,
        backendUrl,
        appointments,
        getAppointments,
        cancelAppointment,
        completeAppointment,
        dashData,
        getDashData,
        profileData,
        setProfileData,
        getProfileData,
        inventory, // Add inventory to context
        getInventory // Add function to context
    };

    return (
        <HospitalContext.Provider value={value}>
            {props.children}
        </HospitalContext.Provider>
    );
};

export default HospitalContextProvider;