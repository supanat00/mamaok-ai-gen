import React from 'react';
import preloaderBackground from '../assets/background/preloader-background.png';
import flavorsBackground from '../assets/background/flavors-background.png';
import previewBackground from '../assets/background/preview-background.png';

const bgMap = {
    preload: preloaderBackground,
    flavor: flavorsBackground,
    preview: previewBackground,
};

const Background = ({ type = 'preload', fading = false, style = {}, ...rest }) => (
    <div
        style={{
            width: '100vw',
            height: '100vh',
            backgroundImage: `url(${bgMap[type]})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
            position: 'fixed',
            top: 0,
            left: 0,
            zIndex: 0,
            opacity: fading ? 0 : 1,
            transition: 'opacity 0.7s',
            pointerEvents: 'none',
            ...style,
        }}
        {...rest}
    />
);

export default Background; 