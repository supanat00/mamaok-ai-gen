import React from 'react';

const PreviewImage = ({ imageUrl, style = {}, ...rest }) => (
    <img
        src={imageUrl}
        alt="AI Generated"
        style={{
            width: '100vw',
            height: '100vh',
            objectFit: 'cover',
            ...style,
        }}
        draggable={false}
        {...rest}
    />
);

export default PreviewImage; 