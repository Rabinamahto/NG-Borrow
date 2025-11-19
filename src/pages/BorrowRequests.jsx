import React, { useState, useEffect } from 'react';
import { collection, query, onSnapshot, orderBy, updateDoc, doc, addDoc, serverTimestamp, where, getDocs } from 'firebase/firestore';
import { auth, db } from '../firebase';
import { FiCheck, FiX, FiClock, FiUser, FiMail, FiPhone, FiMessageSquare, FiMessageCircle, FiRotateCcw } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';

const BorrowRequests = () => {
  const [incomingRequests, setIncomingRequests] = useState([]);
  const [outgoingRequests, setOutgoingRequests] = useState([]);
  const [activeTab, setActiveTab] = useState('incoming');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const loadRequests = () => {
      const currentUser = auth?.currentUser?.uid || 'demo-user'; // Fallback for demo
      
      try {
        // Load from localStorage borrowRequests
        const allBorrowRequests = JSON.parse(localStorage.getItem('borrowRequests') || '[]');
        console.log('📱 All borrow requests from localStorage:', allBorrowRequests);
        
        // Filter incoming requests (requests for items I own)
        const incoming = allBorrowRequests.filter(request => 
          request.itemOwnerId === currentUser
        );
        
        // Filter outgoing requests (requests I made to borrow items)
        const outgoing = allBorrowRequests.filter(request => 
          request.borrowerId === currentUser
        );
        
        console.log('📥 Incoming requests (items I own):', incoming);
        console.log('📤 Outgoing requests (items I requested):', outgoing);
        
        setIncomingRequests(incoming);
        setOutgoingRequests(outgoing);
        
      } catch (error) {
        console.error('❌ Error loading requests from localStorage:', error);
      }
      
      setLoading(false);
    };

    // Try Firebase first, fallback to localStorage
    const currentUser = auth?.currentUser;
    if (currentUser && db) {
      try {
        // Subscribe to incoming requests (requests for my items)
        const incomingQuery = query(
          collection(db, 'users', currentUser.uid, 'incomingRequests'),
          orderBy('createdAt', 'desc')
        );
        
        const unsubIncoming = onSnapshot(incomingQuery, (snapshot) => {
          const requests = [];
          snapshot.forEach(doc => {
            requests.push({ id: doc.id, ...doc.data() });
          });
          setIncomingRequests(requests);
          setLoading(false);
        }, (error) => {
          console.warn('⚠️ Firebase incoming requests error, using localStorage:', error);
          loadRequests();
        });

        // Subscribe to outgoing requests (my borrow requests)
        const outgoingQuery = query(
          collection(db, 'users', currentUser.uid, 'outgoingRequests'),
          orderBy('createdAt', 'desc')
        );
        
        const unsubOutgoing = onSnapshot(outgoingQuery, (snapshot) => {
          const requests = [];
          snapshot.forEach(doc => {
            requests.push({ id: doc.id, ...doc.data() });
          });
          setOutgoingRequests(requests);
        }, (error) => {
          console.warn('⚠️ Firebase outgoing requests error, using localStorage:', error);
          loadRequests();
        });

        return () => {
          unsubIncoming();
          unsubOutgoing();
        };
      } catch (error) {
        console.warn('⚠️ Firebase initialization error, using localStorage:', error);
        loadRequests();
      }
    } else {
      console.log('🔄 No Firebase user, loading from localStorage...');
      loadRequests();
    }
  }, []);

  const handleApproveRequest = async (request) => {
    try {
      if (db && request.borrowRequestId) {
        const currentUser = auth?.currentUser;
        const borrowerId = request.borrowerId;
        const itemTitle = request.itemTitle;
        const ownerName = currentUser?.displayName || currentUser?.email || 'Item Owner';
        
        // Update main borrow request
        await updateDoc(doc(db, 'borrowRequests', request.borrowRequestId), {
          status: 'approved',
          approvedAt: serverTimestamp(),
          approvedBy: currentUser?.uid
        });

        // Update the item status to "reserved" so other users see it as reserved
        if (request.itemId) {
          try {
            await updateDoc(doc(db, 'items', request.itemId), {
              status: 'reserved',
              reservedBy: borrowerId,
              reservedAt: serverTimestamp(),
              borrowRequestId: request.borrowRequestId
            });
            console.log('✅ Item status updated to reserved');
          } catch (error) {
            console.warn('⚠️ Failed to update item status:', error);
          }
        }

        // Update item status in localStorage as well
        try {
          const browseItems = JSON.parse(localStorage.getItem('browseItems') || '[]');
          const itemIndex = browseItems.findIndex(item => item.id === request.itemId);
          
          if (itemIndex !== -1) {
            browseItems[itemIndex] = {
              ...browseItems[itemIndex],
              status: 'reserved',
              reservedBy: borrowerId,
              reservedAt: new Date().toISOString(),
              borrowRequestId: request.borrowRequestId
            };
            localStorage.setItem('browseItems', JSON.stringify(browseItems));
            console.log('✅ Item status updated in localStorage');
          }
        } catch (error) {
          console.warn('⚠️ Failed to update item in localStorage:', error);
        }

        // Update borrow request status in localStorage
        try {
          const borrowRequests = JSON.parse(localStorage.getItem('borrowRequests') || '[]');
          const requestIndex = borrowRequests.findIndex(req => req.id === request.borrowRequestId || req.itemId === request.itemId);
          
          if (requestIndex !== -1) {
            borrowRequests[requestIndex] = {
              ...borrowRequests[requestIndex],
              status: 'approved',
              approvedAt: new Date().toISOString(),
              approvedBy: currentUser?.uid
            };
            localStorage.setItem('borrowRequests', JSON.stringify(borrowRequests));
            console.log('✅ Borrow request status updated in localStorage');
          }
        } catch (error) {
          console.warn('⚠️ Failed to update borrow request in localStorage:', error);
        }
        
        // Update in user's incoming requests
        await updateDoc(doc(db, 'users', auth.currentUser.uid, 'incomingRequests', request.id), {
          status: 'approved',
          approvedAt: serverTimestamp()
        });

        // Update borrower's outgoing request if exists
        if (borrowerId) {
          try {
            // Find and update the borrower's outgoing request
            const borrowerOutgoingRef = collection(db, 'users', borrowerId, 'outgoingRequests');
            const borrowerQuery = query(borrowerOutgoingRef, where('borrowRequestId', '==', request.borrowRequestId));
            const borrowerSnapshot = await getDocs(borrowerQuery);
            
            borrowerSnapshot.forEach(async (doc) => {
              await updateDoc(doc.ref, {
                status: 'approved',
                approvedAt: serverTimestamp()
              });
            });
          } catch (error) {
            console.warn('Could not update borrower outgoing request:', error);
          }
        }

        // Send notification to borrower
        if (borrowerId) {
          const notificationData = {
            title: `Request Approved: ${itemTitle}`,
            message: `Great news! ${ownerName} has approved your request to borrow "${itemTitle}". You can now proceed with borrowing.`,
            type: 'approval',
            isNew: true,
            itemId: request.itemId,
            borrowRequestId: request.borrowRequestId,
            fromUserId: currentUser?.uid,
            fromUserName: ownerName,
            createdAt: serverTimestamp(),
            payload: {
              type: 'approval',
              itemTitle: itemTitle,
              itemId: request.itemId,
              borrowRequestId: request.borrowRequestId,
              approvedBy: ownerName,
              timestamp: new Date().toISOString()
            }
          };

          try {
            // Save notification to borrower's notifications collection
            await addDoc(collection(db, 'users', borrowerId, 'notifications'), notificationData);
            console.log('✅ Approval notification sent to borrower');
            
            // Also save to localStorage for immediate local notifications
            const localNotification = {
              id: `notif_${Date.now()}`,
              ...notificationData,
              time: 'Just now',
              timestamp: new Date().toISOString()
            };
            
            // Check if we're dealing with the current user's localStorage
            const currentUserId = auth?.currentUser?.uid;
            if (currentUserId === borrowerId) {
              const raw = localStorage.getItem('notifications');
              const list = raw ? JSON.parse(raw) : [];
              list.unshift(localNotification);
              localStorage.setItem('notifications', JSON.stringify(list));
            }
            
          } catch (error) {
            console.error('Failed to send approval notification:', error);
          }
        }

        // Create chat connection between borrower and owner
        if (borrowerId && currentUser?.uid) {
          try {
            const chatId = `${currentUser.uid}_${borrowerId}_${request.itemId}`;
            const chatData = {
              participants: [currentUser.uid, borrowerId],
              participantNames: {
                [currentUser.uid]: ownerName,
                [borrowerId]: request.borrowerName
              },
              participantEmails: {
                [currentUser.uid]: currentUser.email,
                [borrowerId]: request.borrowerEmail
              },
              itemId: request.itemId,
              itemTitle: itemTitle,
              itemImage: request.itemImage || null,
              borrowRequestId: request.borrowRequestId,
              createdAt: serverTimestamp(),
              lastMessage: '',
              lastMessageAt: serverTimestamp(),
              status: 'active'
            };

            // Create chat document
            await addDoc(collection(db, 'chats'), {
              chatId: chatId,
              ...chatData
            });

            // Add to both users' chat lists
            await addDoc(collection(db, 'users', currentUser.uid, 'chats'), {
              chatId: chatId,
              withUserId: borrowerId,
              withUserName: request.borrowerName,
              withUserEmail: request.borrowerEmail,
              otherUserId: borrowerId,
              otherUserName: request.borrowerName,
              otherUserEmail: request.borrowerEmail,
              itemId: request.itemId,
              itemTitle: itemTitle,
              itemImage: request.itemImage || null,
              lastMessage: '',
              lastMessageAt: serverTimestamp(),
              createdAt: serverTimestamp()
            });

            await addDoc(collection(db, 'users', borrowerId, 'chats'), {
              chatId: chatId,
              withUserId: currentUser.uid,
              withUserName: ownerName,
              withUserEmail: currentUser.email,
              otherUserId: currentUser.uid,
              otherUserName: ownerName,
              otherUserEmail: currentUser.email,
              itemId: request.itemId,
              itemTitle: itemTitle,
              itemImage: request.itemImage || null,
              lastMessage: '',
              lastMessageAt: serverTimestamp(),
              createdAt: serverTimestamp()
            });

            console.log('✅ Chat connection created');
          } catch (error) {
            console.error('Failed to create chat connection:', error);
          }
        }

        alert('Request approved successfully! Notification sent to borrower.');
      }
    } catch (error) {
      console.error('Error approving request:', error);
      alert('Failed to approve request');
    }
  };

  const handleRejectRequest = async (request) => {
    try {
      if (db && request.borrowRequestId) {
        const currentUser = auth?.currentUser;
        const borrowerId = request.borrowerId;
        const itemTitle = request.itemTitle;
        const ownerName = currentUser?.displayName || currentUser?.email || 'Item Owner';
        
        // Update main borrow request
        await updateDoc(doc(db, 'borrowRequests', request.borrowRequestId), {
          status: 'rejected',
          rejectedAt: serverTimestamp(),
          rejectedBy: currentUser?.uid
        });
        
        // Update in user's incoming requests
        await updateDoc(doc(db, 'users', auth.currentUser.uid, 'incomingRequests', request.id), {
          status: 'rejected',
          rejectedAt: serverTimestamp()
        });

        // Update borrower's outgoing request if exists
        if (borrowerId) {
          try {
            const borrowerOutgoingRef = collection(db, 'users', borrowerId, 'outgoingRequests');
            const borrowerQuery = query(borrowerOutgoingRef, where('borrowRequestId', '==', request.borrowRequestId));
            const borrowerSnapshot = await getDocs(borrowerQuery);
            
            borrowerSnapshot.forEach(async (doc) => {
              await updateDoc(doc.ref, {
                status: 'rejected',
                rejectedAt: serverTimestamp()
              });
            });
          } catch (error) {
            console.warn('Could not update borrower outgoing request:', error);
          }
        }

        // If request caused the item to be reserved/pending, reset it to available so others can request again
        if (request.itemId) {
          try {
            await updateDoc(doc(db, 'items', request.itemId), {
              status: 'available',
              reservedBy: null,
              reservedAt: null,
              borrowRequestId: null
            });
            console.log('\u2705 Item status reset to available in Firestore');
          } catch (err) {
            console.warn('Could not reset item status in Firestore:', err);
          }
        }

        // Also update localStorage copy of items so UI updates immediately
        try {
          const browseItems = JSON.parse(localStorage.getItem('browseItems') || '[]');
          const idx = browseItems.findIndex(it => it.id === request.itemId || it.id === request.itemId);
          if (idx !== -1) {
            browseItems[idx] = {
              ...browseItems[idx],
              status: 'available',
              reservedBy: null,
              reservedAt: null,
              borrowRequestId: null
            };
            localStorage.setItem('browseItems', JSON.stringify(browseItems));
            console.log('\u2705 Item status reset to available in localStorage');
          }
        } catch (err) {
          console.warn('Failed to update localStorage after rejection:', err);
        }

        // Send notification to borrower
        if (borrowerId) {
          const notificationData = {
            title: `Request Declined: ${itemTitle}`,
            message: `Sorry, ${ownerName} has declined your request to borrow "${itemTitle}". You can try requesting other items.`,
            type: 'rejection',
            isNew: true,
            itemId: request.itemId,
            borrowRequestId: request.borrowRequestId,
            fromUserId: currentUser?.uid,
            fromUserName: ownerName,
            createdAt: serverTimestamp(),
            payload: {
              type: 'rejection',
              itemTitle: itemTitle,
              itemId: request.itemId,
              borrowRequestId: request.borrowRequestId,
              rejectedBy: ownerName,
              timestamp: new Date().toISOString()
            }
          };

          try {
            // Save notification to borrower's notifications collection
            await addDoc(collection(db, 'users', borrowerId, 'notifications'), notificationData);
            console.log('✅ Rejection notification sent to borrower');
          } catch (error) {
            console.error('Failed to send rejection notification:', error);
          }
        }

        alert('Request rejected. Notification sent to borrower.');
      }
    } catch (error) {
      console.error('Error rejecting request:', error);
      alert('Failed to reject request');
    }
  };

  const handleReturnItem = async (request) => {
    try {
      if (db && request.borrowRequestId) {
        const currentUser = auth?.currentUser;
        const borrowerId = request.borrowerId;
        const itemTitle = request.itemTitle;
        const ownerName = currentUser?.displayName || currentUser?.email || 'Item Owner';
        
        // Update main borrow request to returned
        await updateDoc(doc(db, 'borrowRequests', request.borrowRequestId), {
          status: 'returned',
          returnedAt: serverTimestamp(),
          returnedBy: currentUser?.uid
        });

        // Update the item status back to "available"
        if (request.itemId) {
          try {
            await updateDoc(doc(db, 'items', request.itemId), {
              status: 'available',
              borrowedBy: null,
              borrowedAt: null,
              returnedAt: serverTimestamp(),
              borrowRequestId: null
            });
            console.log('✅ Item status updated to available');
          } catch (error) {
            console.warn('⚠️ Failed to update item status:', error);
          }
        }
        
        // Update in user's incoming requests
        await updateDoc(doc(db, 'users', auth.currentUser.uid, 'incomingRequests', request.id), {
          status: 'returned',
          returnedAt: serverTimestamp()
        });

        // Update borrower's outgoing request if exists
        if (borrowerId) {
          try {
            const borrowerOutgoingRef = collection(db, 'users', borrowerId, 'outgoingRequests');
            const borrowerQuery = query(borrowerOutgoingRef, where('borrowRequestId', '==', request.borrowRequestId));
            const borrowerSnapshot = await getDocs(borrowerQuery);
            
            borrowerSnapshot.forEach(async (doc) => {
              await updateDoc(doc.ref, {
                status: 'returned',
                returnedAt: serverTimestamp()
              });
            });
          } catch (error) {
            console.warn('Could not update borrower outgoing request:', error);
          }
        }

        // Send notification to borrower
        if (borrowerId) {
          const notificationData = {
            title: `Item Returned: ${itemTitle}`,
            message: `Thank you! ${ownerName} has marked "${itemTitle}" as returned. Hope you enjoyed using it!`,
            type: 'returned',
            isNew: true,
            itemId: request.itemId,
            borrowRequestId: request.borrowRequestId,
            fromUserId: currentUser?.uid,
            fromUserName: ownerName,
            createdAt: serverTimestamp(),
            payload: {
              type: 'returned',
              itemTitle: itemTitle,
              itemId: request.itemId,
              borrowRequestId: request.borrowRequestId,
              returnedBy: ownerName,
              timestamp: new Date().toISOString()
            }
          };

          try {
            await addDoc(collection(db, 'users', borrowerId, 'notifications'), notificationData);
            console.log('✅ Return notification sent to borrower');
          } catch (error) {
            console.error('Failed to send return notification:', error);
          }
        }

        alert('Item marked as returned successfully! Notification sent to borrower.');
      }
    } catch (error) {
      console.error('Error marking item as returned:', error);
      alert('Failed to mark item as returned');
    }
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return 'Unknown time';
    let date;
    if (timestamp.seconds) {
      date = new Date(timestamp.seconds * 1000);
    } else {
      date = new Date(timestamp);
    }
    return date.toLocaleDateString('en-IN') + ' at ' + date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'approved': return 'text-green-600 bg-green-100';
      case 'rejected': return 'text-red-600 bg-red-100';
      default: return 'text-yellow-600 bg-yellow-100';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'approved': return <FiCheck className="w-4 h-4" />;
      case 'rejected': return <FiX className="w-4 h-4" />;
      default: return <FiClock className="w-4 h-4" />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <div className="flex justify-center items-center h-64">
          <div className="text-lg text-gray-600">Loading requests...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">Borrow Requests</h1>
        
        {/* Tabs */}
        <div className="flex mb-6 bg-white rounded-lg p-1 shadow-sm">
          <button
            onClick={() => setActiveTab('incoming')}
            className={`flex-1 py-2 px-4 rounded-md transition-colors ${
              activeTab === 'incoming'
                ? 'bg-blue-500 text-white'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            Incoming Requests ({incomingRequests.length})
          </button>
          <button
            onClick={() => setActiveTab('outgoing')}
            className={`flex-1 py-2 px-4 rounded-md transition-colors ${
              activeTab === 'outgoing'
                ? 'bg-blue-500 text-white'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            My Requests ({outgoingRequests.length})
          </button>
        </div>

        {/* Content */}
        {activeTab === 'incoming' ? (
          <div className="space-y-4">
            {incomingRequests.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-lg shadow-sm">
                <FiClock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No incoming requests yet</p>
              </div>
            ) : (
              incomingRequests.map((request) => (
                <div key={request.id} className="bg-white rounded-lg shadow-sm p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex gap-4">
                      {/* Item Image */}
                      {request.itemImage && (
                        <div className="w-20 h-20 rounded-lg overflow-hidden bg-gray-100">
                          <img 
                            src={request.itemImage} 
                            alt={request.itemTitle}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}
                      <div>
                        <h3 className="text-lg font-semibold text-gray-800">
                          {request.itemTitle}
                        </h3>
                        {request.itemDescription && (
                          <p className="text-sm text-gray-600 mt-1 max-w-md">
                            {request.itemDescription}
                          </p>
                        )}
                        <div className="flex gap-4 mt-2 text-xs text-gray-500">
                          {request.itemCategory && (
                            <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded">
                              {request.itemCategory}
                            </span>
                          )}
                          {request.itemCondition && (
                            <span className="bg-green-100 text-green-700 px-2 py-1 rounded">
                              {request.itemCondition}
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-500 mt-2">
                          {formatDate(request.createdAt)}
                        </p>
                      </div>
                    </div>
                    <div className={`flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(request.status || 'pending')}`}>
                      {getStatusIcon(request.status || 'pending')}
                      {(request.status || 'pending').charAt(0).toUpperCase() + (request.status || 'pending').slice(1)}
                    </div>
                  </div>
                  
                  <div className="grid md:grid-cols-2 gap-4 mb-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <FiUser className="w-4 h-4" />
                        <span>{request.borrowerName}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <FiMail className="w-4 h-4" />
                        <span>{request.borrowerEmail}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <FiPhone className="w-4 h-4" />
                        <span>{request.borrowerPhone}</span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="text-sm text-gray-600">
                        <strong>Duration:</strong> {request.borrowDuration}
                      </div>
                      {request.message && (
                        <div className="text-sm text-gray-600">
                          <div className="flex items-start gap-2">
                            <FiMessageSquare className="w-4 h-4 mt-0.5" />
                            <span>{request.message}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {request.status === 'pending' && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleApproveRequest(request)}
                        className="flex items-center gap-2 bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors"
                      >
                        <FiCheck className="w-4 h-4" />
                        Approve
                      </button>
                      <button
                        onClick={() => handleRejectRequest(request)}
                        className="flex items-center gap-2 bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors"
                      >
                        <FiX className="w-4 h-4" />
                        Reject
                      </button>
                    </div>
                  )}

                  {request.status === 'approved' && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => navigate(`/chat?user=${request.borrowerId}&name=${encodeURIComponent(request.borrowerName)}&item=${encodeURIComponent(request.itemTitle)}`)}
                        className="flex items-center gap-2 bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors"
                      >
                        <FiMessageCircle className="w-4 h-4" />
                        Chat with {request.borrowerName}
                      </button>
                      <button
                        onClick={() => handleReturnItem(request)}
                        className="flex items-center gap-2 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors"
                      >
                        <FiRotateCcw className="w-4 h-4" />
                        Mark as Returned
                      </button>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {outgoingRequests.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-lg shadow-sm">
                <FiClock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No outgoing requests yet</p>
              </div>
            ) : (
              outgoingRequests.map((request) => (
                <div key={request.id} className="bg-white rounded-lg shadow-sm p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-800">
                        {request.itemTitle}
                      </h3>
                      <p className="text-sm text-gray-500">
                        Requested from: {request.itemOwnerName}
                      </p>
                      <p className="text-sm text-gray-500">
                        {formatDate(request.createdAt)}
                      </p>
                    </div>
                    <div className={`flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(request.status || 'pending')}`}>
                      {getStatusIcon(request.status || 'pending')}
                      {(request.status || 'pending').charAt(0).toUpperCase() + (request.status || 'pending').slice(1)}
                    </div>
                  </div>
                  
                  <div className="text-sm text-gray-600 space-y-1">
                    <div><strong>Duration:</strong> {request.borrowDuration}</div>
                    {request.message && (
                      <div className="flex items-start gap-2">
                        <FiMessageSquare className="w-4 h-4 mt-0.5" />
                        <span>{request.message}</span>
                      </div>
                    )}
                  </div>

                  {/* Add Chat button for approved outgoing requests */}
                  {request.status === 'approved' && (
                    <div className="mt-4">
                      <button
                        onClick={() => navigate(`/chat?user=${request.itemOwnerId}&name=${encodeURIComponent(request.itemOwnerName)}&item=${encodeURIComponent(request.itemTitle)}`)}
                        className="flex items-center gap-2 bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors"
                      >
                        <FiMessageCircle className="w-4 h-4" />
                        Chat with {request.itemOwnerName}
                      </button>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default BorrowRequests;