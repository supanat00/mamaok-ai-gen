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

export async function generateImageWithDalle3({ prompt }) {
  const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
  const response = await fetch("https://api.openai.com/v1/images/generations", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "dall-e-3",
      prompt,
      n: 1,
      size: "1024x1792", // เปลี่ยนเป็น 1024x1792 สำหรับ portrait mode
      response_format: "url",
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`${response.status}: ${errorText}`);
  }

  const data = await response.json();
  const imageUrl = data.data[0].url;
  // return imageUrl ตรง ๆ (ไม่ fetch blob/dataURL)
  return imageUrl;
}
*/

// ฟังก์ชันจำลองสำหรับเดโม - ง่ายๆ ไม่มีปัญหา encoding
export async function generateImageWithDalle3() {
  // จำลองการ delay 2 วินาที (สำหรับเทส)
  await new Promise((resolve) => setTimeout(resolve, 2000));

  // ส่งคืน mockup image ที่มีอยู่แล้ว (ไม่ต้อง generate ใหม่)
  return "/src/assets/mockup/mockup.png";
}
