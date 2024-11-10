const express = require('express');
const morgan = require('morgan');
const database = require('./database');


//config fetch
const app = express();
app.set("port",4000);
app.listen(app.get("port"));
console.log("puerto:::"+app.get("port"));

//midleware
app.use(morgan("dev"));


//router
app.get("/products", async (req,res)=>{
     const connection = await database.getConnection();

     const result = await connection.query("SELECT * from producto")

     console.log(result);

     res.json(result);
});