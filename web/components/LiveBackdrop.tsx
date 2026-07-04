"use client";

// Apex — SpaceX black/white. Star-field warp streaks radiating from
// centre, faint tower silhouette rising, ambient hum of tiny stars.

export function LiveBackdrop() {
  return (
    <div aria-hidden className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
      <div className="apx-void" />
      <div className="apx-stars">
        {Array.from({ length: 40 }).map((_, i) => (
          <span key={i} className={`apx-star apx-s${i % 20}`} />
        ))}
      </div>
      <div className="apx-warp">
        {Array.from({ length: 18 }).map((_, i) => (
          <span key={i} className={`apx-streak apx-w${i}`} />
        ))}
      </div>
      <div className="apx-tower" />
      <div className="apx-horizon" />

      <style jsx>{`
        .apx-void {
          position: absolute; inset: 0;
          background:
            radial-gradient(ellipse 80% 100% at 50% 50%,
              rgba(30, 40, 60, 0.15) 0%, transparent 60%),
            radial-gradient(ellipse 60% 40% at 50% 0%,
              rgba(80, 100, 140, 0.08) 0%, transparent 55%);
        }

        .apx-stars { position: absolute; inset: 0; }
        .apx-star {
          position: absolute;
          width: 1px; height: 1px;
          background: white;
          border-radius: 50%;
          animation: apxTwinkle ease-in-out infinite;
        }
        @keyframes apxTwinkle {
          0%, 100% { opacity: 0.2; }
          50%       { opacity: 0.9; }
        }
        .apx-s0  { top:  5%; left: 12%; animation-duration: 3s;  animation-delay: 0s;   }
        .apx-s1  { top:  9%; left: 34%; animation-duration: 4s;  animation-delay: 1s;   }
        .apx-s2  { top: 14%; left: 58%; animation-duration: 5s;  animation-delay: 2s;   }
        .apx-s3  { top: 18%; left: 78%; animation-duration: 3.5s; animation-delay: 0.5s; }
        .apx-s4  { top: 22%; left: 22%; animation-duration: 4.5s; animation-delay: 1.5s; }
        .apx-s5  { top: 27%; left: 46%; animation-duration: 3s;  animation-delay: 3s;   }
        .apx-s6  { top: 33%; left: 68%; animation-duration: 5s;  animation-delay: 0s;   }
        .apx-s7  { top: 38%; left: 86%; animation-duration: 4s;  animation-delay: 2s;   }
        .apx-s8  { top: 44%; left: 14%; animation-duration: 3.5s; animation-delay: 1s;   }
        .apx-s9  { top: 50%; left: 40%; animation-duration: 4.5s; animation-delay: 2.5s; }
        .apx-s10 { top: 55%; left: 62%; animation-duration: 3s;  animation-delay: 0.5s; }
        .apx-s11 { top: 60%; left: 82%; animation-duration: 5s;  animation-delay: 3s;   }
        .apx-s12 { top: 66%; left: 26%; animation-duration: 4s;  animation-delay: 1.5s; }
        .apx-s13 { top: 72%; left: 50%; animation-duration: 3.5s; animation-delay: 0s;   }
        .apx-s14 { top: 77%; left: 72%; animation-duration: 4.5s; animation-delay: 2s;   }
        .apx-s15 { top: 83%; left: 90%; animation-duration: 3s;  animation-delay: 1s;   }
        .apx-s16 { top: 88%; left: 18%; animation-duration: 5s;  animation-delay: 2.5s; }
        .apx-s17 { top: 92%; left: 44%; animation-duration: 4s;  animation-delay: 0.5s; }
        .apx-s18 { top: 96%; left: 64%; animation-duration: 3.5s; animation-delay: 3s;   }
        .apx-s19 { top: 98%; left: 88%; animation-duration: 4.5s; animation-delay: 1.5s; }

        .apx-warp {
          position: absolute; inset: 0;
          display: flex; align-items: center; justify-content: center;
        }
        .apx-streak {
          position: absolute;
          left: 50%; top: 50%;
          width: 2px; height: 60px;
          background: linear-gradient(to bottom,
            transparent 0%,
            rgba(255,255,255,0.6) 50%,
            transparent 100%);
          transform-origin: center bottom;
          animation: apxWarpFly linear infinite;
          will-change: transform, opacity;
        }
        @keyframes apxWarpFly {
          0%   { transform: rotate(var(--a, 0deg)) translateY(0)      scaleY(0.4); opacity: 0;   }
          20%  { opacity: 0.8; }
          100% { transform: rotate(var(--a, 0deg)) translateY(-100vh) scaleY(1);   opacity: 0;   }
        }
        .apx-w0  { --a:   0deg; animation-duration: 4s; animation-delay: 0s;   }
        .apx-w1  { --a:  20deg; animation-duration: 5s; animation-delay: 0.4s; }
        .apx-w2  { --a:  40deg; animation-duration: 6s; animation-delay: 0.8s; }
        .apx-w3  { --a:  60deg; animation-duration: 4s; animation-delay: 1.2s; }
        .apx-w4  { --a:  80deg; animation-duration: 5s; animation-delay: 1.6s; }
        .apx-w5  { --a: 100deg; animation-duration: 6s; animation-delay: 2s;   }
        .apx-w6  { --a: 120deg; animation-duration: 4s; animation-delay: 2.4s; }
        .apx-w7  { --a: 140deg; animation-duration: 5s; animation-delay: 2.8s; }
        .apx-w8  { --a: 160deg; animation-duration: 6s; animation-delay: 3.2s; }
        .apx-w9  { --a: 180deg; animation-duration: 4s; animation-delay: 3.6s; }
        .apx-w10 { --a: 200deg; animation-duration: 5s; animation-delay: 0.2s; }
        .apx-w11 { --a: 220deg; animation-duration: 6s; animation-delay: 0.6s; }
        .apx-w12 { --a: 240deg; animation-duration: 4s; animation-delay: 1s;   }
        .apx-w13 { --a: 260deg; animation-duration: 5s; animation-delay: 1.4s; }
        .apx-w14 { --a: 280deg; animation-duration: 6s; animation-delay: 1.8s; }
        .apx-w15 { --a: 300deg; animation-duration: 4s; animation-delay: 2.2s; }
        .apx-w16 { --a: 320deg; animation-duration: 5s; animation-delay: 2.6s; }
        .apx-w17 { --a: 340deg; animation-duration: 6s; animation-delay: 3s;   }

        .apx-tower {
          position: absolute; bottom: 0; left: 50%;
          transform: translateX(-50%);
          width: 4px; height: 40vh;
          background: linear-gradient(to top,
            rgba(180, 200, 230, 0.15) 0%,
            rgba(180, 200, 230, 0.05) 60%,
            transparent 100%);
          box-shadow: 0 0 24px rgba(200,220,255,0.08);
          animation: apxHum 6s ease-in-out infinite;
        }
        @keyframes apxHum {
          0%, 100% { opacity: 0.35; }
          50%       { opacity: 0.6;  }
        }

        .apx-horizon {
          position: absolute; bottom: 0; left: 0; right: 0;
          height: 30vh;
          background: linear-gradient(to top,
            rgba(0, 0, 0, 0.5) 0%,
            transparent 100%);
        }

        @media (prefers-reduced-motion: reduce) {
          .apx-star, .apx-streak, .apx-tower { animation: none !important; }
        }
      `}</style>
    </div>
  );
}
