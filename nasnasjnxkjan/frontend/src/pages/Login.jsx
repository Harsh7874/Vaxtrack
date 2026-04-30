import React, { useContext, useEffect, useState } from 'react'
import { AppContext } from '../context/AppContext'
import axios from 'axios'
import { toast } from 'react-toastify'
import { useNavigate } from 'react-router-dom'
import { GoogleLogin } from "@react-oauth/google";

const Login = () => {

  const [state, setState] = useState('Sign Up')

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false);
  
  // 🔹 NEW STATES FOR FORGOT PASSWORD MODAL
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [sendingReset, setSendingReset] = useState(false);

  const navigate = useNavigate()
  const { backendUrl, token, setToken } = useContext(AppContext)

  // 🔹 UPDATED FORGOT PASSWORD HANDLER
  const handleForgotPassword = async (e) => {
    e.preventDefault();
    
    if (!forgotEmail) {
      return toast.error("Please enter your email");
    }

    setSendingReset(true);
    try {
      const { data } = await axios.post(
        "https://vaxtrack-alpha.vercel.app/api/public/reset-password-email",
        { email: forgotEmail }
      );

      if (data.success) {
        toast.success("Password reset link sent to your email");
        setShowForgotPassword(false);
        setForgotEmail('');
      } else {
        toast.error(data.message || "Something went wrong");
      }

    } catch (error) {
      toast.error("Failed to send reset email");
    } finally {
      setSendingReset(false);
    }
  };

  const onSubmitHandler = async (event) => {
    event.preventDefault();
    setLoading(true);

    try {
      if (state === 'Sign Up') {
        const { data } = await axios.post(
          backendUrl + '/api/user/register',
          { name, email, password }
        );

        if (data.success) {
          localStorage.setItem('token', data.token);
          setToken(data.token);
        } else {
          toast.error(data.message);
        }
      } else {
        const { data } = await axios.post(
          backendUrl + '/api/user/login',
          { email, password }
        );

        if (data.success) {
          localStorage.setItem('token', data.token);
          setToken(data.token);
        } else {
          toast.error(data.message);
        }
      }
    } catch (error) {
      toast.error("Something went wrong");
    } finally {
      setLoading(false);
    }
  };


  useEffect(() => {
    if (token) {
      navigate('/')
    }
  }, [token])

  return (
    <>
      <form onSubmit={onSubmitHandler} className='min-h-[80vh] flex items-center'>
        <div className='flex flex-col gap-3 m-auto items-start p-8 min-w-[340px] sm:min-w-96 border rounded-xl text-[#5E5E5E] text-sm shadow-lg'>

          <p className='text-2xl font-semibold'>
            {state === 'Sign Up' ? 'Create Account' : 'Login'}
          </p>

          <p>Please {state === 'Sign Up' ? 'sign up' : 'log in'} to book appointment</p>

          {state === 'Sign Up' &&
            <div className='w-full '>
              <p>Full Name</p>
              <input
                onChange={(e) => setName(e.target.value)}
                value={name}
                className='border border-[#DADADA] rounded w-full p-2 mt-1'
                type="text"
                required
              />
            </div>
          }

          <div className='w-full '>
            <p>Email</p>
            <input
              onChange={(e) => setEmail(e.target.value)}
              value={email}
              className='border border-[#DADADA] rounded w-full p-2 mt-1'
              type="email"
              required
            />
          </div>

          <div className='w-full '>
            <p>Password</p>
            <input
              onChange={(e) => setPassword(e.target.value)}
              value={password}
              className='border border-[#DADADA] rounded w-full p-2 mt-1'
              type="password"
              required
            />
          </div>

          {/* 🔹 UPDATED FORGOT PASSWORD TRIGGER */}
          {state === 'Login' && (
            <p
              onClick={() => setShowForgotPassword(true)}
              className='text-primary text-xs self-end cursor-pointer hover:underline'
            >
              Forgot Password?
            </p>
          )}

          <button
            disabled={loading}
            className={`bg-primary text-white w-full py-2 my-2 rounded-md text-base
      ${loading ? 'opacity-60 cursor-not-allowed' : ''}`}
          >
            {loading
              ? 'Processing...'
              : state === 'Sign Up'
                ? 'Create account'
                : 'Login'}
          </button>

          <div className="flex items-center w-full my-3">
            <div className="flex-1 h-px bg-gray-300"></div>
            <span className="px-3 text-xs text-gray-500 font-medium">OR</span>
            <div className="flex-1 h-px bg-gray-300"></div>
          </div>
          <div className="w-full mt-2">
            <GoogleLogin
              disabled={loading}
              text={state === 'Sign Up' ? 'signup_with' : 'signin_with'}
              onSuccess={async (credentialResponse) => {
                setLoading(true);
                try {
                  const { data } = await axios.post(
                    backendUrl + "/api/user/google-auth",
                    { token: credentialResponse.credential }
                  );

                  if (data.success) {
                    localStorage.setItem("token", data.token);
                    setToken(data.token);
                    toast.success(
                      state === 'Sign Up'
                        ? "Signed up with Google"
                        : "Logged in with Google"
                    );
                  } else {
                    toast.error(data.message);
                  }
                } catch (error) {
                  toast.error("Google login failed");
                } finally {
                  setLoading(false);
                }
              }}
              onError={() => {
                toast.error("Google login failed");
                setLoading(false);
              }}
            />
          </div>

          {state === 'Sign Up'
            ? <p>Already have an account? <span onClick={() => setState('Login')} className='text-primary underline cursor-pointer'>Login here</span></p>
            : <p>Create an new account? <span onClick={() => setState('Sign Up')} className='text-primary underline cursor-pointer'>Click here</span></p>
          }

        </div>
      </form>

      {/* 🔹 FORGOT PASSWORD MODAL */}
      {showForgotPassword && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-8 min-w-[340px] sm:min-w-96 shadow-2xl">
            <h2 className="text-2xl font-semibold text-[#5E5E5E] mb-2">Reset Password</h2>
            <p className="text-sm text-[#5E5E5E] mb-6">Enter your email to receive a password reset link</p>
            
            <form onSubmit={handleForgotPassword}>
              <div className='w-full mb-4'>
                <p className="text-sm text-[#5E5E5E] mb-1">Email</p>
                <input
                  onChange={(e) => setForgotEmail(e.target.value)}
                  value={forgotEmail}
                  className='border border-[#DADADA] rounded w-full p-2'
                  type="email"
                  placeholder="Enter your email"
                  required
                />
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowForgotPassword(false);
                    setForgotEmail('');
                  }}
                  className="flex-1 border border-gray-300 text-gray-700 py-2 rounded-md text-base hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={sendingReset}
                  className={`flex-1 bg-primary text-white py-2 rounded-md text-base
                    ${sendingReset ? 'opacity-60 cursor-not-allowed' : ''}`}
                >
                  {sendingReset ? 'Sending...' : 'Send Reset Link'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}

export default Login