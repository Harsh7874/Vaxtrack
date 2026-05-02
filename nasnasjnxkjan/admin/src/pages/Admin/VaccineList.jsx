import React, { useContext, useEffect, useState } from 'react'
import { AdminContext } from '../../context/AdminContext'

const backendUrl = import.meta.env.VITE_BACKEND_URL

// Delete Confirmation Modal
const DeleteModal = ({ vaccine, onClose, onConfirm, isDeleting }) => {
  if (!vaccine) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden relative"
        style={{ animation: 'modalIn 0.2s ease-out' }}
      >
        {/* Header */}
        <div className="bg-red-50 px-6 pt-6 pb-4 border-b border-red-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Delete Vaccine</h3>
              <p className="text-sm text-gray-500 mt-0.5">
                <span className="font-medium text-red-600">{vaccine.name}</span>
              </p>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="px-6 py-5">
          <p className="text-sm text-gray-600 mb-5">
            Choose how you'd like to delete this vaccine. This action cannot be undone.
          </p>

          <div className="space-y-3">
            {/* Option 1 */}
            <button
              onClick={() => onConfirm(vaccine._id, false)}
              disabled={isDeleting}
              className="w-full flex items-start gap-4 p-4 rounded-xl border-2 border-gray-200 hover:border-orange-400 hover:bg-orange-50 transition-all group text-left disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div className="w-9 h-9 rounded-lg bg-orange-100 group-hover:bg-orange-200 flex items-center justify-center flex-shrink-0 transition-colors mt-0.5">
                <svg className="w-4 h-4 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-800 group-hover:text-orange-700">Delete Vaccine Only</p>
                <p className="text-xs text-gray-500 mt-0.5">Removes this vaccine record from the list only.</p>
              </div>
            </button>

            {/* Option 2 */}
            <button
              onClick={() => onConfirm(vaccine._id, true)}
              disabled={isDeleting}
              className="w-full flex items-start gap-4 p-4 rounded-xl border-2 border-gray-200 hover:border-red-500 hover:bg-red-50 transition-all group text-left disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div className="w-9 h-9 rounded-lg bg-red-100 group-hover:bg-red-200 flex items-center justify-center flex-shrink-0 transition-colors mt-0.5">
                <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-800 group-hover:text-red-700">Delete from Entire System</p>
                <p className="text-xs text-gray-500 mt-0.5">Permanently removes all data related to this vaccine across the entire system.</p>
              </div>
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 pb-5">
          <button
            onClick={onClose}
            disabled={isDeleting}
            className="w-full py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
        </div>

        {/* Loading overlay */}
        {isDeleting && (
          <div className="absolute inset-0 bg-white/70 rounded-2xl flex items-center justify-center">
            <div className="flex items-center gap-2 text-red-600">
              <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              <span className="text-sm font-medium">Deleting...</span>
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes modalIn {
          from { opacity: 0; transform: scale(0.95) translateY(8px); }
          to   { opacity: 1; transform: scale(1) translateY(0); }
        }
      `}</style>
    </div>
  )
}

// Toast notification
const Toast = ({ message, type, onClose }) => {
  useEffect(() => {
    const t = setTimeout(onClose, 3500)
    return () => clearTimeout(t)
  }, [onClose])

  const colors = type === 'success' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'

  return (
    <div className={`fixed bottom-5 right-5 z-50 flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg text-sm font-medium ${colors}`}
      style={{ animation: 'toastIn 0.3s ease-out' }}>
      {type === 'success'
        ? <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        : <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
      }
      {message}
      <style>{`
        @keyframes toastIn {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  )
}

const VaccinesList = () => {
  const { vaccines, aToken, getAllVaccines } = useContext(AdminContext)
  const [selectedVaccine, setSelectedVaccine] = useState(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [toast, setToast] = useState(null)

  useEffect(() => {
    if (aToken) {
      getAllVaccines()
    }
  }, [aToken])

  const handleDelete = async (vaccineId, deleteFromEntireSystem) => {
    setIsDeleting(true)
    try {
      const response = await fetch(`${backendUrl}/api/admin/delete-vaccine/${vaccineId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          aToken: `${aToken}`,
        },
        body: JSON.stringify({ deleteFromEntireSystem }),
      })

      if (!response.ok) throw new Error('Failed to delete vaccine')
      const data = await response.json()
      if (!data.success) throw new Error(data.message || 'Delete failed')

      await getAllVaccines()
      setSelectedVaccine(null)
      setToast({
        message: deleteFromEntireSystem
          ? 'Vaccine deleted from entire system.'
          : 'Vaccine deleted successfully.',
        type: 'success',
      })
    } catch (err) {
      setToast({ message: err.message, type: 'error' })
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div className='m-5 max-h-[90vh] overflow-y-scroll'>
      <h1 className='text-lg font-medium'>All Vaccines</h1>
      <div className='w-full flex flex-wrap gap-4 pt-5 gap-y-6'>
        {vaccines.map((item, index) => (
          <div
            className='border border-[#C9D8FF] rounded-xl max-w-56 overflow-hidden cursor-pointer group relative'
            key={index}
          >
            <img
              className='bg-[#EAEFFF] group-hover:bg-primary transition-all duration-500 w-full'
              src={item.image}
              alt=""
            />

            {/* Delete Button */}
            <button
              onClick={(e) => {
                e.stopPropagation()
                setSelectedVaccine(item)
              }}
              className='absolute top-2 right-2 w-7 h-7 flex items-center justify-center rounded-lg bg-red/80 text-gray-300 hover:text-red-500 hover:bg-red-50 shadow-sm transition-all opacity-0 group-hover:opacity-100'
              title='Delete vaccine'
            >
              <svg className='w-3.5 h-3.5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2}
                  d='M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16' />
              </svg>
            </button>
              
            <div className='p-4'>
              <p className='text-[#262626] text-lg font-medium'>{item.name}</p>
              <p className='text-[#5C5C5C] text-sm'>{item.description}</p>
              <div className='mt-2 flex items-center gap-1 text-sm'></div>
            </div>
          </div>
        ))}
      </div>

      {/* Delete Modal */}
      {selectedVaccine && (
        <DeleteModal
          vaccine={selectedVaccine}
          onClose={() => !isDeleting && setSelectedVaccine(null)}
          onConfirm={handleDelete}
          isDeleting={isDeleting}
        />
      )}

      {/* Toast */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  )
}

export default VaccinesList