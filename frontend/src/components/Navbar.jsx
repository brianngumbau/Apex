import React from 'react';
import {NavLink} from "react-router-dom";
import ReactDOM from 'react-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faHouse  } from '@fortawesome/free-solid-svg-icons'
import { faUser } from '@fortawesome/free-solid-svg-icons'
import { faUsers } from '@fortawesome/free-solid-svg-icons'
import { faGear } from '@fortawesome/free-solid-svg-icons'

const NavLinks = () => {
  return (
    <>
    <NavLink to="/pages/Dashboard.jsx"> <FontAwesomeIcon icon={faHouse} /> </NavLink>
    <NavLink to="/pages/Group.jsx"><FontAwesomeIcon icon={faUsers} /> </NavLink>
    <NavLink to="/pages/Profile.jsx"><FontAwesomeIcon icon={faUser} /> </NavLink>
    </>
  )
    
    
  
};

const Nav = () => {
return (
  <nav className="w-1/3 fixed bottom-0 bg-white border-t border-gray-200 shadow-lg inline-flex justify-between items-center p-4">
  <div className="flex justify-between">
  <NavLinks />
  </div>
  </nav>

)
 
}

export default Nav;