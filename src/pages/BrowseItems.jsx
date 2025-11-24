// BrowseItems.jsx

import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { db, auth } from "../firebase";
import { collection, onSnapshot, query, orderBy, addDoc, serverTimestamp, deleteDoc, doc, updateDoc } from "firebase/firestore";
import ItemCard from "./ItemCard"; 
import BorrowRequestModal from "./BorrowRequestModal"; // Assuming this file exists

const BrowseItems = ({ maxItems, initialItems = null, showSearch = true }) => {
  const [items, setItems] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null); 
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredItems, setFilteredItems] = useState([]);
  const navigate = useNavigate();
  const location = useLocation();

  const load = () => {
    try {
      // If parent provided items (e.g. when BrowseItems is embedded on Home), prefer them
      if (initialItems && Array.isArray(initialItems) && initialItems.length > 0) {
        setItems(initialItems);
        return;
      }

      const raw = localStorage.getItem("browseItems");
      const parsedItems = raw ? JSON.parse(raw) : []; 
      
      const currentUser = auth?.currentUser;
      
      const itemsWithOwnerInfo = parsedItems.map(item => {
        // Check if this item belongs to current authenticated user
        const isMyItem = (currentUser && item.ownerId && currentUser.uid === item.ownerId) || 
                        (!item.ownerId && (!item.owner || item.owner.name === "You"));
        
        if (isMyItem) {
          return { ...item, owner: { name: "You" }, ownerId: item.ownerId || currentUser?.uid };
        }
        return item;
      });

      setItems(itemsWithOwnerInfo);
    } catch (err) {
      console.error("load browseItems error:", err);
      setItems([]);
    }
  };

  // If Firestore is available, subscribe to items collection (real-time)
  useEffect(() => {
    if (!db) return;
    try {
      const q = query(collection(db, 'items'), orderBy('createdAt', 'desc'));
      const unsub = onSnapshot(q, (snap) => {
        const arr = [];
        const currentUid = auth?.currentUser?.uid || null;
        
        snap.forEach(d => {
          const data = d.data();
          const ownerId = data.ownerId || null;
          
          // Check if this item belongs to current authenticated user (not device)
          const isMine = currentUid && ownerId && currentUid === ownerId;
          
          const ownerName = isMine ? 'You' : (data.ownerName || data.owner?.name || 'User');
          arr.push({ id: d.id, ...data, owner: { name: ownerName }, ownerId });
        });
        setItems(arr);
      }, (err) => console.error('items snapshot error', err));

      return () => unsub();
    } catch (e) {
      console.warn('Firestore subscribe failed', e);
    }
  }, []);

  const handleBorrowRequest = (item) => {
      try {
        const deviceId = localStorage.getItem('deviceUserId');
        
        // Check if trying to borrow own item (device-specific)
        if (deviceId && item?.deviceOwnerId && deviceId === item.deviceOwnerId) {
          alert('You cannot borrow your own item. Use the menu to edit or delete your item.');
          return;
        }
      } catch (e) {
        // ignore and proceed
      }
      setSelectedItem(item);
  };
  
  const handleModalSubmit = async (requestData) => {
    console.log("Borrow Request Started:", requestData);

      try {
        const itemTitle = selectedItem?.title || requestData.itemId || 'an item';
        const nowIso = new Date().toISOString();
        const currentUser = auth?.currentUser;
        const ownerId = selectedItem?.ownerId || selectedItem?.owner?.id || null;

  console.log("Request Details:", {
          itemTitle,
          currentUser: currentUser?.email,
          ownerId,
          selectedItem: selectedItem?.id
        });

        // Create borrow request object
        const borrowRequest = {
          itemId: selectedItem?.id,
          itemTitle: itemTitle,
          itemDescription: selectedItem?.description || '',
          itemCategory: selectedItem?.category || '',
          itemCondition: selectedItem?.condition || '',
          itemImage: selectedItem?.images && selectedItem.images.length > 0 ? selectedItem.images[0] : null,
          itemOwnerId: ownerId,
          itemOwnerName: selectedItem?.ownerName || selectedItem?.owner?.name || 'Unknown',
          borrowerId: currentUser?.uid || 'anonymous',
          borrowerName: requestData.borrower?.name || currentUser?.email || 'Anonymous User',
          borrowerEmail: requestData.borrower?.email || currentUser?.email || 'No email',
          borrowerPhone: requestData.borrower?.phone || requestData.mobile || 'No phone',
          message: requestData.message || requestData.reason || 'Would like to borrow this item',
          borrowDuration: requestData.borrowDuration || '1 week',
          borrowDate: requestData.borrowDate || '',
          returnDate: requestData.returnDate || '',
          status: 'pending', // pending, approved, rejected
          createdAt: nowIso,
          timestamp: serverTimestamp(),
        };

  console.log("Saving borrow request:", borrowRequest);

        // Save to Firebase borrowRequests collection
        let borrowRequestId = null;
        if (db) {
          try {
            const borrowRequestRef = await addDoc(collection(db, 'borrowRequests'), borrowRequest);
            borrowRequestId = borrowRequestRef.id;
            console.log('Borrow request saved to Firebase:', borrowRequestId);
            
            // Also save to specific collections for easier querying
            if (ownerId) {
              // Save to owner's incoming requests
              try {
                await addDoc(collection(db, 'users', ownerId, 'incomingRequests'), {
                  ...borrowRequest,
                  borrowRequestId: borrowRequestId,
                });
                console.log('Saved to owner incoming requests');
              } catch (error) {
                console.warn('Failed to save to owner incoming requests:', error);
              }
            }
            
            if (currentUser?.uid) {
              // Save to borrower's outgoing requests
              try {
                await addDoc(collection(db, 'users', currentUser.uid, 'outgoingRequests'), {
                  ...borrowRequest,
                  borrowRequestId: borrowRequestId,
                });
                console.log('Saved to borrower outgoing requests');
              } catch (error) {
                console.warn('Failed to save to borrower outgoing requests:', error);
              }
            }
          } catch (error) {
            console.error('Failed to save borrow request to Firebase:', error);
            // Continue with localStorage fallback
          }
        } else {
          console.warn('Firebase db not available');
        }

        // Build a notification object and save to localStorage notifications list
        const raw = localStorage.getItem('notifications');
        const list = raw ? JSON.parse(raw) : [];

        // Also save to localStorage for immediate local functionality
        try {
          const localBorrowRequest = {
            id: borrowRequestId || `local_${Date.now()}`,
            ...borrowRequest,
            borrowRequestId: borrowRequestId || `local_${Date.now()}`,
            itemOwnerId: ownerId,
            itemOwnerName: item.owner?.name || 'Item Owner',
            itemOwnerEmail: item.owner?.email || '',
            borrowerId: currentUser?.uid,
            borrowerName: currentUser?.displayName || currentUser?.email || 'Borrower',
            borrowerEmail: currentUser?.email || '',
            status: 'pending',
            timestamp: nowIso
          };

          const existingRequests = JSON.parse(localStorage.getItem('borrowRequests') || '[]');
          existingRequests.push(localBorrowRequest);
          localStorage.setItem('borrowRequests', JSON.stringify(existingRequests));
          console.log('Borrow request saved to localStorage');
        } catch (error) {
          console.warn('Failed to save borrow request to localStorage:', error);
        }

        const notif = {
          id: `notif_${Date.now()}`,
          type: 'new',
          title: `New Borrow Request: ${itemTitle}`,
          message: `${requestData.borrower?.name || 'Someone'} requested to borrow "${itemTitle}"`,
          time: 'Just now',
          isNew: true,
          payload: { 
            ...requestData, 
            itemTitle, 
            timestamp: nowIso,
            borrowRequestId: borrowRequestId || `local_${Date.now()}` // Use actual ID or fallback
          },
          timestamp: nowIso,
        };

        // Attempt Firestore delivery to owner's notifications subcollection
        try {
          if (db && ownerId && borrowRequestId) {
            await addDoc(collection(db, 'users', ownerId, 'notifications'), {
              title: notif.title,
              message: notif.message,
              type: notif.type,
              isNew: true,
              payload: notif.payload,
              createdAt: serverTimestamp(),
            });
            console.log('Notification saved to Firebase');
          }
        } catch (e) {
          console.warn('Failed to write firestore notification:', e);
        }

        // After saving request & notifications, mark item as pending in Firestore so UI shows Reserved
        try {
          if (db && borrowRequestId && selectedItem?.id) {
            await updateDoc(doc(db, 'items', selectedItem.id), {
              status: 'pending',
              reservedBy: currentUser?.uid || borrowRequest.borrowerId,
              reservedAt: serverTimestamp(),
              borrowRequestId: borrowRequestId
            });
            console.log('Item marked as pending in Firestore');
          }
        } catch (e) {
          console.warn('Failed to mark item as pending in Firestore:', e);
        }

        list.unshift(notif);
        localStorage.setItem('notifications', JSON.stringify(list));

        // Show success message
        alert(`Borrow request for ${itemTitle} sent successfully!`);
        setSelectedItem(null); // Close modal

      } catch (err) {
        console.error('Failed to save borrow request:', err);
        alert('Failed to send borrow request. Please try again.');
      }
  };
  // NEW FUNCTION: Handles the deletion of an item
  const handleDeleteItem = async (itemId) => {
    // Try to delete from Firestore if possible (document id)
    try {
      if (db) {
        // Attempt to delete the document in Firestore
        await deleteDoc(doc(db, 'items', itemId));
      }
    } catch (err) {
      // If Firestore delete fails, continue and remove locally
      console.warn('Firestore delete failed or not available', err);
    }

    // Remove from local state and localStorage as fallback/cleanup
    try {
      const updatedItems = items.filter(item => item.id !== itemId);
      setItems(updatedItems);

      const itemsToSave = updatedItems.map(item => {
        if (item.owner && item.owner.name === "You") {
          const { owner, ...rest } = item;
          return { ...rest };
        }
        return item;
      });

      localStorage.setItem("browseItems", JSON.stringify(itemsToSave));
    } catch (err) {
      console.error("Error saving items after deletion", err);
    }
  };

  // NEW FUNCTION: Handles marking item as returned
  const handleReturnItem = async (itemId) => {
    try {
      if (db) {
        // Update status in Firestore
        const itemRef = doc(db, 'items', itemId);
        await updateDoc(itemRef, {
          status: 'available',
          borrowedBy: null,
          borrowedAt: null,
          returnedAt: serverTimestamp()
        });
      }
    } catch (err) {
      console.warn('Firestore update failed or not available', err);
    }

    // Update local state and localStorage
    try {
      const updatedItems = items.map(item => {
        if (item.id === itemId) {
          return {
            ...item,
            status: 'available',
            borrowedBy: null,
            borrowedAt: null,
            returnedAt: new Date().toISOString()
          };
        }
        return item;
      });

      setItems(updatedItems);

      const itemsToSave = updatedItems.map(item => {
        if (item.owner && item.owner.name === "You") {
          const { owner, ...rest } = item;
          return { ...rest };
        }
        return item;
      });

      localStorage.setItem("browseItems", JSON.stringify(itemsToSave));
    } catch (err) {
      console.error("Error updating item after return", err);
    }
  };

  useEffect(() => {
    load();
    const onStorage = (e) => {
      if (e.key === "browseItems") load();
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  // Filter items based on search query
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredItems(items);
    } else {
      const query = searchQuery.toLowerCase().trim();
      const filtered = items.filter(item => 
        item.title?.toLowerCase().includes(query) ||
        item.description?.toLowerCase().includes(query) ||
        item.category?.toLowerCase().includes(query) ||
        item.condition?.toLowerCase().includes(query)
      );
      setFilteredItems(filtered);
    }
  }, [items, searchQuery]);

  // If we arrived with a state requesting scroll to a specific item, handle it after items load
  useEffect(() => {
    const state = location.state || {};
    const targetId = state.scrollToItemId;
    const targetTitle = state.scrollToItemTitle;

    if (!targetId && !targetTitle) return;

    // small timeout to ensure DOM rendered
    setTimeout(() => {
      let el = null;
      if (targetId) {
        el = document.getElementById(`item-${targetId}`);
      }
      if (!el && targetTitle) {
        // try to find item by title text content
        const all = document.querySelectorAll('[id^="item-"]');
        for (const node of all) {
          if (node.innerText && node.innerText.toLowerCase().includes(targetTitle.toLowerCase())) {
            el = node;
            break;
          }
        }
      }

      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        // add highlight
        el.classList.add('ring-4', 'ring-indigo-200');
        setTimeout(() => el.classList.remove('ring-4', 'ring-indigo-200'), 3000);
      }

      // clear history state so subsequent navigation doesn't re-trigger
      try { navigate(location.pathname, { replace: true, state: {} }); } catch(e){}
    }, 300);
  }, [location, items, navigate]);

  if (!items || items.length === 0) {
    return (
      <div className="p-6">
        {/* Search Bar - shown only when enabled (Explore page) */}
        {showSearch && (
          <div className="max-w-md mx-auto mb-8">
            <div className="relative">
              <input
                type="text"
                placeholder="Search items... (e.g., tshirt, book, laptop)"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-2 pl-10 pr-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>
          </div>
        )}
        <div className="text-center text-gray-500">No items posted yet.</div>
      </div>
    );
  }

  const displayedItems = typeof maxItems === 'number' ? filteredItems.slice(0, maxItems) : filteredItems;

  return (
    <div className="p-6">
      {/* Search Bar (only on Explore / browse) */}
      {showSearch && (
        <div className="max-w-md mx-auto mb-8">
          <div className="relative">
            <input
              type="text"
              placeholder="Search items..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-2 pl-10 pr-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
              >
                <svg className="h-5 w-5 text-gray-400 hover:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Search Results Info */}
      {searchQuery && (
        <div className="mb-4 text-center text-gray-600">
          {displayedItems.length > 0 ? (
            `Found ${displayedItems.length} item${displayedItems.length !== 1 ? 's' : ''} matching "${searchQuery}"`
          ) : (
            `No items found matching "${searchQuery}"`
          )}
        </div>
      )}

      {/* Items Grid */}
      {displayedItems.length > 0 ? (
        <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {displayedItems.map((it) => (
            <ItemCard 
                key={it.id} 
                item={it} 
                onBorrowClick={handleBorrowRequest} 
                onDeleteItem={handleDeleteItem} // Pass the delete handler
                onReturnItem={handleReturnItem} // Pass the return handler
            /> 
          ))}
        </div>
      ) : searchQuery ? (
        <div className="text-center text-gray-500 py-8">
          <svg className="mx-auto h-12 w-12 text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <p>No items found for "{searchQuery}"</p>
          <p className="text-sm text-gray-400 mt-2">Try searching with different keywords</p>
        </div>
      ) : null}
      
      {/* Borrow Request Modal */}
      {selectedItem && (
        <BorrowRequestModal 
            item={selectedItem} 
            onClose={() => setSelectedItem(null)} 
            onSubmit={handleModalSubmit} 
        />
      )}
    </div>
  );
};

export default BrowseItems;