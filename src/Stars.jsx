export default function Stars({ count = 200 }) {
    const stars = Array.from({ length: count }).map(() => ({
      top: Math.random() * 100 + "%",
      left: Math.random() * 100 + "%",
      size: Math.random() * 2 + 1 + "px",
      delay: Math.random() * 2 + "s",
    }));
  
    return (
      <div className="stars">
        {stars.map((s, i) => (
          <div
            key={i}
            className="star"
            style={{ top: s.top, left: s.left, width: s.size, height: s.size, animationDelay: s.delay }}
          />
        ))}
      </div>
    );
  }
  