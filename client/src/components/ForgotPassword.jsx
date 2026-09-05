import React, { useState } from 'react';
import axios from 'axios';
import { notify } from '../utils/notify';

const ForgotPassword = ({ onBack }) => {
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');

  const [isSendingOtp, setIsSendingOtp] = useState(false);

  const requestOtp = async () => {
    if (!email || !email.trim()) {
      return notify('Please enter your registered email address first.', 'error');
    }
    setIsSendingOtp(true);
    try {
      const res = await axios.post('http://localhost:6001/forgot-password', { email });
      notify(res.data.message || 'OTP sent to your registered email.', 'success');
    } catch (error) {
      notify(error.response?.data?.message || 'Unable to send OTP. Make sure the email is registered.', 'error');
    } finally {
      setIsSendingOtp(false);
    }
  };

  const resetPassword = async (event) => {
    event.preventDefault();
    if (newPassword !== confirmation) return notify('New passwords do not match', 'error');
    try {
      await axios.post('http://localhost:6001/forgot-password/confirm', { email, otp, newPassword });
      notify('Password reset successfully. You can now sign in.', 'success');
      onBack();
    } catch (error) {
      notify(error.response?.data?.message || 'Unable to reset password', 'error');
    }
  };

  return <form className="authForm" onSubmit={resetPassword}>
    <h2>Create new password</h2>
    <p className="form-helper">Request an OTP, then enter it here within 10 minutes.</p>
    <div className="form-floating mb-3 authFormInputs">
      <input className="form-control" type="email" placeholder="Email address" value={email} onChange={(event) => setEmail(event.target.value)} required />
      <label>Email address</label>
    </div>
    <>
      <button type="button" className="text-button" disabled={isSendingOtp} onClick={requestOtp}>
        {isSendingOtp ? 'Sending OTP...' : 'Send OTP'}
      </button>
      <div className="form-floating mb-3 authFormInputs">
        <input className="form-control" type="text" inputMode="numeric" maxLength="6" placeholder="OTP" value={otp} onChange={(event) => setOtp(event.target.value)} required />
        <label>OTP</label>
      </div>
      <div className="form-floating mb-3 authFormInputs">
        <input className="form-control" type="password" placeholder="New password" value={newPassword} onChange={(event) => setNewPassword(event.target.value)} minLength="6" required />
        <label>New password</label>
      </div>
      <div className="form-floating mb-3 authFormInputs">
        <input className="form-control" type="password" placeholder="Confirm password" value={confirmation} onChange={(event) => setConfirmation(event.target.value)} minLength="6" required />
        <label>Confirm password</label>
      </div>
    </>
    <button type="submit" className="btn btn-primary">Reset password</button>
    <button type="button" className="text-button" onClick={onBack}>Back to login</button>
  </form>;
};

export default ForgotPassword;
