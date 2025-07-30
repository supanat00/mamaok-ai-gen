import React, { useRef, useEffect, useState } from 'react';
import './PreviewModal.css';
import { AdvancedImage } from '@cloudinary/react';
import { cld } from '../../utils/cloudinary';
import { quality } from '@cloudinary/url-gen/actions/delivery';
import { isIOS, isSafari } from '../../utils/deviceUtils';

// --- Cloudinary Assets (Pre-defined) ---
const backgroundCldImage = cld.image('TKO/MAMAOK/images/preview-bg.webp').delivery(quality('auto'));
const logoCldImage = cld.image('TKO/MAMAOK/images/mama-logo.webp').delivery(quality('auto'));

// --- Helper Component: Preloader ---
const ImagePreloader = ({ imageUrl, onLoaded }) => {
    useEffect(() => {
        const img = new window.Image();
        img.src = imageUrl;
        img.onload = onLoaded;
    }, [imageUrl, onLoaded]);
    return null;
};

/**
 * PreviewModal
 * 
 * Component ที่แสดงผลลัพธ์ (ภาพนิ่งหรือวิดีโอ) และจัดการ action ของผู้ใช้
 * - ปรับปรุง Layout ปุ่มใหม่เป็น 3 ปุ่ม
 * - แก้ปัญหา Asset โหลดช้าโดยใช้ Preloader และจัดการ State
 */
const PreviewModal = ({ preview, onRetry, onSave, onShare }) => {
    const videoRef = useRef(null);
    const [areAssetsReady, setAreAssetsReady] = useState(false);
    const [showFeedback, setShowFeedback] = useState(false);
    const [feedbackMessage, setFeedbackMessage] = useState('');

    // --- Platform detection ---
    let isIOS_Safari = false;
    try {
        isIOS_Safari = isIOS() || (isSafari() && /iP(hone|od|ad)/.test(navigator.userAgent));
    } catch {
        isIOS_Safari = false;
    }

    // Effect จัดการการเล่นวิดีโอ (เหมือนเดิม)
    useEffect(() => {
        if (preview.type === 'video' && videoRef.current) {
            // บังคับให้เล่นอีกครั้งเมื่อ component แสดงผล
            videoRef.current.play().catch(error => {
                console.warn("Video autoplay was prevented on preview:", error);
            });
        }
    }, [preview.type, preview.src]);

    // Preload background image before showing modal
    const handleBackgroundLoaded = () => setAreAssetsReady(true);

    // ฟังก์ชันแสดงผลยืนยัน
    const showFeedbackMessage = (message) => {
        setFeedbackMessage(message);
        setShowFeedback(true);
        setTimeout(() => setShowFeedback(false), 2000);
    };

    // ฟังก์ชันจัดการการบันทึก
    const handleSave = () => {
        onSave();
        showFeedbackMessage('✅ บันทึกแล้ว!');
    };

    // ฟังก์ชันจัดการการแชร์
    const handleShare = () => {
        onShare();
        showFeedbackMessage('📤 แชร์แล้ว!');
    };

    return (
        <>
            <ImagePreloader
                imageUrl={backgroundCldImage.toURL()}
                onLoaded={handleBackgroundLoaded}
            />
            {areAssetsReady && (
                <div
                    className={`preview-modal visible`}
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="preview-heading"
                >
                    <AdvancedImage
                        cldImg={backgroundCldImage}
                        alt=""
                        className="preview-modal-bg"
                        style={{
                            position: 'fixed',
                            zIndex: 0,
                            top: 0,
                            left: 0,
                            width: '100vw',
                            height: '100vh',
                            objectFit: 'cover',
                            backgroundSize: 'cover',
                            backgroundPosition: 'center',
                            backgroundRepeat: 'no-repeat',
                            pointerEvents: 'none'
                        }}
                        aria-hidden="true"
                    />
                    <div className="preview-content-frame" style={{ position: 'relative', overflow: 'hidden' }}>
                        <AdvancedImage
                            cldImg={backgroundCldImage}
                            alt=""
                            className="preview-background-image true-bg"
                            style={{
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                width: '100%',
                                height: '100%',
                                objectFit: 'cover',
                                borderRadius: '20px',
                                zIndex: 0
                            }}
                        />
                        {/* เราจะใส่กรอบ (border) ให้กับ content โดยตรง แทนที่จะหวังพึ่ง frame */}
                        {preview.type === 'image' && (
                            <img
                                src={preview.src}
                                alt="Capture preview"
                                className="preview-content with-border"
                                style={{ position: 'relative', zIndex: 1 }}
                            />
                        )}
                        {preview.type === 'video' && (
                            <video
                                ref={videoRef}
                                src={preview.src}
                                autoPlay
                                loop
                                muted
                                playsInline
                                className="preview-content with-border"
                                style={{ position: 'relative', zIndex: 1 }}
                            />
                        )}
                    </div>

                    <h2 id="preview-heading" className="visually-hidden">Content Preview</h2>

                    <AdvancedImage
                        cldImg={logoCldImage}
                        alt="Brand Logo"
                        className={`preview-brand-logo${window.innerHeight < 600 ? ' hide' : ''}`}
                    />

                    {/* --- Layout ปุ่มแบบใหม่ --- */}
                    <div className="preview-actions-container">
                        {isIOS_Safari ? (
                            <>
                                <div className="preview-actions-top-row">
                                    <button className="preview-button primary" onClick={onRetry}>
                                        เล่นอีกครั้ง
                                    </button>
                                    <button className="preview-button secondary" onClick={handleShare}>
                                        บันทึก
                                    </button>
                                </div>
                            </>
                        ) : (
                            <>
                                <div className="preview-actions-top-row">
                                    <button className="preview-button secondary" onClick={handleSave}>
                                        บันทึก
                                    </button>
                                    <button className="preview-button secondary" onClick={handleShare}>
                                        แชร์
                                    </button>
                                </div>
                                <button className="preview-button primary full-width retry-bottom-btn" style={{ marginTop: '14px' }} onClick={onRetry}>
                                    เล่นอีกครั้ง
                                </button>
                            </>
                        )}
                    </div>



                    {/* --- การแสดงผลยืนยัน --- */}
                    {showFeedback && (
                        <div className="feedback-message">
                            <p>{feedbackMessage}</p>
                        </div>
                    )}
                </div>
            )}
        </>
    );
};

export default React.memo(PreviewModal);