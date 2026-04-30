import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

const NearbyHospital = () => {
  const navigate = useNavigate()

  const [hospitals, setHospitals] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const setCookie = (name, value, days) => {
    const d = new Date()
    d.setTime(d.getTime() + days * 24 * 60 * 60 * 1000)
    document.cookie = `${name}=${JSON.stringify(value)};expires=${d.toUTCString()};path=/`
  }

  const getCookie = (name) => {
    const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'))
    return match ? JSON.parse(match[2]) : null
  }

  // 🔹 Fetch hospitals from your API
  const fetchHospitals = async (url) => {
    try {
      setLoading(true)

      const res = await fetch(url)
      const data = await res.json()

      if (data.success) {
        setHospitals(data.data || [])
      } else {
        setError("Failed to load hospitals")
      }
    } catch (err) {
      setError("Network error")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const saved = getCookie("userLocation")

    // ---------- CASE 1: Location already stored ----------
    if (saved) {
      fetchHospitals(
        `https://vaxtrack-alpha.vercel.app/api/public/hospital-search?lat=${saved.lat}&lon=${saved.lon}&sortBy=distance&limit=12`
      )
      return
    }

    // ---------- CASE 2: Ask for location ----------
    if (!navigator.geolocation) {
      setError("Geolocation not supported")

      // Fallback API
      fetchHospitals(
        `https://vaxtrack-alpha.vercel.app/api/public/hospital-search?query=hospital&limit=12`
      )
      return
    }

    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        const { latitude, longitude } = coords

        // store for 2 days
        setCookie("userLocation", { lat: latitude, lon: longitude }, 2)
        fetchHospitals(
          `https://vaxtrack-alpha.vercel.app/api/public/hospital-search?sortBy=distance&lat=${latitude}&lon=${longitude}&limit=12`
        )
      },

      // ---------- CASE 3: User Denied ----------
      () => {
        setError("denied")

        fetchHospitals(
          `https://vaxtrack-alpha.vercel.app/api/public/hospital-search?query=hospital&limit=15&limit=12`
        )
      }
    )
  }, [])

  if (loading) {
    return (
       <div className="flex flex-col justify-center items-center h-64 gap-4">
      <div className="relative w-16 h-16">
        {/* Outer ring */}
        <div className="absolute inset-0 border-4 border-blue-200 rounded-full"></div>
        {/* Spinning ring */}
        <div className="absolute inset-0 border-4 border-transparent border-t-blue-600 rounded-full animate-spin"></div>
        {/* Inner pulse */}
        <div className="absolute inset-3 bg-blue-500 rounded-full animate-pulse opacity-20"></div>
      </div>
    </div>
    )
  }

  if (error && error !== "denied") {
    return (
      <div className="flex justify-center items-center h-64">
        <p className="text-red-500">Error: {error}</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center gap-4 my-16 text-[#262626] md:mx-10">
      <h1 className="text-3xl font-medium">
        {error === "denied" ? "Top Hospitals" : "Nearby Hospitals"}
      </h1>

      <p className="sm:w-1/2 text-center text-sm">
        {error === "denied"
          ? "Showing top hospitals"
          : "Showing hospitals near your location."}
      </p>

      <div className="w-full grid grid-cols-auto gap-4 pt-5 gap-y-6 px-3 sm:px-0">

        {hospitals.length === 0 && (
          <p className="col-span-full text-center">
            No hospitals found.
          </p>
        )}

        {hospitals.slice(0, 12).map((item) => (

          <div
            key={item._id}
            onClick={() => {
              navigate(`/appointment/${item._id}`)
              scrollTo(0, 0)
            }}
            className="border border-[#C9D8FF] rounded-xl overflow-hidden cursor-pointer hover:translate-y-[-10px] transition-all duration-500"
          >
            <img
              className="w-full h-48 object-cover bg-[#EAEFFF]"
              src={item.image}
              alt={item.name}
            />

            <div className="p-4">
              <div
                className={`flex items-center gap-2 text-sm ${item.available ? 'text-green-500' : 'text-gray-500'
                  }`}
              >
                <p
                  className={`w-2 h-2 rounded-full ${item.available ? 'bg-green-500' : 'bg-gray-500'
                    }`}
                ></p>

                <p>{item.available ? 'Available' : 'Not Available'}</p>
              </div>

              <p className="text-[#262626] text-lg font-medium">
                {item.name}
              </p>
              <p className="text-sm text-gray-600">
                {item?.distance != null && (
                  item.distance < 1
                    ? `${(item.distance*1000).toFixed(2)} m away` 
                    : `${(item.distance).toFixed(2)} km away`
                )}
              </p>

            </div>
          </div>
        ))}
      </div>

      {hospitals.length > 10 && (
        <button
          onClick={() => {
            navigate('/hospitals')
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
