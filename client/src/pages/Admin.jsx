import React, { useEffect, useState } from 'react'
import '../styles/Admin.css'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import { notify } from '../utils/notify';

const Admin = () => {

  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [userCount, setUserCount] = useState(0);
  const [bookingCount, setbookingCount] = useState(0);
  const [flightsCount, setFlightsCount] = useState(0);


  useEffect(()=>{

    fetchData();
  }, [])

  const fetchData = async () =>{
    try {
      const usersRes = await axios.get('http://localhost:6001/fetch-users');
      setUserCount(usersRes.data.length - 1);
      setUsers(usersRes.data.filter(user => user.approval === 'not-approved'));
    } catch (err) {
      console.error(err);
    }
    try {
      const bookingsRes = await axios.get('http://localhost:6001/fetch-bookings');
      setbookingCount(bookingsRes.data.length);
    } catch (err) {
      console.error(err);
    }
    try {
      const flightsRes = await axios.get('http://localhost:6001/fetch-flights');
      setFlightsCount(flightsRes.data.length);
    } catch (err) {
      console.error(err);
    }
  }



  const approveRequest = async (id) =>{
      try{
          await axios.post('http://localhost:6001/approve-operator', {id});
          notify("Operator approved!!", 'success');
          fetchData();
      }catch(err){
          notify(err.response?.data?.message || 'Unable to approve operator', 'error');
      }
  }

  const rejectRequest = async (id) =>{
    try{
      await axios.post('http://localhost:6001/reject-operator', {id});
      notify("Operator rejected!!", 'success');
      fetchData();
    }catch(err){
      notify(err.response?.data?.message || 'Unable to reject operator', 'error');
    }
  }

  return (
    <>

      <div className="admin-page">

        <div className="admin-page-cards">

            <div className="card admin-card users-card">
                <h4>Users</h4>
                <p> {userCount} </p>
                <button className="btn btn-primary" onClick={()=>navigate('/all-users')}>View all</button>
            </div>

            <div className="card admin-card transactions-card">
                <h4>Bookings</h4>
                <p> {bookingCount} </p>
                <button className="btn btn-primary" onClick={()=>navigate('/all-bookings')}>View all</button>
            </div>

            <div className="card admin-card deposits-card">
                <h4>Flights</h4>
                <p> {flightsCount} </p>
                <button className="btn btn-primary" onClick={()=>navigate('/all-flights')}>View all</button>
            </div>


        </div>

        <div className="admin-requests-container">

            <h3>New Operator Applications</h3>

            <div className="admin-requests">

              {
                users.length === 0 ?
                  <p>No new requests..</p>
                :
                  <>
                  {users.map((user)=>{
                    return(
                      <div className="admin-request" key={user._id}>
                        <span><b>Operator name: </b> {user.username}</span>
                        <span><b>Operator email: </b> {user.email}</span>
                        <div className="admin-request-actions">
                          <button className='btn btn-primary' onClick={()=> approveRequest(user._id)}>Approve</button>
                          <button className='btn btn-danger' onClick={()=> rejectRequest(user._id)}>Reject</button>
                        </div>
                      </div>
                    )
                  })}
                  </>

              }


            </div>

        </div>

    </div>
    
    </>
  )
}

export default Admin