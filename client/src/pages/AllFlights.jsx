import axios from 'axios';
import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom';
import '../styles/AllFlights.css';
import { notify } from '../utils/notify';

const AllFlights = () => {
    const [flights, setFlights] = useState([]);
    const navigate = useNavigate();
    const isAdmin = localStorage.getItem('userType') === 'admin';
    const [newFlight, setNewFlight] = useState({ flightName: '', flightId: '', origin: '', destination: '', departureTime: '', arrivalTime: '', scheduleDate: '', basePrice: '', totalSeats: '' });
  
    
    const fetchFlights = async () =>{
      try {
        const response = await axios.get('http://localhost:6001/fetch-flights');
        setFlights(response.data);
      } catch (error) {
        notify(error.response?.data?.message || 'Unable to fetch flights', 'error');
      }
    }

    const updateNewFlight = (field, value) => setNewFlight({ ...newFlight, [field]: value });

    const addFlight = async () => {
      try {
        await axios.post('http://localhost:6001/admin/flights', newFlight);
        setNewFlight({ flightName: '', flightId: '', origin: '', destination: '', departureTime: '', arrivalTime: '', scheduleDate: '', basePrice: '', totalSeats: '' });
        fetchFlights();
      } catch (error) {
        notify(error.response?.data?.message || 'Unable to add flight', 'error');
      }
    };

    const deleteFlight = async (id) => {
      if (!window.confirm('Delete this flight and its bookings?')) return;
      try {
        await axios.delete(`http://localhost:6001/admin/flights/${id}`);
        fetchFlights();
      } catch (error) {
        notify(error.response?.data?.message || 'Unable to delete flight', 'error');
      }
    };
      
      useEffect(()=>{
        fetchFlights();
      }, [])
      
    return (
      <div className="allFlightsPage">
        <h1>All Flights</h1>
        {isAdmin && <div className="admin-add-form flight-add-form">
          {['flightName', 'flightId', 'origin', 'destination', 'departureTime', 'arrivalTime', 'scheduleDate', 'basePrice', 'totalSeats'].map((field) => (
            <input key={field} type={field.includes('Time') ? 'time' : ['basePrice', 'totalSeats'].includes(field) ? 'number' : 'text'} placeholder={field} value={newFlight[field]} onChange={(e) => updateNewFlight(field, e.target.value)} />
          ))}
          <button className="btn btn-primary" onClick={addFlight}>Add flight</button>
        </div>}
  
        <div className="table-wrap">
          <table className="data-table">
            <thead><tr><th>Flight ID</th><th>Flight name</th><th>Origin</th><th>Departure</th><th>Destination</th><th>Arrival</th><th>Price</th><th>Seats</th>{isAdmin && <th>Actions</th>}</tr></thead>
            <tbody>{flights.map((flight) => <tr key={flight._id}>
              <td>{flight.flightId}</td><td>{flight.flightName}</td><td>{flight.origin}</td><td>{flight.departureTime}</td>
              <td>{flight.destination}</td><td>{flight.arrivalTime}</td><td>{flight.basePrice}</td><td>{flight.totalSeats}</td>
              {isAdmin && <td className="table-actions"><button className="btn btn-primary" onClick={() => navigate(`/edit-flight/${flight._id}`)}>Edit</button><button className="btn btn-danger" onClick={() => deleteFlight(flight._id)}>Delete</button></td>}
            </tr>)}</tbody>
          </table>
        </div>
      </div>
    )
  }

export default AllFlights