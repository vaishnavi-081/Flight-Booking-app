import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { notify } from '../utils/notify';

const Register = ({ setIsLogin }) => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('customer');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!username.trim() || !email.trim() || !password) {
      return notify('Please fill in all fields', 'error');
    }
    setIsSubmitting(true);
    try {
      const res = await axios.post('http://localhost:6001/register', {
        username: username.trim(),
        email: email.trim().toLowerCase(),
        password,
        usertype: role
      });

      if (res.data.usertype === 'flight-operator') {
        notify('Operator application submitted! Awaiting admin approval before you can log in.', 'info');
        setIsLogin(true);
      } else {
        localStorage.setItem('userId', res.data._id);
        localStorage.setItem('userType', res.data.usertype);
        localStorage.setItem('username', res.data.username);
        localStorage.setItem('email', res.data.email);
        localStorage.setItem('token', res.data.token);
        axios.defaults.headers.common.Authorization = `Bearer ${res.data.token}`;
        notify('Account created successfully!', 'success');
        navigate('/');
      }
    } catch (err) {
      notify(err.response?.data?.message || 'Registration failed', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form className="authForm" onSubmit={handleRegister}>
      <h2>Register</h2>
      <div className="form-floating mb-3 authFormInputs">
        <input
          type="text"
          className="form-control"
          id="floatingInput"
          placeholder="username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
        />
        <label htmlFor="floatingInput">Username / Airline Name</label>
      </div>
      <div className="form-floating mb-3 authFormInputs">
        <input
          type="email"
          className="form-control"
          id="floatingEmail"
          placeholder="name@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <label htmlFor="floatingEmail">Email address</label>
      </div>
      <div className="form-floating mb-3 authFormInputs">
        <select
          className="form-select"
          id="floatingUserType"
          value={role}
          onChange={(e) => setRole(e.target.value)}
          style={{ paddingTop: '1.625rem', paddingBottom: '0.625rem' }}
        >
          <option value="customer">Customer (Book flights)</option>
          <option value="flight-operator">Flight Operator (Airline / Service Provider)</option>
        </select>
        <label htmlFor="floatingUserType">Register As</label>
      </div>
      <div className="form-floating mb-3 authFormInputs">
        <input
          type="password"
          className="form-control"
          id="floatingPassword"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          minLength="6"
          required
        />
        <label htmlFor="floatingPassword">Password</label>
      </div>

      <button className="btn btn-primary" type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Signing up...' : 'Sign up'}
      </button>
      <p>
        Already registered? <span onClick={() => setIsLogin(true)}>Login</span>
      </p>
    </form>
  );
};

export default Register;