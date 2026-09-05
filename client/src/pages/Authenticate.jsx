import React, { useState } from 'react';
import '../styles/Authenticate.css'
import Login from '../components/Login';
import Register from '../components/Register';
import ForgotPassword from '../components/ForgotPassword';

const Authenticate = () => {

  const [isLogin, setIsLogin] = useState(true);
  const [isForgotPassword, setIsForgotPassword] = useState(false);

  return (
    <div className="AuthenticatePage">

      {isForgotPassword ? <ForgotPassword onBack={() => setIsForgotPassword(false)} /> : isLogin ?
      
      <Login setIsLogin={setIsLogin} setIsForgotPassword={setIsForgotPassword} />
    
      :
      
      <Register setIsLogin = {setIsLogin} />
      }

    </div>
  )
}

export default Authenticate