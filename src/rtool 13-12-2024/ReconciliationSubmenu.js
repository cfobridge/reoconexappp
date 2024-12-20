import React, { useState, useEffect, useRef } from 'react';
import { AiOutlineDown, AiOutlineUp } from 'react-icons/ai';
import './ReconciliationSubmenu.css';
import { useAuth } from '../auth/AuthContext';

const ReconciliationSubmenu = ({ onSelectReconciliation }) => {
  const { user, token } = useAuth();
  const [reconciliationIds, setReconciliationIds] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [activeReconciliation, setActiveReconciliation] = useState(null);
  const [error, setError] = useState(null);

  const submenuRef = useRef(null);
  const fetchIntervalRef = useRef(null);

  // Function to fetch reconciliation IDs
  const fetchReconciliationIds = async () => {
    if (!user || !token) {
      console.warn('User or token not available.');
      return;
    }

    try {
      const response = await fetch(
        `http://34.70.96.246:8080/api/reconciliation/user_reconciliation_requests?user_id=${user.id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch reconciliation data.');
      }

      const data = await response.json();
      // Update reconciliation IDs only if there's new data
      if (JSON.stringify(data.reconciliationIds) !== JSON.stringify(reconciliationIds)) {
        setReconciliationIds(data.reconciliationIds || []);
      }
    } catch (err) {
      console.error('Error fetching reconciliation IDs:', err);
      setError('Unable to fetch reconciliations. Please try again later.');
    }
  };

  useEffect(() => {
    // Start interval to fetch reconciliation IDs every 1 second
    fetchReconciliationIds(); // Initial fetch
    fetchIntervalRef.current = setInterval(fetchReconciliationIds, 1000);

    return () => {
      // Clear interval on component unmount
      clearInterval(fetchIntervalRef.current);
    };
  }, [user, token, reconciliationIds]);

  // Handler to toggle submenu visibility
  const toggleSubmenu = () => {
    setIsOpen((prev) => !prev);
  };

  // Handler for clicking on a reconciliation ID
  const handleReconciliationClick = (id) => {
    setActiveReconciliation(id);
    onSelectReconciliation(id); // Trigger the callback
    console.log(`Selected Reconciliation ID: ${id}`);
  };

  // Click outside to close submenu
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (submenuRef.current && !submenuRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Keyboard navigation
  const handleKeyDown = (e, id) => {
    if (e.key === 'Enter') {
      handleReconciliationClick(id);
    }
  };

  return (
    <div className="reconciliation-submenu" ref={submenuRef}>
      <div
        className="submenu-header"
        onClick={toggleSubmenu}
        role="button"
        aria-haspopup="true"
        aria-expanded={isOpen}
        tabIndex="0"
        onKeyPress={(e) => {
          if (e.key === 'Enter') toggleSubmenu();
        }}
      >
        <span>Reconciliations</span>
        {isOpen ? (
          <AiOutlineUp className="submenu-icon" />
        ) : (
          <AiOutlineDown className="submenu-icon" />
        )}
      </div>
      {isOpen && (
        <div className="submenu-content" role="menu">
          {error && <div className="submenu-item error">{error}</div>}
          {reconciliationIds.length > 0 ? (
            reconciliationIds.map((id) => (
              <div
                key={id}
                className={`submenu-item ${
                  activeReconciliation === id ? 'active' : ''
                }`}
                onClick={() => handleReconciliationClick(id)}
                role="menuitem"
                tabIndex="0"
                onKeyDown={(e) => handleKeyDown(e, id)}
              >
                {id}
              </div>
            ))
          ) : (
            <div className="submenu-item">No Reconciliations</div>
          )}
        </div>
      )}
    </div>
  );
};

export default ReconciliationSubmenu;
