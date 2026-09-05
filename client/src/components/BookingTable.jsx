import React, { useState } from 'react';
import axios from 'axios';

const BookingTable = ({ bookings, onCancel, onModify, showContact = false }) => {
  const [editingId, setEditingId] = useState(null);
  const [editValues, setEditValues] = useState({});
  const [availableRouteFlights, setAvailableRouteFlights] = useState([]);
  const [isLoadingFlights, setIsLoadingFlights] = useState(false);

  const startEditing = (booking) => {
    const initialDate = booking.journeyDate ? String(booking.journeyDate).slice(0, 10) : getTodayLocalDateStr();
    const flightObjId = (booking.flight && typeof booking.flight === 'object' && booking.flight._id) ? booking.flight._id : (booking.flight || '');
    setEditingId(booking._id);
    setEditValues({
      journeyDate: initialDate,
      journeyTime: booking.journeyTime || booking.flight?.departureTime,
      seatClass: booking.seatClass || 'economy',
      flightId: flightObjId
    });
    fetchRouteFlights(booking.departure, booking.destination, initialDate, flightObjId);
  };

  const fetchRouteFlights = async (origin, destination, date, currentFlightId = null) => {
    if (!origin || !destination) return;
    setIsLoadingFlights(true);
    try {
      const response = await axios.get('http://localhost:6001/fetch-flights', {
        params: { origin, destination, journeyDate: date }
      });
      const flightsList = Array.isArray(response.data) ? response.data : [];
      setAvailableRouteFlights(flightsList);

      setEditValues((prev) => {
        const targetId = currentFlightId || prev.flightId;
        const matchingFlight = flightsList.find((f) => String(f._id) === String(targetId) || f.flightId === targetId);
        if (matchingFlight) {
          return {
            ...prev,
            flightId: matchingFlight._id,
            journeyTime: matchingFlight.departureTime
          };
        } else if (flightsList.length > 0) {
          return {
            ...prev,
            flightId: flightsList[0]._id,
            journeyTime: flightsList[0].departureTime
          };
        }
        return prev;
      });
    } catch (err) {
      setAvailableRouteFlights([]);
    } finally {
      setIsLoadingFlights(false);
    }
  };

  const handleDateChange = (booking, newDate) => {
    setEditValues((prev) => ({ ...prev, journeyDate: newDate }));
    fetchRouteFlights(booking.departure, booking.destination, newDate);
  };

  const handleFlightSelect = (selectedFlight) => {
    setEditValues((prev) => ({
      ...prev,
      flightId: selectedFlight._id,
      journeyTime: selectedFlight.departureTime
    }));
  };

  const handleSave = async (booking) => {
    const payload = {
      journeyDate: editValues.journeyDate,
      flightId: editValues.flightId,
      journeyTime: editValues.journeyTime,
      seatClass: editValues.seatClass
    };
    const res = await onModify(booking._id, payload);
    if (res !== false) {
      setEditingId(null);
    }
  };

  const updateValue = (field, value) => setEditValues((prev) => ({ ...prev, [field]: value }));

  const getTodayLocalDateStr = () => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const classMultipliers = { 'economy': 1, 'premium-economy': 2, 'business': 3, 'first-class': 4 };

  const calculateModifiedPrice = (booking, seatClass, flightId) => {
    const selectedFlightObj = availableRouteFlights.find((f) => f._id === flightId);
    const basePrice = selectedFlightObj?.basePrice || booking.flight?.basePrice || (booking.totalPrice / (booking.passengers?.length || 1) / (classMultipliers[booking.seatClass] || 1));
    const multiplier = classMultipliers[seatClass] || 1;
    return basePrice * multiplier * (booking.passengers?.length || 1);
  };

  return <div className="table-wrap">
    <table className="data-table booking-table">
      <thead>
        <tr>
          <th>Booking ID</th>
          {showContact && <th>Contact</th>}
          <th>Flight</th>
          <th>Route</th>
          <th>Journey</th>
          <th>Passengers</th>
          <th>Seats & Class</th>
          <th>Total</th>
          <th>Status</th>
          <th>Action</th>
        </tr>
      </thead>
      <tbody>
        {bookings.map((booking) => (
          <tr key={booking._id}>
            {(() => {
              let isDestinationCompleted = booking.bookingStatus === 'completed';
              if (!isDestinationCompleted && booking.journeyDate) {
                const journey = new Date(booking.journeyDate);
                if (!isNaN(journey.getTime())) {
                  const arrTime = booking.flight?.arrivalTime || booking.arrivalTime;
                  const depTime = booking.journeyTime || booking.flight?.departureTime;
                  const arrivalDate = new Date(journey);
                  if (arrTime && arrTime.includes(':')) {
                    const [arrH, arrM] = arrTime.split(':').map(Number);
                    arrivalDate.setHours(arrH || 0, arrM || 0, 0, 0);
                    if (depTime && depTime.includes(':')) {
                      const [depH, depM] = depTime.split(':').map(Number);
                      if (arrH < depH || (arrH === depH && arrM < depM)) {
                        arrivalDate.setDate(arrivalDate.getDate() + 1);
                      }
                    }
                  } else if (depTime && depTime.includes(':')) {
                    const [depH, depM] = depTime.split(':').map(Number);
                    arrivalDate.setHours((depH || 0) + 2, depM || 0, 0, 0);
                  } else {
                    arrivalDate.setHours(23, 59, 59, 999);
                  }
                  isDestinationCompleted = new Date() >= arrivalDate;
                }
              }

              const displayStatus = (booking.bookingStatus === 'confirmed' && isDestinationCompleted) ? 'completed' : booking.bookingStatus;
              const canModify = onModify && displayStatus === 'confirmed' && !isDestinationCompleted;
              const canCancel = displayStatus === 'confirmed' && !isDestinationCompleted;

              const selectedFlightObj = availableRouteFlights.find((f) => f._id === editValues.flightId);
              const displayFlightId = editingId === booking._id && selectedFlightObj ? selectedFlightObj.flightId : booking.flightId;
              const displayFlightName = editingId === booking._id && selectedFlightObj ? selectedFlightObj.flightName : booking.flightName;

              return <>
                <td className="id-cell">{booking._id}</td>
                {showContact && <td>{booking.email}<br />{booking.mobile}</td>}
                <td>
                  <strong>{displayFlightId}</strong><br />{displayFlightName}
                </td>
                <td>{booking.departure} to {booking.destination}</td>
                <td>
                  {editingId === booking._id ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', minWidth: '180px' }}>
                      <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#475569' }}>Date:</label>
                      <input
                        type="date"
                        value={editValues.journeyDate}
                        min={getTodayLocalDateStr()}
                        onChange={(e) => handleDateChange(booking, e.target.value)}
                        style={{ padding: '4px 6px', fontSize: '0.85rem' }}
                      />
                      <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#475569' }}>Available Time & Flight:</label>
                      {isLoadingFlights ? (
                        <small style={{ color: '#64748b' }}>Checking flights...</small>
                      ) : availableRouteFlights.length > 0 ? (
                        <select
                          value={editValues.flightId}
                          onChange={(e) => {
                            const sel = availableRouteFlights.find((f) => f._id === e.target.value);
                            if (sel) handleFlightSelect(sel);
                          }}
                          style={{ padding: '4px 6px', fontSize: '0.85rem' }}
                        >
                          {availableRouteFlights.map((f) => {
                            const seatsLeft = f.availableSeats ?? f.totalSeats;
                            const isEnoughSeats = seatsLeft >= (booking.passengers?.length || 1);
                            return (
                              <option key={f._id} value={f._id} disabled={!isEnoughSeats}>
                                {f.departureTime} ({f.flightName}) - {seatsLeft} seat(s) left
                              </option>
                            );
                          })}
                        </select>
                      ) : (
                        <small style={{ color: '#ef4444' }}>No flights found on this date</small>
                      )}
                    </div>
                  ) : (
                    <>{booking.journeyDate?.slice(0, 10)}<br />{booking.journeyTime}</>
                  )}
                </td>
                <td>{booking.passengers?.map((passenger) => `${passenger.name} (${passenger.age})`).join(', ')}</td>
                <td>
                  {editingId === booking._id ? (
                    <select
                      value={editValues.seatClass}
                      onChange={(e) => updateValue('seatClass', e.target.value)}
                      style={{ padding: '4px', fontSize: '0.85rem' }}
                    >
                      <option value="economy">Economy (1x)</option>
                      <option value="premium-economy">Premium Economy (2x)</option>
                      <option value="business">Business (3x)</option>
                      <option value="first-class">First class (4x)</option>
                    </select>
                  ) : (
                    <>{displayStatus === 'confirmed' ? booking.seats : '-'} <br /><small style={{ textTransform: 'capitalize', color: '#64748b' }}>{booking.seatClass}</small></>
                  )}
                </td>
                <td>
                  {editingId === booking._id
                    ? Math.round(calculateModifiedPrice(booking, editValues.seatClass, editValues.flightId))
                    : booking.totalPrice}
                </td>
                <td><span className={`status status-${displayStatus}`}>{displayStatus}</span></td>
                <td className="table-actions">
                  {canModify && editingId === booking._id && <>
                    <button
                      className="btn btn-primary"
                      disabled={availableRouteFlights.length > 0 && selectedFlightObj && (selectedFlightObj.availableSeats ?? selectedFlightObj.totalSeats) < (booking.passengers?.length || 1)}
                      onClick={() => handleSave(booking)}
                    >
                      Save
                    </button>
                    <button className="btn btn-secondary" onClick={() => setEditingId(null)}>Close</button>
                  </>}
                  {canModify && editingId !== booking._id && <button className="btn btn-primary" onClick={() => startEditing(booking)}>Modify</button>}
                  {canCancel && <button className="btn btn-danger" onClick={() => onCancel(booking._id)}>Cancel</button>}
                </td>
              </>;
            })()}
          </tr>
        ))}
      </tbody>
    </table>
  </div>;
};

export default BookingTable;
