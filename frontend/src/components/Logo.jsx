import React from 'react';

const Logo = ({ size = 'md' }) => {
  const sizes = {
    sm: 'w-12 h-12',
    md: 'w-20 h-20',
    lg: 'w-32 h-32'
  };

  return (
    <div className={`flex flex-col items-center justify-center`}>
      <div className={`${sizes[size]} bg-[#001B3D] rounded-3xl flex flex-col items-center justify-center shadow-2xl border border-white/10 p-2`}>
        {/* Icon part: Circle with chart and arrow */}
        <div className="relative w-full h-1/2 flex items-center justify-center">
          <div className="w-10 h-10 rounded-full border-2 border-white flex items-center justify-center relative">
            <div className="flex items-end gap-0.5 h-4">
              <div className="w-1 bg-white h-2"></div>
              <div className="w-1 bg-white h-3"></div>
              <div className="w-1 bg-white h-4"></div>
            </div>
            <div className="absolute top-1 right-1 text-[#EAB308] font-bold text-xs">↗</div>
          </div>
        </div>
        
        {/* Text part: SYC and SmartYield Capital */}
        <div className="text-center mt-1">
          <h1 className="text-white font-black text-xl tracking-tighter leading-none">SYC</h1>
          <p className="text-white text-[6px] font-bold uppercase tracking-tighter mt-0.5">SmartYield Capital</p>
        </div>
      </div>
    </div>
  );
};

export default Logo;
