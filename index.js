const express = require('express');
const app = express();
const cors = require('cors');
require('dotenv').config();
const port = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

const { MongoClient, ServerApiVersion } = require('mongodb');
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.uxwhh.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

async function run() {
    try {
        await client.connect();
        const MenuCollection = client.db("BistroBossDb").collection("Menu");
        const Reviecollection = client.db("BistroBossDb").collection("Review");

        app.get('/menu', async(req, res) => {
            const result = await MenuCollection.find().toArray();
            res.send(result);
        });

        app.get('/reviews', async(req, res) => {
            const result = await Reviecollection.find().toArray();
            res.send(result);
        });

        await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
        // Commented out to keep connection alive for API requests
        // await client.close();
    }
}
run().catch(console.dir);

app.get('/', (req, res) => {
    res.send('Application is Running');
});

app.listen(port, () => {
    console.log(`Application Running on port ${port}`);
});