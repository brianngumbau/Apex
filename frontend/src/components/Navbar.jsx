import React from 'react';
import { NavLink } from "react-router-dom";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faHouse, faUser, faUsers } from '@fortawesome/free-solid-svg-icons';

const NavLinks = () => {
  const linkClasses = ({ isActive }) =>
    `flex flex-col items-center text-sm transition-colors duration-300 
    ${isActive ? "text-black-500" : "text-gray-500"} 
    hover:text-black-400`;

  return (
    <>
      <NavLink to="/profile" className={linkClasses} aria-label="Profile">
        <FontAwesomeIcon icon={faUser} size="lg" />
        <span className="mt-1">Profile</span>
      </NavLink>

      <NavLink to="/dashboard" className={linkClasses} aria-label="Dashboard">
        <FontAwesomeIcon icon={faHouse} size="lg" />
        <span className="mt-1">Home</span>
      </NavLink>

      <NavLink to="/group" className={linkClasses} aria-label="Groups">
        <FontAwesomeIcon icon={faUsers} size="lg" />
        <span className="mt-1">Groups</span>
      </NavLink>
    </>
  );
};

const Nav = () => {
  return (
    <div className="fixed bottom-0 left-0 z-50 w-full h-16 bg-white border-t border-gray-200 shadow-lg">
      <nav className="flex justify-around items-center h-full">
        <NavLinks />
      </nav>
    </div>
  );
};

export default Nav;
