import React, { useEffect, useState } from 'react';
import NotificationItem from './NotificationsItem';
import { useAuth } from '../auth.jsx';
import { db } from '../firebase';
import { collection, onSnapshot, query, orderBy, addDoc, serverTimestamp, doc, updateDoc } from 'firebase/firestore';

const sampleNotifications = [
  {
    id: 'sample_1',
    type: 'accepted',
    title: 'Request Accepted!',
    message: 'Sarah accepted your request for Programming Textbook',
    time: '2 hours ago',
    isNew: true,
  },
  {
    id: 'sample_2',
    type: 'reminder',
    title: 'Return Reminder',
    message: 'Please return HDMI Cable to Mike by tomorrow',
    time: '5 hours ago',
    isNew: true,
  },
];

const Notifications = () => {
  const [notificationsData, setNotificationsData] = useState([]);
  // tick is used to re-render periodically so relative times update live
  const [tick, setTick] = useState(0);
  const { user } = useAuth();

  useEffect(() => {
    // If user is signed in and Firestore available, subscribe to user's notifications collection
    if (user && db) {
      try {
        const q = query(collection(db, 'users', user.uid, 'notifications'), orderBy('createdAt', 'desc'));
        const unsub = onSnapshot(q, (snap) => {
          const arr = [];
          snap.forEach(docSnap => {
            arr.push({ id: docSnap.id, ...docSnap.data() });
          });
          if (arr.length) setNotificationsData(arr);
          else setNotificationsData(sampleNotifications);
        }, (err) => {
          console.error('notifications snapshot error', err);
          // fallback
          try {
            const raw = localStorage.getItem('notifications');
            const parsed = raw ? JSON.parse(raw) : null;
            setNotificationsData(parsed || sampleNotifications);
          } catch (e) { setNotificationsData(sampleNotifications); }
        });
        return () => unsub();
      } catch (e) {
        console.error('failed to subscribe to firestore notifications', e);
      }
    }

    try {
      const raw = localStorage.getItem('notifications');
      const parsed = raw ? JSON.parse(raw) : null;
      if (parsed && Array.isArray(parsed) && parsed.length > 0) {
        setNotificationsData(parsed);
      } else {
        setNotificationsData(sampleNotifications);
      }
    } catch (err) {
      console.error('Failed to load notifications', err);
      setNotificationsData(sampleNotifications);
    }
  }, []);

  // Accept handler: mark notification read and optionally create a chat starter or send a Firestore notification back
  const handleAccept = async (notification) => {
    try {
      // if firestore user notifications are used, mark document as handled
      if (user && db) {
        const notifRef = doc(db, 'users', user.uid, 'notifications', notification.id);
        await updateDoc(notifRef, { isNew: false, acceptedAt: serverTimestamp() });
      }

      // If notification.payload contains borrowerId, we can create a chat-doc or write a notification to the borrower
      const borrowerId = notification.payload?.borrowerId || notification.payload?.borrower?.uid || notification.payload?.borrowerId;
      if (borrowerId && db) {
        await addDoc(collection(db, 'users', borrowerId, 'notifications'), {
          title: 'Request Accepted',
          message: `Your request for "${notification.payload?.itemTitle || ''}" was accepted.`,
          type: 'accepted',
          isNew: true,
          createdAt: serverTimestamp(),
        });
      }

      // local UI update (remove or mark)
      setNotificationsData((prev) => prev.map(n => (n.id === notification.id ? { ...n, isNew: false } : n)));
    } catch (e) {
      console.error('accept action failed', e);
    }
  };

  // update tick every 5 seconds so UI refreshes relative times
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 5000);
    return () => clearInterval(id);
  }, []);

  const timeAgoLabel = (notif) => {
    // prefer payload.timestamp or top-level timestamp
    const ts = notif.payload?.timestamp || notif.timestamp || notif.time;
    // if ts is a human string (like '2 hours ago' or 'Just now'), try to parse ISO; if not ISO, return original
    let then = null;
    if (!ts) return 'Just now';
    // if ts looks like ISO date
    if (typeof ts === 'string' && /^\d{4}-\d{2}-\d{2}T/.test(ts)) {
      then = new Date(ts).getTime();
    } else if (typeof ts === 'number') {
      then = ts;
    } else if (typeof ts === 'string' && ts.toLowerCase() === 'just now') {
      then = Date.now();
    } else {
      // cannot parse -> return provided ts (fallback)
      return ts;
    }

    const diff = Math.floor((Date.now() - then) / 1000); // seconds
    if (diff < 5) return 'Just now';
    if (diff < 60) return `${diff} sec`;
    const mins = Math.floor(diff / 60);
    if (mins < 60) return `${mins} min`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours} hour`;
    const days = Math.floor(hours / 24);
    if (days < 30) return `${days}d`;
    // older: show date
    const d = new Date(then);
    return d.toLocaleDateString();
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-3xl mx-auto">
        <h2 className="text-4xl font-extrabold text-center mb-8 bg-clip-text text-transparent bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 tracking-wide drop-shadow-md">
          Your Notifications
        </h2>

        <div className="space-y-4">
          {notificationsData.map((notification) => {
            // compute live label
            const liveTime = timeAgoLabel(notification);
            // create a shallow copy with updated time for display only
            const shown = { ...notification, time: liveTime };
            return <NotificationItem key={notification.id} data={shown} />;
          })}
        </div>
      </div>
    </div>
  );
};

export default Notifications;
