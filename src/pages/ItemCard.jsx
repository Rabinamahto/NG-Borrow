// ItemCard.jsx

import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { FaChevronLeft, FaChevronRight, FaUserAlt, FaTools, FaStar, FaTimes, FaEllipsisV, FaPencilAlt, FaTrashAlt } from "react-icons/fa";
import { AiOutlineClockCircle } from "react-icons/ai"; 
import { auth } from "../firebase"; 

// Helper function to determine status, colors, and button text
const getStatusData = (item) => {
    const today = new Date();
    let status = "Available";
    let topBg = "bg-blue-600";
    // Available items: green action button with 'Borrow Now'
    let buttonClass = "bg-green-600 hover:bg-green-700";
    let buttonText = "Borrow Now";
    let textColor = "text-green-600";

    const reservedUntilDate = item.reservedUntil ? new Date(item.reservedUntil) : null;
    
    // Check if item is borrowed (only if status is explicitly "borrowed" and no return date)
    if (item.status === "borrowed" && !item.returnedAt) {
        status = "Already Borrowed";
        topBg = "bg-red-500";
        buttonClass = "bg-gray-400 cursor-not-allowed";
        buttonText = "Already Borrowed";
        textColor = "text-red-600";
    }
    // Pending reservation (someone requested but owner hasn't approved yet)
    else if (item.status === 'pending') {
        status = 'Pending';
        topBg = 'bg-yellow-600';
        buttonClass = 'bg-yellow-500 cursor-not-allowed';
        buttonText = 'Pending Approval';
        textColor = 'text-yellow-700';
    }
    // Reserved after owner approved
    else if (item.status === 'reserved') {
        status = 'Already Borrowed';
        topBg = 'bg-purple-600';
        buttonClass = 'bg-gray-400 cursor-not-allowed';
        buttonText = 'Already Borrowed';
        textColor = 'text-gray-600';
    }
    // Check if item is available (either no status or status is "available" or has been returned)
    else if (!item.status || item.status === "available" || item.returnedAt) {
        status = "Available";
        topBg = "bg-green-600";
        buttonClass = "bg-green-600 hover:bg-green-700";
        buttonText = "Borrow Now";
        textColor = "text-green-600";
    }
    else if (reservedUntilDate && reservedUntilDate > today) {
        status = "Reserved";
        topBg = "bg-purple-600";
        buttonClass = "bg-yellow-500 hover:bg-yellow-600";
        buttonText = "Request to Borrow"; 
        textColor = "text-yellow-600";
    }
    else if (item.status === "unavailable") {
        status = "Unavailable";
        topBg = "bg-gray-400";
        buttonClass = "bg-gray-400 cursor-not-allowed";
        buttonText = "Unavailable";
        textColor = "text-red-600";
    }
    
    return { 
        status, 
        topBg, 
        buttonClass, 
        buttonText, 
        textColor, 
        isReserved: status === "Reserved", 
        isUnavailable: status === "Unavailable",
        isBorrowed: status === "Already Borrowed"
    };
};
// ----------------------------------------------------

