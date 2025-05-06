import React from 'react';
import {NavLink} from "react-router-dom";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faHouse  } from '@fortawesome/free-solid-svg-icons'
import { faUser } from '@fortawesome/free-solid-svg-icons'
import { faUsers } from '@fortawesome/free-solid-svg-icons'

const NavLinks = () => {
  return (
    <>
    <NavLink to="/profile"  className={({ isActive }) => isActive ? "text-gray-500" : ""}> <FontAwesomeIcon icon={faUser} /> </NavLink>
    <NavLink to="/dashboard"  className={({ isActive }) => isActive ? "text-gray-500" : ""}><FontAwesomeIcon icon={faHouse} /> </NavLink>
    <NavLink to="/group"  className={({ isActive }) => isActive ? "text-gray-500" : ""}><FontAwesomeIcon icon={faUsers} /> </NavLink>
    </>
  )
    
    
  
};

const Nav = () => {
return (
 
  <div className='fixed bottom-0 left-0 z-50 w-full h-16 bg-white border-t border-gray-200 dark:bg-gray-700 dark:border-gray-600'>
      <nav className="md:max-lg bg-white border-t border-gray-200 shadow-lg justify-between p-3">
          <div className="flex justify-between">
          <NavLinks />
          </div>
      </nav>
  </div>



)
 
}

export default Nav;