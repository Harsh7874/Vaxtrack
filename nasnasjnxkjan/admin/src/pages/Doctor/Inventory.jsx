import React, { useContext, useEffect, useState } from 'react';
import { HospitalContext } from '../../context/HospitalContext';
import { AppContext } from '../../context/AppContext';
import { assets } from '../../assets/assets';

export const Inventory = () => {
    const { inventory, getInventory, hToken, requestVaccine } = useContext(HospitalContext);
    const { currency } = useContext(AppContext);

    const [showRequestModal, setShowRequestModal] = useState(false);
    const [availableVaccines, setAvailableVaccines] = useState([]);
    const [selectedVaccine, setSelectedVaccine] = useState('');
    const [requestQuantity, setRequestQuantity] = useState('');
    const [requestPrice, setRequestPrice] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [fetchingVaccines, setFetchingVaccines] = useState(false);

    useEffect(() => {
        if (hToken) {
            getInventory();
        }
    }, [hToken]);
    const selectedVaccineData =
        availableVaccines.find(v => v._id === selectedVaccine);
    // Fetch available vaccines from API and filter logic
    const fetchAvailableVaccines = async () => {
        setFetchingVaccines(true);
        try {
            const response = await fetch('https://vaxtrack-alpha.vercel.app/api/vaccine/list');
            const data = await response.json();
            if (data.success) {
                // Get current inventory vaccine IDs
                const inventoryVaccineIds = inventory?.vaccines?.map(v => v.vaccineId) || [];

                // Filter vaccines: Show all vaccines, but mark low stock ones differently
                const filteredVaccines = data.vaccines.map(vaccine => {
                    const isInInventory = inventoryVaccineIds.includes(vaccine._id);
                    const inventoryVaccine = inventory?.vaccines?.find(v => v.vaccineId === vaccine._id);
                    const currentStock = inventoryVaccine?.quantity || 0;
                    const isLowStock = currentStock < 50;

                    return {
                        ...vaccine,
                        isInInventory,
                        currentStock,
                        isLowStock,
                        status: isInInventory
                            ? (isLowStock ? 'low_stock' : 'in_stock')
                            : 'not_in_inventory'
                    };
                });

                setAvailableVaccines(filteredVaccines);
            }
        } catch (error) {
            console.error('Error fetching vaccines:', error);
        } finally {
            setFetchingVaccines(false);
        }
    };
    const isAlreadyInInventory = selectedVaccineData?.isInInventory;

    const handleOpenRequestModal = () => {
        fetchAvailableVaccines();
        setShowRequestModal(true);
    };

    const handleCloseRequestModal = () => {
        setShowRequestModal(false);
        setSelectedVaccine('');
        setRequestQuantity('');
        setRequestPrice('');
        setAvailableVaccines([]);
    };

    const handleSubmitRequest = async () => {
        if (!selectedVaccine || !requestQuantity) {
            alert('Please select vaccine and quantity');
            return;
        }

        // Price required ONLY for new vaccine
        if (!isAlreadyInInventory && !requestPrice) {
            alert('Please enter price for new vaccine');
            return;
        }


        if (isNaN(requestQuantity) || parseInt(requestQuantity) <= 0) {
            alert('Please enter a valid quantity');
            return;
        }

        if (isNaN(requestPrice) || parseFloat(requestPrice) <= 0) {
            alert('Please enter a valid price');
            return;
        }



        setIsLoading(true);
        try {
            const selectedVaccineData = availableVaccines.find(v => v._id === selectedVaccine);

            const requestData = {
                hospitalName: inventory?.name || 'Hospital',
                status: false, // false means pending request
                vaccines: [{
                    vaccineName: selectedVaccineData.name,
                    vaccineId: selectedVaccine,
                    quantity: parseInt(requestQuantity),

                    // 👇 KEY LOGIC
                    price: isAlreadyInInventory
                        ? selectedVaccineData.currentPrice   // keep old price
                        : parseFloat(requestPrice)
                }]

            };

            const response = await fetch('https://vaxtrack-alpha.vercel.app/api/hospital/inventory-request', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    hToken
                },
                body: JSON.stringify(requestData)
            });

            const data = await response.json();

            if (data.success) {
                alert('Vaccine request submitted successfully!');
                handleCloseRequestModal();
                getInventory(); // Refresh inventory
            } else {
                alert('Failed to submit request: ' + (data.message || 'Unknown error'));
            }
        } catch (error) {
            console.error('Error submitting request:', error);
            alert('Error submitting request. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    // Get current stock for selected vaccine
    const getCurrentStockInfo = () => {
        if (!selectedVaccine) return null;
        const vaccine = availableVaccines.find(v => v._id === selectedVaccine);
        if (vaccine?.isInInventory) {
            return {
                currentStock: vaccine.currentStock,
                status: vaccine.isLowStock ? 'Low Stock' : 'In Stock',
                color: vaccine.isLowStock ? 'text-yellow-600' : 'text-green-600',
                bgColor: vaccine.isLowStock ? 'bg-yellow-50' : 'bg-green-50'
            };
        }
        return null;
    };

    const currentStockInfo = getCurrentStockInfo();

    return (
        <div className="p-4 md:p-6 max-w-6xl mx-auto">
            {/* Header with Request Button */}
            <div className="mb-6 md:mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-xl md:text-2xl font-bold text-gray-800">Vaccine Inventory</h2>
                    {inventory && inventory.name && (
                        <p className="text-gray-600 mt-1">Hospital: <span className="font-semibold">{inventory.name}</span></p>
                    )}
                </div>
                <button
                    onClick={handleOpenRequestModal}
                    className="px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg font-medium transition-colors flex items-center gap-2"
                >
                    <img src={assets.add_icon} alt="Add" className="w-4 h-4" />
                    Request Vaccine
                </button>
            </div>

            {/* Inventory Stats */}
            {inventory?.vaccines && inventory.vaccines.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                    <div className="bg-white p-4 rounded-xl shadow-sm border">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-500">Total Vaccines</p>
                                <p className="text-2xl font-bold text-gray-800">{inventory.vaccines.length}</p>
                            </div>
                            <div className="p-3 bg-blue-50 rounded-lg">
                                <img src={assets.appointments_icon} alt="Vaccines" className="w-6 h-6" />
                            </div>
                        </div>
                    </div>

                    <div className="bg-white p-4 rounded-xl shadow-sm border">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-500">Total Stock</p>
                                <p className="text-2xl font-bold text-gray-800">
                                    {inventory.vaccines.reduce((sum, vaccine) => sum + vaccine.quantity, 0)}
                                </p>
                            </div>
                            <div className="p-3 bg-green-50 rounded-lg">
                                <img src={assets.appointments_icon} alt="Stock" className="w-6 h-6" />
                            </div>
                        </div>
                    </div>

                    <div className="bg-white p-4 rounded-xl shadow-sm border">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-500">Low Stock Items</p>
                                <p className="text-2xl font-bold text-yellow-600">
                                    {inventory.vaccines.filter(vaccine => vaccine.quantity < 50).length}
                                </p>
                            </div>
                            <div className="p-3 bg-yellow-50 rounded-lg">
                                <img src={assets.appointments_icon} alt="Warning" className="w-6 h-6" />
                            </div>
                        </div>
                    </div>

                    <div className="bg-white p-4 rounded-xl shadow-sm border">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-500">Avg. Price</p>
                                <p className="text-2xl font-bold text-gray-800">
                                    {currency}{Math.round(inventory.vaccines.reduce((sum, vaccine) => sum + vaccine.price, 0) / inventory.vaccines.length)}
                                </p>
                            </div>
                            <div className="p-3 bg-purple-50 rounded-lg">
                                <img src={assets.earning_icon} alt="Price" className="w-6 h-6" />
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Inventory Table */}
            {inventory?.vaccines && inventory.vaccines.length > 0 ? (
                <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
                    {/* Mobile Header */}
                    <div className="md:hidden px-4 py-3 border-b bg-gray-50">
                        <p className="font-semibold text-gray-700">Vaccine Inventory</p>
                        <p className="text-sm text-gray-500 mt-1">{inventory.vaccines.length} items</p>
                    </div>

                    {/* Desktop Table Header */}
                    <div className="hidden md:grid md:grid-cols-12 gap-4 py-4 px-6 border-b bg-gray-50 text-gray-600 font-medium text-sm">
                        <div className="col-span-1">#</div>
                        <div className="col-span-4">Vaccine Name</div>
                        <div className="col-span-2">Quantity</div>
                        <div className="col-span-2">Price</div>
                        <div className="col-span-3">Status</div>
                    </div>

                    {/* Table Body */}
                    <div className="divide-y divide-gray-100">
                        {inventory.vaccines.map((vaccine, index) => (
                            <div
                                key={vaccine.vaccineId}
                                className="md:grid md:grid-cols-12 gap-4 py-4 px-4 md:px-6 hover:bg-gray-50 transition-colors"
                            >
                                {/* Index */}
                                <div className="hidden md:block col-span-1 text-gray-500 self-center">
                                    {index + 1}
                                </div>

                                {/* Vaccine Name */}
                                <div className="col-span-12 md:col-span-4 mb-3 md:mb-0">
                                    <div className="flex items-center gap-2">
                                        <span className="md:hidden text-xs text-gray-500 font-medium">Name:</span>
                                        <p className="font-semibold text-gray-800">{vaccine.vaccineName}</p>
                                        {vaccine.quantity < 50 && (
                                            <span className="px-2 py-1 text-xs bg-yellow-100 text-yellow-700 rounded-full">
                                                Low Stock
                                            </span>
                                        )}
                                    </div>
                                </div>

                                {/* Quantity */}
                                <div className="col-span-6 md:col-span-2 mb-3 md:mb-0">
                                    <div className="flex items-center gap-2">
                                        <span className="md:hidden text-xs text-gray-500 font-medium">Quantity:</span>
                                        <p className={`font-bold ${vaccine.quantity < 20 ? 'text-red-600' :
                                            vaccine.quantity < 50 ? 'text-yellow-600' :
                                                'text-gray-800'
                                            }`}>
                                            {vaccine.quantity}
                                        </p>
                                    </div>
                                </div>

                                {/* Price */}
                                <div className="col-span-6 md:col-span-2 mb-3 md:mb-0">
                                    <div className="flex items-center gap-2">
                                        <span className="md:hidden text-xs text-gray-500 font-medium">Price:</span>
                                        <p className="font-semibold text-gray-800">{currency}{vaccine.price}</p>
                                    </div>
                                </div>

                                {/* Status */}
                                <div className="col-span-12 md:col-span-3">
                                    <div className="flex items-center gap-2">
                                        <span className="md:hidden text-xs text-gray-500 font-medium">Status:</span>
                                        <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium ${vaccine.quantity === 0 ? 'bg-red-100 text-red-700' :
                                            vaccine.quantity < 20 ? 'bg-red-50 text-red-600 border border-red-200' :
                                                vaccine.quantity < 50 ? 'bg-yellow-50 text-yellow-600 border border-yellow-200' :
                                                    'bg-green-50 text-green-600 border border-green-200'
                                            }`}>
                                            {vaccine.quantity === 0 ? 'Out of Stock' :
                                                vaccine.quantity < 20 ? 'Critical' :
                                                    vaccine.quantity < 50 ? 'Low Stock' : 'In Stock'}
                                        </span>
                                    </div>
                                </div>

                                {/* Mobile View Details */}
                                <div className="md:hidden col-span-12 mt-3 pt-3 border-t border-gray-100">
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <p className="text-xs text-gray-500">Status</p>
                                            <span className={`inline-flex items-center gap-1 px-2 py-1 mt-1 rounded-full text-xs font-medium ${vaccine.quantity === 0 ? 'bg-red-100 text-red-700' :
                                                vaccine.quantity < 20 ? 'bg-red-50 text-red-600' :
                                                    vaccine.quantity < 50 ? 'bg-yellow-50 text-yellow-600' :
                                                        'bg-green-50 text-green-600'
                                                }`}>
                                                {vaccine.quantity === 0 ? 'Out of Stock' :
                                                    vaccine.quantity < 20 ? 'Critical' :
                                                        vaccine.quantity < 50 ? 'Low Stock' : 'In Stock'}
                                            </span>
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-500">Stock Level</p>
                                            <div className="mt-1">
                                                <div className="w-full bg-gray-200 rounded-full h-2">
                                                    <div
                                                        className={`h-2 rounded-full ${vaccine.quantity === 0 ? 'bg-red-500' :
                                                            vaccine.quantity < 20 ? 'bg-red-400' :
                                                                vaccine.quantity < 50 ? 'bg-yellow-400' :
                                                                    'bg-green-500'
                                                            }`}
                                                        style={{
                                                            width: `${Math.min(vaccine.quantity / 100 * 100, 100)}%`
                                                        }}
                                                    ></div>
                                                </div>
                                                <p className="text-xs text-gray-500 mt-1">{vaccine.quantity} units</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            ) : (
                <div className="bg-white rounded-xl shadow-sm border p-8 md:p-12 text-center">
                    <img
                        src={assets.empty_icon}
                        alt="No inventory"
                        className="w-16 h-16 md:w-20 md:h-20 mx-auto opacity-50 mb-4"
                    />
                    <h3 className="text-lg font-semibold text-gray-700 mb-2">No Vaccines in Inventory</h3>
                    <p className="text-gray-500 mb-4">This hospital hasn't been assigned any vaccines yet.</p>
                    <button
                        onClick={handleOpenRequestModal}
                        className="px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg font-medium transition-colors"
                    >
                        Request Vaccine
                    </button>
                </div>
            )}

            {/* Stock Legend */}
            {inventory?.vaccines && inventory.vaccines.length > 0 && (
                <div className="mt-6 bg-white p-4 rounded-xl shadow-sm border">
                    <h4 className="text-sm font-semibold text-gray-700 mb-3">Stock Status Legend</h4>
                    <div className="flex flex-wrap gap-4">
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                            <span className="text-sm text-gray-600">In Stock (50+ units)</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
                            <span className="text-sm text-gray-600">Low Stock (20-49 units)</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 bg-red-400 rounded-full"></div>
                            <span className="text-sm text-gray-600">Critical (1-19 units)</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 bg-red-600 rounded-full"></div>
                            <span className="text-sm text-gray-600">Out of Stock (0 units)</span>
                        </div>
                    </div>
                </div>
            )}

            {/* Request Vaccine Modal */}
            {showRequestModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-xl shadow-lg w-full max-w-md">
                        <div className="flex items-center justify-between p-6 border-b">
                            <h3 className="text-xl font-semibold text-gray-800">Request Vaccine</h3>
                            <button
                                onClick={handleCloseRequestModal}
                                className="text-gray-400 hover:text-gray-600"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <div className="p-6">
                            {fetchingVaccines ? (
                                <div className="text-center py-8">
                                    <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
                                    <p className="mt-3 text-gray-600">Loading available vaccines...</p>
                                </div>
                            ) : availableVaccines.length === 0 ? (
                                <div className="text-center py-8">
                                    <p className="text-gray-600">No vaccines available for request.</p>
                                    <p className="text-sm text-gray-500 mt-2">All vaccines might already be in your inventory.</p>
                                </div>
                            ) : (
                                <>
                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Select Vaccine
                                            </label>
                                            <select
                                                value={selectedVaccine}
                                                onChange={(e) => setSelectedVaccine(e.target.value)}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                            >
                                                <option value="">Choose a vaccine</option>
                                                {availableVaccines.map((vaccine) => (
                                                    <option key={vaccine._id} value={vaccine._id}>
                                                        {vaccine.name}
                                                        {vaccine.isInInventory ? ' (Already in inventory)' : ''}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>

                                        {/* Current Stock Info */}
                                        {currentStockInfo && (
                                            <div className={`p-3 rounded-lg ${currentStockInfo.bgColor}`}>
                                                <div className="flex items-center justify-between">
                                                    <span className="text-sm font-medium text-gray-700">Current Stock:</span>
                                                    <span className={`font-bold ${currentStockInfo.color}`}>
                                                        {currentStockInfo.currentStock} units
                                                    </span>
                                                </div>
                                                <p className="text-xs text-gray-600 mt-1">
                                                    Status: <span className="font-medium">{currentStockInfo.status}</span>
                                                </p>
                                                {currentStockInfo.currentStock < 50 && (
                                                    <p className="text-xs text-yellow-700 mt-1">
                                                        ⚠️ You can request more units to replenish stock
                                                    </p>
                                                )}
                                            </div>
                                        )}

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Requested Quantity
                                            </label>
                                            <input
                                                type="number"
                                                value={requestQuantity}
                                                onChange={(e) => setRequestQuantity(e.target.value)}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                                placeholder="Enter quantity"
                                                min="1"
                                            />
                                            {currentStockInfo && (
                                                <p className="text-xs text-gray-500 mt-1">
                                                    Current stock: {currentStockInfo.currentStock} units
                                                </p>
                                            )}
                                        </div>

                                        {!isAlreadyInInventory ? (
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                    Price per unit ({currency})
                                                </label>

                                                <input
                                                    type="number"
                                                    value={requestPrice}
                                                    onChange={(e) => setRequestPrice(e.target.value)}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                                    placeholder="Enter price per unit"
                                                    min="0"
                                                    step="0.01"
                                                />
                                            </div>
                                        ) : (
                                            <div className="p-3 bg-blue-50 rounded-lg text-sm text-blue-700">
                                                💡 Price is already fixed for this vaccine in your inventory.
                                            </div>
                                        )}

                                    </div>

                                    <div className="mt-6 flex gap-3">
                                        <button
                                            onClick={handleCloseRequestModal}
                                            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg font-medium transition-colors"
                                            disabled={isLoading}
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            onClick={handleSubmitRequest}
                                            disabled={isLoading}
                                            className="flex-1 px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg font-medium transition-colors disabled:opacity-50"
                                        >
                                            {isLoading ? 'Submitting...' : 'Submit Request'}
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};