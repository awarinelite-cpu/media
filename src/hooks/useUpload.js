// src/hooks/useUpload.js
// Upload images/videos to Firebase Storage

import { useState } from "react";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { storage } from "../firebase/firebase";

export function useUpload() {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState(null);

  // Upload a file and return its public download URL
  async function uploadFile(file, folder = "posts") {
    if (!file) return null;

    // Validate file type
    const validTypes = ["image/jpeg", "image/png", "image/gif", "image/webp", "video/mp4"];
    if (!validTypes.includes(file.type)) {
      setError("Unsupported file type. Use JPG, PNG, GIF, WebP, or MP4.");
      return null;
    }

    // Max 10MB
    if (file.size > 10 * 1024 * 1024) {
      setError("File too large. Max size is 10MB.");
      return null;
    }

    setUploading(true);
    setError(null);
    setProgress(0);

    try {
      // Create a unique file path: posts/{userId}/{timestamp}_{filename}
      const timestamp = Date.now();
      const filePath = `${folder}/${timestamp}_${file.name}`;
      const storageRef = ref(storage, filePath);

      // Use resumable upload so we can track progress
      const uploadTask = uploadBytesResumable(storageRef, file);

      return await new Promise((resolve, reject) => {
        uploadTask.on(
          "state_changed",
          (snapshot) => {
            const pct = Math.round(
              (snapshot.bytesTransferred / snapshot.totalBytes) * 100
            );
            setProgress(pct);
          },
          (err) => {
            setError(err.message);
            setUploading(false);
            reject(err);
          },
          async () => {
            const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
            setUploading(false);
            setProgress(100);
            resolve(downloadURL);
          }
        );
      });
    } catch (err) {
      setError(err.message);
      setUploading(false);
      return null;
    }
  }

  return { uploadFile, uploading, progress, error };
}
