import React from 'react'
import TechBanner from './TechBanner'
import OfferBanner from './OfferBanner'
import HomeCategories from './HomeCategories'


const Home = () => {
  return (
    <div>
      <TechBanner/>
      <HomeCategories />
      <OfferBanner />
    </div>
  )
}

export default Home
