import React, { useContext, useState, useMemo, useEffect } from 'react'
import { HospitalContext } from '../../context/HospitalContext'
import { AppContext } from '../../context/AppContext'
import { assets } from '../../assets/assets'
import { PieChart, Pie, Cell, ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, BarChart, Bar } from 'recharts'

const HospitalDashboard = () => {
  const { hToken, dashData, getDashData, cancelAppointment, completeAppointment } = useContext(HospitalContext)
  const { slotDateFormat, currency, calculateAge } = useContext(AppContext)
  const [activeFilter, setActiveFilter] = useState('ALL')
  const [filteredAppointments, setFilteredAppointments] = useState([])
  const [showAll, setShowAll] = useState(false)
  const [completingId, setCompletingId] = useState(null)

  const isToday = (dateString) => {
    const today = new Date();
    const d = new Date(dateString);
    return (
      d.getDate() === today.getDate() &&
      d.getMonth() === today.getMonth() &&
      d.getFullYear() === today.getFullYear()
    );
  };

  // Get today's appointments for the pie chart
  const todayAppointments = useMemo(() => {
    if (!dashData?.latestAppointments) return []
    return dashData.latestAppointments.filter(item => isToday(item.slotDate))
  }, [dashData?.latestAppointments])

  // Calculate today's appointment status distribution
  const todayStatusData = useMemo(() => {
    const completed = todayAppointments.filter(item => item.isCompleted).length
    const pending = todayAppointments.filter(item => !item.isCompleted && !item.cancelled).length
    const cancelled = todayAppointments.filter(item => item.cancelled).length
    
    return [
      { name: 'Completed', value: completed, color: '#10B981' },
      { name: 'Pending', value: pending, color: '#F59E0B' },
      { name: 'Cancelled', value: cancelled, color: '#EF4444' }
    ]
  }, [todayAppointments])

  // Calculate earnings trend data (last 7 days)
  const earningsTrendData = useMemo(() => {
    if (!dashData?.earningsData) return []
    
    // This would ideally come from your backend
    // For now, creating mock data based on available data
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
    return days.map((day, index) => ({
      name: day,
      earnings: Math.floor(Math.random() * 1000) + 500 // Mock data
    }))
  }, [dashData])

  // Calculate vaccine popularity
  const vaccinePopularityData = useMemo(() => {
    if (!dashData?.latestAppointments) return []
    
    const vaccineCount = {}
    dashData.latestAppointments.forEach(appointment => {
      const vaccineName = appointment.vaccineName
      vaccineCount[vaccineName] = (vaccineCount[vaccineName] || 0) + 1
    })
    
    return Object.entries(vaccineCount)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5) // Top 5 vaccines
  }, [dashData?.latestAppointments])

  // Filter appointments based on active filter
  const getFilteredAppointments = useMemo(() => {
    if (!dashData?.latestAppointments) return [];

    return dashData.latestAppointments.filter((item) => {
      switch (activeFilter) {
        case 'TODAY':
          return isToday(item.slotDate);
        case 'PENDING':
          return !item.cancelled && !item.isCompleted;
        case 'COMPLETED':
          return item.isCompleted;
        case 'CANCELLED':
          return item.cancelled;
        case 'ALL':
        default:
          return true;
      }
    });
  }, [dashData?.latestAppointments, activeFilter])

  // Update filtered appointments
  useEffect(() => {
    if (dashData?.latestAppointments) {
      setFilteredAppointments(
        showAll ? getFilteredAppointments : getFilteredAppointments.slice(0, 5)
      )
    }
  }, [dashData?.latestAppointments, getFilteredAppointments, showAll])

  useEffect(() => {
    if (hToken) {
      getDashData()
    }
  }, [hToken])

  const handleComplete = async (id) => {
    try {
      setCompletingId(id)
      await completeAppointment(id)
    } catch (error) {
      console.error('Error completing appointment:', error)
    } finally {
      setCompletingId(null)
    }
  }

  const filterButtons = [
    { key: 'ALL', label: 'All', color: 'bg-blue-100 text-blue-700', icon: assets.list_icon },
    { key: 'TODAY', label: 'Today', color: 'bg-purple-100 text-purple-700', icon: assets.list_icon },
    { key: 'PENDING', label: 'Pending', color: 'bg-yellow-100 text-yellow-700', icon: assets.list_icon },
    { key: 'COMPLETED', label: 'Completed', color: 'bg-green-100 text-green-700', icon: assets.tick_icon },
    { key: 'CANCELLED', label: 'Cancelled', color: 'bg-red-100 text-red-700', icon: assets.cancel_icon },
  ]

  const getStatusCounts = useMemo(() => {
    if (!dashData?.latestAppointments) return { all: 0, today: 0, pending: 0, completed: 0, cancelled: 0 };
    
    const todayCount = dashData.latestAppointments.filter(item => isToday(item.slotDate)).length;
    const pendingCount = dashData.latestAppointments.filter(item => !item.cancelled && !item.isCompleted).length;
    const completedCount = dashData.latestAppointments.filter(item => item.isCompleted).length;
    const cancelledCount = dashData.latestAppointments.filter(item => item.cancelled).length;
    
    return {
      all: dashData.latestAppointments.length,
      today: todayCount,
      pending: pendingCount,
      completed: completedCount,
      cancelled: cancelledCount
    };
  }, [dashData?.latestAppointments])

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border rounded-lg shadow-lg">
          <p className="font-medium text-gray-800">{label}</p>
          {payload.map((entry, index) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: {entry.value}
            </p>
          ))}
        </div>
      )
    }
    return null
  }

  return dashData && (
    <div className='p-4 md:p-6'>
      {/* Stats Cards */}
      <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 mb-6 md:mb-8'>
        <div className='bg-white p-4 md:p-6 rounded-xl shadow-sm border hover:shadow-md transition-shadow'>
          <div className='flex items-center gap-3 md:gap-4'>
            <div className='p-3 bg-blue-50 rounded-lg'>
              <img className='w-6 h-6 md:w-8 md:h-8' src={assets.earning_icon} alt="Earnings" />
            </div>
            <div>
              <p className='text-lg md:text-2xl font-bold text-gray-800'>{currency}{dashData.earnings}</p>
              <p className='text-gray-500 text-sm'>Total Earnings</p>
            </div>
          </div>
        </div>
        
        <div className='bg-white p-4 md:p-6 rounded-xl shadow-sm border hover:shadow-md transition-shadow'>
          <div className='flex items-center gap-3 md:gap-4'>
            <div className='p-3 bg-purple-50 rounded-lg'>
              <img className='w-6 h-6 md:w-8 md:h-8' src={assets.appointments_icon} alt="Appointments" />
            </div>
            <div>
              <p className='text-lg md:text-2xl font-bold text-gray-800'>{dashData.appointments}</p>
              <p className='text-gray-500 text-sm'>Total Appointments</p>
            </div>
          </div>
        </div>
        
        <div className='bg-white p-4 md:p-6 rounded-xl shadow-sm border hover:shadow-md transition-shadow'>
          <div className='flex items-center gap-3 md:gap-4'>
            <div className='p-3 bg-green-50 rounded-lg'>
              <img className='w-6 h-6 md:w-8 md:h-8' src={assets.patients_icon} alt="Patients" />
            </div>
            <div>
              <p className='text-lg md:text-2xl font-bold text-gray-800'>{dashData.patients}</p>
              <p className='text-gray-500 text-sm'>Total Patients</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className='grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8'>
        {/* Left Column - Appointments List */}
        <div className='lg:col-span-2'>
          {/* Filter Buttons */}
          <div className='bg-white p-4 md:p-6 rounded-xl shadow-sm border mb-6'>
            <p className='text-gray-700 font-medium mb-3 md:mb-4'>Filter Appointments:</p>
            
            {/* Mobile Filter Tabs */}
            <div className='block md:hidden mb-4'>
              <div className='flex overflow-x-auto pb-2 gap-2 scrollbar-hide -mx-1 px-1'>
                {filterButtons.map((filter) => (
                  <button
                    key={filter.key}
                    onClick={() => {
                      setActiveFilter(filter.key)
                      setShowAll(false)
                    }}
                    className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium ${
                      activeFilter === filter.key 
                        ? `${filter.color} ring-1 ring-current` 
                        : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    <img src={filter.icon} alt={filter.label} className='w-3.5 h-3.5' />
                    <span>{filter.label}</span>
                    <span className={`px-1.5 py-0.5 text-xs rounded-full ${
                      activeFilter === filter.key ? 'bg-white' : 'bg-gray-200'
                    }`}>
                      {getStatusCounts[filter.key.toLowerCase()] || 0}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Desktop Filter Buttons */}
            <div className='hidden md:flex flex-wrap gap-2'>
              {filterButtons.map((filter) => (
                <button
                  key={filter.key}
                  onClick={() => {
                    setActiveFilter(filter.key)
                    setShowAll(false)
                  }}
                  className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all ${
                    activeFilter === filter.key 
                      ? `${filter.color} ring-2 ring-offset-1 ring-current` 
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  <img src={filter.icon} alt={filter.label} className='w-4 h-4' />
                  {filter.label} 
                  <span className='ml-1 px-1.5 py-0.5 text-xs bg-white rounded-full'>
                    {getStatusCounts[filter.key.toLowerCase()] || 0}
                  </span>
                </button>
              ))}
            </div>

            {/* Filter Summary */}
            <div className='mt-4 pt-4 border-t border-gray-100'>
              <div className='flex items-center justify-between text-sm text-gray-500'>
                <div>
                  Showing <span className='font-semibold text-gray-700'>{filteredAppointments.length}</span> of{' '}
                  <span className='font-semibold text-gray-700'>{getFilteredAppointments.length}</span> {activeFilter.toLowerCase()} appointments
                </div>
                {getFilteredAppointments.length > 5 && !showAll && (
                  <button
                    onClick={() => setShowAll(true)}
                    className='text-blue-600 hover:text-blue-800 font-medium hover:underline text-sm'
                  >
                    Show all {getFilteredAppointments.length} appointments
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Appointments List */}
          <div className='bg-white rounded-xl shadow-sm border overflow-hidden'>
            <div className='md:hidden px-4 py-3 border-b bg-gray-50'>
              <p className='font-semibold text-gray-700 text-base'>
                {activeFilter === 'ALL' ? 'All Bookings' : `${activeFilter.charAt(0) + activeFilter.slice(1).toLowerCase()} Bookings`}
                <span className='ml-2 text-sm font-normal text-gray-500'>({filteredAppointments.length})</span>
              </p>
            </div>
            
            <div className='hidden md:flex items-center justify-between px-6 py-4 border-b'>
              <div className='flex items-center gap-2.5'>
                <img src={assets.list_icon} alt='' className='w-5 h-5' />
                <p className='font-semibold text-gray-700'>
                  {activeFilter === 'ALL' ? 'All Bookings' : `${activeFilter.charAt(0) + activeFilter.slice(1).toLowerCase()} Bookings`}
                  <span className='ml-2 text-sm text-gray-500'>
                    ({filteredAppointments.length} {filteredAppointments.length === 1 ? 'appointment' : 'appointments'})
                  </span>
                </p>
              </div>
              <div className='text-sm text-gray-500'>
                Showing {filteredAppointments.length} of {getStatusCounts[activeFilter.toLowerCase()] || 0}
              </div>
            </div>

            <div className='divide-y divide-gray-100'>
              {filteredAppointments.length > 0 ? (
                filteredAppointments.map((item, index) => (
                  <div className='flex items-center px-4 md:px-6 py-4 gap-3 md:gap-4 hover:bg-gray-50' key={index}>
                    <img className='rounded-full w-10 h-10 md:w-12 md:h-12 object-cover' src={item.userData.image} alt={item.userData.name} />
                    <div className='flex-1 min-w-0'>
                      <div className='flex flex-col md:flex-row md:items-center md:justify-between gap-1'>
                        <div>
                          <p className='text-gray-800 font-medium truncate'>{item.userData.name}</p>
                          <div className='flex flex-wrap items-center gap-2 mt-1'>
                            <p className='text-gray-600 text-sm'>Booking on {slotDateFormat(item.slotDate)}</p>
                            <span className='text-xs text-gray-400'>{item.slotTime}</span>
                          </div>
                        </div>
                        <div className='md:text-right'>
                          <p className='font-semibold text-gray-800 text-sm md:text-base'>{currency}{item.vaccinePrice}</p>
                          <p className='text-xs text-gray-500'>{item.vaccineName}</p>
                        </div>
                      </div>
                      {isToday(item.slotDate) && !item.cancelled && !item.isCompleted && (
                        <span className='inline-block mt-2 px-2 py-1 text-xs bg-purple-100 text-purple-700 rounded-full'>
                          Today
                        </span>
                      )}
                    </div>
                    <div className='flex-shrink-0'>
                      {item.cancelled ? (
                        <span className='px-3 py-1 bg-red-100 text-red-700 text-xs font-medium rounded-full'>
                          Cancelled
                        </span>
                      ) : item.isCompleted ? (
                        <span className='px-3 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full'>
                          Completed
                        </span>
                      ) : isToday(item.slotDate) ? (
                        <div className='flex gap-2'>
                          <button
                            onClick={() => cancelAppointment(item._id)}
                            className='flex items-center gap-1 px-3 py-2 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg text-xs font-medium transition-colors'
                            title='Cancel Appointment'
                          >
                            <img className='w-3.5 h-3.5' src={assets.cancel_icon} alt='Cancel' />
                            <span className='hidden sm:inline'>Cancel</span>
                          </button>
                          {completingId === item._id ? (
                            <div className='flex items-center gap-1 px-3 py-2 bg-green-50 text-green-600 rounded-lg text-xs font-medium'>
                              <div className='w-3.5 h-3.5 border-2 border-green-500 border-t-transparent rounded-full animate-spin'></div>
                              <span className='hidden sm:inline'>Processing</span>
                            </div>
                          ) : (
                            <button
                              onClick={() => handleComplete(item._id)}
                              className='flex items-center gap-1 px-3 py-2 bg-green-50 text-green-600 hover:bg-green-100 rounded-lg text-xs font-medium transition-colors'
                              title='Mark as Complete'
                            >
                              <img className='w-3.5 h-3.5' src={assets.tick_icon} alt='Complete' />
                              <span className='hidden sm:inline'>Complete</span>
                            </button>
                          )}
                        </div>
                      ) : (
                        <span className='px-3 py-1 bg-yellow-100 text-yellow-700 text-xs font-medium rounded-full'>
                          PENDING
                        </span>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className='px-4 md:px-6 py-12 text-center'>
                  <img src={assets.empty_icon} alt='No appointments' className='w-16 h-16 md:w-24 md:h-24 mx-auto opacity-50 mb-4' />
                  <p className='text-gray-500 text-base md:text-lg'>No {activeFilter.toLowerCase()} appointments found</p>
                  <p className='text-gray-400 text-sm mt-2'>Try selecting a different filter</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column - Charts */}
        <div className='space-y-6 md:space-y-8'>
          {/* Today's Appointments Status Distribution */}
          <div className='bg-white p-4 md:p-6 rounded-xl shadow-sm border'>
            <div className='flex items-center justify-between mb-4'>
              <h3 className='text-lg font-semibold text-gray-800'>Today's Status</h3>
              <div className='flex items-center gap-2'>
                <span className='text-sm text-gray-500'>Total:</span>
                <span className='font-semibold'>{todayAppointments.length}</span>
              </div>
            </div>
            
            <div className='h-64 md:h-72'>
              <ResponsiveContainer width='100%' height='100%'>
                <PieChart>
                  <Pie
                    data={todayStatusData}
                    cx='50%'
                    cy='50%'
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey='value'
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    labelLine={false}
                  >
                    {todayStatusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
            
            <div className='grid grid-cols-3 gap-2 mt-4'>
              {todayStatusData.map((status, index) => (
                <div key={index} className='text-center'>
                  <div className='flex items-center justify-center gap-1 mb-1'>
                    <div className='w-3 h-3 rounded-full' style={{ backgroundColor: status.color }}></div>
                    <span className='text-xs font-medium text-gray-600'>{status.name}</span>
                  </div>
                  <p className='text-lg font-bold'>{status.value}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Earnings Trend */}
          <div className='bg-white p-4 md:p-6 rounded-xl shadow-sm border'>
            <h3 className='text-lg font-semibold text-gray-800 mb-4'>Weekly Earnings Trend</h3>
            <div className='h-64 md:h-72'>
              <ResponsiveContainer width='100%' height='100%'>
                <LineChart data={earningsTrendData}>
                  <CartesianGrid strokeDasharray='3 3' stroke='#f0f0f0' />
                  <XAxis 
                    dataKey='name' 
                    stroke='#6B7280'
                    fontSize={12}
                  />
                  <YAxis 
                    stroke='#6B7280'
                    fontSize={12}
                    tickFormatter={(value) => `${currency}${value}`}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'white',
                      border: '1px solid #E5E7EB',
                      borderRadius: '8px'
                    }}
                    formatter={(value) => [`${currency}${value}`, 'Earnings']}
                  />
                  <Legend />
                  <Line
                    type='monotone'
                    dataKey='earnings'
                    stroke='#3B82F6'
                    strokeWidth={2}
                    dot={{ r: 4 }}
                    activeDot={{ r: 6 }}
                    name='Earnings'
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Vaccine Popularity */}
          <div className='bg-white p-4 md:p-6 rounded-xl shadow-sm border'>
            <h3 className='text-lg font-semibold text-gray-800 mb-4'>Top Vaccines</h3>
            <div className='h-64 md:h-72'>
              <ResponsiveContainer width='100%' height='100%'>
                <BarChart data={vaccinePopularityData}>
                  <CartesianGrid strokeDasharray='3 3' stroke='#f0f0f0' />
                  <XAxis 
                    dataKey='name' 
                    stroke='#6B7280'
                    fontSize={11}
                    angle={-45}
                    textAnchor='end'
                    height={60}
                  />
                  <YAxis 
                    stroke='#6B7280'
                    fontSize={12}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'white',
                      border: '1px solid #E5E7EB',
                      borderRadius: '8px'
                    }}
                    formatter={(value) => [value, 'Appointments']}
                  />
                  <Legend />
                  <Bar
                    dataKey='count'
                    fill='#10B981'
                    radius={[4, 4, 0, 0]}
                    name='Appointments'
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
            
            <div className='mt-4 space-y-2'>
              {vaccinePopularityData.slice(0, 3).map((vaccine, index) => (
                <div key={index} className='flex items-center justify-between p-2 bg-gray-50 rounded-lg'>
                  <span className='text-sm font-medium text-gray-700 truncate mr-2'>{vaccine.name}</span>
                  <span className='px-2 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded-full'>
                    {vaccine.count} appointments
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default HospitalDashboard