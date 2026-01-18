import React, { useEffect, useState } from "react";
import axios from "axios";
import { useSearchParams } from "react-router-dom";
import { toast } from "react-toastify";
const API_BASE = "https://vaxtrack-alpha.vercel.app/api";
const HospitalVaccineManager = () => {
  const [searchParams] = useSearchParams();
  const hospitalId = searchParams.get("hospitalId");
  const [hospital, setHospital] = useState({
    vaccines: []
  });
  const [masterVaccines, setMasterVaccines] = useState([]);
  const [loading, setLoading] = useState(false);
  const [newVaccineId, setNewVaccineId] = useState("");
  const [newPrice, setNewPrice] = useState("");
  const [newQty, setNewQty] = useState("");
  // ===== FETCH DATA =====
  useEffect(() => {
    if (!hospitalId) return;
    const fetchData = async () => {
      try {
        const hRes = await axios.get(
          `${API_BASE}/user/get-hospital/${hospitalId}`
        );
        setHospital(hRes.data.hospitalData || { vaccines: [] });
        const vRes = await axios.get(`${API_BASE}/vaccine/list`);
        setMasterVaccines(vRes.data.vaccines);
      } catch (err) {
        toast.error("Failed to load data");
      }
    };
    fetchData();
  }, [hospitalId]);
  // ===== UPDATE AVAILABILITY =====
  const updateAvailable = async (value) => {
    try {
      const res = await axios.patch(
        `${API_BASE}/admin/edit-vaccine/${hospitalId}`,
        {
          available: value,
        }
      );
      setHospital(res.data.data);
      toast.success("Availability updated");
    } catch {
      toast.error("Failed to update");
    }
  };
  // ===== UPDATE VACCINE =====
  const updateVaccine = async (vaccine) => {
    try {
      const res = await axios.patch(
        `${API_BASE}/admin/edit-vaccine/${hospitalId}`,
        {
          vaccineId: vaccine.vaccineId,
          quantity: vaccine.quantity,
          price: vaccine.price,
        }
      );
      setHospital(res.data.data);
      toast.success("Vaccine updated");
    } catch {
      toast.error("Update failed");
    }
  };
  // ===== REMOVE VACCINE =====
  const removeVaccine = async (vaccineId) => {
    if (!window.confirm("Are you sure you want to remove this vaccine?")) return;
    try {
      const res = await axios.patch(
        `${API_BASE}/admin/edit-vaccine/${hospitalId}`,
        {
          vaccineId,
          remove: true,
        }
      );
      setHospital(res.data.data);
      toast.success("Vaccine removed");
    } catch {
      toast.error("Remove failed");
    }
  };
  // ===== ADD NEW VACCINE =====
  const addVaccine = async () => {
    const selected = masterVaccines.find((v) => v._id === newVaccineId);
    if (!selected) return toast.error("Select vaccine");
    if (!newPrice || !newQty) return toast.error("Enter price & qty");
    try {
      const res = await axios.patch(
        `${API_BASE}/admin/edit-vaccine/${hospitalId}`,
        {
          vaccineId: newVaccineId,
          quantity: Number(newQty),
          price: Number(newPrice),
        }
      );
      setHospital(res.data.data);
      setNewPrice("");
      setNewQty("");
      setNewVaccineId("");
      toast.success("Vaccine added");
    } catch (err) {
      toast.error(err.response?.data?.message || "Add failed");
    }
  };
  const availableVaccines = masterVaccines.filter(
    (mv) => !hospital.vaccines?.some((hv) => hv.vaccineId === mv._id)
  );
  if (!hospital) return <div className="p-10 text-center">Loading hospital...</div>;
  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6">
      {/* HEADER */}
      <div className="bg-white rounded-xl shadow p-6 flex justify-between">
        <div className="flex items-start gap-4">
          <img
            src={hospital.image}
            alt="Hospital"
            className="w-16 h-16 object-cover rounded"
          />
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
          <span className="font-semibold">Available:</span>
          <button
            onClick={() => updateAvailable(!hospital.available)}
            className={`px-4 py-2 rounded-lg text-white ${
              hospital.available ? "bg-green-600" : "bg-red-500"
            }`}
          >
            {hospital.available ? "OPEN" : "CLOSED"}
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
            {hospital?.vaccines?.map((v, i) => (
              <tr key={i} className="border-t">
                <td className="p-3">{v.vaccineName}</td>
                <td className="p-3 text-center">
                  <input
                    className="border p-1 w-24 text-center"
                    value={v.quantity}
                    onChange={(e) => {
                      const copy = { ...hospital };
                      copy.vaccines[i].quantity = Number(e.target.value) || 0;
                      setHospital(copy);
                    }}
                  />
                </td>
                <td className="p-3 text-center">
                  <input
                    className="border p-1 w-24 text-center"
                    value={v.price}
                    onChange={(e) => {
                      const copy = { ...hospital };
                      copy.vaccines[i].price = Number(e.target.value) || 0;
                      setHospital(copy);
                    }}
                  />
                </td>
                <td className="p-3 text-center flex gap-2 justify-center">
                  <button
                    onClick={() => updateVaccine(v)}
                    className="bg-blue-600 text-white px-3 py-1 rounded"
                  >
                    Save
                  </button>
                  <button
                    onClick={() => removeVaccine(v.vaccineId)}
                    className="bg-red-600 text-white px-3 py-1 rounded"
                  >
                    Remove
                  </button>
                </td>
              </tr>
            ))}
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
              <option value={v._id} key={v._id}>
                {v.name}
              </option>
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
            className="bg-green-600 text-white rounded"
            disabled={!newVaccineId}
          >
            Add
          </button>
        </div>
      </div>
    </div>
  );
};
export default HospitalVaccineManager;