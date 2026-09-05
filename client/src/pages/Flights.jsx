import axios from 'axios';
import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom';
import '../styles/AllFlights.css';
import { notify } from '../utils/notify';

const Flights = () => {
  const [userDetails, setUserDetails] = useState();

  useEffect(()=>{
    fetchUserData();
  }, [])

  const fetchUserData = async () =>{
    try{
      const id = localStorage.getItem('userId');
      await axios.get(`http://localhost:6001/fetch-user/${id}`).then(
        (response)=>{
          setUserDetails(response.data);
          console.log(response.data);
        }
      )

    }catch(err){

    }
  } 

  const [flights, setFlights] = useState([]);
  const navigate = useNavigate();

  
  const fetchFlights = async () =>{
    try {
      const response = await axios.get('http://localhost:6001/fetch-flights');
      setFlights(response.data);
    } catch (error) {
      notify(error.response?.data?.message || 'Unable to fetch flights', 'error');
    }
  }
    
    useEffect(()=>{
      fetchFlights();
    }, [])

  return (
    <div className="allFlightsPage">

      {userDetails ?
        <>
          {userDetails.approval === 'not-approved' ?
            <div className="notApproved-box">
              <h3>Approval Required!!</h3>
              <p>Your application is under processing. It needs an approval from the administrator. Kindly please be patience!!</p>
            </div>


          : userDetails.approval === 'approved' ?
            <>
              <h1>All Flights</h1>
  
              <div className="table-wrap">
                <table className="data-table">
                  <thead><tr><th>Flight ID</th><th>Flight name</th><th>Origin</th><th>Departure</th><th>Destination</th><th>Arrival</th><th>Price</th><th>Seats</th><th>Actions</th></tr></thead>
                  <tbody>{flights.filter(flight=> flight.flightName === localStorage.getItem('username')).map((flight) => <tr key={flight._id}>
                    <td>{flight.flightId}</td><td>{flight.flightName}</td><td>{flight.origin}</td><td>{flight.departureTime}</td>
                    <td>{flight.destination}</td><td>{flight.arrivalTime}</td><td>{flight.basePrice}</td><td>{flight.totalSeats}</td>
                    <td className="table-actions"><button className="btn btn-primary" onClick={()=> navigate(`/edit-flight/${flight._id}`)}>Edit</button></td>
                  </tr>)}</tbody>
                </table>
              </div>
            </>
          :
            ""
          }
        </>
      :
       ""
      }

    </div>
  )
}

export default Flights