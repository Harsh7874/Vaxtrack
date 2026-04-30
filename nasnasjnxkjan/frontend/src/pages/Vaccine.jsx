import React, { useState, useEffect } from 'react';
const backendUrl = import.meta.env.VITE_BACKEND_URL

const Vaccines = () => {
  const [vaccines, setVaccines] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch data from API
  useEffect(() => {
    const fetchVaccines = async () => {
      try {
        const response = await fetch(`${backendUrl}/api/vaccine/list`);
        if (!response.ok) throw new Error('Failed to fetch vaccines');
        const data = await response.json();
        if (data.success) {
          setVaccines(data.vaccines);
        } else {
          throw new Error('API returned unsuccessful response');
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };
    fetchVaccines();
  }, []);

  // Filter vaccines based on search query
  const filteredVaccines = vaccines.filter(vaccine =>
    vaccine.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (isLoading) return (
    <div className="flex justify-center items-center h-64">
      <div className="text-lg text-gray-600">Loading vaccines...</div>
    </div>
  );
  
  if (error) return (
    <div className="flex justify-center items-center h-64">
      <div className="text-lg text-red-500">{error}</div>
    </div>
  );

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4 text-center">Vaccines</h1>
      
      {/* Search Bar */}
      <div className="flex justify-center mb-6">
        <div className="w-full sm:w-1/2">
          <input
            type="text"
            placeholder="Search by vaccine name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-2 border border-[#C9D8FF] rounded-full focus:outline-none focus:ring-2 focus:ring-[#EAEFFF] text-sm"
          />
        </div>
      </div>

      {/* Vaccines Grid */}
      {filteredVaccines.length === 0 ? (
        <div className="text-center text-gray-500 mt-8">
          No vaccines found matching "{searchQuery}"
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredVaccines.map(vaccine => (
            <div key={vaccine._id} className="border border-gray-200 rounded-lg p-4 hover:shadow-lg transition-shadow">
              <div className="mb-3">
                <h2 className="text-xl font-bold text-blue-600">{vaccine.name}</h2>
              </div>
              <div>
                <p className="text-gray-700">
                  <strong className="text-gray-800">Description:</strong>
                </p>
                <p className="text-gray-600 mt-1">{vaccine.description || "No description available"}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Vaccines;