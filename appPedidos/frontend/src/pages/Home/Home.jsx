import React, { useState } from 'react'
import './Home.css'
import Header from '../../components/Header'
import ExploreMenu from '../../components/client/ExploreMenu'
import FoodDisplay from '../../components/client/FoodDisplay'

const Home = () => {

    const[category,setCategory] = useState("All")

  return (
    <div className='home'>
        <Header/>
        <ExploreMenu category={category} setCategory={setCategory}/>
        <FoodDisplay category={category} />
    </div>
  )
}

export default Home