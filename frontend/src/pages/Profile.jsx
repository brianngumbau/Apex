import React, { useState, useContext, useEffect } from "react";
import Nav from "../components/Navbar";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUser } from "@fortawesome/free-solid-svg-icons";
import ProminentAppBar from "../components/header";
import { ThemeContext } from "../context/ThemeContext"; 

// Skeleton Loader Component
const ProfileLoading = () => {
  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-start py-12 px-6 animate-pulse">
      {/* Profile Picture */}
      <div className="w-28 h-28 rounded-full bg-gray-300 mb-6"></div>

      {/* Name Placeholder */}
      <div className="h-6 bg-gray-300 rounded w-40 mb-2"></div>
      <div className="h-4 bg-gray-300 rounded w-24 mb-8"></div>

      {/* Stats Section */}
      <div className="flex gap-6 mb-10">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="w-24 h-16 bg-gray-200 rounded-lg shadow-sm"
          ></div>
        ))}
      </div>

      {/* Info Cards */}
      <div className="w-full max-w-xl space-y-6">
        {[1, 2].map((i) => (
          <div
            key={i}
            className="p-6 border border-gray-200 rounded-xl shadow-md bg-gray-100"
          >
            <div className="h-5 bg-gray-300 rounded w-1/3 mb-3"></div>
            <div className="h-4 bg-gray-300 rounded w-2/3 mb-2"></div>
            <div className="h-4 bg-gray-300 rounded w-1/2"></div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default function Profile() {
  const [name, setName] = useState("");
  const [profession, setProfession] = useState("");
  const [avatar, setAvatar] = useState(null);
  const { darkMode, toggleTheme } = useContext(ThemeContext);

  const [loading, setLoading] = useState(true);

  // Simulate API fetch (replace with real API later)
  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 2000); 
    return () => clearTimeout(timer);
  }, []);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setAvatar(URL.createObjectURL(file));
    }
  };

  if (loading) {
    return <ProfileLoading />;
  }

  return (
    <>
      <ProminentAppBar />
      <div className="container text-center mt-10">
        {/* Avatar Upload */}
        <label className="cursor-pointer inline-block bg-gray-200 rounded-full p-6 transition duration-300">
          {avatar ? (
            <img
              src={avatar}
              alt="Avatar"
              className="w-24 h-24 rounded-full object-cover border-4 border-gray-800 dark:border-gray-700"
            />
          ) : (
            <FontAwesomeIcon
              icon={faUser}
              className="text-gray-700 dark:text-gray-300"
              style={{ width: "100px", height: "100px" }}
            />
          )}
          <input
            type="file"
            accept="image/*"
            onChange={handleImageChange}
            className="hidden"
          />
        </label>

        {/* Name & Profession */}
        <div className="mt-8">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="block mx-auto border border-gray-300 bg-white text-gray-800 dark:text-gray-900 p-2 rounded mb-2 text-center w-64 transition duration-300"
            placeholder="Enter name"
          />
          <input
            type="text"
            value={profession}
            onChange={(e) => setProfession(e.target.value)}
            className="block mx-auto border border-gray-300 bg-white text-gray-800 dark:text-gray-900 p-2 rounded text-center w-64 transition duration-300"
            placeholder="Enter profession"
          />
        </div>
      </div>

      <Nav />
    </>
  );
}
