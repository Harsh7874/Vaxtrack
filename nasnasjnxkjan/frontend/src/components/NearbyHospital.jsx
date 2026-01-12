import React, { useContext, useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { AppContext } from '../context/AppContext'

const RADIUS_KM = 5  // adjust as needed

// Haversine formula to compute distance (in km) between two lat/lon points
const getDistanceKm = (lat1, lon1, lat2, lon2) => {
  const toRad = deg => deg * Math.PI / 180
  const R = 6371 // earth radius in km
  const dLat = toRad(lat2 - lat1)
  const dLon = toRad(lon2 - lon1)
  const a = Math.sin(dLat/2)**2
          + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2))
          * Math.sin(dLon/2)**2
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

const NearbyHospital = () => {
  const navigate = useNavigate()
  const { hospitals } = useContext(AppContext)

  const [nearby, setNearby] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!navigator.geolocation) {
      setError('Geolocation not supported')
      setLoading(false)
      return
    }

    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        const { latitude: userLat, longitude: userLon } = coords

        // compute distance for each hospital
        const withDist = hospitals.map(h => {
          const [lon, lat] = h.location.coordinates
          return {
            ...h,
            distance: getDistanceKm(userLat, userLon, lat, lon)
          }
        })

        // filter within radius and sort
        const filtered = withDist
          .filter(h => h.distance <= RADIUS_KM)
          .sort((a, b) => a.distance - b.distance)

        setNearby(filtered)
        setLoading(false)
      },
      err => {
        setError(err.message || 'Unable to retrieve location')
        setLoading(false)
      }
    )
  }, [hospitals])

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <p>Determining your location…</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex justify-center items-center h-64">
        <p className="text-red-500">Error: {error}</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center gap-4 my-16 text-[#262626] md:mx-10">
      <h1 className="text-3xl font-medium">Nearby Hospitals</h1>
      <p className="sm:w-1/2 text-center text-sm">
        Showing hospitals within {RADIUS_KM} km of your location.
      </p>

      <div className="w-full grid grid-cols-auto gap-4 pt-5 gap-y-6 px-3 sm:px-0">
        {nearby.length === 0 && (
          <p className="col-span-full text-center">No hospitals found nearby.</p>
        )}

        {nearby.slice(0, 10).map((item, idx) => (
          <div
            key={item._id}
            onClick={() => {
              navigate(`/appointment/${item._id}`)
              scrollTo(0, 0)
            }}
            className="border border-[#C9D8FF] rounded-xl overflow-hidden cursor-pointer hover:translate-y-[-10px] transition-all duration-500"
          >
            <img className="w-full h-48 object-cover bg-[#EAEFFF]" src={item.image} alt={item.name} />
            <div className="p-4">
              <div
                className={`flex items-center gap-2 text-sm text-center ${
                  item.available ? 'text-green-500' : 'text-gray-500'
                }`}
              >
                <p
                  className={`w-2 h-2 rounded-full ${
                    item.available ? 'bg-green-500' : 'bg-gray-500'
                  }`}
                ></p>
                <p>{item.available ? 'Available' : 'Not Available'}</p>
              </div>
              <p className="text-[#262626] text-lg font-medium">{item.name}</p>
              <p className="text-sm text-gray-600">
                {item.distance.toFixed(1)} km away
              </p>
            </div>
          </div>
        ))}
      </div>

      {nearby.length > 10 && (
        <button
          onClick={() => {
            navigate('/hospital')
            scrollTo(0, 0)
          }}
          className="bg-[#EAEFFF] text-gray-600 px-12 py-3 rounded-full mt-10"
        >
          more
        </button>
      )}
    </div>
  )
}

export default NearbyHospital
