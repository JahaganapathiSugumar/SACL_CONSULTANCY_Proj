import React, { useState } from 'react';
import './Notification.css';

interface NotificationItem {
  id: string;
  title: string;
  message: string;
  time: string;
  isRead: boolean;
  type: 'info' | 'success' | 'warning' | 'error';
}

const Notification: React.FC = () => {
  const [notifications, setNotifications] = useState<NotificationItem[]>([
    {
      id: '1',
      title: 'New Idea Submitted',
      message: 'A new idea has been submitted to your department',
      time: '5 min ago',
      isRead: false,
      type: 'info'
    },
    {
      id: '2',
      title: 'Idea Approved',
      message: 'Your idea "TEST-05" has been approved',
      time: '1 hour ago',
      isRead: false,
      type: 'success'
    },
    {
      id: '3',
      title: 'Action Required',
      message: '3 ideas are pending your review',
      time: '2 hours ago',
      isRead: true,
      type: 'warning'
    },
    {
      id: '4',
      title: 'Meeting Reminder',
      message: 'Department review meeting in 30 minutes',
      time: '1 day ago',
      isRead: true,
      type: 'info'
    }
  ]);

  const markAsRead = (id: string) => {
    setNotifications(notifications.map(notif => 
      notif.id === id ? { ...notif, isRead: true } : notif
    ));
  };

  const markAllAsRead = () => {
    setNotifications(notifications.map(notif => ({ ...notif, isRead: true })));
  };

  const deleteNotification = (id: string) => {
    setNotifications(notifications.filter(notif => notif.id !== id));
  };

  const unreadCount = notifications.filter(notif => !notif.isRead).length;

  return (
    <div className="notification-container">
      <div className="notification-header">
        <h2>Notifications</h2>
        <div className="notification-actions">
          {unreadCount > 0 && (
            <button 
              className="btn-mark-all"
              onClick={markAllAsRead}
            >
              Mark all as read
            </button>
          )}
          <span className="notification-count">
            {unreadCount} unread
          </span>
        </div>
      </div>

      <div className="notification-list">
        {notifications.length === 0 ? (
          <div className="no-notifications">
            <p>No notifications</p>
          </div>
        ) : (
          notifications.map((notification) => (
            <div
              key={notification.id}
              className={`notification-item ${notification.isRead ? 'read' : 'unread'} ${notification.type}`}
            >
              <div className="notification-icon">
                {notification.type === 'info' && '💡'}
                {notification.type === 'success' && '✅'}
                {notification.type === 'warning' && '⚠️'}
                {notification.type === 'error' && '❌'}
              </div>
              <div className="notification-content">
                <div className="notification-title">
                  {notification.title}
                  {!notification.isRead && <span className="unread-dot"></span>}
                </div>
                <div className="notification-message">
                  {notification.message}
                </div>
                <div className="notification-time">
                  {notification.time}
                </div>
              </div>
              <div className="notification-actions">
                {!notification.isRead && (
                  <button
                    className="btn-mark-read"
                    onClick={() => markAsRead(notification.id)}
                    title="Mark as read"
                  >
                    ✓
                  </button>
                )}
                <button
                  className="btn-delete"
                  onClick={() => deleteNotification(notification.id)}
                  title="Delete"
                >
                  ×
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Notification;