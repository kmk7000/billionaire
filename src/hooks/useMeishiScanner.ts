import React, { useState, useRef, useCallback, useEffect } from 'react';
import { resizeImage } from '../utils/imageUtils';

export type MeishiStep = 'camera' | 'preview' | 'settings' | 'success';
export type MeishiSide = 'front' | 'back';
export type MeishiSettingsOption = 'send' | 'save';

export interface UseMeishiScannerOptions {
  isOpen: boolean;
  onClose: () => void;
}

export function useMeishiScanner({ isOpen, onClose }: UseMeishiScannerOptions) {
  const [meishiStep, setMeishiStep] = useState<MeishiStep>('camera');
  const [meishiSide, setMeishiSide] = useState<MeishiSide>('front');
  const [capturedMeishiImage, setCapturedMeishiImage] = useState<string | null>(null);
  const [capturedMeishiBack, setCapturedMeishiBack] = useState<string | null>(null);
  const [meishiSettings, setMeishiSettings] = useState<MeishiSettingsOption>('save');
  const [meishiCameraStream, setMeishiCameraStream] = useState<MediaStream | null>(null);
  const [isFlashOn, setIsFlashOn] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  const [isMeishiMoreOptionsOpen, setIsMeishiMoreOptionsOpen] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const meishiFileInputRef = useRef<HTMLInputElement>(null);

  const stopCamera = useCallback(() => {
    if (meishiCameraStream) {
      meishiCameraStream.getTracks().forEach(track => track.stop());
      setMeishiCameraStream(null);
    }
  }, [meishiCameraStream]);

  const startCamera = useCallback(async () => {
    try {
      stopCamera();
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      });
      setMeishiCameraStream(stream);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
      // Fallback to album input if camera is not accessible
      meishiFileInputRef.current?.click();
    }
  }, [stopCamera]);

  // When modal opens/closes or step changes back to camera, start or stop camera
  useEffect(() => {
    if (isOpen && meishiStep === 'camera') {
      startCamera();
    } else {
      stopCamera();
    }
    return () => {
      stopCamera();
    };
  }, [isOpen, meishiStep]);

  const toggleFlash = useCallback(async () => {
    if (!meishiCameraStream) return;
    const track = meishiCameraStream.getVideoTracks()[0];
    if (track && 'applyConstraints' in track) {
      try {
        const nextFlash = !isFlashOn;
        await (track as any).applyConstraints({
          advanced: [{ torch: nextFlash }]
        });
        setIsFlashOn(nextFlash);
      } catch (e) {
        console.warn('Torch constraint not supported or failed:', e);
        setIsFlashOn(prev => !prev);
      }
    } else {
      setIsFlashOn(prev => !prev);
    }
  }, [meishiCameraStream, isFlashOn]);

  const captureImage = useCallback(async () => {
    if (!videoRef.current) return;

    setIsCapturing(true);
    setTimeout(() => setIsCapturing(false), 200);

    const video = videoRef.current;
    const videoWidth = video.videoWidth;
    const videoHeight = video.videoHeight;

    if (!videoWidth || !videoHeight) return;

    // Calculate exact crop based on object-cover rendering
    const rect = video.getBoundingClientRect();
    const containerWidth = rect.width;
    const containerHeight = rect.height;

    // object-cover scaling factor
    const scale = Math.max(containerWidth / videoWidth, containerHeight / videoHeight);

    // The actual displayed size of the video
    const displayedWidth = videoWidth * scale;
    const displayedHeight = videoHeight * scale;

    // The offset of the video within the container (centered by object-cover)
    const offsetX = (displayedWidth - containerWidth) / 2;
    const offsetY = (displayedHeight - containerHeight) / 2;

    // The guide frame is 85% of the container width
    const guideWidthFactor = 0.85;
    const aspectRatio = 1.6;

    const visualGuideWidth = containerWidth * guideWidthFactor;
    const visualGuideHeight = visualGuideWidth / aspectRatio;

    // The visual coordinates of the guide frame relative to the container
    const visualStartX = (containerWidth - visualGuideWidth) / 2;
    const visualStartY = (containerHeight - visualGuideHeight) / 2;

    // Map visual coordinates back to the original video resolution
    const cropX = (visualStartX + offsetX) / scale;
    const cropY = (visualStartY + offsetY) / scale;
    const cropWidth = visualGuideWidth / scale;
    const cropHeight = visualGuideHeight / scale;

    const canvas = document.createElement('canvas');
    canvas.width = cropWidth;
    canvas.height = cropHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Apply Color Scan filter
    ctx.filter = 'contrast(1.3) brightness(1.05) saturate(1.2)';

    // Draw only the exact guide area from the video
    ctx.drawImage(
      video,
      cropX, cropY, cropWidth, cropHeight,
      0, 0, cropWidth, cropHeight
    );

    const imageData = canvas.toDataURL('image/jpeg', 0.95);
    const resizedImageData = await resizeImage(imageData);

    if (meishiSide === 'front') {
      setCapturedMeishiImage(resizedImageData);
    } else {
      setCapturedMeishiBack(resizedImageData);
    }

    setMeishiStep('preview');
    stopCamera();
  }, [meishiSide, stopCamera]);

  const addBackSide = useCallback(async () => {
    setMeishiSide('back');
    setMeishiStep('camera');
  }, []);

  const handleAlbumClick = useCallback(() => {
    meishiFileInputRef.current?.click();
  }, []);

  const handleFileChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const base64 = event.target?.result as string;
        const resizedBase64 = await resizeImage(base64);
        if (meishiSide === 'front') {
          setCapturedMeishiImage(resizedBase64);
        } else {
          setCapturedMeishiBack(resizedBase64);
        }
        setMeishiStep('preview');
        stopCamera();
      };
      reader.readAsDataURL(file);
    }
  }, [meishiSide, stopCamera]);

  const resetAll = useCallback(() => {
    stopCamera();
    setMeishiStep('camera');
    setMeishiSide('front');
    setCapturedMeishiImage(null);
    setCapturedMeishiBack(null);
    setIsFlashOn(false);
    setIsCapturing(false);
    setIsMeishiMoreOptionsOpen(false);
  }, [stopCamera]);

  const handleClose = useCallback(() => {
    resetAll();
    onClose();
  }, [resetAll, onClose]);

  return {
    videoRef,
    meishiFileInputRef,
    meishiStep,
    setMeishiStep,
    meishiSide,
    capturedMeishiImage,
    capturedMeishiBack,
    meishiSettings,
    setMeishiSettings,
    isFlashOn,
    isCapturing,
    isMeishiMoreOptionsOpen,
    setIsMeishiMoreOptionsOpen,
    toggleFlash,
    captureImage,
    addBackSide,
    handleAlbumClick,
    handleFileChange,
    resetAll,
    handleClose,
  };
}
