import React, { createContext, useEffect, useState } from 'react';
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { notify } from '../utils/notify';

export const GeneralContext = createContext();

const GeneralContextProvider = ({children}) => {

  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [usertype, setUsertype] = useState('');

  const [ticketBookingDate, setTicketBookingDate] = useState();

  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) axios.defaults.headers.common.Authorization = `Bearer ${token}`;
  }, []);

  const login = async (otp = '') =>{
    try{
      const loginInputs = {email, password, otp}
        await axios.post('http://localhost:6001/login', loginInputs)
        .then( async (res)=>{

            localStorage.setItem('userId', res.data._id);
            localStorage.setItem('userType', res.data.usertype);
            localStorage.setItem('username', res.data.username);
            localStorage.setItem('email', res.data.email);
            localStorage.setItem('token', res.data.token);
            axios.defaults.headers.common.Authorization = `Bearer ${res.data.token}`;

            if(res.data.usertype === 'customer'){
                navigate('/');
            } else if(res.data.usertype === 'admin'){
                navigate('/admin');
            } else if(res.data.usertype === 'flight-operator'){
                navigate('/flight-admin');
            }
        }).catch((err) => {
          notify(err.response?.data?.message || "Incorrect email or password", 'error');
          return false;
        });

    }catch(err){
        console.log(err);
    }
  }
  
  const register = async (selectedRole = 'customer', onOperatorSuccess = null) =>{
    try{
        const role = selectedRole || usertype || 'customer';
        const res = await axios.post('http://localhost:6001/register', { username, email, password, usertype: role });
        
        if (res.data.usertype === 'flight-operator') {
            notify('Registration submitted! Your operator account is pending admin approval before you can log in.', 'info');
            if (onOperatorSuccess) {
                onOperatorSuccess(true);
            } else {
                navigate('/auth');
            }
            return;
        }

        localStorage.setItem('userId', res.data._id);
        localStorage.setItem('userType', res.data.usertype);
        localStorage.setItem('username', res.data.username);
        localStorage.setItem('email', res.data.email);
        localStorage.setItem('token', res.data.token);
        axios.defaults.headers.common.Authorization = `Bearer ${res.data.token}`;
        navigate('/');
    } catch(err) {
        notify(err.response?.data?.message || "Registration failed", 'error');
        console.log(err);
    }
  }



  const logout = async () =>{
    
    localStorage.clear();
    delete axios.defaults.headers.common.Authorization;
    for (let key in localStorage) {
      if (localStorage.hasOwnProperty(key)) {
        localStorage.removeItem(key);
      }
    }
    
    navigate('/');
  }



  return (
    <GeneralContext.Provider value={{login, register, logout, username, setUsername, email, setEmail, password, setPassword, usertype, setUsertype, ticketBookingDate, setTicketBookingDate}} >{children}</GeneralContext.Provider>
  )
}

export default GeneralContextProvider
