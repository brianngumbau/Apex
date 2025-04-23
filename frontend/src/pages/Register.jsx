import React from "react";
import { useForm } from "react-hook-form";
import { Link } from "react-router-dom";
import axios from "axios";
import { useNavigate } from "react-router-dom";

function Register() {
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm();

  const navigate = useNavigate();

  const onSubmit = async (data) => {
    console.log("Registration Data:", data);
    //Send POST request to /register endpoint using Axios
    try {
      const payload = {
        name: data.name,
        email: data.email,
        phone: data.phone,
        password: data.password,
      };

      const response = await axios.post("http://127.0.0.1:5000/register", payload);
      console.log("Registration successful:", response.data);
      alert("Account created successfully! You can now log in.")
      navigate("/login");
    } catch (error) {
      console.error("Full error object:", error)
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
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="w-full max-w-md bg-white shadow-md rounded-lg p-6">
        <h2 className="text-2xl font-bold mb-6 text-center text-blue-600">Create an Account</h2>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Name */}
          <div>
            <label className="block text-gray-700 font-medium mb-1">Full Name</label>
            <input
              type="text"
              {...register("name", { required: "Name is required" })}
              className="w-full px-4 py-2 border rounded focus:outline-none focus:ring focus:ring-blue-200"
            />
            {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>}
          </div>

          {/* Email */}
          <div>
            <label className="block text-gray-700 font-medium mb-1">Email</label>
            <input
              type="email"
              {...register("email", { required: "Email is required" })}
              className="w-full px-4 py-2 border rounded focus:outline-none focus:ring focus:ring-blue-200"
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
              className="w-full px-4 py-2 border rounded focus:outline-none focus:ring focus:ring-blue-200"
            />
            {errors.phone && <p className="text-red-500 text-sm mt-1">{errors.phone.message}</p>}
          </div>

          {/* Password */}
          <div>
            <label className="block text-gray-700 font-medium mb-1">Password</label>
            <input
              type="password"
              {...register("password", { required: "Password is required" })}
              className="w-full px-4 py-2 border rounded focus:outline-none focus:ring focus:ring-blue-200"
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
              className="w-full px-4 py-2 border rounded focus:outline-none focus:ring focus:ring-blue-200"
            />
            {errors.confirmPassword && (
              <p className="text-red-500 text-sm mt-1">{errors.confirmPassword.message}</p>
            )}
          </div>

          {/* Terms & Conditions */}
          <div className="flex items-center">
            <input
              type="checkbox"
              {...register("terms", { required: "You must accept terms" })}
              className="mr-2"
            />
            <label className="text-sm text-gray-700">
              I agree to the <span className="text-blue-600 hover:underline">Terms and Conditions</span>
            </label>
          </div>
          {errors.terms && <p className="text-red-500 text-sm mt-1">{errors.terms.message}</p>}

          {/* Register Button */}
          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition"
          >
            Register
          </button>
        </form>

        {/* Login redirect */}
        <div className="text-center mt-4">
          <p className="text-sm">
            Already have an account?{" "}
            <Link to="/login" className="text-blue-600 hover:underline">
              Login
            </Link>
          </p>
        </div>

        {/* Social Auth */}
        <div className="flex flex-col gap-3 mt-4">
          <button onClick={handleGoogleSignup}>
            <img src="/google.logo.png" alt="Google Sign Up" className="w-full" />
          </button>
          <button onClick={handleFacebookSignup}>
            <img src="/facebook.logo.png" alt="Facebook Sign Up" className="w-full" />
          </button>
        </div>
      </div>
    </div>
  );
}

export default Register;
