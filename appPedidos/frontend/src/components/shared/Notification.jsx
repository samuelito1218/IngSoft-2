import React, { useState, useEffect } from 'react';
import "../../styles/Notificacion.css";
const Notification = ({ message, type = 'success', duration = 3000, onClose }) => {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
      if (onClose) onClose();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const handleClose = () => {
    setVisible(false);
    if (onClose) onClose();
  };

  return visible ? (
    <div className={`notification notification-${type}`}>
      <div className="notification-content">
        {type === 'success' && <span className="notification-icon">✓</span>}
        {type === 'error' && <span className="notification-icon">✕</span>}
        {type === 'warning' && <span className="notification-icon">⚠</span>}
        {type === 'info' && <span className="notification-icon">ℹ</span>}
        <span className="notification-message">{message}</span>
      </div>
      <button className="notification-close" onClick={handleClose}>×</button>
    </div>
  ) : null;
};

// Componente para gestionar múltiples notificaciones
const NotificationManager = () => {
  const [notifications, setNotifications] = useState([]);

  // Función para agregar una nueva notificación
  const addNotification = (message, type = 'success', duration = 3000) => {
    const id = Date.now();
    setNotifications(prev => [...prev, { id, message, type, duration }]);
    return id;
  };

  const removeNotification = (id) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id));
  };

  window.showNotification = addNotification;

  return (
    <div className="notification-container">
      {notifications.map(notification => (
        <Notification
          key={notification.id}
          message={notification.message}
          type={notification.type}
          duration={notification.duration}
          onClose={() => removeNotification(notification.id)}
        />
      ))}
    </div>
  );
};

export default NotificationManager;