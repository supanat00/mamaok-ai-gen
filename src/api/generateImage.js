// ปิดการใช้งาน API จริงเพื่อประหยัดค่าใช้จ่าย
// ระบบจะใช้การจำลองด้วยการตั้งเวลาแทน

/*
export async function generateImageWithStability({ prompt }) {
  const apiKey = import.meta.env.VITE_STABILITY_API_KEY;
  const formData = new FormData();
  formData.append("prompt", prompt);
  formData.append("output_format", "webp");
  formData.append("aspect_ratio", "4:5"); // 4:5 เหมาะกับ vertical portrait

  const response = await fetch(
    "https://api.stability.ai/v2beta/stable-image/generate/core",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        Accept: "image/*",
      },
      body: formData,
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`${response.status}: ${errorText}`);
  }

  // แปลง blob เป็น data URL เพื่อแสดงใน <img>
  const blob = await response.blob();
  return await new Promise((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result);
    reader.readAsDataURL(blob);
  });
}
*/

export async function generateImageWithDalle3({ prompt }) {
  const apiKey = import.meta.env.VITE_OPENAI_API_KEY;

  // สร้าง prompt ที่รวมกับ prompt ที่กำหนดไว้
  const fullPrompt =
    prompt +
    ", seamless pattern, colorful, modern, vector, small elements, high density, scattered, tightly packed, distributed evenly, no symmetry, no characters, no cartoon, no text, high quality";

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
  console.log("✅ Generated image converted to data URL from base64");
  return dataUrl;
}
