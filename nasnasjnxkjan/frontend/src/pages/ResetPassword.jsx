import React, { useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { useParams, useNavigate } from "react-router-dom";

const ResetPassword = () => {
  const { token } = useParams();
  const navigate = useNavigate();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      return toast.error("Passwords do not match");
    }

    try {
      setLoading(true);

      const { data } = await axios.post(
        `https://vaxtrack-alpha.vercel.app/api/public/reset-password/${token}`,
        { password }
      );

      if (data.success) {
        toast.success("Password reset successful");
        navigate("/login");
      } else {
        toast.error(data.message || "Reset failed");
      }

    } catch (error) {
      toast.error(
        error.response?.data?.message || "Something went wrong"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center">
      <form
        onSubmit={handleSubmit}
        className="flex flex-col gap-3 m-auto items-start p-8 min-w-[340px] sm:min-w-96 border rounded-xl text-[#5E5E5E] text-sm shadow-lg"
      >
        <p className="text-2xl font-semibold">Reset Password</p>
        <p>Enter your new password below</p>

        <div className="w-full">
          <p>New Password</p>
          <input
            type="password"
            className="border border-[#DADADA] rounded w-full p-2 mt-1"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>

        <div className="w-full">
          <p>Confirm Password</p>
          <input
            type="password"
            className="border border-[#DADADA] rounded w-full p-2 mt-1"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />
        </div>

        <button
          disabled={loading}
          className="bg-primary text-white w-full py-2 my-2 rounded-md text-base"
        >
          {loading ? "Updating..." : "Reset Password"}
        </button>
      </form>
    </div>
  );
};

export default ResetPassword;
