import React, { useContext, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppContext } from '../context/AppContext';

const Hospitals = () => {
    const navigate = useNavigate();
    const { hospitals } = useContext(AppContext);
    const [searchTerm, setSearchTerm] = useState('');

    // Filter hospitals based on search term
    const filteredHospitals = hospitals.filter((hospital) =>
        hospital.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className='flex flex-col items-center gap-4 my-16 text-[#262626] md:mx-10'>
            {/* Search Bar */}
            <div className='w-full sm:w-1/2 mb-6'>
                <input
                    type='text'
                    placeholder='Search hospitals by name...'
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className='w-full px-4 py-2 border border-[#C9D8FF] rounded-full focus:outline-none focus:ring-2 focus:ring-[#EAEFFF] text-sm'
                />
            </div>
            <h1 className='text-3xl font-medium'>All Hospitals</h1>
            <p className='sm:w-1/2 text-center text-sm'>Simply browse through our extensive list of trusted hospitals.</p>
            <div className='w-full grid grid-cols-auto gap-4 pt-5 gap-y-6 px-3 sm:px-0'>
                {filteredHospitals.length > 0 ? (
                    filteredHospitals.map((item, index) => (
                        <div
                            onClick={() => {
                                navigate(`/appointment/${item._id}`);
                                scrollTo(0, 0);
                            }}
                            className='border border-[#C9D8FF] rounded-xl overflow-hidden cursor-pointer hover:translate-y-[-10px] transition-all duration-500'
                            key={index}
                        >
                            <img
                                className='w-full h-48 object-cover bg-[#EAEFFF]'
                                src={item.image}
                                alt={item.name}
                            />
                            <div className='p-4'>
                                <div className={`flex items-center gap-2 text-sm text-center ${item.available ? 'text-green-500' : 'text-gray-500'}`}>
                                    <p className={`w-2 h-2 rounded-full ${item.available ? 'bg-green-500' : 'bg-gray-500'}`}></p>
                                    <p>{item.available ? 'Available' : 'Not Available'}</p>
                                </div>
                                <p className='text-[#262626] text-lg font-medium'>{item.name}</p>
                                <p className='text-[#5C5C5C] text-sm'>{item.about}</p>
                            </div>
                        </div>
                    ))
                ) : (
                    <p className='text-center text-gray-500 col-span-full'>No hospitals found matching your search.</p>
                )}
            </div>
        </div>
    );
};

export default Hospitals;