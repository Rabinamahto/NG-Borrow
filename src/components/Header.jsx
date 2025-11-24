



import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "../auth.jsx";
import { auth } from "../firebase";
import { Link, useNavigate } from "react-router-dom";
import { User, MessageSquare, Bell } from "lucide-react";
import ProfilePopupContent from "./ProfilePopupContent";
import EditProfileModal from "./EditProfileModal";

const defaultUser = {
  name: "Alex Johnson",
  initials: "AJ",
  location: "University Main Campus - Block B",
  itemsShared: 12,
  itemsBorrowed: 8,
  profileImage: "",
};

const Header = () => {
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isProfilePopupOpen, setIsProfilePopupOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [user, setUser] = useState(defaultUser);
  const { user: authUser } = useAuth();

  const profileRef = useRef(null);
  const navigate = useNavigate();

  const navItems = [
    { name: "Home", path: "/" },
    { name: "Explore", path: "/browse" },
    { name: "Post Item", path: "/post" },
    { name: "Requests", path: "/borrow-requests" },
    { name: <MessageSquare className="w-6 h-6" />, path: "/chat" },
    { name: <Bell className="w-6 h-6" />, path: "/notifications" },
  ];

  // Keep header user in sync with Firebase auth when available, fallback to localStorage
  useEffect(() => {
    if (authUser) {
      const name = authUser.displayName || authUser.email?.split("@")[0] || defaultUser.name;
      const initials = (name || "")
        .split(" ")
        .filter(Boolean)
        .map((n) => n[0].toUpperCase())
        .join("");
      const profileImage = authUser.photoURL || "";

      const derived = {
        ...defaultUser,
        name,
        initials,
        profileImage,
        displayName: authUser.displayName || name,
        photoURL: authUser.photoURL || "",
      };

      setUser(derived);
      try {
        localStorage.setItem("userProfile", JSON.stringify(derived));
      } catch (e) {}
      return;
    }

    const storedUser = localStorage.getItem("userProfile");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    } else {
      localStorage.setItem("userProfile", JSON.stringify(defaultUser));
      setUser(defaultUser);
    }
  }, [authUser]);

  const openEditModal = () => {
    setIsProfilePopupOpen(false);
    setIsEditModalOpen(true);
  };

  const closeEditModal = () => setIsEditModalOpen(false);

  return (
    <header className="w-full bg-white shadow-lg sticky top-0 z-[60]">
      <div className="max-w-7xl mx-auto flex justify-between items-center py-4 px-4 md:px-8">
        <div className="text-2xl font-extrabold text-[#3a75c4] cursor-pointer">
          NGJugaad
        </div>

        {/* Desktop Menu */}
        <nav className="hidden md:flex items-center space-x-6 text-gray-700">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className="text-base font-medium transition-all duration-300 rounded-lg p-2 hover:bg-[#3a75c4] hover:text-white"
            >
              {item.name}
            </Link>
          ))}

          {/* Profile Icon */}
          <div className="relative ml-4" ref={profileRef}>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsProfilePopupOpen((prev) => !prev);
              }}
              className={`p-2 rounded-full transition-all duration-200 ${
                isProfilePopupOpen
                  ? "bg-[#3a75c4] text-white"
                  : "text-gray-600 hover:bg-[#3a75c4] hover:text-white"
              }`}
            >
              {/* show avatar image when available, otherwise initials, otherwise icon */}
              {user.profileImage ? (
                <img
                  src={user.profileImage}
                  alt={user.name}
                  className="w-6 h-6 rounded-full object-cover"
                />
              ) : user.initials ? (
                <div className="w-6 h-6 rounded-full bg-gray-200 text-xs font-semibold flex items-center justify-center">
                  {user.initials}
                </div>
              ) : (
                <User className="w-6 h-6" />
              )}
            </button>

            {isProfilePopupOpen && (
              <ProfilePopupContent
                user={user}
                handleClose={() => setIsProfilePopupOpen(false)}
                navigate={navigate}
                openEditModal={openEditModal}
              />
            )}
          </div>
        </nav>

        {/* Mobile Navigation */}
        <div className="md:hidden flex items-center space-x-2">
          {/* Profile */}
          <div className="relative" ref={profileRef}>
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (isMobileOpen) setIsMobileOpen(false);
                setIsProfilePopupOpen((prev) => !prev);
              }}
              className={`p-2 rounded-full transition-all duration-200 ${
                isProfilePopupOpen
                  ? "bg-[#3a75c4] text-white"
                  : "text-gray-600 hover:bg-[#3a75c4] hover:text-white"
              }`}
            >
              <User className="w-6 h-6" />
            </button>

            {isProfilePopupOpen && (
              <ProfilePopupContent
                user={user}
                handleClose={() => setIsProfilePopupOpen(false)}
                navigate={navigate}
                openEditModal={openEditModal}
              />
            )}
          </div>

          {/* Burger Menu */}
          <button
            className="text-gray-700 p-2"
            onClick={() => {
              if (isProfilePopupOpen) setIsProfilePopupOpen(false);
              setIsMobileOpen(!isMobileOpen);
            }}
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d={
                  isMobileOpen
                    ? "M6 18L18 6M6 6l12 12"
                    : "M4 6h16M4 12h16M4 18h16"
                }
              />
            </svg>
          </button>
        </div>
      </div>

      {isMobileOpen && (
        <nav className="md:hidden bg-white shadow-lg border-t border-gray-200">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className="block text-gray-700 px-4 py-2 hover:bg-[#3a75c4] hover:text-white"
              onClick={() => setIsMobileOpen(false)}
            >
              {item.name}
            </Link>
          ))}
        </nav>
      )}

      {isEditModalOpen && (
        <EditProfileModal
          user={user}
          setUser={setUser}
          closeModal={closeEditModal}
        />
      )}
    </header>
  );
};

export default Header;