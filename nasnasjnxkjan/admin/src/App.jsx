import React, { useContext } from 'react'
// import { DoctorContext } from './context/DoctorContext';
import { AdminContext } from './context/AdminContext';
import { Route, Routes } from 'react-router-dom'
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Navbar from './components/Navbar'
import Sidebar from './components/Sidebar'
import Dashboard from './pages/Admin/Dashboard';
import AllAppointments from './pages/Admin/AllAppointments';
import DoctorsList from './pages/Admin/DoctorsList';
import Login from './pages/Login';
import AddVaccine from './pages/Admin/AddVaccine';
import AddHospital from './pages/Admin/AddHospital';
import HospitalsList from './pages/Admin/HospitalList';
import VaccinesList from './pages/Admin/VaccineList';
import { HospitalContext } from './context/HospitalContext';
import HospitalDashboard from './pages/Doctor/HospitalDashboard';
import HospitalAppointments from './pages/Doctor/HospitalAppointments';
import HospitalProfile from './pages/Doctor/HospitalProfile';
import { Inventory } from './pages/Doctor/Inventory';
import HospitalVaccineManager from './pages/Admin/ManageHospital';
import HospitalRequests from './pages/Doctor/Requests';
import AdminRequests from './pages/Admin/Requests';

const App = () => {

  const { hToken } = useContext(HospitalContext)

  const { aToken } = useContext(AdminContext)

  return hToken || aToken ? (
    <div className='bg-[#F8F9FD]'>
      <ToastContainer />
      <Navbar />
      <div className='flex items-start'>
        <Sidebar />
        <Routes>
          <Route path='/' element={<></>} />
          <Route path='/admin-dashboard' element={<Dashboard />} />
          <Route path='//hospital-manage' element={<HospitalVaccineManager />} />
          <Route path='/all-appointments' element={<AllAppointments />} />
          <Route path='/add-vaccine' element={<AddVaccine />} />
          <Route path='/add-hospital' element={<AddHospital />} />
          <Route path='/hospital-list' element={<HospitalsList />} />
          <Route path='/doctor-list' element={<DoctorsList />} />
          <Route path='/vaccine-list' element={<VaccinesList />} />
          <Route path='/hospital-dashboard' element={<HospitalDashboard />} />
          <Route path='/hospital-appointments' element={<HospitalAppointments />} />
          <Route path='/hospital-profile' element={<HospitalProfile />} />
          <Route path='/inventory' element={<Inventory />} />
          <Route path='/requests' element={<HospitalRequests />} />
          <Route path='/admin-requests' element={<AdminRequests />} />
        </Routes>
      </div>
    </div>
  ) : (
    <>
      <ToastContainer />
      <Login />
    </>
  )
}

export default App