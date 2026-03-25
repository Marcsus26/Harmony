import React, { useState, useEffect } from 'react';
import api from '../api';

function PendingRequestsModal({ isOpen, onClose }) {
  const [requests, setRequests] = useState([]);

  useEffect(() => {
    if (isOpen) {
      fetchRequests();
    }
  }, [isOpen]);

  const fetchRequests = async () => {
    try {
      const response = await api.get('/api/friends/pending/');
      setRequests(response.data);
    } catch (err) {
      console.error("Error fetching requests", err);
    }
  };

  const handleResponse = async (requestId, action) => {
    try {
      await api.post(`/api/friends/respond/${requestId}/`, { action });
      setRequests(requests.filter(req => req.id !== requestId));
    } catch (err) {
      alert("Action failed");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="friend-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Pending Friend Requests</h3>
          <button className="close-requests-btn" onClick={onClose}>✕</button>
        </div>

        <div className="requests-list">
          {requests.length > 0 ? (
            requests.map(req => (
              <div key={req.id} className="request-item">
                <div className="user-info">
                  <div className="avatar-placeholder">{req.from_user[0].toUpperCase()}</div>
                  <span>{req.from_user}</span>
                </div>
                <div className="request-actions">
                  <button className="btn-accept" onClick={() => handleResponse(req.id, 'accept')}>Accept</button>
                  <button className="btn-reject" onClick={() => handleResponse(req.id, 'reject')}>Ignore</button>
                </div>
              </div>
            ))
          ) : (
            <div className="empty-state">No pending requests. You're all caught up!</div>
          )}
        </div>
      </div>
    </div>
  );
}

export default PendingRequestsModal;