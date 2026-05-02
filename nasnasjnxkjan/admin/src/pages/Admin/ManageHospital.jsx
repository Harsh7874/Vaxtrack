import React, { useEffect, useState, useContext } from "react";
import axios from "axios";
import { useSearchParams, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { AdminContext } from "../../context/AdminContext";
const ab = import.meta.env.VITE_BACKEND_URL;
const API_BASE = `${ab}/api`

// Spinner component
const Spinner = () => (
  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
  </svg>
);

// Delete Confirmation Modal
const DeleteHospitalModal = ({ hospitalName, onClose, onConfirm, isDeleting }) => (
  <div
    className="fixed inset-0 z-50 flex items-center justify-center p-4"
    style={{ backgroundColor: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)" }}
  >
    <div
      className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden relative"
      style={{ animation: "modalIn 0.2s ease-out" }}
    >
      <div className="bg-red-50 px-6 pt-6 pb-4 border-b border-red-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
            <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
            </svg>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Delete Hospital</h3>
            <p className="text-sm text-gray-500 mt-0.5">
              <span className="font-medium text-red-600">{hospitalName}</span>
            </p>
          </div>
        </div>
      </div>

      <div className="px-6 py-5">
        <p className="text-sm text-gray-600 mb-1">
          Are you sure you want to permanently delete this hospital?
        </p>
        <p className="text-xs text-red-500 font-medium">
          This will remove the hospital and all its associated data. This action cannot be undone.
        </p>
      </div>

      <div className="px-6 pb-6 flex gap-3">
        <button
          onClick={onClose}
          disabled={isDeleting}
          className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          onClick={onConfirm}
          disabled={isDeleting}
          className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isDeleting ? (
            <><Spinner />Deleting...</>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              Delete Hospital
            </>
          )}
        </button>
      </div>
    </div>

    <style>{`
      @keyframes modalIn {
        from { opacity: 0; transform: scale(0.95) translateY(8px); }
        to   { opacity: 1; transform: scale(1) translateY(0); }
      }
    `}</style>
  </div>
);

const HospitalVaccineManager = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const hospitalId = searchParams.get("hospitalId");

  const [hospital, setHospital] = useState({ vaccines: [] });
  const [originalVaccines, setOriginalVaccines] = useState([]); // ← snapshot of saved values
  const [masterVaccines, setMasterVaccines] = useState([]);
  const [newVaccineId, setNewVaccineId] = useState("");
  const [newPrice, setNewPrice] = useState("");
  const [newQty, setNewQty] = useState("");
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isUpdatingAvailability, setIsUpdatingAvailability] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [savingVaccineId, setSavingVaccineId] = useState(null);
  const [removingVaccineId, setRemovingVaccineId] = useState(null);
  const { aToken } = useContext(AdminContext);

  // Helper: deep-clone vaccine list for snapshot
  const snapshotVaccines = (vaccines) =>
    vaccines.map((v) => ({ ...v }));

  useEffect(() => {
    if (!hospitalId) return;
    const fetchData = async () => {
      try {
        const hRes = await axios.get(`${API_BASE}/user/get-hospital/${hospitalId}`);
        const hospitalData = hRes.data.hospitalData || { vaccines: [] };
        setHospital(hospitalData);
        setOriginalVaccines(snapshotVaccines(hospitalData.vaccines || [])); // ← save snapshot
        const vRes = await axios.get(`${API_BASE}/vaccine/list`);
        setMasterVaccines(vRes.data.vaccines);
      } catch (err) {
        toast.error("Failed to load data");
      }
    };
    fetchData();
  }, [hospitalId]);

  // Returns true if this vaccine row has unsaved changes
  const isDirty = (vaccine) => {
    const original = originalVaccines.find((o) => o.vaccineId === vaccine.vaccineId);
    if (!original) return false;
    return (
      Number(vaccine.quantity) !== Number(original.quantity) ||
      Number(vaccine.price) !== Number(original.price)
    );
  };

  // After a successful save/add/remove, sync the snapshot with latest server data
  const syncSnapshot = (updatedHospital) => {
    setHospital(updatedHospital);
    setOriginalVaccines(snapshotVaccines(updatedHospital.vaccines || []));
  };

  const updateAvailable = async (value) => {
    setIsUpdatingAvailability(true);
    try {
      const res = await axios.patch(`${API_BASE}/admin/edit-vaccine/${hospitalId}`, { available: value },
        { headers: { aToken } }
      );
      syncSnapshot(res.data.data);
      toast.success("Availability updated");
    } catch {
      toast.error("Failed to update");
    } finally {
      setIsUpdatingAvailability(false);
    }
  };

  const updateVaccine = async (vaccine) => {
    setSavingVaccineId(vaccine.vaccineId);
    try {
      const res = await axios.patch(`${API_BASE}/admin/edit-vaccine/${hospitalId}`, {
        vaccineId: vaccine.vaccineId,
        quantity: vaccine.quantity,
        price: vaccine.price,
      }, { headers: { aToken } });
      syncSnapshot(res.data.data);
      toast.success("Vaccine updated");
    } catch {
      toast.error("Update failed");
    } finally {
      setSavingVaccineId(null);
    }
  };

  const removeVaccine = async (vaccineId) => {
    if (!window.confirm("Are you sure you want to remove this vaccine?")) return;
    setRemovingVaccineId(vaccineId);
    try {
      const res = await axios.patch(`${API_BASE}/admin/edit-vaccine/${hospitalId}`, {
        vaccineId,
        remove: true,
      }, { headers: { aToken } });
      syncSnapshot(res.data.data);
      toast.success("Vaccine removed");
    } catch {
      toast.error("Remove failed");
    } finally {
      setRemovingVaccineId(null);
    }
  };

  const addVaccine = async () => {
    const selected = masterVaccines.find((v) => v._id === newVaccineId);
    if (!selected) return toast.error("Select vaccine");
    if (!newPrice || !newQty) return toast.error("Enter price & qty");
    setIsAdding(true);
    try {
      const res = await axios.patch(`${API_BASE}/admin/edit-vaccine/${hospitalId}`, {
        vaccineId: newVaccineId,
        quantity: Number(newQty),
        price: Number(newPrice),
      }, { headers: { aToken } });
      syncSnapshot(res.data.data);
      setNewPrice("");
      setNewQty("");
      setNewVaccineId("");
      toast.success("Vaccine added");
    } catch (err) {
      toast.error(err.response?.data?.message || "Add failed");
    } finally {
      setIsAdding(false);
    }
  };

  const deleteHospital = async () => {
    setIsDeleting(true);
    try {
      await axios.delete(`${API_BASE}/admin/delete-hospital/${hospitalId}`,
        { headers: { aToken } }
      );
      toast.success("Hospital deleted successfully");
      setShowDeleteModal(false);
      navigate(-1);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to delete hospital");
    } finally {
      setIsDeleting(false);
    }
  };

  const availableVaccines = masterVaccines.filter(
    (mv) => !hospital?.vaccines?.some((hv) => hv.vaccineId === mv._id)
  );

  if (!hospital) return <div className="p-10 text-center">Loading hospital...</div>;

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6">
      {/* HEADER */}
      <div className="bg-white rounded-xl shadow p-6 flex justify-between items-start">
        <div className="flex items-start gap-4">
          <img src={hospital.image} alt="Hospital" className="w-16 h-16 object-cover rounded" />
          <div>
            <h1 className="text-2xl font-bold">{hospital.name}</h1>
            <p className="text-gray-500">{hospital.email}</p>
            <div className="mt-2 text-sm text-gray-600">
              <p>📍 {hospital.address?.line1}</p>
              {hospital.address?.line2 && <p>📍 {hospital.address?.line2}</p>}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-sm">Available:</span>
            <button
              onClick={() => updateAvailable(!hospital.available)}
              disabled={isUpdatingAvailability}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-white text-sm font-medium transition-colors disabled:opacity-70 disabled:cursor-not-allowed ${
                hospital.available ? "bg-green-600 hover:bg-green-700" : "bg-red-500 hover:bg-red-600"
              }`}
            >
              {isUpdatingAvailability ? (<><Spinner />Updating...</>) : (hospital.available ? "OPEN" : "CLOSED")}
            </button>
          </div>

          <button
            onClick={() => setShowDeleteModal(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 hover:border-red-400 transition-all text-sm font-medium"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            Delete Hospital
          </button>
        </div>
      </div>

      {/* VACCINE TABLE */}
      <div className="bg-white rounded-xl shadow">
        <div className="p-4 border-b font-semibold">Manage Vaccines & Price</div>
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="p-3 text-left">Name</th>
              <th className="p-3">Quantity</th>
              <th className="p-3">Price (₹)</th>
              <th className="p-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {hospital?.vaccines?.map((v, i) => {
              const dirty = isDirty(v);
              const isSaving = savingVaccineId === v.vaccineId;
              const isRemoving = removingVaccineId === v.vaccineId;

              return (
                <tr key={i} className={`border-t transition-colors ${dirty ? "bg-amber-50" : ""}`}>
                  <td className="p-3 font-medium">{v.vaccineName}</td>
                  <td className="p-3 text-center">
                    <input
                      className={`border p-1 w-24 text-center rounded transition-colors ${
                        dirty ? "border-amber-400 bg-amber-50 focus:border-amber-500" : ""
                      }`}
                      value={v.quantity}
                      onChange={(e) => {
                        const copy = { ...hospital, vaccines: [...hospital.vaccines] };
                        copy.vaccines[i] = { ...copy.vaccines[i], quantity: Number(e.target.value) || 0 };
                        setHospital(copy);
                      }}
                    />
                  </td>
                  <td className="p-3 text-center">
                    <input
                      className={`border p-1 w-24 text-center rounded transition-colors ${
                        dirty ? "border-amber-400 bg-amber-50 focus:border-amber-500" : ""
                      }`}
                      value={v.price}
                      onChange={(e) => {
                        const copy = { ...hospital, vaccines: [...hospital.vaccines] };
                        copy.vaccines[i] = { ...copy.vaccines[i], price: Number(e.target.value) || 0 };
                        setHospital(copy);
                      }}
                    />
                  </td>
                  <td className="p-3 text-center">
                    <div className="flex gap-2 justify-center items-center">
                      {/* Save button — only visible when row is dirty */}
                      <div className={`transition-all duration-200 overflow-hidden ${
                        dirty ? "w-auto opacity-100" : "w-0 opacity-0 pointer-events-none"
                      }`}>
                        <button
                          onClick={() => updateVaccine(v)}
                          disabled={isSaving || isRemoving}
                          className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded flex items-center gap-1.5 whitespace-nowrap disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
                        >
                          {isSaving ? (<><Spinner />Saving...</>) : "Save"}
                        </button>
                      </div>

                      <button
                        onClick={() => removeVaccine(v.vaccineId)}
                        disabled={isRemoving || isSaving}
                        className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded flex items-center gap-1.5 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
                      >
                        {isRemoving ? (<><Spinner />Removing...</>) : "Remove"}
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* ADD NEW */}
      <div className="bg-white p-5 rounded-xl shadow space-y-3">
        <h3 className="font-semibold">Add New Vaccine</h3>
        <div className="grid grid-cols-4 gap-3">
          <select
            className="border p-2"
            value={newVaccineId}
            onChange={(e) => setNewVaccineId(e.target.value)}
          >
            <option value="">Select Vaccine</option>
            {availableVaccines.map((v) => (
              <option value={v._id} key={v._id}>{v.name}</option>
            ))}
          </select>
          <input
            placeholder="Price"
            className="border p-2"
            value={newPrice}
            onChange={(e) => setNewPrice(e.target.value)}
          />
          <input
            placeholder="Quantity"
            className="border p-2"
            value={newQty}
            onChange={(e) => setNewQty(e.target.value)}
          />
          <button
            onClick={addVaccine}
            disabled={!newVaccineId || isAdding}
            className="bg-green-600 text-white rounded flex items-center justify-center gap-1.5 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isAdding ? (<><Spinner />Adding...</>) : "Add"}
          </button>
        </div>
      </div>

      {showDeleteModal && (
        <DeleteHospitalModal
          hospitalName={hospital.name}
          onClose={() => !isDeleting && setShowDeleteModal(false)}
          onConfirm={deleteHospital}
          isDeleting={isDeleting}
        />
      )}
    </div>
  );
};

export default HospitalVaccineManager;