require("dotenv").config();
const { Pool, Client } = require('pg');
const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const { StreamChat } = require("stream-chat");

const app = express();

const corsOptions =  {
  origin: ['https://chat-server-hermes.herokuapp.com/messaging','http://localhost:3000']
};

app.use(cors(corsOptions));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

//Database retrieval code -- to be used once routed

//backend has nothing to do with it i forgot
//await client.query("QUERY GOES HERE!!!", (err, result) => {});
//so where is your routing code


app.post('/messaging', async (req, res) => {

  console.log("WE HIT THE BACKEND")
  var authName = req.body.combo.split(",")[1]
  var smsName = req.body.combo.split(",")[0]

  // client = new Client({
  //      user: 'postgres',
  //      host: 'localhost',
  //      database: 'hermes',
  //      password: 'adidas123',
  //      port: 5432,
  //  });
  //  client.connect()

  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false
    }
  });
  client.connect()
  
  const admin = { id: "admin" };

  //Add user to their company's groupchat
  await client.query("SELECT dd.companyname FROM DeliveryDriver dd, Users u WHERE u.userid = dd.userid AND u.username = '" + authName + "';", (err, result) => {
    if(err){
      console.log("Query errored out...")
      console.log(err);
    }
    else if(result.rows[0] !== undefined){
      var companyName = result.rows[0].companyname;
      const channel = serverSideClient.channel("team", companyName, {
        name: companyName,
        created_by: admin
      });
      channel.create();
      channel.addMembers([smsName]);
    }
  });
  //If they're an admin...
  await client.query("SELECT DISTINCT da.companyname FROM DeliveryAdmin da, Users daUser WHERE da.userid = daUser.userid AND daUser.username = '" + authName + "';" ), (err, result) => {
    console.log("DOES THIS EVER HIT?")
    if(err){
      console.log("Query errored out...")
      console.log(err);
    }
    else if (results.rows[0] !== undefined){
      console.log("TEST")
      console.log(results.rows[0])
      const {members} = channel.queryMembers({'name':results.rows[0].companyname})
      console.log(members);
      // const channel = serverSideClient.channel("team", {
      //   members: [smsName, result.rows[0].username],
      // });
      // channel.create();
    }
  }
});


const serverSideClient = new StreamChat(
  process.env.STREAM_API_KEY,
  process.env.STREAM_APP_SECRET
);

app.post("/join", async (req, res) => {
  const { username } = req.body;
  console.log(username);
  const token = serverSideClient.createToken(username);
  // try {
  //   await serverSideClient.updateUser(
  //     {
  //       id: username
  //     },
  //     token
  //   );

    // const admin = { id: "admin" };
    // const channel = serverSideClient.channel("team", "chat", {
    //   name: "Public Forum",
    //   created_by: admin
    // });

    // await channel.create();
    // await channel.addMembers([username]);
  // } catch (err) {
  //   res.status(500).json({ err: err.message });
  //   return;
  // }

  return res.status(200).json({ user: { username }, token })
  });

app.listen(process.env.PORT || 7000, () => {
  console.log(`Server running on PORT 7000`);
  console.log("YEA THEY DOOO")
});

console.log("DO LOGS EVEN SHOW UP HERE?")
