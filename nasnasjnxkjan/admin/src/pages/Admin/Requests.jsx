import React, { useContext, useEffect, useState } from "react";
import { AdminContext } from "../../context/AdminContext";

const AdminRequests = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [status, setStatus] = useState("all");
  const [processingId, setProcessingId] = useState(null);
const {aToken}=useContext(AdminContext)
  // ===== DEMO API – CHANGE THIS LATER =====
  const API_BASE = import.meta.env.VITE_BACKEND_URL;

  const fetchRequests = async () => {
    try {
      setLoading(true);

      // DEMO ENDPOINT
      let url = `${API_BASE}/api/admin/hospital-requests?page=${page}`;

      if (status !== "all") {
        url += `&status=${status}`;
      }

      const res = await fetch(url,{
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          aToken
        }
    });
      const data = await res.json();

      // Expected format:
      // { success:true, data:[], pagination:{pages:3} }

      if (data.success) {
        setRequests(data.data);
        setPages(data.pagination.pages);
      }
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, [page, status]);

  // ===== APPROVE / REJECT (DEMO) =====
  const handleDecision = async (requestId, decision) => {
    try {
      setProcessingId(requestId);

      // DEMO ENDPOINT
      const res = await fetch(`${API_BASE}/api/admin/request-decision`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          aToken
        },
        body: JSON.stringify({
          requestId,
          status: decision, // true = approve, false = reject
        }),
      });

      const data = await res.json();

      if (data.success) {
        // Refresh list
        fetchRequests();
      } else {
        alert(data.message || "Failed");
      }
    } catch (error) {
      console.log(error);
    } finally {
      setProcessingId(null);
    }
  };

  const statusColor = (req) => {
    if (!req.processed) return "bg-yellow-100 text-yellow-700";
    if (req.status) return "bg-green-100 text-green-700";
    return "bg-red-100 text-red-700";
  };

  const statusText = (req) => {
    if (!req.processed) return "PENDING";
    if (req.status) return "APPROVED";
    return "REJECTED";
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
        <h2 className="text-2xl font-bold text-blue-800">
          Admin – Inventory Requests
        </h2>

        <select
          value={status}
          onChange={(e) => {
            setPage(1);
            setStatus(e.target.value);
          }}
          className="border px-3 py-2 rounded-lg focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">All</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>

      {/* TABLE */}
      <div className="bg-white rounded-xl shadow border">
        {/* Header */}
        <div className="hidden md:grid grid-cols-12 gap-4 p-4 bg-blue-50 text-blue-900 font-semibold">
          <div className="col-span-1">#</div>
          <div className="col-span-2">Hospital</div>
          <div className="col-span-4">Vaccines</div>
          <div className="col-span-2">Date</div>
          <div className="col-span-1">Status</div>
          <div className="col-span-2 text-center">Action</div>
        </div>

        {loading ? (
          <div className="p-10 text-center text-blue-600">Loading...</div>
        ) : requests.length === 0 ? (
          <div className="p-10 text-center text-gray-500">
            No requests found
          </div>
        ) : (
          requests.map((req, index) => (
            <div
              key={req._id}
              className="md:grid grid-cols-12 gap-4 p-4 border-t hover:bg-blue-50"
            >
              <div className="col-span-1 text-gray-500">
                {(page - 1) * 10 + index + 1}
              </div>

              <div className="col-span-2">
                <p className="font-semibold">{req.hospitalName}</p>
                <p className="text-xs text-gray-500">{req.hospitalId}</p>
              </div>

              {/* Vaccines */}
              <div className="col-span-4">
                {req.vaccines.map((v, i) => (
                  <div key={i} className="bg-blue-50 p-2 mb-1 rounded">
                    <p className="font-semibold text-blue-800">
                      {v.vaccineName}
                    </p>
                    <p className="text-sm">
                      Qty: {v.quantity} | Price: ₹{v.price}
                    </p>
                  </div>
                ))}
              </div>

              <div className="col-span-2 text-sm">
                {new Date(req.createdAt).toLocaleDateString()}
              </div>

              <div className="col-span-1">
                <span
                  className={`px-2 py-1 rounded-full text-xs ${statusColor(
                    req
                  )}`}
                >
                  {statusText(req)}
                </span>
              </div>

              {/* ACTIONS */}
              <div className="col-span-2 flex justify-center gap-2">
                {!req.processed && (
                  <>
                    <button
                      disabled={processingId === req._id}
                      onClick={() => handleDecision(req._id, true)}
                      className="px-3 py-1 bg-green-100 text-green-700 rounded text-sm"
                    >
                      Approve
                    </button>

                    <button
                      disabled={processingId === req._id}
                      onClick={() => handleDecision(req._id, false)}
                      className="px-3 py-1 bg-red-100 text-red-700 rounded text-sm"
                    >
                      Reject
                    </button>
                  </>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* PAGINATION */}
      <div className="flex justify-center gap-3 mt-4">
        <button
          disabled={page === 1}
          onClick={() => setPage(page - 1)}
          className="px-4 py-2 bg-blue-100 text-blue-700 rounded disabled:opacity-50"
        >
          Prev
        </button>

        <span className="px-4 py-2">
          {page} / {pages}
        </span>

        <button
          disabled={page === pages}
          onClick={() => setPage(page + 1)}
          className="px-4 py-2 bg-blue-100 text-blue-700 rounded disabled:opacity-50"
        >
          Next
        </button>
      </div>
    </div>
  );
};

export default AdminRequests;
