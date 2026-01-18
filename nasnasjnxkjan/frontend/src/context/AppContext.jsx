import { createContext, useEffect, useState } from "react";
import { toast } from "react-toastify";
import axios from 'axios'

export const AppContext = createContext()

const AppContextProvider = (props) => {

    const currencySymbol = '₹'
    const backendUrl = import.meta.env.VITE_BACKEND_URL

    // const [doctors, setDoctors] = useState([])
    const [hospitals, setHospitals] = useState([])

    const [token, setToken] = useState(localStorage.getItem('token') ? localStorage.getItem('token') : '')
    const [userData, setUserData] = useState(false)

    // Getting Doctors using API
const refreshHospital = async () => {
  try {
    const { data } = await axios.get(
      `${backendUrl}/api/user/get-hospital/${hospitalId}`
    );

    if (data.success) {
      setHospitalInfo(data.hospitalData);

      setAvailableVaccines(
        data.hospitalData.vaccines.filter(v => v.quantity > 0)
      );
    }
  } catch (error) {
    console.error("Refresh error:", error);
  }
};




      // Getting Hospital using API
      const getHospitalsData = async () => {

        try {

            const { data } = await axios.get(backendUrl + '/api/hospital/list')
            if (data.success) {
                setHospitals(data.hospitals)
            } else {
                toast.error(data.message)
            }

        } catch (error) {
            console.log(error)
            toast.error(error.message)
        }

    }

    // Getting User Profile using API
    const loadUserProfileData = async () => {

        try {

            const { data } = await axios.get(backendUrl + '/api/user/get-profile', { headers: { token } })

            if (data.success) {
                setUserData(data.userData)
            } else {
                toast.error(data.message)
            }

        } catch (error) {
            console.log(error)
            toast.error(error.message)
        }

    }

    // useEffect(() => {
    //     getDoctosData()

    // }, [])

    useEffect(() => {
        getHospitalsData()

    }, [])

    useEffect(() => {
        if (token) {
            loadUserProfileData()
        }
    }, [token])

    const value = {
        hospitals, getHospitalsData,refreshHospital,
        currencySymbol,
        backendUrl,
        token, setToken,
        userData, setUserData, loadUserProfileData
    }

    return (
        <AppContext.Provider value={value}>
            {props.children}
        </AppContext.Provider>
    )

}

export default AppContextProvider