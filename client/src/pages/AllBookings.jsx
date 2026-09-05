import axios from 'axios';
import React, { useEffect, useState } from 'react'
import '../styles/Bookings.css';
import BookingTable from '../components/BookingTable';
import { notify } from '../utils/notify';

const AllBookings = () => {

  const [bookings, setBookings] = useState([]);

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
      await axios.put(`http://localhost:6001/admin/bookings/${id}`, values);
      notify("Booking modified successfully!", 'success');
      fetchBookings();
      return true;
    } catch (error) {
      notify(error.response?.data?.message || 'Unable to modify booking', 'error');
      return false;
    }
  }

  return (
    <div className="user-bookingsPage">
      <h1>Bookings</h1>

      <BookingTable bookings={bookings} onCancel={cancelTicket} onModify={modifyBooking} showContact />
    </div>
  )
}

export default AllBookings