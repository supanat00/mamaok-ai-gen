# Mama OK AR Filter

AI-powered AR filter application for creating personalized backgrounds with MAMA instant noodles theme.

## Features

- **AI Image Generation**: Create custom backgrounds using DALL-E 3
- **AR Camera Integration**: Real-time camera with AR overlays
- **Multiple Flavors**: Support for different MAMA noodle flavors
- **Photo/Video Capture**: Capture photos and videos with AR effects
- **Progressive Loading**: Smooth loading animations and blur effects

## Setup

1. **Install dependencies**:

   ```bash
   npm install
   ```

2. **Environment Variables**:
   Create a `.env` file in the root directory:

   ```
   VITE_OPENAI_API_KEY=your_openai_api_key_here
   ```

3. **Run the development server**:
   ```bash
   npm run dev
   ```

## API Keys Required

- **OpenAI API Key**: Required for DALL-E 3 image generation
  - Get your API key from [OpenAI Platform](https://platform.openai.com/api-keys)
  - Add it to your `.env` file as `VITE_OPENAI_API_KEY`

## Image Generation

The app uses DALL-E 3 to generate custom backgrounds with the following base prompt:

```
[ ... ], seamless pattern, colorful, modern, vector, small elements, high density, scattered, repeat often, tightly packed, distributed evenly, random arrangement, avoid central composition, avoid main subject in the center, no central focus, no main object in the center, no symmetry, no focal point, no characters, no cartoon, no text, high quality
```

Users can add their own prompts which will be combined with this base prompt for optimal results.

## Technologies Used

- React 18
- Vite
- OpenAI DALL-E 3 API
- WebRTC for camera access
- Canvas API for image processing
- MP4 Muxer for video recording

## Development

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.
