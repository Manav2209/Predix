import { createClient, type RedisClientType } from "redis";
import type { MessageToApi } from "./types/MessagetoAPI"

export  class RedisManager {
    private client  :RedisClientType
    private static instance : RedisManager


    constructor (){
        this.client  = createClient();
        this.client.connect();
    }
    

    public static getInstance(){
        if(!RedisManager.instance){
            RedisManager.instance = new RedisManager()
        }
        return RedisManager.instance
    }


    public sendToApi(clientId: string, message: MessageToApi) {
        this.client.publish(clientId, JSON.stringify(message));
    }

    public publishMessage(channel: string, message: WsMessage) {
        this.client.publish(channel, JSON.stringify(message));
    }
    

    public pushMessage(message: DbMessage) {
        this.client.lPush("db_processor", JSON.stringify(message));
    }
}