import React, { useState, useEffect } from 'react';

interface ChristmasThemeProps {
  enabled: boolean;
  onToggle: () => void;
}

const ChristmasTheme: React.FC<ChristmasThemeProps> = ({ enabled, onToggle }) => {
  const [snowflakes, setSnowflakes] = useState<React.ReactElement[]>([]);

  const generateSnowflakes = () => {
    const flakes: React.ReactElement[] = [];
    const snowflakeSymbols = ['❄', '❅', '❆', '✻', '✼', '✽', '✾', '✿'];
    
    for (let i = 0; i < 50; i++) {
      const left = Math.random() * 100;
      const delay = Math.random() * 5;
      const duration = 10 + Math.random() * 10;
      const size = 0.5 + Math.random() * 1;
      const symbol = snowflakeSymbols[Math.floor(Math.random() * snowflakeSymbols.length)];
      
      flakes.push(
        <div
          key={i}
          className="snowflake"
          style={{
            left: `${left}%`,
            animationDelay: `${delay}s`,
            animationDuration: `${duration}s`,
            fontSize: `${size}em`,
          }}
        >
          {symbol}
        </div>
      );
    }
    
    setSnowflakes(flakes);
  };

  useEffect(() => {
    // Apply or remove Christmas theme class
    const appContainer = document.querySelector('.app-container');
    const body = document.body;
    
    if (enabled) {
      appContainer?.classList.add('christmas-theme');
      body.classList.add('christmas-theme');
      generateSnowflakes();
    } else {
      appContainer?.classList.remove('christmas-theme');
      body.classList.remove('christmas-theme');
      setSnowflakes([]);
    }

    return () => {
      appContainer?.classList.remove('christmas-theme');
      body.classList.remove('christmas-theme');
    };
  }, [enabled]);

  const generateStars = () => {
    const stars: React.ReactElement[] = [];
    for (let i = 0; i < 20; i++) {
      const top = Math.random() * 100;
      const left = Math.random() * 100;
      const delay = Math.random() * 2;
      const size = 1 + Math.random() * 1;
      
      stars.push(
        <div
          key={i}
          className="christmas-star"
          style={{
            top: `${top}%`,
            left: `${left}%`,
            animationDelay: `${delay}s`,
            fontSize: `${size}rem`,
          }}
        >
          ⭐
        </div>
      );
    }
    return stars;
  };

  return (
    <>
      {enabled && (
        <>
          <div className="christmas-snow">{snowflakes}</div>
          <div className="christmas-stars">{generateStars()}</div>
        </>
      )}
    </>
  );
};

export default ChristmasTheme;

