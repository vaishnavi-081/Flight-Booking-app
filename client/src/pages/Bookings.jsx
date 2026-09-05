import React, { useEffect, useState } from 'react'
import '../styles/Bookings.css'
import axios from 'axios';
import BookingTable from '../components/BookingTable';
import { notify } from '../utils/notify';

const Bookings = () => {


  const [bookings, setBookings] = useState([]);

  const userId = localStorage.getItem('userId');

  useEffect(()=>{
    fetchBookings();
  }, [])

  const fetchBookings = async () =>{
    try {
      const response = await axios.get('http://localhost:6001/fetch-bookings');
      setBookings(response.data.reverse());
    } catch (error) {
      notify(error.response?.data?.message || 'Unable to fetch bookings', 'error');
    }
  }
  const cancelTicket = async (id) =>{
    try {
      await axios.put(`http://localhost:6001/cancel-ticket/${id}`);
      notify("Ticket cancelled!!", 'success');
      fetchBookings();
    } catch (error) {
      notify(error.response?.data?.message || 'Unable to cancel ticket', 'error');
    }
  }

  const modifyBooking = async (id, values) => {
    try {
      await axios.put(`http://localhost:6001/modify-booking/${id}`, values);
      notify("Booking modified successfully!", 'success');
      fetchBookings();
    } catch (error) {
      notify(error.response?.data?.message || 'Unable to modify booking', 'error');
    }
  }

  return (
    <div className="user-bookingsPage">
      <h1>Bookings</h1>

      <BookingTable bookings={bookings.filter(booking=> booking.user === userId)} onCancel={cancelTicket} onModify={modifyBooking} />
    </div>
  )
}

export default Bookings