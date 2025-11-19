import React, { useState, useEffect } from "react";
import EditProfileModal from "../components/EditProfileModal";
import { useAuth } from "../auth.jsx";

const Profile = () => {
  const { user: authUser } = useAuth() ?? {};
  const [showEdit, setShowEdit] = useState(false);

  const [localUser, setLocalUser] = useState(() => {
    try {
      const saved = localStorage.getItem("userProfile");
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return {
      uid: authUser?.uid ?? null,
      displayName: authUser?.displayName ?? authUser?.name ?? "",
      email: authUser?.email ?? "",
      photoURL: authUser?.photoURL ?? authUser?.profileImage ?? "",
    };
  });

  useEffect(() => {
    if (!authUser) return;
    setLocalUser((prev) => ({
      uid: prev.uid ?? authUser.uid,
      displayName: prev.displayName || authUser.displayName || authUser.name || "",
      email: prev.email || authUser.email || "",
      photoURL: prev.photoURL || authUser.photoURL || authUser.profileImage || "",
    }));
  }, [authUser]);

  useEffect(() => {
    try {
      localStorage.setItem("userProfile", JSON.stringify(localUser));
    } catch (e) {}
  }, [localUser]);

  const handleSave = async (updatedUser) => {
    const merged = {
      ...localUser,
      ...updatedUser,
      displayName: updatedUser.displayName ?? updatedUser.name ?? localUser.displayName,
      photoURL: updatedUser.photoURL ?? updatedUser.profileImage ?? localUser.photoURL,
    };
    setLocalUser(merged);
    try {
      localStorage.setItem("userProfile", JSON.stringify(merged));
    } catch (e) {}
    return merged;
  };

  const openEdit = (e) => {
    try { e?.preventDefault?.(); } catch {}
    try { e?.stopPropagation?.(); } catch {}
    setShowEdit(true);
  };

  return (
    <div className="min-h-screen p-6 bg-gray-50">
      <div className="max-w-3xl mx-auto bg-white rounded-xl shadow px-6 py-8">
        <div className="flex items-center gap-6">
          <img
            src={localUser?.photoURL || "/default-avatar.png"}
            alt="Profile"
            className="w-20 h-20 rounded-full object-cover ring-2 ring-indigo-200"
          />
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-800">
              {localUser?.displayName || localUser?.name || "Unnamed"}
            </h1>
            <p className="text-sm text-gray-500">{localUser?.email}</p>
          </div>

          <div>
            <button
              type="button"
              onClick={openEdit}
              style={{ touchAction: "manipulation" }}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
              aria-label="Edit Profile"
            >
              Edit Profile
            </button>
          </div>
        </div>

        <div className="mt-6 text-sm text-gray-600">{/* additional profile info */}</div>
      </div>

      {showEdit && (
        <EditProfileModal
          user={localUser}
          setUser={setLocalUser}
          closeModal={() => setShowEdit(false)}
          onSave={handleSave}
        />
      )}
    </div>
  );
};

export default Profile;