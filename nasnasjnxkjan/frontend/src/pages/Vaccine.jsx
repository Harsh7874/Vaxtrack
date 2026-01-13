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

  // Parse description string into object
  const parseDescription = (description) => {
    const pairs = description.split('||')
      .map(part => part.trim())
      .filter(part => part.length > 0)
      .map(part => {
        const [key, value] = part.split(':').map(str => str.trim());
        return [key, value];
      });
    return Object.fromEntries(pairs);
  };

  // Filter vaccines based on search query
  const filteredVaccines = vaccines.filter(vaccine =>
    vaccine.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div className="text-red-500">{error}</div>;

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4 text-center">Vaccines</h1>
      <div className="flex justify-center mb-6">
        <div className="w-full sm:w-1/2">
          <input
            type="text"
            placeholder="Search vaccines..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-2 border border-[#C9D8FF] rounded-full focus:outline-none focus:ring-2 focus:ring-[#EAEFFF] text-sm"
          />
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredVaccines.map(vaccine => {
          const details = parseDescription(vaccine.description);
          return (
            <div key={vaccine._id} className="border p-4 rounded">
              <h2 className="text-xl font-semibold">{vaccine.name.toUpperCase()}</h2>
              <p><strong className="text-gray-600">Usage:</strong> {details.VaccineUsage}</p>
              <p><strong className="text-gray-600">Min Age:</strong> {details.VaccineMinAge}</p>
              <p><strong className="text-gray-600">About:</strong> {details.AboutVaccine}</p>
              <p><strong className="text-gray-600">Side Effects:</strong> {details.SideEffects}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Vaccines;