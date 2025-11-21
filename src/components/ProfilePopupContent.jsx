
import React from "react";

const ProfilePopupContent = ({ user, handleClose, openEditModal }) => {
  return (
    <div className="fixed inset-0 bg-black/40 flex justify-center items-center z-[80]">

      <div className="bg-white w-[350px] p-6 rounded-2xl shadow-xl relative">

        {/* Close Button */}
        <button
          className="absolute top-3 right-3 text-gray-600 hover:text-red-500"
          onClick={handleClose}
        >
          ✖
        </button>

        {/* Profile Image */}
        <div className="flex justify-center">
          <div className="w-24 h-24 rounded-full overflow-hidden bg-gray-200">
            {user.profileImage ? (
              <img
                src={user.profileImage}
                alt="Profile"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-xl font-bold">
                {user.initials}
              </div>
            )}
          </div>
        </div>

        <h2 className="text-center text-xl font-semibold mt-3">{user.name}</h2>

        <button
          onClick={openEditModal}
          className="w-full mt-5 bg-[#3a75c4] text-white py-2 rounded-lg hover:bg-[#2f63a8]"
        >
          Edit Profile
        </button>
      </div>
    </div>
  );
};

export default ProfilePopupContent;
