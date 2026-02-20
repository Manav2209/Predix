"use client";
import { SignalingManager } from "@/lib/SignalingManager";
import { TEvent, TTrade } from "@/lib/types";
import React, { useEffect } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDate } from "@/lib/helper";

interface TradeProps {
  event: TEvent;
}

export const Trade = ({ event }: TradeProps) => {
  const [trades, setTrades] = React.useState<TTrade[]>([]);

  useEffect(()=>{

    const manager = SignalingManager.getInstance();
    const history = manager.getTradeHistory(event.id);

      if(history.length){
        setTrades(history);
      }
    manager.registerCallback(
      "trade",
      (data:any)=>{
        const newTrade={
          price:data.price,
          quantity:data.quantity,
          outcome:data.outcome,
          timestamp:data.timestamp
        };
        setTrades(prev=>[newTrade,...prev]); // newest first
      },
      `TRADES@${event.id}`
    );
    return ()=>{
      manager.deRegisterCallback(
        "trade",
        `TRADES@${event.id}`
      );
    }},
    [event.id]);

  return (
    <div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[100px]">Price</TableHead>
            <TableHead>Quantity</TableHead>
            <TableHead>OutCome</TableHead>
            <TableHead className="text-right">Time</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {trades.map((trade,index) => (
            <TradeRow key={index} trade={trade} />
          ))}
        </TableBody>
      </Table>
    </div>
  );
};


function TradeRow({ trade }: { trade: TTrade }) {
  return (
    <TableRow>
      <TableCell className="w-[100px]">{trade.price}</TableCell>
      <TableCell>{trade.quantity}</TableCell>
      <TableCell>{trade.outcome}</TableCell>
      <TableCell className="text-right">{formatDate(trade.timestamp)}</TableCell>
    </TableRow>
  );
}