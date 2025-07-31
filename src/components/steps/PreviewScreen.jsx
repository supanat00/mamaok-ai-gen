import React, { useRef, useEffect, useState, useCallback } from 'react';
import '../../App.css';
import mamaLogo from '../../assets/logos/mama.png';

// เพิ่ม import สำหรับ utils
import { detectBrowserAndPlatform } from '../../utils/deviceUtils';

// เพิ่ม import สำหรับ Muxer (Chrome/Android)
import { Muxer, ArrayBufferTarget } from 'mp4-muxer';
import pack from '../../assets/flavor/secret/pack.png';
import asset01 from '../../assets/flavor/secret/asset01.png';
import asset02 from '../../assets/flavor/secret/asset02.png';
import asset03 from '../../assets/flavor/secret/asset03.png';
import asset04 from '../../assets/flavor/secret/asset04.png';
// เพิ่ม import สำหรับ tonkotsu assets
import tonkotsuHead from '../../assets/flavor/tonkotsu/head.png';
import tonkotsuAsset01 from '../../assets/flavor/tonkotsu/asset01.png';
import tonkotsuAsset02 from '../../assets/flavor/tonkotsu/asset02.png';
import tonkotsuAsset03 from '../../assets/flavor/tonkotsu/asset03.png';
import tonkotsuPack from '../../assets/flavor/tonkotsu/pack.png';
import tonkotsuProp from '../../assets/flavor/tonkotsu/prop.png';
// เพิ่ม import สำหรับ kimchi assets
import kimchiHead from '../../assets/flavor/kimchi/head.png';
import kimchiAsset01 from '../../assets/flavor/kimchi/asset01.png';
import kimchiAsset02 from '../../assets/flavor/kimchi/asset02.png';
import kimchiAsset03 from '../../assets/flavor/kimchi/asset03.png';
import kimchiPack from '../../assets/flavor/kimchi/pack.png';
import kimchiProp from '../../assets/flavor/kimchi/prop.png';
// เพิ่ม import สำหรับ cheesy-gochujang assets
import cheesyGochujangHead from '../../assets/flavor/cheesy-gochujang/head.png';
import cheesyGochujangAsset01 from '../../assets/flavor/cheesy-gochujang/asset01.png';
import cheesyGochujangAsset02 from '../../assets/flavor/cheesy-gochujang/asset02.png';
import cheesyGochujangAsset03 from '../../assets/flavor/cheesy-gochujang/asset03.png';
import cheesyGochujangPack from '../../assets/flavor/cheesy-gochujang/pack.png';
import cheesyGochujangProp from '../../assets/flavor/cheesy-gochujang/prop.png';

// ใช้ path สำหรับ mockup เพราะถูกเรียกใช้ด้วย link
const mockupImage = '/mockup/mockup.png';

// ไอคอนสำหรับปุ่มควบคุม
import cameraIcon from '../../assets/icons/camera.svg';
import videoIcon from '../../assets/icons/video.svg';
import switchCameraIcon from '../../assets/icons/switch-camera.webp';

// เพิ่ม import สำหรับ PreviewModal
import PreviewModal from './PreviewModal';

