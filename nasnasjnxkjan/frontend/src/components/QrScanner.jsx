import React, { useState, useEffect, useRef } from "react";
import { Html5Qrcode } from "html5-qrcode";

const QrVerify = () => {
  const [scanner, setScanner] = useState(null);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const hasScannedRef = useRef(false); // Prevent multiple API calls

  useEffect(() => {
    const qrScanner = new Html5Qrcode("reader");
    setScanner(qrScanner);

    return () => {
      if (qrScanner.isScanning) {
        qrScanner.stop().catch(() => {});
      }
      qrScanner.clear().catch(() => {});
    };
  }, []);

  const handleScan = async (decodedText) => {
    // Prevent multiple scans while processing
    if (hasScannedRef.current || loading) {
      return;
    }

    try {
      hasScannedRef.current = true; // Lock further scans
      setError("");
      setResult(null);

      // Parse QR data
      let qrData;
      try {
        qrData = JSON.parse(decodedText);
      } catch (parseError) {
        setError("Invalid QR Format - Not valid JSON");
        hasScannedRef.current = false;
        return;
      }

      // Validate QR data structure
      if (!qrData.appointmentId || !qrData.uuid) {
        setError("Invalid QR - Missing appointmentId or uuid");
        hasScannedRef.current = false;
        return;
      }

      // Stop camera before API call
      await stopScan();

      setLoading(true);

      const response = await fetch(
        `https://vaxtrack-alpha.vercel.app/api/public/verify-vaccine?appointmentId=${qrData.appointmentId}`
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setResult(data);
    } catch (err) {
      setError(err.message || "Failed to verify QR");
      hasScannedRef.current = false;
    } finally {
      setLoading(false);
    }
  };

  const startScan = async () => {
    if (!scanner) return;

    try {
      setError("");
      setResult(null);
      hasScannedRef.current = false; // Reset scan lock

      await scanner.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: 250 },
        handleScan,
        () => {} // Error callback (fires continuously, so we ignore)
      );

      setIsScanning(true);
    } catch (err) {
      setError("Camera start failed - " + err.message);
    }
  };

  const stopScan = async () => {
    if (!scanner || !isScanning) return;

    try {
      await scanner.stop();
      setIsScanning(false);
    } catch (err) {
      console.error("Stop scan error:", err);
      // Force clear if stop fails
      try {
        await scanner.clear();
        setIsScanning(false);
      } catch (clearErr) {
        console.error("Clear error:", clearErr);
      }
    }
  };

  const resetAll = async () => {
    await stopScan();
    setResult(null);
    setError("");
    setLoading(false);
    hasScannedRef.current = false;

    setTimeout(() => {
      startScan();
    }, 300);
  };

  const handleBack = () => {
    window.location.href = "/";
  };

  const data = result?.appointentData;

  return (
    <div className="min-h-screen bg-gray-100 p-4 flex justify-center">
      <div className="bg-white shadow-lg rounded-xl p-6 w-full max-w-xl">
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={handleBack}
            className="text-gray-600 hover:text-gray-800 flex items-center gap-2"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 19l-7-7m0 0l7-7m-7 7h18"
              />
            </svg>
            Back
          </button>
          <h2 className="text-2xl font-bold text-center flex-1">
            Vaccine Verification
          </h2>
          <div className="w-16"></div>
        </div>

        <div id="reader" className="mb-4 rounded overflow-hidden"></div>

        <div className="flex gap-3 justify-center mb-4 flex-wrap">
          <button
            onClick={startScan}
            disabled={isScanning || loading}
            className={`px-4 py-2 rounded text-white ${
              isScanning || loading
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-green-600 hover:bg-green-700"
            }`}
          >
            Start Scan
          </button>

          <button
            onClick={stopScan}
            disabled={!isScanning || loading}
            className={`px-4 py-2 rounded text-white ${
              !isScanning || loading
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-red-600 hover:bg-red-700"
            }`}
          >
            Stop Camera
          </button>

          <button
            onClick={resetAll}
            disabled={loading}
            className={`px-4 py-2 rounded text-white ${
              loading
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-blue-600 hover:bg-blue-700"
            }`}
          >
            Reset & Scan Again
          </button>
        </div>

        {loading && (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <p className="text-blue-600 mt-4 font-semibold">
              Verifying certificate...
            </p>
          </div>
        )}

        {error && !loading && (
          <div className="bg-red-100 text-red-700 p-4 rounded text-center font-semibold">
            ❌ {error}
          </div>
        )}

        {result && !loading && !result.valid && (
          <div className="bg-red-100 text-red-700 p-4 rounded text-center">
            <div className="text-4xl mb-2">❌</div>
            <p className="font-bold text-lg">Certificate is Invalid</p>
          </div>
        )}

        {result?.valid && data && !loading && (
          <div className="bg-green-100 p-4 rounded">
            <h3 className="text-green-800 font-bold text-lg mb-3 flex items-center gap-2">
              <span className="text-2xl">✅</span>
              Certificate Verified
            </h3>

            <div className="space-y-2 text-gray-800">
              <p>
                <strong>Name:</strong> {data.userData.name}
              </p>

              <p>
                <strong>Vaccine:</strong> {data.vaccineName}
              </p>

              <p>
                <strong>Date:</strong>{" "}
                {new Date(data.slotDate).toDateString()}
              </p>

              <p>
                <strong>Time:</strong> {data.slotTime}
              </p>

              <p>
                <strong>Hospital:</strong> {data.hospitalData.name}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default QrVerify;