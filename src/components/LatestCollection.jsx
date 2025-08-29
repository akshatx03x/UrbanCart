import React, { useContext, useEffect, useState } from "react";
import { ShopContext } from "../context/ShopContext";
import Title from "./Title";
import ProductItem from "./ProductItem";

const LatestCollection = () => {
  const { products } = useContext(ShopContext);
  const [latestProducts, setlatestProducts]= useState([]);
  useEffect(() => {
    setlatestProducts(products.slice(0,10));
  },[])
  return (
    <div className="my-10">
      <div className="text-center py-8 text-3xl">
        <Title text1={"Latest"} text2={"Collections"} />
        <p className="w-3/4 m-auto text-xs sm:text-sm md:text-base text-gray-600">
          Lorem ipsum, dolor sit amet consectetur adipisicing elit. Dolor
          temporibus veniam aut? Ut quam, placeat iusto ipsa porro consequatur
          quo voluptatem, autem rerum error architecto pariatur iste. Amet, hic
          quo.
        </p>
      </div>
      {/* Rendering products */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grids-col-4 lg:grid-cols-5 gap-4 gap-y-6 ">
        {
            latestProducts.map((items, index)=>{
                <ProductItem key={index} id={item_.id} />
            })
        }
      </div>
    </div>
  );
};

export default LatestCollection;
