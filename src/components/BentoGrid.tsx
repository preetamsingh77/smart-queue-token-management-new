
import React from 'react';

export const BentoGrid: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className }) => {
  return (
    <div className={`grid grid-cols-1 md:grid-cols-4 lg:grid-cols-6 gap-4 p-4 ${className}`}>
      {children}
    </div>
  );
};

export const BentoItem: React.FC<{ 
  children: React.ReactNode; 
  className?: string;
  colSpan?: string;
  rowSpan?: string;
}> = ({ children, className, colSpan = "col-span-1", rowSpan = "row-span-1" }) => {
  return (
    <div className={`rounded-3xl p-6 transition-all duration-300 hover:shadow-xl ${colSpan} ${rowSpan} ${className}`}>
      {children}
    </div>
  );
};
