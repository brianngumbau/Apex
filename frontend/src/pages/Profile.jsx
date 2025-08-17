import React, { useState, useContext } from "react";
import Nav from "../components/Navbar";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUser } from "@fortawesome/free-solid-svg-icons";
import ProminentAppBar from "../components/header";
import { ThemeContext } from "../context/ThemeContext"; // import

export default function Profile() {
  const [name, setName] = useState("");
  const [profession, setProfession] = useState("");
  const [avatar, setAvatar] = useState(null);
  const { darkMode, toggleTheme } = useContext(ThemeContext);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setAvatar(URL.createObjectURL(file));
    }
  };

  return (
    <>
      <ProminentAppBar />
      <div className="container text-center mt-10">
        {/* Avatar Upload */}
        <label className="cursor-pointer inline-block bg-gray-200 dark:bg-gray-800 rounded-full p-6 transition duration-300">
          {avatar ? (
            <img
              src={avatar}
              alt="Avatar"
              className="w-24 h-24 rounded-full object-cover border-4 border-gray-300 dark:border-gray-700"
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
            className="block mx-auto border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-200 p-2 rounded mb-2 text-center w-64 transition duration-300"
            placeholder="Enter name"
          />
          <input
            type="text"
            value={profession}
            onChange={(e) => setProfession(e.target.value)}
            className="block mx-auto border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-200 p-2 rounded text-center w-64 transition duration-300"
            placeholder="Enter profession"
          />
        </div>

        {/* Dark Mode Toggle */}
        <div className="mt-6 flex justify-center items-center space-x-3">
          <span className="text-gray-600 dark:text-gray-300">Light</span>
          <button
            onClick={toggleTheme}
            className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors duration-300 ${
              darkMode ? "bg-gray-700" : "bg-gray-300"
            }`}
          >
            <div
              className={`w-4 h-4 bg-white rounded-full shadow-md transform transition-transform duration-300 ${
                darkMode ? "translate-x-6" : "translate-x-0"
              }`}
            />
          </button>
          <span className="text-gray-600 dark:text-gray-300">Dark</span>
        </div>
      </div>

      <Nav />
    </>
  );
}
