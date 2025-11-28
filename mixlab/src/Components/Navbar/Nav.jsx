import './Nav.css'
import { useState, useEffect } from 'react';
import Hamburger from '../Hamburger/Hamburger';
import { Link, useNavigate, useLocation } from "react-router-dom"; 
import { doc, getDoc } from "firebase/firestore";
import { db, auth } from "../../firebase"; 
import { onAuthStateChanged, signOut } from 'firebase/auth';

function Nav() {
  const navigate = useNavigate();
  const location = useLocation(); 
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState(null); 

  // Check if we are on the Admin Dashboard
  const isAdminPage = location.pathname === '/admin';

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        try {
          const docRef = doc(db, "users", currentUser.uid);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            setUserRole(docSnap.data().role); 
          }
        } catch (error) {
          console.error("Error fetching user role:", error);
        }
      } else {
        setUserRole(null);
      }
    });
    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/'); 
    } catch (error) {
      console.error("Error logging out:", error);
    }
  };
  
  // Sticky Header Logic
  const [isSticky, setIsSticky] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollTop, setLastScrollTop] = useState(0);

  useEffect(() => {
    const header = document.querySelector('header');
    if (!header) return; 
    const headerHeight = header.offsetHeight + 30;

    const handleScroll = () => {
      const windowTop = window.pageYOffset;
      if (windowTop >= headerHeight) {
        setIsSticky(true);
        if (windowTop < lastScrollTop) {
          setIsVisible(true);
        } else {
          setIsVisible(false);
        }
      } else {
        setIsSticky(false);
        setIsVisible(true);
      }
      setLastScrollTop(windowTop);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollTop]);


  return (
    <>
        <nav className='Nav1'>
            <header className={`${isSticky ? 'cs_gescout_sticky' : ''} ${isVisible ? 'cs_gescout_show' : ''}`}>
              
              <div className="logo">
                 {/* Logo */}
              </div>

              <ul className='ul1'>
                  {/* HOME IS ALWAYS VISIBLE */}
                  <li className='li1'><Link to="/" className="li1">Home</Link></li>

                  {/* HIDE ALL OTHER LINKS AND BUTTONS IF ON ADMIN PAGE */}
                  {!isAdminPage && (
                    <>
                      <li className='li1'><Link to="/service" className="li1">Services</Link></li>
                      <li className='li1'><Link to="/tc" className="li1">Divisions</Link></li>
                      <li className='li1'><Link to="/Contact" className="li1">Contact</Link></li>
                      <li className='li1'><Link to="/about" className="li1">About</Link></li>

                      {/* ADMIN LINK: Show only if Admin */}
                      {userRole === 'admin' && (
                        <li className='li1'>
                          <Link to="/admin" className="li1" style={{color: '#ff4444', fontWeight: 'bold'}}>Admin Dashboard</Link>
                        </li>
                      )}

                      {/* BOOK NOW */}
                      {user && (
                        <li className='li1'>
                          <Link 
                            to="/booking" 
                            className="li1" 
                            style={{ color: '#ffd700', fontWeight: 'bold', borderBottom: '1px solid #ffd700' }}>Book Now</Link>
                        </li>
                      )}

                      {/* LOGIN / LOGOUT */}
                      {user ? (
                        <li className='li1'>
                          <button onClick={handleLogout} className="nav-logout-btn">
                            Log Out
                          </button>
                        </li>
                      ) : (
                        <li className='li1'>
                          <Link to="/login" className="nav-login-btn">Log In</Link>
                        </li>
                      )}
                    </>
                  )}
                  
            </ul> 

            <div className="hamburger">
                <Hamburger/>
            </div>
            </header>
        </nav>
    </>
  )
}

export default Nav