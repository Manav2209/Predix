interface BidsTableProps {
    bids: { price: number; quantity: number }[];
    outcome: "YES" | "NO";
  }
  
  export const BidTable = ({ bids, outcome }: BidsTableProps) => {
    
    let currentTotal = 0;
    const relevantBids = bids.slice(0, 5);
    
    
    let bidsWithTotal: [number, number, number][] = [];
    for (let i = 0; i < relevantBids.length; i++) {
      const bid = relevantBids[i];
      if (bid) {
        const { price, quantity } = bid;
        bidsWithTotal.push([price, quantity, (currentTotal += Number(quantity))]);
      }
    }
    
    const maxTotal = relevantBids.reduce(
      (acc, bid) => acc + Number(bid.quantity),
      0
    );
  
    return (
      <div>
        {bidsWithTotal.map(([price, quantity, total]) => (
          <Bid
            maxTotal={maxTotal}
            key={price}
            price={price.toString()}
            quantity={quantity.toString()}
            total={total}
            outcome={outcome}
          />
        ))}
      </div>
    );
  };
  
  function Bid({
    price,
    quantity,
    total,
    maxTotal,
    outcome,
  }: {
    price: string;
    quantity: string;
    total: number;
    maxTotal: number;
    outcome: "YES" | "NO";
  }) {
    console.log("bid price", price);
    return (
      <div
        style={{
          display: "flex",
          position: "relative",
          width: "100%",
          backgroundColor: "transparent",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: `${(100 * total) / maxTotal}%`,
            height: "100%",
            background:
              outcome === "YES"
                ? "rgba(1, 167, 129, 0.325)"
                : "rgba(220, 38, 127, 0.325)",
            transition: "width 0.3s ease-in-out",
          }}
        ></div>
        <div className="flex justify-between text-sm w-full text-black mb-2 border-gray-300 border-t-1">
          <div className="items-center justify-center flex px-3 font-bold">{price}</div>
          <div className="items-center justify-center flex px-3 font-bold">{quantity}</div>
        </div>
      </div>
    );
  }