import React, { useState, useEffect, useRef, useContext } from 'react';
import axios from 'axios';
const backendUrl = import.meta.env.VITE_BACKEND_URL

const LocationSearch = ({ onSelect, className = "", placeholder = "Area, landmark, pincode..." }) => {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef(null);
  const searchLocation = async (value) => {
    setQuery(value);

    if (value.trim().length < 2) {
      setSuggestions([]);
      setIsOpen(false);
      return;
    }
    try {
      const url = `https://photon.komoot.io/api/?q=${encodeURIComponent(value)}&limit=6`;
      const res = await fetch(url);
      const data = await res.json();
      const places = data.features.map((f) => {
        // Extract address components from the properties
        const name = f.properties.name || '';
        const street = f.properties.street || '';
        const city = f.properties.city || f.properties.district || '';
        const state = f.properties.state || '';
        const postcode = f.properties.postcode || '';

        // Create display name
        const displayName = [name, street, city, state, postcode]
          .filter(Boolean)
          .join(', ');
        // Create short name for display
        const shortName = name || street || city || state || 'Location';
        return {
          lat: f.geometry.coordinates[1],
          lon: f.geometry.coordinates[0],
          display_name: displayName,
          short: shortName,
          raw: f.properties // Keep raw data for debugging
        };
      });
      setSuggestions(places);
      setIsOpen(places.length > 0);
    } catch (err) {
      console.error("Photon search failed:", err);
      setSuggestions([]);
      setIsOpen(false);
    }
  };

  const useMyLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation not supported by your browser");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lon = pos.coords.longitude;

        // Try to get human readable name from Photon reverse
        try {
          const url = `https://photon.komoot.io/reverse?lat=${lat}&lon=${lon}`;
          const res = await fetch(url);
          const data = await res.json();

          let display = "Your Location";

          if (data.features?.length) {
            const p = data.features[0].properties;
            display =
              [p.name, p.city, p.state, p.postcode]
                .filter(Boolean)
                .join(", ") || "Your Location";
          }

          const locationData = {
            lat,
            lon,
            display: "Your Location",   // 👈 Force label
            realDisplay: display        // optional if you need real name later
          };

          setQuery("Your Location");
          setSuggestions([]);
          setIsOpen(false);

          onSelect(locationData);
        } catch (e) {
          // Fallback without reverse
          onSelect({
            lat,
            lon,
            display: "Your Location"
          });

          setQuery("Your Location");
          setIsOpen(false);
        }
      },
      (err) => {
        alert("Please allow location access in browser settings");
        console.error(err);
      }
    );
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleSelect = (place) => {
    const locationData = {
      lat: place.lat,
      lon: place.lon,
      display: place.display_name,
    };
    setQuery(place.display_name);
    setSuggestions([]);
    setIsOpen(false);
    onSelect(locationData);
  };

  const handleInputFocus = () => {
    if (suggestions.length > 0) {
      setIsOpen(true);
    }
  };

  return (
    <div ref={wrapperRef} className={`relative ${className}`}>
      <input
        type="text"
        value={query}
        onChange={(e) => searchLocation(e.target.value)}
        onFocus={handleInputFocus}
        placeholder={placeholder}
        className="w-full px-6 py-3.5 bg-transparent focus:outline-none text-gray-800 placeholder-gray-500 text-base"
      />

      {query && (
        <button
          type="button"
          onClick={() => {
            setQuery('');
            setSuggestions([]);
            setIsOpen(false);
            onSelect(null);
          }}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
        >
          ×
        </button>
      )}

      {isOpen && suggestions.length > 0 && (
        <div className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
          {suggestions.map((place, i) => (
            <div
              key={i}
              className="px-4 py-3 hover:bg-blue-50 cursor-pointer border-b border-gray-100 last:border-b-0"
              onClick={() => handleSelect(place)}
            >
              <div className="font-medium text-gray-800 truncate">
                {place.short}
              </div>
              <div className="text-xs text-gray-500 truncate mt-1">
                {place.display_name.length > 60
                  ? `${place.display_name.substring(0, 60)}...`
                  : place.display_name}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* USE MY LOCATION BUTTON */}
      {isOpen && (
        <div className="absolute z-40 mt-[250px] w-full">
          <button
            type="button"
            onClick={useMyLocation}
            className="w-full flex items-center gap-2 px-4 py-3 bg-white-1000 hover:bg-blue-100 text-black-1000 text-sm font-medium border border-blue-100 rounded-lg"
          >
            ⭕ Use My Location
          </button>
        </div>
      )}
    </div>
  );
};

// New component for hospital name autocomplete
const HospitalNameAutocomplete = ({ value, onChange, placeholder = "Hospital name or keyword..." }) => {
  const [suggestions, setSuggestions] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef(null);

  const fetchSuggestions = async (query) => {
    if (query.trim().length < 2) {
      setSuggestions([]);
      setIsOpen(false);
      return;
    }

    try {
      const response = await axios.get(
        `${backendUrl}/api/public/hospital-suggestion?query=${encodeURIComponent(query)}`
      );

      if (response.data.success && response.data.suggestions) {
        setSuggestions(response.data.suggestions);
        setIsOpen(response.data.suggestions.length > 0);
      } else {
        setSuggestions([]);
        setIsOpen(false);
      }
    } catch (err) {
      console.error("Autocomplete API failed:", err);
      setSuggestions([]);
      setIsOpen(false);
    }
  };

  const handleInputChange = (e) => {
    const newValue = e.target.value;
    onChange(newValue);
    fetchSuggestions(newValue);
  };

  const handleSelect = (suggestion) => {
    onChange(suggestion);
    setSuggestions([]);
    setIsOpen(false);
  };

  const handleInputFocus = () => {
    // Re-fetch on focus (useful if user clears & refocuses, or page loads with value)
    if (value?.trim().length >= 2) {
      fetchSuggestions(value);
    } else if (suggestions.length > 0) {
      setIsOpen(true);
    }
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <div ref={wrapperRef} className="relative w-full">
      <input
        type="text"
        value={value}
        onChange={handleInputChange}
        onFocus={handleInputFocus}
        placeholder={placeholder}
        className="w-full px-6 py-3.5 bg-transparent focus:outline-none text-gray-800 placeholder-gray-500 text-base"
      />

      {isOpen && suggestions.length > 0 && (
        <div className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
          {suggestions.map((suggestion, index) => (
            <div
              key={index}
              className="px-4 py-3 hover:bg-blue-50 cursor-pointer border-b border-gray-100 last:border-b-0"
              onClick={() => handleSelect(suggestion)}
            >
              <div className="font-medium text-gray-800 truncate">
                {suggestion.length > 60 ? `${suggestion.substring(0, 60)}...` : suggestion}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const HospitalsList = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [location, setLocation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [hospitals, setHospitals] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 12,
    total: 0,
    totalPages: 1
  });
  const [sortBy, setSortBy] = useState('relevance');
  const [appliedLocation, setAppliedLocation] = useState(null);
  const [appliedQuery, setAppliedQuery] = useState('');

  const searchHospitals = async (page = 1, overrideSort = null) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchQuery.trim()) params.append('query', searchQuery.trim());
      params.append('page', page.toString());
      params.append('limit', pagination.limit.toString());
      params.append('sortBy', overrideSort ?? sortBy);

      if (location) {
        params.append('lat', location.lat);
        params.append('lon', location.lon);
      }

      const response = await axios.get(
        `${backendUrl}/api/public/hospital-search?${params.toString()}`
      );

      if (response.data.success) {
        setHospitals(response.data.data || []);
        setPagination({
          page: response.data.page || page,
          limit: response.data.limit || pagination.limit,
          total: response.data.total || 0,
          totalPages: response.data.totalPages || 1
        });
        setAppliedLocation(location);
        setAppliedQuery(searchQuery);
      } else {
        setHospitals([]);
      }
    } catch (error) {
      console.error('Error searching hospitals:', error);
      setHospitals([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    searchHospitals(1);
  };

  const clearSearch = () => {
    setSearchQuery('');
    setLocation(null);
    searchHospitals(1);
  };

  const handleLocationSelect = (loc) => {
    setLocation(loc);
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      searchHospitals(newPage);
    }
  };

  // Initial load
  useEffect(() => {
    searchHospitals(1);
  }, []);

  useEffect(() => {
    if (location) {
      setSortBy('distance');
    } else {
      setSortBy('relevance');
    }
  }, [location]);

  return (
    <div className="m-5 max-w-7xl mx-auto">
      <h1 className="text-2xl font-semibold mb-6 text-gray-800">Find Hospitals</h1>

      {/* Search Bar */}
      <div className="bg-white border border-gray-200 rounded-full shadow-sm mb-8 ">
        <form onSubmit={handleSearch} className="flex items-center divide-x divide-gray-200">
          {/* Hospital name with autocomplete */}
          <div className="flex-1 min-w-0">
            <HospitalNameAutocomplete
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="Hospital name or keyword..."
            />
          </div>

          {/* Location */}
          <div className="flex-1 min-w-[240px] relative">
            <LocationSearch
              onSelect={handleLocationSelect}
              className="w-full"
              placeholder="Area, landmark, pincode..."
            />
          </div>

          {/* Search button */}
          <button
            type="submit"
            disabled={loading}
            className={`
              px-8 py-3.5 font-medium text-white transition-colors whitespace-nowrap
              rounded-r-full
              ${loading
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700 active:bg-blue-800'}
            `}
          >
            {loading ? 'Searching...' : 'Search'}
          </button>
        </form>
      </div>

      {/* Status / Result info */}
      {!loading && (
        <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 text-sm text-gray-600">
          <div>
            {hospitals.length > 0 ? (
              <>
                Showing <strong>{hospitals.length}</strong> hospital{hospitals.length !== 1 ? 's' : ''}{' '}
                {pagination.total > 0 && (
                  <>out of <strong>{pagination.total}</strong> </>
                )}
                {appliedQuery && <>matching <strong>"{appliedQuery}"</strong></>}
                {appliedLocation && (
                  <>near <strong>{appliedLocation.display.split(',')[0]}</strong></>
                )}
              </>
            ) : (
              "No hospitals found matching your criteria."
            )}
          </div>

          <div className="flex items-center gap-3">
            {/* SORT BY DROPDOWN */}
            <div className="flex items-center gap-2 mr-2">
              <span className="text-gray-600 text-sm hidden sm:inline">Sort:</span>
              <select
                value={sortBy}
                onChange={(e) => {
                  const value = e.target.value;
                  setSortBy(value);
                  searchHospitals(1, value);
                }}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none hover:bg-gray-50"
              >
                <option value="relevance">Relevance</option>
                {location && (
                  <option value="distance">Distance</option>
                )}
              </select>
            </div>

            <button
              onClick={() => handlePageChange(pagination.page - 1)}
              disabled={pagination.page === 1 || loading}
              className={`
                px-5 py-2 rounded-lg font-medium transition-colors
                ${pagination.page === 1 || loading
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-white border border-gray-300 hover:bg-gray-50'}
              `}
            >
              Previous
            </button>

            <span className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium min-w-[3rem] text-center">
              {pagination.page}
            </span>

            <button
              onClick={() => handlePageChange(pagination.page + 1)}
              disabled={pagination.page === pagination.totalPages || loading}
              className={`
                px-5 py-2 rounded-lg font-medium transition-colors
                ${pagination.page === pagination.totalPages || loading
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-white border border-gray-300 hover:bg-gray-50'}
              `}
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-10 w-10 border-4 border-blue-500 border-t-transparent"></div>
          <p className="mt-4 text-gray-600">Finding hospitals...</p>
        </div>
      )}

      {/* Hospital Cards */}
      {!loading && hospitals.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {hospitals.map((hospital) => (
            <div
              key={hospital._id}
              className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-200 flex flex-col"
            >
              <img
                src={hospital.image}
                alt={hospital.name}
                className="w-full h-44 object-cover bg-gray-100"
                onError={(e) => {
                  e.target.src = "https://via.placeholder.com/400x180/EAEFFF/5C5C5C?text=Hospital";
                }}
              />
              <div className="p-4 flex flex-col flex-1">
                <h3 className="font-semibold text-lg text-gray-800 line-clamp-2">
                  {hospital.name}
                </h3>
                <p className="mt-1 text-sm text-gray-600 line-clamp-2 flex-1">
                  {hospital.about || "Vaccination & healthcare services"}
                </p>
                {hospital.address && (
                  <p className="mt-3 text-xs text-gray-500">
                    {hospital.address.line1?.replace(", Ahmedabad", "")}
                  </p>
                )}
                {hospital.distance !== undefined && (
                  <div className="mt-3 inline-block px-3 py-1 bg-blue-50 text-blue-700 text-xs font-medium rounded-full">
                    {(hospital.distance / 1000).toFixed(2)} km away
                  </div>
                )}
                <div className="mt-4">
                  <button
                    onClick={() =>
                      window.location.href = `/hospital-manage?hospitalId=${hospital._id}`
                    }
                    className="w-full py-2 px-3 text-sm font-medium rounded-lg 
                 bg-gray-100 hover:bg-gray-200 text-gray-800 
                 transition-colors border border-gray-200"
                  >
                    Manage
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {!loading && pagination.totalPages > 1 && (
        <div className="mt-10 flex flex-col sm:flex-row justify-center items-center gap-4 text-sm">
          <div className="text-gray-600">
            Page <strong>{pagination.page}</strong> of <strong>{pagination.totalPages}</strong>
            {' • '}
            {pagination.total} hospitals total
          </div>
        </div>
      )}
    </div>
  );
};

export default HospitalsList;