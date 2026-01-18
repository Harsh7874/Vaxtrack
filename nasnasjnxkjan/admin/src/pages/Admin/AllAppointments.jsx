import React, { useEffect, useState } from 'react'
import { assets } from '../../assets/assets'
import axios from 'axios'
import { AppContext } from '../../context/AppContext'
import { useContext } from 'react'

const AllAppointments = () => {
  const { slotDateFormat, calculateAge, currency, backendUrl } = useContext(AppContext)

  const [appointments, setAppointments] = useState([])
  const [loading, setLoading] = useState(false)
  const [filters, setFilters] = useState({
    pageNo: 1,
    limit: 10,
    startDate: '',
    endDate: '',
    isCompleted: '',
    cancelled: ''
  })
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalAppointments: 0,
    hasNextPage: false,
    hasPreviousPage: false,
    limit: 10
  })
  const [dateFilterType, setDateFilterType] = useState('none') // 'none', 'today', 'range'

  // Fetch appointments function
  const fetchAppointments = async () => {
    setLoading(true)
    try {
      const token = localStorage.getItem('a-token')

      // Prepare query parameters
      const queryParams = new URLSearchParams()
      queryParams.append('pageNo', filters.pageNo)
      queryParams.append('limit', filters.limit)

      // Handle date filters
      if (dateFilterType === 'today') {
        const today = new Date().toISOString().split('T')[0]
        queryParams.append('startDate', today)
        queryParams.append('endDate', today)
      } else if (dateFilterType === 'range') {
        if (filters.startDate) queryParams.append('startDate', filters.startDate)
        if (filters.endDate) queryParams.append('endDate', filters.endDate)
      }

      // Handle status filters
      if (filters.isCompleted !== '') queryParams.append('isCompleted', filters.isCompleted)
      if (filters.cancelled !== '') queryParams.append('cancelled', filters.cancelled)

      const response = await axios.get(`${backendUrl}/api/admin/appointments?${queryParams.toString()}`, {
        headers: {
          'Authorization': token  // Fixed: Should be an object with Authorization key
        }
      })

      if (response.data.success) {
        // Fixed: API returns 'appointment' not 'appointments'
        setAppointments(response.data.appointments || [])
        // Check if pagination data exists in response
        if (response.data.pagination) {
          setPagination(response.data.pagination)
        } else {
          // Calculate basic pagination if not provided by API
          setPagination({
            currentPage: filters.pageNo,
            totalPages: Math.ceil((response.data.appointment || []).length / filters.limit),
            totalAppointments: (response.data.appointment || []).length,
            hasNextPage: (response.data.appointment || []).length >= filters.limit,
            hasPreviousPage: filters.pageNo > 1,
            limit: filters.limit
          })
        }
      }
    } catch (error) {
      console.error('Error fetching appointments:', error)
      alert('Failed to load appointments')
    } finally {
      setLoading(false)
    }
  }

  // Cancel appointment function
  const cancelAppointment = async (id) => {
    if (!window.confirm('Are you sure you want to cancel this appointment?')) return

    try {
      const token = localStorage.getItem('a-token')
      const response = await axios.put(`${backendUrl}/api/appointments/${id}/cancel`, {}, {
        headers: { 'Authorization': token }
      })

      if (response.data.success) {
        alert('Appointment cancelled successfully')
        fetchAppointments() // Refresh the list
      }
    } catch (error) {
      console.error('Error cancelling appointment:', error)
      alert('Failed to cancel appointment')
    }
  }

  // Handle filter changes
  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
      pageNo: 1 // Reset to first page when filters change
    }))
  }

  // Handle date filter type change
  const handleDateFilterTypeChange = (type) => {
    setDateFilterType(type)
    if (type !== 'range') {
      setFilters(prev => ({ ...prev, startDate: '', endDate: '' }))
    }
    // Don't reset other filters
  }

  // Handle page navigation
  const handlePageChange = (page) => {
    if (page < 1 || page > pagination.totalPages) return
    handleFilterChange('pageNo', page)
  }

  // Apply filters button handler
  const handleApplyFilters = () => {
    fetchAppointments()
  }
  const defaultFilters = {
    pageNo: 1,
    limit: 10,
    startDate: '',
    endDate: '',
    isCompleted: '',
    cancelled: ''
  }

  // Reset all filters
  const handleResetFilters = () => {
    setFilters(defaultFilters)
    setDateFilterType('none')
    fetchAppointments()
  }

  // Fetch appointments when filters change
  useEffect(() => {
    fetchAppointments()
  }, [filters.pageNo, filters.limit])

  // Also fetch when dateFilterType changes (for Today filter)
  useEffect(() => {
    if (dateFilterType === 'today') {
      fetchAppointments()
    }
  }, [dateFilterType])

  return (
    <div className='w-full max-w-6xl mx-auto p-5'>

      <p className='mb-3 text-lg font-medium'>All Appointments</p>

      {/* Filters Navigation Bar */}
      <div className='bg-white border rounded-lg p-4 mb-4 shadow-sm'>
        <div className='flex flex-col gap-4'>

          {/* Status Filters */}
          <div className='flex flex-wrap gap-2 items-center'>
            <span className='text-sm font-medium text-gray-700'>Status:</span>
            <button
              onClick={() => {
                handleFilterChange('isCompleted', '')
                handleFilterChange('cancelled', '')
              }}
              className={`px-3 py-1 text-sm rounded ${filters.isCompleted === '' && filters.cancelled === '' ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
            >
              All
            </button>
            <button
              onClick={() => {
                handleFilterChange('isCompleted', 'true')
                handleFilterChange('cancelled', '')
              }}
              className={`px-3 py-1 text-sm rounded ${filters.isCompleted === 'true' ? 'bg-green-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
            >
              Completed
            </button>
            <button
              onClick={() => {
                handleFilterChange('isCompleted', 'false')
                handleFilterChange('cancelled', 'false')
              }}
              className={`px-3 py-1 text-sm rounded ${filters.isCompleted === 'false' && filters.cancelled === 'false' ? 'bg-yellow-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
            >
              Pending
            </button>
            <button
              onClick={() => {
                handleFilterChange('isCompleted', '')
                handleFilterChange('cancelled', 'true')
              }}
              className={`px-3 py-1 text-sm rounded ${filters.cancelled === 'true' ? 'bg-red-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
            >
              Cancelled
            </button>
          </div>

          {/* Date Filters */}
          <div className='flex flex-wrap gap-4 items-center'>
            <span className='text-sm font-medium text-gray-700'>Date Filter:</span>
            <button
              onClick={() => handleDateFilterTypeChange('none')}
              className={`px-3 py-1 text-sm rounded ${dateFilterType === 'none' ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
            >
              All Dates
            </button>
            <button
              onClick={() => handleDateFilterTypeChange('today')}
              className={`px-3 py-1 text-sm rounded ${dateFilterType === 'today' ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
            >
              Today
            </button>
            <button
              onClick={() => handleDateFilterTypeChange('range')}
              className={`px-3 py-1 text-sm rounded ${dateFilterType === 'range' ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
            >
              Date Range
            </button>

            {dateFilterType === 'range' && (
              <div className='flex flex-wrap gap-2 items-center'>
                <div>
                  <label className='text-xs text-gray-500'>Start Date</label>
                  <input
                    type="date"
                    value={filters.startDate}
                    onChange={(e) => handleFilterChange('startDate', e.target.value)}
                    className='border rounded px-2 py-1 text-sm'
                  />
                </div>
                <div>
                  <label className='text-xs text-gray-500'>End Date</label>
                  <input
                    type="date"
                    value={filters.endDate}
                    onChange={(e) => handleFilterChange('endDate', e.target.value)}
                    className='border rounded px-2 py-1 text-sm'
                  />
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className='flex flex-wrap gap-2 justify-between items-center'>
            <div className='flex gap-2'>
              <button
                onClick={handleApplyFilters}
                className='px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm font-medium'
              >
                Apply Filters
              </button>

            </div>

            {/* Results per page */}
            <div className='flex items-center gap-2'>
              <span className='text-sm text-gray-700'>Show:</span>
              <select
                value={filters.limit}
                onChange={(e) => handleFilterChange('limit', parseInt(e.target.value))}
                className='border rounded px-2 py-1 text-sm'
              >
                <option value="5">5</option>
                <option value="10">10</option>
                <option value="20">20</option>
                <option value="50">50</option>
              </select>
              <span className='text-sm text-gray-700'>per page</span>
            </div>
          </div>
        </div>
      </div>

      {/* Pagination Info */}
      <div className='flex justify-between items-center mb-3'>
        <div className='text-sm text-gray-600'>
          Showing {appointments.length > 0 ? ((pagination.currentPage - 1) * pagination.limit) + 1 : 0} to{' '}
          {Math.min(pagination.currentPage * pagination.limit, pagination.totalAppointments)} of{' '}
          {pagination.totalAppointments} appointments
        </div>

        {/* Pagination Controls */}
        <div className='flex items-center gap-2'>
          <button
            onClick={() => handlePageChange(pagination.currentPage - 1)}
            disabled={!pagination.hasPreviousPage || loading}
            className={`px-3 py-1 rounded ${pagination.hasPreviousPage ? 'bg-gray-200 hover:bg-gray-300' : 'bg-gray-100 text-gray-400 cursor-not-allowed'}`}
          >
            Previous
          </button>

          <div className='flex items-center gap-1'>
            {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
              let pageNum;
              if (pagination.totalPages <= 5) {
                pageNum = i + 1;
              } else if (pagination.currentPage <= 3) {
                pageNum = i + 1;
              } else if (pagination.currentPage >= pagination.totalPages - 2) {
                pageNum = pagination.totalPages - 4 + i;
              } else {
                pageNum = pagination.currentPage - 2 + i;
              }

              return (
                <button
                  key={pageNum}
                  onClick={() => handlePageChange(pageNum)}
                  className={`px-3 py-1 rounded ${pagination.currentPage === pageNum ? 'bg-blue-500 text-white' : 'bg-gray-200 hover:bg-gray-300'}`}
                >
                  {pageNum}
                </button>
              );
            })}
          </div>

          <button
            onClick={() => handlePageChange(pagination.currentPage + 1)}
            disabled={!pagination.hasNextPage || loading}
            className={`px-3 py-1 rounded ${pagination.hasNextPage ? 'bg-gray-200 hover:bg-gray-300' : 'bg-gray-100 text-gray-400 cursor-not-allowed'}`}
          >
            Next
          </button>
        </div>
      </div>

      {/* Appointments Table */}
      <div className='bg-white border rounded text-sm max-h-[60vh] overflow-y-auto'>

        {/* HEADER */}
        <div className='hidden sm:grid grid-cols-[0.4fr_2.6fr_0.8fr_2.8fr_2fr_2fr_1fr_1.2fr] items-center py-3 px-6 border-b bg-gray-50 text-gray-700'>
          <p className='font-medium'>#</p>
          <p className='font-medium'>Patient</p>
          <p className='font-medium'>Age</p>
          <p className='font-medium'>Date & Time</p>
          <p className='font-medium'>Hospital</p>
          <p className='font-medium'>Vaccine</p>
          <p className='font-medium'>Amount</p>
          <p className='font-medium text-center'>Action</p>
        </div>

        {loading ? (
          <div className='py-8 text-center text-gray-500'>
            Loading appointments...
          </div>

        ) : appointments?.length === 0 ? (

          <div className='py-8 text-center text-gray-500'>
            No appointments found
          </div>

        ) : (

          appointments.map((item, index) => (

            <div
              key={item._id}
              className='grid grid-cols-[0.4fr_2.6fr_0.8fr_2.8fr_2fr_2fr_1fr_1.2fr] items-center py-3 px-6 border-b hover:bg-gray-50 text-gray-600'
            >

              {/* # */}
              <p className='max-sm:hidden'>
                {(pagination.currentPage - 1) * pagination.limit + index + 1}
              </p>

              {/* Patient */}
              <div className='flex items-center gap-2 min-w-0'>
                <img
                  src={item.userData?.image || assets.default_user}
                  className='w-8 h-8 rounded-full object-cover flex-shrink-0'
                  alt="Patient"
                  onError={(e) => {
                    e.target.src = assets.default_user || '/default-user.png'
                  }}
                />
                <p className='truncate'>
                  {item.userData?.name || 'N/A'}
                </p>
              </div>

              {/* Age */}
              <p className='max-sm:hidden'>
                {calculateAge(item.userData?.dob) || 'N/A'}
              </p>

              {/* Date Time */}
              <p className='truncate'>
                {slotDateFormat(item.slotDate)}, {item.slotTime}
              </p>

              {/* Hospital */}
              <p className='truncate'>
                {item.hospitalData?.name || 'N/A'}
              </p>

              {/* Vaccine */}
              <p className='truncate font-medium text-blue-700'>
                {item.vaccineName || 'N/A'}
              </p>

              {/* Amount */}
              <p className='whitespace-nowrap'>
                {currency}{item.vaccinePrice || '0'}
              </p>

              {/* Action */}
              <div className='flex justify-center'>
                {item.cancelled ? (
                  <span className='text-red-500 text-xs font-medium px-2 py-1 bg-red-50 rounded w-24 text-center'>
                    Cancelled
                  </span>

                ) : item.isCompleted ? (

                  <span className='text-green-600 text-xs font-medium px-2 py-1 bg-green-50 rounded w-24 text-center'>
                    Completed
                  </span>

                ) : (
                  <span className='text-yellow-600 text-xs font-medium px-2 py-1 bg-yellow-50 rounded w-24 text-center'>
                    Pending
                  </span>


                )}
              </div>

            </div>
          ))
        )}
      </div>


      {/* Bottom Pagination Info */}
      <div className='mt-4 text-center text-sm text-gray-500'>
        Page {pagination.currentPage} of {pagination.totalPages}
      </div>

    </div>
  )
}

export default AllAppointments