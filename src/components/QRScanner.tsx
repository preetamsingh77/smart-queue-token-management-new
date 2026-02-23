
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Camera, X, RefreshCw, FlipHorizontal, Zap, ShieldAlert, Info, Lock, Settings } from 'lucide-react';
import jsQR from 'jsqr';

interface QRScannerProps {
  onScan: (data: string) => void;
  onClose: () => void;
  title?: string;
  description?: string;
}

export const QRScanner: React.FC<QRScannerProps> = ({
  onScan,
  onClose,
  title = "Tactical QR Scanner",
  description = "Position the token QR within the sensor frame for verification"
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState(false);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [hasMultipleCameras, setHasMultipleCameras] = useState(false);
  const [isBlocked, setIsBlocked] = useState(false);
  const scanningRef = useRef(false);
  const startPromiseRef = useRef<Promise<void> | null>(null);

  useEffect(() => {
    const checkCameras = async () => {
      try {
        if (navigator.mediaDevices && navigator.mediaDevices.enumerateDevices) {
          const devices = await navigator.mediaDevices.enumerateDevices();
          const videoDevices = devices.filter(device => device.kind === 'videoinput');
          setHasMultipleCameras(videoDevices.length > 1);
          if (videoDevices.length === 0) {
            setError("Hardware Error: No compatible optical sensors detected on this device.");
          }
        }
      } catch (e) {
        console.warn("[SENSOR] Failed to enumerate devices:", e);
      }
    };
    checkCameras();
  }, []);

  const stopCamera = useCallback(() => {
    scanningRef.current = false;
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => {
        track.stop();
        console.log(`[SENSOR] Lens deactivated: ${track.label}`);
      });
      videoRef.current.srcObject = null;
    }
  }, []);

  const tick = useCallback(() => {
    if (!scanningRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (video && video.readyState === video.HAVE_ENOUGH_DATA) {
      if (canvas) {
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (ctx) {
          if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
          }

          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

          const code = jsQR(imageData.data, imageData.width, imageData.height, {
            inversionAttempts: "attemptBoth",
          });

          if (code && code.data && code.data.trim().length > 0) {
            scanningRef.current = false;
            stopCamera();
            onScan(code.data.trim());
            return;
          }
        }
      }
    }
    if (scanningRef.current) {
      requestAnimationFrame(tick);
    }
  }, [onScan, stopCamera]);

  const startCamera = async () => {
    if (startPromiseRef.current) return;

    setError(null);
    setIsBlocked(false);
    setIsInitializing(true);
    stopCamera();

    if (!window.isSecureContext && window.location.hostname !== 'localhost') {
      setError("Security Error: Sensor protocols require a secure (HTTPS) context.");
      setIsInitializing(false);
      return;
    }

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setError("Compatibility Error: Your system does not support digital imaging protocols.");
      setIsInitializing(false);
      return;
    }

    try {
      startPromiseRef.current = (async () => {
        const constraints: MediaStreamConstraints = {
          video: {
            facingMode: { ideal: facingMode },
            width: { ideal: 1280 },
            height: { ideal: 720 }
          }
        };

        const stream = await navigator.mediaDevices.getUserMedia(constraints);

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
          setIsInitializing(false);
          scanningRef.current = true;
          requestAnimationFrame(tick);
        }
      })();
      await startPromiseRef.current;
    } catch (err: any) {
      console.error("Sensor Activation Failed:", err);
      const name = err.name || '';
      const msg = (err.message || '').toLowerCase();

      if (name === 'NotAllowedError' || name === 'PermissionDeniedError' || msg.includes('denied') || msg.includes('permission')) {
        setIsBlocked(true);
        setError("PERMISSION DENIED: Camera access is currently blocked in your browser settings.");
      } else if (name === 'NotFoundError' || name === 'DevicesNotFoundError') {
        setError("Hardware Error: No compatible lens found.");
      } else if (name === 'NotReadableError' || name === 'TrackStartError') {
        setError("Conflict Error: Camera is currently locked by another application.");
      } else {
        setError(`Activation Error: ${err.message || 'Unknown sensor failure.'}`);
      }
      setIsInitializing(false);
    } finally {
      startPromiseRef.current = null;
    }
  };

  const toggleCamera = () => {
    setFacingMode(prev => prev === 'environment' ? 'user' : 'environment');
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      startCamera();
    }, 300);

    return () => {
      clearTimeout(timer);
      stopCamera();
    };
  }, [facingMode]);

  return (
    <div className="fixed inset-0 z-[220] bg-slate-950/95 backdrop-blur-2xl flex items-center justify-center p-4 md:p-6 animate-in fade-in duration-500">
      <div className="w-full max-w-xl bg-slate-900 rounded-[3.5rem] overflow-hidden border-2 border-white/10 shadow-2xl relative flex flex-col p-8 text-center gap-6">
        <div className="w-20 h-20 bg-rose-500/10 rounded-[2.5rem] flex items-center justify-center border-4 border-rose-500/20 mx-auto">
          <Lock className="w-8 h-8 text-rose-500" />
        </div>
        <h2 className="text-2xl font-black text-white uppercase italic tracking-tighter">Camera Access Disabled</h2>
        <p className="text-slate-400 text-sm font-medium">
          Camera access is temporarily disabled for system maintenance.
          Please use manual entry or file upload methods if available.
        </p>
        <button
          onClick={onClose}
          className="w-full py-4 bg-white/5 hover:bg-white/10 text-white rounded-2xl font-black text-xs uppercase tracking-widest transition-all"
        >
          Close Scanner
        </button>
      </div>
    </div>
  );

  // The original UI is kept below but will not be reached due to the return above
  return (
    <div className="fixed inset-0 z-[220] bg-slate-950/95 backdrop-blur-2xl flex items-center justify-center p-4 md:p-6 animate-in fade-in duration-500">
      <div className="w-full max-w-xl bg-slate-900 rounded-[3.5rem] overflow-hidden border-2 border-white/10 shadow-2xl relative flex flex-col">
        {/* Header */}
        <div className="p-8 border-b border-white/5 flex justify-between items-center bg-slate-900/50 relative z-20">
          <div className="flex items-center gap-4">
            <div className={`p-3 rounded-2xl border transition-colors ${error ? 'bg-rose-500/20 border-rose-500/30' : 'bg-blue-600/20 border-blue-500/30'}`}>
              {error ? <ShieldAlert className="w-6 h-6 text-rose-500" /> : <Camera className="w-6 h-6 text-blue-400" />}
            </div>
            <div>
              <h2 className="text-xl font-black text-white tracking-tighter uppercase italic">{title}</h2>
              <div className="flex items-center gap-2 mt-1">
                <div className={`w-1.5 h-1.5 rounded-full ${error ? 'bg-rose-500' : 'bg-emerald-500 animate-pulse'}`} />
                <span className="text-[9px] font-black uppercase tracking-[0.3em] text-slate-500">
                  {error ? 'Status: Access Denied' : 'Status: Matrix Active'}
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {hasMultipleCameras && !error && (
              <button onClick={toggleCamera} className="p-4 hover:bg-white/10 rounded-2xl transition-all text-slate-400 hover:text-white active:scale-90" title="Flip Lens">
                <FlipHorizontal className="w-6 h-6" />
              </button>
            )}
            <button onClick={onClose} className="p-4 bg-white/5 hover:bg-rose-600/20 rounded-2xl transition-all group active:scale-90">
              <X className="w-6 h-6 text-slate-400 group-hover:text-rose-500" />
            </button>
          </div>
        </div>

        {/* Sensor Viewport */}
        <div className="flex-1 min-h-[440px] relative bg-black flex items-center justify-center overflow-hidden">
          {error ? (
            <div className="p-8 text-center flex flex-col items-center gap-6 animate-in zoom-in duration-500 w-full">
              <div className="w-20 h-20 bg-rose-500/10 rounded-[2.5rem] flex items-center justify-center border-4 border-rose-500/20 relative">
                <Lock className="w-8 h-8 text-rose-500" />
              </div>

              <div className="space-y-4 w-full max-w-sm">
                <p className="text-white font-black text-2xl uppercase italic tracking-tighter leading-none">{isBlocked ? 'Access Restricted' : 'Activation Failure'}</p>

                <div className="p-6 bg-white/5 rounded-3xl border border-white/10 text-left space-y-4">
                  <div className="flex items-start gap-4">
                    <div className="p-2 bg-amber-500/20 rounded-lg text-amber-500"><Info className="w-4 h-4 shrink-0" /></div>
                    <p className="text-slate-300 text-xs font-medium leading-relaxed">{error}</p>
                  </div>

                  {isBlocked && (
                    <div className="pt-4 border-t border-white/5 space-y-3">
                      <p className="text-[10px] font-black uppercase tracking-widest text-blue-400 flex items-center gap-2">
                        <Settings className="w-3 h-3" /> Restoration Protocol:
                      </p>
                      <ol className="text-[10px] text-slate-400 space-y-2 font-bold uppercase italic list-decimal pl-4">
                        <li>Click the Lock icon in your address bar</li>
                        <li>Reset Camera permission to 'Allow'</li>
                        <li>Refresh this terminal session</li>
                      </ol>
                    </div>
                  )}
                </div>
              </div>

              <div className="w-full max-w-sm space-y-4 pt-4">
                <button
                  onClick={() => startCamera()}
                  className="w-full py-5 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] flex items-center justify-center gap-3 transition-all shadow-xl shadow-blue-600/20 active:scale-95"
                >
                  <RefreshCw className="w-4 h-4" /> Attempt Re-Sync
                </button>
                <button onClick={onClose} className="text-[10px] text-slate-500 uppercase font-black tracking-widest hover:text-slate-300 transition-colors italic">Bypass Optical Scan</button>
              </div>
            </div>
          ) : (
            <>
              {isInitializing && (
                <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-8 bg-slate-900">
                  <div className="relative">
                    <div className="w-20 h-20 border-4 border-blue-500/10 rounded-full" />
                    <div className="absolute inset-0 w-20 h-20 border-4 border-transparent border-t-blue-500 rounded-full animate-spin" />
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 animate-pulse">Synchronizing Matrix...</span>
                </div>
              )}
              <video
                ref={videoRef}
                className={`w-full h-full object-cover transition-opacity duration-1000 ${isInitializing ? 'opacity-0' : 'opacity-100'}`}
                muted
                playsInline
              />
              <canvas ref={canvasRef} className="hidden" />
              {!isInitializing && (
                <div className="absolute inset-0 pointer-events-none flex items-center justify-center p-12">
                  <div className="w-full h-full border-2 border-white/5 rounded-[3.5rem] relative">
                    <div className="absolute -top-1 -left-1 w-16 h-16 border-t-[8px] border-l-[8px] border-blue-500 rounded-tl-[3.5rem] shadow-[0_0_20px_rgba(59,130,246,0.4)]" />
                    <div className="absolute -top-1 -right-1 w-16 h-16 border-t-[8px] border-r-[8px] border-blue-500 rounded-tr-[3.5rem] shadow-[0_0_20px_rgba(59,130,246,0.4)]" />
                    <div className="absolute -bottom-1 -left-1 w-16 h-16 border-b-[8px] border-l-[8px] border-blue-500 rounded-bl-[3.5rem] shadow-[0_0_20px_rgba(59,130,246,0.4)]" />
                    <div className="absolute -bottom-1 -right-1 w-16 h-16 border-b-[8px] border-r-[8px] border-blue-500 rounded-br-[3.5rem] shadow-[0_0_20px_rgba(59,130,246,0.4)]" />
                    <div className="absolute left-8 right-8 h-[2px] bg-blue-400/60 blur-[1px] scan-line-v2" />
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer Info */}
        {!error && (
          <div className="p-10 text-center bg-slate-900 border-t border-white/5 relative">
            <div className="flex flex-col items-center gap-4">
              <div className="p-4 bg-white/5 rounded-2xl">
                <Zap className="w-6 h-6 text-blue-500" />
              </div>
              <div className="space-y-1">
                <p className="text-white font-black text-sm uppercase italic tracking-tighter">{description}</p>
                <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest leading-relaxed">
                  Optical sensors are calibrated for real-time verification
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes scan-v2 {
          0% { top: 15%; opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { top: 85%; opacity: 0; }
        }
        .scan-line-v2 { 
          animation: scan-v2 3s cubic-bezier(0.4, 0, 0.2, 1) infinite;
          position: absolute;
          z-index: 5;
        }
      `}</style>
    </div>
  );
};
