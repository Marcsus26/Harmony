import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import '../../static/css/Login.css';

function Register() {
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    email: '',
    steam_id: ''
  });

  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (formData.steam_id === '') {
        formData.steam_id = null;
      }

      await axios.post('http://127.0.0.1:8000/api/register/', formData);
      
      console.log("Registration successful!");
      navigate('/login');
    } catch (err) {
      const msg = err.response?.data?.username || err.response?.data?.steam_id || "Registration failed.";
      setError(msg);
    }
  };

  return (
    <div className="login-wrapper">
      <form className="login-card" onSubmit={handleSubmit}>
        <h3>Create an account</h3>
        
        {error && <div className="error-message">{error}</div>}

        <div className="input-group">
          <label>USERNAME</label>
          <input name="username" type="text" onChange={handleChange} required />
        </div>

        <div className="input-group">
          <label>PASSWORD</label>
          <input name="password" type="password" onChange={handleChange} required />
        </div>

        <div className="input-group">
          <label>STEAM ID (Optional)</label>
          <input name="steam_id" type="number" onChange={handleChange} />
        </div>

        <button type="submit" className="login-button">Continue</button>
        
        <p className="register-link">
          Already have an account? <a href="/login">Login</a>
        </p>
      </form>
    </div>
  );
}

export default Register;