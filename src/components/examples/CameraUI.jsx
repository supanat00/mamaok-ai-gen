import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import './CameraUI.css';

import PreviewModal from '../PreviewModal/PreviewModal';
import { getVideoMimeTypes, detectBrowserAndPlatform, isAndroid, isChrome } from '../../utils/deviceUtils';
import { testVideoBlob } from '../../utils/browserTest';
import { createCorrectBlob, testVideoPlayability, convertVideoForDownload } from '../../utils/videoUtils';
import { Muxer, ArrayBufferTarget } from 'mp4-muxer';

// --- Assets & Icons ---
// import iconSwitchCamera from '/assets/icons/switch-camera.webp';

const CameraIcon = () => <svg width="24px" height="24px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 15a3 3 0 100-6 3 3 0 000 6z" stroke="#000000" strokeWidth="1.5" /><path d="M8.5 4.5h7c3.06 0 4.58 0 5.5.87a3.83 3.83 0 011.22 1.29c.88 1 .88 2.5.88 5.56s0 4.59-.88 5.69a3.83 3.83 0 01-1.22 1.3C2 17.56 2 16.03 2 13s0-4.59.88-5.69A3.83 3.83 0 014 6.01C4.92 5.14 6.44 5.14 9.5 5.14h0" stroke="#000000" strokeWidth="1.5" strokeLinecap="round" /><path d="M18 10h-1" stroke="#000000" strokeWidth="1.5" strokeLinecap="round" /></svg>;
const VideoIcon = () => <svg width="24px" height="24px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M16 10l2.58-1.55a2 2 0 013.42 1.55v4a2 2 0 01-3.42 1.55L16 14M6.2 18h6.6c1.12 0 1.68 0 2.1-.22a2 2 0 001.1-1.1c.22-.42.22-1 .22-2.1V9.2c0-1.12 0-1.68-.22-2.1a2 2 0 00-1.1-1.1c-.42-.22-1-.22-2.1-.22H6.2c-1.12 0-1.68 0-2.1.22a2 2 0 00-1.1 1.1c-.22.42-.22 1-.22 2.1v3.6c0 1.12 0 1.68.22 2.1a2 2 0 001.1 1.1c.42.22 1 .22 2.1.22z" stroke="#000000" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>;


