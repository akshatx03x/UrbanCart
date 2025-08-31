import React, { useEffect } from "react";
import { useContext, useState } from "react";
import { ShopContext } from "../context/ShopContext";
import { assets } from "../assets/frontend_assets/assets";
import Title from "../components/Title";
import ProductItem from "../components/ProductItem";

const Collection = () => {
  const { products } = useContext(ShopContext);
  const [showFilter, setShowFilter] = useState(false);
  const [filterProducts, setFilterProducts] = useState([]);
  const [category, setCategory] = useState([]);
  const [subCategory, setSubCategory] = useState([]); 
  const toggleCategory = (e) => {
    
    if(category.includes(e.target.value)) {
       setCategory(prev=>prev.filter(item => item !== e.target.value));
    }
    else{
      setCategory([...category, e.target.value]);
    }
  }
  const toggleSubCategory = (e) => {
    if(subCategory.includes(e.target.value)) {
       setSubCategory(prev=>prev.filter(item => item !== e.target.value));
    }
    else{
      setSubCategory([...subCategory, e.target.value]);
    }
  }
  const applyFilter= () => {
    let productsCopy= products.slice();
    if(category.length>0) {
      productsCopy= productsCopy.filter(item=> category.includes(item.category));
    }
      if (subCategory.length > 0) {
    productsCopy = productsCopy.filter(item => subCategory.includes(item.subCategory));
  }
    setFilterProducts(productsCopy);
  }

  useEffect(() => {
    setFilterProducts(products);
  }, [products]);

  useEffect(() => {
    applyFilter();
  }, [category, subCategory]);

  return (
    <div className="flex flex-col sm:flex-row gap-1 sm:gap-10 pt-10 border-t">
      {/* Filter Options */}
      <div className="min-w-60  gap-2">
        <p
          onClick={() => setShowFilter(!showFilter)}
          className="my-2 text-xl font-bold flex bg-gray-300 rounded-full p-2 justify-center items-center cursor-pointer gap-2 "
        >
          FILTERS
        </p>
        {/* Category Filter */}
        <div
          className={`border border-gray-300 rounded-2xl shadow-xl cursor-pointer pl-5 py-3 mt-6 ${
            showFilter ? "" : "hidden"
          } sm:block`}
        >
          <p className="mb-3 text-sm font-medium ">CATEGORIES</p>
          <div className="flex flex-col gap-2 text-sm font-light text-gary-700">
            <p className="flex gap-2 ">
              <input type="checkbox" className="w-3 " value={"Men"} onChange={toggleCategory} />
              Men
            </p>
            <p className="flex gap-2 ">
              <input type="checkbox" className="w-3 " value={"Women"} onChange={toggleCategory} />
              Women
            </p>
            <p className="flex gap-2 ">
              <input type="checkbox" className="w-3 " value={"Kids"} onChange={toggleCategory} />
              Kids
            </p>
          </div>
        </div>
        {/* Sub-Category Filter */}
        <div
          className={`border border-gray-300 rounded-2xl shadow-xl cursor-pointer pl-5 py-3 mt-6 ${
            showFilter ? "" : "hidden"
          } sm:block`}
        >
          <p className="mb-3 text-sm font-medium ">TYPES</p>
          <div className="flex flex-col gap-2 text-sm font-light text-gary-700">
            <p className="flex gap-2 ">
              <input type="checkbox" className="w-3 " value={"Topwear"} onChange={toggleSubCategory} />
              Topwear
            </p>
            <p className="flex gap-2 ">
              <input type="checkbox" className="w-3 " value={"Bottomwear"} onChange={toggleSubCategory} />
              Bottomwear
            </p>
            <p className="flex gap-2 ">
              <input type="checkbox" className="w-3 " value={"Winterwear"} onChange={toggleSubCategory} />
              Winterwear
            </p>
          </div>
        </div>
      </div>
      {/* Right Side */}
      <div className="flex-1">
        <div className="flex justify-between text-base sm:text-2xl mb-4 ">
          <Title text1={"ALL"} text2={"Collections"} />
          {/* Product Sort */}
          <select className="border-none outline-none rounded-2xl bg-gray-200 hover:cursor-pointer border-gray-300 text-sm px-2 ">
            <option
              className="rounded-2xl bg-gray-200 border-none"
              value="relevant"
            >
              Sort By: Relevant
            </option>
            <option
              className="rounded-2xl bg-gray-200 border-none"
              value="low-high"
            >
              Sort By: Low-High
            </option>
            <option
              className="rounded-2xl bg-gray-200 border-none"
              value="high-low"
            >
              Sort By: High-Low
            </option>
          </select>
        </div>
        {/* Products */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 gap-y-6 ">
        {
          filterProducts.map((item,index)=>(
            <ProductItem key={index} name={item.name} id={item._id} price={item.price} image={item.image} />
          ))
        }
      </div>
      </div>
    </div>
  );
};

export default Collection;
