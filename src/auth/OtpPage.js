import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './SignIn.css';
function OtpPage() {
  const [otp, setOtp] = useState(['', '', '', '']);
  const navigate = useNavigate();

  const handleChange = (e, index) => {
    const value = e.target.value;
    if (/^\d$/.test(value) || value === '') {
      const newOtp = [...otp];
      newOtp[index] = value;
      setOtp(newOtp);

      // Move focus to the next input if a digit is entered
      if (value !== '' && index < 3) {
        document.getElementById(`otp-input-${index + 1}`).focus();
      }
    }
  };

  const handleKeyDown = (e, index) => {
    if (e.key === 'Backspace' && otp[index] === '' && index > 0) {
      document.getElementById(`otp-input-${index - 1}`).focus();
    }
  };

  const handleOtpSubmit = (e) => {
    e.preventDefault();
    const otpValue = otp.join('');
    // Add OTP validation logic here
    console.log('Entered OTP:', otpValue);
    navigate('/home');
  };

  return (

    <div className="container-fluid vh-100">
      <div className="row h-100">
        {/* Image Column */}
        <div className="col-md-7 d-none d-md-flex p-0 ">
            <div className='auth-left d-flex align-items-center justify-content-center'>
                <div className='auth-left-inner '>
                <div className='auth-left-innerimg'>
                        <img 
                    src="./assets/images/auth-widgets.png" 
                    alt="Sign In" 
                    className="auth-img" 
                />
                </div>
                </div>
            
            </div>
          
        </div>

        <div className="col-md-5  p-0 ">
            <div className='auth-right d-flex align-items-center justify-content-cente'>
                <section className='auth-left-inner'>
                    <h2 style={{marginBottom:"30px",textAlign:"center"}}>Enter OTP</h2>
                    <div className="otp-container">
                        <form onSubmit={handleOtpSubmit}>
                            <div className="otp-inputs">
                            {otp.map((digit, index) => (
                                <input
                                key={index}
                                id={`otp-input-${index}`}
                                type="text"
                                maxLength="1"
                                value={digit}
                                onChange={(e) => handleChange(e, index)}
                                onKeyDown={(e) => handleKeyDown(e, index)}
                                className="otp-input"
                                required
                                />
                            ))}
                            
                            </div>
                            <div class="inputBox">
                            <input type="submit" value="Submit"/> 
                            </div>
                        </form>
                        </div>
                </section>
            
            </div>
          
        </div>

        
      </div>
    </div>
    
  );
}

export default OtpPage;
