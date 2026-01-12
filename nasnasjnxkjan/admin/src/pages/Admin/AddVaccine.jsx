import React, { useContext, useState } from 'react'
import { assets } from '../../assets/assets'
import { toast } from 'react-toastify'
import axios from 'axios'
import { AdminContext } from '../../context/AdminContext'
import { AppContext } from '../../context/AppContext'

const AddVaccine = () => {

    const [vaccineImg, setVaxImg] = useState(false)
    const [name, setName] = useState('')
    const [description, setDescription] = useState('')

    const { backendUrl } = useContext(AppContext)
    const { aToken } = useContext(AdminContext)

    const onSubmitHandler = async (event) => {
        event.preventDefault()

        try {


            const formData = new FormData();

            formData.append('image', vaccineImg)
            formData.append('name', name)
            formData.append('description', description)

            // console log formdata            
            formData.forEach((value, key) => {
                console.log(`${key}: ${value}`);
            });

            const { data } = await axios.post(backendUrl + '/api/admin/add-vaccine', formData, { headers: { aToken } })
            if (data.success) {
                toast.success(data.message)
                setVaxImg(false)
                setName('')
                setDescription('')
            } else {
                toast.error(data.message)
            }

        } catch (error) {
            toast.error(error.message)
            console.log(error)
        }

    }

    return (
        <form onSubmit={onSubmitHandler} className='m-5 w-full'>

            <p className='mb-3 text-lg font-medium'>Add Vaccine</p>

            <div className='bg-white px-8 py-8 border rounded w-full max-w-4xl max-h-[80vh] overflow-y-scroll'>
                

                <div className='flex flex-col lg:flex-row items-start gap-10 text-gray-600'>

                    <div className='w-full lg:flex-1 flex flex-col gap-4'>

                        <div className='flex-1 flex flex-col gap-1'>
                            <p>Vaccine Name</p>
                            <input onChange={e => setName(e.target.value)} value={name} className='border rounded px-3 py-2' type="text" placeholder='Vaccine Name' required />
                        </div>
                    </div>

                

                </div>

                <div>
                    <p className='mt-4 mb-2'>Description</p>
                    <textarea onChange={e => setDescription(e.target.value)} value={description} className='w-full px-4 pt-2 border rounded' rows={5} placeholder='Write Vaccine Description '></textarea>
                </div>

                <button type='submit' className='bg-primary px-10 py-3 mt-4 text-white rounded-full'>Add Vaccine</button>

            </div>


        </form>
    )
}

export default AddVaccine