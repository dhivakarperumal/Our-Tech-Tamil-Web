import React from "react";

const Loader = () => {
  return (
    <div className="flex flex-col items-center justify-center h-screen bg-[#fffaf0] text-[#172033]">
      <img
        src="/images/logo1.png"
        alt="Our Tech Tamil logo"
        className="h-32 w-32 object-contain animate-pulse"
      />

      <div className="mt-8 text-center animate-in fade-in slide-in-from-bottom-4 duration-1000">
        <h1 className="text-4xl font-black tracking-[0.3em] bg-clip-text text-transparent bg-gradient-to-r from-[#A85B20] via-[#D99A32] to-[#A85B20] animate-gradient-x">
          OUR TECH TAMIL
        </h1>
        <p className="text-[10px] text-[#A85B20] font-bold uppercase tracking-[0.4em] mt-3 opacity-70">
          Smart Gadgets & Electronics
        </p>
      </div>

      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex gap-1">
        {[0, 1, 2].map((i) => (
          <div key={i} className="w-1.5 h-1.5 bg-[#D99A32]/50 rounded-full animate-bounce" style={{ animationDelay: `${i * 0.2}s` }}></div>
        ))}
      </div>
    </div>
  );
};

export default Loader;