import React, { useRef, useCallback, useLayoutEffect } from 'react';

const AutoResizingTextarea = ({ value, onChange, className }) => {
  const textareaRef = useRef(null);

  const adjustHeight = useCallback(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = el.scrollHeight + 'px';
  }, []);

  useLayoutEffect(() => {
    // 1. Adjust immediately
    adjustHeight();
    
    // 2. Adjust after layout settles (safety net)
    const timer = setTimeout(adjustHeight, 10);
    
    // 3. Adjust on window resize
    window.addEventListener('resize', adjustHeight);
    
    return () => {
      window.removeEventListener('resize', adjustHeight);
      clearTimeout(timer);
    };
  }, [value, adjustHeight]);

  return (
    <textarea
      ref={textareaRef}
      value={value}
      onChange={onChange}
      className={className}
      spellCheck={false}
      rows={1}
    />
  );
};

export default AutoResizingTextarea;