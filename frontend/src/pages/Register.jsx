import React from "react";
import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";

function Register() {
  const navigate = useNavigate();
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm();

  const onSubmit = async (data) => {
    console.log("Registration Data:", data);
    try {
      const payload = {
        name: data.name,
        email: data.email,
        phone: data.phone,
        password: data.password,
      };

      const response = await axios.post("http://127.0.0.1:5000/register", payload);
      console.log("Registration successful:", response.data);
      alert("Account created successfully! You can now log in.");
      navigate("/login");
    } catch (error) {
      console.error("Full error object:", error);
      if (error.response) {
        console.error("Registration error:", error.response.data);
        alert(error.response.data.error || "Registration failed");
      } else {
        console.error("Error:", error.message);
        alert("An error occurred. Try again later.");
      }
    }
  };

  const handleGoogleSignup = () => {
    console.log("Google signup clicked");
  };

  const handleFacebookSignup = () => {
    console.log("Facebook signup clicked");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md bg-white shadow-lg rounded-2xl p-8">
        {/* Heading */}
        <h2 className="text-3xl font-bold text-center text-blue-600">Create an Account</h2>
        <p className="text-gray-500 text-center mt-2 text-sm">
          Join us and manage your contributions easily.
        </p>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-5">
          {/* Full Name */}
          <div>
            <label className="block text-gray-700 font-medium mb-1">Full Name</label>
            <input
              type="text"
              {...register("name", { required: "Name is required" })}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-200"
            />
            {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>}
          </div>

          {/* Email */}
          <div>
            <label className="block text-gray-700 font-medium mb-1">Email</label>
            <input
              type="email"
              {...register("email", { required: "Email is required" })}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-200"
            />
            {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>}
          </div>

          {/* Phone */}
          <div>
            <label className="block text-gray-700 font-medium mb-1">Phone Number</label>
            <input
              type="text"
              {...register("phone", {
                required: "Phone number is required",
                pattern: {
                  value: /^2547\d{8}$/,
                  message: "Use format: 2547xxxxxxxx",
                },
              })}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-200"
            />
            {errors.phone && <p className="text-red-500 text-sm mt-1">{errors.phone.message}</p>}
          </div>

          {/* Password */}
          <div>
            <label className="block text-gray-700 font-medium mb-1">Password</label>
            <input
              type="password"
              {...register("password", { required: "Password is required" })}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-200"
            />
            {errors.password && <p className="text-red-500 text-sm mt-1">{errors.password.message}</p>}
          </div>

          {/* Confirm Password */}
          <div>
            <label className="block text-gray-700 font-medium mb-1">Confirm Password</label>
            <input
              type="password"
              {...register("confirmPassword", {
                validate: (value) =>
                  value === watch("password") || "Passwords do not match",
              })}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-200"
            />
            {errors.confirmPassword && (
              <p className="text-red-500 text-sm mt-1">{errors.confirmPassword.message}</p>
            )}
          </div>

          {/* Terms */}
          <div className="flex items-center">
            <input
              type="checkbox"
              {...register("terms", { required: "You must accept terms" })}
              className="mr-2"
            />
            <label className="text-sm text-gray-700">
              I agree to the{" "}
              <span className="text-blue-600 hover:underline">Terms and Conditions</span>
            </label>
          </div>
          {errors.terms && <p className="text-red-500 text-sm mt-1">{errors.terms.message}</p>}

          {/* Register Button */}
          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition"
          >
            Register
          </button>
        </form>

        {/* Divider */}
        <div className="flex items-center my-6">
          <div className="flex-grow border-t border-gray-300"></div>
          <span className="px-3 text-gray-500 text-sm">Or sign up with</span>
          <div className="flex-grow border-t border-gray-300"></div>
        </div>

        {/* Social Auth */}
        <div className="flex flex-col gap-3">
          <button
            onClick={handleGoogleSignup}
            className="w-full border rounded-lg py-2 hover:bg-gray-50 flex items-center justify-center"
          >
            <img src="/google.logo.png" alt="Google" className="w-5 h-5 mr-2" />
            <span className="text-gray-700 text-sm font-medium">Sign up with Google</span>
          </button>
          <button
            onClick={handleFacebookSignup}
            className="w-full border rounded-lg py-2 hover:bg-gray-50 flex items-center justify-center"
          >
            <img src="/facebook.logo.png" alt="Facebook" className="w-5 h-5 mr-2" />
            <span className="text-gray-700 text-sm font-medium">Sign up with Facebook</span>
          </button>
        </div>

        {/* Login redirect */}
        <p className="text-center text-sm text-gray-600 mt-6">
          Already have an account?{" "}
          <Link to="/login" className="text-blue-600 hover:underline">
            Login
          </Link>
        </p>
      </div>
    </div>
  );
}

export default Register;