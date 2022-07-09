const express = require('express')
const { olddb, newdb } = require('./config')
const bulkWriter = newdb.bulkWriter()
const fetch = require("node-fetch");
const fs = require('fs')

const app = express()
const port = 4000

app.use(express.json())

let count = 0;
let fails = 0;

app.get('/', async (req, res, next) => {

    let counters = {
        count: 0,
        fails: 0
    }
    // collections = ['Configuration', 'EmployeeCollection']
    const collections = await olddb.listCollections()
    const ignoreables = ['Mail', 'Quizzes', 'Schools']
    let c = 1;
    for (let col of collections) {
        if (!ignoreables.includes(col.id) && c >= 0) {
            console.log('Copying ' + col.id);
            await callCopyRoute(col.id).then((data) => {
                counters.count += data.count
                counters.fails += data.fails
            })
            console.log('Finished copying ' + col.id);
            // c-- //uncomment  for testing for only 2 collections
        }
    }
    console.log('END');
    res.send(counters)

});

function callCopyRoute(collection) {
    return fetch(`http://localhost:${port}/copy`, {
        method: 'POST',
        headers: {
            'Accept': 'application/json, text/plain, */*',
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ collection })
    }).then(res => res.json())
}

app.post('/copy', async (req, res) => {
    count = 0;
    fails = 0;
    const collection = req.body.collection;
    await copyRecursively(collection);
    await bulkWriter.flush();
    res.send(JSON.stringify({ count, fails }));
})

async function copyRecursively(col) {
    // const col = 'Test'
    const collection = await olddb.collection(col).get()
    const promiseArr = []

    for (let doc of collection.docs) {
        const newData = JSON.parse(replaceinObject(doc.data(), 'testapp-bb252', 'tactile-education-services-pvt'))
        // copy to new db
        const path = doc.ref.path
        console.log(path);
        bulkWriter.set(newdb.doc(path), newData, { merge: true }).catch(err => {
            fails++
            writeTofile(path + ' ------- ' + err.message + '\n')
        });
        count++;

        //check for subcollections
        promiseArr.push(checkDepth(path))
    }
    return Promise.all(promiseArr)
}

async function checkDepth(path) {
    const subCollections = await olddb.doc(path).listCollections()
    const promiseArr = []
    if (subCollections.length) {
        subCollections.forEach(a => promiseArr.push(copyRecursively(a.path)))
    }
    return Promise.all(promiseArr)
}

function replaceinObject(obj, oldVal, newVal) {
    const string = JSON.stringify(obj)
    const replacer = new RegExp(oldVal, 'g')
    return string.replace(replacer, newVal)
}


function writeTofile(data) {
    fs.writeFileSync('./errorDocuments.txt', data, { flag: "a+" })
}

app.listen(port, () => console.log(`Application listening to ${port} port.`))

