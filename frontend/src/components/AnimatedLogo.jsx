import React from "react";

export const AnimatedLogo = ({ className = "", textColor = "text-foreground" }) => {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <style>
        {`
          .butterfly {
            width: 50px;
            height: 50px;
            animation: fly 4s ease-in-out infinite;
          }

          .left-wing, .right-wing {
            transform-origin: 10px 10px;
          }

          .left-wing {
            animation: flap-left 0.4s ease-in-out infinite alternate;
          }

          .right-wing {
            animation: flap-right 0.4s ease-in-out infinite alternate;
          }

          @keyframes flap-left {
            from {
              transform: rotate(0deg);
            }
            to {
              transform: rotate(-25deg);
            }
          }

          @keyframes flap-right {
            from {
              transform: rotate(0deg);
            }
            to {
              transform: rotate(25deg);
            }
          }

          @keyframes fly {
            0%, 100% {
              transform: translateY(0px) rotate(5deg);
            }
            50% {
              transform: translateY(-5px) rotate(-5deg);
            }
          }
        `}
      </style>
      <div className="butterfly-container">
        <svg
          className="butterfly"
          viewBox="0 0 20 20"
          xmlns="http://www.w3.org/2000/svg"
        >
          <style type="text/css">
            {`
              .st0{fill:#4D629A;}
              .st1{fill:#2F4977;}
              .st2{fill:#00A096;}
              .st3{fill:#08877A;}
              .st4{fill:#89BF4A;}
              .st5{fill:#8F5398;}
              .st6{fill:#75387F;}
              .st7{fill:#E16136;}
              .st8{fill:#C34727;}
              .st9{fill:#F3BE33;}
            `}
          </style>

          {/* Right Wing */}
          <g className="right-wing">
            <path
              className="st0"
              d="M12.7,16.16c-2.36-2.36-2.64-6.14-2.64-6.14s3.98,0.48,6.14,2.64c1.27,1.28,1.52,3.09,0.56,4.06
S13.97,17.43,12.7,16.16z"
            />
            <path
              className="st1"
              d="M10.06,10.03c0,0,1.91,2.77,6.57,3.13c-0.25-0.33-0.52-0.63-0.83-0.9L10.06,10.03z"
            />
            <path
              className="st2"
              d="M16.26,12.5c-3.34,0-6.2-2.48-6.2-2.48s3.16-2.48,6.2-2.48c1.8,0,3.26,1.11,3.26,2.48S18.07,12.5,16.26,12.5z"
            />
            <path
              className="st3"
              d="M10.06,10.03c0,0,3.63,0.39,7.07-2.39c0,0-0.34-0.13-1.51-0.09L10.06,10.03z"
            />
            <path
              className="st4"
              d="M16.19,7.39c-2.36,2.36-6.14,2.64-6.14,2.64s0.48-3.99,2.64-6.14c1.27-1.27,3.09-1.52,4.05-0.56
S17.47,6.12,16.19,7.39z"
            />
          </g>

          {/* Left Wing */}
          <g className="left-wing">
            <path
              className="st5"
              d="M7.3,16.11c2.36-2.36,2.64-6.14,2.64-6.14s-3.98,0.48-6.14,2.64c-1.27,1.27-1.52,3.09-0.56,4.06
S6.03,17.39,7.3,16.11z"
            />
            <path
              className="st6"
              d="M9.94,9.98c0,0-1.91,2.77-6.57,3.13c0.25-0.33,0.52-0.63,0.83-0.9L9.94,9.98z"
            />
            <path
              className="st7"
              d="M3.74,12.45c3.34,0,6.2-2.48,6.2-2.48S6.78,7.5,3.74,7.5c-1.8,0-3.26,1.11-3.26,2.47S1.93,12.45,3.74,12.45z"
            />
            <path
              className="st8"
              d="M9.94,9.98c0,0-3.63,0.39-7.07-2.39c0,0,0.34-0.13,1.51-0.09L9.94,9.98z"
            />
            <path
              className="st9"
              d="M3.81,7.34c2.36,2.36,6.14,2.64,6.14,2.64S9.46,6,7.3,3.84C6.03,2.57,4.21,2.32,3.25,3.29S2.53,6.07,3.81,7.34z"
            />
          </g>
        </svg>
      </div>
      <span className={`font-bold text-xl ${textColor}`} style={{ fontFamily: "'Exo 2', sans-serif" }}>
        DIOCREATIONS
      </span>
    </div>
  );
};

export default AnimatedLogo;
