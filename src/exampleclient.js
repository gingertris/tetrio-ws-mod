const ws = require("ws")
const client = new ws.WebSocket("ws://localhost:31462");
client.on("open", ()=>{
    console.log("connected to server")
})
client.on("message", msg => {
    console.log(JSON.parse(msg))
})