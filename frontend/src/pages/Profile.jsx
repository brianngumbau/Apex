import React, { useState } from 'react';
import Nav from '../components/Navbar';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUser } from '@fortawesome/free-solid-svg-icons';

export default function Profile() {
  const [name, setName] = useState("");
  const [profession, setProfession] = useState("");
  const [avatar, setAvatar] = useState(null); // stores uploaded image preview URL

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setAvatar(URL.createObjectURL(file));
    }
  };

  return (
    <>
      <div className="container text-center mt-10">
        <label className="cursor-pointer inline-block bg-gray-200 rounded-full p-6">
          {avatar ? (
            <img
              src={avatar}
              alt="Avatar"
              className="w-24 h-24 rounded-full object-cover"
            />
          ) : (
            <FontAwesomeIcon
              icon={faUser}
              className="text-gray-700"
              style={{ width: '100px', height: '100px' }}
            />
          )}
          <input
            type="file"
            accept="image/*"
            onChange={handleImageChange}
            className="hidden"
          />
        </label>

        <div className="mt-8">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="block mx-auto border p-2 rounded mb-2 text-center"
            placeholder="Enter name"
          />
          <input
            type="text"
            value={profession}
            onChange={(e) => setProfession(e.target.value)}
            className="block mx-auto border p-2 rounded text-center"
            placeholder="Enter profession"
          />
        </div>
      </div>

      <Nav />
    </>
  );
}
