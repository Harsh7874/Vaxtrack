import React from 'react'
import { assets } from '../assets/assets'

const About = () => {
  return (
    <div>

      <div className='text-center text-2xl pt-10 text-[#707070]'>
        <p>ABOUT <span className='text-gray-700 font-semibold'>US</span></p>
      </div>

      <div className='my-10 flex flex-col md:flex-row gap-12'>
        <img className='w-full md:max-w-[360px]' src={assets.about_image} alt="" />
        <div className='flex flex-col justify-center gap-6 md:w-2/4 text-sm text-gray-600'>
          <p>Welcome to VaxTrack, your trusted companion in simplifying vaccine booking and health safety management. At VaxTrack, we understand the importance of timely vaccinations and the challenges individuals face in finding available slots and nearby hospitals..</p>
          <p>VaxTrack is dedicated to innovation in healthcare technology. Our platform is designed to streamline vaccine appointments, provide real-time hospital and vaccine availability, and allow easy access to vaccination certificates and appointment details. Whether you're booking your first dose or managing follow-ups, VaxTrack is here to make the process smooth and secure.</p>
          <b className='text-gray-800'>Our Vision</b>
          <p>Our vision at VaxTrack is to create a unified, accessible vaccination experience for everyone. We strive to connect patients with certified hospitals efficiently, ensuring that access to essential vaccines is just a few clicks away — anytime, anywhere.</p>
        </div>
      </div>

      <div className='text-xl my-4'>
        <p>WHY  <span className='text-gray-700 font-semibold'>CHOOSE US</span></p>
      </div>

      <div className='flex flex-col md:flex-row mb-20'>
        <div className='border px-10 md:px-16 py-8 sm:py-16 flex flex-col gap-5 text-[15px] hover:bg-primary hover:text-white transition-all duration-300 text-gray-600 cursor-pointer'>
          <b>EFFICIENCY:</b>
          <p>Quick and easy vaccine appointment scheduling that saves you time and hassle.</p>
        </div>
        <div className='border px-10 md:px-16 py-8 sm:py-16 flex flex-col gap-5 text-[15px] hover:bg-primary hover:text-white transition-all duration-300 text-gray-600 cursor-pointer'>
          <b>CONVENIENCE: </b>
          <p>Locate nearby trusted hospitals using real-time geolocation and hospital availability features.</p>
        </div>
        <div className='border px-10 md:px-16 py-8 sm:py-16 flex flex-col gap-5 text-[15px] hover:bg-primary hover:text-white transition-all duration-300 text-gray-600 cursor-pointer'>
          <b>RELIABILITY:</b>
          <p >Partnered with 100+ verified hospitals, ensuring safe and authentic vaccine administration.</p>
        </div>
      </div>

    </div>
  )
}

export default About
