import React, { useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { AppContext } from '../context/AppContext';

// Hospital Name Autocomplete Component
const HospitalNameAutocomplete = ({ value, onChange, placeholder = "Search hospitals by name..." }) => {
    const [suggestions, setSuggestions] = useState([]);
    const [isOpen, setIsOpen] = useState(false);
    const wrapperRef = React.useRef(null);

    const fetchSuggestions = async (query) => {
        if (query.trim().length < 2) {
            setSuggestions([]);
            setIsOpen(false);
            return;
        }

        try {
            const response = await axios.get(
                `https://vaxtrack-alpha.vercel.app/api/public/hospital-suggestion?query=${encodeURIComponent(query)}`
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

    React.useEffect(() => {
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
                type='text'
                value={value}
                onChange={handleInputChange}
                onFocus={() => suggestions.length > 0 && setIsOpen(true)}
                placeholder={placeholder}
                className='w-full px-4 py-2 border border-[#C9D8FF] rounded-full focus:outline-none focus:ring-2 focus:ring-[#EAEFFF] text-sm'
            />

            {isOpen && suggestions.length > 0 && (
                <div className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    {suggestions.map((suggestion, index) => (
                        <div
                            key={index}
                            className="px-4 py-3 hover:bg-blue-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                            onClick={() => handleSelect(suggestion)}
                        >
                            <div className="font-medium text-gray-800 truncate text-sm">
                                {suggestion.length > 60 ? `${suggestion.substring(0, 60)}...` : suggestion}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

// Location Search Component (Pill style)
const LocationSearchPill = ({ location, setLocation }) => {
    const [query, setQuery] = useState(location?.display || "");
    const [suggestions, setSuggestions] = useState([]);
    const [isOpen, setIsOpen] = useState(false);
    const wrapperRef = React.useRef(null);
    const [loading, setLoading] = useState(false);

    const searchLocation = async (value) => {
        setQuery(value);

        if (value.trim().length < 2) {
            setSuggestions([]);
            setIsOpen(false);
            return;
        }

        setLoading(true);
        try {
            const url = `https://photon.komoot.io/api/?q=${encodeURIComponent(value)}&limit=5`;
            const res = await fetch(url);
            const data = await res.json();

            const places = data.features.map((f) => {
                const name = f.properties.name || '';
                const street = f.properties.street || '';
                const city = f.properties.city || f.properties.district || '';
                const state = f.properties.state || '';
                const postcode = f.properties.postcode || '';

                const displayName = [name, street, city, state, postcode]
                    .filter(Boolean)
                    .join(', ');

                const shortName = name || street || city || state || 'Location';

                return {
                    lat: f.geometry.coordinates[1],
                    lon: f.geometry.coordinates[0],
                    display_name: displayName,
                    short: shortName,
                };
            });

            setSuggestions(places);
            setIsOpen(places.length > 0);
        } catch (err) {
            console.error("Location search failed:", err);
            setSuggestions([]);
            setIsOpen(false);
        } finally {
            setLoading(false);
        }
    };

    const useMyLocation = () => {
        if (!navigator.geolocation) {
            alert("Geolocation not supported by your browser");
            return;
        }

        setLoading(true);

        navigator.geolocation.getCurrentPosition(
            (pos) => {
                const lat = pos.coords.latitude;
                const lon = pos.coords.longitude;

                const locationData = {
                    lat,
                    lon,
                    display: "Current Location"
                };

                setLocation(locationData);
                setQuery("Current Location");
                setIsOpen(false);
                setLoading(false);
            },
            (err) => {
                alert("Please allow location access in browser settings");
                console.error(err);
                setLoading(false);
            }
        );
    };


    const handleSelect = (place) => {
        const locationData = {
            lat: place.lat,
            lon: place.lon,
            display: place.display_name,
        };
        setLocation(locationData);
        setQuery(place.display_name);
        setSuggestions([]);
        setIsOpen(false);
    };

    const clearLocation = () => {
        setLocation(null);
        setQuery("");
        setSuggestions([]);
        setIsOpen(false);
    };

    React.useEffect(() => {
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
        <div ref={wrapperRef} className="relative min-w-[200px] max-w-[300px]">
            <div className="relative">
                <input
                    type="text"
                    value={query}
                    onChange={(e) => searchLocation(e.target.value)}
                    onFocus={() => suggestions.length > 0 && setIsOpen(true)}
                    placeholder="Location..."
                    className="w-full px-4 py-2 pl-10 border border-[#C9D8FF] rounded-full focus:outline-none focus:ring-2 focus:ring-[#EAEFFF] text-sm bg-white"
                />
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                    📍
                </span>

                {query && (
                    <button
                        type="button"
                        onClick={clearLocation}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-lg"
                    >
                        ×
                    </button>
                )}
            </div>

            {isOpen && suggestions.length > 0 && (
                <div className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    <button
                        type="button"
                        onClick={useMyLocation}
                        className="w-full px-4 py-3 hover:bg-blue-50 cursor-pointer border-b border-gray-100 text-left flex items-center gap-2"
                    >
                        <span className="text-lg">📍</span>
                        <span className="text-sm font-medium">Use My Current Location</span>
                    </button>

                    {suggestions.map((place, i) => (
                        <div
                            key={i}
                            className="px-4 py-3 hover:bg-blue-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                            onClick={() => handleSelect(place)}
                        >
                            <div className="font-medium text-gray-800 truncate text-sm">
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

            {loading && (
                <div className="absolute right-10 top-1/2 -translate-y-1/2">
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-500 border-t-transparent"></div>
                </div>
            )}
        </div>
    );
};

const Hospitals = () => {
    const navigate = useNavigate();
    const { hospitals: contextHospitals } = useContext(AppContext);

    const [searchTerm, setSearchTerm] = useState('');
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

    const searchHospitals = async (page = 1, overrideSort = null) => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (searchTerm.trim()) params.append('query', searchTerm.trim());
            params.append('page', page.toString());
            params.append('limit', pagination.limit.toString());
            params.append('sortBy', overrideSort ?? sortBy);

            if (location) {
                params.append('lat', location.lat);
                params.append('lon', location.lon);
            }

            const response = await axios.get(
                `https://vaxtrack-alpha.vercel.app/api/public/hospital-search?${params.toString()}`
            );

            if (response.data.success) {
                setHospitals(response.data.data || []);
                setPagination({
                    page: response.data.page || page,
                    limit: response.data.limit || pagination.limit,
                    total: response.data.total || 0,
                    totalPages: response.data.totalPages || 1
                });
            } else {
                // Fallback to context hospitals if API fails
                const start = (page - 1) * pagination.limit;
                const end = start + pagination.limit;
                setHospitals(contextHospitals.slice(start, end));
                setPagination({
                    page: page,
                    limit: pagination.limit,
                    total: contextHospitals.length,
                    totalPages: Math.ceil(contextHospitals.length / pagination.limit)
                });
            }
        } catch (error) {
            console.error('Error searching hospitals:', error);
            // Fallback to context hospitals
            const start = (page - 1) * pagination.limit;
            const end = start + pagination.limit;
            setHospitals(contextHospitals.slice(start, end));
            setPagination({
                page: page,
                limit: pagination.limit,
                total: contextHospitals.length,
                totalPages: Math.ceil(contextHospitals.length / pagination.limit)
            });
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = (e) => {
        e.preventDefault();
        searchHospitals(1);
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

    // Update sortBy when location changes
    useEffect(() => {
        if (location) {
            setSortBy('distance');
            searchHospitals(1, 'distance');
        }
    }, [location]);


    // Fallback to context hospitals on initial render
    useEffect(() => {
        if (contextHospitals.length > 0 && hospitals.length === 0) {
            const start = (pagination.page - 1) * pagination.limit;
            const end = start + pagination.limit;
            setHospitals(contextHospitals.slice(start, end));
            setPagination({
                page: 1,
                limit: pagination.limit,
                total: contextHospitals.length,
                totalPages: Math.ceil(contextHospitals.length / pagination.limit)
            });
        }
    }, [contextHospitals]);

    return (
        <div className='flex flex-col items-center gap-4 my-16 text-[#262626] md:mx-10'>
            {/* Header Section */}
            <h1 className='text-3xl font-medium'>Search Hospitals</h1>
            <p className='sm:w-1/2 text-center text-sm'>Simply browse through our extensive list of trusted hospitals.</p>

            {/* Search Bar with Location and Sort Options */}
            <div className='w-full sm:w-4/5 mb-6'>
                <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3 items-center">
                    {/* Hospital Search */}
                    <div className="flex-1 w-full">
                        <HospitalNameAutocomplete
                            value={searchTerm}
                            onChange={setSearchTerm}
                            placeholder="Search hospitals by name..."
                        />
                    </div>

                    {/* Location Search Pill */}
                    <div className="w-full sm:w-auto">
                        <LocationSearchPill
                            location={location}
                            setLocation={setLocation}
                        />
                    </div>

                    {/* Sort Options */}
                    <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-600 whitespace-nowrap">Sort:</span>
                        <select
                            value={sortBy}
                            onChange={(e) => {
                                const value = e.target.value;
                                setSortBy(value);
                                searchHospitals(1, value);
                            }}
                            className="border border-[#C9D8FF] rounded-full px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#EAEFFF]"
                        >
                            <option value="relevance">Relevance</option>
                            {location && (
                                <option value="distance">Distance</option>
                            )}
                        </select>
                    </div>

                    {/* Search Button */}
                    <button
                        type="submit"
                        disabled={loading}
                        className={`
                            px-6 py-2 font-medium text-white rounded-full transition-colors whitespace-nowrap
                            ${loading
                                ? 'bg-gray-400 cursor-not-allowed'
                                : 'bg-blue-600 hover:bg-blue-700 active:bg-blue-800'}
                        `}
                    >
                        {loading ? 'Searching...' : 'Search'}
                    </button>
                </form>

                {/* Location Display */}
                {location && (
                    <div className="mt-3 flex items-center gap-2 text-sm">
                        <span className="text-gray-600">📍 Near:</span>
                        <span className="font-medium text-blue-600">{location.display}</span>
                        <button
                            onClick={() => setLocation(null)}
                            className="text-gray-400 hover:text-gray-600 ml-2"
                        >
                            ×
                        </button>
                    </div>
                )}
            </div>

            {/* Status Info */}
            {!loading && (
                <div className="w-full sm:w-4/5 mb-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 text-sm text-gray-600">
                    <div>
                        Showing <strong>{hospitals.length}</strong> hospital{hospitals.length !== 1 ? 's' : ''}{' '}
                        {pagination.total > 0 && (
                            <>out of <strong>{pagination.total}</strong></>
                        )}
                        {location && (
                            <> near <strong>{location.display.split(',')[0]}</strong></>
                        )}
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => handlePageChange(pagination.page - 1)}
                            disabled={pagination.page === 1 || loading}
                            className={`
                                px-3 py-1 rounded-full text-sm font-medium transition-colors
                                ${pagination.page === 1 || loading
                                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                    : 'bg-white border border-[#C9D8FF] hover:bg-[#EAEFFF]'}
                            `}
                        >
                            Previous
                        </button>

                        <span className="px-3 py-1 bg-blue-600 text-white rounded-full text-sm font-medium min-w-[2rem] text-center">
                            {pagination.page}
                        </span>

                        <button
                            onClick={() => handlePageChange(pagination.page + 1)}
                            disabled={pagination.page === pagination.totalPages || loading}
                            className={`
                                px-3 py-1 rounded-full text-sm font-medium transition-colors
                                ${pagination.page === pagination.totalPages || loading
                                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                    : 'bg-white border border-[#C9D8FF] hover:bg-[#EAEFFF]'}
                            `}
                        >
                            Next
                        </button>
                    </div>
                </div>
            )}

            {/* Loading State */}
            {loading && (
                <div className="text-center py-12">
                    <div className="inline-block animate-spin rounded-full h-10 w-10 border-4 border-blue-500 border-t-transparent"></div>
                    <p className="mt-4 text-gray-600">Finding hospitals...</p>
                </div>
            )}

            {/* Hospitals Grid */}
            <div className='w-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 pt-5 gap-y-6 px-3 sm:px-0'>
                {!loading && hospitals.length > 0 ? (
                    hospitals.map((item, index) => (
                        <div
                            onClick={() => {
                                navigate(`/appointment/${item._id}`);
                                scrollTo(0, 0);
                            }}
                            className='border border-[#C9D8FF] rounded-xl overflow-hidden cursor-pointer hover:translate-y-[-10px] transition-all duration-500 hover:shadow-lg'
                            key={item._id || index}
                        >
                            <img
                                className='w-full h-48 object-cover bg-[#EAEFFF]'
                                src={item.image}
                                alt={item.name}
                                onError={(e) => {
                                    e.target.src = "https://via.placeholder.com/400x180/EAEFFF/5C5C5C?text=Hospital";
                                }}
                            />
                            <div className='p-4'>
                                <div className={`flex items-center gap-2 text-sm ${item.available ? 'text-green-500' : 'text-gray-500'}`}>
                                    <p className={`w-2 h-2 rounded-full ${item.available ? 'bg-green-500' : 'bg-gray-500'}`}></p>
                                    <p>{item.available ? 'Available' : 'Not Available'}</p>
                                </div>
                                <p className='text-[#262626] text-lg font-medium mt-2'>{item.name}</p>
                                <p className='text-[#5C5C5C] text-sm mt-1 line-clamp-2'>{item.about || "Vaccination & healthcare services"}</p>
                                {item.distance !== undefined && (
                                    <div className="mt-3 inline-block px-3 py-1 bg-blue-50 text-blue-700 text-xs font-medium rounded-full">
                                        {Number(item.distance).toFixed(2)} km away
                                    </div>
                                )}

                            </div>
                        </div>
                    ))
                ) : !loading && (
                    <p className='text-center text-gray-500 col-span-full'>No hospitals found matching your search.</p>
                )}
            </div>

            {/* Bottom Pagination */}
            {!loading && pagination.totalPages > 1 && (
                <div className="mt-8 flex flex-col sm:flex-row justify-center items-center gap-4 text-sm">
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

export default Hospitals;