import React, { useState, useEffect } from 'react';
import axios from 'axios';

function ApiDemo() {
  const [message, setMessage] = useState('Loading...');
  const [error, setError] = useState('');

  useEffect(() => {
    // Fetch data from Flask API
    axios.get('/api/hello')
      .then(response => {
        setMessage(response.data.message);
      })
      .catch(error => {
        console.error("Error fetching data:", error);
        setError('Error connecting to server');
      });
  }, []);

  return (
    <div className="api-demo">
      <h2>API Response:</h2>
      {error ? (
        <p className="error">{error}</p>
      ) : (
        <p className="message">{message}</p>
      )}
    </div>
  );
}

export default ApiDemo;