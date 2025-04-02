const express = require('express');
const jwt = require('jsonwebtoken');
const app = express();
const cors = require('cors');
require('dotenv').config();
const port = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

const { MongoClient, ServerApiVersion ,ObjectId} = require('mongodb');
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
        const CartCollection = client.db("BistroBossDb").collection("Cart");
        const UserCollection = client.db("BistroBossDb").collection("Users");

        app.get('/menu', async(req, res) => {
            const result = await MenuCollection.find().toArray();
            res.send(result);
        });

        app.get('/reviews', async(req, res) => {
            const result = await Reviecollection.find().toArray();
            res.send(result);
        });
        app.post('/carts', async (req, res) => {
            const cartItem = req.body;
            const result = await CartCollection.insertOne(cartItem);
            res.send(result);
        });
        app.get('/carts', async (req, res) => {
            const email = req.query.email;
            const query = { email: email };
            const result = await CartCollection.find(query).toArray();
            res.send(result);
        });
        app.delete('/carts/:id', async (req, res) => {
            try {
                const id = req.params.id;
                const query = { _id: new ObjectId(id) };
                const result = await CartCollection.deleteOne(query);
                res.send(result);
            } catch (error) {
                res.status(500).send({ error: error.message });
            }
        });
        app.post('/users', async (req, res) => {
            const user = req.body;
            const query = { email: user.email };
            const existingUser = await UserCollection.findOne(query);
            if (existingUser) {
                return res.send({ message: 'user already exists' });
            }
            const result = await UserCollection.insertOne(user);
            res.send(result);
        });
        app.get('/users', async (req, res) => {
            try {
                const result = await UserCollection.find().toArray();
                res.send(result);
            } catch (error) {
                res.status(500).send({ error: error.message });
            }
        });
        app.get('/users/admin/:email', async (req, res) => {
            const email = req.params.email;
            const query = { email: email };
            const user = await UserCollection.findOne(query);
            const isAdmin = user?.role === 'admin';
            res.json({ isAdmin });
        });
        app.delete('/users/:id', async (req, res) => {
            try {
                const id = req.params.id;
                const query = { _id: new ObjectId(id) };
                const result = await UserCollection.deleteOne(query);
                res.send(result);
            } catch (error) {
                res.status(500).send({ error: error.message });
            }
        });
        // Add this endpoint after your existing users endpoints
app.patch('/users/admin/:id', async (req, res) => {
    try {
        const id = req.params.id;
        const filter = { _id: new ObjectId(id) };
        const updateDoc = {
            $set: {
                role: 'admin'
            }
        };
        const result = await UserCollection.updateOne(filter, updateDoc);
        res.send(result);
    } catch (error) {
        res.status(500).send({ error: error.message });
    }
});
app.patch('/users/toggle-role/:id', async (req, res) => {
    try {
        const id = req.params.id;
        const { role } = req.body;
        const filter = { _id: new ObjectId(id) };
        const updateDoc = {
            $set: { role }
        };
        const result = await UserCollection.updateOne(filter, updateDoc);
        res.send(result);
    } catch (error) {
        res.status(500).send({ error: error.message });
    }
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