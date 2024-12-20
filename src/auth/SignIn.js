// SignIn.js
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from './AuthContext';
import './SignIn.css';

function SignIn() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleSignIn = async (e) => {
    e.preventDefault();

    try {
      const response = await fetch('http://34.70.96.246:8080/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email_id: email, password: password }),
      });

      if (!response.ok) {
        throw new Error('Login failed. Please check your credentials.');
      }

      const data = await response.json();

      if (data.token) {
        // Fetch user ID based on the email address
        const userResponse = await fetch('http://34.70.96.246:8080/api/user/id', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${data.token}`,
          },
          body: JSON.stringify({ email_address: email }),
        });

        if (!userResponse.ok) {
          throw new Error('Failed to fetch user ID.');
        }

        const userData = await userResponse.json();

        // Fetch file schema using the retrieved user ID
        const schemaResponse = await fetch(
          `http://34.70.96.246:8080/api/reconciliation/file_schemas?user_id=${userData.id}`,
          {
            headers: {
              Authorization: `Bearer ${data.token}`,
            },
          }
        );

        if (!schemaResponse.ok) {
          throw new Error('Failed to fetch file schema.');
        }

        const fileSchema = await schemaResponse.json();

        // Save token, user ID, and file schema in context or state as needed
        login(data.token, { id: userData.id, email: userData.emailAddress, fileSchema });
        setError('');
        navigate('/'); // Redirect to the desired page after login
      } else {
        setError('Invalid credentials. Please try again.');
      }
    } catch (error) {
      setError(error.message);
    }
  };

  return (
    <div className="signin-container">
      <div className="signin-form">
        <h2>Welcome Back</h2>
        <p>
          Don't have an account? <Link to="/signup">Sign Up</Link>
        </p>
        {error && <p className="error-message">{error}</p>}
        <form onSubmit={handleSignIn}>
          <div className="form-group">
            <label htmlFor="email">Email Address</label>
            <input
              type="text"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="password">
              Password {/* <Link to="/forgot-password" className="forgot-password">Forgot?</Link>*/}
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
            />
          </div> 
          <div className="form-group">
            <button type="submit">Sign In</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default SignIn;
