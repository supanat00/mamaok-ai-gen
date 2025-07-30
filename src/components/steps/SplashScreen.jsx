import React, { useEffect, useState } from 'react';
import preloaderBackground from '../../assets/background/preloader-background.png';
import mamaLogo from '../../assets/logos/mama.png';

const SplashScreen = ({ fading }) => {
    // bounce animation state
    const [show, setShow] = useState(false);
    useEffect(() => {
        setShow(true);
        if (fading) setShow(false);
    }, [fading]);

    return (
        <div
            style={{
                width: '100vw',
                height: '100vh',
                backgroundImage: `url(${preloaderBackground})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat',
                position: 'fixed',
                top: 0,
                left: 0,
                zIndex: 9999,
                opacity: fading ? 0 : 1,
                transition: 'opacity 0.7s',
                pointerEvents: fading ? 'none' : 'auto',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
            }}
        >
            <img
                src={mamaLogo}
                alt="mama logo"
                style={{
                    width: 'min(60vw, 320px)',
                    aspectRatio: '1/1',
                    objectFit: 'contain',
                    filter: 'drop-shadow(0 4px 24px rgba(0,0,0,0.18))',
                    opacity: fading ? 0 : 1,
                    transform: show
                        ? 'scale(1)'
                        : 'scale(0.7)',
                    animation: show
                        ? 'splash-bounce-in 0.7s cubic-bezier(.68,-0.55,.27,1.55)'
                        : fading
                            ? 'splash-bounce-out 0.7s cubic-bezier(.68,-0.55,.27,1.55)'
                            : 'none',
                    transition: 'opacity 0.7s, transform 0.7s',
                }}
            />
            <style>{`
                @keyframes splash-bounce-in {
                    0% { opacity: 0; transform: scale(0.7); }
                    60% { opacity: 1; transform: scale(1.15); }
                    80% { transform: scale(0.95); }
                    100% { opacity: 1; transform: scale(1); }
                }
                @keyframes splash-bounce-out {
                    0% { opacity: 1; transform: scale(1); }
                    40% { transform: scale(1.15); }
                    100% { opacity: 0; transform: scale(0.7); }
                }
            `}</style>
        </div>
    );
};

export default SplashScreen; 