import { ticker } from "@/data/homepage";

// One red marquee, visible on desktop and mobile.
export default function Ticker() {
  const sequence = `${ticker.items.join(` ${ticker.separator} `)} ${ticker.separator}`;
  return (
    <div className="ticker" aria-hidden="true">
      <div className="ticker-row ticker-row-b" style={{ display: "block", borderTop: 0 }}>
        <div>
          {sequence} {sequence}
        </div>
      </div>
    </div>
  );
}
