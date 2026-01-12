import React, { useContext, useEffect } from 'react';
import { HospitalContext } from '../../context/HospitalContext';
import { toast } from 'react-toastify';

export const Inventory = () => {
    const { inventory, getInventory, hToken } = useContext(HospitalContext);

    useEffect(() => {
        if (hToken) {
            getInventory();
        }
    }, [hToken]);

    return (
        <div className="p-6 max-w-4xl mx-auto">
            <h2 className="text-2xl font-semibold mb-4 text-gray-800">Vaccine Inventory</h2>
            {inventory.length > 0 ? (
                <div className="overflow-x-auto">
                    <table className="w-full border-collapse border border-gray-300">
                        <thead>
                            <tr className="bg-gray-100">
                                <th className="border border-gray-300 p-3 text-left text-sm font-medium text-gray-700">Vaccine Name</th>
                                <th className="border border-gray-300 p-3 text-left text-sm font-medium text-gray-700">Quantity</th>
                                <th className="border border-gray-300 p-3 text-left text-sm font-medium text-gray-700">Price</th>
                            </tr>
                        </thead>
                        <tbody>
                            {inventory.map((vaccine) => (
                                <tr key={vaccine._id} className="hover:bg-gray-50">
                                    <td className="border border-gray-300 p-3 text-gray-600">{vaccine.vaccine.name}</td>
                                    <td className="border border-gray-300 p-3 text-gray-600">{vaccine.quantity}</td>
                                    <td className="border border-gray-300 p-3 text-gray-600">{vaccine.price}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : (
                <p className="text-gray-600">No vaccines assigned to this hospital.</p>
            )}
        </div>
    );
};

// export default HospitalInventory;