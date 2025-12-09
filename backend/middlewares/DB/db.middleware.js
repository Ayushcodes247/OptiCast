const mongoose = require("mongoose");

const checkDBConnection = (req, res, next) => {
    if(mongoose.connection.readyState !== 1){
        return res.status(500).json({ message: "Database connection error" });
    }

    next();
};

module.exports = checkDBConnection;