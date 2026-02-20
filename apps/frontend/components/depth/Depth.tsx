"use client";
import { getDepth } from "@/lib/http";
import { TEvent } from "@/lib/types";
import { useEffect, useState } from "react";
import { SignalingManager } from "@/lib/SignalingManager";
import { AskTable } from "./AskTable";
import { BidTable } from "./BidsTable";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Book, ChartCandlestick } from "lucide-react";
import { Trade } from "../Trade";

interface DepthProps {
  event: TEvent;
}

export const Depth = ({ event }: DepthProps) => {
  const [Yesbids, setYesBids] = useState<{ price: number; quantity: number }[]>(
    []
  );
  const [Yesasks, setYesAsks] = useState<{ price: number; quantity: number }[]>(
    []
  );
  const [Nobids, setNoBids] = useState<{ price: number; quantity: number }[]>(
    []
  );
  const [Noasks, setNoAsks] = useState<{ price: number; quantity: number }[]>(
    []
  );
  useEffect(() => {

    const manager = SignalingManager.getInstance();
    manager.registerCallback("depth",(data:any)=>{

        console.log("Depth update");
        setYesBids(prev => {
          const updated=[...prev];
          data.yesbids.forEach((bid:any)=>{
            const index=updated.findIndex(
              b=>b.price===bid.price
            )
            if(bid.quantity===0){
              if(index!==-1){
                updated.splice(index,1);
              }
            }else{

              if(index!==-1){
                updated[index].quantity=bid.quantity;
              }else{
                updated.push(bid);
              }
            }
          });

          updated.sort((a,b)=>b.price-a.price);
          return updated;

        });
        setNoBids(prev => {
          const updated=[...prev];
          data.nobids.forEach((bid:any)=>{

            const index=updated.findIndex(
              b=>b.price===bid.price
            );

            if(bid.quantity===0){

              if(index!==-1){
                updated.splice(index,1);
              }

            }else{
              if(index!==-1){
                updated[index].quantity=bid.quantity;
              }else{
                updated.push(bid);
              }
            }
          });
          updated.sort((a,b)=>b.price-a.price);
          return updated;
        });
        setYesAsks(prev=>{
          const updated=[...prev];
          data.yesasks.forEach((ask:any)=>{
            const index=updated.findIndex(
              a=>a.price===ask.price
            );
            if(ask.quantity===0){
              if(index!==-1){
                updated.splice(index,1);
              }
            }else{
              if(index!==-1){
                updated[index].quantity=ask.quantity;
              }else{
                updated.push(ask);
              }
            }
          });
          updated.sort((a,b)=>a.price-b.price);
          return updated;
        });
        setNoAsks(prev=>{

          const updated=[...prev];
          data.noasks.forEach((ask:any)=>{
            const index=updated.findIndex(
              a=>a.price===ask.price
            );
            if(ask.quantity===0){
              if(index!==-1){
                updated.splice(index,1);
              }
            }else{
              if(index!==-1){
                updated[index].quantity=ask.quantity;
              }else{
                updated.push(ask);
              }
            }

          });
          updated.sort((a,b)=>a.price-b.price);
          return updated;
        });
      },
      `DEPTH@${event.id}`
    );

    getDepth(event.id).then((d)=>{

      setYesBids(d.YES.bids.reverse());
      setYesAsks(d.YES.asks);
      setNoBids(d.NO.bids.reverse());
      setNoAsks(d.NO.asks);
  
    });
    return ()=>{
      manager.deRegisterCallback(
        "depth",
        `DEPTH@${event.id}`
      );
    }},[event.id]);

  return (
    <div className="bg-white border border-gray-200 p-6 rounded-2xl">
      <Tabs defaultValue="orderbook" className="mb-6">
        <TabsList className="border-gray-200 w-1/10 justify-start p-1 bg-gray-200 rounded-lg">
          <TabsTrigger
            value="orderbook"
            className="cursor-pointer text-black border-0 rounded-lg border-gray-200  data-[state=active]:text-white data-[state=active]:border-b-2 data-[state=active]:bg-gray-500 data-[state=active]:shadow-none px-1 py-2 text-sm font-thin"
          >
            <Book />
          </TabsTrigger>
          <TabsTrigger
            value="trade"
            className="rounded-lg cursor-pointer text-black border-0 border-gray-200 data-[state=active]:text-white data-[state=active]:border-b-2 data-[state=active]:bg-gray-500 data-[state=active]:shadow-none px-1 py-2 text-sm font-thin"
          >
            <ChartCandlestick />
          </TabsTrigger>
        </TabsList>
        <TabsContent value="orderbook" className="mt-6">
          <div className="flex flex-1 gap-5 rounded-2xl">
            {/* YES Side */}
            <div className="flex flex-col gap-2 flex-1">
              <TableHeader outcome={"YES"} />
              <div className="mb-4">
                <div className="text-xs font-medium text-gray-600 mb-2">ASKS</div>
                <AskTable asks={Yesasks} outcome="YES" />
              </div>
              <div>
                <div className="text-xs font-medium text-gray-600 mb-2">BIDS</div>
                <BidTable bids={Yesbids} outcome="YES" />
              </div>
            </div>
            
            {/* NO Side */}
            <div className="flex flex-col gap-2 flex-1">
              <TableHeader outcome={"NO"} />
              <div className="mb-4">
                <div className="text-xs font-medium text-gray-600 mb-2">ASKS</div>
                <AskTable asks={Noasks} outcome="NO" />
              </div>
              <div>
                <div className="text-xs font-medium text-gray-600 mb-2">BIDS</div>
                <BidTable bids={Nobids} outcome="NO" />
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="trade" >
          <Trade event={event}  />
        </TabsContent>
      </Tabs>
    </div>
  );
};

function TableHeader({ outcome }: { outcome: "YES" | "NO" }) {
  return (
    <div className="flex justify-between mb-4">
      <div className="text-black text-sm font-semibold">PRICE</div>
      <div className="text-black text-sm font-light">
        QTY AT <span> </span>
        <span className={outcome === "YES" ? "text-green-600" : "text-red-600"}>
          {outcome}
        </span>
      </div>
    </div>
  );
}