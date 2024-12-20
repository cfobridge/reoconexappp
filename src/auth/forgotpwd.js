import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import './SignIn.css';

function ForgotPWD() {
  const [email, setEmail] = useState('');
  const navigate = useNavigate();

  const handleSignIn = (e) => {
    e.preventDefault();
    // Add validation if needed
    navigate('/');
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
                    <h2>Reset password</h2>
                    <form onSubmit={handleSignIn} >
                        <div className='form'>
                            <div className="inputBox">
                                <input 
                                type="text" 
                                value={email} 
                                onChange={(e) => setEmail(e.target.value)} 
                                required 
                                /><i>Email ID</i> 
                            </div>
                            <div class="inputBox"> 
                            <input type="submit" value="Send Recovery Mail"/> 
                                </div> 
                        </div>
                    </form>
                </section>
            
            </div>
          
        </div>

        
      </div>
    </div>
  );
}

export default ForgotPWD;
