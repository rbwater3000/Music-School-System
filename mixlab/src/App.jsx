import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import "./App.css";

//import Service from './Pages/service'
//import About from "./Pages/About/About";
//import Contact from './Pages/Contact/Contact';
//import TripCatalog from "./Pages/TripCatalog/TripCatalog";
//import Accomodations from "./Pages/Accomodation/Accomodation"


import Homepage from "./Pages/Homepage/Homepage"; //Ito yung Homepage
import Footer from './Components/Footer/Footer'; // Ito Yung Footer
import Nav from "./Components/Navbar/Nav"; //Ito yung Navbar
import Login from './Components/Login/Login'; //Ito yung Login
import Register from './Components/Login/Register/Register'; //Ito yung Registration
import Booking from './Components/Booking/Booking'; // Ito yung Booking
import BookingSuccess from './Components/Booking/BookingSuccess'; //Ito yung Notification sa Booking
import AdminDashboard from './Components/Admin/AdminDashboard'; //Ito yung Admin Dashboard
import UserProfile from './components/UserProfile/UserProfile'; //Ito yung Profile
import MusicGame from './Pages/Homepage/MusicGame'; // ITO YUNG GAMES 
import UserPass from './Pages/CheckIn/UserPass'; //Ito yung User Pass
import AdminScanner from './Pages/CheckIn/AdminScanner'; //Ito Yung Scanner 

const App = () => {
  return (
    <>
       
      <Router>
        <Nav />
        <Routes> 
        <Route path="/" element={<Homepage />} />
        <Route path="/login" element={<Login />}/> 
        <Route path="/register" element={<Register />} />

          {/* BOOKING ITO HAHA */}
        <Route path="/booking" element={<Booking />} />
        <Route path="/booking-success" element={<BookingSuccess />} />

         {/* ADMIN NA MALUPIT ITO */}
         <Route path="/admin" element={<AdminDashboard />} />
           {/* PROFILE ITO */}
        <Route path="/profile" element={<UserProfile />} /> 

          {/* ITO YUNG GAMES */}
        <Route path="/game" element={<MusicGame />} />

          {/* ITO YUNG QR SCANNER */}
        <Route path="/my-pass" element={<UserPass />} />
        <Route path="/admin-scanner" element={<AdminScanner />} />
         
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

