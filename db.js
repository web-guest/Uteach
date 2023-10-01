// const dotenv = require('dotenv')
// dotenv.config()
// const mongodb = require('mongodb')

// mongodb.connect(process.env.CONNECTIONSTRING, {useNewUrlParser: true, useUnifiedTopology: true}, function(err, client){
//   module.exports = client
//   const app = require('./app')
//   app.listen(process.env.PORT)
// })

const dotenv = require('dotenv')
dotenv.config()
const { MongoClient } = require('mongodb')
const client = new MongoClient(process.env.CONNECTIONSTRING)
async function start() {
    await client.connect()
    module.exports = client
    const app = require('./app')
    app.listen(process.env.PORT)
}
start()