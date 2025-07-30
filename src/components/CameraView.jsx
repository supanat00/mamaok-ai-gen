import React from 'react';

const CameraView = ({ videoRef, style = {}, animState = {}, ...rest }) => (
    <div
        style={{
            position: 'relative',
            width: '100%',
            height: '100%',
            ...style,
        }}
        {...rest}
    >
        <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                borderRadius: 24,
                position: 'absolute',
                top: 0,
                left: 0,
                zIndex: 0,
                transform: animState.isFrontCamera ? 'scaleX(-1)' : 'none',
            }}
        />
    </div>
);

export default CameraView; 