const ItemCard = ({ item, onBorrowClick, onDeleteItem, onReturnItem }) => { 
  const navigate = useNavigate();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showMenu, setShowMenu] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false); 
  const menuRef = useRef(null);
  const totalImages = item.images ? item.images.length : 0;
  
    const { status, topBg, buttonClass, buttonText, textColor, isReserved, isUnavailable, isBorrowed } = getStatusData(item);
  
  const rating = item.rating || 4.8; 
  const condition = item.condition || "Good";
  const ownerName = item.owner?.name || "Jane Doe"; 
  
  const reservedUntilDate = item.reservedUntil ? 
    new Date(item.reservedUntil).toLocaleDateString('en-GB', { year: 'numeric', month: '2-digit', day: '2-digit' }).replace(/\//g, '-') 
    : null;

  // Check ownership based on authenticated user
  const currentUser = auth?.currentUser;
  const isMyItem = (currentUser && item.ownerId && currentUser.uid === item.ownerId) || ownerName === "You"; 

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowMenu(false);
      }
    };

    if (showMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showMenu]); 

  const goToNext = (e) => { e.stopPropagation(); setCurrentImageIndex((prevIndex) => (prevIndex + 1) % totalImages); };
  const goToPrev = (e) => { e.stopPropagation(); setCurrentImageIndex((prevIndex) => (prevIndex - 1 + totalImages) % totalImages); };

  // EDIT HANDLER: Navigates to the edit page (to open the card for editing)
  const handleEdit = (e) => {
    e.stopPropagation();
    setShowMenu(false);
    // 🔴 FIX: Navigate to a dedicated edit route with the item ID
    navigate(`/edit-item/${item.id}`); 
  };

  // RETURN HANDLER: Marks item as returned so it can be borrowed again
  const handleReturn = (e) => {
    e.stopPropagation();
    setShowMenu(false);
    if (onReturnItem) {
      onReturnItem(item.id);
    }
  };

  // DELETE HANDLER: Shows confirmation pop up
  const handleDelete = (e) => {
    e.stopPropagation();
    setShowMenu(false);
    setShowDeleteConfirm(true); 
  };

  // MANAGE MENU TOGGLE: Opens/closes the three dots menu
  const handleManageToggle = (e) => {
    e.stopPropagation();
    setShowMenu(!showMenu);
  };
  
  // CONFIRM DELETE HANDLER: Calls the parent function to delete the item
  const confirmDelete = (e) => {
    e.stopPropagation();
    if (onDeleteItem) {
        onDeleteItem(item.id); 
    }
    setShowDeleteConfirm(false);
  };

    return (
        <div id={`item-${item.id}`} className="w-full bg-white rounded-lg shadow-xl overflow-hidden transform hover:scale-[1.01] transition-transform duration-200">
      
      {/* 1. Image Slider Section (Colored Top) */}
      <div className={`relative h-48 ${topBg} text-white p-4`}> 
        
        {totalImages > 0 && item.images[currentImageIndex] ? (
          <div className="absolute inset-0 z-0">
             <img 
                src={item.images[currentImageIndex]} 
                alt={item.title} 
                className="w-full h-full object-cover" 
            />
            <div className="absolute inset-0 bg-black opacity-20"></div>
          </div>
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-xl font-bold p-4 opacity-50">
            No Image
          </div>
        )}

        <div className="relative z-10 h-full flex flex-col justify-between">
            
            {/* Top Row: Your Item Label and Three-Dots Menu */}
            <div className="flex justify-between items-start w-full">
                {isMyItem ? (
                    <span className="bg-indigo-700 text-white text-xs font-semibold px-3 py-1 rounded-full shadow-md">
                        Your Item
                    </span>
                ) : (
                    <span></span>
                )}

                {isMyItem && (
                    <div className="relative" ref={menuRef}>
                        <button
                            onClick={handleManageToggle}
                            className="p-2 rounded-full bg-black bg-opacity-40 hover:bg-opacity-70 transition"
                            aria-label="Manage Item Menu"
                        >
                            <FaEllipsisV className="w-4 h-4" />
                        </button>
                        
                        {/* Dropdown Menu */}
                        {showMenu && (
                            <div className="absolute right-0 mt-2 w-40 bg-white rounded-lg shadow-xl overflow-hidden text-gray-800 z-20">
                                <button onClick={handleEdit} className="flex items-center px-4 py-2 text-sm w-full text-left hover:bg-gray-100">
                                    <FaPencilAlt className="w-3 h-3 mr-2" /> Edit
                                </button>
                                {(item.status === 'borrowed' && !item.returnedAt) && (
                                  <button onClick={handleReturn} className="flex items-center px-4 py-2 text-sm w-full text-left hover:bg-gray-100 text-green-600">
                                      <FaTools className="w-3 h-3 mr-2" /> Mark as Returned
                                  </button>
                                )}
                                <button onClick={handleDelete} className="flex items-center px-4 py-2 text-sm w-full text-left hover:bg-gray-100 text-red-600">
                                    <FaTrashAlt className="w-3 h-3 mr-2" /> Delete
                                </button>
                                <button onClick={(e) => { e.stopPropagation(); setShowMenu(false); }} className="flex items-center px-4 py-2 text-sm w-full text-left hover:bg-gray-100 border-t">
                                    Cancel
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Navigation Buttons */}
            {totalImages > 1 && (
                <>
                    <button onClick={goToPrev} className="absolute left-0 top-1/2 transform -translate-y-1/2 p-2 rounded-full bg-black bg-opacity-40 hover:bg-opacity-70 transition"> <FaChevronLeft className="w-4 h-4" /> </button>
                    <button onClick={goToNext} className="absolute right-0 top-1/2 transform -translate-y-1/2 p-2 rounded-full bg-black bg-opacity-40 hover:bg-opacity-70 transition"> <FaChevronRight className="w-4 h-4" /> </button>
                </>
            )}

            {/* Navigation Dots (kept in the colored area) */}
            <div className="mt-auto pb-2">
                {totalImages > 1 && (
                    <div className="flex justify-center space-x-1 mt-2">
                        {item.images.slice(0, 5).map((_, i) => (
                            <div key={i} className={`w-2 h-2 rounded-full ${i === currentImageIndex ? 'bg-white' : 'bg-white opacity-50'}`}></div>
                        ))}
                    </div>
                )}
            </div>
        </div>
      </div>

      {/* 2. Card Body Section */}
      <div className="p-4 space-y-3">
        
        {/* Title and Description */}
        <div>
            <h3 className="font-bold text-xl line-clamp-1 text-gray-800">{item.title}</h3>
            <p className="text-sm text-gray-500 line-clamp-2">{item.description}</p>
        </div>

        {/* Status, Rating, Owner, Condition (as before) */}
        <div className="flex justify-between items-center text-sm"> {/* Status & Rating */}
            <div className={`flex items-center space-x-1 font-semibold ${textColor}`}>
                {isUnavailable ? (
                    <span className="flex items-center"><FaTimes className="w-4 h-4 text-red-500 mr-1" /> Unavailable</span>
                ) : isBorrowed ? (
                    <span className="flex items-center"><FaTimes className="w-4 h-4 text-red-500 mr-1" /> Already Borrowed</span>
                ) : isReserved ? (
                    <span className="flex items-center"><AiOutlineClockCircle className="w-4 h-4 mr-1 text-gray-500" /> Already Borrowed</span>
                ) : (
                    <span className="flex items-center"><span className="text-green-500 text-xl">✅</span> Available</span>
                )}
            </div>
            <div className="flex items-center space-x-1 text-yellow-500 font-semibold">
                <span>{rating}</span><FaStar className="w-3 h-3" />
            </div>
        </div>

        <div className="text-sm text-gray-700 space-y-1"> {/* Owner & Condition */}
            <p className="flex items-center"><FaUserAlt className="w-3 h-3 text-indigo-500 mr-2" /><span className="text-gray-500 mr-1">Owner:</span><span className="font-medium">{ownerName}</span></p>
            <p className="flex items-center"><FaTools className="w-3 h-3 text-indigo-500 mr-2" /><span className="text-gray-500 mr-1">Condition:</span><span className="font-medium">{condition}</span></p>
            {(isReserved || isUnavailable) && reservedUntilDate && (<p className="flex items-center"><AiOutlineClockCircle className="w-3 h-3 mr-2 text-yellow-700" /><span className="text-gray-500 mr-1">Reserved Until:</span><span className="font-medium text-yellow-700">{reservedUntilDate}</span></p>)}
        </div>

        {/* 3. Action Button: Conditional Rendering */}
                {(() => {
                        // For owners: disable manage button, use three dots for edit
                        // For others: show appropriate button text and allow borrow requests
                        const isOwner = isMyItem;
                        const actionClass = isOwner ? 'bg-gray-400 cursor-not-allowed' : buttonClass;
                        const actionText = isOwner ? 'Your Item' : buttonText;
                        const disabled = isOwner || (!isOwner && (isUnavailable || isBorrowed)); // Disable manage for owners too

                        return (
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    
                                    if (isOwner || disabled) return; // Don't allow click for owners
                                    
                                    if (onBorrowClick) {
                                        onBorrowClick(item);
                                    } else {
                                        navigate(`/item/${item.id}`);
                                    }
                                }}
                                className={`w-full py-2 rounded-lg font-semibold text-white transition duration-200 ${actionClass}`}
                                disabled={disabled}
                            >
                                {actionText}
                            </button>
                        );
                })()}
      </div>
      
      {/* 4. DELETE CONFIRMATION MODAL (Full-screen Pop-up) */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 p-4" onClick={(e) => e.stopPropagation()}>
            <div className="bg-white rounded-xl shadow-2xl max-w-sm w-full p-6 space-y-4">
                <h4 className="text-lg font-bold text-gray-800">Confirm Deletion</h4>
                <p className="text-gray-600">Are you sure you want to delete "<span className="font-semibold">{item.title}</span>"? This action cannot be undone.</p>
                
                <div className="flex justify-end gap-3">
                    <button 
                        onClick={(e) => { e.stopPropagation(); setShowDeleteConfirm(false); }}
                        className="px-4 py-2 text-sm font-semibold rounded-lg text-gray-700 bg-gray-200 hover:bg-gray-300 transition"
                    >
                        Cancel
                    </button>
                    <button 
                        onClick={confirmDelete} // 🔴 FIX: This now correctly calls the confirmDelete function.
                        className="px-4 py-2 text-sm font-semibold rounded-lg text-white bg-red-600 hover:bg-red-700 transition"
                    >
                        Yes, Delete
                    </button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

export default ItemCard;