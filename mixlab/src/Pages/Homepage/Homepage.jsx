import { useState, useEffect, useRef } from 'react';
import './Homepage.css'
// import AOS from 'aos';
// import 'aos/dist/aos.css';

const Homepage = () => {

    //   AOS.init({
    //     offset: 1,
    // });

  const [currentIndex, setCurrentIndex] = useState(0);
  const timeRunning = 3000;
  const timeAutoNext = 7000;
  const carouselRef = useRef(null);

  const sliderItems = [
    { img: '/src/assets/1mixlabphoto/studio/micropone.jpg', title: 'MIXLAB'},
    { img: '/src/assets/1mixlabphoto/studio/studio1.1.jpg', title: 'MIXLAB'},
    { img: '/src/assets/1mixlabphoto/studio/studio1.2.jpg', title: 'MIXLAB'},
    { img: '/src/assets/1mixlabphoto/studio/studiomic.jpg', title: 'MIXLAB'},
  ];

  useEffect(() => {
    const autoNext = setTimeout(() => {
      showSlider('next');
    }, timeAutoNext);

    return () => clearTimeout(autoNext);
  }, [currentIndex]);

  const showSlider = (type) => {
    let newIndex = currentIndex;
    if (type === 'next') {
      newIndex = (currentIndex + 1) % sliderItems.length;
    } else {
      newIndex = (currentIndex - 1 + sliderItems.length) % sliderItems.length;
    }

    setCurrentIndex(newIndex);

    if (carouselRef.current) {
      carouselRef.current.classList.add(type);
      setTimeout(() => {
        carouselRef.current.classList.remove(type);
      }, timeRunning);
    }
  };

  return (
        <div className="main">
             <div className="carousel" ref={carouselRef}>
      <div className="list">
        {sliderItems.map((item, index) => (
          <div key={index} className="item" style={{ display: index === currentIndex ? 'block' : 'none' }}>
            <img src={item.img} alt={item.title} />
            <div className="content">
              <div className="title">Mixlab Music Studio</div>
              <div className="des">
              MixLab Music Studios Inc. is a music company that provides a wide 
              range of services such as music production, custom jingle creation, 
              rehearsal and recording space, and music education. With a focus on 
              quality, creativity, and client satisfaction, MixLab aims to be a one-stop 
              destination for all audio and music production needs.
              </div>
              <div className="buttons">
                <button className='title-button'>SCROLLDWON TO SEE MORE</button>
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="thumbnail">
        {sliderItems.map((item, index) => (
          <div key={index} className="item" onClick={() => setCurrentIndex(index)}>
            <img src={item.img} alt={item.title} />
            <div className="content">
              <div className="title">Mixlab</div>
              <div className="description">Description</div>
            </div>
          </div>
        ))}
      </div>
      {/* <div className="time"></div> */}
    </div>

    <section className='info'>
          <div className='info1'data-aos="fade-up" data-aos-duration="1400">
            <p> MixLab Music Studios Inc. is a music company that provides a wide 
              range of services such as music production, custom jingle creation, 
              rehearsal and recording space, and music education. With a focus on 
              quality, creativity, and client satisfaction, MixLab aims to be a one-stop 
              destination for all audio and music production needs.
            </p>
          </div>
          <div className='info1' data-aos="fade-up" data-aos-duration="1600">
           MixLab Music Studios Inc. is a music company that provides a wide 
              range of services such as music production, custom jingle creation, 
              rehearsal and recording space, and music education. With a focus on 
              quality, creativity, and client satisfaction, MixLab aims to be a one-stop 
              destination for all audio and music production needs.
          </div>
          <div className='info1' data-aos="fade-up" data-aos-duration="1800">
           MixLab Music Studios Inc. is a music company that provides a wide 
              range of services such as music production, custom jingle creation, 
              rehearsal and recording space, and music education. With a focus on 
              quality, creativity, and client satisfaction, MixLab aims to be a one-stop 
              destination for all audio and music production needs.
          </div>
    </section>

    <section className='card'>
        <div className="line-title"data-aos="slide-up" data-aos-duration="1800">
            <p>Featured</p>
            <h2>Mixlab Music Studio</h2>
        </div>
        <div className="mx-event">
          <div className='tour1'data-aos="slide-up" data-aos-duration="1400">
            <span>Christian Bautista</span>
            <p>Guest Artist</p>
          </div>

          <div className='tour2'data-aos="slide-up" data-aos-duration="1600">
          <span>Bugoy Drilon</span>
          <p>Guest Artist</p>
          </div>

          <div className='tour3' data-aos="slide-up" data-aos-duration="1800">
          <span>Zild</span>
          <p>Guest Artist</p>
          </div>

          <div className='tour4' data-aos="slide-up" data-aos-duration="2000">
          <span>Leonides</span>
          <p>Guest Artist</p>
          </div>
        </div>
    </section>

    <section className='bottom-line'>
            <div className='line' data-aos="slide-right" data-aos-duration="1400"></div>
            <div className='line' data-aos="slide-left" data-aos-duration="1600"></div>
    </section>

    <section className='blog'> 

            <div className="-title"data-aos="slide-up" data-aos-duration="1800">
                <p>Mixlab</p>
                <h2>Events</h2>
            </div>
               
            <div className="blog1"> 

            <div className="blog-card"data-aos="slide-up" data-aos-duration="1400">
                <div className="media-content">  
            </div>

                <span className='date'>November 23, 2025</span>

                <div className="information">
                    <h2><a href="#" className='cs_post_title cs_semibold cs_fs_32'>Music Production Workshop</a></h2>
                </div>
            </div>

            <div className="blog-card"data-aos="slide-up" data-aos-duration="1600">
                <div className="media-content1">               
            </div>

                <span className='date'>December 14, 2025</span>

            <div className="information">
                    <h2><a href="#" className='cs_post_title cs_semibold cs_fs_32'>Grand Recital Vol.4</a></h2>
                </div>
            </div>


            <div className="blog-card"data-aos="slide-up" data-aos-duration="1800">
                <div className="media-content2">
                    
                </div>

                <span className='date'>January 1 ,2026</span>

                <div className="information">
                    <h2><a href="#" className='cs_post_title cs_semibold cs_fs_32'>The Start of the Year 2026</a></h2>
                </div>
            </div>
              </div>
    </section>

   {/*   <section className='blog100'>
            <div className="blog1">
            <div className="blog-play" data-aos="slide-up" data-aos-duration="1400">
                <div className="billboard">
                    
                </div>

                <span className='date'>May 1, 2023</span>

                <div className="information">
                    <h2><a href="#" className='cs_post_title cs_semibold cs_fs_32'>The Importance of Regular Cancer Screenings and Early Detection</a></h2>
                </div>
            </div>


            <div className="blog-play1" data-aos="slide-up" data-aos-duration="1600">
                <div className="billboard1">
                    
                </div>

                <span className='date'>May 1, 2023</span>

                <div className="information">
                    <h2><a href="#" className='cs_post_title cs_semibold cs_fs_32'>The Importance of Regular Cancer Screenings and Early Detection</a></h2>
                </div>
            </div>
            </div>
      </section> */}


    <section className='bash'>
          <div className="room">
            <div className="room1">
              <div className="check"data-aos="slide-right" data-aos-duration="1400">
                <h1>MIXLAB MUSIC STUDIO</h1>
              </div>

              <div className="check1"data-aos="slide-right" data-aos-duration="1600">
                <p>MixLab Music Studios Inc. is a music company that provides a wide range 
                  of services such as music production, custom jingle creation, rehearsal
                  and recording space, and music education. With a focus on quality, creativity, 
                  and client satisfaction, MixLab aims to be a one-stop destination for all audio 
                  and music production needs.
                </p>
              </div>

            </div>
            <div className="room2">
              <div className="videocard" data-aos="slide-left" data-aos-duration="1800">
                <iframe 
                  className='vi' 
                  src="https://www.youtube.com/embed/cpKqqQNukuU?autoplay=1&mute=0&loop=1&playlist=cpKqqQNukuU&controls=0&showinfo=0" 
                  title="YouTube video player" 
                  frameBorder="0" 
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" 
                  referrerPolicy="strict-origin-when-cross-origin" 
                  allowFullScreen
                ></iframe>
              </div>

              {/* <div className="videocard"data-aos="slide-left" data-aos-duration="1800">
              <video src="https://www.youtube.com/watch?v=cpKqqQNukuU" className='vi' autoPlay loop muted></video>
              </div>    USE THIS IF THE VIDEO IS FROM PC*/}
              
            </div>
          </div>
    </section>

    <section className='whyus'>
      <div className="whyus-nav"data-aos="fade-up" data-aos-duration="1400">
        <h2>Premium Music Lesson</h2>
      </div>
      <div className="whyus-card"data-aos="slide-up" data-aos-duration="1400">
          <div className='whyus-card1'>
            <div className='whyus-title' data-aos="slide-right" data-aos-duration="1400">TRIP OF YOUR DREAM</div>
            <div className='span-split'data-aos="slide-right" data-aos-duration="1600">
              <span>1. Enroll now at 𝗠𝗶𝘅𝗟𝗮𝗯 𝗠𝘂𝘀𝗶𝗰 𝗦𝘁𝘂𝗱𝗶𝗼𝘀 and experience the joy of 𝗽𝗿𝗲𝗺𝗶𝘂𝗺 𝗾𝘂𝗮𝗹𝗶𝘁𝘆 music lessons for you or your child! </span>
              <span>2. Plus, enjoy a 𝗳𝗿𝗲𝗲 𝗮𝘂𝗱𝗶𝗼 𝗮𝗻𝗱 𝘃𝗶𝗱𝗲𝗼 recording session when you complete any Standard to VIP package.</span>
              <span>3. Your chance to experience what it's like to be in a real studio</span>
              <span>4. Who knows? You might just be the next recording artist!</span>
            </div>

          <div className='whyus-block'>
              <button className='readmore'data-aos="slide-right" data-aos-duration="1800">Read More</button>
            </div>
          </div> 

          <div className='whyus-card2'>
            <div className="cards">
              <div className="card red"data-aos="slide-up" data-aos-duration="1400"></div>
              <div className="card blue"data-aos="slide-up" data-aos-duration="1600"></div>
              <div className="card green"data-aos="slide-up" data-aos-duration="1800"></div>
            </div>

          </div>
      </div>

    </section>


    <section className='last-dimension'>
          <div className="us"data-aos="slide-up" data-aos-duration="1400">WHY US?</div>
          <div className="hobbition">
              <div className="hobbition-info"data-aos="slide-right" data-aos-duration="1400">
                <h2>Mixlab Music Studio</h2>
                <span>Discover incredible talents and unbeatable music recording deals.
                  Plan your perfect getaway and embark on new music.
                  </span>
                  <button className='readmore'>Read More</button>
              </div>


              <div className="hobbition-pic"data-aos="slide-left" data-aos-duration="1400"></div>
          </div>

          <div className="trending">
              <span data-aos="slide-right" data-aos-duration="1400"><h2>Popular tour</h2></span>

              <div className="tour-data">
                  <div className="tour-card" data-aos="slide-right" data-aos-duration="1400">
                    <div className="tc-info">
                      <span>Paris, France </span>
                      <div className="tour-icon"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-arrow-right-circle" viewBox="0 0 16 16">
                        <path fillRule="evenodd" d="M1 8a7 7 0 1 0 14 0A7 7 0 0 0 1 8m15 0A8 8 0 1 1 0 8a8 8 0 0 1 16 0M4.5 7.5a.5.5 0 0 0 0 1h5.793l-2.147 2.146a.5.5 0 0 0 .708.708l3-3a.5.5 0 0 0 0-.708l-3-3a.5.5 0 1 0-.708.708L10.293 7.5z"/>
                      </svg></div>
                    </div>
                  </div>


                  <div className="tour-card1"data-aos="slide-right" data-aos-duration="1600">
                    <div className="tc-info">
                      <span>Kyoto, Japan </span>
                      <div className="tour-icon"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-arrow-right-circle" viewBox="0 0 16 16">
                        <path fillRule="evenodd" d="M1 8a7 7 0 1 0 14 0A7 7 0 0 0 1 8m15 0A8 8 0 1 1 0 8a8 8 0 0 1 16 0M4.5 7.5a.5.5 0 0 0 0 1h5.793l-2.147 2.146a.5.5 0 0 0 .708.708l3-3a.5.5 0 0 0 0-.708l-3-3a.5.5 0 1 0-.708.708L10.293 7.5z"/>
                      </svg></div>
                    </div>
                  </div>

                  <div className="tour-card2"data-aos="slide-right" data-aos-duration="1800">
                    <div className="tc-info">
                      <span>Santorini, Greece </span>
                      <div className="tour-icon"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-arrow-right-circle" viewBox="0 0 16 16">
                        <path fillRule="evenodd" d="M1 8a7 7 0 1 0 14 0A7 7 0 0 0 1 8m15 0A8 8 0 1 1 0 8a8 8 0 0 1 16 0M4.5 7.5a.5.5 0 0 0 0 1h5.793l-2.147 2.146a.5.5 0 0 0 .708.708l3-3a.5.5 0 0 0 0-.708l-3-3a.5.5 0 1 0-.708.708L10.293 7.5z"/>
                      </svg></div>
                    </div>
                  </div>


                  <div className="tour-card3" data-aos="slide-right" data-aos-duration="2000">
                    <div className="tc-info">
                      <span>Machu Picchu, Peru  </span>
                      <div className="tour-icon"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-arrow-right-circle" viewBox="0 0 16 16">
                        <path fillRule="evenodd" d="M1 8a7 7 0 1 0 14 0A7 7 0 0 0 1 8m15 0A8 8 0 1 1 0 8a8 8 0 0 1 16 0M4.5 7.5a.5.5 0 0 0 0 1h5.793l-2.147 2.146a.5.5 0 0 0 .708.708l3-3a.5.5 0 0 0 0-.708l-3-3a.5.5 0 1 0-.708.708L10.293 7.5z"/>
                      </svg></div>
                    </div>
                  </div>
              </div>
            </div>
          
    </section>
    </div>
  );
}; 

export default Homepage;