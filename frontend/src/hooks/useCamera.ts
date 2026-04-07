import { useState, useRef, useCallback } from 'react';

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

    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return Promise.resolve(null);

    ctx.drawImage(video, 0, 0);

    return new Promise((resolve) => {
      canvas.toBlob((b) => {
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
