import React, { useContext, useState, useEffect } from 'react';
import { assets } from '../../assets/assets';
import { toast } from 'react-toastify';
import axios from 'axios';
import { AdminContext } from '../../context/AdminContext';
import { AppContext } from '../../context/AppContext';

const AddHospital = () => {
    const [hospitalImg, setHospitalImg] = useState(null);
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [about, setAbout] = useState('');
    const [address1, setAddress1] = useState('');
    const [address2, setAddress2] = useState('');
    const [longitude, setLongitude] = useState('');
    const [latitude, setLatitude] = useState('');
    const [vaccines, setVaccines] = useState([]);
    const [selectedVaccines, setSelectedVaccines] = useState([]);
    const { backendUrl } = useContext(AppContext);
    const { aToken } = useContext(AdminContext);

    useEffect(() => {
        const fetchVaccines = async () => {
            try {
                const { data } = await axios.get(`${backendUrl}/api/vaccine/list`);
                if (data.success) {
                    setVaccines(data.vaccines);
                } else {
                    toast.error(data.message || 'Failed to fetch vaccines');
                }
            } catch (error) {
                toast.error(error.message);
                console.log(error);
            }
        };
        fetchVaccines();
    }, [backendUrl]);

    const addVaccine = () => {
        setSelectedVaccines([...selectedVaccines, { vaccineId: '', vaccineName: '', quantity: '', price: '' }]);
    };

    const removeVaccine = (index) => {
        const newSelected = selectedVaccines.filter((_, i) => i !== index);
        setSelectedVaccines(newSelected);
    };

    const handleVaccineChange = (index, field, value) => {
        const newSelected = [...selectedVaccines];
        newSelected[index][field] = value;
        if (field === 'vaccineId') {
            const selectedVax = vaccines.find(v => v._id === value);
            if (selectedVax) {
                newSelected[index].vaccineName = selectedVax.name;
            } else {
                newSelected[index].vaccineName = '';
            }
        }
        setSelectedVaccines(newSelected);
    };

    const onSubmitHandler = async (event) => {
        event.preventDefault();
        try {
            if (!hospitalImg) {
                return toast.error('Image Not Selected');
            }
            // Validate latitude and longitude
            const lat = parseFloat(latitude);
            const lon = parseFloat(longitude);
            if (isNaN(lat) || isNaN(lon)) {
                return toast.error('Invalid latitude or longitude');
            }
            // Validate selected vaccines
            if (selectedVaccines.some(v => !v.vaccineId || !v.vaccineName || !v.quantity || !v.price || isNaN(parseFloat(v.quantity)) || isNaN(parseFloat(v.price)))) {
                return toast.error('Please complete all vaccine details with valid numbers');
            }
            const formData = new FormData();
            formData.append('image', hospitalImg);
            formData.append('name', name);
            formData.append('email', email);
            formData.append('password', password);
            formData.append('about', about);
            formData.append('address', JSON.stringify({ line1: address1, line2: address2 }));
            formData.append('latitude', lat);
            formData.append('longitude', lon);
            formData.append('vaccineData', JSON.stringify(selectedVaccines));
            // Log formData for debugging
            formData.forEach((value, key) => {
                console.log(`${key}: ${value}`);
            });
            const { data } = await axios.post(
                `${backendUrl}/api/admin/add-hospital`,
                formData,
                { headers: { aToken, 'Content-Type': 'multipart/form-data' } }
            );
            if (data.success) {
                toast.success(data.message);
                setHospitalImg(null);
                setName('');
                setPassword('');
                setEmail('');
                setAddress1('');
                setAddress2('');
                setAbout('');
                setLatitude('');
                setLongitude('');
                setSelectedVaccines([]);
            } else {
                toast.error(data.message);
            }
        } catch (error) {
            toast.error(error.response?.data?.message || error.message);
            console.log(error);
        }
    };

    return (
        <form onSubmit={onSubmitHandler} className="m-5 w-full">
            <p className="mb-3 text-lg font-medium">Add Hospital</p>
            <div className="bg-white px-8 py-8 border rounded w-full max-w-4xl max-h-[80vh] overflow-y-scroll">
                <div className="flex items-center gap-4 mb-8 text-gray-500">
                    <label htmlFor="doc-img">
                        <img
                            className="w-16 bg-gray-100 rounded-full cursor-pointer"
                            src={hospitalImg ? URL.createObjectURL(hospitalImg) : assets.upload_area}
                            alt=""
                        />
                    </label>
                    <input
                        onChange={(e) => setHospitalImg(e.target.files[0])}
                        type="file"
                        id="doc-img"
                        hidden
                    />
                    <p>
                        Upload Hospital <br /> picture
                    </p>
                </div>
                <div className="flex flex-col lg:flex-row items-start gap-10 text-gray-600">
                    <div className="w-full lg:flex-1 flex flex-col gap-4">
                        <div className="flex-1 flex flex-col gap-1">
                            <p>Hospital Name</p>
                            <input
                                onChange={(e) => setName(e.target.value)}
                                value={name}
                                className="border rounded px-3 py-2"
                                type="text"
                                placeholder="Name"
                                required
                            />
                        </div>
                        <div className="flex-1 flex flex-col gap-1">
                            <p>Hospital Email</p>
                            <input
                                onChange={(e) => setEmail(e.target.value)}
                                value={email}
                                className="border rounded px-3 py-2"
                                type="email"
                                placeholder="Email"
                                required
                            />
                        </div>
                        <div className="flex-1 flex flex-col gap-1">
                            <p>Set Password</p>
                            <input
                                onChange={(e) => setPassword(e.target.value)}
                                value={password}
                                className="border rounded px-3 py-2"
                                type="password"
                                placeholder="Password"
                                required
                            />
                        </div>
                    </div>
                    <div className="w-full lg:flex-1 flex flex-col gap-4">
                        <div className="flex-1 flex flex-col gap-1">
                            <p>Address</p>
                            <input
                                onChange={(e) => setAddress1(e.target.value)}
                                value={address1}
                                className="border rounded px-3 py-2"
                                type="text"
                                placeholder="Address 1"
                                required
                            />
                            <input
                                onChange={(e) => setAddress2(e.target.value)}
                                value={address2}
                                className="border rounded px-3 py-2"
                                type="text"
                                placeholder="Address 2"
                            />
                        </div>
                        <div className="flex-1 flex flex-col gap-1">
                            <p>Geo Address</p>
                            <input
                                onChange={(e) => setLatitude(e.target.value)}
                                value={latitude}
                                className="border rounded px-3 py-2"
                                type="number"
                                step="any"
                                placeholder="Latitude"
                                required
                            />
                            <input
                                onChange={(e) => setLongitude(e.target.value)}
                                value={longitude}
                                className="border rounded px-3 py-2"
                                type="number"
                                step="any"
                                placeholder="Longitude"
                                required
                            />
                        </div>
                    </div>
                </div>
                <div>
                    <p className="mt-4 mb-2">About Hospital</p>
                    <textarea
                        onChange={(e) => setAbout(e.target.value)}
                        value={about}
                        className="w-full px-4 pt-2 border rounded"
                        rows={5}
                        placeholder="Write about hospital"
                    />
                </div>
                <div className="mt-4">
                    <p className="mb-2">Vaccines</p>
                    {selectedVaccines.map((vac, index) => (
                        <div key={index} className="flex items-center gap-2 mb-2">
                            <select
                                className="border rounded px-3 py-2 flex-1"
                                value={vac.vaccineId}
                                onChange={(e) => handleVaccineChange(index, 'vaccineId', e.target.value)}
                            >
                                <option value="">Select Vaccine</option>
                                {vaccines.map((v) => (
                                    <option key={v._id} value={v._id}>
                                        {v.name}
                                    </option>
                                ))}
                            </select>
                            <input
                                className="border rounded px-3 py-2 w-24"
                                type="number"
                                placeholder="Qty"
                                value={vac.quantity}
                                onChange={(e) => handleVaccineChange(index, 'quantity', e.target.value)}
                            />
                            <input
                                className="border rounded px-3 py-2 w-24"
                                type="number"
                                step="0.01"
                                placeholder="Price"
                                value={vac.price}
                                onChange={(e) => handleVaccineChange(index, 'price', e.target.value)}
                            />
                            <button
                                type="button"
                                className="bg-red-500 text-white px-2 py-1 rounded"
                                onClick={() => removeVaccine(index)}
                            >
                                Remove
                            </button>
                        </div>
                    ))}
                    <button
                        type="button"
                        className="bg-blue-500 text-white px-4 py-2 rounded mt-2"
                        onClick={addVaccine}
                    >
                        Add Vaccine
                    </button>
                </div>
                <button type="submit" className="bg-primary px-10 py-3 mt-4 text-white rounded-full">
                    Add Hospital
                </button>
            </div>
        </form>
    );
};

export default AddHospital;