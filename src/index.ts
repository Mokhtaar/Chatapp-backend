import express, { Request, Response } from "express";
import cors from "cors";
import morgan from "morgan";
import helmet from "helmet";
import { json } from "express";
import { urlencoded } from "express";
import { config } from "dotenv";
import { AppDataSource } from "./db/data-source";
import userRouter from './routes/user'
import messageRouter from './routes/message'
import convRouter from './routes/conversation'
import { Server as SocketServer} from "socket.io";
import http from 'http'

const app = express();
config();
app.use(cors());
app.use(morgan("dev"));
app.use(helmet());
app.use(json());
app.use(urlencoded({ extended: false }));
app.use('/users',userRouter)
app.use('/messages',messageRouter)
app.use('/conversations',convRouter)


app.get('*',(req:Request,res:Response)=>{
  res.status(404).json({message:'Api not found!'})
})

const httpServer=http.createServer(app)
const socketServer=new SocketServer(httpServer,{
  cors:{
    origin:'http://localhost:3000',
    methods:['GET','POST']
  }
})

socketServer.on('connection',(socket)=>{
  console.log(`user: ${socket.id} connected to database`)



  socket.on('join_conversation',(conversation_id)=>{
    console.log(`User ${socket.id} join to Room ${conversation_id}`)
    socket.join(conversation_id)
  })

  socket.on('send_message',(message)=>{
    socketServer.to((message.conversation.id).toString()).emit('recieve_message',{message,socketId:socket.id})
  })

  socket.on('disconnect',()=>{
    console.log(`user: ${socket.id} connected to database`)
  })

})


httpServer.listen(process.env.PORT, async () => {
  await AppDataSource.initialize();
  console.log(`listening on port ${process.env.PORT}`);
});
