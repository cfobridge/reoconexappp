// SignUp.js
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import './SignUp.css'; // Updated CSS file

function SignUp() {
    const [first_name, setFirst_name] = useState('');
    const [last_name, setLast_name] = useState('');
    const [email_address, setEmail_address] = useState('');
    const [raw_password, setRaw_password] = useState('');
    const [role, setRole] = useState('');
    const navigate = useNavigate();

    const handleSignIn = async (e) => {
        e.preventDefault();

        try {
            await fetch('http://34.70.96.246:8080/api/user/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    first_name,
                    last_name,
                    email_address,
                    raw_password,
                    role
                })
            });
        } catch (error) {
            console.error('An error occurred during registration:', error);
        } finally {
            // Redirect to sign-in page regardless of the result
            navigate('/signin');
        }
    };

    return (
        <div className="signup-container">
            <div className="signup-form">
                <h2>Create an Account</h2>
                <p>
                    Already have an account? <Link to="/signin">Sign In</Link>
                </p>
                <form onSubmit={handleSignIn}>
                    <div className="form-group">
                        <label htmlFor="first_name">First Name</label>
                        <input
                            type="text"
                            id="first_name"
                            value={first_name}
                            onChange={(e) => setFirst_name(e.target.value)}
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="last_name">Last Name</label>
                        <input
                            type="text"
                            id="last_name"
                            value={last_name}
                            onChange={(e) => setLast_name(e.target.value)}
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="email_address">Email Address</label>
                        <input
                            type="email"
                            id="email_address"
                            value={email_address}
                            onChange={(e) => setEmail_address(e.target.value)}
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="raw_password">Password</label>
                        <input
                            type="password"
                            id="raw_password"
                            value={raw_password}
                            onChange={(e) => setRaw_password(e.target.value)}
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="role">Role</label>
                        <input
                            type="text"
                            id="role"
                            value={role}
                            onChange={(e) => setRole(e.target.value)}
                            required
                        />
                    </div>
                    <div className="form-group">
                        <button type="submit">Sign Up</button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default SignUp;
