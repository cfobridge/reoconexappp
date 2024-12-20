// Slidebar.js
import React from 'react';
import { BsCurrencyExchange } from 'react-icons/bs';
import { TbHomeStats, TbCloudUpload, TbChevronDown, TbChevronUp } from 'react-icons/tb';
import { LuCombine } from 'react-icons/lu';
import { IoMdOptions } from "react-icons/io";
import LogoutButton from '../auth/logout'; 
import { MdHotelClass } from "react-icons/md";
import './Slidebar.css';

const Slidebar = () => {
  const [activeMenu, setActiveMenu] = React.useState('Dashboard');
  const [isThemeOpen, setIsThemeOpen] = React.useState(false); // State for Theme submenu

  const handleMenuClick = (menu) => {
    setActiveMenu(menu);
  };

  const toggleThemeSubmenu = () => {
    setIsThemeOpen(!isThemeOpen);
    setActiveMenu('Theme'); // Set active menu to Theme when toggling
  };

  return (
    <nav className="sidebar">
      <div className="slidebar-header">
        <div className="logo">
          <BsCurrencyExchange className="logo-icon" />
          <span className="sidebar-title">Reconx</span>
        </div>
      </div>

      <ul className="menu-links">
        <li className={`nav-link ${activeMenu === 'Dashboard' ? 'active' : ''}`}>
          <a href="#" onClick={() => handleMenuClick('Dashboard')} className="sidebar-item">
            <TbHomeStats className="icon" />
            <span>Dashboard</span>
          </a>
        </li>
        <li className={`nav-link ${activeMenu === 'Tool' ? 'active' : ''}`}>
          <a href="/rtool" onClick={() => handleMenuClick('Tool')} className="sidebar-item">
            <LuCombine className="icon" />
            <span>Reconcile Tool</span>
          </a>
        </li>
        
        <li className={`nav-link ${activeMenu === 'Uploads' ? 'active' : ''}`}>
          <a href="/files" onClick={() => handleMenuClick('Uploads')} className="sidebar-item">
            <TbCloudUpload className="icon" />
            <span>Uploads</span>
          </a>
        </li>
        <li className="nav-link">
          <LogoutButton className="sidebar-item" onClick={() => handleMenuClick('Logout')} />
        </li>
      </ul>
    </nav>
  );
};

export default Slidebar;
