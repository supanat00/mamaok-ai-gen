import React from 'react';
import mamaLogo from '../assets/logos/mama.png';

const Logo = ({ style = {}, fading = false, ...rest }) => (
    <img
        src={mamaLogo}
        alt="Mama Logo"
        style={{
            width: 80,
            opacity: fading ? 0 : 0.9,
            transition: 'opacity 0.7s',
            ...style,
        }}
        {...rest}
    />
);

export default Logo; 