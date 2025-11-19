import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { Edit2, X, Check } from "lucide-react";

const EditProfileModal = ({ user = {}, setUser, closeModal, onSave }) => {
  const initialName = user.displayName ?? user.name ?? "";
  const initialImage = user.photoURL ?? user.profileImage ?? "";

  const [formData, setFormData] = useState({
    name: initialName,
    profileImage: initialImage,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [imgVisible, setImgVisible] = useState(!!initialImage);

  // detect touch devices
  const isTouch = typeof window !== "undefined" && (("ontouchstart" in window) || navigator.maxTouchPoints > 0);
  // ignore quick taps right after mount (helps some touch devices)
  const ignoreInitialClick = useRef(true);
  useEffect(() => {
    const t = setTimeout(() => {
      ignoreInitialClick.current = false;
    }, 300);
    return () => clearTimeout(t);
  }, []);

  // lock body scroll
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev || "";
    };
  }, []);

  useEffect(() => {
    setFormData({ name: initialName, profileImage: initialImage });
    setImgVisible(!!initialImage);
  }, [initialName, initialImage]);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") closeModal();
      if (e.key === "Enter") {
        e.preventDefault();
        handleSave();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData]);

  const handleSave = async () => {
    setError("");
    const name = (formData.name || "").trim();
    if (!name) {
      setError("Name cannot be empty.");
      return;
    }

    const updatedUser = {
      ...user,
      name,
      displayName: name,
      profileImage: formData.profileImage || "",
      photoURL: formData.profileImage || "",
      initials: name
        .split(" ")
        .filter(Boolean)
        .map((n) => n[0].toUpperCase())
        .join(""),
    };

    setSaving(true);
    try {
      if (typeof onSave === "function") {
        const result = await onSave(updatedUser);
        const finalUser = result && typeof result === "object" ? result : updatedUser;
        setUser?.(finalUser);
      } else {
        setUser?.(updatedUser);
        try { localStorage.setItem("userProfile", JSON.stringify(updatedUser)); } catch {}
      }
      setSaving(false);
      closeModal();
    } catch (err) {
      console.error("EditProfile save error:", err);
      setError(err?.message || "Save failed. Try again.");
      setSaving(false);
    }
  };

  // backdrop close: disable for touch devices to avoid accidental back/navigation
  const handleBackdropClick = (e) => {
    if (ignoreInitialClick.current) return;
    if (isTouch) return; // DO NOT close on backdrop for touch devices
    if (e.target !== e.currentTarget) return;
    closeModal();
  };

  const modal = (
    <div
      className="fixed inset-0 bg-black bg-opacity-60 z-[9999] flex items-center justify-center"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="bg-white p-6 rounded-xl shadow-2xl w-full max-w-sm mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center">
            <Edit2 className="w-5 h-5 mr-2 text-indigo-600" />
            Edit Profile
          </h2>
          <button
            onClick={closeModal}
            className="text-gray-500 hover:text-gray-700 p-1 rounded-full"
            type="button"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && <div className="text-sm text-red-600 mb-3">{error}</div>}

        <div className="space-y-4">
          <label className="block">
            <div className="text-sm font-medium text-gray-700 mb-1">Name</div>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData((p) => ({ ...p, name: e.target.value }))}
              className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400"
              autoFocus
            />
          </label>

          <label className="block">
            <div className="text-sm font-medium text-gray-700 mb-1">Profile Image URL</div>
            <input
              type="url"
              value={formData.profileImage}
              onChange={(e) => setFormData((p) => ({ ...p, profileImage: e.target.value }))}
              className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400"
              placeholder="https://..."
              onBlur={() => setImgVisible(!!formData.profileImage)}
            />
            {formData.profileImage && imgVisible && (
              <div className="mt-2 text-center">
                <img
                  src={formData.profileImage}
                  alt="Preview"
                  className="w-16 h-16 rounded-full object-cover mx-auto ring-2 ring-indigo-200"
                  onError={(e) => { setImgVisible(false); e.target.style.display = "none"; }}
                />
              </div>
            )}
          </label>
        </div>

        <div className="flex justify-end gap-3 mt-5">
          <button type="button" onClick={closeModal} className="px-4 py-2 border rounded" disabled={saving}>
            Cancel
          </button>

          <button
            type="button"
            onClick={handleSave}
            className="px-4 py-2 bg-indigo-600 text-white rounded disabled:opacity-60 flex items-center"
            disabled={saving || !formData.name.trim()}
          >
            <Check className="w-4 h-4 mr-2" />
            {saving ? "Saving..." : "Save"}
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(modal, document.body);
};

export default EditProfileModal;