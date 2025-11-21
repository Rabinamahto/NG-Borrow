
import React, { useState } from "react";
import { auth } from "../firebase";
import { updateProfile } from "firebase/auth";

const EditProfileModal = ({ user, setUser, closeModal }) => {
  const [name, setName] = useState(user.name);
  const [image, setImage] = useState(user.profileImage);

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    const reader = new FileReader();

    reader.onload = () => {
      setImage(reader.result);
    };

    if (file) reader.readAsDataURL(file);
  };

  const saveChanges = () => {
    const updatedUser = { ...user, name, profileImage: image };

    (async () => {
      try {
        if (auth && auth.currentUser) {
          await updateProfile(auth.currentUser, {
            displayName: name || undefined,
            photoURL: image || undefined,
          });
        }
      } catch (err) {
        console.warn("Failed to update Firebase profile:", err);
      }

      const finalUser = {
        ...updatedUser,
        displayName: name,
        photoURL: image,
        initials: (name || "")
          .split(" ")
          .filter(Boolean)
          .map((n) => n[0]?.toUpperCase())
          .join("") || user.initials,
      };

      setUser(finalUser);

      try {
        localStorage.setItem("userProfile", JSON.stringify(finalUser));
      } catch (e) {}

      closeModal();
    })();
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex justify-center items-center z-[90]">
      
      <div className="bg-white p-6 w-[380px] rounded-xl shadow-xl relative">

        <button
          onClick={closeModal}
          className="absolute right-4 top-3 text-gray-600 hover:text-red-500"
        >
          ✖
        </button>

        <h2 className="text-xl font-bold mb-4 text-center">Edit Profile</h2>

        {/* Upload Image */}
        <div className="flex justify-center mb-4 relative">
          <label className="cursor-pointer relative group">

            {/* Profile Image */}
            <div className="w-24 h-24 rounded-full overflow-hidden bg-gray-200 border relative">
              {image ? (
                <img
                  src={image}
                  alt="Preview"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-xl font-semibold">
                  {user.initials}
                </div>
              )}
            </div>

            {/* ✏ Edit Icon */}
            <div className="absolute bottom-0 right-0 bg-black/60 text-white p-2 rounded-full shadow-md group-hover:bg-black transition">
              ✏️
            </div>

            {/* Hidden File Input */}
            <input type="file" className="hidden" onChange={handleImageUpload} />
          </label>
        </div>

        {/* Name Input */}
        <label className="block mb-1 font-medium">Name</label>
        <input
          type="text"
          className="w-full border p-2 rounded-lg mb-4"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />

        <button
          onClick={saveChanges}
          className="w-full bg-[#3a75c4] text-white py-2 rounded-lg hover:bg-[#2f63a8]"
        >
          Save Changes
        </button>
      </div>
    </div>
  );
};

export default EditProfileModal;