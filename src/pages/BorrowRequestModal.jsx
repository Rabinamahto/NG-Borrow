// BorrowRequestModal.jsx

import React, { useState } from 'react';
import { auth } from '../firebase';
import { FaUserAlt, FaTimes } from 'react-icons/fa';
import { AiOutlineClockCircle } from 'react-icons/ai';

const BorrowRequestModal = ({ item, onClose, onSubmit }) => {
    // Use Firebase auth directly 
    const currentUser = auth?.currentUser;
    const myUser = {
        name: currentUser?.displayName || currentUser?.email || 'Anonymous',
        username: currentUser?.email ? `@${currentUser.email.split('@')[0]}` : '@anon',
        uid: currentUser?.uid || null,
        email: currentUser?.email || null,
    };

  const owner = item.owner || { name: "Alex Smith", username: "@asmith" };
  const availableUntilDate = item.reservedUntil || "2025-12-15"; 

  const [reason, setReason] = useState("");
  const [mobile, setMobile] = useState("");
  const [aadhaar, setAadhaar] = useState("");
  const [borrowDate, setBorrowDate] = useState("");
  const [returnDate, setReturnDate] = useState("");
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleFormSubmit = (e) => {
    e.preventDefault();
    setError("");

    // Simple validation
    if (!reason.trim()) return setError("Reason for borrowing is required.");
    if (!mobile || mobile.length !== 10) return setError("Please enter a valid 10-digit Mobile Number.");
    if (!borrowDate || !returnDate) return setError("Required Borrow Date and Return Date are necessary.");
    if (!acceptedTerms) return setError("You must agree to the terms.");

    setSubmitting(true);
    
    // Simulate API/Local Storage submission
    setTimeout(() => {
        const requestData = {
            itemId: item.id,
            borrower: myUser,
            borrowerId: myUser.uid || null,
            borrowerEmail: myUser.email || null,
            reason,
            mobile,
            aadhaar,
            borrowDate,
            returnDate,
            timestamp: new Date().toISOString(),
        };

        // Prevent owner from requesting their own item
        const ownerId = item.ownerId || item.owner?.id || null;
        if (ownerId && myUser.uid && ownerId === myUser.uid) {
            setError('You cannot request to borrow your own item.');
            setSubmitting(false);
            return;
        }

        onSubmit(requestData); 

        setSubmitting(false);
        // onClose(); // onSubmit will usually close the modal in the parent component
    }, 1500);
  };

  const formatDate = (dateString) => {
      if (!dateString) return "";
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' });
  };
  
    return (
        // align to start and add padding-top so modal appears below header (gives a gap)
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-start justify-center z-50 p-4 pt-20">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden transform transition-all mt-6">
        
        {/* Modal Header */}
        <div className="p-5 border-b flex justify-between items-center">
            <h3 className="text-xl font-bold text-gray-800">Borrow Request: <span className="text-indigo-600">{item.title}</span></h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                <FaTimes className="w-5 h-5" />
            </button>
        </div>

                {/* Modal Body (Form) */}
                <div className="max-h-[70vh] overflow-y-auto">
                    <form onSubmit={handleFormSubmit} className="p-6 space-y-5">
            
            {/* User and Owner Profile Boxes */}
            <div className="flex justify-between gap-3 text-sm">
                <div className="flex-1 p-3 bg-indigo-50 border border-indigo-200 rounded-lg text-center">
                    <FaUserAlt className="w-4 h-4 text-indigo-600 mx-auto mb-1" />
                    <p className="font-semibold text-gray-800">My Name: {myUser.name}</p>
                    <p className="text-xs text-indigo-500">Username: {myUser.username}</p>
                </div>
                <div className="flex-1 p-3 bg-white border rounded-lg text-center">
                    <FaUserAlt className="w-4 h-4 text-gray-500 mx-auto mb-1" />
                    <p className="font-semibold text-gray-800">Owner: {owner.name}</p>
                    <p className="text-xs text-gray-500">{owner.username}</p>
                </div>
            </div>

            {/* Availability Alert */}
            <div className="p-3 bg-yellow-100 border-l-4 border-yellow-500 rounded-lg flex items-center space-x-2">
                <AiOutlineClockCircle className="w-5 h-5 text-yellow-600" />
                <p className="text-sm text-yellow-800">
                    Owner says item is available until: <span className="font-semibold">{formatDate(availableUntilDate)}</span>
                </p>
            </div>

            {/* Error Message */}
            {error && <div className="text-red-600 text-sm">{error}</div>}

            {/* Reason for Borrowing */}
            <div>
                <label className="flex items-center text-sm font-medium text-gray-700 mb-1">
                    <input type="checkbox" checked={true} readOnly className="w-4 h-4 text-indigo-600 border-gray-300 rounded mr-2" />
                    Why do you need this item?
                </label>
                <textarea
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    className="w-full border border-gray-300 p-3 rounded-lg focus:border-indigo-500 focus:ring-indigo-500"
                    rows={3}
                    placeholder="Reason for borrowing"
                />
            </div>

            {/* Mobile and Aadhaar Numbers */}
            <div className="flex gap-4">
                <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700">Mobile Number:</label>
                    <input
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        value={mobile}
                        onChange={(e) => setMobile(e.target.value.replace(/\D/g, '').slice(0, 10))}
                        className="w-full border-b border-gray-300 p-2 focus:border-indigo-500"
                        placeholder="10-digit number"
                        maxLength={10}
                    />
                </div>
                <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700">Aadhaar Number:</label>
                    <input
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        value={aadhaar}
                        onChange={(e) => setAadhaar(e.target.value.replace(/\D/g, '').slice(0, 12))}
                        className="w-full border-b border-gray-300 p-2 focus:border-indigo-500"
                        placeholder="12-digit Aadhaar"
                        maxLength={12}
                    />
                </div>
            </div>

            {/* Required Dates */}
            <div className="flex gap-4">
                <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700">Required Borrow Date:</label>
                    <div className="relative">
                        <input
                            type="date"
                            value={borrowDate}
                            onChange={(e) => setBorrowDate(e.target.value)}
                            className="w-full border-b border-gray-300 p-2 pr-8 focus:border-indigo-500"
                            placeholder="MM/DD/YYYY"
                        />
                    </div>
                </div>
                <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700">Return Date:</label>
                    <div className="relative">
                        <input
                            type="date"
                            value={returnDate}
                            onChange={(e) => setReturnDate(e.target.value)}
                            className="w-full border-b border-gray-300 p-2 pr-8 focus:border-indigo-500"
                            placeholder="MM/DD/YYYY"
                        />
                    </div>
                </div>
            </div>

            {/* Terms Checkbox */}
            <div className="flex items-start">
                <input
                    type="checkbox"
                    checked={acceptedTerms}
                    onChange={(e) => setAcceptedTerms(e.target.checked)}
                    className="mt-1 w-4 h-4 text-indigo-600 border-gray-300 rounded"
                />
                <label className="ml-2 text-sm text-gray-700">
                    I agree to responsibly use and return the item by the required return date.
                </label>
            </div>

                        {/* Send Request Button */}
                        <button 
                                type="submit" 
                                disabled={submitting} 
                                className="w-full py-3 bg-indigo-600 text-white font-bold rounded-lg shadow-md hover:bg-indigo-700 transition duration-150 flex items-center justify-center gap-2 mt-6 mb-4"
                        >
                                <span className="text-xl">✈️</span> {submitting ? "Sending..." : "Send Borrow Request"}
                        </button>
                    </form>
                </div>
            </div>
    </div>
  );
};

export default BorrowRequestModal;