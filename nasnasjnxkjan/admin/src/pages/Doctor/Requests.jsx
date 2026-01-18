import React, { useContext, useEffect, useState } from "react";
import { HospitalContext } from "../../context/HospitalContext.jsx";

const HospitalRequests = () => {
  const { hToken, backendUrl } = useContext(HospitalContext);

  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(false);

  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [status, setStatus] = useState("all");

  const fetchRequests = async () => {
    try {
      setLoading(true);

      let url = `${backendUrl}/api/hospital/hospital-requests?page=${page}`;

      if (status !== "all") {
        url += `&status=${status}`;
      }

      const res = await fetch(url, {
        headers: {
          hToken
        },
      });

      const data = await res.json();

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
    if (hToken) {
      fetchRequests();
    }
  }, [hToken, page, status]);

  const statusColor = (req) => {
    if (!req.processed) return "bg-yellow-100 text-yellow-700";
    if (req.status) return "bg-green-100 text-green-700";
    return "bg-red-100 text-red-700";
  };

  const statusText = (req) => {
    if (!req.processed && !req.status) return "PENDING";
    if (req.status) return "APPROVED";
    return "REJECTED";
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
        <h2 className="text-2xl font-bold text-blue-800">
          Inventory Requests
        </h2>

        {/* Filter */}
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

      {/* Table */}
      <div className="bg-white rounded-xl shadow border">
        <div className="hidden md:grid grid-cols-12 gap-4 p-4 bg-blue-50 text-blue-900 font-semibold">
          <div className="col-span-1">#</div>
          <div className="col-span-3">Request ID</div>
          <div className="col-span-4">Vaccines</div>
          <div className="col-span-2">Date</div>
          <div className="col-span-2">Status</div>
        </div>

        {loading ? (
          <div className="p-10 text-center text-blue-600">
            Loading...
          </div>
        ) : requests.length === 0 ? (
          <div className="p-10 text-center text-gray-500">
            No requests found
          </div>
        ) : (
          requests.map((req, index) => (
            <div
              key={req._id}
              className="md:grid grid-cols-12 gap-4 p-4 border-t hover:bg-blue-50 transition"
            >
              <div className="col-span-1 text-gray-500">
                {(page - 1) * 10 + index + 1}
              </div>

              <div className="col-span-3 font-mono text-sm">
                {req._id}
              </div>

              {/* Vaccines */}
              <div className="col-span-4">
                {req.vaccines.map((v, i) => (
                  <div
                    key={i}
                    className="text-sm bg-blue-50 mb-1 p-2 rounded"
                  >
                    <p className="font-semibold text-blue-800">
                      {v.vaccineName}
                    </p>
                    <p className="text-blue-700">
                      Qty: {v.quantity} | Price: ₹{v.price}
                    </p>
                  </div>
                ))}
              </div>

              <div className="col-span-2 text-sm">
                {new Date(req.createdAt).toLocaleDateString()}
              </div>

              <div className="col-span-2">
                <span
                  className={`px-3 py-1 rounded-full text-xs font-semibold ${statusColor(
                    req
                  )}`}
                >
                  {statusText(req)}
                </span>
              </div>

              {/* Mobile */}
              <div className="md:hidden mt-3 pt-3 border-t">
                <p className="text-sm text-gray-500">
                  Date:{" "}
                  {new Date(req.createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Pagination */}
      <div className="flex justify-center gap-3 mt-4">
        <button
          disabled={page === 1}
          onClick={() => setPage(page - 1)}
          className="px-4 py-2 bg-blue-100 text-blue-700 rounded disabled:opacity-50"
        >
          Prev
        </button>

        <span className="px-4 py-2 text-blue-800">
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

export default HospitalRequests;
