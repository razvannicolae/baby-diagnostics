import { useState, useRef, useCallback } from 'react';

// Fraction of viewport width used for the square capture guide in CameraView.
// MUST match the width value set on the overlay square in CameraView.tsx.
const CAPTURE_SQUARE_VW = 0.42;

export function useCamera() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [capturedImage, setCapturedImage] = useState<Blob | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1920 }, height: { ideal: 1080 } },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setIsStreaming(true);
    } catch (err) {
      console.error('Camera access denied:', err);
      throw err;
    }
  }, []);

  const capture = useCallback((): Blob | null => {
    const video = videoRef.current;
    if (!video) return null;

    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    ctx.drawImage(video, 0, 0);

    let blob: Blob | null = null;
    canvas.toBlob((b) => {
      blob = b;
      setCapturedImage(b);
    }, 'image/jpeg', 0.9);

    // toBlob is async but synchronous in practice for jpeg
    // Return via state instead
    return blob;
  }, []);

  const captureAsync = useCallback((): Promise<Blob | null> => {
    const video = videoRef.current;
    if (!video) return Promise.resolve(null);

    // Draw the full video frame.
    const fullCanvas = document.createElement('canvas');
    fullCanvas.width = video.videoWidth;
    fullCanvas.height = video.videoHeight;
    const fullCtx = fullCanvas.getContext('2d');
    if (!fullCtx) return Promise.resolve(null);
    fullCtx.drawImage(video, 0, 0);

    // Map the CSS overlay square to video pixel coordinates.
    // The video fills its container with objectFit:cover, so we must account
    // for the scale and the cropped offset.
    const rect = video.getBoundingClientRect();
    const containerW = rect.width;
    const containerH = rect.height;
    const vidW = video.videoWidth;
    const vidH = video.videoHeight;

    // objectFit:cover scale — the larger of the two fill ratios
    const scale = Math.max(containerW / vidW, containerH / vidH);

    // How many video pixels are hidden on each side by the cover crop
    const visibleX = (vidW - containerW / scale) / 2;
    const visibleY = (vidH - containerH / scale) / 2;

    // Overlay square size and centered position in CSS pixels
    const squareCssPx = CAPTURE_SQUARE_VW * window.innerWidth;
    const squareCssLeft = (containerW - squareCssPx) / 2;
    const squareCssTop = (containerH - squareCssPx) / 2;

    // Convert to video pixel coordinates
    const cropX = Math.round(visibleX + squareCssLeft / scale);
    const cropY = Math.round(visibleY + squareCssTop / scale);
    const cropSize = Math.round(squareCssPx / scale);

    // Clamp to video bounds
    const clampedX = Math.max(0, Math.min(cropX, vidW - 1));
    const clampedY = Math.max(0, Math.min(cropY, vidH - 1));
    const clampedSize = Math.min(cropSize, vidW - clampedX, vidH - clampedY);

    // Render the cropped square to a new canvas
    const cropCanvas = document.createElement('canvas');
    cropCanvas.width = clampedSize;
    cropCanvas.height = clampedSize;
    const cropCtx = cropCanvas.getContext('2d');
    if (!cropCtx) return Promise.resolve(null);
    cropCtx.drawImage(fullCanvas, clampedX, clampedY, clampedSize, clampedSize, 0, 0, clampedSize, clampedSize);

    return new Promise((resolve) => {
      cropCanvas.toBlob((b) => {
        setCapturedImage(b);
        resolve(b);
      }, 'image/jpeg', 0.9);
    });
  }, []);

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    setIsStreaming(false);
  }, []);

  const resetCapture = useCallback(() => {
    setCapturedImage(null);
  }, []);

  return { videoRef, isStreaming, capturedImage, startCamera, capture, captureAsync, stopCamera, resetCapture };
}
