const express = require('express');
const jwt = require('jsonwebtoken');
const app = express();
const cors = require('cors');
require('dotenv').config();
const port = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.uxwhh.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

// verify token middleware
const verifyToken = (req, res, next) => {
    console.log('inside verify token', req.headers.authorization);
    const authorization = req.headers.authorization;
    if (!authorization) {
        return res.status(401).send({ message: 'unauthorized access' });
    }
    const token = authorization.split(' ')[1];
    console.log('token:', token);
    
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
        if (err) {
            console.log('token verify error:', err);
            return res.status(401).send({ message: 'unauthorized access' });
        }
        console.log('decoded:', decoded);
        req.decoded = decoded;
        next();
    });
};
const verifyAdmin = async (req, res, next) => {
    try {
        const email = req.decoded.email;
        const query = { email: email };
        const user = await UserCollection.findOne(query);
        if (!user?.role || user.role !== 'admin') {
            return res.status(403).send({ message: 'forbidden access' });
        }
        next();
    } catch (error) {
        res.status(403).send({ message: 'forbidden access' });
    }
};
async function run() {
    try {
        await client.connect();
        const MenuCollection = client.db("BistroBossDb").collection("Menu");
        const Reviecollection = client.db("BistroBossDb").collection("Review");
        const CartCollection = client.db("BistroBossDb").collection("Cart");
        const UserCollection = client.db("BistroBossDb").collection("Users");

        app.post('/jwt', async(req, res) => {
            const user = req.body;
            const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
                expiresIn: '1h'
            });
            res.send({ token });
        });

        app.get('/menu', async(req, res) => {
            const result = await MenuCollection.find().toArray();
            res.send(result);
        });

        app.get('/reviews', async(req, res) => {
            const result = await Reviecollection.find().toArray();
            res.send(result);
        });

        // Protected routes with token verification
        app.post('/carts', verifyToken, async (req, res) => {
            const cartItem = req.body;
            const result = await CartCollection.insertOne(cartItem);
            res.send(result);
        });

        app.get('/carts', verifyToken, async (req, res) => {
            const email = req.query.email;
            if (email !== req.decoded.email) {
                return res.status(403).send({ message: 'forbidden access' });
            }
            const query = { email: email };
            const result = await CartCollection.find(query).toArray();
            res.send(result);
        });

        app.delete('/carts/:id', verifyToken, async (req, res) => {
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

        app.get('/users', verifyToken, async (req, res) => {
            try {
                const result = await UserCollection.find().toArray();
                res.send(result);
            } catch (error) {
                res.status(500).send({ error: error.message });
            }
        });

        app.get('/users/admin/:email', verifyToken, async (req, res) => {
            try {
                const email = req.params.email;
                if (email !== req.decoded.email) {
                    return res.status(403).send({ message: 'forbidden access' });
                }
                const query = { email: email };
                const user = await UserCollection.findOne(query);
                let isAdmin = false;
                if (user?.role === 'admin') {
                    isAdmin = true;
                }
                res.json({ isAdmin });
            } catch (error) {
                res.status(500).send({ error: error.message });
            }
        });

        app.delete('/users/:id', verifyToken, async (req, res) => {
            try {
                const id = req.params.id;
                const query = { _id: new ObjectId(id) };
                const result = await UserCollection.deleteOne(query);
                res.send(result);
            } catch (error) {
                res.status(500).send({ error: error.message });
            }
        });

        app.patch('/users/admin/:id',  async (req, res) => {
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

        app.patch('/users/toggle-role/:id', verifyToken,  async (req, res) => {
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