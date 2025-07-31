import React, { useState, useEffect } from 'react';
import SplashScreen from './components/steps/SplashScreen';
import CameraWithFlavorSelect from './components/steps/CameraWithFlavorSelect';
import PromptInput from './components/steps/PromptInput';
import LoadingScreen from './components/steps/LoadingScreen';
import PreviewScreen from './components/steps/PreviewScreen';
import CameraView from './components/CameraView';

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
  const [isFrontCamera] = useState(true);

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

  // Handler สำหรับ flavor select
  const handleSelectFlavor = (flavor) => {
    setFlavor(flavor);
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
            onStartLoading={() => { setCurrentStep(3); setIsGenerating(true); }}
            onImageGenerated={(url) => { setImageUrl(url); setCurrentStep(5); setIsGenerating(false); }}
            disabled={isGenerating}
            fadingIn={promptFadingIn}
          />
        </>
      )}
      {currentStep === 3 && <LoadingScreen />}
      {/* {currentStep === 4 && <CameraWithResult />} */}
      {currentStep === 5 && <PreviewScreen flavor={flavor} imageUrl={imageUrl} onRestart={() => setCurrentStep(5)} />}
    </>
  );
}

export default App;
