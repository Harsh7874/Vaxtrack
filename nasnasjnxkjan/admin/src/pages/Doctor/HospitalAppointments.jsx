import React, { useContext, useEffect, useState, useMemo } from 'react';
import { AppContext } from '../../context/AppContext';
import { HospitalContext } from '../../context/HospitalContext';
import { assets } from '../../assets/assets';

const HospitalAppointments = () => {
  const {
    hToken,
    appointments,
    getAppointments,
    cancelAppointment,
    completeAppointment
  } = useContext(HospitalContext);

  const {
    slotDateFormat,
    calculateAge,
    currency
  } = useContext(AppContext);

  const [completingId, setCompletingId] = useState(null);
  const [activeFilter, setActiveFilter] = useState('ALL');
  const [showAll, setShowAll] = useState(false);

  const isToday = (dateString) => {
    const today = new Date();
    const d = new Date(dateString);

    return (
      d.getDate() === today.getDate() &&
      d.getMonth() === today.getMonth() &&
      d.getFullYear() === today.getFullYear()
    );
  };

  useEffect(() => {
    if (hToken) {
      getAppointments();
    }
  }, [hToken]);

  // Filter appointments based on active filter
  const getFilteredAppointments = useMemo(() => {
    if (!appointments) return [];

    return appointments.filter((item) => {
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
  }, [appointments, activeFilter]);

  // Get visible appointments based on showAll state
  const visibleAppointments = useMemo(() => {
    return showAll ? getFilteredAppointments : getFilteredAppointments.slice(0, 10);
  }, [getFilteredAppointments, showAll]);

  const handleComplete = async (id) => {
    try {
      setCompletingId(id);
      await completeAppointment(id);
    } catch (error) {
      console.error('Error completing appointment:', error);
    } finally {
      setCompletingId(null);
    }
  };

  const filterButtons = [
    { key: 'ALL', label: 'All', color: 'bg-blue-100 text-blue-700', icon: assets.list_icon },
    { key: 'TODAY', label: 'Today', color: 'bg-purple-100 text-purple-700', icon: assets.list_icon },
    { key: 'PENDING', label: 'Pending', color: 'bg-yellow-100 text-yellow-700', icon: assets.list_icon },
    { key: 'COMPLETED', label: 'Completed', color: 'bg-green-100 text-green-700', icon: assets.tick_icon },
    { key: 'CANCELLED', label: 'Cancelled', color: 'bg-red-100 text-red-700', icon: assets.cancel_icon },
  ];

  const getStatusCounts = useMemo(() => {
    if (!appointments) return { all: 0, today: 0, pending: 0, completed: 0, cancelled: 0 };
    
    const todayCount = appointments.filter(item => isToday(item.slotDate)).length;
    const pendingCount = appointments.filter(item => !item.cancelled && !item.isCompleted).length;
    const completedCount = appointments.filter(item => item.isCompleted).length;
    const cancelledCount = appointments.filter(item => item.cancelled).length;
    
    return {
      all: appointments.length,
      today: todayCount,
      pending: pendingCount,
      completed: completedCount,
      cancelled: cancelledCount
    };
  }, [appointments]);

  return (
    <div className="w-full max-w-6xl mx-auto p-4 lg:p-6">
      <h1 className="text-xl md:text-2xl font-bold text-gray-800 mb-4 md:mb-6">All Appointments</h1>

      {/* Filter Section */}
      <div className="bg-white rounded-xl shadow-sm p-4 md:p-6 mb-6 border">
        <p className="text-gray-700 font-medium mb-3 md:mb-4">Filter Appointments:</p>
        
        {/* Mobile Filter Tabs */}
        <div className="block md:hidden mb-4">
          <div className="flex overflow-x-auto pb-2 gap-2 scrollbar-hide -mx-1 px-1">
            {filterButtons.map((filter) => (
              <button
                key={filter.key}
                onClick={() => {
                  setActiveFilter(filter.key);
                  setShowAll(false);
                }}
                className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium ${
                  activeFilter === filter.key 
                    ? `${filter.color} ring-1 ring-current` 
                    : 'bg-gray-100 text-gray-600'
                }`}
              >
                <img src={filter.icon} alt={filter.label} className="w-3.5 h-3.5" />
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
        <div className="hidden md:flex flex-wrap gap-2">
          {filterButtons.map((filter) => (
            <button
              key={filter.key}
              onClick={() => {
                setActiveFilter(filter.key);
                setShowAll(false);
              }}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all ${
                activeFilter === filter.key 
                  ? `${filter.color} ring-2 ring-offset-1 ring-current` 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <img src={filter.icon} alt={filter.label} className="w-4 h-4" />
              <span className="hidden lg:inline">{filter.label}</span>
              <span className="lg:ml-1 px-1.5 py-0.5 text-xs bg-white rounded-full">
                {getStatusCounts[filter.key.toLowerCase()] || 0}
              </span>
            </button>
          ))}
        </div>

        {/* Filter Summary */}
        <div className="mt-4 pt-4 border-t border-gray-100 flex flex-col sm:flex-row items-start sm:items-center justify-between text-sm text-gray-500 gap-2">
          <div className="text-sm">
            Showing <span className="font-semibold text-gray-700">{visibleAppointments.length}</span> of{' '}
            <span className="font-semibold text-gray-700">{getFilteredAppointments.length}</span>{' '}
            {activeFilter.toLowerCase()} appointments
          </div>
          {getFilteredAppointments.length > 10 && !showAll && (
            <button
              onClick={() => setShowAll(true)}
              className="text-blue-600 hover:text-blue-800 font-medium hover:underline text-sm"
            >
              Show all {getFilteredAppointments.length} appointments
            </button>
          )}
        </div>
      </div>

      {/* Appointments List/Table */}
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        {/* Mobile Header */}
        <div className="md:hidden px-4 py-3 border-b bg-gray-50">
          <p className="font-semibold text-gray-700 text-base">
            {activeFilter === 'ALL' ? 'All Appointments' : `${activeFilter.charAt(0) + activeFilter.slice(1).toLowerCase()} Appointments`}
            <span className="ml-2 text-sm font-normal text-gray-500">({visibleAppointments.length})</span>
          </p>
        </div>

        {/* Desktop Table Header */}
        <div className="hidden md:grid md:grid-cols-12 gap-4 py-3 px-6 border-b bg-gray-50 text-gray-600 font-medium text-sm">
          <div className="col-span-1">#</div>
          <div className="col-span-2">Patient</div>
          <div className="col-span-1">Payment</div>
          <div className="col-span-1">Age</div>
          <div className="col-span-2">Vaccine</div>
          <div className="col-span-2">Date & Time</div>
          <div className="col-span-1">Price</div>
          <div className="col-span-2 text-center">Status / Action</div>
        </div>

        {/* Appointments List */}
        {visibleAppointments.length > 0 ? (
          <div className="divide-y divide-gray-100">
            {visibleAppointments.map((item, index) => (
              <div
                key={item._id || index}
                className="md:grid md:grid-cols-12 gap-4 py-4 px-4 md:px-6 hover:bg-gray-50 transition-colors"
              >
                {/* Desktop Index */}
                <div className="hidden md:block col-span-1 text-gray-500 self-center">
                  {index + 1}
                </div>

                {/* Patient Info */}
                <div className="col-span-12 md:col-span-2 mb-3 md:mb-0">
                  <div className="flex items-center gap-3">
                    <img 
                      src={item.userData.image} 
                      className="w-10 h-10 md:w-8 md:h-8 rounded-full object-cover border" 
                      alt={item.userData.name} 
                    />
                    <div>
                      <p className="font-semibold text-gray-800 text-sm md:text-base">{item.userData.name}</p>
                      {/* Mobile Status Badge */}
                      <div className="md:hidden mt-1">
                        <span className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full ${
                          item.cancelled ? 'bg-red-100 text-red-700' :
                          item.isCompleted ? 'bg-green-100 text-green-700' :
                          isToday(item.slotDate) ? 'bg-purple-100 text-purple-700' :
                          'bg-yellow-100 text-yellow-700'
                        }`}>
                          {item.cancelled ? 'Cancelled' : 
                           item.isCompleted ? 'Completed' : 
                           isToday(item.slotDate) ? 'Today' : 'Pending'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Payment Method */}
                <div className="col-span-6 md:col-span-1 mb-3 md:mb-0">
                  <div className="flex items-center gap-2">
                    <span className="md:hidden text-xs text-gray-500">Payment:</span>
                    <span className={`inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full ${
                      item.payment ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'
                    }`}>
                      {item.payment ? 'Online' : 'CASH'}
                    </span>
                  </div>
                </div>

                {/* Age */}
                <div className="col-span-6 md:col-span-1 mb-3 md:mb-0">
                  <div className="flex items-center gap-2">
                    <span className="md:hidden text-xs text-gray-500">Age:</span>
                    <span className="font-medium text-gray-700">{calculateAge(item.userData.dob)}</span>
                  </div>
                </div>
<button
                            onClick={() => handleComplete(item._id)}
                            className="flex items-center justify-center gap-1.5 px-3 py-2 bg-green-50 text-green-600 hover:bg-green-100 rounded-lg text-xs font-medium transition-colors flex-1 sm:flex-none"
                            title="Mark as Complete"
                          >
                            <img className="w-3.5 h-3.5" src={assets.tick_icon} alt="Complete" />
                            <span>Complete</span>
                          </button>
                {/* Vaccine */}
                <div className="col-span-6 md:col-span-2 mb-3 md:mb-0">
                  <div className="flex items-center gap-2">
                    <span className="md:hidden text-xs text-gray-500">Vaccine:</span>
                    <span className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-primary bg-opacity-10 text-primary border border-primary border-opacity-20">
                      {item.vaccineName}
                    </span>
                  </div>
                </div>

                {/* Date & Time */}
                <div className="col-span-6 md:col-span-2 mb-3 md:mb-0">
                  <div>
                    <div className="flex items-center gap-2 md:block">
                      <span className="md:hidden text-xs text-gray-500">Date:</span>
                      <p className="font-medium text-gray-700 text-sm">{slotDateFormat(item.slotDate)}</p>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">{item.slotTime}</p>
                    {isToday(item.slotDate) && !item.cancelled && !item.isCompleted && (
                      <span className="mt-1 inline-block px-2 py-0.5 text-xs bg-purple-100 text-purple-700 rounded-full">
                        Today
                      </span>
                    )}
                  </div>
                </div>

                {/* Price */}
                <div className="col-span-6 md:col-span-1 mb-3 md:mb-0">
                  <div className="flex items-center gap-2">
                    <span className="md:hidden text-xs text-gray-500">Price:</span>
                    <span className="font-semibold text-gray-800">{currency}{item.vaccinePrice}</span>
                  </div>
                </div>

                {/* Status / Actions */}
                <div className="col-span-12 md:col-span-2">
                  <div className="flex flex-col sm:flex-row md:flex-col lg:flex-row items-start md:items-center gap-2 md:justify-center">
                    {item.cancelled ? (
                      <div className="w-full sm:w-auto">
                        <span className="inline-flex items-center justify-center w-full sm:w-auto px-3 py-1.5 bg-red-100 text-red-700 text-xs font-medium rounded-full">
                          Cancelled
                        </span>
                      </div>
                    ) : item.isCompleted ? (
                      <div className="w-full sm:w-auto">
                        <span className="inline-flex items-center justify-center w-full sm:w-auto px-3 py-1.5 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                          Completed
                        </span>
                      </div>
                    ) : isToday(item.slotDate) ? (
                      <div className="flex flex-col sm:flex-row gap-2 w-full">
                        <button
                          onClick={() => cancelAppointment(item._id)}
                          className="flex items-center justify-center gap-1.5 px-3 py-2 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg text-xs font-medium transition-colors flex-1 sm:flex-none"
                          title="Cancel Appointment"
                        >
                          <img className="w-3.5 h-3.5" src={assets.cancel_icon} alt="Cancel" />
                          <span>Cancel</span>
                        </button>
                        {completingId === item._id ? (
                          <div className="flex items-center justify-center gap-1.5 px-3 py-2 bg-green-50 text-green-600 rounded-lg text-xs font-medium flex-1 sm:flex-none">
                            <div className="w-3.5 h-3.5 border-2 border-green-500 border-t-transparent rounded-full animate-spin"></div>
                            <span>Processing</span>
                          </div>
                        ) : (
                          <button
                            onClick={() => handleComplete(item._id)}
                            className="flex items-center justify-center gap-1.5 px-3 py-2 bg-green-50 text-green-600 hover:bg-green-100 rounded-lg text-xs font-medium transition-colors flex-1 sm:flex-none"
                            title="Mark as Complete"
                          >
                            <img className="w-3.5 h-3.5" src={assets.tick_icon} alt="Complete" />
                            <span>Complete</span>
                          </button>
                        )}
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 w-full justify-between sm:justify-start">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-yellow-100 text-yellow-700 text-xs font-medium rounded-full">
                          PENDING
                        </span>
                        {new Date(item.slotDate) > new Date() && (
                          <span className="text-xs text-gray-400 hidden sm:block">
                            Upcoming
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="px-4 md:px-6 py-12 md:py-16 text-center">
            <img src={assets.empty_icon} alt="No appointments" className="w-16 h-16 md:w-20 md:h-20 mx-auto opacity-50 mb-4" />
            <p className="text-gray-500 text-base md:text-lg font-medium">
              No {activeFilter.toLowerCase()} appointments found
            </p>
            <p className="text-gray-400 text-sm mt-1 md:mt-2">
              {activeFilter !== 'ALL' ? 'Try selecting a different filter' : 'No appointments scheduled yet'}
            </p>
            {activeFilter !== 'ALL' && (
              <button
                onClick={() => setActiveFilter('ALL')}
                className="mt-4 px-4 py-2 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg text-sm font-medium transition-colors"
              >
                Show All Appointments
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default HospitalAppointments;