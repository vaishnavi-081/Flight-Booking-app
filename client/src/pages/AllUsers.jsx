import React, { useEffect, useState } from 'react'
import Navbar from '../components/Navbar'
import '../styles/allUsers.css'
import axios from 'axios';
import { notify } from '../utils/notify';

const AllUsers = () => {

  const [users, setUsers] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editRole, setEditRole] = useState('customer');
  const [editApproval, setEditApproval] = useState('approved');
  const [newUser, setNewUser] = useState({ username: '', email: '', usertype: 'customer', password: '' });
  const isAdmin = localStorage.getItem('userType') === 'admin';

  useEffect(()=>{
    fetchUsers();
  },[]);

  const fetchUsers = async () =>{
    try {
      const response = await axios.get('http://localhost:6001/fetch-users');
      setUsers(response.data);
    } catch (error) {
      notify(error.response?.data?.message || 'Unable to fetch users', 'error');
    }
  }

  const startEditing = (user) => {
    setEditingId(user._id);
    setEditName(user.username);
    setEditEmail(user.email);
    setEditRole(user.usertype);
    setEditApproval(user.approval || 'approved');
  };

  const updateUser = async (id) => {
    try {
      await axios.put(`http://localhost:6001/update-user/${id}`, {
        username: editName,
        email: editEmail,
        usertype: editRole,
        approval: editApproval
      });
      notify("User updated successfully!", 'success');
      setEditingId(null);
      fetchUsers();
    } catch (error) {
      notify(error.response?.data?.message || 'Unable to update user', 'error');
    }
  };

  const approveOperator = async (id) => {
    try {
      await axios.post('http://localhost:6001/approve-operator', { id });
      notify("Operator approved!", 'success');
      fetchUsers();
    } catch (err) {
      notify(err.response?.data?.message || 'Unable to approve operator', 'error');
    }
  };

  const rejectOperator = async (id) => {
    try {
      await axios.post('http://localhost:6001/reject-operator', { id });
      notify("Operator rejected!", 'success');
      fetchUsers();
    } catch (err) {
      notify(err.response?.data?.message || 'Unable to reject operator', 'error');
    }
  };

  const addUser = async () => {
    try {
      await axios.post('http://localhost:6001/admin/users', newUser);
      notify("User created successfully!", 'success');
      setNewUser({ username: '', email: '', usertype: 'customer', password: '' });
      fetchUsers();
    } catch (error) {
      notify(error.response?.data?.message || 'Unable to add user', 'error');
    }
  };

  const deleteUser = async (id) => {
    if (!window.confirm('Delete this user and their bookings?')) return;
    try {
      await axios.delete(`http://localhost:6001/admin/users/${id}`);
      notify("User deleted successfully!", 'success');
      fetchUsers();
    } catch (error) {
      notify(error.response?.data?.message || 'Unable to delete user', 'error');
    }
  };

  const renderUser = (user) => (
    <tr key={user._id}>
      <td className="id-cell">{user._id}</td>
      <td>
        {editingId === user._id ? (
          <input value={editName} onChange={(e) => setEditName(e.target.value)} aria-label="Name" style={{ padding: '4px' }} />
        ) : (
          <strong>{user.username}</strong>
        )}
      </td>
      <td>
        {editingId === user._id ? (
          <input type="email" value={editEmail} onChange={(e) => setEditEmail(e.target.value)} aria-label="Email" style={{ padding: '4px' }} />
        ) : (
          user.email
        )}
      </td>
      <td>
        {editingId === user._id ? (
          <select value={editRole} onChange={(e) => setEditRole(e.target.value)} style={{ padding: '4px' }}>
            <option value="customer">Customer</option>
            <option value="flight-operator">Flight Operator</option>
            <option value="admin">Administrator</option>
          </select>
        ) : (
          <span style={{ textTransform: 'capitalize' }}>{user.usertype}</span>
        )}
      </td>
      {user.usertype === 'flight-operator' && (
        <td>
          {editingId === user._id ? (
            <select value={editApproval} onChange={(e) => setEditApproval(e.target.value)} style={{ padding: '4px' }}>
              <option value="approved">Approved</option>
              <option value="not-approved">Pending</option>
              <option value="rejected">Rejected</option>
            </select>
          ) : (
            <span className={`status status-${user.approval === 'approved' ? 'confirmed' : user.approval === 'rejected' ? 'cancelled' : 'pending'}`}>
              {user.approval === 'approved' ? 'Approved' : user.approval === 'rejected' ? 'Rejected' : 'Pending Approval'}
            </span>
          )}
        </td>
      )}
      {isAdmin && (
        <td className="table-actions">
          {editingId === user._id ? (
            <>
              <button className="btn btn-primary" onClick={() => updateUser(user._id)}>Save</button>
              <button className="btn btn-secondary" onClick={() => setEditingId(null)}>Cancel</button>
            </>
          ) : (
            <>
              {user.usertype === 'flight-operator' && user.approval === 'not-approved' && (
                <>
                  <button className="btn btn-primary" onClick={() => approveOperator(user._id)}>Approve</button>
                  <button className="btn btn-danger" onClick={() => rejectOperator(user._id)}>Reject</button>
                </>
              )}
              <button className="btn btn-primary" onClick={() => startEditing(user)}>Edit</button>
              <button className="btn btn-danger" onClick={() => deleteUser(user._id)}>Delete</button>
            </>
          )}
        </td>
      )}
    </tr>
  );

  return (
    <>
      <Navbar />

      <div className="all-users-page">
        <h2>User Management</h2>
        {isAdmin && <div className="admin-add-form">
          <input placeholder="Name / Airline Name" value={newUser.username} onChange={(e) => setNewUser({ ...newUser, username: e.target.value })} />
          <input type="email" placeholder="Email" value={newUser.email} onChange={(e) => setNewUser({ ...newUser, email: e.target.value })} />
          <select value={newUser.usertype} onChange={(e) => setNewUser({ ...newUser, usertype: e.target.value })}>
            <option value="customer">Customer</option>
            <option value="flight-operator">Flight Operator</option>
            <option value="admin">Administrator</option>
          </select>
          <input type="password" placeholder="Password" value={newUser.password} onChange={(e) => setNewUser({ ...newUser, password: e.target.value })} />
          <button className="btn btn-primary" onClick={addUser}>Add user</button>
        </div>}

        <h3 style={{ marginTop: '24px', color: '#1e293b' }}>Customers</h3>
        <div className="table-wrap">
          <table className="data-table">
            <thead><tr><th>User ID</th><th>Name</th><th>Email</th><th>Role</th>{isAdmin && <th>Actions</th>}</tr></thead>
            <tbody>{users.filter(user=> user.usertype === 'customer').map(renderUser)}</tbody>
          </table>
        </div>

        <h3 style={{ marginTop: '24px', color: '#1e293b' }}>Flight Operators</h3>
        <div className="table-wrap">
          <table className="data-table">
            <thead><tr><th>User ID</th><th>Airline Name</th><th>Email</th><th>Role</th><th>Approval Status</th>{isAdmin && <th>Actions</th>}</tr></thead>
            <tbody>{users.filter(user=> user.usertype === 'flight-operator').map(renderUser)}</tbody>
          </table>
        </div>  

        <h3 style={{ marginTop: '24px', color: '#1e293b' }}>Administrators</h3>
        <div className="table-wrap">
          <table className="data-table">
            <thead><tr><th>User ID</th><th>Name</th><th>Email</th><th>Role</th>{isAdmin && <th>Actions</th>}</tr></thead>
            <tbody>{users.filter(user=> user.usertype === 'admin').map(renderUser)}</tbody>
          </table>
        </div>  

    </div>
    </>
  )
}

export default AllUsers