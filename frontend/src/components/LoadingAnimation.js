import React, { useEffect, useState } from 'react';

const LoadingAnimation = ({customLoadingText = "", ...props}) => {
  const [loadingText, setLoadingText] = useState(`Loading${!customLoadingText ? "" : (" " + customLoadingText)}`);
  
  useEffect(() => {
    const intervalId = setInterval(() => {
      setLoadingText(prevText => {
        if (prevText.endsWith("...")) {
          return prevText.substring(0,prevText.length - 3);
        } else {
          return prevText + '.';
        }
      });
    }, 200);
    
    return () => {
      clearInterval(intervalId); 
    };
  }, []);

  return <div {...props}>{loadingText}</div>;
};

export default LoadingAnimation;