import React, { useState } from 'react';
import axios from 'axios';
import '../styles/Authenticate.css';
import { notify } from '../utils/notify';

const Profile = () => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [username, setUsername] = useState(localStorage.getItem('username') || '');
  const email = localStorage.getItem('email');
  const usertype = localStorage.getItem('userType');

  const changePassword = async (event) => {
    event.preventDefault();
    if (newPassword !== confirmation) return notify('New passwords do not match', 'error');
    try {
      await axios.put('http://localhost:6001/change-password', { currentPassword, newPassword });
      notify('Password changed successfully', 'success');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmation('');
    } catch (error) {
      notify(error.response?.data?.message || 'Unable to change password', 'error');
    }
  };

  const updateName = async (event) => {
    event.preventDefault();
    try {
      const response = await axios.put('http://localhost:6001/profile', { username });
      localStorage.setItem('username', response.data.username);
      setUsername(response.data.username);
      notify('Name updated successfully', 'success');
    } catch (error) {
      notify(error.response?.data?.message || 'Unable to update name', 'error');
    }
  };


  return <div className="profile-page">
    <section className="profile-card">
      <p className="profile-eyebrow">Account profile</p>
      <form className="profile-name-form" onSubmit={updateName}><input value={username} onChange={(event) => setUsername(event.target.value)} aria-label="Name" /><button className="btn btn-light" type="submit">Save name</button></form>
      <p className="profile-email">{email}</p>
      <span className="profile-role">{usertype}</span>
    </section>
    <form className="authForm profile-password-form" onSubmit={changePassword}>
      <h2>Change password</h2>
      <div className="form-floating mb-3 authFormInputs"><input type="password" className="form-control" placeholder="Current password" value={currentPassword} onChange={(event) => setCurrentPassword(event.target.value)} required /><label>Current password</label></div>
      <div className="form-floating mb-3 authFormInputs"><input type="password" className="form-control" placeholder="New password" value={newPassword} onChange={(event) => setNewPassword(event.target.value)} minLength="6" required /><label>New password</label></div>
      <div className="form-floating mb-3 authFormInputs"><input type="password" className="form-control" placeholder="Confirm password" value={confirmation} onChange={(event) => setConfirmation(event.target.value)} minLength="6" required /><label>Confirm password</label></div>
      <button type="submit" className="btn btn-primary">Update password</button>
    </form>
  </div>;
};

export default Profile;
