const { MongoClient } = require('mongodb')
const URI = 'mongodb://admin:1234@ds123926.mlab.com:23926/studentbot'

module.exports = async function () {
	const db = await MongoClient.connect(URI)
	console.log('[i] Connected to MongoDB database successfully')
	return db
}
