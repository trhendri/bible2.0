import React from 'react';

interface VerseTextProps {
  children: React.ReactNode;
}

const VerseText: React.FC<VerseTextProps> = ({ children }) => {
  return (
    <p className="mb-3 flex items-center">
      {children}
    </p>
  );
};

export default VerseText;