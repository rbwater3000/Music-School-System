import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import "./App.css";


 {/* import Service from './Pages/service'
import About from "./Pages/About/About";
import Contact from './Pages/Contact/Contact';
import TripCatalog from "./Pages/TripCatalog/TripCatalog";

import Accomodations from "./Pages/Accomodation/Accomodation"
import Register from './Components/Login/Register/Register'; */}

import Homepage from "./Pages/Homepage/Homepage";
import Footer from './Components/Footer/Footer'
import Nav from "./Components/Navbar/Nav";
import Login from './Components/Login/Login';
import Register from './Components/Login/Register/Register'; 
import Booking from './Components/Booking/Booking';
import BookingSuccess from './Components/Booking/BookingSuccess';
import AdminDashboard from './Components/Admin/AdminDashboard';

const App = () => {
  return (
    <>
      {/* Use BrowserRouter instead of Router */}
      <Router>
        <Nav />
        <Routes>
          <Route path="/" element={<Homepage />} />
          <Route path="/login" element={<Login />}/> 
          <Route path="/register" element={<Register />} />

          {/* BOOKING PO ITO HAHA */}
        <Route path="/booking" element={<Booking />} />
        <Route path="/booking-success" element={<BookingSuccess />} />

         {/* ADMIN NA MALUPIT ITO */}
         <Route path="/admindashboard" element={<AdminDashboard />} />
         
         {/* 
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/service" element={<Service />} /> 
          <Route path="/accom" element={<Accomodations/>} />
          <Route path="/tc" element={<TripCatalog />} />
           
           {/* Register */}

        </Routes>
        <Footer/>
      </Router>
    </>
  );
};  

export default App;