const PreviewScreen = ({ flavor, imageUrl, isFrontCamera, setIsFrontCamera, onRestart }) => {
    const videoRef = useRef(null);
    const [cameraReady, setCameraReady] = React.useState(false);
    const [imageLoaded, setImageLoaded] = useState(false);
    // เพิ่ม state สำหรับระบบถ่ายภาพ
    const [isVideoMode, setIsVideoMode] = useState(false);
    const [isRecording, setIsRecording] = useState(false);
    const [modePressed, setModePressed] = useState(false);
    // เพิ่ม state สำหรับ stream ปัจจุบัน
    const [currentStream, setCurrentStream] = useState(null);
    // เพิ่ม state สำหรับตรวจสอบกล้องหลายตัว
    const [hasMultipleCameras, setHasMultipleCameras] = useState(false);
    // เพิ่ม state สำหรับแสดง PreviewModal
    const [showPreview, setShowPreview] = useState(false);
    // เพิ่ม state สำหรับเก็บภาพที่ถ่ายแล้ว
    const [capturedPhoto, setCapturedPhoto] = useState(null);

    // เพิ่ม refs และ state สำหรับระบบถ่ายวิดีโอ
    const mediaRecorderRef = useRef(null);
    const recordedChunksRef = useRef([]);
    const audioTrackRef = useRef(null);
    const recordTimerRef = useRef(null);
    const animationFrameIdRef = useRef(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [capturedVideo, setCapturedVideo] = useState(null);

    // เพิ่ม refs สำหรับ Muxer (Chrome/Android)
    const muxerRef = useRef(null);
    const videoEncoderRef = useRef(null);
    const audioEncoderRef = useRef(null);
    const isRecordingRef = useRef(false);

    // Cleanup blob URLs when component unmounts
    useEffect(() => {
        return () => {
            // No cleanup needed for data URLs
            // Blob URLs would need: if (imageUrl && imageUrl.startsWith('blob:')) { URL.revokeObjectURL(imageUrl); }
        };
    }, [imageUrl]);

    // Reset imageLoaded when imageUrl changes
    useEffect(() => {
        if (imageUrl) {
            setImageLoaded(false);
            // Set imageLoaded to true after a short delay to simulate loading
            const timer = setTimeout(() => setImageLoaded(true), 100);
            return () => clearTimeout(timer);
        }
    }, [imageUrl]);

    // Add lazy loading effect for generated image
    const [imageLoading, setImageLoading] = useState(true);

    useEffect(() => {
        if (imageUrl) {
            setImageLoading(true);

            const img = new Image();
            img.onload = () => {
                setImageLoading(false);
                setImageLoaded(true);
            };
            img.onerror = () => {
                setImageLoading(false);
            };
            img.src = imageUrl;
        }
    }, [imageUrl]);

    useEffect(() => {
        async function checkCameraCapabilities() {
            try {
                const devices = await navigator.mediaDevices.enumerateDevices();
                const videoDevices = devices.filter(device => device.kind === 'videoinput');
                setHasMultipleCameras(videoDevices.length > 1);
            } catch {
                setHasMultipleCameras(false);
            }
        }
        checkCameraCapabilities();
    }, []);

    useEffect(() => {
        let stream;
        async function startCamera() {
            try {
                console.log('📱 Camera mode:', isFrontCamera ? 'front' : 'back');

                // หยุด stream เดิมก่อน
                if (currentStream) {
                    currentStream.getTracks().forEach(track => track.stop());
                }

                const constraints = {
                    video: {
                        facingMode: isFrontCamera ? 'user' : 'environment',
                        width: { ideal: 1920 },
                        height: { ideal: 1080 }
                    }
                };

                stream = await navigator.mediaDevices.getUserMedia(constraints);
                console.log('✅ Camera ready');
                setCurrentStream(stream);

                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                    setCameraReady(true);
                } else {
                    console.error('❌ Video ref not available');
                }
            } catch (error) {
                console.error('❌ Camera error:', error);
                // ถ้าไม่สามารถใช้กล้องที่เลือกได้ ให้ลองใช้กล้องหน้า
                if (!isFrontCamera) {
                    try {
                        const fallbackConstraints = {
                            video: {
                                facingMode: 'user',
                                width: { ideal: 1920 },
                                height: { ideal: 1080 }
                            }
                        };
                        stream = await navigator.mediaDevices.getUserMedia(fallbackConstraints);
                        setCurrentStream(stream);
                        if (videoRef.current) {
                            videoRef.current.srcObject = stream;
                            setCameraReady(true);
                        }
                    } catch (fallbackError) {
                        console.error('❌ Fallback camera failed:', fallbackError);
                    }
                }
            }
        }
        startCamera();
        return () => {
            if (stream) {
                stream.getTracks().forEach(track => track.stop());
            }
        };
    }, [isFrontCamera]); // ลบ currentStream ออกจาก dependency



    // ฟังก์ชันสำหรับถ่ายภาพ/วิดีโอ


    // ฟังก์ชันสำหรับเริ่มอัดวิดีโอ
    const startVideoRecording = useCallback(async () => {
        console.log("🎬 ACTION: Start Video Recording");

        try {
            if (!videoRef.current) {
                console.error("❌ No video ref available");
                alert("เกิดข้อผิดพลาด: ไม่สามารถเริ่มอัดวิดีโอได้");
                return false;
            }

            console.log("✅ Video ref available, creating recording canvas");

            // ใช้ utils สำหรับตรวจสอบ platform
            const { isIOS: isIOSDevice, isSafari: isSafariBrowser, isChrome: isChromeBrowser, isAndroid: isAndroidDevice } = detectBrowserAndPlatform();
            const androidChrome = isAndroidDevice && isChromeBrowser;
            const iosSafari = isIOSDevice || isSafariBrowser;

            console.log(`📱 Platform detection (utils): Android/Chrome=${androidChrome}, iOS/Safari=${iosSafari}`);

            if (androidChrome) {
                // ใช้ Muxer สำหรับ Chrome/Android
                console.log("🎬 Starting Muxer recording for Chrome/Android");
                return startRecordingWithMuxer();
            } else {
                // ใช้ MediaRecorder สำหรับ iOS/Safari และอื่นๆ
                console.log("🎬 Starting MediaRecorder recording for iOS/Safari");
                return startRecordingWithMediaRecorder();
            }
        } catch (error) {
            console.error("❌ Failed to start video recording:", error);
            alert("ไม่สามารถเริ่มอัดวิดีโอได้");
            return false;
        }
    }, [isRecording]);

    // ฟังก์ชันสำหรับใช้ MediaRecorder (iOS/Safari และอื่นๆ)
    const startRecordingWithMediaRecorder = useCallback(async () => {
        console.log("🎥 Using MediaRecorder for iOS/Safari");

        try {
            // สร้าง canvas สำหรับอัดวิดีโอ
            const recordingCanvas = document.createElement('canvas');
            recordingCanvas.width = 720;
            recordingCanvas.height = 1280;
            const ctx = recordingCanvas.getContext('2d');
            console.log("✅ Recording canvas created");

            // สร้าง video stream จาก canvas
            const videoStream = recordingCanvas.captureStream(30);
            console.log("✅ Video stream captured from canvas");

            // เพิ่ม audio stream (ใช้ stream เดียวกันกับกล้อง)
            let audioStream = null;
            let audioTrack = null;
            try {
                if (currentStream) {
                    const audioTracks = currentStream.getAudioTracks();
                    if (audioTracks.length > 0) {
                        audioTrack = audioTracks[0];
                        audioStream = new MediaStream([audioTrack]);
                        audioTrackRef.current = audioTrack;
                        console.log("✅ Using existing audio track");
                    } else {
                        // ถ้าไม่มี audio track ใน stream เดิม ให้ขอใหม่
                        console.log("🔄 Requesting new audio stream...");
                        audioStream = await navigator.mediaDevices.getUserMedia({
                            audio: {
                                echoCancellation: true,
                                noiseSuppression: true,
                                autoGainControl: true
                            }
                        });
                        audioTrack = audioStream.getAudioTracks()[0];
                        audioTrackRef.current = audioTrack;
                        console.log("✅ New audio stream obtained");
                    }
                } else {
                    // ถ้าไม่มี stream เดิม ให้ขอใหม่
                    console.log("🔄 Requesting new audio stream...");
                    audioStream = await navigator.mediaDevices.getUserMedia({
                        audio: {
                            echoCancellation: true,
                            noiseSuppression: true,
                            autoGainControl: true
                        }
                    });
                    audioTrack = audioStream.getAudioTracks()[0];
                    audioTrackRef.current = audioTrack;
                    console.log("✅ New audio stream obtained");
                }
            } catch (audioError) {
                console.warn("⚠️ Audio permission denied or not available, recording without audio:", audioError);
            }

            // รวม stream
            const streamTracks = [...videoStream.getVideoTracks()];
            if (audioTrack) {
                streamTracks.push(audioTrack);
                console.log("✅ Combined video + audio stream");
            } else {
                console.log("⚠️ Using video-only stream");
            }
            const combinedStream = new MediaStream(streamTracks);

            // เลือก MIME type
            const mimeTypes = ['video/mp4', 'video/webm', 'video/webm;codecs=vp9', 'video/webm;codecs=vp8'];
            let selectedMimeType = null;

            for (const mimeType of mimeTypes) {
                if (MediaRecorder.isTypeSupported(mimeType)) {
                    selectedMimeType = mimeType;
                    console.log(`✅ Supported MIME type: ${mimeType}`);
                    break;
                }
            }

            if (!selectedMimeType) {
                console.warn("⚠️ No supported MIME type found, using browser default");
                selectedMimeType = 'video/mp4';
            }

            // สร้าง MediaRecorder
            const options = selectedMimeType ? { mimeType: selectedMimeType } : {};
            mediaRecorderRef.current = new MediaRecorder(combinedStream, options);
            recordedChunksRef.current = [];
            console.log("✅ MediaRecorder created with options:", options);

            mediaRecorderRef.current.ondataavailable = (event) => {
                if (event.data && event.data.size > 0) {
                    recordedChunksRef.current.push(event.data);
                    console.log("📦 Data available, chunk size:", event.data.size);
                }
            };

            mediaRecorderRef.current.onerror = (event) => {
                console.error("❌ MediaRecorder error:", event.error);
                alert("เกิดข้อผิดพลาดในการอัดวิดีโอ กรุณาลองใหม่อีกครั้ง");
                if (audioTrackRef.current) {
                    audioTrackRef.current.stop();
                    audioTrackRef.current = null;
                }
                setIsRecording(false);
                setIsProcessing(false);
            };

            mediaRecorderRef.current.onstop = async () => {
                console.log("🛑 MediaRecorder stopped, processing video file...");
                isRecordingRef.current = false;
                setIsProcessing(true);

                try {
                    const videoBlob = new Blob(recordedChunksRef.current, { type: selectedMimeType });
                    console.log("✅ Video blob created, size:", videoBlob.size);

                    if (videoBlob.size === 0) {
                        throw new Error("Recorded video is empty");
                    }

                    const videoUrl = URL.createObjectURL(videoBlob);
                    setCapturedVideo({ src: videoUrl, mimeType: selectedMimeType });
                    setShowPreview(true);
                    console.log("✅ Video processing complete");
                } catch (error) {
                    console.error("❌ Error processing video:", error);
                    alert("เกิดข้อผิดพลาดในการประมวลผลวิดีโอ");
                } finally {
                    setIsProcessing(false);
                }
            };

            // เริ่มอัดวิดีโอ
            mediaRecorderRef.current.start();
            isRecordingRef.current = true;
            console.log("🎬 MediaRecorder started, state:", mediaRecorderRef.current.state);

            // โหลด background image และ assets
            const backgroundImg = new Image();
            const assets = getAllAssets(flavor);
            console.log("🖼️ Loading background and assets...");

            // โหลด assets ทั้งหมดก่อน
            const assetImages = assets.map(asset => {
                return new Promise((resolve) => {
                    const img = new Image();
                    img.onload = () => resolve({ ...asset, img });
                    img.src = asset.src;
                });
            });

            Promise.all([backgroundImg, ...assetImages]).then(([bgImg, ...loadedAssets]) => {
                console.log("✅ All images loaded, starting frame processing");

                // เริ่มการวาด frame
                const processFrame = () => {
                    if (!isRecordingRef.current) return;

                    try {
                        // วาด background
                        ctx.drawImage(bgImg, 0, 0, 720, 1280);



                        // วาด camera frame และ video
                        const video = videoRef.current;
                        if (video && video.videoWidth > 0 && video.videoHeight > 0) {
                            // คำนวณขนาดและตำแหน่งของ video
                            const videoAspectRatio = video.videoWidth / video.videoHeight;
                            let cameraWidth, cameraHeight, cameraX, cameraY;

                            if (flavor === 'secret') {
                                cameraWidth = Math.min(1280 * 0.88, 720 * 1.12); // เพิ่มขึ้นนิดหน่อย
                                cameraHeight = Math.min(1280 * 1.12, 720 * 1.52); // เพิ่มขึ้นนิดหน่อย
                                cameraX = (720 - cameraWidth) / 2;
                                cameraY = (1280 - cameraHeight) / 2;
                            } else {
                                cameraWidth = Math.min(1280 * 0.65, 720 * 0.75);
                                cameraHeight = Math.min(1280 * 1.1, 720 * 1.3);
                                cameraX = (720 - cameraWidth) / 2;
                                cameraY = (1280 - cameraHeight) / 2;
                            }

                            // วาดเส้นสีชมพูสำหรับ flavors อื่นๆ (ไม่ใช่ secret)


                            let videoWidth = cameraWidth;
                            let videoHeight = videoWidth / videoAspectRatio;
                            if (videoHeight < cameraHeight) {
                                videoHeight = cameraHeight;
                                videoWidth = videoHeight * videoAspectRatio;
                            }
                            const videoX = cameraX + (cameraWidth - videoWidth) / 2;
                            const videoY = cameraY + (cameraHeight - videoHeight) / 2;

                            // วาด camera frame
                            ctx.save();
                            if (flavor === 'secret') {
                                ctx.beginPath();
                                // ใช้ขนาดเดียวกับ cameraWidth และ cameraHeight
                                const centerX = 720 / 2;
                                const centerY = 1280 / 2;
                                const radius = Math.min(cameraWidth, cameraHeight) / 2 * 0.4;
                                ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
                                for (let i = 0; i < 12; i++) {
                                    ctx.save();
                                    ctx.translate(centerX, centerY);
                                    ctx.rotate((i * 30) * Math.PI / 180);
                                    const scale = Math.min(cameraWidth, cameraHeight) / 100;
                                    ctx.scale(scale, scale);
                                    ctx.roundRect(38.5 - 50, -11 - 50, 23, 54, 11.5);
                                    ctx.restore();
                                }
                                ctx.stroke();

                                // วาดเส้นสีชมพูสำหรับรส secret
                                ctx.save();
                                ctx.strokeStyle = '#ff69b4';
                                ctx.lineWidth = 5;
                                ctx.stroke();
                                ctx.restore();
                            } else {
                                // ใช้ขนาดเดียวกับ cameraWidth และ cameraHeight
                                const centerX = 720 / 2;
                                const centerY = 1280 / 2;
                                const borderRadius = Math.min(cameraWidth, cameraHeight) * 0.08;
                                ctx.beginPath();
                                ctx.roundRect(
                                    centerX - cameraWidth / 2,
                                    centerY - cameraHeight / 2,
                                    cameraWidth,
                                    cameraHeight,
                                    borderRadius
                                );
                                ctx.save();
                                ctx.strokeStyle = '#ff69b4';
                                ctx.lineWidth = 4;
                                ctx.stroke();
                                ctx.restore();
                            }
                            ctx.clip();

                            // วาด video
                            if (isFrontCamera) {
                                ctx.save();
                                ctx.translate(videoX + videoWidth, videoY);
                                ctx.scale(-1, 1);
                                ctx.drawImage(video, 0, 0, videoWidth, videoHeight);
                                ctx.restore();
                            } else {
                                ctx.drawImage(video, videoX, videoY, videoWidth, videoHeight);
                            }
                            ctx.restore();
                        }

                        // วาด assets (ใช้ loadedAssets ที่โหลดแล้ว)
                        loadedAssets.forEach(asset => {
                            const position = calculateAssetPosition(asset, 720, 1280);
                            ctx.drawImage(asset.img, position.x, position.y, position.width, position.height);
                        });

                        // เรียก frame ถัดไป
                        animationFrameIdRef.current = requestAnimationFrame(processFrame);
                    } catch (error) {
                        console.error("❌ Error in frame processing:", error);
                        animationFrameIdRef.current = requestAnimationFrame(processFrame);
                    }
                };

                // เริ่มการวาด frame
                backgroundImg.onload = () => {
                    processFrame();
                };
                backgroundImg.onerror = () => {
                    console.error('ไม่สามารถโหลดภาพที่ generate ได้ ใช้ mockup แทน');
                    backgroundImg.src = '/mockup/mockup.png';
                };
                backgroundImg.src = imageUrl || '/mockup/mockup.png';
            });

            return true;
        } catch (error) {
            console.error("❌ Error starting MediaRecorder:", error);
            alert("เกิดข้อผิดพลาดในการเริ่มอัดวิดีโอ");
            return false;
        }
    }, [flavor, imageUrl, isFrontCamera, setCapturedVideo, setShowPreview, setIsProcessing]);

    // ฟังก์ชันสำหรับใช้ Muxer (Chrome/Android) - ใช้ WebCodecs + mp4-muxer
    const startRecordingWithMuxer = useCallback(async () => {
        console.log("🎬 Using Muxer for Chrome/Android");

        // ตรวจสอบ WebCodecs support
        if (!('VideoEncoder' in window) || !('AudioEncoder' in window)) {
            console.warn('⚠️ WebCodecs not supported, fallback to MediaRecorder');
            return startRecordingWithMediaRecorder();
        }

        try {
            // 1. เตรียม canvas และ context
            let videoWidth = 720;
            let videoHeight = 1280;

            // ตรวจสอบและบังคับให้เป็นเลขคู่
            if (videoWidth % 2 !== 0) videoWidth++;
            if (videoHeight % 2 !== 0) videoHeight++;

            const recordingCanvas = document.createElement('canvas');
            recordingCanvas.width = videoWidth;
            recordingCanvas.height = videoHeight;
            const ctx = recordingCanvas.getContext('2d');
            console.log("✅ Recording canvas created for Muxer");

            // 2. เตรียม mp4-muxer
            muxerRef.current = new Muxer({
                target: new ArrayBufferTarget(),
                video: { codec: 'avc', width: videoWidth, height: videoHeight },
                audio: { codec: 'aac', sampleRate: 44100, numberOfChannels: 1 },
                fastStart: 'in-memory',
            });

            // 3. เตรียม VideoEncoder
            videoEncoderRef.current = new VideoEncoder({
                output: (chunk, meta) => muxerRef.current.addVideoChunk(chunk, meta),
                error: (e) => console.error('VideoEncoder error:', e),
            });
            await videoEncoderRef.current.configure({
                codec: 'avc1.42001f',
                width: videoWidth,
                height: videoHeight,
                bitrate: 3_000_000,
            });

            // 4. เตรียม AudioEncoder
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            audioEncoderRef.current = new AudioEncoder({
                output: (chunk, meta) => muxerRef.current.addAudioChunk(chunk, meta),
                error: (e) => console.error('AudioEncoder error:', e),
            });
            await audioEncoderRef.current.configure({
                codec: 'mp4a.40.2',
                sampleRate: audioContext.sampleRate,
                numberOfChannels: 1,
                bitrate: 96000,
            });

            // 5. สร้าง AudioData สำหรับ silence
            const audioBuffer = audioContext.createBuffer(1, audioContext.sampleRate * 1, audioContext.sampleRate);
            const audioData = new AudioData({
                timestamp: 0,
                data: audioBuffer.getChannelData(0),
                numberOfFrames: audioBuffer.length,
                numberOfChannels: 1,
                sampleRate: audioContext.sampleRate,
                format: 'f32-planar'
            });
            audioEncoderRef.current.encode(audioData);
            audioData.close();

            // 6. เตรียม background image และ assets
            const backgroundImg = new Image();
            backgroundImg.crossOrigin = 'anonymous';

            // โหลด assets
            const assets = getAllAssets(flavor);
            const assetImages = assets.map(asset => {
                return new Promise((resolve) => {
                    const img = new Image();
                    img.onload = () => {
                        asset.img = img;
                        resolve(asset);
                    };
                    img.src = asset.src;
                });
            });
            const loadedAssets = await Promise.all(assetImages);
            console.log("✅ All assets loaded for Muxer");

            // 7. วาดและ encode frame loop
            let recordingStartTime = null;
            isRecordingRef.current = true;
            console.log("🎬 Starting Muxer recording loop");

            const processFrame = (currentTime) => {
                if (!isRecordingRef.current) return;
                if (recordingStartTime === null) recordingStartTime = currentTime;

                try {
                    // 1. วาด background image
                    ctx.drawImage(backgroundImg, 0, 0, videoWidth, videoHeight);

                    // 2. วาด camera frame และ video
                    const video = videoRef.current;
                    if (video) {
                        const videoAspectRatio = video.videoWidth / video.videoHeight;
                        let cameraWidth, cameraHeight, cameraX, cameraY;

                        if (flavor === 'secret') {
                            cameraWidth = Math.min(videoHeight * 0.88, videoWidth * 1.12);
                            cameraHeight = Math.min(videoHeight * 1.12, videoWidth * 1.52);
                            cameraX = (videoWidth - cameraWidth) / 2;
                            cameraY = (videoHeight - cameraHeight) / 2;
                        } else {
                            cameraWidth = Math.min(videoHeight * 0.65, videoWidth * 0.75);
                            cameraHeight = Math.min(videoHeight * 1.1, videoWidth * 1.3);
                            cameraX = (videoWidth - cameraWidth) / 2;
                            cameraY = (videoHeight - cameraHeight) / 2;
                        }

                        let videoWidth2 = cameraWidth;
                        let videoHeight2 = videoWidth2 / videoAspectRatio;
                        if (videoHeight2 < cameraHeight) {
                            videoHeight2 = cameraHeight;
                            videoWidth2 = videoHeight2 * videoAspectRatio;
                        }
                        const videoX = cameraX + (cameraWidth - videoWidth2) / 2;
                        const videoY = cameraY + (cameraHeight - videoHeight2) / 2;

                        // วาด camera frame
                        ctx.save();
                        if (flavor === 'secret') {
                            ctx.beginPath();
                            const centerX = videoWidth / 2;
                            const centerY = videoHeight / 2;
                            const radius = Math.min(cameraWidth, cameraHeight) / 2 * 0.4;
                            ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
                            for (let i = 0; i < 12; i++) {
                                ctx.save();
                                ctx.translate(centerX, centerY);
                                ctx.rotate((i * 30) * Math.PI / 180);
                                const scale = Math.min(cameraWidth, cameraHeight) / 100;
                                ctx.scale(scale, scale);
                                ctx.roundRect(38.5 - 50, -11 - 50, 23, 54, 11.5);
                                ctx.restore();
                            }
                            ctx.stroke();

                            // วาดเส้นสีชมพูสำหรับรส secret
                            ctx.save();
                            ctx.strokeStyle = '#ff69b4';
                            ctx.lineWidth = 5;
                            ctx.stroke();
                            ctx.restore();
                        } else {
                            // กรอบสี่เหลี่ยมมีขอบมนสำหรับ flavors อื่นๆ (ตามโค้ด UI)
                            const centerX = videoWidth / 2;
                            const centerY = videoHeight / 2;
                            const borderRadius = Math.min(cameraWidth, cameraHeight) * 0.08;
                            ctx.beginPath();
                            ctx.roundRect(
                                centerX - cameraWidth / 2,
                                centerY - cameraHeight / 2,
                                cameraWidth,
                                cameraHeight,
                                borderRadius
                            );
                            ctx.save();
                            ctx.strokeStyle = '#ff69b4';
                            ctx.lineWidth = 4;
                            ctx.stroke();
                            ctx.restore();
                        }
                        ctx.clip();

                        // วาด video
                        if (isFrontCamera) {
                            ctx.save();
                            ctx.translate(videoX + videoWidth2, videoY);
                            ctx.scale(-1, 1);
                            ctx.drawImage(video, 0, 0, videoWidth2, videoHeight2);
                            ctx.restore();
                        } else {
                            ctx.drawImage(video, videoX, videoY, videoWidth2, videoHeight2);
                        }
                    }

                    // 3. วาด assets
                    loadedAssets.forEach(asset => {
                        const position = calculateAssetPosition(asset, videoWidth, videoHeight);
                        ctx.drawImage(asset.img, position.x, position.y, position.width, position.height);
                    });

                    // 4. Encode frame
                    if (videoEncoderRef.current?.state === 'configured') {
                        const elapsedTimeMs = currentTime - recordingStartTime;
                        const timestamp = Math.round(elapsedTimeMs * 1000);
                        const videoFrame = new VideoFrame(recordingCanvas, { timestamp });
                        videoEncoderRef.current.encode(videoFrame);
                        videoFrame.close();
                    }

                    animationFrameIdRef.current = requestAnimationFrame(processFrame);
                } catch (frameError) {
                    console.error("❌ Frame processing error:", frameError);
                    isRecordingRef.current = false;
                    startRecordingWithMediaRecorder();
                }
            };

            // เริ่มการวาด frame
            backgroundImg.onload = () => {
                processFrame(performance.now());
            };
            backgroundImg.onerror = () => {
                console.error('ไม่สามารถโหลดภาพที่ generate ได้ ใช้ mockup แทน');
                backgroundImg.src = '/mockup/mockup.png';
            };
            backgroundImg.src = imageUrl || '/mockup/mockup.png';

            return true;
        } catch (error) {
            console.error("❌ Muxer setup failed:", error);
            console.log("🔄 Falling back to MediaRecorder");
            return startRecordingWithMediaRecorder();
        }
    }, [flavor, imageUrl, isFrontCamera, setCapturedVideo, setShowPreview, setIsProcessing]);

    // ฟังก์ชันสำหรับหยุดอัดวิดีโอ
    const stopVideoRecording = useCallback(() => {
        console.log("🛑 ACTION: Stop Video Recording");

        // หยุด MediaRecorder (สำหรับ iOS/Safari)
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
            console.log("🛑 Stopping MediaRecorder...");
            mediaRecorderRef.current.stop();
        }

        // หยุด Muxer (สำหรับ Chrome/Android)
        if (muxerRef.current) {
            console.log("🎬 Stopping Muxer recording for Chrome/Android...");

            // หยุด recording loop
            isRecordingRef.current = false;

            setIsProcessing(true);

            requestAnimationFrame(async () => {
                console.log("🔄 Processing video file with muxer...");

                // หยุด video encoder
                if (videoEncoderRef.current?.state === 'configured') {
                    console.log("🛑 Flushing video encoder...");
                    await videoEncoderRef.current.flush().catch(console.error);
                }

                // หยุด audio encoder
                if (audioEncoderRef.current?.state === 'configured') {
                    console.log("🛑 Flushing audio encoder...");
                    await audioEncoderRef.current.flush().catch(console.error);
                }

                // finalize mp4
                if (muxerRef.current) {
                    console.log("🎬 Finalizing MP4 with Muxer...");
                    muxerRef.current.finalize();
                    const { buffer } = muxerRef.current.target;
                    const videoBlob = new Blob([buffer], { type: 'video/mp4' });
                    const videoUrl = URL.createObjectURL(videoBlob);
                    setCapturedVideo({ src: videoUrl, mimeType: 'video/mp4' });
                    setShowPreview(true);
                    console.log("✅ MP4 finalized successfully with Muxer");
                }

                // Cleanup refs
                videoEncoderRef.current = null;
                audioEncoderRef.current = null;
                muxerRef.current = null;

                setIsProcessing(false);
            });
        }

        // หยุด Timer และ Animation Frame
        clearTimeout(recordTimerRef.current);
        cancelAnimationFrame(animationFrameIdRef.current);
        console.log("🛑 Cleared timers and animation frames");

        // หยุด audio track
        if (audioTrackRef.current) {
            console.log("🛑 Stopping audio track...");
            audioTrackRef.current.stop();
            audioTrackRef.current = null;
        }
    }, [setCapturedVideo, setShowPreview, setIsProcessing]);

    // ฟังก์ชันสำหรับ reset state หลังจากเสร็จสิ้น
    const resetAfterCapture = useCallback(() => {
        setCapturedVideo(null);
        setCapturedPhoto(null);
        setShowPreview(false);
        setIsProcessing(false);
        setIsRecording(false);
        // ล้าง refs
        mediaRecorderRef.current = null;
        recordedChunksRef.current = [];
        audioTrackRef.current = null;
        recordTimerRef.current = null;
        animationFrameIdRef.current = null;
    }, []);

    const handleCapture = () => {
        console.log("📸 Handle Capture - Video Mode:", isVideoMode, "Recording:", isRecording);
        console.log("📸 Current Stream:", currentStream);
        console.log("📸 Video Ref:", videoRef.current);

        if (isVideoMode) {
            if (isRecording) {
                // หยุดบันทึกวิดีโอ
                console.log("🛑 Stopping video recording...");
                stopVideoRecording();
                setIsRecording(false);
            } else {
                // เริ่มบันทึกวิดีโอ
                console.log("🎬 Starting video recording...");
                console.log("🎬 Current Stream:", currentStream);
                console.log("🎬 Video Ref:", videoRef.current);
                startVideoRecording().then(success => {
                    console.log("🎬 Video recording result:", success);
                    if (success) {
                        setIsRecording(true);
                        console.log("✅ Video recording started successfully");
                        // ตั้งเวลาหยุดอัตโนมัติ 30 วินาที
                        recordTimerRef.current = setTimeout(() => {
                            console.log("⏰ Auto-stopping video recording after 30s");
                            stopVideoRecording();
                            setIsRecording(false);
                        }, 30000);
                    } else {
                        console.error("❌ Failed to start video recording");
                    }
                });
            }
        } else {
            // ถ่ายภาพ
            console.log("📸 Taking photo...");
            capturePhoto();
        }
    };

    // ฟังก์ชันถ่ายภาพจริง (วาดทุกอย่างที่แสดงผลในหน้า UI)
    const capturePhoto = () => {
        if (!videoRef.current) return;

        try {
            // สร้าง canvas สำหรับผลลัพธ์สุดท้าย
            const finalCanvas = document.createElement('canvas');
            const ctx = finalCanvas.getContext('2d');

            // ตั้งขนาด output ตามตัวอย่าง (9:16 aspect ratio)
            const outputWidth = 1024;
            const outputHeight = 1792;
            finalCanvas.width = outputWidth;
            finalCanvas.height = outputHeight;

            requestAnimationFrame(() => {
                // 1. วาดพื้นหลัง (ใช้ mockup)
                const backgroundImage = new Image();
                backgroundImage.onload = () => {
                    ctx.drawImage(backgroundImage, 0, 0, outputWidth, outputHeight);

                    // 2. วาดเส้นกรอบหลังพื้นหลัง
                    drawCameraFrame(ctx, outputWidth, outputHeight, () => {
                        // 3. วาด video frame (กล้อง) เฉพาะในกรอบ
                        const video = videoRef.current;
                        if (video) {
                            const videoAspectRatio = video.videoWidth / video.videoHeight;

                            // คำนวณขนาดและตำแหน่งกรอบกล้องตามโค้ด UI
                            let cameraWidth, cameraHeight, cameraX, cameraY;

                            if (flavor === 'secret') {
                                // กรอบดอกไม้ 12 กลีบสำหรับ secret flavor (ตามโค้ด UI)
                                cameraWidth = Math.min(outputHeight * 0.88, outputWidth * 1.12); // เพิ่มขึ้นนิดหน่อย
                                cameraHeight = Math.min(outputHeight * 1.12, outputWidth * 1.52); // เพิ่มขึ้นนิดหน่อย
                                cameraX = (outputWidth - cameraWidth) / 2;
                                cameraY = (outputHeight - cameraHeight) / 2;
                            } else {
                                // กรอบสี่เหลี่ยมสำหรับ flavors อื่นๆ
                                cameraWidth = Math.min(outputHeight * 0.65, outputWidth * 0.75);
                                cameraHeight = Math.min(outputHeight * 1.1, outputWidth * 1.3);
                                cameraX = (outputWidth - cameraWidth) / 2;
                                cameraY = (outputHeight - cameraHeight) / 2;
                            }

                            // คำนวณขนาด video ให้เต็มกรอบกล้อง
                            let videoWidth = cameraWidth;
                            let videoHeight = videoWidth / videoAspectRatio;
                            if (videoHeight < cameraHeight) {
                                videoHeight = cameraHeight;
                                videoWidth = videoHeight * videoAspectRatio;
                            }

                            const videoX = cameraX + (cameraWidth - videoWidth) / 2;
                            const videoY = cameraY + (cameraHeight - videoHeight) / 2;

                            // สร้าง mask สำหรับกรอบกล้อง
                            ctx.save();

                            if (flavor === 'secret') {
                                // สร้าง mask รูปดอกไม้ 12 กลีบ (รูปทรงเดียวกับเส้นกรอบ)
                                ctx.beginPath();

                                // ใช้ขนาดและตำแหน่งเดียวกับเส้นกรอบ
                                const frameWidth = Math.min(outputHeight * 0.88, outputWidth * 1.12); // เพิ่มขึ้นนิดหน่อย
                                const frameHeight = Math.min(outputHeight * 1.12, outputWidth * 1.52); // เพิ่มขึ้นนิดหน่อย
                                const centerX = outputWidth / 2;
                                const centerY = outputHeight / 2;

                                // วาดวงกลมกลาง
                                const radius = Math.min(frameWidth, frameHeight) / 2 * 0.4;
                                ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);

                                // วาดกลีบดอกไม้ 12 กลีบ (รูปทรงเดียวกับเส้นกรอบ)
                                for (let i = 0; i < 12; i++) {
                                    ctx.save();
                                    ctx.translate(centerX, centerY);
                                    ctx.rotate((i * 30) * Math.PI / 180);

                                    // ใช้ขนาดและตำแหน่งเดียวกับเส้นกรอบ
                                    const scale = Math.min(frameWidth, frameHeight) / 100;
                                    ctx.scale(scale, scale);
                                    ctx.roundRect(38.5 - 50, -11 - 50, 23, 54, 11.5);
                                    ctx.restore();
                                }
                            } else {
                                // สร้าง mask รูปสี่เหลี่ยมมีขอบมน (รูปทรงเดียวกับเส้นกรอบ)
                                const frameWidth = Math.min(outputHeight * 0.65, outputWidth * 0.75);
                                const frameHeight = Math.min(outputHeight * 1.1, outputWidth * 1.3);
                                const centerX = outputWidth / 2;
                                const centerY = outputHeight / 2;
                                const borderRadius = Math.min(frameWidth, frameHeight) * 0.08;

                                ctx.roundRect(
                                    centerX - frameWidth / 2,
                                    centerY - frameHeight / 2,
                                    frameWidth,
                                    frameHeight,
                                    borderRadius
                                );
                            }

                            ctx.clip();

                            // วาด video ในกรอบ
                            if (isFrontCamera) {
                                ctx.save();
                                ctx.translate(videoX + videoWidth, videoY);
                                ctx.scale(-1, 1);
                                ctx.drawImage(video, 0, 0, videoWidth, videoHeight);
                                ctx.restore();
                            } else {
                                ctx.drawImage(video, videoX, videoY, videoWidth, videoHeight);
                            }

                            ctx.restore();
                        }

                        // 4. วาด asset ต่างๆ ตามรสชาติ
                        drawAllAssets(ctx, outputWidth, outputHeight, () => {
                            // 5. สร้าง Data URL
                            try {
                                const dataURL = finalCanvas.toDataURL('image/png', 0.9);
                                console.log('ถ่ายภาพสำเร็จ:', dataURL);
                                setCapturedPhoto(dataURL);
                                setShowPreview(true);
                            } catch (error) {
                                console.error('เกิดข้อผิดพลาดในการ export ภาพ:', error);
                                alert('เกิดข้อผิดพลาดในการถ่ายภาพ กรุณาลองใหม่อีกครั้ง');
                            }
                        });
                    });
                };

                // จัดการ error กรณีภาพโหลดไม่สำเร็จ
                backgroundImage.onerror = () => {
                    console.error('ไม่สามารถโหลดภาพที่ generate ได้ ใช้ mockup แทน');
                    backgroundImage.src = '/mockup/mockup.png';
                };

                // โหลดพื้นหลัง - ใช้ภาพที่ generate หรือ mockup
                backgroundImage.src = imageUrl || '/mockup/mockup.png';
            });
        } catch (error) {
            console.error('เกิดข้อผิดพลาดในการถ่ายภาพ:', error);
            alert('เกิดข้อผิดพลาดในการถ่ายภาพ กรุณาลองใหม่อีกครั้ง');
        }
    };

    // ฟังก์ชันวาดเส้นกรอบในส่วนเว้า
    const drawCameraFrame = (ctx, canvasWidth, canvasHeight, callback) => {
        const centerX = canvasWidth / 2;
        const centerY = canvasHeight / 2;

        if (flavor === 'secret') {
            // กรอบดอกไม้ 12 กลีบสำหรับ secret flavor (ตามโค้ด UI)
            const frameWidth = Math.min(canvasHeight * 0.88, canvasWidth * 1.12); // ค่ากลางระหว่างเก่าและใหม่
            const frameHeight = Math.min(canvasHeight * 1.12, canvasWidth * 1.52); // ค่ากลางระหว่างเก่าและใหม่

            ctx.save();
            ctx.strokeStyle = '#e91e63';
            ctx.lineWidth = 1; // ลดขนาดเส้น

            // วาดกลีบดอกไม้ 12 กลีบตามโค้ด UI
            for (let i = 0; i < 12; i++) {
                ctx.save();
                ctx.translate(centerX, centerY);
                ctx.rotate((i * 30) * Math.PI / 180);

                // วาดกลีบดอกไม้ตามโค้ด UI: x=38.5, y=-11, width=23, height=54, rx=11.5
                const scale = Math.min(frameWidth, frameHeight) / 100;
                ctx.scale(scale, scale);

                ctx.beginPath();
                ctx.roundRect(38.5 - 50, -11 - 50, 23, 54, 11.5);
                ctx.stroke();

                ctx.restore();
            }

            ctx.restore();
        } else {
            // กรอบสี่เหลี่ยมมีขอบมนสำหรับ flavors อื่นๆ (ตามโค้ด UI)
            // ใช้ขนาดเดียวกับส่วนเว้า
            const frameWidth = Math.min(canvasHeight * 0.65, canvasWidth * 0.75);
            const frameHeight = Math.min(canvasHeight * 1.1, canvasWidth * 1.3);
            const borderRadius = Math.min(frameWidth, frameHeight) * 0.08;

            ctx.save();
            ctx.strokeStyle = '#ff69b4';
            ctx.lineWidth = 4; // เพิ่มความหนา

            ctx.beginPath();
            ctx.roundRect(
                centerX - frameWidth / 2,
                centerY - frameHeight / 2,
                frameWidth,
                frameHeight,
                borderRadius
            );
            ctx.stroke();

            ctx.restore();
        }

        callback();
    };

    // ฟังก์ชันวาด asset ทั้งหมดตามรสชาติ
    const drawAllAssets = (ctx, canvasWidth, canvasHeight, callback) => {
        const assets = getAllAssets(flavor);

        if (assets.length === 0) {
            callback();
            return;
        }

        // สร้าง Promise array สำหรับรอให้ทุกภาพโหลดเสร็จ
        const imagePromises = assets.map(asset => {
            return new Promise((resolve) => {
                const img = new Image();
                img.onload = () => {
                    // ใช้ตำแหน่งที่แท้จริงจาก UI
                    const position = calculateAssetPosition(asset, canvasWidth, canvasHeight);

                    ctx.drawImage(img, position.x, position.y, position.width, position.height);
                    resolve();
                };
                img.src = asset.src;
            });
        });

        // รอให้ทุกภาพวาดเสร็จแล้วเรียก callback
        Promise.all(imagePromises).then(() => {
            callback();
        });
    };

    // ฟังก์ชันดึง asset ทั้งหมดตามรสชาติ
    const getAllAssets = (flavor) => {
        const assets = [];

        switch (flavor) {
            case 'tonkotsu':
                assets.push(
                    { src: tonkotsuHead, type: 'head', width: 180 },
                    { src: tonkotsuProp, type: 'prop', width: 120 },
                    { src: tonkotsuPack, type: 'pack', width: 150 },
                    { src: tonkotsuAsset01, type: 'asset01', width: 100 },
                    { src: tonkotsuAsset02, type: 'asset02', width: 80 },
                    { src: tonkotsuAsset03, type: 'asset03', width: 90 }
                );
                break;
            case 'kimchi-seafood':
                assets.push(
                    { src: kimchiHead, type: 'head', width: 180 },
                    { src: kimchiAsset01, type: 'asset01', width: 100 },
                    { src: kimchiAsset02, type: 'asset02', width: 80 },
                    { src: kimchiAsset03, type: 'asset03', width: 90 },
                    { src: kimchiPack, type: 'pack', width: 120 },
                    { src: kimchiProp, type: 'prop', width: 150 }
                );
                break;
            case 'cheesy-gochujang':
                assets.push(
                    { src: cheesyGochujangHead, type: 'head', width: 180 },
                    { src: cheesyGochujangAsset01, type: 'asset01', width: 100 },
                    { src: cheesyGochujangAsset02, type: 'asset02', width: 80 },
                    { src: cheesyGochujangAsset03, type: 'asset03', width: 90 },
                    { src: cheesyGochujangPack, type: 'pack', width: 120 },
                    { src: cheesyGochujangProp, type: 'prop', width: 150 }
                );
                break;
            case 'secret':
                assets.push(
                    { src: mamaLogo, type: 'mama-logo', width: 120 },
                    { src: asset01, type: 'asset01', width: 345 },
                    { src: asset02, type: 'asset02', width: 540 },
                    { src: asset03, type: 'asset03', width: 280 },
                    { src: asset04, type: 'asset04', width: 170 },
                    { src: pack, type: 'pack', width: 737 }
                );
                break;
            default:
                break;
        }

        return assets;
    };



    // ฟังก์ชันคำนวณตำแหน่ง asset ตามโค้ด UI ที่แท้จริงเป๊ะๆ
    const calculateAssetPosition = (asset, canvasWidth, canvasHeight) => {
        const centerX = canvasWidth / 2;
        const centerY = canvasHeight / 2;

        // คำนวณขนาดกล้องตามโค้ด UI (ตรงกับหน้า UI)
        let cameraWidth, cameraHeight;
        if (flavor === 'secret') {
            cameraWidth = Math.min(canvasHeight * 0.95, canvasWidth * 1.2);
            cameraHeight = Math.min(canvasHeight * 1.2, canvasWidth * 1.6);
        } else {
            cameraWidth = Math.min(canvasHeight * 0.65, canvasWidth * 0.75);
            cameraHeight = Math.min(canvasHeight * 1.1, canvasWidth * 1.3);
        }

        // คำนวณตำแหน่งตาม calc() ในหน้า UI
        let cameraTop, cameraBottom;
        if (flavor === 'secret') {
            cameraTop = centerY - (Math.min(canvasHeight * 1.2, canvasWidth * 1.6) / 2);
            cameraBottom = centerY + (Math.min(canvasHeight * 1.2, canvasWidth * 1.6) / 2);
        } else {
            cameraTop = centerY - (Math.min(canvasHeight * 1.1, canvasWidth * 1.3) / 2);
            cameraBottom = centerY + (Math.min(canvasHeight * 1.1, canvasWidth * 1.3) / 2);
        }

        if (flavor === 'secret') {
            // ตำแหน่ง asset สำหรับ secret flavor (ตรงกับหน้า UI เป๊ะๆ)
            switch (asset.type) {
                case 'mama-logo':
                    return {
                        x: centerX - 60, // กลางจอ
                        y: 50, // ด้านบน
                        width: 120,
                        height: 120
                    };
                case 'pack':
                    return {
                        x: centerX - (cameraWidth * 0.737) / 2,
                        y: cameraBottom,
                        width: cameraWidth * 0.737,
                        height: cameraWidth * 0.737
                    };
                case 'asset01':
                    return {
                        x: centerX - (cameraWidth * 0.345) / 2,
                        y: cameraTop,
                        width: cameraWidth * 0.345,
                        height: cameraWidth * 0.345
                    };
                case 'asset02':
                    return {
                        x: centerX + (cameraWidth / 2) - (cameraWidth * 0.54) + (cameraWidth * 0.36),
                        y: cameraTop + 40,
                        width: cameraWidth * 0.54,
                        height: cameraWidth * 0.54
                    };
                case 'asset03':
                    return {
                        x: -canvasWidth * 0.1,
                        y: cameraTop + 180,
                        width: cameraWidth * 0.28,
                        height: cameraWidth * 0.28
                    };
                case 'asset04':
                    return {
                        x: canvasWidth * 0.04,
                        y: cameraBottom - cameraWidth * 0.24,
                        width: cameraWidth * 0.17,
                        height: cameraWidth * 0.17
                    };
                default:
                    return { x: 0, y: 0, width: 100, height: 100 };
            }
        } else if (flavor === 'tonkotsu') {
            // ตำแหน่ง asset สำหรับ tonkotsu flavor (ตรงกับหน้า UI เป๊ะๆ)
            switch (asset.type) {
                case 'head':
                    return {
                        x: centerX - 90,
                        y: cameraTop,
                        width: 180,
                        height: 180
                    };
                case 'prop':
                    return {
                        x: 0,
                        y: cameraBottom - 120,
                        width: 120,
                        height: 120
                    };
                case 'pack':
                    return {
                        x: canvasWidth - 150,
                        y: cameraBottom - 150,
                        width: 150,
                        height: 150
                    };
                case 'asset01':
                    return {
                        x: 0,
                        y: cameraTop + 150,
                        width: 100,
                        height: 100
                    };
                case 'asset02':
                    return {
                        x: canvasWidth - 90,
                        y: cameraTop + 100,
                        width: 80,
                        height: 80
                    };
                case 'asset03':
                    return {
                        x: canvasWidth - 90,
                        y: centerY - 45,
                        width: 90,
                        height: 90
                    };
                default:
                    return { x: 0, y: 0, width: 100, height: 100 };
            }
        } else if (flavor === 'kimchi-seafood') {
            // ตำแหน่ง asset สำหรับ kimchi flavor (ตามโค้ด UI เป๊ะๆ)
            switch (asset.type) {
                case 'head':
                    return {
                        x: centerX - 90,
                        y: centerY - cameraHeight / 2,
                        width: 180,
                        height: 180
                    };
                case 'asset01':
                    return {
                        x: 0,
                        y: centerY - cameraHeight / 2 + 150,
                        width: 100,
                        height: 100
                    };
                case 'pack':
                    return {
                        x: 0,
                        y: centerY + cameraHeight / 2 - 120,
                        width: 120,
                        height: 120
                    };
                case 'prop':
                    return {
                        x: canvasWidth - 150,
                        y: centerY + cameraHeight / 2 - 150,
                        width: 150,
                        height: 150
                    };
                case 'asset02':
                    return {
                        x: canvasWidth - 90,
                        y: centerY - cameraHeight / 2 + 100,
                        width: 80,
                        height: 80
                    };
                case 'asset03':
                    return {
                        x: canvasWidth - 90,
                        y: centerY - 45,
                        width: 90,
                        height: 90
                    };
                default:
                    return { x: 0, y: 0, width: 100, height: 100 };
            }
        } else if (flavor === 'cheesy-gochujang') {
            // ตำแหน่ง asset สำหรับ cheesy-gochujang flavor (ตรงกับหน้า UI เป๊ะๆ)
            switch (asset.type) {
                case 'head':
                    return {
                        x: centerX - 90,
                        y: cameraTop,
                        width: 180,
                        height: 180
                    };
                case 'asset01':
                    return {
                        x: 0,
                        y: cameraTop + 150,
                        width: 100,
                        height: 100
                    };
                case 'pack':
                    return {
                        x: 0,
                        y: cameraBottom - 120,
                        width: 120,
                        height: 120
                    };
                case 'prop':
                    return {
                        x: canvasWidth - 150,
                        y: cameraBottom - 150,
                        width: 150,
                        height: 150
                    };
                case 'asset02':
                    return {
                        x: canvasWidth - 90,
                        y: cameraTop + 100,
                        width: 80,
                        height: 80
                    };
                case 'asset03':
                    return {
                        x: canvasWidth - 90,
                        y: centerY - 45,
                        width: 90,
                        height: 90
                    };
                default:
                    return { x: 0, y: 0, width: 100, height: 100 };
            }
        } else {
            return { x: 0, y: 0, width: 100, height: 100 };
        }
    };









    // ฟังก์ชันสำหรับกลับไปหน้าแรกเพื่อเลือกรสชาติใหม่
    const _handleRetry = () => {
        resetAfterCapture();
        // กลับไปหน้าแรกเพื่อเลือกรสชาติใหม่
        if (onRestart) {
            onRestart();
        }
    };

    // ฟังก์ชันสำหรับกลับไปหน้าเลือกรสชาติ
    const _handleBackToFlavorSelect = () => {
        resetAfterCapture();
        // กลับไปหน้าเลือกรสชาติ (step 1)
        if (onRestart) {
            onRestart();
        }
    };

    // ฟังก์ชันสำหรับบันทึก
    const _handleSave = () => {
        console.log('บันทึกภาพ/วิดีโอ');
        // Mock สำหรับการบันทึก
    };

    // ฟังก์ชันสำหรับแชร์
    const _handleShare = () => {
        console.log('แชร์ภาพ/วิดีโอ');
        // Mock สำหรับการแชร์
    };

    return (
        <div style={{
            width: '100vw',
            height: '100vh',
            position: 'relative',
            overflow: 'hidden',
            background:
                flavor === 'secret' && !cameraReady
                    ? '#fff'
                    : imageUrl
                        ? `url(${imageUrl}) center/cover no-repeat`
                        : `url(${mockupImage}) center/cover no-repeat`,
            filter: imageUrl && (imageLoading || !imageLoaded) ? 'blur(20px)' : undefined,
            transition: 'filter 0.6s ease-out',
        }}>
            {/* preload image to detect when loaded */}
            {imageUrl && (
                <img
                    src={imageUrl}
                    alt="preload"
                    style={{ display: 'none' }}
                    onLoad={() => setImageLoaded(true)}
                />
            )}

            {/* Loading indicator for generated image */}
            {imageUrl && imageLoading && (
                <div style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    zIndex: 5,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 16,
                }}>
                    <div style={{
                        width: 40,
                        height: 40,
                        border: '3px solid rgba(255, 255, 255, 0.3)',
                        borderTop: '3px solid #ff9100',
                        borderRadius: '50%',
                        animation: 'spin 1s linear infinite',
                    }} />
                    <div style={{
                        color: '#ffffff',
                        fontSize: 14,
                        fontWeight: 500,
                        textShadow: '0 1px 2px rgba(0,0,0,0.8)',
                    }}>
                        กำลังโหลดภาพ...
                    </div>
                </div>
            )}
            {/* พื้นหลังที่ generate */}
            {/* โลโก้มาม่ากลางขอบบน */}
            {flavor !== 'secret' && (
                <img
                    src={mamaLogo}
                    alt="Mama Logo"
                    style={{
                        position: 'absolute',
                        top: 24,
                        left: '50%',
                        transform: 'translateX(-50%)',
                        width: 90,
                        zIndex: 10,
                    }}
                />
            )}
            {/* โลโก้มาม่าขอบบน (ใหญ่และลอยทับกล้อง) เฉพาะ secret */}
            {flavor === 'secret' && (
                <img
                    src={mamaLogo}
                    alt="Mama Logo"
                    style={{
                        position: 'absolute',
                        left: '50%',
                        top: 'calc(50% - (min(120vh, 160vw) / 2) - 20px)',
                        transform: 'translate(-50%, 0)',
                        width: '44%',
                        zIndex: 30,
                        pointerEvents: 'none',
                    }}
                />
            )}
            {/* flavor overlay ล้นออกไปทับขอบกล้อง */}
            {/* ลบ flavor overlay ออกแล้ว และเพิ่ม head แทน */}

            {/* head สำหรับ kimchi flavor */}
            {flavor === 'kimchi-seafood' && (
                <img
                    src={kimchiHead}
                    alt="kimchi head"
                    style={{
                        position: 'absolute',
                        left: '50%',
                        top: 'calc(50% - (min(120vh, 160vw) / 2))',
                        transform: 'translateX(-50%)',
                        width: 180,
                        zIndex: 32,
                        pointerEvents: 'none',
                    }}
                />
            )}

            {/* head สำหรับ cheesy-gochujang flavor */}
            {flavor === 'cheesy-gochujang' && (
                <img
                    src={cheesyGochujangHead}
                    alt="cheesy-gochujang head"
                    style={{
                        position: 'absolute',
                        left: '50%',
                        top: 'calc(50% - (min(120vh, 160vw) / 2))',
                        transform: 'translateX(-50%)',
                        width: 180,
                        zIndex: 32,
                        pointerEvents: 'none',
                    }}
                />
            )}
            {/* กล้องตรงกลาง (9:16) */}
            {flavor === 'secret' ? (
                <>
                    {/* SVG mask ดอกไม้ 12 กลีบ */}
                    <svg width="0" height="0" style={{ position: 'absolute' }}>
                        <defs>
                            <mask id="flower8petal-mask" maskUnits="objectBoundingBox" x="0" y="0" width="1" height="1">
                                <path fill="white" d="M0.5,0.08
                                        Q0.62,0.18 0.72,0.08
                                        Q0.82,0.18 0.92,0.28
                                        Q0.82,0.38 0.92,0.5
                                        Q0.82,0.62 0.92,0.72
                                        Q0.82,0.82 0.72,0.92
                                        Q0.62,0.82 0.5,0.92
                                        Q0.38,0.82 0.28,0.92
                                        Q0.18,0.82 0.08,0.72
                                        Q0.18,0.62 0.08,0.5
                                        Q0.18,0.38 0.08,0.28
                                        Q0.18,0.18 0.28,0.08
                                        Q0.38,0.18 0.5,0.08
                                        Z" />
                            </mask>
                        </defs>
                    </svg>
                    {/* ดอกไม้เส้นขอบ (background flower outline, responsive) */}
                    <div
                        style={{
                            position: 'absolute',
                            top: '50%',
                            left: '50%',
                            width: 'min(95vh, 120vw)',
                            height: 'min(120vh, 160vw)',
                            aspectRatio: '3 / 4',
                            transform: 'translate(-50%, -50%)',
                            zIndex: 2,
                            overflow: 'hidden',
                        }}
                    >
                        {/* ดอกไม้เส้นขอบ (background flower outline, responsive) */}
                        <svg
                            width="100%"
                            height="100%"
                            viewBox="0 0 100 100"
                            style={{
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                pointerEvents: 'none',
                                zIndex: 1,
                            }}
                        >
                            {Array.from({ length: 12 }).map((_, i) => (
                                <rect
                                    key={i}
                                    x={38.5}
                                    y={-11}
                                    width={23}
                                    height={54}
                                    rx={11.5}
                                    fill="none"
                                    stroke="#e91e63"
                                    strokeWidth={1}
                                    transform={`rotate(${i * 30} 50 50)`}
                                />
                            ))}
                        </svg>
                        {/* ดอกไม้เส้นขอบใหญ่ (background flower outline) */}
                        {/* <svg
                                width="100%"
                                height="100%"
                                viewBox="0 0 100 100"
                                style={{
                                    position: 'absolute',
                                    top: '50%',
                                    left: '50%',
                                    transform: 'translate(-50%, -50%)',
                                    zIndex: 1,
                                    pointerEvents: 'none',
                                }}
                            >
                                {Array.from({ length: 12 }).map((_, i) => (
                                    <rect
                                        key={i}
                                        x={38.5}
                                        y={-11}
                                        width={23}
                                        height={54}
                                        rx={11.5}
                                        fill="none"
                                        stroke="#e91e63"
                                        strokeWidth={10}
                                        transform={`rotate(${i * 30} 50 50)`}
                                    />
                                ))}
                            </svg> */}
                        <div
                            style={{
                                position: 'absolute',
                                top: '50%',
                                left: '50%',
                                width: 'min(95vh, 120vw)',
                                height: 'min(120vh, 160vw)',
                                aspectRatio: '3 / 4',
                                transform: 'translate(-50%, -50%)',
                                zIndex: 2,
                                overflow: 'hidden',
                            }}
                        >
                            {/* โลโก้มาม่าขอบบนของกล้อง (ใหญ่ขึ้น) */}
                            <video
                                ref={videoRef}
                                autoPlay
                                playsInline
                                muted

                                style={{
                                    width: '100%',
                                    height: '100%',
                                    objectFit: 'cover',
                                    zIndex: 1,
                                    border: 'none',
                                    transform: isFrontCamera ? 'scaleX(-1)' : 'none',
                                    background: 'none',
                                    display: 'block',
                                    maskImage: `url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="40" fill="white"/><rect x="38.5" y="-11" width="23" height="54" rx="11.5" fill="white" transform="rotate(0 50 50)"/><rect x="38.5" y="-11" width="23" height="54" rx="11.5" fill="white" transform="rotate(30 50 50)"/><rect x="38.5" y="-11" width="23" height="54" rx="11.5" fill="white" transform="rotate(60 50 50)"/><rect x="38.5" y="-11" width="23" height="54" rx="11.5" fill="white" transform="rotate(90 50 50)"/><rect x="38.5" y="-11" width="23" height="54" rx="11.5" fill="white" transform="rotate(120 50 50)"/><rect x="38.5" y="-11" width="23" height="54" rx="11.5" fill="white" transform="rotate(150 50 50)"/><rect x="38.5" y="-11" width="23" height="54" rx="11.5" fill="white" transform="rotate(180 50 50)"/><rect x="38.5" y="-11" width="23" height="54" rx="11.5" fill="white" transform="rotate(210 50 50)"/><rect x="38.5" y="-11" width="23" height="54" rx="11.5" fill="white" transform="rotate(240 50 50)"/><rect x="38.5" y="-11" width="23" height="54" rx="11.5" fill="white" transform="rotate(270 50 50)"/><rect x="38.5" y="-11" width="23" height="54" rx="11.5" fill="white" transform="rotate(300 50 50)"/><rect x="38.5" y="-11" width="23" height="54" rx="11.5" fill="white" transform="rotate(330 50 50)"/></svg>')`,
                                    WebkitMaskImage: `url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="40" fill="white"/><rect x="38.5" y="-11" width="23" height="54" rx="11.5" fill="white" transform="rotate(0 50 50)"/><rect x="38.5" y="-11" width="23" height="54" rx="11.5" fill="white" transform="rotate(30 50 50)"/><rect x="38.5" y="-11" width="23" height="54" rx="11.5" fill="white" transform="rotate(60 50 50)"/><rect x="38.5" y="-11" width="23" height="54" rx="11.5" fill="white" transform="rotate(90 50 50)"/><rect x="38.5" y="-11" width="23" height="54" rx="11.5" fill="white" transform="rotate(120 50 50)"/><rect x="38.5" y="-11" width="23" height="54" rx="11.5" fill="white" transform="rotate(150 50 50)"/><rect x="38.5" y="-11" width="23" height="54" rx="11.5" fill="white" transform="rotate(180 50 50)"/><rect x="38.5" y="-11" width="23" height="54" rx="11.5" fill="white" transform="rotate(210 50 50)"/><rect x="38.5" y="-11" width="23" height="54" rx="11.5" fill="white" transform="rotate(240 50 50)"/><rect x="38.5" y="-11" width="23" height="54" rx="11.5" fill="white" transform="rotate(270 50 50)"/><rect x="38.5" y="-11" width="23" height="54" rx="11.5" fill="white" transform="rotate(300 50 50)"/><rect x="38.5" y="-11" width="23" height="54" rx="11.5" fill="white" transform="rotate(330 50 50)"/></svg>')`,
                                    maskRepeat: 'no-repeat',
                                    maskSize: '100% 100%',
                                    WebkitMaskRepeat: 'no-repeat',
                                    WebkitMaskSize: '100% 100%',
                                }}
                            />
                        </div>
                    </div>
                </>
            ) : (
                <div
                    style={{
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        width: 'min(65vh, 75vw)',
                        height: 'min(110vh, 130vw)',
                        aspectRatio: '16/9',
                        borderRadius: 'min(48px, 8vw)',
                        overflow: 'hidden',
                        background: '#000',
                        border: '2px solid #ff69b4',
                        boxShadow: '0 4px 24px rgba(0,0,0,0.15)',
                        zIndex: 2,
                    }}
                >
                    <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        muted
                        onLoadedMetadata={() => console.log('🎥 Video metadata loaded')}
                        onCanPlay={() => console.log('�� Video can play')}
                        onError={(e) => console.error('🎥 Video error:', e)}
                        style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover',
                            borderRadius: 'min(46px, 7.8vw)',
                            transform: isFrontCamera ? 'scaleX(-1)' : 'none',
                            zIndex: 1,
                        }}
                    />
                </div>
            )}
            {/* วาง asset ต่างๆ ทับกล้องเหมือนโลโก้ */}
            {flavor === 'secret' && (
                <>
                    {/* 1. pack.png ขอบล่างจอกล้อง คาบเส้นขอบล่าง ขยายใหญ่ */}
                    <img
                        src={pack}
                        alt="pack"
                        style={{
                            position: 'absolute',
                            left: '50%',
                            top: 'unset',
                            bottom: 'calc(50% - (min(120vh, 160vw) / 2))',
                            transform: 'translate(-50%, 0)',
                            width: '73.7%',
                            zIndex: 32,
                            pointerEvents: 'none',
                        }}
                    />
                    {/* 2. asset01.png มุมซ้ายบน ระดับเดียวกับโลโก้มาม่า */}
                    <img
                        src={asset01}
                        alt="asset01"
                        style={{
                            position: 'absolute',
                            left: 'calc(50% - (min(95vh, 120vw) / 2) + 0px)',
                            top: 'calc(50% - (min(120vh, 160vw) / 2) + 0px)',
                            width: '34.5%',
                            zIndex: 32,
                            pointerEvents: 'none',
                        }}
                    />
                    {/* 3. asset02.png มุมขวาบน ขยับลง */}
                    <img
                        src={asset02}
                        alt="asset02"
                        style={{
                            position: 'absolute',
                            right: 'calc(50% - (min(95vh, 120vw) / 2) + 0px)',
                            top: 'calc(50% - (min(120vh, 160vw) / 2) + 40px)',
                            width: '54%',
                            transform: 'translateX(36%)',
                            zIndex: 32,
                            pointerEvents: 'none',
                        }}
                    />
                    {/* 4. asset03.png มุมซ้ายบน ขยับลงระดับเดียวกับ asset02 */}
                    <img
                        src={asset03}
                        alt="asset03"
                        style={{
                            position: 'absolute',
                            left: '-10%',
                            top: 'calc(50% - (min(120vh, 160vw) / 2) + 180px)',
                            transform: 'none',
                            width: '28%',
                            zIndex: 32,
                            pointerEvents: 'none',
                        }}
                    />
                    {/* 5. asset04.png มุมซ้ายล่าง ขยับขึ้นและขวา */}
                    <img
                        src={asset04}
                        alt="asset04"
                        style={{
                            position: 'absolute',
                            left: '4%',
                            top: 'calc(50% + (min(120vh, 160vw) / 2) - 24%)',
                            transform: 'none',
                            width: '17%',
                            zIndex: 32,
                            pointerEvents: 'none',
                        }}
                    />
                </>
            )}
            {/* วาง asset สำหรับ tonkotsu flavor */}
            {flavor === 'tonkotsu' && (
                <>
                    {/* 1. head.png ขอบบนกึ่งกลางจอกล้อง */}
                    <img
                        src={tonkotsuHead}
                        alt="tonkotsu head"
                        style={{
                            position: 'absolute',
                            left: '50%',
                            top: 'calc(50% - (min(120vh, 160vw) / 2))',
                            transform: 'translateX(-50%)',
                            width: 180,
                            zIndex: 32,
                            pointerEvents: 'none',
                        }}
                    />
                    {/* 2. asset04.png มุมซ้ายล่าง */}
                    <img
                        src={tonkotsuProp}
                        alt="tonkotsu prop"
                        style={{
                            position: 'absolute',
                            left: '0',
                            bottom: 'calc(50% - (min(120vh, 160vw) / 2))',
                            width: 120,
                            zIndex: 32,
                            pointerEvents: 'none',
                        }}
                    />
                    {/* 3. pack.png ขวาล่าง */}
                    <img
                        src={tonkotsuPack}
                        alt="tonkotsu pack"
                        style={{
                            position: 'absolute',
                            right: '0',
                            bottom: 'calc(50% - (min(120vh, 160vw) / 2))',
                            width: 150,
                            zIndex: 32,
                            pointerEvents: 'none',
                        }}
                    />
                    {/* 4. asset01.png ขอบซ้าย */}
                    <img
                        src={tonkotsuAsset01}
                        alt="tonkotsu asset01"
                        style={{
                            position: 'absolute',
                            left: '0',
                            top: 'calc(50% - (min(120vh, 160vw) / 2) + 150px)',
                            width: 100,
                            zIndex: 32,
                            pointerEvents: 'none',
                        }}
                    />
                    {/* 5. asset02.png ขอบขวา */}
                    <img
                        src={tonkotsuAsset02}
                        alt="tonkotsu asset02"
                        style={{
                            position: 'absolute',
                            right: '10px',
                            top: 'calc(50% - (min(120vh, 160vw) / 2) + 100px)',
                            width: 80,
                            zIndex: 32,
                            pointerEvents: 'none',
                        }}
                    />
                    {/* 6. asset03.png ขอบขวากึ่งกลาง */}
                    <img
                        src={tonkotsuAsset03}
                        alt="tonkotsu asset03"
                        style={{
                            position: 'absolute',
                            right: '0',
                            top: '50%',
                            transform: 'translateY(-50%)',
                            width: 90,
                            zIndex: 32,
                            pointerEvents: 'none',
                        }}
                    />
                </>
            )}
            {/* วาง asset สำหรับ kimchi flavor */}
            {flavor === 'kimchi-seafood' && (
                <>
                    {/* asset01.png ขอบซ้าย */}
                    <img
                        src={kimchiAsset01}
                        alt="kimchi asset01"
                        style={{
                            position: 'absolute',
                            left: '0',
                            top: 'calc(50% - (min(120vh, 160vw) / 2) + 150px)',
                            width: 100,
                            zIndex: 32,
                            pointerEvents: 'none',
                        }}
                    />
                    {/* pack.png ไว้ที่ตำแหน่ง prop (มุมซ้ายล่าง) */}
                    <img
                        src={kimchiPack}
                        alt="kimchi pack"
                        style={{
                            position: 'absolute',
                            left: '0',
                            bottom: 'calc(50% - (min(120vh, 160vw) / 2))',
                            width: 120,
                            zIndex: 32,
                            pointerEvents: 'none',
                        }}
                    />
                    {/* prop.png ไว้ที่ตำแหน่ง pack (ขวาล่าง) */}
                    <img
                        src={kimchiProp}
                        alt="kimchi prop"
                        style={{
                            position: 'absolute',
                            right: '0',
                            bottom: 'calc(50% - (min(120vh, 160vw) / 2))',
                            width: 150,
                            zIndex: 32,
                            pointerEvents: 'none',
                        }}
                    />
                    {/* asset02.png ขอบขวา */}
                    <img
                        src={kimchiAsset02}
                        alt="kimchi asset02"
                        style={{
                            position: 'absolute',
                            right: '10px',
                            top: 'calc(50% - (min(120vh, 160vw) / 2) + 100px)',
                            width: 80,
                            zIndex: 32,
                            pointerEvents: 'none',
                        }}
                    />
                    {/* asset03.png ขอบขวากึ่งกลาง */}
                    <img
                        src={kimchiAsset03}
                        alt="kimchi asset03"
                        style={{
                            position: 'absolute',
                            right: '0',
                            top: '50%',
                            transform: 'translateY(-50%)',
                            width: 90,
                            zIndex: 32,
                            pointerEvents: 'none',
                        }}
                    />
                </>
            )}
            {/* วาง asset สำหรับ cheesy-gochujang flavor */}
            {flavor === 'cheesy-gochujang' && (
                <>
                    {/* asset01.png ขอบซ้าย */}
                    <img
                        src={cheesyGochujangAsset01}
                        alt="cheesy-gochujang asset01"
                        style={{
                            position: 'absolute',
                            left: '0',
                            top: 'calc(50% - (min(120vh, 160vw) / 2) + 150px)',
                            width: 100,
                            zIndex: 32,
                            pointerEvents: 'none',
                        }}
                    />
                    {/* pack.png ไว้ที่ตำแหน่ง prop (มุมซ้ายล่าง) */}
                    <img
                        src={cheesyGochujangPack}
                        alt="cheesy-gochujang pack"
                        style={{
                            position: 'absolute',
                            left: '0',
                            bottom: 'calc(50% - (min(120vh, 160vw) / 2))',
                            width: 120,
                            zIndex: 32,
                            pointerEvents: 'none',
                        }}
                    />
                    {/* prop.png ไว้ที่ตำแหน่ง pack (ขวาล่าง) */}
                    <img
                        src={cheesyGochujangProp}
                        alt="cheesy-gochujang prop"
                        style={{
                            position: 'absolute',
                            right: '0',
                            bottom: 'calc(50% - (min(120vh, 160vw) / 2))',
                            width: 150,
                            zIndex: 32,
                            pointerEvents: 'none',
                        }}
                    />
                    {/* asset02.png ขอบขวา */}
                    <img
                        src={cheesyGochujangAsset02}
                        alt="cheesy-gochujang asset02"
                        style={{
                            position: 'absolute',
                            right: '10px',
                            top: 'calc(50% - (min(120vh, 160vw) / 2) + 100px)',
                            width: 80,
                            zIndex: 32,
                            pointerEvents: 'none',
                        }}
                    />
                    {/* asset03.png ขอบขวากึ่งกลาง */}
                    <img
                        src={cheesyGochujangAsset03}
                        alt="cheesy-gochujang asset03"
                        style={{
                            position: 'absolute',
                            right: '0',
                            top: '50%',
                            transform: 'translateY(-50%)',
                            width: 90,
                            zIndex: 32,
                            pointerEvents: 'none',
                        }}
                    />
                </>
            )}
            {/* ปุ่มควบคุมกล้องที่ด้านล่าง */}
            <div
                style={{
                    position: 'absolute',
                    bottom: '60px',
                    left: '0',
                    right: '0',
                    display: 'flex',
                    alignItems: 'flex-end',
                    justifyContent: 'space-between',
                    padding: '0 24px',
                    zIndex: 50,
                }}
            >
                {/* ปุ่มสลับกล้อง (ซ้าย) */}
                <button
                    onClick={() => hasMultipleCameras && setIsFrontCamera(!isFrontCamera)}
                    onPointerDown={() => setModePressed(true)}
                    onPointerUp={() => setModePressed(false)}
                    onPointerLeave={() => setModePressed(false)}
                    disabled={!hasMultipleCameras}
                    style={{
                        width: '48px',
                        height: '48px',
                        borderRadius: '50%',
                        backgroundColor: 'transparent',
                        border: 'none',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: hasMultipleCameras ? 'pointer' : 'not-allowed',
                        transform: modePressed ? 'scale(0.95)' : 'scale(1)',
                        transition: 'transform 0.12s, background-color 0.3s',
                        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
                        opacity: hasMultipleCameras ? 1 : 0.5,
                        padding: 0,
                    }}
                >
                    <img
                        src={switchCameraIcon}
                        alt="Switch Camera"
                        style={{
                            width: '48px',
                            height: '48px',
                            objectFit: 'contain',
                        }}
                    />
                </button>

                {/* ปุ่มถ่ายภาพ/วิดีโอ (กลาง) */}
                {isVideoMode ? (
                    /* ปุ่มบันทึกวิดีโอ */
                    <div className={`record-button${isRecording ? ' recording' : ''}`} onClick={handleCapture}>
                        <div className="ring" key={String(isRecording)}>
                            <svg viewBox="0 0 64 64">
                                <circle className="progress-ring" r="28" cx="32" cy="32" fill="transparent" transform="rotate(-90 32 32)" stroke="#FFFFFF" />
                            </svg>
                        </div>
                        <div className="inner-shape"></div>
                    </div>
                ) : (
                    /* ปุ่มถ่ายภาพ */
                    <div className="photo-button" onClick={handleCapture}>
                        <div className="circle"></div>
                    </div>
                )}

                {/* ปุ่มเปลี่ยนโหมด (ขวา) - ปิดเมื่อกำลังอัดวิดีโอ */}
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    backgroundColor: 'rgba(255, 255, 255, 0.9)',
                    borderRadius: '6px',
                    padding: '2px',
                    gap: '0',
                    boxShadow: '0 2px 12px rgba(0, 0, 0, 0.1)',
                    minWidth: '72px',
                    minHeight: '36px',
                    opacity: isRecording ? 0.5 : 1,
                }}>
                    {/* ปุ่มโหมดถ่ายภาพ */}
                    <button
                        onClick={() => {
                            if (!isRecording) {
                                console.log("📸 Switching to PHOTO mode");
                                setIsVideoMode(false);
                            }
                        }}
                        onPointerDown={() => !isRecording && setModePressed(true)}
                        onPointerUp={() => setModePressed(false)}
                        onPointerLeave={() => setModePressed(false)}
                        disabled={isRecording}
                        style={{
                            width: '28px',
                            height: '28px',
                            borderRadius: '6px',
                            border: 'none',
                            backgroundColor: !isVideoMode ? '#cccccc' : 'transparent',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: isRecording ? 'not-allowed' : 'pointer',
                            transform: modePressed ? 'scale(1.08)' : 'scale(1)',
                            transition: 'transform 0.1s, background-color 0.15s',
                            outline: 'none',
                            padding: 0,
                        }}
                    >
                        <img
                            src={cameraIcon}
                            alt="Camera"
                            style={{
                                width: '16px',
                                height: '16px',
                                display: 'block',
                                filter: 'none',
                                opacity: isRecording ? 0.5 : 1,
                            }}
                        />
                    </button>

                    {/* เส้นกั้นกลาง */}
                    <div style={{
                        width: '2px',
                        height: '28px',
                        backgroundColor: '#e74c3c',
                        margin: '0 8px',
                        borderRadius: '2px',
                        alignSelf: 'center',
                    }} />

                    {/* ปุ่มโหมดวิดีโอ */}
                    <button
                        onClick={() => {
                            if (!isRecording) {
                                console.log("🎬 Switching to VIDEO mode");
                                setIsVideoMode(true);
                            }
                        }}
                        onPointerDown={() => !isRecording && setModePressed(true)}
                        onPointerUp={() => setModePressed(false)}
                        onPointerLeave={() => setModePressed(false)}
                        disabled={isRecording}
                        style={{
                            width: '28px',
                            height: '28px',
                            borderRadius: '6px',
                            border: 'none',
                            backgroundColor: isVideoMode ? '#cccccc' : 'transparent',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: isRecording ? 'not-allowed' : 'pointer',
                            transform: modePressed ? 'scale(1.08)' : 'scale(1)',
                            transition: 'transform 0.1s, background-color 0.15s',
                            outline: 'none',
                            padding: 0,
                        }}
                    >
                        <img
                            src={videoIcon}
                            alt="Video"
                            style={{
                                width: '16px',
                                height: '16px',
                                display: 'block',
                                filter: 'none',
                                opacity: isRecording ? 0.5 : 1,
                            }}
                        />
                    </button>
                </div>
            </div>
            <style>{`
                    @keyframes rotate {
                        from { transform: translate(-50%, -50%) rotate(0deg); }
                        to { transform: translate(-50%, -50%) rotate(360deg); }
                    }
                    
                    @keyframes spin {
                        0% { transform: rotate(0deg); }
                        100% { transform: rotate(360deg); }
                    }
                `}</style>

            {/* Loading Spinner สำหรับการประมวลผลวิดีโอ */}
            {isProcessing && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    width: '100vw',
                    height: '100vh',
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 10000,
                }}>
                    <div style={{
                        width: '60px',
                        height: '60px',
                        border: '4px solid rgba(255, 255, 255, 0.3)',
                        borderTop: '4px solid #ffffff',
                        borderRadius: '50%',
                        animation: 'spin 1s linear infinite',
                    }} />
                    <div style={{
                        color: '#ffffff',
                        fontSize: '18px',
                        marginTop: '20px',
                        textAlign: 'center',
                    }}>
                        กำลังประมวลผลวิดีโอ...
                    </div>
                </div>
            )}



            {/* แสดง PreviewModal เมื่อ showPreview เป็น true */}
            {showPreview && (
                <PreviewModal
                    onRetry={_handleBackToFlavorSelect}
                    capturedPhoto={capturedVideo || capturedPhoto}
                />
            )}
        </div>
    );
};

export default PreviewScreen; 