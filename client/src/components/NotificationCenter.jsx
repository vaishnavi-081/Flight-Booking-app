import React, { useEffect, useState } from 'react';

const NotificationCenter = () => {
  const [notification, setNotification] = useState(null);

  useEffect(() => {
    const showNotification = (event) => {
      setNotification(event.detail);
      window.setTimeout(() => setNotification(null), 4200);
    };
    window.addEventListener('app-notification', showNotification);
    return () => window.removeEventListener('app-notification', showNotification);
  }, []);

  if (!notification) return null;
  return <div className={`app-notification ${notification.type}`} role="status">
    <span>{notification.message}</span>
    <button type="button" aria-label="Close notification" onClick={() => setNotification(null)}>x</button>
  </div>;
};

export default NotificationCenter;
