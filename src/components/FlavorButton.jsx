import React from 'react';

const FlavorButton = ({ img, alt, onClick, style = {}, show = true, pressed = false, ...rest }) => (
    <button
        onClick={onClick}
        style={{
            border: 'none',
            background: 'none',
            padding: 0,
            outline: 'none',
            cursor: 'pointer',
            width: 220,
            maxWidth: '90%',
            transition: 'transform 0.4s cubic-bezier(.68,-0.55,.27,1.55), opacity 0.4s cubic-bezier(.68,-0.55,.27,1.55)',
            transform: show ? (pressed ? 'scale(0.95)' : 'scale(1)') : 'scale(0.7)',
            opacity: show ? 1 : 0,
            boxShadow: 'none',
            WebkitTapHighlightColor: 'transparent',
            borderRadius: 16,
            zIndex: 1,
            ...style,
        }}
        tabIndex={0}
        {...rest}
    >
        <img src={img} alt={alt} style={{ width: '100%', display: 'block', borderRadius: 16 }} draggable={false} />
    </button>
);

export default FlavorButton; 