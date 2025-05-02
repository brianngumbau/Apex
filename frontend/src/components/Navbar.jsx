import React from 'react';
import {NavLink} from "react-router-dom";
import house from "../assets/house-solid.svg";

const NavLinks = () => {
  return (
    <>
    <NavLink to="/pages/Dashboard.jsx"> <img src="../assets/house-solid.svg" alt='Home'/> </NavLink>
    <NavLink to="/pages/Group.jsx">Group</NavLink>
    <NavLink to="/pages/Profile.jsx">Profile</NavLink>
    </>
  )
    
    
  
};

const Nav = () => {
return (
  <nav className="w-1/3">
  <div className="flex justify-between">
  <NavLinks />
  </div>
  </nav>

)
 
}

export default Nav;