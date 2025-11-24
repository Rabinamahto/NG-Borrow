import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { auth, db } from "../firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { signInAnonymously } from "firebase/auth";
// आपको react-icons इंस्टॉल करना पड़ सकता है: npm install react-icons
import { FaUpload } from "react-icons/fa"; 

// --- Helper Functions (Remains the same) ---

const readFileAsDataUrl = (file) =>
  new Promise((res, rej) => {
    const fr = new FileReader();
    fr.onload = () => res(fr.result);
    fr.onerror = rej;
    fr.readAsDataURL(file);
  });

const categories = ["Books", "Electronics", "Sports", "Home & Kitchen", "Other"]; // Categories list
const conditions = ["Like New", "Excellent", "Good", "Fair", "Poor"]; // Conditions list

// --------------------------------------------

const PostItem = () => {
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState(categories[0]);
  const [condition, setCondition] = useState(conditions[0]); // New state for Condition
  const [reservedUntil, setReservedUntil] = useState(""); // New state for Reserved Until
  const [images, setImages] = useState([]); // File[]
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const today = new Date().toISOString().split('T')[0];

  const handleFiles = (e) => {
    // अधिकतम 5 इमेज की सीमा लागू करें
    const selectedFiles = Array.from(e.target.files || []).slice(0, 5); 
    setImages(selectedFiles);
  };

  const saveToLocal = (item) => {
    try {
      const raw = localStorage.getItem("browseItems");
      const arr = raw ? JSON.parse(raw) : [];
      arr.unshift(item);
      localStorage.setItem("browseItems", JSON.stringify(arr));
    } catch (err) {
      console.error("saveToLocal error", err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!title.trim()) return setError("Title required");
    // Image validation (as shown in your UI)
    if (images.length === 0) return setError("Please upload at least one image.");
    // Reserved Until is required
    if (!reservedUntil) return setError("Please select a Reserved Until date.");

    setSaving(true);
    try {
      const imagesData = await Promise.all(
        images.map((f) => readFileAsDataUrl(f).catch(() => null))
      );
      
      const nowIso = new Date().toISOString();

      const baseItem = {
        title: title.trim(),
        description: description.trim(),
        category: category,
        condition: condition,
        reservedUntil: reservedUntil || null,
        images: imagesData.filter(Boolean),
        createdAt: nowIso,
      };

      // Try to save to Firestore when available so items are shared across browsers/users.
      // If no authenticated user exists, we'll still write the document and mark owner as 'Anonymous'.
      // Try to ensure we have an authenticated user so Firestore rules will pass.
      // For development: save to Firestore with data URLs if Storage upload fails.
      try {
        if (db) {
          if (!auth.currentUser) {
            try {
              await signInAnonymously(auth);
            } catch (e) {
              console.warn('Anonymous sign-in failed - will save locally', e);
            }
          }

          const user = auth?.currentUser;
          const ownerName = user ? (user.displayName || user.email || 'User') : 'Anonymous';
          const ownerId = user ? user.uid : null;

          // For development: use data URLs directly (skip Storage upload since billing not enabled)
          // In production you would upload to Storage and use download URLs
          let uploadedUrls = imagesData.filter(Boolean).slice(0, 3); // limit to 3 small images

          const docRef = await addDoc(collection(db, 'items'), {
            ...baseItem,
            images: uploadedUrls,
            ownerId,
            ownerName,
            anonymous: ownerId ? false : true,
            createdAt: serverTimestamp(),
          });

          // Save a local copy with Firestore id to keep local view responsive
          const item = { id: docRef.id, ...baseItem, images: uploadedUrls, owner: { name: ownerName }, ownerId };
          saveToLocal(item);
          setSaving(false);
          navigate('/browse');
          return;
        }
      } catch (err) {
        console.warn('Firestore save failed, falling back to localStorage', err);
      }

      // Fallback: save locally
      const user = auth?.currentUser;
      const ownerId = user ? user.uid : `local_${Date.now()}`;
      
      const item = {
        id: `item_${Date.now()}`,
        ...baseItem,
        owner: { name: 'You' },
        ownerId,
      };
      saveToLocal(item);
      setSaving(false);
      navigate('/browse');
    } catch (err) {
      console.error(err);
      setError("Failed to save item");
      setSaving(false);
    }
  };

  return (
    // 🔴 Max-width 3xl container and centered card
    <div className="max-w-3xl mx-auto p-4 sm:p-6 lg:p-8"> 
      <div className="bg-white rounded-xl shadow-2xl p-6 sm:p-10 border border-gray-100">
        
        {/* Header Section */}
        <div className="text-center mb-8">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-indigo-800">
            Share an Asset
          </h2>
          <p className="text-gray-500 mt-2">Lend resources easily within your community.</p>
        </div>

        {error && <div className="text-red-600 text-center mb-4 p-2 bg-red-50 rounded">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-6">

          {/* UPLOAD PHOTOS SECTION */}
          <div>
            <p className="font-medium text-gray-700 mb-2">UPLOAD PHOTOS ({images.length}/5)</p>
            <div className="flex flex-wrap gap-3">
              
              {/* Image Drop/Click Area */}
              <label 
                htmlFor="file-upload" 
                className={`w-28 h-28 flex flex-col items-center justify-center border-2 border-dashed rounded-lg cursor-pointer transition ${
                  images.length === 0 ? "border-red-400 bg-red-50" : "border-indigo-400 hover:border-indigo-600 bg-indigo-50"
                }`}
              >
                <FaUpload className="text-indigo-600 w-6 h-6" />
                <span className="text-sm font-medium text-indigo-600 mt-1">Add Photo</span>
                <input 
                  id="file-upload" 
                  type="file" 
                  accept="image/*" 
                  multiple 
                  onChange={handleFiles} 
                  className="hidden" 
                />
              </label>

              {/* Image Previews */}
              {images.map((f, i) => (
                <div key={i} className="w-28 h-28 overflow-hidden rounded-lg shadow-md relative">
                  <img 
                    src={URL.createObjectURL(f)} 
                    alt={`Preview ${i + 1}`} 
                    className="w-full h-full object-cover" 
                  />
                  <div className="absolute top-0 right-0 bg-indigo-600 text-white text-xs font-bold px-2 py-1 rounded-bl">
                    {i + 1}/5
                  </div>
                </div>
              ))}
            </div>

            {/* Important Note */}
            {images.length === 0 && (
              <p className="text-red-600 text-sm font-semibold mt-2">
                Important: Please upload at least one image to proceed.
              </p>
            )}
          </div>
          
          {/* ITEM TITLE */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Item Title</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full border-b border-gray-300 p-3 rounded-t-lg focus:border-indigo-500 focus:ring-0"
              placeholder="e.g. Organic Chemistry Textbook, 4th Edition"
            />
          </div>

          {/* CATEGORY (Dropdown as requested earlier) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
            <div className="relative">
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full border-b border-gray-300 p-3 pr-10 rounded-t-lg appearance-none bg-white focus:border-indigo-500 focus:ring-0"
              >
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>

              <svg
                className="pointer-events-none absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-600"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M6 9l6 6 6-6" />
              </svg>
            </div>
          </div>

          {/* DESCRIPTION */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full border border-gray-300 p-3 rounded-lg focus:border-indigo-500 focus:ring-indigo-500"
              rows={4}
              placeholder="Briefly describe the item and why you're sharing it."
            />
          </div>

          {/* CONDITION and RESERVED UNTIL (Side-by-side) */}
          <div className="flex gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">Condition</label>
              <div className="relative">
                <select
                  value={condition}
                  onChange={(e) => setCondition(e.target.value)}
                  className="w-full border-b border-gray-300 p-3 pr-10 rounded-t-lg appearance-none bg-white focus:border-indigo-500 focus:ring-0"
                >
                  {conditions.map((cond) => (
                    <option key={cond} value={cond}>
                      {cond}
                    </option>
                  ))}
                </select>

                <svg
                  className="pointer-events-none absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-600"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M6 9l6 6 6-6" />
                </svg>
              </div>
            </div>
            
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">Reserved Until</label>
              <input
                type="date"
                value={reservedUntil}
                onChange={(e) => setReservedUntil(e.target.value)}
                min={today}
                className="w-full border-b border-gray-300 p-3 rounded-t-lg focus:border-indigo-500 focus:ring-0"
                placeholder="mm/dd/yyyy"
                required
              />
            </div>
          </div>

          {/* Post Button */}
          <button 
            type="submit" 
            disabled={saving} 
            className="w-full py-3 bg-indigo-600 text-white font-bold rounded-lg shadow-md hover:bg-indigo-700 transition duration-150 flex items-center justify-center gap-2"
          >
            {/* 🔴 Post Item Button */}
            <span className="text-xl">+</span> {saving ? "Posting..." : "Post Item"}
          </button>

        </form>
      </div>
    </div>
  );
};

export default PostItem;