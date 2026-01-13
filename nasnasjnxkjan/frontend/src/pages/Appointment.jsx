import React, { useContext, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AppContext } from '../context/AppContext';
import { assets } from '../assets/assets';
import axios from 'axios';
import { toast } from 'react-toastify';

// Loader component
const Loader = () => (
  <div className="flex items-center justify-center h-screen">
    <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-blue-500 border-solid"></div>
  </div>
);

const Appointment = () => {
  const { hospitalId } = useParams();
  const { hospitals, currencySymbol, backendUrl, token, getHospitalsData } = useContext(AppContext);
  const daysOfWeek = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

  const [hospitalInfo, setHospitalInfo] = useState(null);
  const [hospitalSlots, setHospitalSlots] = useState([]);
  const [slotIndex, setSlotIndex] = useState(0);
  const [slotTime, setSlotTime] = useState('');
  const [availableVaccines, setAvailableVaccines] = useState([]);
  const [selectedVaccine, setSelectedVaccine] = useState(null);
  const [loading, setLoading] = useState(true);

  const navigate = useNavigate();

  const fetchHospitalInfo = async () => {
    const found = hospitals.find(h => h._id === hospitalId);
    setHospitalInfo(found);
  };

  const fetchVaccines = async () => {
    try {
      const response = await axios.get(`${backendUrl}/api/admin/all-hospitals/${hospitalId}`);
      const vaccines = response.data
        .map(hv => ({
          vaccineId: hv.vaccine._id,
          vaccineName: hv.vaccine.name,
          quantity: hv.quantity,
          price: hv.price,
        }))
        .filter(v => v.quantity > 0);
      setAvailableVaccines(vaccines);
    } catch (error) {
      console.error('Error fetching vaccines:', error);
      toast.error('Failed to load vaccines');
    }
  };

  const getAvailableSlots = async () => {
    setHospitalSlots([]);
    const today = new Date();

    for (let i = 0; i < 7; i++) {
      let currentDate = new Date(today);
      currentDate.setDate(today.getDate() + i);

      let endTime = new Date(today);
      endTime.setDate(today.getDate() + i);
      endTime.setHours(21, 0, 0, 0);

      if (today.getDate() === currentDate.getDate()) {
        currentDate.setHours(currentDate.getHours() > 10 ? currentDate.getHours() + 1 : 10);
        currentDate.setMinutes(currentDate.getMinutes() > 30 ? 30 : 0);
      } else {
        currentDate.setHours(10);
        currentDate.setMinutes(0);
      }

      let timeSlots = [];

      while (currentDate < endTime) {
        let formattedTime = currentDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        let day = currentDate.getDate();
        let month = currentDate.getMonth() + 1;
        let year = currentDate.getFullYear();
        const slotDate = `${day}_${month}_${year}`;
        const MAX_USERS_PER_SLOT = 10;

        const bookedSlotsForDay = hospitalInfo?.slots_booked?.[slotDate] || [];

        const slotInfo = bookedSlotsForDay.find(s => s.time === formattedTime);

        const bookedCount = slotInfo ? slotInfo.nuser : 0;
        const remaining = MAX_USERS_PER_SLOT - bookedCount;

        const isSlotAvailable = remaining > 0;

       if (isSlotAvailable) {
  timeSlots.push({
    datetime: new Date(currentDate),
    time: formattedTime,
    booked: bookedCount,
    remaining: remaining
  });
}


        currentDate.setMinutes(currentDate.getMinutes() + 30);
      }

      setHospitalSlots(prev => [...prev, timeSlots]);
    }
  };

  const bookAppointment = async () => {
    if (!token) {
      toast.warning('Login to book appointment');
      return navigate('/login');
    }

    if (!selectedVaccine) {
      toast.warning('Please select a vaccine');
      return;
    }

    if (!slotTime) {
      toast.warning('Please select a time slot');
      return;
    }

    const date = hospitalSlots[slotIndex][0].datetime;
    const day = date.getDate();
    const month = date.getMonth() + 1;
    const year = date.getFullYear();
    const slotDate = `${day}_${month}_${year}`;

    const appointmentData = {
      hospitalId,
      slotDate,
      slotTime,
      vaccineId: selectedVaccine.vaccineId,
      vaccinePrice: selectedVaccine.price,
      vaccineName: selectedVaccine.vaccineName,
    };

    console.log('Booking Appointment Data:', appointmentData);

    try {
      const { data } = await axios.post(
        `${backendUrl}/api/user/book-appointment`,
        appointmentData,
        { headers: { token } }
      );

      if (data.success) {
        toast.success(data.message);
        getHospitalsData();
        // navigate('/my-appointments');
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      console.error(error);
      toast.error(error.message);
    }
  };

  useEffect(() => {
    if (hospitals.length > 0) {
      fetchHospitalInfo();
    }
  }, [hospitals, hospitalId]);

  useEffect(() => {
    if (hospitalId) {
      fetchVaccines();
    }
  }, [hospitalId]);

  useEffect(() => {
    if (hospitalInfo) {
      getAvailableSlots().then(() => setLoading(false));
    }
  }, [hospitalInfo]);

  if (loading) return <Loader />;

  return hospitalInfo ? (
    <div>
      {/* ---------- Hospital Details ----------- */}
      <div className='flex flex-col sm:flex-row gap-4'>
        <div>
          <img className='bg-primary w-full sm:max-w-72 rounded-lg' src={hospitalInfo.image} alt="" />
        </div>
        <div className='flex-1 border border-[#ADADAD] rounded-lg p-8 py-7 bg-white mx-2 sm:mx-0 mt-[-80px] sm:mt-0'>
          <p className='flex items-center gap-2 text-3xl font-medium text-gray-700'>
            {hospitalInfo.name}
            <img className='w-5' src={assets.verified_icon} alt="" />
          </p>
          <div className='mt-3'>
            <p className='flex items-center gap-1 text-sm font-medium text-[#262626]'>
              About <img className='w-3' src={assets.info_icon} alt="" />
            </p>
            <p className='text-sm text-gray-600 max-w-[700px] mt-1'>{hospitalInfo.about}</p>
          </div>
        </div>
      </div>

      {/* ---------- Vaccine Selection Slider ---------- */}
      <div className='sm:ml-72 sm:pl-4 mt-8 font-medium text-[#565656]'>
        <p className='text-lg'>Select Vaccine</p>
        {availableVaccines.length > 0 ? (
          <div className='flex gap-3 items-center w-full overflow-x-scroll mt-4'>
            {availableVaccines.map((vaccine, index) => (
              <div
                key={index}
                onClick={() => setSelectedVaccine(vaccine)}
                className={`text-center py-4 px-6 min-w-32 rounded-full cursor-pointer ${selectedVaccine && selectedVaccine.vaccineId === vaccine.vaccineId
                    ? 'bg-primary text-white'
                    : 'border border-[#DDDDDD]'
                  }`}
              >
                <p>{vaccine.vaccineName}</p>
                <p>{currencySymbol}{vaccine.price}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className='text-gray-600 mt-4'>No vaccines available at this hospital.</p>
        )}
        {selectedVaccine && (
          <p className='mt-4 text-sm text-gray-600'>
            Selected: {selectedVaccine.vaccineName} - {currencySymbol}{selectedVaccine.price}
          </p>
        )}
      </div>

      {/* ---------- Booking Slots ---------- */}
      <div className='sm:ml-72 sm:pl-4 mt-8 font-medium text-[#565656]'>
        <p>Booking Slots</p>
        <div className='flex gap-3 items-center w-full overflow-x-scroll mt-4'>
          {hospitalSlots.length > 0 &&
            hospitalSlots.map((item, index) => (
              <div
                key={index}
                onClick={() => setSlotIndex(index)}
                className={`text-center py-6 min-w-16 rounded-full cursor-pointer ${slotIndex === index ? 'bg-primary text-white' : 'border border-[#DDDDDD]'
                  }`}
              >
                <p>{item[0] && daysOfWeek[item[0].datetime.getDay()]}</p>
                <p>{item[0] && item[0].datetime.getDate()}</p>
              </div>
            ))}
        </div>
        <div className='flex items-center gap-3 w-full overflow-x-scroll mt-4'>
          {hospitalSlots.length > 0 &&
            hospitalSlots[slotIndex]?.map((item, index) => (
           <div
  key={index}
  onClick={() => setSlotTime(item.time)}
  className={`text-sm flex-shrink-0 px-5 py-2 rounded-full cursor-pointer border
    ${
      item.time === slotTime
        ? 'bg-primary text-white border-primary'
        : 'text-[#949494] border-[#B4B4B4]'
    }
  `}
>
  <div className="text-center leading-tight">
    <p>{item.time.toLowerCase()}</p>
    <p className="text-[11px] opacity-80">
      {item.remaining} / 10 left
    </p>
  </div>
</div>

            ))}
        </div>
        <button
          onClick={bookAppointment}
          className='bg-primary text-white text-sm font-light px-20 py-3 rounded-full my-6'
        >
          Book an Appointment
        </button>
      </div>
    </div>
  ) : null;
};

export default Appointment;
