import { WebSocketServer } from 'ws';
import { UserManager } from "./UserManager";

const wss = new WebSocketServer({ port: 8080 });

wss.on("connection", (ws : WebSocket ) => {
    UserManager.getInstance().addUser(ws);
});
