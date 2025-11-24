import React, { useState } from "react";
import BrowseItems from "./BrowseItems";
import PostItem from "./PostItem";

// --- Initial Mock Data ---
const initialItems = [
  { id: 1, name: "Introduction to Algorithms", category: "Books", status: "Available", reservedUntil: null, image: "https://placehold.co/400x250/2563EB/ffffff?text=Book+Cover", detail: "A classic text for computer science students." },
  { id: 2, name: "MacBook Pro Charger", category: "Electronics", status: "Available", reservedUntil: null, image: "https://placehold.co/400x250/059669/ffffff?text=Power+Adapter", detail: "Original 87W USB-C power adapter." },
  { id: 3, name: "Winter Jacket (L)", category: "Clothing", status: "Unavailable", reservedUntil: "2025-10-06", image: "https://placehold.co/400x250/DC2626/ffffff?text=Unavailable", detail: "Heavy-duty thermal jacket, size Large." },
  { id: 4, name: "Professional Camera Tripod", category: "Electronics", status: "Available", reservedUntil: null, image: "https://placehold.co/400x250/9333EA/ffffff?text=Tripod", detail: "Flexible and durable tripod for professional use." },
  { id: 5, name: "Soccer Ball (Size 5)", category: "Sports", status: "Reserved", reservedUntil: "2025-10-03", image: "https://placehold.co/400x250/F59E0B/ffffff?text=Sports+Gear", detail: "FIFA approved match ball." },
];

const AppContainer = () => {
  const [items, setItems] = useState(initialItems);
  const [currentPage, setCurrentPage] = useState('browse'); // 'browse' or 'post'

  const handleAddItem = (newItem) => {
    const newId = items.length > 0 ? Math.max(...items.map(i => i.id)) + 1 : 1;
    
    const itemWithId = {
      ...newItem,
      id: newId,
      status: newItem.reservedUntil ? 'Reserved' : 'Available',
    };
    
    setItems(prevItems => [itemWithId, ...prevItems]);
    setCurrentPage('browse');
    console.log(`New item posted: ${itemWithId.name}`);
  };

  return (
    <div className="min-h-screen bg-gray-100 font-inter">
      <nav className="bg-white shadow-md p-4 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold text-indigo-600">ShareMate</h1>
          <div className="space-x-4">
            <button
              className={`px-4 py-2 rounded-lg font-semibold transition ${
                currentPage === 'browse' ? 'bg-indigo-600 text-white shadow-md' : 'text-gray-600 hover:bg-gray-100'
              }`}
              onClick={() => setCurrentPage('browse')}
            >
              Browse Items
            </button>
            <button
              className={`px-4 py-2 rounded-lg font-semibold transition ${
                currentPage === 'post' ? 'bg-green-500 text-white shadow-md' : 'text-gray-600 hover:bg-gray-100'
              }`}
              onClick={() => setCurrentPage('post')}
            >
              Post Item
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto p-4 sm:p-8">
        {currentPage === 'browse' ? (
          <BrowseItems initialItems={items} showSearch={false} />
        ) : (
          <PostItem onPost={handleAddItem} />
        )}
      </div>
    </div>
  );
};

export default AppContainer;
