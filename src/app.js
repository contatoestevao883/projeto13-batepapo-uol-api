import express from 'express'
import cors from "cors"
import joi from 'joi'
import dayjs from 'dayjs' 
import dotenv from 'dotenv'
dotenv.config()
import { MongoClient, ObjectId } from "mongodb";


const app = express();
app.use(cors);
app.use(express.json());



const mongoClient = new MongoClient(process.env.DATABASE_URL);
let db;

mongoClient.connect()
	.then(() => db = mongoClient.db())
	.catch((err) => console.log(err.message))

    app.post("/participants", (req, res) => {
        const { name } = req.body

        const userSchema = joi.object({
            name: joi.string().required(),
          });

          const validation = userSchema.validate(name, { abortEarly: false })

          if (validation.error) {
            const errors = validation.error.details.map((detail) => detail.message);
            return res.status(422).send(errors);
          }
        const newName = {
            name, 
            lastStatus: Date.now()
        }
        db.collection("participants").insertOne(newName)
        
        const newMessage = {
            from: name,
            to: 'Todos',
            text: 'entra na sala...',
            type: 'status',
            time: dayjs().format('HH:mm:ss')
        }
        db.collection("messages").insertOne({newMessage})

        return res.send(201)
    })

    app.get("/participants", (req, res) =>{ 

        db.collection("participants").find().toArray()
            .then(participants => res.send(participants))
            .catch(err => res.status(500).send(err.message))
    })

    app.post("/messages", (req, res) => {
        const { to, text, type } = req.body
        const { User } = req.headers
        
        const userOn = db.collection("participants").findOne({name: User})
        
        if(!userOn){
            res.status(422).send('Usuário não logado')
        }

        const messageSchema = joi.object({
            to: joi.string().required(),
            text: joi.string().required(),
            type: joi.string().valid("message", "private_message").required(),
            from: User
          });

        const validation = messageSchema.validate(to, text, type, { abortEarly: false })

        if (validation.error) {
            const errors = validation.error.details.map((detail) => detail.message);
            return res.status(422).send(errors);
          }

          db.collection("messages").insertOne({messageSchema})

          res.send(201)
    })
const PORT = 5000
app.listen(PORT, () => console.log(`Rodando na porta ${PORT}`))