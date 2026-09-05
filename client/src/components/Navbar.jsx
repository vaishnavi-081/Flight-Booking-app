import React, { useContext } from 'react';
import '../styles/Navbar.css';
import { useNavigate } from 'react-router-dom';
import { GeneralContext } from '../context/GeneralContext';
import logo from '../assets/logo.png'; // Import the logo

const Navbar = () => {
  const navigate = useNavigate();
  const usertype = localStorage.getItem('userType');
  const { logout } = useContext(GeneralContext);

  return (
    <>
      <div className="navbar">
        {!usertype ? (
          <>
            <div className="navbar-header" onClick={() => navigate('/')} role="button" tabIndex="0">
              <img src={logo} alt="Logo" className="navbar-logo" />
              <h3>SKY Furaito</h3>
            </div>
            <div className="nav-options">
              <p onClick={() => navigate('/')}>Home</p>
              <p onClick={() => navigate('/auth')}>Login</p>
            </div>
          </>
        ) : (
          <>
            {usertype === 'customer' ? (
              <>
                <div className="navbar-header" onClick={() => navigate('/')} role="button" tabIndex="0">
                  <img src={logo} alt="Logo" className="navbar-logo" />
                  <h3>SKY Furaito</h3>
                </div>
                <div className="nav-options">
                  <p onClick={() => navigate('/')}>Home</p>
                  <p onClick={() => navigate('/bookings')}>Bookings</p>
                  <p onClick={() => navigate('/profile')}>Profile</p>
                  <p onClick={logout}>Logout</p>
                </div>
              </>
            ) : usertype === 'admin' ? (
              <>
                <div className="navbar-header" onClick={() => navigate('/')} role="button" tabIndex="0">
                  <img src={logo} alt="Logo" className="navbar-logo" />
                  <h3>SKY Furaito (Admin)</h3>
                </div>
                <div className="nav-options">
                  <p onClick={() => navigate('/admin')}>Home</p>
                  <p onClick={() => navigate('/all-users')}>Users</p>
                  <p onClick={() => navigate('/all-bookings')}>Bookings</p>
                  <p onClick={() => navigate('/all-flights')}>Flights</p>
                  <p onClick={() => navigate('/profile')}>Profile</p>
                  <p onClick={logout}>Logout</p>
                </div>
              </>
            ) : usertype === 'flight-operator' ? (
              <>
                <div className="navbar-header" onClick={() => navigate('/')} role="button" tabIndex="0">
                  <img src={logo} alt="Logo" className="navbar-logo" />
                  <h3>SKY Furaito (Operator)</h3>
                </div>
                <div className="nav-options">
                  <p onClick={() => navigate('/flight-admin')}>Home</p>
                  <p onClick={() => navigate('/flight-bookings')}>Bookings</p>
                  <p onClick={() => navigate('/flights')}>Flights</p>
                  <p onClick={() => navigate('/new-flight')}>Add Flight</p>
                  <p onClick={() => navigate('/profile')}>Profile</p>
                  <p onClick={logout}>Logout</p>
                </div>
              </>
            ) : (
              ''
            )}
          </>
        )}
      </div>
    </>
  );
};

export default Navbar;
