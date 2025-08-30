import React from 'react'
import { assets } from '../assets/frontend_assets/assets'

const Hero = () => {
  return (
    <div className="flex flex-col rounded-2xl shadow-2xl sm:flex-row border border-gray-200">
  {/* Hero Left Side */}
  <div className="w-full sm:w-1/2 flex items-center justify-center py-10 sm:py-0 bg-white">
    <div className="text-[#414141] space-y-5 px-6 sm:px-12">
      {/* Top Line */}
      <div className="flex items-center gap-2">
        <p className="w-8 md:w-11 h-[2px] bg-[#414141]"></p>
        <p className="font-medium text-sm md:text-base tracking-wide">OUR BESTSELLERS</p>
      </div>

      {/* Heading */}
      <h1 className="text-3xl prata-regular lg:text-5xl font-semibold leading-relaxed">
        Latest Arrivals
      </h1>

      {/* Bottom Line */}
      <div className="flex items-center gap-2 ">
        <p className="font-semibold text-sm md:text-base tracking-wide">SHOP NOW</p>
        <p className="w-8 md:w-11 h-[1px] bg-[#414141]"></p>
      </div>
    </div>
  </div>

  {/* Hero Right Side */}
  <div className="w-full sm:w-1/2 bg-[#fcdcdc] flex items-center justify-center">
    <img src={assets.xyz} className="w-full h-full object-cover" alt="Hero" />
  </div>
</div>

)
}

export default Hero
