import React, { useRef, useState, useEffect } from 'react';
import promptTitle from '../../assets/texts/prompt.png';
import promptBg from '../../assets/background/prompt-background.png';
import generateBtn from '../../assets/buttons/generate.png';
import arrowLeft from '../../assets/icons/arrow-left.png';
import mamaLogo from '../../assets/logos/mama.png';
import { generateImageWithDalle3 } from '../../api/generateImage.js';

const PromptInput = ({ onBack, fadingIn, onStartLoading, onImageGenerated, onError, disabled }) => {
    const videoRef = useRef(null);
    const [input, setInput] = useState('');
    const [generating, setGenerating] = useState(false);
    const [pressed, setPressed] = useState(false);
    const [backPressed, setBackPressed] = useState(false);
    const [showAnim, setShowAnim] = useState(false);
    const [titleAnim, setTitleAnim] = useState(false);
    const [boxAnim, setBoxAnim] = useState(false);
    const [logoAnim, setLogoAnim] = useState(false);

    // const [isFrontCamera, setIsFrontCamera] = useState(true); // ลบออกเพราะไม่ได้ใช้

    useEffect(() => {
        if (fadingIn) {
            setTimeout(() => setShowAnim(true), 50);
            setTimeout(() => setTitleAnim(true), 250);
            setTimeout(() => setBoxAnim(true), 400);
            setTimeout(() => setLogoAnim(true), 600);
        } else {
            setShowAnim(false);
            setTitleAnim(false);
            setBoxAnim(false);
            setLogoAnim(false);
        }
    }, [fadingIn]);

    React.useEffect(() => {
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

    const handleGenerate = async () => {
        if (!input.trim() || generating || disabled) return;
        setGenerating(true);

        // เรียก onStartLoading ทันทีเพื่อแสดง loading screen
        if (onStartLoading) onStartLoading();

        try {
            const url = await generateImageWithDalle3({ prompt: input.trim() });
            if (onImageGenerated) onImageGenerated(url);
        } catch (err) {
            let errorMessage = 'เกิดข้อผิดพลาดในการสร้างภาพ';

            if (err.message.includes('400')) {
                errorMessage = 'รูปแบบข้อความไม่ถูกต้องหรือพบคำไม่เหมาะสม กรุณากรอก prompt ใหม่อีกครั้ง';
            } else if (err.message.includes('401')) {
                errorMessage = 'API Key ไม่ถูกต้อง กรุณาตรวจสอบการตั้งค่า';
            } else if (err.message.includes('429')) {
                errorMessage = 'เกินโควต้าการใช้งาน กรุณารอสักครู่แล้วลองใหม่';
            } else if (err.message.includes('500')) {
                errorMessage = 'เซิร์ฟเวอร์มีปัญหา กรุณาลองใหม่ในภายหลัง';
            }

            // ส่ง error message ไปที่ App.jsx
            if (onError) onError(errorMessage);
        } finally {
            setGenerating(false);
        }
    };

    // Responsive style
    const promptBoxWidth = 'min(320px, 90vw)';
    const promptBoxHeight = '198px'; // เพิ่มความสูงอีก 10%
    const promptBoxTop = '32%'; // ขยับขึ้นอีก 10%

    return (
        <div style={{
            width: '100vw',
            height: '100vh',
            position: 'relative',
            overflow: 'hidden',
            background: '#000',
            opacity: showAnim ? 1 : 0,
            transition: 'opacity 0.7s',
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
            {/* ปุ่มย้อนกลับ */}
            <button
                onClick={onBack || (() => console.log('back'))}
                onPointerDown={() => setBackPressed(true)}
                onPointerUp={() => setBackPressed(false)}
                onPointerLeave={() => setBackPressed(false)}
                style={{
                    position: 'absolute',
                    top: 20,
                    left: 16,
                    zIndex: 10,
                    background: 'none',
                    border: 'none',
                    padding: 0,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'transform 0.12s',
                    transform: backPressed ? 'scale(0.92)' : 'scale(1)',
                }}
            >
                <img src={arrowLeft} alt="back" style={{ width: 32, height: 32 }} />
            </button>
            {/* หัวข้อ prompt */}
            <img
                src={promptTitle}
                alt="prompt title"
                style={{
                    position: 'absolute',
                    top: 48,
                    left: '50%',
                    width: 260,
                    maxWidth: '80vw',
                    zIndex: 2,
                    transform: titleAnim ? 'translateX(-50%) scale(1)' : 'translateX(-50%) scale(0.7)',
                    opacity: titleAnim ? 1 : 0,
                    transition: 'opacity 0.7s, transform 0.7s cubic-bezier(.68,-0.55,.27,1.55)',
                    animation: titleAnim ? 'prompt-title-bounce-in 0.7s' : 'none',
                }}
            />
            {/* โลโก้ mama มุมขวาล่าง */}
            <img
                src={mamaLogo}
                alt="Mama Logo"
                style={{
                    position: 'absolute',
                    right: 0,
                    bottom: 0,
                    width: 80,
                    opacity: logoAnim ? 0.9 : 0,
                    zIndex: 10,
                    transition: 'opacity 0.7s',
                }}
            />
            {/* กรอบ prompt */}
            <div
                style={{
                    position: 'absolute',
                    top: promptBoxTop,
                    left: '50%',
                    width: promptBoxWidth,
                    height: promptBoxHeight,
                    backgroundImage: `url(${promptBg})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    borderRadius: 20,
                    boxShadow: '0 4px 24px rgba(0,0,0,0.15)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '16px 16px 12px 16px',
                    zIndex: 2,
                    transform: boxAnim ? 'translate(-50%, 0) scale(1)' : 'translate(-50%, 0) scale(0.7)',
                    opacity: boxAnim ? 1 : 0,
                    transition: 'opacity 0.7s, transform 0.7s cubic-bezier(.68,-0.55,.27,1.55)',
                    animation: boxAnim ? 'prompt-box-bounce-in 0.7s' : 'none',
                }}
            >
                <div style={{ width: '100%', position: 'relative' }}>
                    <textarea
                        value={input}
                        onChange={e => {
                            const value = e.target.value;
                            if (value.length <= 500) {
                                setInput(value);
                            }
                        }}
                        disabled={generating}
                        maxLength={500}
                        placeholder="พิมพ์ข้อความของคุณที่นี่..."
                        style={{
                            width: '100%',
                            fontSize: 16,
                            border: 'none',
                            outline: 'none',
                            borderRadius: 10,
                            padding: '12px 14px',
                            marginBottom: '8px',
                            background: 'rgba(255,255,255,0.85)',
                            color: '#222',
                            boxSizing: 'border-box',
                            resize: 'none',
                            minHeight: '80px',
                            maxHeight: '120px',
                            fontFamily: 'inherit',
                            lineHeight: '1.4',
                        }}
                    />
                    <div
                        style={{
                            position: 'absolute',
                            bottom: '4px',
                            right: '8px',
                            fontSize: '12px',
                            color: input.length >= 450 ? '#ff6b6b' : '#666',
                            fontWeight: 'bold',
                            background: 'rgba(255,255,255,0.9)',
                            padding: '2px 6px',
                            borderRadius: '4px',
                        }}
                    >
                        {input.length}/500
                    </div>
                </div>
                <button
                    onClick={handleGenerate}
                    disabled={!input.trim() || generating}
                    onPointerDown={() => setPressed(true)}
                    onPointerUp={() => setPressed(false)}
                    onPointerLeave={() => setPressed(false)}
                    style={{
                        border: 'none',
                        background: 'none',
                        padding: 0,
                        outline: 'none',
                        cursor: (!input.trim() || generating) ? 'not-allowed' : 'pointer',
                        transition: 'transform 0.1s',
                        transform: pressed ? 'scale(0.93)' : 'scale(1)',
                        opacity: (!input.trim() || generating) ? 0.5 : 1,
                        borderRadius: 10,
                        width: 120,
                        height: 40,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginTop: 18,
                    }}
                >
                    <img src={generateBtn} alt="generate" style={{ width: '100%', height: '100%', objectFit: 'contain', pointerEvents: 'none' }} />
                </button>
            </div>

            <style>{`
                @keyframes prompt-title-bounce-in {
                    0% { opacity: 0; transform: translateX(-50%) scale(0.7); }
                    60% { opacity: 1; transform: translateX(-50%) scale(1.15); }
                    80% { transform: translateX(-50%) scale(0.95); }
                    100% { opacity: 1; transform: translateX(-50%) scale(1); }
                }
                @keyframes prompt-box-bounce-in {
                    0% { opacity: 0; transform: translate(-50%, 0) scale(0.7); }
                    60% { opacity: 1; transform: translate(-50%, 0) scale(1.12); }
                    80% { transform: translate(-50%, 0) scale(0.96); }
                    100% { opacity: 1; transform: translate(-50%, 0) scale(1); }
                }
                @keyframes fadeIn {
                    0% { opacity: 0; }
                    100% { opacity: 1; }
                }
                @keyframes slideIn {
                    0% { opacity: 0; transform: translateY(-20px) scale(0.9); }
                    100% { opacity: 1; transform: translateY(0) scale(1); }
                }
            `}</style>
        </div>
    );
};

export default PromptInput; 