import React from "react";
import { assets } from "../assets/frontend_assets/assets";

const Footer = () => {
  return (
    <div className="flex flex-col sm:grid grid-cols-[3fr_1fr_1fr] gap-14 my-10 mt-40 text-sm justify-between ">
      <div className="">
        <img src={assets.logo} alt="" className="mb-5 w-32 " />
        <p className="w-full md:w-2/3 text-gray-600">
          UrbanCart is your trusted destination for premium products and
          top-notch service. Since 2006, we’ve been committed to delivering
          quality, reliability, and customer satisfaction.
        </p>
      </div>
      <div>
        <p className="text-xl font-medium mb-5 ">UrbanCart</p>
        <ul className="flex flex-col gap-1 text-gray-600">
          <li>Home</li>
          <li>About us</li>
          <li>Delivery</li>
          <li>Privacy Policy</li>
        </ul>
      </div>
      <div>
        <p className="text-xl font-medium mb-5 ">Get In Touch</p>
        <ul className="flex flex-col gap-1 text-gray-600">
          <li>+91 88888 99999</li>
          <li>UrbanCart.shop.in</li>
        </ul>
      </div>
      <div>
        <hr className="my-4" />
        <p className="py-5 text-sm text-center text-gray-600">
         CopyRight © 2025 UrbanCart.com — All Rights Reserved.
        </p>
      </div>
    </div>
  );
};

export default Footer;
