import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { BrowserRouter } from 'react-router-dom'
import AdminContextProvider from './context/AdminContext.jsx'
import AppContextProvider from './context/AppContext.jsx'
import HospitalContextProvider from './context/HospitalContext.jsx'

ReactDOM.createRoot(document.getElementById('root')).render(
  // <BrowserRouter>
  //   <AdminContextProvider>
  //     <DoctorContextProvider>
  //       <AppContextProvider>
  //         <App />
  //       </AppContextProvider>
  //     </DoctorContextProvider>
  //   </AdminContextProvider>
  // </BrowserRouter>,
  <BrowserRouter>
  <AdminContextProvider>
    <HospitalContextProvider>
      <AppContextProvider>
        <App />
      </AppContextProvider>
    </HospitalContextProvider>
  </AdminContextProvider>
</BrowserRouter>,
)
