import React, { useState } from 'react'
import Navbar from './pages/Navbar/Navbar';
import { Route, Routes, Navigate } from 'react-router-dom';
import Home from './pages/Home/Home'
import Cart from './pages/Cart/Cart'
import PlaceOrder from './pages/PlaceOrder/PlaceOrder';
import Footer from './components/Footer/Footer';
import LoginPopup from './components/LoginPopup/LoginPopup';
import Verify from './pages/Verify/Verify';
import MyOrders from './pages/MyOrders/MyOrders'
import DriverRevenue from './pages/DriverFood/DriverRevenue';
import DriverWallet from './pages/DriverFood/DriverWallet';
import DriverTracking from './pages/DriverFood/DriverTracking';
import DriverLogin from './pages/DriverFood/DriverLogin.jsx';
import FoodDetail from './components/FoodDetail/FoodDetail';
import Search from './pages/search/search';

const App = () => {

  const [showLogin, setShowLogin] = useState(false)
  

  return (
    <>
      {showLogin ? <LoginPopup setShowLogin={setShowLogin} /> : <></>}
      <div className='app'>
        <Navbar setShowLogin={setShowLogin} />
        <Routes>
          <Route path='/' element={<Home />} />
          <Route path='/cart' element={<Cart />} />
          <Route path='/order' element={<PlaceOrder />} />
          <Route path='/verify' element={<Verify />} />
          <Route path='/myorders' element={<MyOrders />} />
          <Route path='/food/:id' element={<FoodDetail />} />
          <Route path='/driver' element={<DriverLogin />} />
          <Route path='/driver/tracking' element={<DriverTracking />} />
          <Route path='/driver/revenue' element={<DriverRevenue />} />
          <Route path='/driver/wallet' element={<DriverWallet />} />
          <Route path='/search' element={<Search />} />
        </Routes>
      </div>
      <Footer />
    </>
  )
}

export default App;