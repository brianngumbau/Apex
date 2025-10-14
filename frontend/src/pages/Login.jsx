import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { motion } from "framer-motion";

function Login() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      const response = await axios.post(
        "https://maziwa-90gd.onrender.com/login",
        {
          email: data.email.trim(),
          password: data.password,
        }
      );

      const { access_token, user } = response.data;

      // check if user is verified
      if (!user.is_verified) {
        alert(
          "⚠️ Your account is not verified. Please check your email for the verification link."
        );
        setLoading(false);
        return;
      }

      // Store token and user info
      localStorage.setItem("token", access_token);
      localStorage.setItem("user", JSON.stringify(user));
      localStorage.setItem("is_admin", user.is_admin ? "true" : "false");

      alert("✅ Login successful!");

      // redirect to dashboard/home
      navigate("/dashboard");
    } catch (error) {
      if (error.response) {
        console.error("Login error:", error.response.data);
        const msg =
          error.response.data.error || error.response.data.message || "Login failed";
        alert(msg);
      } else {
        console.error("Error:", error.message);
        alert("An error occurred. Try again later.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    console.log("Google login clicked");
    // TODO: implement Google login
  };

  const handleFacebookLogin = () => {
    console.log("Facebook login clicked");
    // TODO: implement Facebook login
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <motion.div
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-md bg-white shadow-md rounded-lg p-6"
      >
        <h2 className="text-2xl font-bold mb-6 text-center text-black">
          Log in
        </h2>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Email Input */}
          <div>
            <label className="block text-gray-700 font-medium mb-1">Email</label>
            <input
              type="email"
              placeholder="Email address"
              {...register("email", { required: "Email is required" })}
              className="w-full px-4 py-2 border rounded focus:outline-none focus:ring focus:ring-blue-200"
            />
            {errors.email && (
              <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>
            )}
          </div>

          {/* Password Input */}
          <div>
            <label className="block text-gray-700 font-medium mb-1">Password</label>
            <input
              type="password"
              placeholder="••••••••"
              {...register("password", { required: "Password is required" })}
              className="w-full px-4 py-2 border rounded focus:outline-none focus:ring focus:ring-blue-200"
            />
            {errors.password && (
              <p className="text-red-500 text-sm mt-1">{errors.password.message}</p>
            )}
          </div>

          {/* Login Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full px-5 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition"
          >
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>

        {/* Register Redirect */}
        <div className="text-center mt-4">
          <p className="text-sm">
            Don't have an account?{" "}
            <Link to="/register" className="text-blue-400 hover:underline">
              Register
            </Link>
          </p>
        </div>

        {/* Social Auth buttons */}
        <div className="flex flex-col gap-3 mt-4">
          <button
            onClick={handleGoogleLogin}
            className="w-full overflow-hidden rounded border border-gray-300 shadow hover:shadow-md transition"
          >
            <img
              src="/google.logo.png"
              alt="Continue with Google"
              className="w-full h-10 object-contain"
            />
          </button>

          <button
            onClick={handleFacebookLogin}
            className="w-full overflow-hidden rounded shadow hover:shadow-md transition"
          >
            <img
              src="/facebook.logo.png"
              alt="Continue with Facebook"
              className="w-full h-10 object-contain"
            />
          </button>
        </div>
      </motion.div>
    </div>
  );
}

export default Login;