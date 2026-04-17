import { useState, useRef, useCallback } from 'react';

export function useCamera() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const overlayRef = useRef<HTMLDivElement | null>(null);
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
    const overlay = overlayRef.current;
    if (!video || !overlay || !video.videoWidth) return Promise.resolve(null);

    const vidW = video.videoWidth;
    const vidH = video.videoHeight;

    // Draw the full video frame first.
    const fullCanvas = document.createElement('canvas');
    fullCanvas.width = vidW;
    fullCanvas.height = vidH;
    const fullCtx = fullCanvas.getContext('2d');
    if (!fullCtx) return Promise.resolve(null);
    fullCtx.drawImage(video, 0, 0);

    // Map the overlay's ACTUAL on-screen rect to video pixel coordinates.
    // Reading from the DOM (instead of hardcoding a vw ratio) means the crop
    // always matches whatever the CSS is currently rendering — any viewport
    // shape, any device, after any resize.
    const videoRect = video.getBoundingClientRect();
    const overlayRect = overlay.getBoundingClientRect();
    if (videoRect.width === 0 || videoRect.height === 0) return Promise.resolve(null);

    // objectFit:cover — video scaled uniformly to fill container, cropping overflow.
    const scale = Math.max(videoRect.width / vidW, videoRect.height / vidH);
    // How many video pixels are hidden outside the container on each axis.
    const visibleX = (vidW - videoRect.width / scale) / 2;
    const visibleY = (vidH - videoRect.height / scale) / 2;

    // Overlay position relative to the video's display rect (container CSS px).
    const overlayLeftInVideo = overlayRect.left - videoRect.left;
    const overlayTopInVideo = overlayRect.top - videoRect.top;

    // Convert to video pixel coordinates.
    const cropX = visibleX + overlayLeftInVideo / scale;
    const cropY = visibleY + overlayTopInVideo / scale;
    const cropW = overlayRect.width / scale;
    const cropH = overlayRect.height / scale;

    // Clamp to video bounds and enforce a square crop (overlay is always 1:1,
    // but rounding + bounds can drift by a pixel).
    const clampedX = Math.max(0, Math.min(Math.round(cropX), vidW - 1));
    const clampedY = Math.max(0, Math.min(Math.round(cropY), vidH - 1));
    const cropSize = Math.max(
      1,
      Math.round(Math.min(cropW, cropH, vidW - clampedX, vidH - clampedY)),
    );

    const cropCanvas = document.createElement('canvas');
    cropCanvas.width = cropSize;
    cropCanvas.height = cropSize;
    const cropCtx = cropCanvas.getContext('2d');
    if (!cropCtx) return Promise.resolve(null);
    cropCtx.drawImage(fullCanvas, clampedX, clampedY, cropSize, cropSize, 0, 0, cropSize, cropSize);

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

  return { videoRef, overlayRef, isStreaming, capturedImage, startCamera, capture, captureAsync, stopCamera, resetCapture };
}
