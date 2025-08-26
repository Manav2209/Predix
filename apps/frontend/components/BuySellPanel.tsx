"use client";
import { useEffect, useState } from "react";
import { Minus, Plus } from "lucide-react";
import { Button } from "./ui/button";
import { TEvent } from "@/lib/types";
import { API_URL } from "@/lib/config";
import axios from "axios";
import { toast } from "sonner";

interface BuySellPanelProps {
  event: TEvent;
  onOrderPlaced?: () => void; // Callback to refresh orderbook
}

export const BuySellPanel = ({ event, onOrderPlaced }: BuySellPanelProps) => {
  const [selectedOption, setSelectedOption] = useState<"yes" | "no">("yes");
  const [yesPrice, setYesPrice] = useState<number>(Number(event.yesPrice));
  const [yesQuantity, setYesQuantity] = useState(1);
  const [noPrice, setNoPrice] = useState<number>(Number(event.noPrice));
  const [noQuantity, setNoQuantity] = useState(1);
  const price = selectedOption === "yes" ? yesPrice : noPrice;
  const quantity = selectedOption === "yes" ? yesQuantity : noQuantity;
  const [token, setToken] = useState<string | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);

  useEffect(() => {
    const tokenFromStorage = localStorage.getItem("token");
    setToken(tokenFromStorage);
    setIsLoggedIn(!!tokenFromStorage);
  }, []);

  const handlePriceChange = (delta: number) => {
    if (selectedOption === "yes") {
      setYesPrice(Math.max(0.1, Math.round((yesPrice + delta) * 10) / 10));
    } else {
      setNoPrice(Math.max(0.1, Math.round((noPrice + delta) * 10) / 10));
    }
  };

  const handleQuantityChange = (delta: number) => {
    if (selectedOption === "yes") {
      setYesQuantity(Math.max(1, yesQuantity + delta));
    } else {
      setNoQuantity(Math.max(1, noQuantity + delta));
    }
  };

  const totalInvestment = price * quantity;
  const potentialReturn = quantity * 10; // Assuming 10 is max return per unit

  const handlePlaceOrder = async () => {
    if (!isLoggedIn) {
      toast.error("Please sign in to place order");
      return;
    }

    setIsPlacingOrder(true);
    
    try {
      const orderData = {
        eventId: event.id,
        orderType: "LIMIT",
        outcome: selectedOption.toUpperCase(),
        side: "BUY",
        quantity: selectedOption === "yes" ? yesQuantity : noQuantity,
        price: selectedOption === "yes" ? yesPrice : noPrice,
      };

      console.log("Placing order with data:", orderData);

      const res = await axios.post(
        `${API_URL}/order`,
        orderData,
        {
          headers: {
            Authorization: `${localStorage.getItem("token")}`,
          },
        }
      );

      console.log("Order response:", res.data);

      // Check multiple possible success indicators
      if (res.status === 200 || res.status === 201 || res.data.success === true || res.data.status === "success" || res.data) {
        toast.success("Order placed successfully!");
        
        // Reset form or keep current values based on your preference
        // setYesQuantity(1);
        // setNoQuantity(1);
        
        // Trigger orderbook refresh
        if (onOrderPlaced) {
          onOrderPlaced();
        }
        
        // Additional refresh after a short delay to ensure backend processing
        setTimeout(() => {
          if (onOrderPlaced) {
            onOrderPlaced();
          }
        }, 1000);
        
      } else {
        console.error("Order failed with response:", res.data);
        toast.error(res.data.message || "Failed to place order");
      }

    } catch (err: any) {
      console.error("Error placing order:", err);
      
      // Check if it's actually a successful response disguised as an error
      if (err.response?.status === 200 || err.response?.status === 201) {
        toast.success("Order placed successfully!");
        if (onOrderPlaced) {
          onOrderPlaced();
        }
      } else {
        const errorMessage = err.response?.data?.message || err.message || "Failed to place order";
        toast.error(errorMessage);
      }
    } finally {
      setIsPlacingOrder(false);
    }
  };

  return (
    <div className="lg:col-span-1">
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="grid grid-cols-2 gap-4 mb-6">
          <Button
            className={`${
              selectedOption === "yes"
                ? "bg-black  text-white"
                : "bg-gray-200 hover:bg-gray-200 text-gray-700"
            }`}
            onClick={() => setSelectedOption("yes")}
          >
            Yes ₹{yesPrice}
          </Button>
          <Button
            variant={selectedOption === "no" ? "default" : "outline"}
            className={`${
              selectedOption === "no"
                ? "bg-black  text-white "
                : "border-none bg-gray-200 text-gray-700 hover:bg-gray-200"
            }`}
            onClick={() => setSelectedOption("no")}
          >
            No ₹{noPrice}
          </Button>
        </div>

        <div className="space-y-6">
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="font-medium">Price</div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8 rounded-full"
                  onClick={() => handlePriceChange(-0.1)}
                  disabled={isPlacingOrder}
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <span className="font-bold text-lg">₹{price.toFixed(1)}</span>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8 rounded-full"
                  onClick={() => handlePriceChange(0.1)}
                  disabled={isPlacingOrder}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div className="text-xs text-gray-500">1424211 qty available</div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1">
                <span className="font-medium">Quantity</span>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-gray-400"
                >
                  <circle cx="12" cy="12" r="10"></circle>
                  <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path>
                  <path d="M12 17h.01"></path>
                </svg>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8 rounded-full"
                  onClick={() => handleQuantityChange(-1)}
                  disabled={isPlacingOrder}
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <span className="font-bold text-lg">{quantity}</span>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8 rounded-full"
                  onClick={() => handleQuantityChange(1)}
                  disabled={isPlacingOrder}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 py-4">
            <div className="text-center">
              <div className="text-lg font-bold text-gray-900">
                ₹{totalInvestment.toFixed(1)}
              </div>
              <div className="text-sm text-gray-500">You put</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-green-600">
                ₹{potentialReturn.toFixed(1)}
              </div>
              <div className="text-sm text-gray-500">You get</div>
            </div>
          </div>

          <Button
            disabled={!isLoggedIn || isPlacingOrder}
            className="w-full text-white bg-black hover:bg-black/90"
            onClick={handlePlaceOrder}
          >
            {isPlacingOrder 
              ? "Placing order..." 
              : !isLoggedIn 
                ? "Sign in to place order" 
                : "Place order"
            }
          </Button>
        </div>
      </div>
    </div>
  );
};