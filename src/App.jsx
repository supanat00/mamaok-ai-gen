import React, { useState, useEffect } from 'react';
import SplashScreen from './components/steps/SplashScreen';
import CameraWithFlavorSelect from './components/steps/CameraWithFlavorSelect';
import PromptInput from './components/steps/PromptInput';
import LoadingScreen from './components/steps/LoadingScreen';
import PreviewScreen from './components/steps/PreviewScreen';
import CameraView from './components/CameraView';
import { flavorRandomizer } from './utils/flavorUtils';

function App() {
  // 0: splash, 1: flavor, 2: prompt, 3: loading, 4: result, 5: preview
  const [currentStep, setCurrentStep] = useState(0);
  const [splashFading, setSplashFading] = useState(false);
  const [flavor, setFlavor] = useState(null);
  const [imageUrl, setImageUrl] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [flavorFading, setFlavorFading] = useState(false);
  const [promptFadingIn, setPromptFadingIn] = useState(false);
  const [videoRef] = useState(() => React.createRef());
  const [isFrontCamera, setIsFrontCamera] = useState(true);
  const [showError, setShowError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (currentStep === 0) {
      const timer = setTimeout(() => setSplashFading(true), 3000); // 3 วินาที
      let fadeTimer;
      if (splashFading) {
        fadeTimer = setTimeout(() => setCurrentStep(1), 700); // รอ fade out 0.7s
      }
      return () => {
        clearTimeout(timer);
        clearTimeout(fadeTimer);
      };
    }
  }, [currentStep, splashFading]);

  useEffect(() => {
    if (currentStep === 2) {
      setPromptFadingIn(true);
    } else {
      setPromptFadingIn(false);
    }
  }, [currentStep]);

  // Handler สำหรับ flavor select พร้อมระบบสุ่ม secret
  const handleSelectFlavor = (flavor) => {
    // ใช้ระบบสุ่ม flavor
    const result = flavorRandomizer.randomizeFlavor(flavor);

    setFlavor(result.finalFlavor);
    setFlavorFading(true);
    setTimeout(() => {
      setCurrentStep(2);
      setFlavorFading(false);
    }, 700); // ระยะเวลา fade out
  };

  return (
    <>
      {currentStep === 0 && <SplashScreen fading={splashFading} />}
      {currentStep === 1 && (
        <>
          {/* กล้องขนาดปกติ */}
          <CameraView videoRef={videoRef} animState={{ isFrontCamera }} style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: 320,
            height: 568,
            maxWidth: '90vw',
            maxHeight: '80vh',
            aspectRatio: '9/16',
            borderRadius: 24,
            overflow: 'hidden',
            zIndex: 1,
          }} />
          <CameraWithFlavorSelect onSelectFlavor={handleSelectFlavor} fading={flavorFading} />
        </>
      )}
      {currentStep === 2 && (
        <>
          {/* กล้องขยายเต็มจอ */}
          <CameraView videoRef={videoRef} animState={{ isFrontCamera }} style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            borderRadius: 0,
            zIndex: 1,
          }} />
          <PromptInput
            onBack={() => setCurrentStep(1)}
            onStartLoading={() => {
              setCurrentStep(3);
              setIsGenerating(true);
            }}
            onImageGenerated={(url) => {
              setImageUrl(url);
              // Move to preview after a short delay to show loading
              setTimeout(() => {
                setCurrentStep(5);
                setIsGenerating(false);
              }, 2000);
            }}
            onError={(message) => {
              // เมื่อเกิด error ให้ปิด loading screen และแสดง error modal
              setIsGenerating(false);
              setErrorMessage(message);
              setShowError(true);
            }}
            disabled={isGenerating}
            fadingIn={promptFadingIn}
          />
        </>
      )}
      {currentStep === 3 && <LoadingScreen />}
      {/* {currentStep === 4 && <CameraWithResult />} */}
      {currentStep === 5 && <PreviewScreen flavor={flavor} imageUrl={imageUrl} isFrontCamera={isFrontCamera} setIsFrontCamera={setIsFrontCamera} onRestart={() => setCurrentStep(5)} />}

      {/* Error Modal */}
      {showError && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            animation: 'fadeIn 0.3s ease-out',
          }}
        >
          <div
            style={{
              background: 'linear-gradient(135deg, #ff6b6b, #ee5a52)',
              borderRadius: 20,
              padding: '24px',
              maxWidth: '90vw',
              width: '400px',
              textAlign: 'center',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
              animation: 'slideIn 0.3s ease-out',
            }}
          >
            <div
              style={{
                fontSize: '24px',
                fontWeight: 'bold',
                color: 'white',
                marginBottom: '16px',
              }}
            >
              ⚠️ เกิดข้อผิดพลาด
            </div>
            <div
              style={{
                fontSize: '16px',
                color: 'white',
                lineHeight: '1.5',
                marginBottom: '24px',
              }}
            >
              {errorMessage}
            </div>
            <button
              onClick={() => {
                setShowError(false);
                setCurrentStep(2); // กลับไปหน้าพิมพ์ข้อความ
              }}
              style={{
                background: 'rgba(255, 255, 255, 0.9)',
                border: '2px solid rgba(255, 255, 255, 0.3)',
                borderRadius: 12,
                padding: '12px 24px',
                color: '#ff6b6b',
                fontSize: '16px',
                fontWeight: 'bold',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => {
                e.target.style.background = 'rgba(255, 255, 255, 1)';
                e.target.style.borderColor = 'rgba(255, 255, 255, 0.5)';
              }}
              onMouseLeave={(e) => {
                e.target.style.background = 'rgba(255, 255, 255, 0.9)';
                e.target.style.borderColor = 'rgba(255, 255, 255, 0.3)';
              }}
            >
              ลองใหม่
            </button>
          </div>
        </div>
      )}

      <style>{`
        @keyframes fadeIn {
          0% { opacity: 0; }
          100% { opacity: 1; }
        }
        @keyframes slideIn {
          0% { opacity: 0; transform: translateY(-20px) scale(0.9); }
          100% { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
    </>
  );
}

export default App;
