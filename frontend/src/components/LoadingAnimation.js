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
    }, 200); // Adjust the interval duration as per your preference
    
    return () => {
      clearInterval(intervalId); // Clear the interval when the component unmounts
    };
  }, []);

  return <div {...props}>{loadingText}</div>;
};

export default LoadingAnimation;