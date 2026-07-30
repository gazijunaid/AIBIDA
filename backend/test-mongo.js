const mongoose = require("mongoose");

const uri =
  "mongodb+srv://gazijunaid444_db_user:Junaid%40786@gazijunaid07.d2hxxjg.mongodb.net/aibida?retryWrites=true&w=majority&appName=Gazijunaid07";

mongoose
  .connect(uri)
  .then(() => {
    console.log("✅ Connected successfully!");
    process.exit(0);
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });