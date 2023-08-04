import React, { useEffect, useState } from 'react';

const LoadingAnimation = () => {
  const [loadingText, setLoadingText] = useState('Loading');
  
  useEffect(() => {
    const intervalId = setInterval(() => {
      setLoadingText(prevText => {
        if (prevText === 'Loading...') {
          return 'Loading';
        } else {
          return prevText + '.';
        }
      });
    }, 200); // Adjust the interval duration as per your preference
    
    return () => {
      clearInterval(intervalId); // Clear the interval when the component unmounts
    };
  }, []);

  return <div>{loadingText}</div>;
};

export default LoadingAnimation;