import React, { useRef, useEffect, useState } from 'react';
import kimchiSeafoodBtn from '../../assets/buttons/kimchi-seafood.png';
import tonkotsuBtn from '../../assets/buttons/tonkotsu.png';
import cheesyGochujangBtn from '../../assets/buttons/cheesy-gochujang.png';
import flavorsTitle from '../../assets/texts/flavors-title.png';
import mamaLogo from '../../assets/logos/mama.png';
import flavorsBackground from '../../assets/background/flavors-background.png';

const flavorList = [
    { key: 'kimchi-seafood', img: kimchiSeafoodBtn, alt: 'Kimchi Seafood' },
    { key: 'tonkotsu', img: tonkotsuBtn, alt: 'Tonkotsu' },
    { key: 'cheesy-gochujang', img: cheesyGochujangBtn, alt: 'Cheesy Gochujang' },
];

const CameraWithFlavorSelect = ({ onSelectFlavor, fading }) => {
    const cameraMaxWidth = 420;
    const cameraMaxHeight = 700;
    const videoRef = useRef(null);
    const [isFrontCamera] = React.useState(true);
    const [isSmallScreen, setIsSmallScreen] = React.useState(false);
    const [pressed, setPressed] = React.useState(null);
    const [showButtons, setShowButtons] = useState([false, false, false]);
    const [bgFadingIn, setBgFadingIn] = useState(false);
    const [titleAnim, setTitleAnim] = useState(false);
    const [cameraAnim, setCameraAnim] = useState(false);
    const [logoAnim, setLogoAnim] = useState(false);
    // ลบ selectedFlavor state

    useEffect(() => {
        setTimeout(() => setBgFadingIn(true), 50); // fade-in ทันทีหลัง mount
        setTimeout(() => setTitleAnim(true), 250);
        setTimeout(() => setCameraAnim(true), 400);
        setTimeout(() => setLogoAnim(true), 600);
        let stream;
        async function startCamera() {
            try {
                const constraints = { video: { facingMode: isFrontCamera ? 'user' : 'environment' } };
                stream = await navigator.mediaDevices.getUserMedia(constraints);
                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                }
            } catch (err) {
                console.error('Cannot access camera', err);
            }
        }
        startCamera();
        return () => {
            if (stream) {
                stream.getTracks().forEach(track => track.stop());
            }
        };
    }, [isFrontCamera]);

    useEffect(() => {
        function handleResize() {
            setIsSmallScreen(window.innerHeight <= 700);
        }
        handleResize();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    useEffect(() => {
        // แสดงปุ่ม flavor ทีละอันหลังกล้องขึ้น
        const delay = 1200; // ms
        let btnTimers = [];
        btnTimers[0] = setTimeout(() => setShowButtons([true, false, false]), delay + 400);
        btnTimers[1] = setTimeout(() => setShowButtons([true, true, false]), delay + 600);
        btnTimers[2] = setTimeout(() => setShowButtons([true, true, true]), delay + 800);
        return () => {
            btnTimers.forEach(clearTimeout);
        };
    }, []);

    // ปรับขนาดสำหรับจอเล็ก
    const btnWidth = isSmallScreen ? 160 : 220;
    const titleWidth = isSmallScreen ? 180 : 260;
    const btnGap = isSmallScreen ? 8 : 16;

    return (
        <div
            style={{
                width: '100vw',
                height: '100vh',
                backgroundImage: `url(${flavorsBackground})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                position: 'relative',
                overflow: 'hidden',
                paddingBottom: 'env(safe-area-inset-bottom, 24px)',
                opacity: bgFadingIn && !fading ? 1 : 0,
                transition: fading
                    ? 'opacity 0.7s cubic-bezier(.4,0,.2,1)'
                    : 'opacity 1s cubic-bezier(.4,0,.2,1)',
            }}
        >
            {/* โลโก้มุมขวาล่าง */}
            <img
                src={mamaLogo}
                alt="Mama Logo"
                style={{
                    position: 'absolute',
                    right: 0,
                    bottom: 'env(safe-area-inset-bottom, 0)',
                    width: 80,
                    opacity: logoAnim && !fading ? 0.9 : 0,
                    zIndex: 10,
                    transition: 'opacity 0.7s',
                }}
            />
            {/* หัวเรื่อง (ล้นออกไปทับขอบกล้อง) */}
            <img
                src={flavorsTitle}
                alt="เลือก MAMA OK รสโปรดของคุณ"
                style={{
                    position: 'absolute',
                    top: 'calc(50% - 39vh - 32px)',
                    left: '50%',
                    transform: titleAnim && !fading
                        ? 'translateX(-50%) scale(1)'
                        : 'translateX(-50%) scale(0.7)',
                    width: titleWidth,
                    maxWidth: '90vw',
                    zIndex: 100,
                    opacity: titleAnim && !fading ? 1 : 0,
                    pointerEvents: 'none',
                    transition: fading
                        ? 'opacity 0.5s, transform 0.7s cubic-bezier(.68,-0.55,.27,1.55)'
                        : 'opacity 0.7s, transform 0.7s cubic-bezier(.68,-0.55,.27,1.55)',
                    animation: fading ? 'title-bounce-out 0.7s' : titleAnim ? 'title-bounce-in 0.7s' : 'none',
                }}
            />
            {/* กล่องกล้องและปุ่ม */}
            <div
                style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: cameraAnim && !fading
                        ? 'translate(-50%, -50%) scale(1)'
                        : 'translate(-50%, -50%) scale(0.7)',
                    height: '78vh',
                    aspectRatio: '9/16',
                    maxHeight: cameraMaxHeight,
                    maxWidth: cameraMaxWidth,
                    width: 'auto',
                    borderRadius: 24,
                    zIndex: 1,
                    overflow: 'hidden',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 4px 32px rgba(0,0,0,0.12)',
                    filter: cameraAnim && !fading ? 'blur(0px)' : 'blur(16px)',
                    transition: fading
                        ? 'filter 0.7s, transform 0.7s cubic-bezier(.68,-0.55,.27,1.55)'
                        : 'filter 0.7s, transform 0.7s cubic-bezier(.68,-0.55,.27,1.55)',
                }}
            >
                {/* video กล้อง */}
                <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        borderRadius: 24,
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        zIndex: 0,
                        transform: isFrontCamera ? 'scaleX(-1)' : 'none',
                    }}
                />
                {/* ปุ่ม flavor */}
                <div
                    style={{
                        position: 'relative',
                        zIndex: 1,
                        width: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: btnGap,
                        flex: 1,
                    }}
                >
                    {flavorList.map((flavor, idx) => (
                        <button
                            key={flavor.key}
                            onClick={() => onSelectFlavor && onSelectFlavor(flavor.key)}
                            onPointerDown={() => setPressed(flavor.key)}
                            onPointerUp={() => setPressed(null)}
                            onPointerLeave={() => setPressed(null)}
                            style={{
                                border: 'none',
                                background: 'none',
                                padding: 0,
                                outline: 'none',
                                cursor: 'pointer',
                                width: btnWidth,
                                maxWidth: '90%',
                                transition: 'transform 0.4s cubic-bezier(.68,-0.55,.27,1.55), opacity 0.4s cubic-bezier(.68,-0.55,.27,1.55)',
                                transform: showButtons[idx] && !fading
                                    ? (pressed === flavor.key ? 'scale(0.95)' : 'scale(1)')
                                    : 'scale(0.7)',
                                opacity: showButtons[idx] && !fading ? 1 : 0,
                                boxShadow: 'none',
                                WebkitTapHighlightColor: 'transparent',
                                borderRadius: 16,
                                zIndex: 1,
                            }}
                            tabIndex={0}
                        >
                            {flavor.img ? (
                                <img src={flavor.img} alt={flavor.alt} style={{ width: '100%', display: 'block', borderRadius: 16 }} draggable={false} />
                            ) : (
                                <div style={{
                                    width: '100%',
                                    height: 56,
                                    background: 'linear-gradient(90deg, #f5e1ff 0%, #ffe1e1 100%)',
                                    borderRadius: 16,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontWeight: 'bold',
                                    fontSize: 24,
                                    color: '#a200b8',
                                    letterSpacing: 2,
                                    boxShadow: '0 2px 8px rgba(160,0,184,0.08)',
                                    border: '2px dashed #a200b8',
                                }}>
                                    SECRET
                                </div>
                            )}
                        </button>
                    ))}
                </div>
            </div>
            <style>{`
                @keyframes title-bounce-in {
                    0% { opacity: 0; transform: translateX(-50%) scale(0.7); }
                    60% { opacity: 1; transform: translateX(-50%) scale(1.15); }
                    80% { transform: translateX(-50%) scale(0.95); }
                    100% { opacity: 1; transform: translateX(-50%) scale(1); }
                }
                @keyframes title-bounce-out {
                    0% { opacity: 1; transform: translateX(-50%) scale(1); }
                    40% { transform: translateX(-50%) scale(1.15); }
                    100% { opacity: 0; transform: translateX(-50%) scale(0.7); }
                }
            `}</style>
        </div>
    );
};

export default CameraWithFlavorSelect; 