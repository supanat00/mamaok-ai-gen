import React, { useEffect, useState } from 'react';
import '../../App.css';
import mockupImage from '../../assets/mockup/mockup.png';
import previewBackground from '../../assets/background/preview-background.png';

// ฟังก์ชันตรวจสอบ platform
const isIOS = () => {
    return /iPad|iPhone|iPod/.test(navigator.userAgent);
};

const isSafari = () => {
    return /Safari/.test(navigator.userAgent) && !/Chrome/.test(navigator.userAgent);
};

const PreviewModal = ({ onRetry, capturedPhoto }) => {
    const [areAssetsReady, setAreAssetsReady] = useState(false);
    const [showFeedback, setShowFeedback] = useState(false);
    const [feedbackMessage, setFeedbackMessage] = useState('');

    // ตรวจสอบ platform
    const isIOS_Safari = isIOS() || (isSafari() && /iP(hone|od|ad)/.test(navigator.userAgent));



    useEffect(() => {
        // Simulate asset loading
        const timer = setTimeout(() => {
            setAreAssetsReady(true);
        }, 100);
        return () => clearTimeout(timer);
    }, []);

    // ฟังก์ชันแสดงผลยืนยัน
    const showFeedbackMessage = (message) => {
        setFeedbackMessage(message);
        setShowFeedback(true);
        setTimeout(() => setShowFeedback(false), 2000);
    };

    // ฟังก์ชันสร้างลิงก์สำหรับดาวน์โหลด
    const createDownloadLink = (imageUrl) => {
        const link = document.createElement('a');
        link.href = imageUrl;
        link.download = `mama-ok-ar-${Date.now()}.png`;
        return link;
    };

    // ฟังก์ชันจัดการการบันทึก (Android/Chrome)
    const handleSave = async () => {
        try {
            // ตรวจสอบว่าเป็นวิดีโอหรือภาพ
            if (capturedPhoto && capturedPhoto.mimeType && capturedPhoto.mimeType.startsWith('video/')) {
                // บันทึกวิดีโอ
                const link = document.createElement('a');
                link.href = capturedPhoto.src;
                link.download = `mama-ok-ar-video-${Date.now()}.mp4`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                showFeedbackMessage('✅ บันทึกวิดีโอแล้ว!');
            } else {
                // บันทึกภาพ
                const imageUrl = capturedPhoto?.src || capturedPhoto || mockupImage;
                const link = createDownloadLink(imageUrl);
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                showFeedbackMessage('✅ บันทึกแล้ว!');
            }
        } catch (error) {
            console.error('Error saving:', error);
            showFeedbackMessage('❌ ไม่สามารถบันทึกได้');
        }
    };

    // ฟังก์ชันจัดการการแชร์ (Android/Chrome)
    const handleShare = async () => {
        try {
            // ตรวจสอบว่าเป็นวิดีโอหรือภาพ
            if (capturedPhoto && capturedPhoto.mimeType && capturedPhoto.mimeType.startsWith('video/')) {
                // แชร์วิดีโอ
                if (navigator.share && navigator.canShare) {
                    // สร้างไฟล์วิดีโอจาก blob URL
                    const response = await fetch(capturedPhoto.src);
                    const blob = await response.blob();
                    const file = new File([blob], `mama-ok-ar-video-${Date.now()}.mp4`, { type: 'video/mp4' });

                    if (navigator.canShare({ files: [file] })) {
                        navigator.share({
                            title: 'MAMA OK AR Filter',
                            text: 'ดูวิดีโอที่ฉันสร้างด้วย MAMA OK AR Filter!',
                            files: [file]
                        }).then(() => {
                            showFeedbackMessage('📤 แชร์วิดีโอแล้ว!');
                        }).catch((error) => {
                            console.error('Error sharing video:', error);
                            showFeedbackMessage('❌ ไม่สามารถแชร์วิดีโอได้');
                        });
                    } else {
                        showFeedbackMessage('❌ ไม่สามารถแชร์วิดีโอได้');
                    }
                } else {
                    showFeedbackMessage('❌ ไม่สามารถแชร์วิดีโอได้');
                }
            } else {
                // แชร์ภาพ
                const imageUrl = capturedPhoto?.src || capturedPhoto || mockupImage;

                // สร้าง canvas เพื่อแปลงเป็น blob สำหรับการแชร์
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                const img = new Image();

                img.onload = () => {
                    canvas.width = img.width;
                    canvas.height = img.height;
                    ctx.drawImage(img, 0, 0);

                    canvas.toBlob((blob) => {
                        if (navigator.share && navigator.canShare) {
                            const file = new File([blob], `mama-ok-ar-${Date.now()}.png`, { type: 'image/png' });

                            // ตรวจสอบว่าแชร์ไฟล์ได้หรือไม่
                            if (navigator.canShare({ files: [file] })) {
                                navigator.share({
                                    title: 'MAMA OK AR Filter',
                                    text: 'ดูรูปที่ฉันสร้างด้วย MAMA OK AR Filter!',
                                    files: [file]
                                }).then(() => {
                                    showFeedbackMessage('📤 แชร์แล้ว!');
                                }).catch((error) => {
                                    console.error('Error sharing file:', error);
                                    // Fallback: แชร์ URL แทน
                                    navigator.share({
                                        title: 'MAMA OK AR Filter',
                                        text: 'ดูรูปที่ฉันสร้างด้วย MAMA OK AR Filter!',
                                        url: window.location.href
                                    }).then(() => {
                                        showFeedbackMessage('📤 แชร์แล้ว!');
                                    }).catch((shareError) => {
                                        console.error('Error sharing URL:', shareError);
                                        showFeedbackMessage('❌ ไม่สามารถแชร์ได้');
                                    });
                                });
                            } else {
                                // Fallback: แชร์ URL แทน
                                navigator.share({
                                    title: 'MAMA OK AR Filter',
                                    text: 'ดูรูปที่ฉันสร้างด้วย MAMA OK AR Filter!',
                                    url: window.location.href
                                }).then(() => {
                                    showFeedbackMessage('📤 แชร์แล้ว!');
                                }).catch((shareError) => {
                                    console.error('Error sharing URL:', shareError);
                                    showFeedbackMessage('❌ ไม่สามารถแชร์ได้');
                                });
                            }
                        } else {
                            // Fallback สำหรับเบราว์เซอร์ที่ไม่รองรับ Web Share API
                            const url = URL.createObjectURL(blob);
                            const link = createDownloadLink(url);
                            document.body.appendChild(link);
                            link.click();
                            document.body.removeChild(link);
                            URL.revokeObjectURL(url);
                            showFeedbackMessage('✅ บันทึกแล้ว!');
                        }
                    }, 'image/png');
                };

                img.src = imageUrl;
            }
        } catch (error) {
            console.error('Error sharing:', error);
            showFeedbackMessage('❌ ไม่สามารถแชร์ได้');
        }
    };

    // ฟังก์ชันจัดการการบันทึกสำหรับ iOS/Safari (เปิดการแชร์ของเครื่อง)
    const handleIOSSave = async () => {
        try {
            // ตรวจสอบว่าเป็นวิดีโอหรือภาพ
            if (capturedPhoto && capturedPhoto.mimeType && capturedPhoto.mimeType.startsWith('video/')) {
                // แชร์วิดีโอสำหรับ iOS
                if (navigator.share) {
                    const response = await fetch(capturedPhoto.src);
                    const blob = await response.blob();
                    const file = new File([blob], `mama-ok-ar-video-${Date.now()}.mp4`, { type: 'video/mp4' });

                    navigator.share({
                        title: 'MAMA OK AR Filter',
                        text: 'ดูวิดีโอที่ฉันสร้างด้วย MAMA OK AR Filter!',
                        files: [file]
                    }).then(() => {
                        showFeedbackMessage('📤 แชร์วิดีโอแล้ว!');
                    }).catch((error) => {
                        console.error('Error sharing video:', error);
                        showFeedbackMessage('❌ ไม่สามารถแชร์วิดีโอได้');
                    });
                } else {
                    showFeedbackMessage('❌ ไม่สามารถแชร์วิดีโอได้');
                }
            } else {
                // แชร์ภาพสำหรับ iOS
                const imageUrl = capturedPhoto?.src || capturedPhoto || mockupImage;

                // สร้าง canvas เพื่อแปลงเป็น blob
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                const img = new Image();

                img.onload = () => {
                    canvas.width = img.width;
                    canvas.height = img.height;
                    ctx.drawImage(img, 0, 0);

                    canvas.toBlob((blob) => {
                        if (navigator.share) {
                            const file = new File([blob], `mama-ok-ar-${Date.now()}.png`, { type: 'image/png' });
                            navigator.share({
                                title: 'MAMA OK AR Filter',
                                text: 'ดูรูปที่ฉันสร้างด้วย MAMA OK AR Filter!',
                                files: [file]
                            }).then(() => {
                                showFeedbackMessage('📤 แชร์แล้ว!');
                            }).catch((error) => {
                                console.error('Error sharing:', error);
                                showFeedbackMessage('❌ ไม่สามารถแชร์ได้');
                            });
                        } else {
                            // Fallback สำหรับ Safari ที่ไม่รองรับ Web Share API
                            const url = URL.createObjectURL(blob);
                            const link = createDownloadLink(url);
                            document.body.appendChild(link);
                            link.click();
                            document.body.removeChild(link);
                            URL.revokeObjectURL(url);
                            showFeedbackMessage('✅ บันทึกแล้ว!');
                        }
                    }, 'image/png');
                };

                img.src = imageUrl;
            }
        } catch (error) {
            console.error('Error saving for iOS:', error);
            showFeedbackMessage('❌ ไม่สามารถบันทึกได้');
        }
    };

    return (
        <>
            {areAssetsReady && (
                <div
                    className="preview-modal visible"
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="preview-heading"
                >
                    {/* พื้นหลัง */}
                    <img
                        src={previewBackground}
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

                    {/* กรอบแสดงผลลัพธ์ */}
                    <div className="preview-content-frame" style={{ position: 'relative', overflow: 'hidden' }}>
                        <img
                            src={previewBackground}
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
                        {/* ภาพหรือวิดีโอที่ถ่ายแล้วหรือ mockup */}
                        {capturedPhoto && capturedPhoto.mimeType && capturedPhoto.mimeType.startsWith('video/') ? (
                            // แสดงวิดีโอ
                            <video
                                src={capturedPhoto.src}
                                alt="Video preview"
                                className="preview-content with-border"
                                style={{ position: 'relative', zIndex: 1 }}
                                controls
                                autoPlay
                                muted
                                loop
                            />
                        ) : (
                            // แสดงภาพ
                            <img
                                src={capturedPhoto?.src || capturedPhoto || mockupImage}
                                alt="Capture preview"
                                className="preview-content with-border"
                                style={{ position: 'relative', zIndex: 1 }}
                            />
                        )}
                    </div>

                    <h2 id="preview-heading" className="visually-hidden">Content Preview</h2>

                    {/* ปุ่มควบคุม */}
                    <div className="preview-actions-container">
                        {isIOS_Safari ? (
                            // Safari/iOS: 2 ปุ่ม
                            <>
                                <div className="preview-actions-top-row">
                                    <button className="preview-button primary" onClick={onRetry}>
                                        เล่นอีกครั้ง
                                    </button>
                                    <button className="preview-button secondary" onClick={handleIOSSave}>
                                        บันทึก
                                    </button>
                                </div>
                            </>
                        ) : (
                            // Chrome/Android: 3 ปุ่ม
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

                    {/* การแสดงผลยืนยัน */}
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

export default PreviewModal; 