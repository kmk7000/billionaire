import React, { useState, useRef, useCallback, useEffect } from 'react';
import { resizeImage } from '../utils/imageUtils';
import { autoScanCard } from '../services/cardScanService';

// `focusMode` is a real, widely-shipped MediaStream constraint that
// TypeScript's DOM lib does not declare. Narrowly extending the built-in types
// keeps the call sites checked, which a cast to `any` would not.
type FocusConstraintSet = MediaTrackConstraintSet & { focusMode?: string };
type CameraConstraints = MediaTrackConstraints & {
  focusMode?: string;
  advanced?: FocusConstraintSet[];
};

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
  // Auto-scan keeps the untouched photo alongside the flattened version so the
  // user can fall back when corner detection guesses wrong.
  const [scannedMeishiImage, setScannedMeishiImage] = useState<string | null>(null);
  const [scannedMeishiBack, setScannedMeishiBack] = useState<string | null>(null);
  const [originalMeishiImage, setOriginalMeishiImage] = useState<string | null>(null);
  const [originalMeishiBack, setOriginalMeishiBack] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [useScanned, setUseScanned] = useState(true);
  const [scanDetected, setScanDetected] = useState(false);
  const [scanUnavailable, setScanUnavailable] = useState(false);
  const [meishiSettings, setMeishiSettings] = useState<MeishiSettingsOption>('save');
  const [meishiCameraStream, setMeishiCameraStream] = useState<MediaStream | null>(null);
  const [isFlashOn, setIsFlashOn] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  const [isMeishiMoreOptionsOpen, setIsMeishiMoreOptionsOpen] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const meishiFileInputRef = useRef<HTMLInputElement>(null);
  // The guide rectangle is measured, never recomputed. See captureImage.
  const guideRef = useRef<HTMLDivElement>(null);

  const stopCamera = useCallback(() => {
    if (meishiCameraStream) {
      meishiCameraStream.getTracks().forEach(track => track.stop());
      setMeishiCameraStream(null);
    }
  }, [meishiCameraStream]);

  const startCamera = useCallback(async () => {
    try {
      stopCamera();
      // Ask for the highest stream the camera will give. Without a size hint
      // browsers hand back 640x480, and this screen then crops the guide
      // rectangle out of that — roughly 540x340 of actual card. Business card
      // type simply is not legible at that size, so the capture looked out of
      // focus and the OCR that followed had nothing to read. The browser
      // clamps `ideal` down to whatever the device actually supports, so
      // asking for 4K is safe on every camera.
      //
      // focusMode is not in the TS lib and iOS ignores it (it autofocuses
      // continuously anyway); Android Chrome honours it and it is what stops
      // the preview hunting for focus on a close-up card.
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: 'environment' },
          width: { ideal: 3840 },
          height: { ideal: 2160 },
          focusMode: 'continuous',
        } as CameraConstraints,
      });
      setMeishiCameraStream(stream);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }

      // Re-apply as an advanced constraint too: when focusMode is passed in
      // the initial request some browsers drop the whole video block as
      // over-constrained rather than ignoring the unknown key.
      const track = stream.getVideoTracks()[0];
      if (track) {
        try {
          await track.applyConstraints({
            advanced: [{ focusMode: 'continuous' }],
          } as CameraConstraints);
        } catch {
          // Unsupported on this camera — the device's own autofocus stands.
        }
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

  /** Store the raw photo, then replace it with the auto-scanned version. */
  const applyCapturedImage = useCallback(
    (rawImage: string) => {
      const isFront = meishiSide === 'front';
      if (isFront) {
        setOriginalMeishiImage(rawImage);
        setScannedMeishiImage(null);
      } else {
        setOriginalMeishiBack(rawImage);
        setScannedMeishiBack(null);
      }

      setIsScanning(true);
      autoScanCard(rawImage)
        .then(({ scanned, detected, unavailable }) => {
          setScanDetected(detected);
          setScanUnavailable(unavailable);
          setUseScanned(true);
          if (isFront) setScannedMeishiImage(scanned);
          else setScannedMeishiBack(scanned);
        })
        .finally(() => setIsScanning(false));
    },
    [meishiSide]
  );

  const captureImage = useCallback(async () => {
    if (!videoRef.current) return;

    setIsCapturing(true);
    setTimeout(() => setIsCapturing(false), 200);

    const video = videoRef.current;
    const videoWidth = video.videoWidth;
    const videoHeight = video.videoHeight;

    if (!videoWidth || !videoHeight) return;

    // Where the guide rectangle actually is, measured against the video.
    //
    // This used to re-derive the guide from constants — 85% width, 1.6:1,
    // and *centred in the container*. It is not centred: the overlay is a
    // flex column holding the frame and the caption under it, so the pair is
    // centred as a group and the frame itself sits about half the caption's
    // height above centre. The crop was taken from dead centre and so came
    // out shifted down from what the user framed. Measuring removes the
    // assumption entirely, and keeps working if the layout changes again.
    const rect = video.getBoundingClientRect();
    const guide = guideRef.current?.getBoundingClientRect();
    if (!guide) return;

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

    // Guide position relative to the video element's own box
    const visualStartX = guide.left - rect.left;
    const visualStartY = guide.top - rect.top;

    // Map visual coordinates back to the original video resolution
    const cropX = (visualStartX + offsetX) / scale;
    const cropY = (visualStartY + offsetY) / scale;
    const cropWidth = guide.width / scale;
    const cropHeight = guide.height / scale;

    const canvas = document.createElement('canvas');
    canvas.width = cropWidth;
    canvas.height = cropHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // No cosmetic filter here — enhanceScan() does the real correction and
    // stacking both would crush the contrast.

    // Draw only the exact guide area from the video
    ctx.drawImage(
      video,
      cropX, cropY, cropWidth, cropHeight,
      0, 0, cropWidth, cropHeight
    );

    const imageData = canvas.toDataURL('image/jpeg', 0.95);
    // Kept at OCR resolution, not storage resolution. The old call took the
    // default 1000px/0.7, which threw away the detail the recognizer needs
    // before it ever ran; the smaller copy that goes into Firestore is made
    // separately at save time.
    const resizedImageData = await resizeImage(imageData, 2400, 2400, 0.92);

    applyCapturedImage(resizedImageData);
    setMeishiStep('preview');
    stopCamera();
  }, [meishiSide, stopCamera, applyCapturedImage]);

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
        // Same OCR resolution as the camera path — an album photo was being
        // squeezed to 1000px/0.7 before recognition too.
        const resizedBase64 = await resizeImage(base64, 2400, 2400, 0.92);
        applyCapturedImage(resizedBase64);
        setMeishiStep('preview');
        stopCamera();
      };
      reader.readAsDataURL(file);
    }
  }, [meishiSide, stopCamera, applyCapturedImage]);

  // Everything downstream (preview and the saved record) reads these, so the
  // toggle changes what is persisted, not just what is shown.
  const capturedMeishiImage = useScanned
    ? scannedMeishiImage ?? originalMeishiImage
    : originalMeishiImage;
  const capturedMeishiBack = useScanned
    ? scannedMeishiBack ?? originalMeishiBack
    : originalMeishiBack;

  /** Swap the preview (and what gets saved) between scanned and original. */
  const toggleUseScanned = useCallback(() => {
    setUseScanned((prev) => !prev);
  }, []);

  const resetAll = useCallback(() => {
    stopCamera();
    setMeishiStep('camera');
    setMeishiSide('front');
    setScannedMeishiImage(null);
    setScannedMeishiBack(null);
    setOriginalMeishiImage(null);
    setOriginalMeishiBack(null);
    setIsScanning(false);
    setUseScanned(true);
    setScanDetected(false);
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
    guideRef,
    meishiFileInputRef,
    meishiStep,
    setMeishiStep,
    meishiSide,
    capturedMeishiImage,
    capturedMeishiBack,
    originalMeishiImage,
    originalMeishiBack,
    isScanning,
    useScanned,
    scanDetected,
    scanUnavailable,
    toggleUseScanned,
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
