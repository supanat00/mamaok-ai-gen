// Device/Browser detection utilities
export function isIOS() {
  return /iP(hone|od|ad)/.test(navigator.userAgent);
}

export function isSafari() {
  return /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
}

export function isAndroid() {
  return /Android/.test(navigator.userAgent);
}

export function isChrome() {
  return (
    /Chrome/.test(navigator.userAgent) && /Google Inc/.test(navigator.vendor)
  );
}

/**
 * ตรวจจับ browser และ platform เพื่อตั้งค่า MIME type ที่เหมาะสม
 * @returns {Object} ข้อมูล browser และ platform
 */
export const detectBrowserAndPlatform = () => {
  const userAgent = navigator.userAgent;
  const platform = navigator.platform;

  // ตรวจจับ iOS
  const isIOS =
    /iPad|iPhone|iPod/.test(userAgent) ||
    (platform === "MacIntel" && navigator.maxTouchPoints > 1);

  // ตรวจจับ Safari
  const isSafari = /Safari/.test(userAgent) && !/Chrome/.test(userAgent);

  // ตรวจจับ Chrome
  const isChrome = /Chrome/.test(userAgent) && !/Edge/.test(userAgent);

  // ตรวจจับ Android
  const isAndroid = /Android/.test(userAgent);

  return {
    isIOS,
    isSafari,
    isChrome,
    isAndroid,
    userAgent,
    platform,
  };
};

/**
 * ได้รับ MIME type ที่เหมาะสมสำหรับการอัดวิดีโอตาม browser และ platform
 * @returns {string} MIME type ที่เหมาะสม
 */
export const getOptimalVideoMimeType = () => {
  const { isIOS, isSafari, isChrome, isAndroid } = detectBrowserAndPlatform();

  // สำหรับ iOS/Safari ใช้ video/mp4
  if (isIOS || isSafari) {
    return "video/mp4";
  }

  // สำหรับ Android/Chrome ใช้ WebM เพื่อคุณภาพที่ดีกว่า
  if (isAndroid || isChrome) {
    return "video/webm; codecs=vp9,opus";
  }

  // สำหรับ browser อื่นๆ ใช้ fallback
  return "video/mp4";
};

/**
 * ได้รับรายการ MIME types ที่เหมาะสมตามลำดับความสำคัญ
 * @returns {Array} รายการ MIME types
 */
export const getVideoMimeTypes = () => {
  const { isIOS, isSafari, isChrome, isAndroid } = detectBrowserAndPlatform();

  if (isIOS || isSafari) {
    return [
      "video/mp4",
      "video/webm;codecs=vp9,opus",
      "video/webm;codecs=vp8,opus",
      "video/webm",
      "video/ogg;codecs=theora,vorbis",
    ];
  }

  if (isAndroid || isChrome) {
    return [
      "video/webm; codecs=vp9,opus",
      "video/webm; codecs=vp8,opus",
      "video/webm",
      "video/mp4; codecs=avc1.42E01E,mp4a.40.2",
      "video/mp4",
      "video/ogg;codecs=theora,vorbis",
    ];
  }

  // Fallback สำหรับ browser อื่นๆ
  return [
    "video/mp4",
    "video/webm;codecs=vp9,opus",
    "video/webm;codecs=vp8,opus",
    "video/webm",
    "video/ogg;codecs=theora,vorbis",
  ];
};
