import React, { useContext, useEffect, useState } from 'react'
import '../styles/LandingPage.css'
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { GeneralContext } from '../context/GeneralContext';

const LandingPage = () => {

  const [error, setError] = useState('');
  const [checkBox, setCheckBox] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);


  const [departure, setDeparture] = useState('');
  const [destination, setDestination] = useState('');
  const [departureDate, setDepartureDate] = useState('');
  const [returnDate, setReturnDate] = useState('');



  const navigate = useNavigate();
  const {setTicketBookingDate} = useContext(GeneralContext);
  const userId = localStorage.getItem('userId');

  useEffect(()=>{
    if(localStorage.getItem('userType') === 'admin'){
      navigate('/admin');
    } else if(localStorage.getItem('userType') === 'flight-operator'){
      navigate('/flight-admin');
    }
  }, [navigate]);

  const [Flights, setFlights] = useState([]);

  const parseLocalDate = (value) => {
    const [year, month, day] = String(value).split('-').map(Number);
    return new Date(year, month - 1, day);
  };

  const fetchFlights = async () =>{
    if(departure === "" || destination === "" || !departureDate || (checkBox && !returnDate)){
      setError("Please fill all the inputs");
      return;
    }
    if(departure === destination){
      setError("Departure and destination must be different");
      return;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const date1 = parseLocalDate(departureDate);
    const date2 = checkBox ? parseLocalDate(returnDate) : null;

    if(Number.isNaN(date1.getTime()) || date1 < today || (checkBox && (Number.isNaN(date2.getTime()) || date2 < date1))){
      setError("Please check the dates");
      return;
    }

    setError("");
    try{
      const response = await axios.get('http://localhost:6001/fetch-flights', {
        params: {
          origin: departure,
          destination,
          journeyDate: departureDate,
          ...(checkBox ? { roundTrip: 'true', returnDate } : {})
        }
      });
      setFlights(Array.isArray(response.data) ? response.data : []);
      setHasSearched(true);
    }catch(err){
      setFlights([]);
      setHasSearched(true);
      setError(err.response?.data?.message || "Unable to search flights. Make sure the server is running.");
    }
  }


  const getTodayLocalDateStr = () => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const isFlightInFuture = (flight, selectedDateStr) => {
    if (!selectedDateStr) return true;
    const [year, month, day] = String(selectedDateStr).split('-').map(Number);
    if (!year || !month || !day) return true;
    const depTime = flight.departureTime || '00:00';
    const [hours, minutes] = depTime.split(':').map(Number);
    const flightDepartureDateTime = new Date(year, month - 1, day, hours || 0, minutes || 0, 0, 0);
    return flightDepartureDateTime > new Date();
  };

  const handleTicketBooking = async (id, origin, destination) =>{
    if(userId){
        if(origin === departure){
          setTicketBookingDate(departureDate);
          navigate(`/book-flight/${id}`);
        } else if(destination === departure){
          setTicketBookingDate(returnDate);
          navigate(`/book-flight/${id}`);
        }
    }else{
      navigate('/auth');
    }
  }

  const matchingFlights = checkBox
    ? Flights.filter((flight) => {
        const isOutbound = flight.origin === departure && flight.destination === destination;
        const isReturn = flight.origin === destination && flight.destination === departure;
        if (isOutbound) return isFlightInFuture(flight, departureDate);
        if (isReturn) return isFlightInFuture(flight, returnDate);
        return false;
      })
    : Flights.filter((flight) => flight.origin === departure && flight.destination === destination && isFlightInFuture(flight, departureDate));



  return (
    <div className="landingPage">
        <div className="landingHero">


          <div className="landingHero-title">
            <h1 className="banner-h1">Take Off on an Unforgettable Flight Booking Journey!</h1>
            <p className="banner-p">Fulfill your travel dreams with extraordinary flight bookings that take you to unforgettable destinations and ignite your spirit of adventure like never before.</p>     
          </div>

          

          <div className="Flight-search-container input-container mb-4">

                  {/* <h3>Journey details</h3> */}
                  <div className="form-check form-switch">
                    <input className="form-check-input" type="checkbox" id="flexSwitchCheckDefault" value="" onChange={(e)=>setCheckBox(e.target.checked)} />
                    <label className="form-check-label" htmlFor="flexSwitchCheckDefault">Return journey</label>
                  </div>
                  <div className='Flight-search-container-body'>

                    <div className="form-floating">
                      <select className="form-select form-select-sm mb-3"  aria-label=".form-select-sm example" value={departure} onChange={(e)=>setDeparture(e.target.value)}>
                        <option value="" selected disabled>Select</option>
                        <option value="Chennai">Chennai</option>
                        <option value="Banglore">Banglore</option>
                        <option value="Hyderabad">Hyderabad</option>
                        <option value="Mumbai">Mumbai</option>
                        <option value="Indore">Indore</option>
                        <option value="Delhi">Delhi</option>
                        <option value="Pune">Pune</option>
                        <option value="Trivendrum">Trivendrum</option>
                        <option value="Bhopal">Bhopal</option>
                        <option value="Kolkata">Kolkata</option>
                        <option value="varanasi">varanasi</option>
                        <option value="Jaipur">Jaipur</option>
                      </select>
                      <label htmlFor="floatingSelect">Departure City</label>
                    </div>
                    <div className="form-floating">
                      <select className="form-select form-select-sm mb-3"  aria-label=".form-select-sm example" value={destination} onChange={(e)=>setDestination(e.target.value)}>
                        <option value="" selected disabled>Select</option>
                        <option value="Chennai">Chennai</option>
                        <option value="Banglore">Banglore</option>
                        <option value="Hyderabad">Hyderabad</option>
                        <option value="Mumbai">Mumbai</option>
                        <option value="Indore">Indore</option>
                        <option value="Delhi">Delhi</option>
                        <option value="Pune">Pune</option>
                        <option value="Trivendrum">Trivendrum</option>
                        <option value="Bhopal">Bhopal</option>
                        <option value="Kolkata">Kolkata</option>
                        <option value="varanasi">varanasi</option>
                        <option value="Jaipur">Jaipur</option>
                      </select>
                      <label htmlFor="floatingSelect">Destination City</label>
                    </div>
                    <div className="form-floating mb-3">
                      <input type="date" className="form-control" id="floatingInputstartDate" value={departureDate} min={getTodayLocalDateStr()} onChange={(e)=>setDepartureDate(e.target.value)}/>
                      <label htmlFor="floatingInputstartDate">Journey date</label>
                    </div>
                    {checkBox ?
                    
                      <div className="form-floating mb-3">
                        <input type="date" className="form-control" id="floatingInputreturnDate" value={returnDate} min={departureDate || getTodayLocalDateStr()} onChange={(e)=>setReturnDate(e.target.value)}/>
                        <label htmlFor="floatingInputreturnDate">Return date</label>
                      </div>
                    
                    :
                    
                    ""}
                    <div>
                      <button className="btn btn-primary" onClick={fetchFlights}>Search</button>
                    </div>

                  </div>
                  <p>{error}</p>
              </div>
                  
                {hasSearched
                ?
                matchingFlights.length > 0 ?
                  <div className="availableFlightsContainer">
                    <h1>Available Flights</h1>
                    <div className="Flights">
                      {matchingFlights.map((Flight)=>(
                        <div className="Flight" key={Flight._id}>
                            <div>
                                <p> <b>{Flight.flightName}</b></p>
                                <p ><b>Flight Number:</b> {Flight.flightId}</p>
                            </div>
                            <div>
                                <p ><b>Start :</b> {Flight.origin}</p>
                                <p ><b>Departure Time:</b> {Flight.departureTime}</p>
                            </div>
                            <div>
                                <p ><b>Destination :</b> {Flight.destination}</p>
                                <p ><b>Arrival Time:</b> {Flight.arrivalTime}</p>
                            </div>
                            <div>
                                <p ><b>Starting Price:</b> {Flight.basePrice}</p>
                                <p ><b>Available Seats:</b> {Flight.availableSeats ?? Flight.totalSeats}</p>
                            </div>
                            <button className="button btn btn-primary" onClick={()=>handleTicketBooking(Flight._id, Flight.origin, Flight.destination)}>Book Now</button>
                        </div>
                      ))}
                    </div>
                  </div>
                  :
                  <div className="availableFlightsContainer">
                    <h1> No Flights</h1>
                  </div>
                :
                <></>
                }
         
                
                  
   






        </div>
        <section id="about" className="section-about  p-4">
        <div className="container">
            <h2 className="section-title">About Us</h2>
            <p className="section-description">
                &nbsp; &nbsp;&nbsp; &nbsp; Welcome to SKY Furaito Flight Ticket Booking app, where we're committed to delivering a seamless travel experience from beginning to end. Whether you're heading out for a daily commute, planning an exciting cross-country trip, or looking for a peaceful scenic flight, our app offers a wide variety of options to match your travel needs.
            </p>
            <p className="section-description">
                &nbsp; &nbsp;&nbsp; &nbsp; We know how essential convenience and efficiency are when planning your journey. Our easy-to-use interface lets you quickly browse through available flight schedules, compare prices, and select the seating option that suits you best. In just a few simple steps, you can secure your flight and move closer to your destination. Our streamlined booking process allows you to personalize your travel, from choosing specific departure times to selecting a window seat or accommodating special requests.
            </p>
            <p className="section-description">
                &nbsp; &nbsp;&nbsp; &nbsp; With our app, you can look forward to discovering new places, taking in stunning views, and creating lasting memories. Begin your adventure today and let us help turn your travel dreams into reality. Enjoy the convenience, reliability, and comfort our app provides, and take off on unforgettable journeys with peace of mind.
            </p>

            <span><h5>2024 SKY Furaito - &copy; All rights reserved</h5></span>

        </div>
    </section>
    </div>
  )
}

export default LandingPage