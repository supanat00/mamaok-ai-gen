import React, { useRef, useEffect } from 'react';
import mamaLogo from '../../assets/logos/mama.png';
import generatingText from '../../assets/texts/generating.png';

const LoadingScreen = () => {
    const videoRef = useRef(null);

    useEffect(() => {
        let stream;
        async function startCamera() {
            try {
                stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                }
            } catch {/* ignore error */ }
        }
        startCamera();
        return () => {
            if (stream) {
                stream.getTracks().forEach(track => track.stop());
            }
        };
    }, []);

    return (
        <div style={{
            width: '100vw',
            height: '100vh',
            position: 'relative',
            overflow: 'hidden',
            background: '#000',
        }}>
            {/* กล้องเต็มจอ */}
            <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100vw',
                    height: '100vh',
                    objectFit: 'cover',
                    zIndex: 0,
                    transform: 'scaleX(-1)',
                }}
            />
            {/* โลโก้มาม่ามุมขวาล่าง */}
            <img
                src={mamaLogo}
                alt="Mama Logo"
                style={{
                    position: 'absolute',
                    right: 0,
                    bottom: 0,
                    width: 80,
                    opacity: 0.9,
                    zIndex: 10,
                }}
            />
            {/* Loading overlay */}
            <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                background: 'rgba(0, 0, 0, 0.6)',
                zIndex: 2,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
            }}>
                {/* Enhanced loading icon */}
                <div style={{
                    position: 'relative',
                    width: 80,
                    height: 80,
                    marginBottom: 32,
                }}>
                    {/* Outer ring */}
                    <div style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        border: '4px solid rgba(255, 255, 255, 0.2)',
                        borderTop: '4px solid #ff9100',
                        borderRadius: '50%',
                        animation: 'spin 1s linear infinite',
                    }} />
                    {/* Inner ring */}
                    <div style={{
                        position: 'absolute',
                        top: '25%',
                        left: '25%',
                        width: '50%',
                        height: '50%',
                        border: '3px solid rgba(255, 255, 255, 0.3)',
                        borderTop: '3px solid #e91e63',
                        borderRadius: '50%',
                        animation: 'spin 1.5s linear infinite reverse',
                    }} />
                </div>

                {/* Original generating image */}
                <img src={generatingText} alt="generating" style={{ width: 160 }} />
            </div>

            {/* CSS keyframes */}
            <style>{`
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
            `}</style>
        </div>
    );
};

export default LoadingScreen; 