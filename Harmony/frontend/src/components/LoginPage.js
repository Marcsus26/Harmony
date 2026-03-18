import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from "react-router-dom";
import '../../static/css/Login.css';

function Login({ setAuth }) {
  const [formData, setFormData] = useState({ username: '', password: '' });
  const [error, setError] = useState('');

  let navigate = useNavigate(); 
  const routeChange = () =>{ 
    let path = `/`; 
    navigate(path);
  }

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {

      const response = await axios.post('http://127.0.0.1:8000/api/login/', formData);

      const { access, refresh } = response.data;

      localStorage.setItem('access_token', access);
      localStorage.setItem('refresh_token', refresh);

      setAuth(true);
      
      routeChange();
    } catch (err) {
      setError('Invalid username or password. Try again?');
    }
  };

  return (
    <div className="login-wrapper">
      <form className="login-card" onSubmit={handleSubmit}>
        <h3>Welcome back!</h3>
        <p className="subtitle">We're so excited to see you again!</p>

        {error && <div className="error-message">{error}</div>}

        <div className="input-group">
          <label>USERNAME</label>
          <input 
            name="username" 
            type="text" 
            onChange={handleChange} 
            required 
          />
        </div>

        <div className="input-group">
          <label>PASSWORD</label>
          <input 
            name="password" 
            type="password" 
            onChange={handleChange} 
            required 
          />
        </div>

        <button type="submit" className="login-button">Log In</button>
        
        <p className="register-link">
          Need an account? <a href="/register">Register</a>
        </p>
      </form>
    </div>
  );
}

export default Login;