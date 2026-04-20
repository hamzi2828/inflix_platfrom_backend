const mongoose = require('mongoose');
const config = require('./index');

const connectDB = async () => {
    try {
        const uri = config.masterMongoUri;
        if (!uri) {
            console.error('MASTER_MONGODB_URI is required');
            process.exit(1);
        }  
        const conn = await mongoose.connect(uri, {
            dbName: config.masterDbName
        });
        console.log(`MongoDB Connected (master): ${conn.connection.host}/${config.masterDbName}`);
    } catch (error) {
        console.error(`Error: ${error.message}`);
        process.exit(1);
    }
};

module.exports = connectDB;
