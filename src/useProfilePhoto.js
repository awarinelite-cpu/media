// src/hooks/useProfilePhoto.js
// Upload and update profile photo via Firebase Storage + Firestore

import { useState } from "react";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { doc, updateDoc } from "firebase/firestore";
import { updateProfile } from "firebase/auth";
import { storage, db, auth } from "../firebase/firebase";

export function useProfilePhoto(userId) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState(null);

  async function uploadProfilePhoto(file) {
    if (!file || !userId) return null;

    // Validate: images only, max 2MB
    if (!file.type.startsWith("image/")) {
      setError("Please select an image file.");
      return null;
    }
    if (file.size > 2 * 1024 * 1024) {
      setError("Image must be under 2MB.");
      return null;
    }

    setUploading(true);
    setError(null);
    setProgress(0);

    try {
      const storageRef = ref(storage, `avatars/${userId}/profile.jpg`);
      const uploadTask = uploadBytesResumable(storageRef, file);

      const downloadURL = await new Promise((resolve, reject) => {
        uploadTask.on(
          "state_changed",
          (snapshot) => {
            setProgress(Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100));
          },
          (err) => { setError(err.message); setUploading(false); reject(err); },
          async () => {
            const url = await getDownloadURL(uploadTask.snapshot.ref);
            resolve(url);
          }
        );
      });

      // Update Firestore user doc
      await updateDoc(doc(db, "users", userId), { photoURL: downloadURL });

      // Update Firebase Auth profile
      if (auth.currentUser) {
        await updateProfile(auth.currentUser, { photoURL: downloadURL });
      }

      setUploading(false);
      return downloadURL;
    } catch (err) {
      setError(err.message);
      setUploading(false);
      return null;
    }
  }

  return { uploadProfilePhoto, uploading, progress, error };
}

// ─────────────────────────────────────────────
// AVATAR COMPONENT with upload support
// Use this everywhere instead of the plain Avatar component
// ─────────────────────────────────────────────

import { useRef } from "react";

export function EditableAvatar({ user, onUpload, size = "lg", editable = false, theme }) {
  const fileRef = useRef();
  const { uploadProfilePhoto, uploading, progress } = useProfilePhoto(user?.id);

  const sizes = {
    sm: "w-8 h-8 text-xs",
    md: "w-10 h-10 text-sm",
    lg: "w-16 h-16 text-lg",
    xl: "w-20 h-20 text-xl",
  };

  const colors = ["bg-violet-500","bg-rose-500","bg-amber-500","bg-emerald-500","bg-sky-500","bg-fuchsia-500"];
  const bg = colors[(user?.avatar || "?").charCodeAt(0) % colors.length];

  async function handleFileChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = await uploadProfilePhoto(file);
    if (url && onUpload) onUpload(url);
  }

  return (
    <div className="relative inline-block">
      {user?.photoURL ? (
        <img
          src={user.photoURL}
          alt={user.name}
          className={`${sizes[size]} rounded-full object-cover border-2 border-black`}
        />
      ) : (
        <div className={`${sizes[size]} ${bg} rounded-full flex items-center justify-center font-bold text-white border-2 border-black`}>
          {user?.avatar || "?"}
        </div>
      )}

      {/* Upload overlay — shown only when editable */}
      {editable && (
        <>
          <button
            onClick={() => fileRef.current?.click()}
            className="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity"
          >
            {uploading ? (
              <span className="text-white text-xs font-bold">{progress}%</span>
            ) : (
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            )}
          </button>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
        </>
      )}
    </div>
  );
}
