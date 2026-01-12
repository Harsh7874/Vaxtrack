import React, { useContext, useEffect, useState } from 'react';
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

  useEffect(() => {
    if (hToken) {
      getAppointments();
    }
  }, [hToken]);

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

  return (
    <div className="w-full max-w-6xl m-5">
      <p className="mb-3 text-lg font-medium">All Appointments</p>

      <div className="bg-white border rounded text-sm max-h-[80vh] overflow-y-scroll">
        <div className="max-sm:hidden grid grid-cols-[0.5fr_1fr_0.7fr_1fr_1fr_1fr_1fr_2fr] gap-1 py-3 px-6 border-b">
          <p>#</p>
          <p>Patient</p>
          <p>Payment</p>
          <p>Age</p>
          <p>Vaccine</p>
          <p>Date & Time</p>
          <p>Price</p>
          <p>Action</p>
        </div>

        {appointments.map((item, index) => (
          <div
            key={index}
            className="flex flex-wrap justify-between max-sm:gap-5 max-sm:text-base sm:grid grid-cols-[0.5fr_1fr_0.7fr_1fr_1fr_1fr_1fr_2fr] gap-1 items-center text-gray-500 py-3 px-6 border-b hover:bg-gray-50"
          >
            <p className="max-sm:hidden">{index + 1}</p>

            <div className="flex items-center gap-2">
              <img src={item.userData.image} className="w-8 h-8 rounded-full" alt="" />
              <p>{item.userData.name}</p>
            </div>

            <div>
              <p className="text-xs inline border border-primary px-2 rounded-full">
                {item.payment ? 'Online' : 'CASH'}
              </p>
            </div>

            <p className="max-sm:hidden">{calculateAge(item.userData.dob)}</p>

            <div>
              <p className="text-xs inline border border-primary px-2 rounded-full">
                {item.vaccineName}
              </p>
            </div>

            <p>{slotDateFormat(item.slotDate)}, {item.slotTime}</p>
            <p>{currency}{item.vaccinePrice}</p>

            {item.cancelled ? (
              <p className="text-red-400 text-xs font-medium">Cancelled</p>
            ) : item.isCompleted ? (
              <p className="text-green-500 text-xs font-medium">Completed</p>
            ) : (
              <div className="flex items-center gap-2">
                <img
                  onClick={() => cancelAppointment(item._id)}
                  className="w-10 cursor-pointer"
                  src={assets.cancel_icon}
                  alt="Cancel"
                />
                {completingId === item._id ? (
                  <div className="w-10 h-10 flex items-center justify-center">
                    <div className="w-5 h-5 border-2 border-green-500 border-t-transparent rounded-full animate-spin"></div>
                  </div>
                ) : (
                  <img
                    onClick={() => handleComplete(item._id)}
                    className="w-10 cursor-pointer"
                    src={assets.tick_icon}
                    alt="Complete"
                  />
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default HospitalAppointments;
