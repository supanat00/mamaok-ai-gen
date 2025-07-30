import React from 'react';

const PromptBox = ({ value, onChange, disabled = false, style = {}, ...rest }) => (
    <input
        type="text"
        value={value}
        onChange={onChange}
        disabled={disabled}
        style={{
            width: '100%',
            fontSize: 18,
            border: 'none',
            outline: 'none',
            borderRadius: 10,
            padding: '10px 14px',
            background: 'rgba(255,255,255,0.85)',
            color: '#222',
            boxSizing: 'border-box',
            textAlign: 'center',
            ...style,
        }}
        {...rest}
    />
);

export default PromptBox; 