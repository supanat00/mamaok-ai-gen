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
            {/* ไอคอน loading หมุนกลางจอ */}
            <div style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -60%)',
                zIndex: 2,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
            }}>
                <div style={{
                    width: 64,
                    height: 64,
                    border: '6px solid #fff',
                    borderTop: '6px solid #ff9100',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite',
                }} />
                <img src={generatingText} alt="generating" style={{ width: 160, marginTop: 24 }} />
            </div>
            {/* CSS keyframes ในตัว */}
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