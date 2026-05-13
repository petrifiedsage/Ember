import React from 'react';

export const PageContainer: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className }) => {
  return (
    <div className={`p-6 max-w-7xl mx-auto w-full animate-fade-in-up ${className || ''}`}>
      {children}
    </div>
  );
};
