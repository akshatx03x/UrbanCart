import React from 'react'

const NewsLetterBox = () => {
    const OnSubmitHandler=(event)=>{
        event.preventDefault();
    }
  return (
    <div className='text-center bg-gray-100 rounded-3xl px-10 py-7'>
      <p className='text-2xl text-gray-800 font-medium'>Subscribe now & get 20% off </p>
      <p className="text-gray-400 mt-3">
        Enjoy the ultimate joy of Discounts and get hassle free products at your Doorstep!!!
      </p>

      <form onSubmit={OnSubmitHandler} className='w-full sm:w-1/2 flex item-center gap-3 mx-auto my-6 boder pl-3 '>
        <input className='w-full sm:flex-1 outline-none border rounded-2xl p-3 ' type="email" placeholder='Enter your Email' required/>
        <button className='bg-black rounded-2xl text-white text-sm px-10 py-2' type='submit'>Subscribe </button>
      </form>
    </div>
  )
}

export default NewsLetterBox
