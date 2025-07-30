import React from 'react';

const LoadingScreen = ({ style = {}, ...rest }) => (
    <div
        style={{
            width: '100vw',
            height: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(255,255,255,0.85)',
            fontSize: 28,
            color: '#222',
            fontWeight: 600,
            ...style,
        }}
        {...rest}
    >
        กำลังสร้างภาพ...
    </div>
);

export default LoadingScreen; 