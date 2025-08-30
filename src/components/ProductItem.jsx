import React, { useContext } from 'react'
import { ShopContext } from '../context/ShopContext'
import { Link } from 'react-router-dom';
import { assets } from '../assets/frontend_assets/assets';

const ProductItem = ({id, image, name, price}) => {
    const {currency}= useContext(ShopContext);
  return (
    <Link className='text-gray-700 cursor-pointer' to={`/product/${id}`}>
      <div className='over-flow:hidden rounded-2xl shadow-2xl '>
        <img className='hover:scale-110 transition ease-in-out rounded-2xl' src={image[0]} alt="" />
      </div>
      <p className='pt-3 pb-1 text-sm'>{name}</p>
      <p className='text-sm font-medium '>{currency}{price}</p>
    </Link>
  )
}

export default ProductItem
