import React, { useState } from "react";
import { assets } from "../assets/frontend_assets/assets";
import { Link, NavLink } from "react-router-dom";
const Navbar = () => {
    const [visible, setvisible] = useState(false);
    return (
        <div className="flex items-center justify-between px-5 font-medium">
            <img src={assets.logo} alt="logo" className="w-36 py-5" />
            <ul className="hidden sm:flex gap-5 text-sm text-gray-700">
                <NavLink to="/" className="flex flex-col items-center gap-1">
                    <p>Home</p>
                    <hr className="w-2/4 border-none h-[1.5px] bg-gray-700 hidden" />
                </NavLink>
                <NavLink to="/collection" className="flex flex-col items-center gap-1">
                    <p>Collection</p>
                    <hr className="w-2/4 border-none h-[1.5px] bg-gray-700 hidden" />
                </NavLink>
                <NavLink to="/about" className="flex flex-col items-center gap-1">
                    <p>About</p>
                    <hr className="w-2/4 border-none h-[1.5px] bg-gray-700 hidden" />
                </NavLink>
                <NavLink to="/contact" className="flex flex-col items-center gap-1">
                    <p>Contact</p>
                    <hr className="w-2/4 border-none h-[1.5px] bg-gray-700 hidden" />
                </NavLink>
            </ul>
            <div className="flex item-center gap-6">
                <img
                    src={assets.search_icon}
                    alt="seach icon"
                    className="w-5 cursor-pointer"
                />
                <div className="group relative">
                    <img
                        className="w-5 cursor-pointer"
                        src={assets.profile_icon}
                        alt=""
                    />
                    <div className="hidden group-hover:block absolute right-0 pt-4 rounded-4xl">
                        <div className="flex flex-col gap-2 w-36 px-5 py-3 bg-slate-100 text-gray-600 rounded shadow-md">
                            <p className="cursor-pointer hover:text-black">My Profile</p>
                            <p className="cursor-pointer hover:text-black">Orders</p>
                            <p className="cursor-pointer hover:text-black">Logout</p>
                        </div>
                    </div>
                </div>
                <Link to='/cart' className="relative" >
                    <img src={assets.cart_icon} alt="cart icon" className="w-5 cursor-pointer" />
                    <p className="absolute right-[-5px] bottom-[-5px] w-4 text-center leading-4 bg-black text-white aspect-square rounded-full text-[10px]">10</p>
                </Link>
                <img onClick={() => setvisible(true)} src={assets.menu_icon} className="w-5 cursor-pointer sm:hidden" alt="" />
            </div>
            {/* Side bar menu for Small Screen */}
            <div className={`absolute top-0 transition-all bg-white right-0  bottom-0 overflow-hidden ${visible ? 'w-full' : 'w-0'}`}>
                <div className="flex flex-col text-gray-700 h-full bg-white shadow-xl rounded-l-2xl overflow-hidden">
                    {/* Back button */}
                    <div
                        onClick={() => setvisible(false)}
                        className="flex items-center cursor-pointer px-4 gap-2 py-4 border-b border-gray-200 hover:bg-gray-50 transition"
                    >
                        <img
                            src={assets.dropdown_icon}
                            alt="Back"
                            className="h-5 w-5 rotate-180 text-zinc-900"
                        />
                        <p className="font-medium">Back</p>
                    </div>

                    {/* Navigation Links */}
                    <NavLink onClick={()=>{setvisible(false)}}
                        className="py-3 pl-6 border-b border-gray-200 hover:bg-gray-50 hover:text-black transition"
                        to="/"
                    >
                        Home
                    </NavLink>
                    <NavLink onClick={()=>{setvisible(false)}}
                        className="py-3 pl-6 border-b border-gray-200 hover:bg-gray-50 hover:text-black transition"
                        to="/collection"
                    >
                        Collections
                    </NavLink>
                    <NavLink onClick={()=>{setvisible(false)}}
                        className="py-3 pl-6 border-b border-gray-200 hover:bg-gray-50 hover:text-black transition"
                        to="/about"
                    >
                        About
                    </NavLink>
                    <NavLink onClick={()=>{setvisible(false)}}
                        className="py-3 pl-6 border-b border-gray-200 hover:bg-gray-50 hover:text-black transition"
                        to="/contact"
                    >
                        Contact
                    </NavLink>
                </div>

            </div>
        </div>
    );
};

export default Navbar;
