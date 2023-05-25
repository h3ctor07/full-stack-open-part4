require('dotenv').config()

const MONGODB_URI = process.env.NODE_ENV === 'test'
	? process.env.TEST_MONGO_DB_BLOGS
	: process.env.MONGO_DB_BLOGS
const PORT = process.env.PORT

module.exports = {
	MONGODB_URI,
	PORT
}