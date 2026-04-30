import React, { useState } from 'react'
import { assets } from '../assets/assets'
import { toast } from 'react-toastify'

const Contact = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: ''
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!formData.name || !formData.email || !formData.message) {
      toast.error('Please fill in all fields')
      return
    }

    if (!formData.email.includes('@')) {
      toast.error('Please enter a valid email address')
      return
    }

    setIsSubmitting(true)
    
    // Simulate form submission - replace with your actual API call
    try {
      // Add your backend API call here
      // await axios.post('/api/contact', formData)
      
      // Simulating API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      toast.success('Message sent successfully! We will get back to you soon.')
      setFormData({ name: '', email: '', message: '' })
    } catch (error) {
      toast.error('Failed to send message. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div>

      <div className='text-center text-2xl pt-10 text-[#707070]'>
        <p>CONTACT <span className='text-gray-700 font-semibold'>US</span></p>
      </div>

      <div className='my-10 flex flex-col justify-center md:flex-row gap-10 mb-28 text-sm'>
        <img className='w-full md:max-w-[360px]' src={assets.contact_image} alt="" />
        
        <div className='flex flex-col justify-center items-start gap-6 w-full md:max-w-[400px]'>
          <p className='font-semibold text-lg text-gray-600'>SEND US A MESSAGE</p>
          
          <form onSubmit={handleSubmit} className='w-full space-y-4'>
            <div className='w-full'>
              <input
                type='text'
                name='name'
                value={formData.name}
                onChange={handleChange}
                placeholder='Your Name'
                className='w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-gray-500 transition-colors'
                disabled={isSubmitting}
              />
            </div>
            
            <div className='w-full'>
              <input
                type='email'
                name='email'
                value={formData.email}
                onChange={handleChange}
                placeholder='Your Email'
                className='w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-gray-500 transition-colors'
                disabled={isSubmitting}
              />
            </div>
            
            <div className='w-full'>
              <textarea
                name='message'
                value={formData.message}
                onChange={handleChange}
                placeholder='Your Message'
                rows='5'
                className='w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-gray-500 transition-colors resize-none'
                disabled={isSubmitting}
              />
            </div>
            
            <button
              type='submit'
              disabled={isSubmitting}
              className='w-full bg-gray-800 text-white py-3 rounded-lg hover:bg-gray-900 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2'
            >
              {isSubmitting ? (
                <>
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Sending...
                </>
              ) : (
                'Send Message'
              )}
            </button>
          </form>
        </div>
      </div>

    </div>
  )
}

export default Contact