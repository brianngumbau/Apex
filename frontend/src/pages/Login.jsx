import React from "react";
import { useForm } from "react-hook-form";
import { Link } from "react-router-dom";
import axios from "axios";

function Login() {
    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm();

    const onSubmit = async (data) => {
        console.log("Login Data:", data);
        //send login request to backend logic API
        try {
            const response = await axios.post("http://127.0.0.1:5000/login", {
                email: data.email,
                password: data.password,
            });
            console.log("Login success:", response.data);
            alert("Login successful!");

            // TODO: redirect to dashboard/home

            // Store token in localStorage (optional)
            localStorage.setItem("token", response.data.access_token);
            localStorage.setItem("user_id", response.data.user_id);

        } catch (error) {
            if (error.message) {
                console.error("Login error:", error.response.data);
                alert(error.response.data.error || "Login failed");
            } else {
                console.error("Error:", error.message);
                alert("An error occurred. Try again later.");
            }
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
            <div className="w-full max-w-md bg-white shadow-md rounded-lg p-6">
                <h2 className="text-2xl font-bold mb-6 text-center text-blue-600">Login to MAZIWA</h2>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    {/* Email Input */}
                    <div>
                        <label className="block text-gray-700 font-medium mb-1">Email</label>
                        <input
                            type="email"
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
                        className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition"
                    >
                        Login
                    </button>
                </form>

                {/* Register Redirect */}
                <div className="text-center mt-4">
                    <p className="text-sm">
                        Don't have an account?{" "}
                        <Link to="/register" className="text-blue-600 hover:underline">
                            Register
                        </Link>
                    </p>
                </div>

                {/* Social Auth buttons */}
                <div className="flex flex-col gap-3 mt-4">
                    {/* Google Login */}
                    <button
                    onClick={handleGoogleLogin}
                    className="w-full overflow-hidden rounded border border-gray-300 shadow hover:shadow-md transition">
                        <img
                        src="/google.logo.png"
                        alt="Continue with Google"
                        className="w-full h-10 object-contain"/>
                    </button>
                    
                    {/* Facebook Login */}
                    <button
                    onClick={handleFacebookLogin}
                    className="w-full overflow-hidden rounded shadow hover:shadow-md transition">
                        <img
                        src="/facebook.logo.png"
                        alt="Continue with Facebook"
                        className="w-full h-10 object-contain"/>
                    </button>
                </div>
            </div>
        </div>
    );
}

export default Login;