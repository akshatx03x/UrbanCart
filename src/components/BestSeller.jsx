import React, { useContext, useState, useEffect } from 'react'
import { ShopContext } from '../context/ShopContext'
import Title from './Title';
import ProductItem from './ProductItem';

const BestSeller = () => {
  const { products } = useContext(ShopContext);
  const [bestseller, setBestSeller] = useState([]);

  useEffect(() => {
    const bestProduct = products.filter((item) => item.bestseller);
    setBestSeller(bestProduct.slice(0, 5));
  }, []);
  return (
    <div className='my-10'>
      <div className="text-center text-3xl  py-8 ">
        <Title text1={"Best"} text2={'Seller'}/>
        <p className="w-7/8 m-auto text-xs sm:text-sm md:text-base py-2 text-gray-600">
          Find Yourself Exclusive with our Best Selling Clothings!!!
        </p>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
        {
            bestseller.map((item, index) => (
                <ProductItem key={index} id={item._id} name={item.name} price={item.price} image={item.image} />
            ))
        }
      </div>
    </div>
  )
}

export default BestSeller
