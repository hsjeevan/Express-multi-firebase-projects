// import * as functions from "firebase-functions";
const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

const newServiceAccount = require('./config/newProject.json');
const oldServiceAccount = require('./config/oldProject.json');


const oldApp = initializeApp({
    credential: cert(oldServiceAccount),
    databaseURL: "https://testapp-bb252.firebaseio.com"
}, 'oldDB')

const newApp = initializeApp({
    credential: cert(newServiceAccount),
    databaseURL: "https://tactile-education-services-pvt.firebaseio.com"
}, 'newDB');

const olddb = getFirestore(oldApp);
const newdb = getFirestore(newApp);

module.exports = { olddb, newdb };
