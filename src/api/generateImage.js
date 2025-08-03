// เปิดการใช้งาน API จริง
export async function generateImageWithDalle3({ prompt }) {
  const apiKey = import.meta.env.VITE_OPENAI_API_KEY;

  if (!apiKey) {
    throw new Error("401: API Key ไม่ถูกต้อง กรุณาตรวจสอบการตั้งค่า");
  }

  // สร้าง prompt สำหรับวอลเปเปอร์ลวดลายซ้ำๆ
  const basePrompt =
    "wallpaper pattern, repeating design, continuous texture, full coverage, no borders, no seams, no gaps, dense pattern, uniform distribution, colorful, vibrant, modern design";

  const fullPrompt =
    "I NEED to test how the tool works with extremely simple prompts. DO NOT add any detail, just use it AS-IS:" +
    prompt +
    ", wallpaper pattern, repeating design, continuous texture, full coverage, no borders, no seams, no gaps, dense pattern, uniform distribution, colorful, vibrant, modern design";

  // แสดง prompt ที่ส่งไป
  console.log("🎨 === PROMPT GENERATION ===");
  console.log(`📝 User Input: "${prompt}"`);
  console.log(`🎯 Base Prompt: "${basePrompt}"`);
  console.log(`✅ Final Prompt: "${fullPrompt}"`);
  console.log("🎨 =========================");

  const response = await fetch("https://api.openai.com/v1/images/generations", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "dall-e-3",
      prompt: fullPrompt,
      n: 1,
      size: "1024x1792", // เปลี่ยนเป็น 1024x1792 สำหรับ portrait mode
      response_format: "b64_json", // เปลี่ยนจาก "url" เป็น "b64_json"
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`${response.status}: ${errorText}`);
  }

  const data = await response.json();
  const base64Data = data.data[0].b64_json;

  // Convert base64 to data URL
  const dataUrl = `data:image/png;base64,${base64Data}`;
  console.log("🎨 === IMAGE GENERATION COMPLETE ===");
  console.log("✅ Wallpaper pattern generated successfully");
  console.log("✅ Converted to data URL");
  console.log("🎨 =================================");
  return dataUrl;
}

/*
// ปิดการใช้งาน mock เพื่อประหยัดค่าใช้จ่าย
export async function generateImageWithDalle3({ prompt }) {
  // จำลองการสร้างภาพด้วยการตั้งเวลา 2 วินาที
  console.log("🔄 Generating image with prompt:", prompt);
  await new Promise((resolve) => setTimeout(resolve, 2000));

  // ส่งคืน URL ของภาพตัวอย่าง (ใช้ภาพที่มีอยู่แล้ว)
  console.log("✅ Mock image generation completed");
  return "/mockup/mockup.png";
}
*/
