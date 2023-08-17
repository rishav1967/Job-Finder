import express from "express";
const app = express()

import dotenv from 'dotenv'
dotenv.config()
import 'express-async-errors'
//db authentication
import connectDB from "./db/connect.js";
//morgan
import morgan from "morgan";
//routers
import authRouter from './routes/authRoutes.js'
import jobsRouter from './routes/jobsRoutes.js'

//404 not found middleware
import notFoundMiddleware from './middleware/not-found.js'
import errorHandlerMiddleware from "./middleware/error-handler.js";
import authenticateUser from './middleware/auth.js'

//import cors from 'cors'
//app.use(cors()) //for proxies i.e to get data of backend to frontend
if (process.env.NODE_ENV !== 'production') {//morgan http login middleware
    app.use(morgan('dev'))
}
app.use(express.json())//https://www.geeksforgeeks.org/express-js-express-json-function/
//console.log('hello')

app.get('/', (req, res) => {
    //throw new Error('error')
    res.json({ msg: 'Welcome' })
})
app.get('/api/v1', (req, res) => {
    //throw new Error('error')
    res.json({ msg: 'API' })
})
app.use('/api/v1/auth', authRouter)
app.use('/api/v1/jobs', authenticateUser, jobsRouter)
app.use(notFoundMiddleware)
app.use(errorHandlerMiddleware)
const port = process.env.PORT || 5000

const start = async () => {
    try {
        await connectDB(process.env.MONGO_URL)//MONGO_URL is in .env
        app.listen(port, () => {
            console.log(`server is lisnening ${port}`)
        })
    } catch (error) {
        console.log(error)
    }
}
start()