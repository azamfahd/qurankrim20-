import React, { useState, useEffect, useCallback, useRef } from 'react';
import { X, Compass, MapPin, AlertCircle, CheckCircle2, Navigation, Info, RotateCcw, Shield } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Coordinates, Qibla } from 'adhan';
import { UserSettings } from '../types';

interface QiblaModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: UserSettings;
  onUpdateSettings: (settings: UserSettings) => void;
}

export const QiblaModal: React.FC<QiblaModalProps> = ({ isOpen, onClose, settings, onUpdateSettings }) => {
  const [qiblaDirection, setQiblaDirection] = useState<number | null>(null);
  const [heading, setHeading] = useState<number>(0);
  const [smoothedHeading, setSmoothedHeading] = useState<number>(0);
  const [isAligned, setIsAligned] = useState(false);
  const [needsPermission, setNeedsPermission] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showCalibration, setShowCalibration] = useState(false);
  const [accuracy, setAccuracy] = useState<number | null>(null);
  const [isUsingGPS, setIsUsingGPS] = useState(false);
  const [isRequestingGPS, setIsRequestingGPS] = useState(false);

  const lastVibrationRef = useRef(0);

  // Smooth the compass rotation to prevent jitter using Exponential Moving Average
  useEffect(() => {
    const diff = heading - smoothedHeading;
    // Handle 360 degree wrap-around
    let shortestDiff = ((diff + 540) % 360) - 180;
    
    const timer = requestAnimationFrame(() => {
      // Smoothing factor (alpha) - lower is smoother but slower
      const alpha = 0.12; 
      setSmoothedHeading(prev => (prev + shortestDiff * alpha + 360) % 360);
    });
    return () => cancelAnimationFrame(timer);
  }, [heading, smoothedHeading]);

  // Check alignment and trigger haptic feedback
  useEffect(() => {
    if (qiblaDirection !== null) {
      const diff = Math.abs(smoothedHeading - qiblaDirection);
      const shortestDiff = Math.min(diff, 360 - diff);
      const aligned = shortestDiff < 3; // Within 3 degrees for more precision
      
      if (aligned && !isAligned) {
        // Vibrate when perfectly aligned (throttle to prevent constant vibration)
        const now = Date.now();
        if (navigator.vibrate && now - lastVibrationRef.current > 1000) {
          navigator.vibrate([100]);
          lastVibrationRef.current = now;
        }
      }
      setIsAligned(aligned);
    }
  }, [smoothedHeading, qiblaDirection, isAligned]);

  const updateStoredLocation = useCallback((lat: number, lon: number, name: string = 'موقعك الحالي') => {
    const coords = new Coordinates(lat, lon);
    setQiblaDirection(Qibla(coords));
    
    // Save to settings for offline fallback
    if (settings && (settings.location?.latitude !== lat || settings.location?.longitude !== lon)) {
      onUpdateSettings({
        ...settings,
        location: {
          latitude: lat,
          longitude: lon,
          name: name
        }
      });
    }
  }, [onUpdateSettings, settings]);

  const fetchLocation = useCallback(async (useGPS: boolean = false) => {
    if (!settings) return;
    
    if (useGPS) {
      setIsRequestingGPS(true);
    } else {
      setIsLoading(true);
    }
    
    setLocationError(null);

    // 1. Try saved location from settings first (Immediate & Works Offline)
    if (!useGPS && settings.location) {
      const coords = new Coordinates(settings.location.latitude, settings.location.longitude);
      setQiblaDirection(Qibla(coords));
      setIsLoading(false);
    }

    if (!navigator.onLine && !useGPS) {
      if (!settings.location) {
        setLocationError("أنت الآن في وضع عدم الاتصال ولا يتوفر موقع محفوظ.");
      }
      setIsLoading(false);
      return;
    }

    // 2. Try IP Location (Automatic, No prompt - Silent)
    const getIPLocation = async () => {
      try {
        const response = await fetch('https://get.geojs.io/v1/ip/geo.json');
        if (!response.ok) throw new Error('Network response was not ok');
        const data = await response.json();
        const lat = parseFloat(data.latitude);
        const lon = parseFloat(data.longitude);
        updateStoredLocation(lat, lon, `${data.city || 'موقعك'}، ${data.country || 'الحالي'}`);
        return true;
      } catch (error) {
        console.warn("IP geolocation failed:", error);
        return false;
      }
    };

    // 3. Try GPS Geolocation (Only when user clicks button)
    const getGPSLocation = () => {
      return new Promise<boolean>((resolve) => {
        if ('geolocation' in navigator) {
          navigator.geolocation.getCurrentPosition(
            (position) => {
              updateStoredLocation(position.coords.latitude, position.coords.longitude, 'نقطة GPS دقيقة');
              setIsUsingGPS(true);
              resolve(true);
            },
            (error) => {
              console.warn("GPS failed:", error.message);
              let msg = "تم رفض إذن الموقع أو فشل الـ GPS. تأكد من تفعيل الموقع في المتصفح.";
              if (error.code === error.TIMEOUT) {
                msg = "انتهت مهلة البحث عن الـ GPS. قد تكون داخل مبنى یحجب إشارة الأقمار الصناعية؛ اقترب من نافذة أو فعّل الواي-فاي.";
              }
              setLocationError(msg);
              resolve(false);
            },
            { enableHighAccuracy: true, timeout: 20000, maximumAge: 300000 }
          );
        } else {
          resolve(false);
        }
      });
    };

    if (useGPS) {
      await getGPSLocation();
      setIsRequestingGPS(false);
    } else {
      const ipSuccess = await getIPLocation();
      if (!ipSuccess && !settings.location) {
        // Only show error if we have no location at all
        setLocationError("تعذر تحديد الموقع تلقائياً. يرجى الضغط على زر تحديد الموقع بدقة.");
      }
      setIsLoading(false);
    }
  }, [settings, updateStoredLocation]);

  const handleOrientation = useCallback((event: any) => {
    let absoluteHeading = null;
    
    // iOS: webkitCompassHeading is the most reliable
    if (event.webkitCompassHeading !== undefined && event.webkitCompassHeading !== null) {
      absoluteHeading = event.webkitCompassHeading;
      if (event.webkitCompassAccuracy !== undefined) {
        setAccuracy(event.webkitCompassAccuracy);
      }
    } 
    // Android/General: use 'absolute' if available
    else if (event.alpha !== null) {
      // For absolute orientation, 360 - alpha gives the correct heading
      absoluteHeading = (360 - event.alpha) % 360;
    }

    if (absoluteHeading !== null && !isNaN(absoluteHeading)) {
      setHeading(absoluteHeading);
    }
  }, []);

  const requestOrientationPermission = async () => {
    const orientationEvent = DeviceOrientationEvent as any;
    if (typeof orientationEvent.requestPermission === 'function') {
      try {
        const permissionState = await orientationEvent.requestPermission();
        if (permissionState === 'granted') {
          setNeedsPermission(false);
          // Re-attach listeners after permission
          (window as any).addEventListener('deviceorientation', handleOrientation, true);
        } else {
          setLocationError("تم رفض إذن استخدام البوصلة. يرجى تفعيله من إعدادات الموقع في المتصفح.");
        }
      } catch (error) {
        console.error("Error requesting orientation permission:", error);
      }
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchLocation();
    }
  }, [isOpen]); // Only run once when modal opens to avoid infinite loops

  useEffect(() => {
    if (isOpen) {
      // Priority: 1. check for requestPermission (mostly iOS)
      if (typeof (DeviceOrientationEvent as any).requestPermission === 'function') {
        setNeedsPermission(true);
      } else {
        // 2. Non-iOS: listen for both to ensure we get absolute heading if possible
        if ('ondeviceorientationabsolute' in window) {
          (window as any).addEventListener('deviceorientationabsolute', handleOrientation, true);
        } else {
          (window as any).addEventListener('deviceorientation', handleOrientation, true);
        }
      }

      const timer = setTimeout(() => setShowCalibration(true), 10000);

      return () => {
        clearTimeout(timer);
        (window as any).removeEventListener('deviceorientationabsolute', handleOrientation, true);
        (window as any).removeEventListener('deviceorientation', handleOrientation, true);
      };
    } else {
      setQiblaDirection(null);
      setHeading(0);
      setSmoothedHeading(0);
      setIsAligned(false);
      setNeedsPermission(false);
      setShowCalibration(false);
      setAccuracy(null);
      setIsUsingGPS(false);
      setIsRequestingGPS(false);
    }
  }, [isOpen, handleOrientation]);

  // Calculate the rotation of the compass dial
  const compassRotation = -smoothedHeading;
  
  // Calculate the rotation of the Qibla pointer relative to the phone
  const pointerRotation = qiblaDirection !== null ? (qiblaDirection - smoothedHeading + 360) % 360 : 0;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="modal-backdrop flex items-center justify-center p-4 z-50 overflow-y-auto" 
          onClick={onClose}
        >
          <motion.div 
            initial={{ scale: 0.9, y: 30 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 30 }}
            className="bg-white w-full max-w-sm rounded-[3rem] p-6 shadow-2xl flex flex-col items-center border border-gray-100 relative overflow-hidden my-auto"
            onClick={e => e.stopPropagation()}
          >
            {/* Background Effects */}
            <div className={`absolute top-0 left-0 w-full h-2 rounded-t-[3rem] transition-colors duration-700 pointer-events-none ${isAligned ? 'bg-green-500 shadow-[0_4px_15px_rgba(34,197,94,0.4)]' : 'bg-transparent'}`}></div>
            <div className={`absolute -top-24 -left-24 w-48 h-48 rounded-full blur-[80px] opacity-10 transition-colors duration-1000 ${isAligned ? 'bg-green-500' : 'bg-[var(--color-primary)]'}`}></div>

            <div className="w-full flex justify-between items-center mb-6 relative z-10">
              <div className="flex flex-col">
                <h2 className="text-xl font-black text-gray-900 tracking-tight">اتجاه القبلة</h2>
                {accuracy !== null && (
                  <p className="text-[10px] text-gray-400 font-bold uppercase mt-0.5 tracking-widest">
                    دقة الحساس: {accuracy < 10 ? 'ممتازة' : accuracy < 30 ? 'جيدة' : 'تحتاج معايرة'}
                  </p>
                )}
              </div>
              <button onClick={onClose} className="p-2.5 bg-gray-50 text-gray-400 hover:bg-gray-100 rounded-2xl transition-all hover:scale-105 active:scale-95">
                <X size={20} />
              </button>
            </div>

            {isLoading ? (
              <div className="h-[350px] flex flex-col items-center justify-center gap-6">
                <div className="relative">
                  <div className="w-20 h-20 border-4 border-gray-100 rounded-full"></div>
                  <div className="absolute inset-0 w-20 h-20 border-4 border-[var(--color-gold)] border-t-transparent rounded-full animate-spin"></div>
                  <MapPin className="absolute inset-0 m-auto text-[var(--color-gold)] animate-bounce" size={24} />
                </div>
                <div className="text-center px-6">
                  <p className="text-gray-800 font-bold text-lg mb-1">تحديد الموقع...</p>
                  <p className="text-sm text-gray-500">نحن نبحث عن إحداثيات موقعك لحساب اتجاه الكعبة المشرفة بدقة.</p>
                </div>
              </div>
            ) : needsPermission ? (
              <div className="h-[350px] flex flex-col items-center justify-center gap-6 text-center px-4">
                <div className="w-24 h-24 bg-indigo-50 rounded-[2rem] flex items-center justify-center text-indigo-500 shadow-inner">
                  <Compass size={48} className="animate-[spin_10s_linear_infinite]" />
                </div>
                <div>
                  <h3 className="font-black text-xl text-gray-900 mb-3">تفعيل البوصلة</h3>
                  <p className="text-sm text-gray-500 leading-relaxed mb-8">يحتاج التطبيق إلى استخدام مستشعرات الحركة والجاذبية في جهازك لتحديد الاتجاهات بدقة عالية.</p>
                  <button 
                    onClick={requestOrientationPermission}
                    className="w-full royal-btn flex items-center justify-center gap-2 group p-4 bg-[var(--color-primary)] text-white rounded-2xl font-bold"
                  >
                    <Shield size={18} />
                    <span>منح إذن الوصول</span>
                  </button>
                </div>
              </div>
            ) : locationError ? (
              <div className="h-[350px] flex flex-col items-center justify-center gap-4 text-center px-4">
                <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center text-red-500 mb-2">
                  <AlertCircle size={40} />
                </div>
                <h3 className="font-bold text-gray-900">عذراً، حدث خطأ</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{locationError}</p>
                <button 
                  onClick={() => fetchLocation(true)}
                  className="mt-4 text-[var(--color-primary)] font-bold text-sm bg-[var(--color-primary-light)]/20 px-6 py-2 rounded-xl"
                >
                  إعادة المحاولة
                </button>
              </div>
            ) : (
              <div className="w-full flex flex-col items-center">
                <div className="relative w-72 h-72 flex items-center justify-center mb-8">
                  {/* Animated pulse background when aligned */}
                  <AnimatePresence>
                    {isAligned && (
                      <motion.div 
                        initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1.4, opacity: 0.2 }} exit={{ scale: 0.8, opacity: 0 }}
                        transition={{ duration: 2, repeat: Infinity }}
                        className="absolute inset-4 rounded-full bg-green-500"
                      />
                    )}
                  </AnimatePresence>

                  {/* Compass Body */}
                  <div className={`absolute inset-0 rounded-full border-[8px] border-white shadow-[0_10px_40px_-10px_rgba(0,0,0,0.15)] transition-all duration-500 ${isAligned ? 'bg-green-50 ring-8 ring-green-100/50' : 'bg-slate-50 ring-8 ring-slate-100/50'}`}></div>
                  
                  {/* Degree Ring (Static) */}
                  <div className="absolute inset-0 opacity-20 pointer-events-none">
                    {[...Array(72)].map((_, i) => (
                      <div key={i} className="absolute w-full h-full flex justify-center" style={{ rotate: `${i * 5}deg` }}>
                        <div className={`w-[1px] ${i % 9 === 0 ? 'h-4 bg-gray-900' : i % 3 === 0 ? 'h-3 bg-gray-600' : 'h-2 bg-gray-400'}`}></div>
                      </div>
                    ))}
                  </div>

                  {/* Compass Face (Rotates with phone) */}
                  <motion.div 
                    className="absolute w-60 h-60 rounded-full bg-white shadow-inner flex items-center justify-center overflow-hidden"
                    animate={{ rotate: compassRotation }}
                    transition={{ type: "spring", stiffness: 300, damping: 30, mass: 1 }}
                  >
                    {/* Cardinal Directions */}
                    <div className="absolute top-4 font-black text-rose-600 text-lg tracking-widest">N</div>
                    <div className="absolute bottom-4 font-black text-slate-400 text-lg tracking-widest">S</div>
                    <div className="absolute left-4 font-black text-slate-400 text-lg tracking-widest">W</div>
                    <div className="absolute right-4 font-black text-slate-400 text-lg tracking-widest">E</div>
                    
                    {/* Direction Indicators */}
                    {[...Array(8)].map((_, i) => (
                      <div key={i} className="absolute w-full h-full flex justify-center" style={{ rotate: `${i * 45}deg` }}>
                        <div className={`w-0.5 mt-2 rounded-full ${i === 0 ? 'h-6 bg-rose-500' : 'h-4 bg-slate-200'}`}></div>
                      </div>
                    ))}
                  </motion.div>

                  {/* Qibla Indicator (Points towards Qibla) */}
                  {qiblaDirection !== null && (
                    <motion.div 
                      className="absolute w-full h-full flex flex-col items-center justify-start z-20 pointer-events-none p-4"
                      animate={{ rotate: pointerRotation }}
                      transition={{ type: "spring", stiffness: 300, damping: 30, mass: 1 }}
                    >
                      <div className="flex flex-col items-center">
                        {/* Kaaba Icon Target */}
                        <motion.div 
                          animate={isAligned ? { scale: [1, 1.2, 1] } : {}}
                          transition={{ duration: 0.5, repeat: isAligned ? Infinity : 0 }}
                          className={`w-14 h-14 rounded-full shadow-lg border-4 border-white flex items-center justify-center transition-all duration-300 ${isAligned ? 'bg-green-500' : 'bg-slate-900'}`}
                        >
                          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white">
                            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                            <polyline points="9 22 9 12 15 12 15 22"></polyline>
                          </svg>
                        </motion.div>
                        {/* Connector Line */}
                        <div className={`w-1 h-32 rounded-full mt-2 transition-all duration-300 bg-gradient-to-b ${isAligned ? 'from-green-500/80 to-transparent' : 'from-slate-800/20 to-transparent'}`}></div>
                      </div>
                    </motion.div>
                  )}

                  {/* Center Shadow/Depth */}
                  <div className="absolute w-6 h-6 bg-white rounded-full shadow-lg border border-gray-100 z-30 flex items-center justify-center">
                    <div className="w-2 h-2 bg-slate-300 rounded-full"></div>
                  </div>
                </div>

                {/* Instructions & Status */}
                <div className="w-full space-y-4">
                  <motion.div 
                    animate={isAligned ? { scale: [1, 1.02, 1] } : {}}
                    className={`p-5 rounded-3xl border transition-all duration-500 shadow-sm ${isAligned ? 'bg-green-50 border-green-200' : 'bg-slate-50 border-slate-100'}`}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`p-3 rounded-2xl transition-colors duration-500 ${isAligned ? 'bg-green-500 text-white shadow-green-200 rotate-[360deg]' : 'bg-slate-800 text-slate-100 shadow-slate-200'}`}>
                        {isAligned ? <CheckCircle2 size={24} /> : <Navigation size={24} className="fill-current" />}
                      </div>
                      <div className="flex-1">
                        <h4 className={`font-black text-lg transition-colors duration-500 ${isAligned ? 'text-green-700' : 'text-slate-900'}`}>
                          {isAligned ? 'تم توجيه القبلة بنجاح' : 'ابحث عن الكعبة'}
                        </h4>
                        <p className="text-xs text-slate-500 font-medium leading-relaxed">
                          {isAligned ? 'أنت الآن في الاتجاه الصحيح تماماً نحو مكة المكرمة.' : 'ضع هاتفك بوضع مسطح وقم بتدويره ببطء حتى يضيء المؤشر باللون الأخضر.'}
                        </p>
                      </div>
                    </div>
                  </motion.div>

                  {showCalibration && !isAligned && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                      className="bg-amber-50 rounded-2xl p-3 border border-amber-100 flex items-center gap-3"
                    >
                      <RotateCcw size={16} className="text-amber-600 animate-pulse" />
                      <p className="text-[10px] text-amber-700 font-bold leading-tight">
                        إذا شعرت بعدم الدقة، حرك هاتفك في الهواء على شكل رقم (8) لمعايرة البوصلة.
                      </p>
                    </motion.div>
                  )}

                  {!isUsingGPS && !isRequestingGPS && (
                    <button 
                      onClick={() => fetchLocation(true)}
                      className="w-full flex items-center justify-center gap-2 py-4 px-6 bg-[var(--color-primary-light)]/10 text-[var(--color-primary)] rounded-[2rem] border border-[var(--color-primary)]/20 hover:bg-[var(--color-primary-light)]/20 transition-all group scale-95 hover:scale-100"
                    >
                      <MapPin size={18} className="group-hover:animate-bounce" />
                      <span className="font-bold text-sm">تحديد الموقع بدقة (GPS)</span>
                    </button>
                  )}

                  {isRequestingGPS && (
                    <div className="w-full flex items-center justify-center gap-3 py-4 text-gray-400 bg-gray-50 rounded-[2rem] border border-gray-100 animate-pulse font-bold text-sm">
                      <div className="w-4 h-4 border-2 border-gray-300 border-t-gray-500 rounded-full animate-spin"></div>
                      <span>جاري البحث عن موقعك الدقيق...</span>
                    </div>
                  )}

                  {isUsingGPS && (
                    <div className="w-full flex items-center justify-center gap-2 py-2 text-green-600 font-bold text-[10px] bg-green-50/50 rounded-full border border-green-100">
                      <CheckCircle2 size={12} />
                      <span>تم تفعيل الموقع الدقيق بنجاح</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