const CameraUI = ({ arSystemRef, cameraFacingMode }) => {

    const [mode, setMode] = useState('photo');
    const [isRecording, setIsRecording] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [preview, setPreview] = useState(null);

    // ✨ --- Refs สำหรับ MediaRecorder และ Muxer --- ✨
    const animationFrameIdRef = useRef(null);
    const mediaRecorderRef = useRef(null);
    const recordedChunksRef = useRef([]);
    const audioTrackRef = useRef(null);
    const recordTimerRef = useRef(null);

    // Refs สำหรับ mp4-muxer (Android/Chrome)
    const muxerRef = useRef(null);
    const videoEncoderRef = useRef(null);
    const audioEncoderRef = useRef(null);
    const isRecordingRef = useRef(false);

    // --- ตรวจสอบว่า Browser รองรับการอัดวิดีโอหรือไม่ ---
    const isVideoRecordingSupported = useMemo(() => 'MediaRecorder' in window && typeof MediaRecorder.isTypeSupported === 'function', []);

    const handleTakePhoto = useCallback(() => {
        console.log("ACTION: Take Photo (Fit Height, Center Horizontally)");
        const arCanvas = arSystemRef.current?.arCanvas;
        const cameraCanvas = arSystemRef.current?.cameraCanvas;

        if (!arCanvas || !cameraCanvas) {
            alert("เกิดข้อผิดพลาด: ไม่สามารถถ่ายภาพได้");
            return;
        }

        const finalCanvas = document.createElement('canvas');
        const ctx = finalCanvas.getContext('2d');

        const outputWidth = 1080;
        const outputHeight = 1920;
        finalCanvas.width = outputWidth;
        finalCanvas.height = outputHeight;

        requestAnimationFrame(() => {
            // --- 1. วาด BG (ภาพจากกล้อง) ให้เต็มพื้นที่ 9:16 ก่อน (เหมือนเดิม) ---
            const cameraAspectRatio = cameraCanvas.width / cameraCanvas.height;
            let bgWidth = outputWidth;
            let bgHeight = bgWidth / cameraAspectRatio;
            if (bgHeight < outputHeight) {
                bgHeight = outputHeight;
                bgWidth = bgHeight * cameraAspectRatio;
            }
            const bgX = (outputWidth - bgWidth) / 2;
            const bgY = (outputHeight - bgHeight) / 2;
            ctx.save();
            ctx.translate(finalCanvas.width, 0);
            ctx.scale(-1, 1);
            ctx.drawImage(cameraCanvas, bgX, bgY, bgWidth, bgHeight);
            ctx.restore();

            // --- ✨ 2. [FIX] วาด AR Scene โดยยึด "ความสูง" เป็นหลัก ✨ ---
            const arAspectRatio = arCanvas.width / arCanvas.height;

            // คำนวณขนาดใหม่ของ arCanvas ที่จะวาดลงไป โดยยึด "ความสูง" เป็นหลัก
            const drawHeight = outputHeight; // กำหนดให้ความสูงเต็ม 1920px
            const drawWidth = drawHeight * arAspectRatio; // คำนวณความกว้างตามสัดส่วนเดิม

            // คำนวณตำแหน่งในแนวนอน เพื่อให้ภาพอยู่กึ่งกลาง
            const drawX = (outputWidth - drawWidth) / 2;

            // วาด arCanvas ลงไปตรงกลาง โดยมีขนาดที่ถูกต้อง ไม่ล้นในแนวตั้ง
            ctx.drawImage(arCanvas, drawX, 0, drawWidth, drawHeight);

            // --- 3. สร้าง Data URL ---
            const dataURL = finalCanvas.toDataURL('image/png', 0.9);
            setPreview({ type: 'image', src: dataURL });
        });
    }, [arSystemRef]);

    // ✨ --- ฟังก์ชัน startRecording ที่เขียนขึ้นใหม่ทั้งหมด --- ✨

    const startRecording = useCallback(async () => {
        console.log("ACTION: Start Recording");

        if (!isVideoRecordingSupported) {
            alert("ขออภัย อุปกรณ์ของคุณไม่รองรับการอัดวิดีโอ");
            return false;
        }

        try {
            const arCanvas = arSystemRef.current?.arCanvas;
            const cameraCanvas = arSystemRef.current?.cameraCanvas;
            if (!arCanvas || !cameraCanvas) {
                alert("เกิดข้อผิดพลาด: ไม่สามารถเริ่มอัดวิดีโอได้");
                return false;
            }

            // ตรวจสอบว่าเป็น Android/Chrome หรือไม่
            const androidChrome = isAndroid() && isChrome();

            if (androidChrome) {
                console.log("Using mp4-muxer for Android/Chrome");
                return await startRecordingWithMuxer(arCanvas, cameraCanvas);
            } else {
                console.log("Using MediaRecorder for other browsers");
                return await startRecordingWithMediaRecorder(arCanvas, cameraCanvas);
            }

        } catch (err) {
            console.error("Failed to start recording:", err);
            let errorMessage = "ไม่สามารถเริ่มอัดวิดีโอได้";
            if (err.name === 'NotAllowedError') {
                errorMessage = "กรุณาอนุญาตให้เข้าถึงไมโครโฟนเพื่ออัดวิดีโอ";
            } else if (err.name === 'NotSupportedError') {
                errorMessage = "เบราว์เซอร์ของคุณไม่รองรับการอัดวิดีโอ";
            } else if (err.name === 'NotFoundError') {
                errorMessage = "ไม่พบไมโครโฟนในอุปกรณ์";
            }
            alert(`${errorMessage}: ${err.message}`);
            return false;
        }
    }, [arSystemRef, cameraFacingMode, isVideoRecordingSupported]);

    // ฟังก์ชันสำหรับใช้ mp4-muxer (Android/Chrome)
    const startRecordingWithMuxer = useCallback(async (arCanvas, cameraCanvas) => {
        let videoWidth = 720;
        let videoHeight = 1280;

        // ตรวจสอบและบังคับให้เป็นเลขคู่
        if (videoWidth % 2 !== 0) videoWidth++;
        if (videoHeight % 2 !== 0) videoHeight++;

        muxerRef.current = new Muxer({
            target: new ArrayBufferTarget(),
            video: { codec: 'avc', width: videoWidth, height: videoHeight },
            audio: { codec: 'aac', sampleRate: 44100, numberOfChannels: 1 },
            fastStart: 'in-memory',
        });

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

        let recordingStartTime = null;
        const recordingCanvas = document.createElement('canvas');
        recordingCanvas.width = videoWidth;
        recordingCanvas.height = videoHeight;
        const ctx = recordingCanvas.getContext('2d');

        const processFrame = (currentTime) => {
            if (!isRecordingRef.current) return;
            if (recordingStartTime === null) recordingStartTime = currentTime;

            // วาดภาพ BG จากกล้อง
            const cameraAspectRatio = cameraCanvas.width / cameraCanvas.height;
            let bgWidth = videoWidth;
            let bgHeight = bgWidth / cameraAspectRatio;
            if (bgHeight < videoHeight) {
                bgHeight = videoHeight;
                bgWidth = bgHeight * cameraAspectRatio;
            }
            const bgX = (videoWidth - bgWidth) / 2;
            const bgY = (videoHeight - bgHeight) / 2;
            ctx.save();
            if (cameraFacingMode === 'user') {
                ctx.translate(videoWidth, 0);
                ctx.scale(-1, 1);
            }
            ctx.drawImage(cameraCanvas, bgX, bgY, bgWidth, bgHeight);
            ctx.restore();

            // วาด AR Scene
            const arAspectRatio = arCanvas.width / arCanvas.height;
            const drawHeight = videoHeight;
            const drawWidth = drawHeight * arAspectRatio;
            const drawX = (videoWidth - drawWidth) / 2;
            ctx.drawImage(arCanvas, drawX, 0, drawWidth, drawHeight);

            // ส่ง Frame ไป Encode
            if (videoEncoderRef.current?.state === 'configured') {
                const elapsedTimeMs = currentTime - recordingStartTime;
                const timestamp = Math.round(elapsedTimeMs * 1000);
                const videoFrame = new VideoFrame(recordingCanvas, { timestamp });
                videoEncoderRef.current.encode(videoFrame);
                videoFrame.close();
            }

            animationFrameIdRef.current = requestAnimationFrame(processFrame);
        };
        requestAnimationFrame(processFrame);
        return true;
    }, [cameraFacingMode]);

    // ฟังก์ชันสำหรับใช้ MediaRecorder (browser อื่นๆ)
    const startRecordingWithMediaRecorder = useCallback(async (arCanvas, cameraCanvas) => {
        const videoWidth = 720;
        const videoHeight = 1280;
        const recordingCanvas = document.createElement('canvas');
        recordingCanvas.width = videoWidth;
        recordingCanvas.height = videoHeight;
        const ctx = recordingCanvas.getContext('2d');

        const videoStream = recordingCanvas.captureStream(30);

        let audioStream = null;
        let audioTrack = null;
        try {
            audioStream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true
                }
            });
            audioTrack = audioStream.getAudioTracks()[0];
            audioTrackRef.current = audioTrack;
        } catch (audioError) {
            console.warn("Audio permission denied or not available, recording without audio:", audioError);
        }

        const streamTracks = [...videoStream.getVideoTracks()];
        if (audioTrack) {
            streamTracks.push(audioTrack);
        }
        const combinedStream = new MediaStream(streamTracks);

        const mimeTypes = getVideoMimeTypes();
        const { isIOS, isSafari, isChrome } = detectBrowserAndPlatform();

        console.log(`Browser detection: iOS=${isIOS}, Safari=${isSafari}, Chrome=${isChrome}`);
        console.log(`Available MIME types:`, mimeTypes);

        let selectedMimeType = null;
        for (const mimeType of mimeTypes) {
            if (MediaRecorder.isTypeSupported(mimeType)) {
                selectedMimeType = mimeType;
                console.log(`✅ Supported MIME type: ${mimeType}`);
                break;
            } else {
                console.log(`❌ Not supported: ${mimeType}`);
            }
        }

        if (!selectedMimeType) {
            console.warn("No supported MIME type found, using browser default");
            if (isIOS || isSafari) {
                selectedMimeType = 'video/mp4';
            } else if (isChrome) {
                selectedMimeType = 'video/mp4';
            } else {
                selectedMimeType = 'video/mp4';
            }
            console.log(`Using fallback MIME type: ${selectedMimeType}`);
        }

        const options = selectedMimeType ? { mimeType: selectedMimeType } : {};
        console.log(`MediaRecorder options:`, options);

        mediaRecorderRef.current = new MediaRecorder(combinedStream, options);
        recordedChunksRef.current = [];

        mediaRecorderRef.current.ondataavailable = (event) => {
            if (event.data && event.data.size > 0) {
                recordedChunksRef.current.push(event.data);
            }
        };

        mediaRecorderRef.current.onerror = (event) => {
            console.error("MediaRecorder error:", event.error);
            alert("เกิดข้อผิดพลาดในการอัดวิดีโอ กรุณาลองใหม่อีกครั้ง");
            if (audioTrackRef.current) {
                audioTrackRef.current.stop();
                audioTrackRef.current = null;
            }
            setIsRecording(false);
            setIsProcessing(false);
        };

        mediaRecorderRef.current.onstop = async () => {
            console.log("Processing video file...");
            setIsProcessing(true);

            try {
                const actualMimeType = mediaRecorderRef.current?.mimeType;
                console.log("Actual MediaRecorder MIME type:", actualMimeType);

                let finalMimeType = actualMimeType;
                if (!finalMimeType || finalMimeType === 'video/webm') {
                    const { isIOS, isSafari, isChrome } = detectBrowserAndPlatform();
                    if (isIOS || isSafari) {
                        finalMimeType = 'video/mp4';
                    } else if (isChrome) {
                        finalMimeType = 'video/mp4';
                    } else {
                        finalMimeType = 'video/mp4';
                    }
                    console.log("Using fallback MIME type:", finalMimeType);
                }

                const videoBlob = createCorrectBlob(recordedChunksRef.current, finalMimeType);

                if (videoBlob.size === 0) {
                    throw new Error("Recorded video is empty");
                }

                console.log(`Video blob size: ${(videoBlob.size / 1024 / 1024).toFixed(2)}MB`);
                console.log(`Video blob type: ${videoBlob.type}`);

                const blobTestResult = testVideoBlob(videoBlob, finalMimeType);
                if (!blobTestResult) {
                    console.warn("⚠️ Blob test failed, but continuing...");
                }

                const playabilityTest = await testVideoPlayability(videoBlob);
                if (!playabilityTest) {
                    console.warn("⚠️ Video playability test failed, but continuing...");
                }

                const videoUrl = URL.createObjectURL(videoBlob);
                setPreview({ type: 'video', src: videoUrl, mimeType: finalMimeType });

                console.log(`Video recorded successfully: ${(videoBlob.size / 1024 / 1024).toFixed(2)}MB`);
            } catch (processingError) {
                console.error("Error processing video:", processingError);
                alert("เกิดข้อผิดพลาดในการประมวลผลวิดีโอ กรุณาลองใหม่อีกครั้ง");
            } finally {
                recordedChunksRef.current = [];
                mediaRecorderRef.current = null;
                if (audioTrackRef.current) {
                    audioTrackRef.current.stop();
                    audioTrackRef.current = null;
                }
                setIsProcessing(false);
            }
        };

        mediaRecorderRef.current.start();
        console.log("Recording started with state:", mediaRecorderRef.current.state);

        const processFrame = () => {
            if (!mediaRecorderRef.current || mediaRecorderRef.current.state !== 'recording') {
                return;
            }

            try {
                const cameraAspectRatio = cameraCanvas.width / cameraCanvas.height;
                let bgWidth = videoWidth;
                let bgHeight = bgWidth / cameraAspectRatio;
                if (bgHeight < videoHeight) {
                    bgHeight = videoHeight;
                    bgWidth = bgHeight * cameraAspectRatio;
                }
                const bgX = (videoWidth - bgWidth) / 2;
                const bgY = (videoHeight - bgHeight) / 2;
                ctx.save();
                if (cameraFacingMode === 'user') {
                    ctx.translate(videoWidth, 0);
                    ctx.scale(-1, 1);
                }
                ctx.drawImage(cameraCanvas, bgX, bgY, bgWidth, bgHeight);
                ctx.restore();

                const arAspectRatio = arCanvas.width / arCanvas.height;
                const drawHeight = videoHeight;
                const drawWidth = drawHeight * arAspectRatio;
                const drawX = (videoWidth - drawWidth) / 2;
                ctx.drawImage(arCanvas, drawX, 0, drawWidth, drawHeight);
            } catch (frameError) {
                console.error("Error processing frame:", frameError);
            }

            animationFrameIdRef.current = requestAnimationFrame(processFrame);
        };
        requestAnimationFrame(processFrame);
        return true;
    }, [cameraFacingMode]);

    // ✨ --- ฟังก์ชัน stopRecording ที่รองรับทั้ง MediaRecorder และ Muxer --- ✨
    const stopRecording = useCallback(async () => {
        console.log("ACTION: Stop Recording");

        // ตรวจสอบว่าเป็น Android/Chrome หรือไม่
        const androidChrome = isAndroid() && isChrome();

        if (androidChrome) {
            // หยุดการอัดด้วย Muxer
            if (isRecordingRef.current) {
                isRecordingRef.current = false;
                clearTimeout(recordTimerRef.current);
                cancelAnimationFrame(animationFrameIdRef.current);

                setIsProcessing(true);

                requestAnimationFrame(async () => {
                    console.log("Processing video file with muxer...");

                    if (videoEncoderRef.current?.state === 'configured') {
                        await videoEncoderRef.current.flush().catch(console.error);
                    }
                    if (audioEncoderRef.current?.state === 'configured') {
                        await audioEncoderRef.current.flush().catch(console.error);
                    }

                    if (muxerRef.current) {
                        muxerRef.current.finalize();
                        const { buffer } = muxerRef.current.target;
                        const videoBlob = new Blob([buffer], { type: 'video/mp4' });
                        const videoUrl = URL.createObjectURL(videoBlob);
                        setPreview({ type: 'video', src: videoUrl, mimeType: 'video/mp4' });
                    }

                    // Cleanup refs
                    videoEncoderRef.current = null;
                    audioEncoderRef.current = null;
                    muxerRef.current = null;

                    setIsProcessing(false);
                });
            }
        } else {
            // หยุดการอัดด้วย MediaRecorder
            if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
                mediaRecorderRef.current.stop();
            }
        }

        // หยุด Timer และ Animation Frame
        clearTimeout(recordTimerRef.current);
        cancelAnimationFrame(animationFrameIdRef.current);
    }, []);

    // ✨ --- ฟังก์ชัน Toggle ที่ปรับปรุงเล็กน้อย --- ✨
    const handleToggleRecording = useCallback(() => {
        if (isRecording) {
            stopRecording();
            setIsRecording(false);
        } else {
            const androidChrome = isAndroid() && isChrome();

            if (androidChrome) {
                // สำหรับ Android/Chrome ใช้ Muxer
                startRecording().then(success => {
                    if (success) {
                        setIsRecording(true);
                        isRecordingRef.current = true;
                        recordTimerRef.current = setTimeout(() => {
                            stopRecording();
                            setIsRecording(false);
                        }, 30000);
                    }
                });
            } else {
                // สำหรับ browser อื่นๆ ใช้ MediaRecorder
                startRecording().then(success => {
                    if (success) {
                        setIsRecording(true);
                        recordTimerRef.current = setTimeout(() => {
                            stopRecording();
                            setIsRecording(false);
                        }, 30000);
                    }
                });
            }
        }
    }, [isRecording, startRecording, stopRecording]);

    // --- Utility Functions ---

    // --- Preview Action Handlers ---
    const handleRetry = useCallback(() => setPreview(null), []);

    const handleDownload = useCallback(async () => {
        if (!preview?.src) return;

        try {
            // สำหรับวิดีโอ ให้ดาวน์โหลดเป็น MP4 สำหรับ Android/Chrome
            let downloadUrl = preview.src;
            let filename = 'mama-noodleverse.png';

            if (preview.type === 'video') {
                const { isAndroid, isChrome } = detectBrowserAndPlatform();

                if (isAndroid || isChrome) {
                    console.log("Downloading MP4 for Android/Chrome...");
                    const response = await fetch(preview.src);
                    const blob = await response.blob();

                    // สร้างไฟล์ MP4 ใหม่ (ไม่ต้องแปลง)
                    downloadUrl = URL.createObjectURL(blob);
                    filename = 'mama-noodleverse.mp4';

                    console.log(`Downloading MP4: ${filename} with MIME type: ${blob.type}`);
                } else {
                    // สำหรับ browser อื่นๆ ใช้การแปลงตามเดิม
                    const response = await fetch(preview.src);
                    const originalBlob = await response.blob();
                    const convertedBlob = await convertVideoForDownload(originalBlob, preview.mimeType);

                    downloadUrl = URL.createObjectURL(convertedBlob);

                    // กำหนดนามสกุลไฟล์ตาม MIME type
                    let extension = 'mp4';
                    if (convertedBlob.type.includes('webm')) {
                        extension = 'webm';
                    } else if (convertedBlob.type.includes('ogg')) {
                        extension = 'ogv';
                    }
                    filename = `mama-noodleverse.${extension}`;

                    console.log(`Downloading converted video: ${filename} with MIME type: ${convertedBlob.type}`);
                }
            }

            const a = document.createElement('a');
            a.href = downloadUrl;
            a.download = filename;

            a.target = '_blank';
            a.rel = 'noopener noreferrer';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);

            // Cleanup URL ที่สร้างใหม่
            if (preview.type === 'video' && downloadUrl !== preview.src) {
                setTimeout(() => URL.revokeObjectURL(downloadUrl), 1000);
            }

            // แสดงข้อความยืนยันการดาวน์โหลด
            console.log(`✅ File downloaded successfully: ${filename}`);

            // ไม่ต้องปิดหน้าพรีวิว - ให้ผู้ใช้สามารถดาวน์โหลดหลายครั้งได้
            // หรือกดปุ่ม "เล่นอีกครั้ง" เมื่อต้องการกลับไปหน้าหลัก
        } catch (error) {
            console.error("Download error:", error);
            alert("เกิดข้อผิดพลาดในการดาวน์โหลด กรุณาลองใหม่อีกครั้ง");
        }
    }, [preview]);

    // --- แชร์: ปรับปรุงการจัดการ MIME type ---
    const handleShare = useCallback(async () => {
        if (!preview?.src) return;
        try {
            const response = await fetch(preview.src);
            const blob = await response.blob();

            // กำหนด MIME type และนามสกุลไฟล์ที่ถูกต้อง
            let fileType = 'image/png';
            let extension = 'png';

            if (preview.type === 'video') {
                // ตรวจสอบ browser เพื่อกำหนด MIME type ที่เหมาะสม
                const { isAndroid, isChrome } = detectBrowserAndPlatform();

                if (isAndroid || isChrome) {
                    // สำหรับ Android/Chrome ใช้ MP4
                    fileType = 'video/mp4';
                    extension = 'mp4';
                } else if (preview.mimeType?.includes('mp4')) {
                    fileType = 'video/mp4';
                    extension = 'mp4';
                } else if (preview.mimeType?.includes('webm')) {
                    fileType = 'video/webm';
                    extension = 'webm';
                } else if (preview.mimeType?.includes('ogg')) {
                    fileType = 'video/ogg';
                    extension = 'ogv';
                } else {
                    // fallback ใช้ mp4
                    fileType = 'video/mp4';
                    extension = 'mp4';
                }
            }

            const filename = `mama-noodleverse.${extension}`;
            const file = new File([blob], filename, { type: fileType });

            console.log(`Sharing file: ${filename} with MIME type: ${fileType}`);

            if (navigator.canShare && navigator.canShare({ files: [file] })) {
                await navigator.share({
                    files: [file],
                    title: 'MAMA Noodle Verse',
                    text: 'มาเล่น AR สนุกๆ กับ MAMA กัน!',
                });

                // แสดงข้อความยืนยันการแชร์
                console.log(`✅ File shared successfully: ${filename}`);

                // ไม่ต้องปิดหน้าพรีวิว - ให้ผู้ใช้สามารถแชร์หลายครั้งได้
                // หรือกดปุ่ม "เล่นอีกครั้ง" เมื่อต้องการกลับไปหน้าหลัก
            } else {
                alert("ฟังก์ชันแชร์ไม่สามารถใช้งานได้บนเบราว์เซอร์นี้");
            }
        } catch (error) {
            if (error.name !== 'AbortError') {
                console.error("Share error:", error);
                alert(`การแชร์ล้มเหลว: ${error.message}`);
            }
        }
    }, [preview]);

    // --- Cleanup Effect ---
    useEffect(() => {
        const currentPreviewSrc = preview?.src;
        const isVideo = preview?.type === 'video';
        return () => {
            if (isVideo && currentPreviewSrc && currentPreviewSrc.startsWith('blob:')) {
                URL.revokeObjectURL(currentPreviewSrc);
            }
        };
    }, [preview]);

    useEffect(() => {
        return () => {
            cancelAnimationFrame(animationFrameIdRef.current);
            // Cleanup MediaRecorder
            if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
                mediaRecorderRef.current.stop();
            }
            if (audioTrackRef.current) {
                audioTrackRef.current.stop();
            }
            // Cleanup Muxer
            if (isRecordingRef.current) {
                videoEncoderRef.current?.close();
                audioEncoderRef.current?.close();
            }
        };
    }, []);


    return (
        <div className="ui-overlay">
            {/* แสดง overlay ขณะประมวลผล */}
            {isProcessing && (
                <div className="processing-overlay">
                    <div className="spinner"></div>
                    <p>กำลังประมวลผล...</p>
                </div>
            )}

            <div className={`camera-controls ${(preview || isRecording || isProcessing) ? 'hidden' : ''}`}>
                <div className="camera-bar-col left">
                    {/* <button className="action-button side-button-left" onClick={handleSwitchCamera} aria-label="Switch Camera" disabled={isRecording || isProcessing}>
                        <img src={iconSwitchCamera} alt="Switch Camera" className={`action-icon ${cameraFacingMode !== 'user' ? 'flipping' : ''}`} />
                    </button> */}
                </div>
                <div className="camera-bar-col center">
                    {mode === 'photo' ? (
                        <div className="photo-button" onClick={handleTakePhoto} aria-label="Take Photo">
                            <div className="circle"></div>
                        </div>
                    ) : (
                        <div className={`record-button ${isRecording ? 'recording' : ''}`} onClick={handleToggleRecording} aria-label="Toggle Recording">
                            <div className="ring" key={String(isRecording)}>
                                <svg viewBox="0 0 64 64">
                                    <circle className="progress-ring" r="28" cx="32" cy="32" fill="transparent" transform="rotate(-90 32 32)" stroke="#FFFFFF" />
                                </svg>
                            </div>
                            <div className="inner-shape"></div>
                        </div>
                    )}
                </div>
                <div className="camera-bar-col right">
                    <div className="mode-toggle-group">
                        <button
                            className={`mode-toggle-btn${mode === 'photo' ? ' active' : ''}`}
                            onClick={() => setMode('photo')}
                            disabled={isRecording || isProcessing}
                            aria-label="โหมดถ่ายภาพ"
                            type="button"
                        >
                            <CameraIcon />
                        </button>
                        <div className="mode-toggle-divider" />
                        <button
                            className={`mode-toggle-btn${mode === 'video' ? ' active' : ''}`}
                            onClick={() => setMode('video')}
                            disabled={isRecording || isProcessing}
                            aria-label="โหมดวิดีโอ"
                            type="button"
                        >
                            <VideoIcon />
                        </button>
                    </div>
                </div>
            </div>
            {preview && (
                <PreviewModal
                    preview={preview}
                    onRetry={handleRetry}
                    onSave={handleDownload}
                    onShare={handleShare}
                />
            )}
        </div>
    );
};

export default React.memo(CameraUI);