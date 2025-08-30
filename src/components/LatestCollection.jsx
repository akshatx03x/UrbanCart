import React, { useContext, useEffect, useState } from "react";
import { ShopContext } from "../context/ShopContext";
import Title from "./Title";
import ProductItem from "./ProductItem";

const LatestCollection = () => {
  const { products } = useContext(ShopContext);
  const [latestProducts, setlatestProducts] = useState([]);
  useEffect(() => {
    setlatestProducts(products.slice(0, 10));
  }, []);
  return (
    <div className="my-10">
      <div className="text-center py-8 text-3xl">
        <Title text1={"Latest"} text2={"Collections"} />
        <p className="w-7/8 m-auto text-xs sm:text-sm md:text-base py-2 text-gray-600">
          Discover our latest collection, where style meets comfort. From
          timeless classics to trendy essentials, every piece is designed to
          elevate your everyday look. Crafted with premium fabrics and modern
          designs, our new arrivals are perfect for making a statement while
          keeping it effortless.
        </p>
      </div>
      {/* Rendering products */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grids-col-4 lg:grid-cols-5 gap-4 gap-y-6 ">
        {latestProducts.map((item, index) => (
          <ProductItem
            key={index}
            id={item._id}
            image={item.image}
            name={item.name}
            price={item.price}
          />
        ))}
      </div>
    </div>
  );
};

export default LatestCollection;
