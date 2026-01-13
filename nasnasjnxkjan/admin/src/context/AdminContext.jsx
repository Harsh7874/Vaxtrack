import axios from "axios";
import { createContext, useState } from "react";
import { toast } from "react-toastify";


export const AdminContext = createContext()

const AdminContextProvider = (props) => {

    const backendUrl = import.meta.env.VITE_BACKEND_URL

    const [aToken, setAToken] = useState(localStorage.getItem('aToken') ? localStorage.getItem('aToken') : '')

    const [appointments, setAppointments] = useState([])
    // const [doctors, setDoctors] = useState([])
    const [hospitals, setHospitals] = useState([])
    const [vaccines, setVaccines] = useState([])
    const [dashData, setDashData] = useState(false)


//---------------------------------------------------------------------Get all hospitals-------------------------------------------------------------//
        const getAllHospitals = async () => {

        try {

            const { data } = await axios.get(backendUrl + '/api/admin/all-hospitals', { headers: { aToken } })
            if (data.success) {
                setHospitals(data.hospitals)
            } else {
                toast.error(data.message)
            }

        } catch (error) {
            toast.error(error.message)
        }

    }


    //GEt All vaccines
    const getAllVaccines = async () => {

        try {

            const { data } = await axios.get(backendUrl + '/api/admin/all-vaccines', { headers: { aToken } })
            if (data.success) {
                setVaccines(data.vaccines)
            } else {
                toast.error(data.message)
            }

        } catch (error) {
            toast.error(error.message)
        }

    }





    //----------------------------------------------- Function to change hospital availablity using API---------------------------------------//
    const changeAvailability = async (hospitalId) => {
        try {

            const { data } = await axios.post(backendUrl + '/api/admin/change-availability', { hospitalId }, { headers: { aToken } })
            if (data.success) {
                toast.success(data.message)
                getAllHospitals()
            } else {
                toast.error(data.message)
            }

        } catch (error) {
            console.log(error)
            toast.error(error.message)
        }
    }


    // Getting all appointment data from Database using API
    const getAllAppointments = async () => {

        try {

            const { data } = await axios.get(backendUrl + '/api/admin/appointments', { headers: { aToken } })
            if (data.success) {
                setAppointments(data.appointment.reverse())
            } else {
                toast.error(data.message)
            }

        } catch (error) {
            toast.error(error.message)
            console.log(error)
        }

    }

    // --------------------------------------------------Function to cancel appointment using API
    const cancelAppointment = async (appointmentId) => {

        try {

            const { data } = await axios.post(backendUrl + '/api/admin/cancel-appointment', { appointmentId }, { headers: { aToken } })

            if (data.success) {
                toast.success(data.message)
                getAllAppointments()
            } else {
                toast.error(data.message)
            }

        } catch (error) {
            toast.error(error.message)
            console.log(error)
        }

    }

    // --------------------------------------------Getting Admin Dashboard data from Database using API
    const getDashData = async () => {
        try {

            const { data } = await axios.get(backendUrl + '/api/admin/dashboard', { headers: { aToken } })

            if (data.success) {
                setDashData(data.dashData)
            } else {
                toast.error(data.message)
            }

        } catch (error) {
            console.log(error)
            toast.error(error.message)
        }

    }

    const value = {
        aToken, setAToken,
        hospitals,
        vaccines,
        getAllHospitals,
        changeAvailability,
        appointments,
        getAllAppointments,
        getDashData,
        cancelAppointment,
        getAllVaccines,
        dashData
    }

    return (
        <AdminContext.Provider value={value}>
            {props.children}
        </AdminContext.Provider>
    )

}

export default AdminContextProvider