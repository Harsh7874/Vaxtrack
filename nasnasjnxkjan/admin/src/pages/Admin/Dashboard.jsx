import React, { useContext, useEffect } from 'react'
import { assets } from '../../assets/assets'
import { AdminContext } from '../../context/AdminContext'
import { AppContext } from '../../context/AppContext'

// Skeleton pulse block
const Skeleton = ({ className }) => (
  <div className={`animate-pulse bg-gray-200 rounded ${className}`} />
)

// Stat card skeleton
const StatCardSkeleton = () => (
  <div className="flex items-center gap-2 bg-white p-4 min-w-52 rounded border-2 border-gray-100">
    <Skeleton className="w-14 h-14 rounded-md flex-shrink-0" />
    <div className="space-y-2 flex-1">
      <Skeleton className="h-6 w-16" />
      <Skeleton className="h-4 w-24" />
    </div>
  </div>
)

// Booking row skeleton
const BookingRowSkeleton = () => (
  <div className="flex items-center px-6 py-3 gap-3">
    <Skeleton className="w-10 h-10 rounded-full flex-shrink-0" />
    <div className="flex-1 space-y-2">
      <Skeleton className="h-4 w-40" />
      <Skeleton className="h-3 w-64" />
    </div>
    <Skeleton className="h-4 w-14 rounded-full" />
  </div>
)

const Dashboard = () => {
  const { aToken, getDashData, cancelAppointment, dashData } = useContext(AdminContext)
  const { slotDateFormat } = useContext(AppContext)

  useEffect(() => {
    if (aToken) {
      getDashData()
    }
  }, [aToken])

  // ── SKELETON STATE ──────────────────────────────────────────────
  if (!dashData) {
    return (
      <div className="m-5">
        {/* Stat cards */}
        <div className="flex flex-wrap gap-3">
          {Array(4).fill(0).map((_, i) => <StatCardSkeleton key={i} />)}
        </div>

        {/* Latest Bookings table */}
        <div className="bg-white mt-10">
          <div className="flex items-center gap-2.5 px-4 py-4 rounded-t border">
            <Skeleton className="w-5 h-5" />
            <Skeleton className="h-5 w-36" />
          </div>
          <div className="pt-4 border border-t-0 divide-y divide-gray-50">
            {Array(5).fill(0).map((_, i) => <BookingRowSkeleton key={i} />)}
          </div>
        </div>
      </div>
    )
  }

  // ── ACTUAL DASHBOARD ────────────────────────────────────────────
  return (
    <div className='m-5'>
      <div className='flex flex-wrap gap-3'>
        <div className='flex items-center gap-2 bg-white p-4 min-w-52 rounded border-2 border-gray-100 cursor-pointer hover:scale-105 transition-all'>
          <img className='w-14' src={assets.hospital_icon} alt="" />
          <div>
            <p className='text-xl font-semibold text-gray-600'>{dashData.hospitals}</p>
            <p className='text-gray-400'>HOSPITALS</p>
          </div>
        </div>
        <div className='flex items-center gap-2 bg-white p-4 min-w-52 rounded border-2 border-gray-100 cursor-pointer hover:scale-105 transition-all'>
          <img className='w-14' src={assets.appointments_icon} alt="" />
          <div>
            <p className='text-xl font-semibold text-gray-600'>{dashData.totalAppointments}</p>
            <p className='text-gray-400'>Appointments</p>
          </div>
        </div>
        <div className='flex items-center gap-2 bg-white p-4 min-w-52 rounded border-2 border-gray-100 cursor-pointer hover:scale-105 transition-all'>
          <img className='w-14' src={assets.appointments_icon} alt="" />
          <div>
            <p className='text-xl font-semibold text-gray-600'>{dashData.totalAppointments}</p>
            <p className='text-gray-400'>Vaccinated</p>
          </div>
        </div>
        <div className='flex items-center gap-2 bg-white p-4 min-w-52 rounded border-2 border-gray-100 cursor-pointer hover:scale-105 transition-all'>
          <img className='w-14' src={assets.patients_icon} alt="" />
          <div>
            <p className='text-xl font-semibold text-gray-600'>{dashData.patients}</p>
            <p className='text-gray-400'>USERS</p>
          </div>
        </div>
      </div>

      <div className='bg-white'>
        <div className='flex items-center gap-2.5 px-4 py-4 mt-10 rounded-t border'>
          <img src={assets.list_icon} alt="" />
          <p className='font-semibold'>Latest Bookings</p>
        </div>
        <div className='pt-4 border border-t-0'>
          {dashData.latestAppointments.slice(0, 5).map((item, index) => (
            <div className='flex items-center px-6 py-3 gap-3 hover:bg-gray-100' key={index}>
              <img className='rounded-full w-10' src={item.hospitalData.image} alt="" />
              <div className='flex-1 text-sm'>
                <p className='text-gray-1000 font-medium'>{item.hospitalData.name}</p>
                <p className='text-gray-900'>Booking on {slotDateFormat(item.slotDate)} || {item.slotTime}</p>
              </div>
              {item.cancelled
                ? <p className='text-red-400 text-xs font-medium'>Cancelled</p>
                : item.isCompleted
                  ? <p className='text-green-500 text-xs font-medium'>Completed</p>
                  : <p className='text-yellow-500 text-xs font-medium'>Pending</p>
              }
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default Dashboard