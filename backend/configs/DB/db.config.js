const mongoose = require("mongoose");

const connectTODB = async () => {
    try{
        await mongoose.connect(process.env.MONGOURI);
        console.info(`[${new Date().toISOString()}] Connected to opti cast Database.`);
    }catch(error){
        console.error("Error while connecting to otpi cast Database:", error);
        process.exit(1);
    }

    mongoose.connection.on("disconnected",() => {
        console.warn("MongoDB disconnected!");
    });

    mongoose.connection.on("error")
}; 

module.exports = connectTODB;