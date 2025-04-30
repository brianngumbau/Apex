import {NavLink} from "react-router-dom";

const NavLinks = () => {
    return (
      <>
      <NavLink to="/pages/Dashboard.jsx">Home</NavLink>
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