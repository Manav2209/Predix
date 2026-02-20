"use client";

import { SignalingManager } from "@/lib/SignalingManager";
import { useEffect } from "react";

export function useEventWS(eventId: string) {

    useEffect(()=>{

    const manager = SignalingManager.getInstance();

    console.log("Subscribing event WS:",eventId);

    manager.sendMessage({
        method:"SUBSCRIBE",
        params:[
        `depth@${eventId}`,
        `trades@${eventId}`
        ]
    });

    return ()=>{

        console.log("Unsubscribing event WS:",eventId);

        manager.sendMessage({
        method:"UNSUBSCRIBE",
        params:[
            `depth@${eventId}`,
            `trades@${eventId}`
        ]
        
    })
    }

    },[eventId]);

}