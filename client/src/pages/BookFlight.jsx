import React, { useContext, useEffect, useState } from 'react'
import '../styles/BookFlight.css'
import { GeneralContext } from '../context/GeneralContext';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import { notify } from '../utils/notify';

const BookFlight = () => {
    const {id} = useParams();

    const [flightName, setFlightName] = useState('');
    const [flightId, setFlightId] = useState('');
    const [basePrice, setBasePrice] = useState(0);
    const [StartCity, setStartCity] = useState('');
    const [destinationCity, setDestinationCity] = useState('');
    const [startTime, setStartTime] = useState();
  
  
    useEffect(()=>{
      fetchFlightData();
    }, [])
  
    const fetchFlightData = async () =>{
      await axios.get(`http://localhost:6001/fetch-flight/${id}`).then(
        (response) =>{
          setFlightName(response.data.flightName);
          setFlightId(response.data.flightId);
          setBasePrice(response.data.basePrice);
          setStartCity(response.data.origin);
          setDestinationCity(response.data.destination);
          setStartTime(response.data.departureTime);
        }
      )
    }
  
  
    const [email, setEmail] = useState('');
    const [mobile, setMobile] = useState('');
    const [coachType, setCoachType] = useState('');
    const {ticketBookingDate} = useContext(GeneralContext);
    const [journeyDate, setJourneyDate] = useState(ticketBookingDate);
  
    const [numberOfPassengers, setNumberOfPassengers] = useState(0);
    const [passengerDetails, setPassengerDetails] = useState([]);
  
    const [totalPrice, setTotalPrice] = useState(0);
    const [otpStep, setOtpStep] = useState(false);
    const [otp, setOtp] = useState('');
    const [bookingId, setBookingId] = useState('');
    const [otpLoading, setOtpLoading] = useState(false);
    const price = {'economy': 1, 'premium-economy': 2, 'business': 3, 'first-class': 4}
    
  
    const handlePassengerChange = (event) => {
      const value = parseInt(event.target.value);
      setNumberOfPassengers(value);
      };
  
    const handlePassengerDetailsChange = (index, key, value) => {
      setPassengerDetails((prevDetails) => {
        const updatedDetails = [...prevDetails];
        updatedDetails[index] = { ...updatedDetails[index], [key]: value };
        return updatedDetails;
      });
      
    };
  
    useEffect(()=>{
      if(coachType && basePrice && numberOfPassengers){
        const multiplier = price[coachType] || 1;
        setTotalPrice(multiplier * basePrice * numberOfPassengers);
      }
    }, [numberOfPassengers, coachType, basePrice]);
  
  
    const navigate = useNavigate();
  
  
    const getTodayLocalDateStr = () => {
      const d = new Date();
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    const isFlightInPast = () => {
      if (!journeyDate || !startTime) return false;
      const [year, month, day] = String(journeyDate).split('-').map(Number);
      if (!year || !month || !day) return false;
      const [hours, minutes] = String(startTime).split(':').map(Number);
      const flightDepDateTime = new Date(year, month - 1, day, hours || 0, minutes || 0, 0, 0);
      return flightDepDateTime <= new Date();
    };

    const buildBookingInputs = () => ({
      user: localStorage.getItem('userId'), flight: id, flightName, flightId,
      departure: StartCity, journeyTime: startTime, destination: destinationCity,
      email: email.trim(), mobile, passengers: passengerDetails, totalPrice,
      journeyDate, seatClass: coachType
    });

    const requestBookingOtp = async () => {
      if (isFlightInPast()) return notify('Cannot book flight: The selected departure date and time has already passed.', 'error');
      if (!email.trim()) return notify('Please enter your email address.', 'error');
      if (!mobile.trim()) return notify('Please enter your mobile number.', 'error');
      if (!numberOfPassengers || passengerDetails.length !== numberOfPassengers || passengerDetails.some(p => !p?.name?.trim() || p?.age === '')) return notify('Please enter all passenger details.', 'error');
      if (!coachType) return notify('Please select a seat class.', 'error');

      setOtpLoading(true);
      try {
        const response = await axios.post('http://localhost:6001/book-ticket/request-otp', buildBookingInputs());
        setBookingId(response.data.bookingId);
        setOtpStep(true);
        notify(response.data.message || 'OTP sent to your email.', 'success');
      } catch (err) {
        notify(err.response?.data?.message || 'Could not send OTP.', 'error');
      } finally {
        setOtpLoading(false);
      }
    };

    const verifyBookingOtp = async () => {
      if (!otp.trim()) return notify('Please enter the OTP.', 'error');
      setOtpLoading(true);
      try {
        await axios.post('http://localhost:6001/book-ticket/verify-otp', { bookingId, otp });
        notify('Booking successful', 'success');
        navigate('/bookings');
      } catch (err) {
        notify(err.response?.data?.message || 'OTP verification failed.', 'error');
      } finally {
        setOtpLoading(false);
      }
    };

    return (
      <div className='BookFlightPage'>
  
        <div className="BookingFlightPageContainer">
          <h2>Book ticket</h2>
        <span>
          <p><b>Flight Name: </b> {flightName}</p>
          <p><b>Flight No: </b> {flightId}</p>
        </span>
        <span>
          <p><b>Base price: </b> {basePrice}</p>
        </span>
        
        <span>
          <div className="form-floating mb-3">
                  <input type="email" className="form-control" id="floatingInputemail" value={email} onChange={(e)=> setEmail(e.target.value)} />
                  <label htmlFor="floatingInputemail">Email</label>
            </div>
            <div className="form-floating mb-3">
                  <input type="text" className="form-control" id="floatingInputmobile" value={mobile} onChange={(e)=> setMobile(e.target.value)} />
                  <label htmlFor="floatingInputmobile">Mobile</label>
            </div>
        </span>
        <span className='span3'>
          <div className="no-of-passengers">
            <div className="form-floating mb-3">
                  <input type="number" className="form-control" id="floatingInputreturnDate" value={numberOfPassengers} onChange={handlePassengerChange} />
                  <label htmlFor="floatingInputreturnDate">No of passengers</label>
            </div>
          </div>
          <div className="form-floating mb-3">
                  <input type="date" className="form-control" id="floatingInputreturnDate" value={journeyDate} min={getTodayLocalDateStr()} onChange={(e)=>setJourneyDate(e.target.value)} />
                  <label htmlFor="floatingInputreturnDate">Journey date</label>
          </div>
          <div className="form-floating">
                        <select className="form-select form-select-sm mb-3" defaultValue="" aria-label=".form-select-sm example" value={coachType} onChange={(e) => setCoachType(e.target.value) }>
                          <option value="" disabled>Select</option>
                          <option value="economy">Economy class</option>
                          <option value="premium-economy">Premium Economy</option>
                          <option value="business">Business class</option>
                          <option value="first-class">First class</option>
                        </select>
                        <label htmlFor="floatingSelect">Seat Class</label>
                      </div>
  
        </span>
  
        <div className="new-passengers">
            {Array.from({ length: numberOfPassengers }).map((_, index) => (
              <div className='new-passenger' key={index}>
                <h4>Passenger {index + 1}</h4>
                <div className="new-passenger-inputs">
  
                    <div className="form-floating mb-3">
                      <input type="text" className="form-control" id="floatingInputpassengerName" value={passengerDetails[index]?.name || ''} onChange={(event) => handlePassengerDetailsChange(index, 'name', event.target.value) } />
                      <label htmlFor="floatingInputpassengerName">Name</label>
                    </div>
                    <div className="form-floating mb-3">
                          <input type="number" className="form-control" id="floatingInputpassengerAge" value={passengerDetails[index]?.age || ''} onChange={(event) => handlePassengerDetailsChange(index, 'age', event.target.value) } />
                          <label htmlFor="floatingInputpassengerAge">Age</label>
                    </div>
                    
  
                </div>
              </div>
            ))}
  
        </div>
        
        <h6><b>Total price</b>: {totalPrice}</h6>
        {!otpStep ? (
          <button className='btn btn-primary' onClick={requestBookingOtp} disabled={otpLoading}>
            {otpLoading ? 'Sending OTP...' : 'Book now'}
          </button>
        ) : (
          <div style={{ marginTop: '20px' }}>
            <p><b>Enter the OTP sent to {email}</b></p>
            <input type='text' className='form-control mb-3' maxLength='6' value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))} placeholder='Enter 6-digit OTP' />
            <button className='btn btn-primary' onClick={verifyBookingOtp} disabled={otpLoading}>
              {otpLoading ? 'Verifying...' : 'Verify OTP & Confirm Booking'}
            </button>
          </div>
        )}
      </div>
      </div>
    )
  }
export default BookFlight