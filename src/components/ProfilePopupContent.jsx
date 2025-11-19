import React from "react";
import { Package, BookOpen, Star, LogOut, Edit2, MapPin } from "lucide-react";

const ProfilePopupContent = ({ user, handleClose, navigate, openEditModal }) => {
  const handleNavigation = (path) => {
    navigate(path);
    handleClose();
  };

  return (
    <div
      className="absolute right-0 mt-2 w-72 rounded-xl shadow-2xl bg-white ring-1 ring-gray-200 z-50 transition duration-150 transform origin-top-right animate-in fade-in zoom-in-95 overflow-hidden"
      role="menu"
    >
      <div className="p-6 text-center">
        <h2 className="text-lg font-bold text-gray-800 mb-4">Your Profile</h2>

        <div className="mx-auto w-16 h-16 rounded-full bg-[#3a75c4] text-white flex items-center justify-center text-2xl font-bold mb-3 overflow-hidden">
          {user.profileImage ? (
            <img
              src={user.profileImage}
              alt={user.name}
              className="w-full h-full object-cover"
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = `https://placehold.co/100x100/3a75c4/FFFFFF?text=${user.initials}`;
              }}
            />
          ) : (
            user.initials || user.name.split(" ").map((n) => n[0]).join("")
          )}
        </div>

        <h3 className="text-md font-semibold text-gray-800">{user.name}</h3>
        <p className="text-xs text-gray-500 flex items-center justify-center mt-1 mb-4">
          <MapPin className="w-3 h-3 mr-1 text-red-500" />
          {user.location}
        </p>

        <button
          onClick={openEditModal}
          className="inline-flex items-center justify-center px-3 py-1 text-xs font-medium text-green-700 bg-green-100 rounded-full hover:bg-green-200 transition-colors shadow-sm"
        >
          <Edit2 className="w-3 h-3 mr-1" />
          Quick Edit Name/Image
        </button>

        <button
          onClick={() => handleNavigation("/profile")}
          className="block text-xs text-[#3a75c4] mt-2 hover:underline mx-auto"
        >
          View Full Profile
        </button>
      </div>

      <div className="h-px bg-gray-100 mx-6 my-3"></div>

      <div className="flex justify-around text-center px-6 pb-4">
        <div className="flex flex-col items-center">
          <Package className="w-5 h-5 text-blue-500 mb-1" />
          <span className="text-xl font-bold text-gray-800">{user.itemsShared}</span>
          <span className="text-xs text-gray-500">Shared</span>
        </div>
        <div className="flex flex-col items-center">
          <BookOpen className="w-5 h-5 text-red-500 mb-1" />
          <span className="text-xl font-bold text-gray-800">{user.itemsBorrowed}</span>
          <span className="text-xs text-gray-500">Borrowed</span>
        </div>
        <div className="flex flex-col items-center">
          <Star className="w-5 h-5 text-yellow-500 mb-1 fill-yellow-500" />
          <span className="text-xl font-bold text-gray-800">{user.rating}</span>
          <span className="text-xs text-gray-500">Rating</span>
        </div>
      </div>

      <div className="p-4 pt-0">
        <button
          onClick={() => handleNavigation("/logout")}
          className="w-full inline-flex items-center justify-center px-4 py-2 text-sm font-semibold text-red-600 bg-red-100 rounded-lg hover:bg-red-200 transition-colors shadow-sm"
        >
          <LogOut className="w-4 h-4 mr-2" />
          Log Out
        </button>
      </div>
    </div>
  );
};

export default ProfilePopupContent;
