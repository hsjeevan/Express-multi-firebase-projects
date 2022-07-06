const express = require('express')
const { olddb, newdb } = require('./config')

const app = express()
app.use(express.json())

app.post('/', async (req, res) => {
    const obj = {
        old: (await olddb.doc('Test/8dUv5c4YCCbcvzB6YDcmE0kr1gs1-Adhabfgww5QHagvpBvuC').get()).data(),
        new: (await newdb.doc('Test/FrkuVkrnT8u58HI73JWL').get()).data()
    }

    res.send(obj)
})

app.listen(4000, () => console.log(`Application listening at ${'4000'} `))