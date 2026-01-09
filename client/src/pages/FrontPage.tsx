import { Link } from 'react-router-dom'
import Footer from '../components/Footer'

export default function FrontPage() {
  return (
    <div className="min-h-screen flex flex-col bg-[#0a0b11] text-white relative overflow-hidden">
      {/* Background: subtle vignette + professional gradient */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(70%_60%_at_50%_30%,transparent_0%,rgba(2,6,23,0.55)_60%,#0a0b11_100%)]" />
        <div className="absolute inset-0 opacity-[.10] [background:linear-gradient(115deg,rgba(56,189,248,.08)_0%,rgba(168,85,247,.06)_40%,rgba(236,72,153,.05)_80%,transparent_100%)]" />
        <div className="absolute inset-0 opacity-[.02] [background-image:radial-gradient(rgba(255,255,255,0.35)_0.5px,transparent_0.5px)] [background-size:14px_14px]" />
      </div>

      <div className="flex-1 w-full max-w-6xl mx-auto flex items-center justify-center px-4 sm:px-8 lg:px-12 py-8 sm:py-12 lg:py-14">
        <div className="w-full grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 lg:gap-14 items-center">
          {/* Left: Logo and college name */}
          <div className="order-1 lg:order-1">
            <div className="w-full max-w-md mx-auto">
              <div className="relative rounded-2xl p-[1px] bg-white/6 border border-white/10 shadow-[0_20px_60px_rgba(0,0,0,0.45)]">
                <div className="relative rounded-2xl bg-[#0b0d14]/70 backdrop-blur-md border border-white/10 px-6 sm:px-8 lg:px-9 py-8 sm:py-9 lg:py-10 text-center overflow-hidden">
                  <div className="pointer-events-none absolute -inset-[1px] rounded-2xl opacity-20 [background:linear-gradient(120deg,transparent,rgba(56,189,248,.18),rgba(217,70,239,.18),transparent)] [filter:blur(10px)] animate-[sweep_9s_linear_infinite]" />

                  <div className="relative z-10 flex flex-col items-center">
                    <div className="w-48 h-48 sm:w-52 sm:h-52 lg:w-56 lg:h-56 rounded-full bg-[#0d0f16] relative flex items-center justify-center overflow-hidden shadow-[0_25px_60px_rgba(0,0,0,0.5)]">
                      <div className="absolute inset-0 rounded-full bg-[conic-gradient(from_0deg,rgba(56,189,248,.20),rgba(217,70,239,.16),rgba(168,85,247,.16),rgba(56,189,248,.20))] opacity-15" />
                      <div className="absolute inset-[4px] sm:inset-[6px] lg:inset-[6px] rounded-full bg-gradient-to-br from-[#171a22] to-[#0f111a] border border-white/10 shadow-inner" />
                      <img src="https://res.cloudinary.com/dj1shcirv/image/upload/v1757919594/images-removebg-preview_hw9ige.png" alt="College Logo" className="w-[92%] h-[92%] object-contain relative z-10" />
                    </div>

                    <h1 className="mt-16 sm:mt-12 text-base sm:text-lg md:text-xl lg:text-2xl font-extrabold tracking-tight leading-snug text-center bg-gradient-to-r from-sky-400 via-cyan-300 to-fuchsia-400 bg-clip-text text-transparent [text-shadow:0_0_10px_rgba(56,189,248,0.25),0_0_18px_rgba(217,70,239,0.18)]">
                      <span className="block whitespace-nowrap">Anna University Regional Campus,</span>
                      <span className="block whitespace-nowrap">Coimbatore</span>
                    </h1>
                    <div className="mt-2 h-[2px] w-16 rounded-full bg-gradient-to-r from-sky-400 via-cyan-300 to-fuchsia-400 opacity-60" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Title and actions */}
          <div className="order-2 lg:order-2 text-center lg:text-left lg:pl-2">
            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-black bg-gradient-to-r from-sky-400 via-cyan-300 to-fuchsia-400 bg-clip-text text-transparent mb-2 sm:mb-6 lg:mb-4 whitespace-nowrap">Placement App</h2>
            <div className="block sm:hidden mx-auto w-full max-w-[22rem] px-2">
              {/* Mobile container with proper alignment */}
              <div className="text-slate-200 mb-12 pb-0 text-xs leading-5 text-center tracking-[0.01em] font-medium mobile-text-center px-0">
                <div className="mobile-gloss-box mx-auto">
                  <p className="mobile-justify">A dedicated placement portal for students and admins. Maintain verified profiles with downloadable resumes. Access everything on a mobile-responsive platform.</p>
                </div>
              </div>
              <div className="flex flex-col items-center gap-5 mt-8">
                <Link to="/login" className="neon-btn">
                  <span className="neon-btn-outer neon-btn-outer--blue">
                    <span className="neon-btn-inner btn-glass text-sm font-semibold text-white select-none hero-fill bulge-corners text-center">Student Login</span>
                  </span>
                </Link>
                <Link to="/admin/login" className="neon-btn">
                  <span className="neon-btn-outer neon-btn-outer--purple">
                    <span className="neon-btn-inner btn-glass text-sm font-semibold text-white select-none hero-fill bulge-corners purple text-center">Admin Login</span>
                  </span>
                </Link>
              </div>
            </div>
            <div className="hidden sm:block text-slate-200 space-y-0 lg:space-y-1 mb-8 text-base lg:text-base leading-6 lg:leading-7 max-w-[36rem] sm:mx-auto lg:mx-0 px-0 tracking-[0.01em] font-medium">
              {/* Center on tablet, left on desktop */}
              <div className="block lg:hidden text-center">
                <p>A dedicated placement portal for students and admins.</p>
                <p>Maintain verified profiles with downloadable resumes.</p>
                <p>Track your progress and placement activities effortlessly.</p>
                <p>Access everything on a mobile-responsive platform.</p>
              </div>
              <div className="hidden lg:block text-left">
                <p>A dedicated placement portal for students and admins.</p>
                <p>Maintain verified profiles with downloadable resumes.</p>
                <p>Track your progress and placement activities effortlessly.</p>
                <p>Access everything on a mobile-responsive platform.</p>
              </div>
            </div>
            <div className="hidden sm:flex mt-4 flex-row items-center lg:items-start justify-start gap-3 lg:self-start">
              {/* Center buttons on tablet, left on desktop */}
              <Link to="/login" className="neon-btn sm:mx-auto lg:mx-0">
                <span className="neon-btn-outer neon-btn-outer--blue">
                  <span className="neon-btn-inner btn-glass text-base select-none hero-fill">Student Login</span>
                </span>
              </Link>
              <Link to="/admin/login" className="neon-btn sm:mx-auto lg:mx-0">
                <span className="neon-btn-outer neon-btn-outer--purple">
                  <span className="neon-btn-inner btn-glass text-base select-none hero-fill purple">Admin Login</span>
                </span>
              </Link>
            </div>
          </div>
        </div>
      </div>
      <div className="relative z-10">
        <Footer />
      </div>

      <style>{`@keyframes float {0%{transform:translateY(0)}50%{transform:translateY(-10px)}100%{transform:translateY(0)}}
      @keyframes sweep {0%{transform:translateX(-120%)}100%{transform:translateX(120%)}}
      /* Moving gradient for button border */
      @keyframes gradient-move {
        0% { background-position: 0% 50% }
        50% { background-position: 100% 50% }
        100% { background-position: 0% 50% }
      }
      @keyframes shift {0%{background-position:0% 50%}50%{background-position:100% 50%}100%{background-position:0% 50%}}
      @keyframes cornerA {0%{transform:translate3d(0,0,0) rotate(0deg)}50%{transform:translate3d(4%,3%,0) rotate(6deg)}100%{transform:translate3d(0,0,0) rotate(0deg)}}
      @keyframes cornerB {0%{transform:translate3d(0,0,0) rotate(0deg)}50%{transform:translate3d(-4%,-3%,0) rotate(-6deg)}100%{transform:translate3d(0,0,0) rotate(0deg)}}
      /* CSV-like but subtle hover for hero buttons */
      .hero-slice{position:relative;overflow:hidden}
      .hero-slice>.text{position:relative;z-index:1}
      .hero-slice::after{content:"";position:absolute;inset:50%;transform:translate(-50%,-50%) skewX(-12deg);width:0;height:220%;transition:600ms cubic-bezier(.83,0,.17,1);opacity:.22}
      .hero-blue::after{background:linear-gradient(180deg,rgba(56,189,248,.30),rgba(56,189,248,.30))}
      .hero-purple::after{background:linear-gradient(180deg,rgba(217,70,239,.30),rgba(217,70,239,.30))}
      .hero-slice:hover::after,.hero-slice[data-pressed="true"]::after{width:130%}
       .hero-slice:hover,.hero-slice[data-pressed="true"]{background:#111423;transform:translateY(-2px)}
       /* Animated gradient text for inner label (fallback visible motion) */
       .moving-text{background:linear-gradient(90deg,#fff,rgba(255,255,255,.85),#fff);background-size:200% 100%;-webkit-background-clip:text;background-clip:text;color:transparent;animation:gradient-move 3.5s linear infinite}
       
       /* Permanent glow effects for buttons */
       .shadow-sky-900\/30{box-shadow:0 0 15px rgba(56,189,248,0.4),0 0 30px rgba(56,189,248,0.2),0 0 45px rgba(56,189,248,0.1),0 10px 20px -4px rgba(56,189,248,0.3)}
       .shadow-fuchsia-900\/30{box-shadow:0 0 15px rgba(217,70,239,0.4),0 0 30px rgba(217,70,239,0.2),0 0 45px rgba(217,70,239,0.1),0 10px 20px -4px rgba(217,70,239,0.3)}
       /* Apply moving gradient to the outer pill ring */
       .animate-gradient{background-size: 200% 200%;animation: gradient-move 4s linear infinite}
       
       /* Enhanced glow effects for buttons with bright light on hover */
       .group:hover .shadow-sky-900\/30{box-shadow:0 0 30px rgba(56,189,248,0.8),0 0 60px rgba(56,189,248,0.4),0 0 90px rgba(56,189,248,0.2),0 20px 40px -4px rgba(56,189,248,0.6)}
       .group:hover .shadow-fuchsia-900\/30{box-shadow:0 0 30px rgba(217,70,239,0.8),0 0 60px rgba(217,70,239,0.4),0 0 90px rgba(217,70,239,0.2),0 20px 40px -4px rgba(217,70,239,0.6)}
       
       /* Bright glow animation */
       @keyframes bright-glow-pulse {
         0%, 100% { 
           filter: brightness(1.2) drop-shadow(0 0 15px rgba(56,189,248,0.6)) drop-shadow(0 0 30px rgba(56,189,248,0.4));
           box-shadow: 0 0 20px rgba(56,189,248,0.6), 0 0 40px rgba(56,189,248,0.3);
         }
         50% { 
           filter: brightness(1.4) drop-shadow(0 0 25px rgba(56,189,248,0.8)) drop-shadow(0 0 50px rgba(56,189,248,0.5));
           box-shadow: 0 0 30px rgba(56,189,248,0.8), 0 0 60px rgba(56,189,248,0.4);
         }
       }
       @keyframes bright-glow-pulse-purple {
         0%, 100% { 
           filter: brightness(1.2) drop-shadow(0 0 15px rgba(217,70,239,0.6)) drop-shadow(0 0 30px rgba(217,70,239,0.4));
           box-shadow: 0 0 20px rgba(217,70,239,0.6), 0 0 40px rgba(217,70,239,0.3);
         }
         50% { 
           filter: brightness(1.4) drop-shadow(0 0 25px rgba(217,70,239,0.8)) drop-shadow(0 0 50px rgba(217,70,239,0.5));
           box-shadow: 0 0 30px rgba(217,70,239,0.8), 0 0 60px rgba(217,70,239,0.4);
         }
       }
       @keyframes bright-glow-pulse-green {
         0%, 100% { 
           filter: brightness(1.2) drop-shadow(0 0 15px rgba(34,197,94,0.6)) drop-shadow(0 0 30px rgba(34,197,94,0.4));
           box-shadow: 0 0 20px rgba(34,197,94,0.6), 0 0 40px rgba(34,197,94,0.3);
         }
         50% { 
           filter: brightness(1.4) drop-shadow(0 0 25px rgba(34,197,94,0.8)) drop-shadow(0 0 50px rgba(34,197,94,0.5));
           box-shadow: 0 0 30px rgba(34,197,94,0.8), 0 0 60px rgba(34,197,94,0.4);
         }
       }
       /* 3D breathing animation for blue buttons */
       @keyframes breathe-in-out-blue {
         0%, 100% { 
           transform: scale(1) translateZ(0);
           filter: brightness(1) drop-shadow(0 0 8px rgba(56,189,248,0.2)) drop-shadow(0 0 16px rgba(56,189,248,0.1));
           box-shadow: 0 0 15px rgba(56,189,248,0.4), 0 0 30px rgba(56,189,248,0.2), 0 0 45px rgba(56,189,248,0.1), inset 0 2px 4px rgba(0,0,0,0.3);
         }
         50% { 
           transform: scale(1.05) translateZ(10px);
           filter: brightness(1.15) drop-shadow(0 0 20px rgba(56,189,248,0.5)) drop-shadow(0 0 40px rgba(56,189,248,0.3));
           box-shadow: 0 8px 25px rgba(56,189,248,0.7), 0 15px 50px rgba(56,189,248,0.4), 0 25px 75px rgba(56,189,248,0.2), inset 0 4px 8px rgba(0,0,0,0.2);
         }
       }
       
       /* 3D breathing animation for purple buttons */
       @keyframes breathe-in-out-purple {
         0%, 100% { 
           transform: scale(1) translateZ(0);
           filter: brightness(1) drop-shadow(0 0 8px rgba(217,70,239,0.2)) drop-shadow(0 0 16px rgba(217,70,239,0.1));
           box-shadow: 0 0 15px rgba(217,70,239,0.4), 0 0 30px rgba(217,70,239,0.2), 0 0 45px rgba(217,70,239,0.1), inset 0 2px 4px rgba(0,0,0,0.3);
         }
         50% { 
           transform: scale(1.05) translateZ(10px);
           filter: brightness(1.15) drop-shadow(0 0 20px rgba(217,70,239,0.5)) drop-shadow(0 0 40px rgba(217,70,239,0.3));
           box-shadow: 0 8px 25px rgba(217,70,239,0.7), 0 15px 50px rgba(217,70,239,0.4), 0 25px 75px rgba(217,70,239,0.2), inset 0 4px 8px rgba(0,0,0,0.2);
         }
       }
       
       /* 3D breathing animation for green buttons */
       @keyframes breathe-in-out-green {
         0%, 100% { 
           transform: scale(1) translateZ(0);
           filter: brightness(1) drop-shadow(0 0 8px rgba(34,197,94,0.2)) drop-shadow(0 0 16px rgba(34,197,94,0.1));
           box-shadow: 0 0 15px rgba(34,197,94,0.4), 0 0 30px rgba(34,197,94,0.2), 0 0 45px rgba(34,197,94,0.1), inset 0 2px 4px rgba(0,0,0,0.3);
         }
         50% { 
           transform: scale(1.05) translateZ(10px);
           filter: brightness(1.15) drop-shadow(0 0 20px rgba(34,197,94,0.5)) drop-shadow(0 0 40px rgba(34,197,94,0.3));
           box-shadow: 0 8px 25px rgba(34,197,94,0.7), 0 15px 50px rgba(34,197,94,0.4), 0 25px 75px rgba(34,197,94,0.2), inset 0 4px 8px rgba(0,0,0,0.2);
         }
       }
       
       /* Mobile-specific glow animations */
       @keyframes mobile-glow-pulse {
         0%, 100% { 
           filter: brightness(1.1) drop-shadow(0 0 12px rgba(56,189,248,0.4)) drop-shadow(0 0 24px rgba(56,189,248,0.2)) drop-shadow(0 0 36px rgba(56,189,248,0.1));
           box-shadow: 0 0 20px rgba(56,189,248,0.6), 0 0 40px rgba(56,189,248,0.3), 0 0 60px rgba(56,189,248,0.15);
         }
         50% { 
           filter: brightness(1.2) drop-shadow(0 0 18px rgba(56,189,248,0.6)) drop-shadow(0 0 36px rgba(56,189,248,0.3)) drop-shadow(0 0 54px rgba(56,189,248,0.15));
           box-shadow: 0 0 30px rgba(56,189,248,0.8), 0 0 60px rgba(56,189,248,0.4), 0 0 90px rgba(56,189,248,0.2);
         }
       }
       @keyframes mobile-glow-pulse-purple {
         0%, 100% { 
           filter: brightness(1.1) drop-shadow(0 0 12px rgba(217,70,239,0.4)) drop-shadow(0 0 24px rgba(217,70,239,0.2)) drop-shadow(0 0 36px rgba(217,70,239,0.1));
           box-shadow: 0 0 20px rgba(217,70,239,0.6), 0 0 40px rgba(217,70,239,0.3), 0 0 60px rgba(217,70,239,0.15);
         }
         50% { 
           filter: brightness(1.2) drop-shadow(0 0 18px rgba(217,70,239,0.6)) drop-shadow(0 0 36px rgba(217,70,239,0.3)) drop-shadow(0 0 54px rgba(217,70,239,0.15));
           box-shadow: 0 0 30px rgba(217,70,239,0.8), 0 0 60px rgba(217,70,239,0.4), 0 0 90px rgba(217,70,239,0.2);
         }
       }
       
       /* Apply breathing in-out animation to all button colors */
       .shadow-sky-900\/30{animation:breathe-in-out-blue 3s ease-in-out infinite}
       .shadow-fuchsia-900\/30{animation:breathe-in-out-purple 3s ease-in-out infinite}
       .shadow-green-900\/30{animation:breathe-in-out-green 3s ease-in-out infinite}
       
       /* Enhanced animation on hover */
       .group:hover .shadow-sky-900\/30{animation:bright-glow-pulse 2s ease-in-out infinite}
       .group:hover .shadow-fuchsia-900\/30{animation:bright-glow-pulse-purple 2s ease-in-out infinite}
       .group:hover .shadow-green-900\/30{animation:bright-glow-pulse-green 2s ease-in-out infinite}
       
       /* Permanent glow effects for button elements */
       .hero-slice{box-shadow:0 0 10px rgba(56,189,248,0.3),0 0 20px rgba(56,189,248,0.15),inset 0 0 10px rgba(56,189,248,0.05)}
       .hero-purple{box-shadow:0 0 10px rgba(217,70,239,0.3),0 0 20px rgba(217,70,239,0.15),inset 0 0 10px rgba(217,70,239,0.05)}
       .hero-green{box-shadow:0 0 10px rgba(34,197,94,0.3),0 0 20px rgba(34,197,94,0.15),inset 0 0 10px rgba(34,197,94,0.05)}
       
       /* Additional bright light effects on hover */
       .group:hover{transform:translateY(-2px)}
       .group:hover .hero-slice{box-shadow:0 0 20px rgba(56,189,248,0.6),0 0 40px rgba(56,189,248,0.3),inset 0 0 20px rgba(56,189,248,0.1)}
       .group:hover .hero-purple{box-shadow:0 0 20px rgba(217,70,239,0.6),0 0 40px rgba(217,70,239,0.3),inset 0 0 20px rgba(217,70,239,0.1)}
       .group:hover .hero-green{box-shadow:0 0 20px rgba(34,197,94,0.6),0 0 40px rgba(34,197,94,0.3),inset 0 0 20px rgba(34,197,94,0.1)}
      /* Adopt login page glow button visuals */
      .glow-btn-container{position:relative;display:inline-block;padding:3px;border-radius:.9em;background:linear-gradient(90deg,#03a9f4,#f441a5);transition:all .4s ease;align-self:center;z-index:0;isolation:isolate}
      .glow-btn-container::before{content:"";position:absolute;inset:0;border-radius:inherit;background:linear-gradient(90deg,#03a9f4,#f441a5);filter:blur(0);opacity:0;transition:opacity .4s ease,filter .4s ease;z-index:-1;pointer-events:none}
      .glow-btn-container:hover::before{opacity:1;filter:blur(1.2em)}
      .glow-btn-container button{font-size:1em;font-weight:600;padding:.8em 1.2em;border-radius:.7em;border:none;background:#111;color:#fff;cursor:pointer;box-shadow:2px 2px 4px #00000080;transition:transform .2s ease}
      .glow-btn-container button:focus-visible{outline:none;box-shadow:0 0 0 3px rgba(64,201,255,.35),2px 2px 4px #00000080}
      .glow-btn-container button:active{transform:scale(.95)}
       @media (max-width:640px){
         .balance-mobile{text-wrap:balance;text-align:center}
         /* Ensure proper text alignment on mobile */
         .mobile-text-center{text-align:center;margin:0 auto}
         
         /* Enhanced glow effects for mobile screens */
         .shadow-sky-900\/30{box-shadow:0 0 20px rgba(56,189,248,0.6),0 0 40px rgba(56,189,248,0.3),0 0 60px rgba(56,189,248,0.15),0 15px 30px -4px rgba(56,189,248,0.4)}
         .shadow-fuchsia-900\/30{box-shadow:0 0 20px rgba(217,70,239,0.6),0 0 40px rgba(217,70,239,0.3),0 0 60px rgba(217,70,239,0.15),0 15px 30px -4px rgba(217,70,239,0.4)}
         
         /* Enhanced mobile button glow */
         .hero-slice{box-shadow:0 0 15px rgba(56,189,248,0.4),0 0 30px rgba(56,189,248,0.2),inset 0 0 15px rgba(56,189,248,0.1)}
         .hero-purple{box-shadow:0 0 15px rgba(217,70,239,0.4),0 0 30px rgba(217,70,239,0.2),inset 0 0 15px rgba(217,70,239,0.1)}
         
         /* Mobile 3D breathing animation for both colors - ALWAYS ACTIVE */
         .shadow-sky-900\/30{animation:mobile-3d-breathe-blue 2s ease-in-out infinite !important}
         .shadow-fuchsia-900\/30{animation:mobile-3d-breathe-purple 2s ease-in-out infinite !important}
         .shadow-green-900\/30{animation:mobile-3d-breathe-green 2s ease-in-out infinite !important}
         
         /* Mobile 3D breathing animations with EXTREME scaling - always active */
         @keyframes mobile-3d-breathe-blue {
           0%, 100% { 
             transform: scale(0.8) translateZ(0) rotateX(0deg) rotateY(0deg);
             filter: brightness(0.7) drop-shadow(0 0 15px rgba(56,189,248,0.5)) drop-shadow(0 0 30px rgba(56,189,248,0.3));
             box-shadow: 0 0 25px rgba(56,189,248,0.6), 0 0 50px rgba(56,189,248,0.4), 0 0 75px rgba(56,189,248,0.2), inset 0 4px 8px rgba(0,0,0,0.7);
           }
           25% { 
             transform: scale(1.0) translateZ(10px) rotateX(5deg) rotateY(2deg);
             filter: brightness(1.0) drop-shadow(0 0 20px rgba(56,189,248,0.6)) drop-shadow(0 0 40px rgba(56,189,248,0.4));
             box-shadow: 0 5px 30px rgba(56,189,248,0.7), 0 15px 60px rgba(56,189,248,0.5), 0 25px 90px rgba(56,189,248,0.3), inset 0 6px 12px rgba(0,0,0,0.5);
           }
           50% { 
             transform: scale(1.25) translateZ(30px) rotateX(15deg) rotateY(5deg);
             filter: brightness(1.5) drop-shadow(0 0 50px rgba(56,189,248,1)) drop-shadow(0 0 100px rgba(56,189,248,0.7));
             box-shadow: 0 25px 80px rgba(56,189,248,1), 0 50px 160px rgba(56,189,248,0.8), 0 75px 200px rgba(56,189,248,0.5), inset 0 12px 24px rgba(0,0,0,0.3);
           }
           75% { 
             transform: scale(1.0) translateZ(10px) rotateX(5deg) rotateY(2deg);
             filter: brightness(1.0) drop-shadow(0 0 20px rgba(56,189,248,0.6)) drop-shadow(0 0 40px rgba(56,189,248,0.4));
             box-shadow: 0 5px 30px rgba(56,189,248,0.7), 0 15px 60px rgba(56,189,248,0.5), 0 25px 90px rgba(56,189,248,0.3), inset 0 6px 12px rgba(0,0,0,0.5);
           }
         }
         
         @keyframes mobile-3d-breathe-purple {
           0%, 100% { 
             transform: scale(0.8) translateZ(0) rotateX(0deg) rotateY(0deg);
             filter: brightness(0.7) drop-shadow(0 0 15px rgba(217,70,239,0.5)) drop-shadow(0 0 30px rgba(217,70,239,0.3));
             box-shadow: 0 0 25px rgba(217,70,239,0.6), 0 0 50px rgba(217,70,239,0.4), 0 0 75px rgba(217,70,239,0.2), inset 0 4px 8px rgba(0,0,0,0.7);
           }
           25% { 
             transform: scale(1.0) translateZ(10px) rotateX(5deg) rotateY(2deg);
             filter: brightness(1.0) drop-shadow(0 0 20px rgba(217,70,239,0.6)) drop-shadow(0 0 40px rgba(217,70,239,0.4));
             box-shadow: 0 5px 30px rgba(217,70,239,0.7), 0 15px 60px rgba(217,70,239,0.5), 0 25px 90px rgba(217,70,239,0.3), inset 0 6px 12px rgba(0,0,0,0.5);
           }
           50% { 
             transform: scale(1.25) translateZ(30px) rotateX(15deg) rotateY(5deg);
             filter: brightness(1.5) drop-shadow(0 0 50px rgba(217,70,239,1)) drop-shadow(0 0 100px rgba(217,70,239,0.7));
             box-shadow: 0 25px 80px rgba(217,70,239,1), 0 50px 160px rgba(217,70,239,0.8), 0 75px 200px rgba(217,70,239,0.5), inset 0 12px 24px rgba(0,0,0,0.3);
           }
           75% { 
             transform: scale(1.0) translateZ(10px) rotateX(5deg) rotateY(2deg);
             filter: brightness(1.0) drop-shadow(0 0 20px rgba(217,70,239,0.6)) drop-shadow(0 0 40px rgba(217,70,239,0.4));
             box-shadow: 0 5px 30px rgba(217,70,239,0.7), 0 15px 60px rgba(217,70,239,0.5), 0 25px 90px rgba(217,70,239,0.3), inset 0 6px 12px rgba(0,0,0,0.5);
           }
         }
         
         @keyframes mobile-3d-breathe-green {
           0%, 100% { 
             transform: scale(0.8) translateZ(0) rotateX(0deg) rotateY(0deg);
             filter: brightness(0.7) drop-shadow(0 0 15px rgba(34,197,94,0.5)) drop-shadow(0 0 30px rgba(34,197,94,0.3));
             box-shadow: 0 0 25px rgba(34,197,94,0.6), 0 0 50px rgba(34,197,94,0.4), 0 0 75px rgba(34,197,94,0.2), inset 0 4px 8px rgba(0,0,0,0.7);
           }
           25% { 
             transform: scale(1.0) translateZ(10px) rotateX(5deg) rotateY(2deg);
             filter: brightness(1.0) drop-shadow(0 0 20px rgba(34,197,94,0.6)) drop-shadow(0 0 40px rgba(34,197,94,0.4));
             box-shadow: 0 5px 30px rgba(34,197,94,0.7), 0 15px 60px rgba(34,197,94,0.5), 0 25px 90px rgba(34,197,94,0.3), inset 0 6px 12px rgba(0,0,0,0.5);
           }
           50% { 
             transform: scale(1.25) translateZ(30px) rotateX(15deg) rotateY(5deg);
             filter: brightness(1.5) drop-shadow(0 0 50px rgba(34,197,94,1)) drop-shadow(0 0 100px rgba(34,197,94,0.7));
             box-shadow: 0 25px 80px rgba(34,197,94,1), 0 50px 160px rgba(34,197,94,0.8), 0 75px 200px rgba(34,197,94,0.5), inset 0 12px 24px rgba(0,0,0,0.3);
           }
           75% { 
             transform: scale(1.0) translateZ(10px) rotateX(5deg) rotateY(2deg);
             filter: brightness(1.0) drop-shadow(0 0 20px rgba(34,197,94,0.6)) drop-shadow(0 0 40px rgba(34,197,94,0.4));
             box-shadow: 0 5px 30px rgba(34,197,94,0.7), 0 15px 60px rgba(34,197,94,0.5), 0 25px 90px rgba(34,197,94,0.3), inset 0 6px 12px rgba(0,0,0,0.5);
           }
         }
       }
      
      `}</style>
    </div>
  )
}


