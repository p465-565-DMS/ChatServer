require("dotenv").config();
const { Pool, Client } = require('pg');
const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const { StreamChat } = require("stream-chat");

const app = express();

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

//Database retrieval code -- to be used once routed

//backend has nothing to do with it i forgot
//await client.query("QUERY GOES HERE!!!", (err, result) => {});
//so where is your routing code


app.post('/messaging', async (req, res) => {

  console.log("WE HIT THE BACKEND")
  var authName = req.body.combo.split(",")[1]
  console.log("authname: ", authName);
  var smsName = req.body.combo.split(",")[0]
  console.log("smsName: ", smsName);

  pool = new Client({
       user: 'postgres',
       host: 'localhost',
       database: 'hermes',
       password: 'a',
       port: 5432,
   });


  const admin = { id: "admin" };

  pool.connect();
  //Add IF driver to their company's groupchat
  await pool.query("SELECT DISTINCT dd.companyName FROM DeliveryDriver dd, Users u WHERE u.userid = dd.userid AND u.username = '" + authName + "';", (err, result) => {
    if(result !== undefined){
      for(const rest of result.rows){
        // try{
          var companyName = rest.companyname;
          const channel = serverSideClient.channel("team", companyName, {
            name: companyName,
            created_by: admin
          });
          channel.create();
          channel.addMembers([smsName]);
        // }
        // catch(error){
        //   console.log("OOF")
        // }
      }
    }
  });
  //Add IF admin to their company's groupchat
  await pool.query("SELECT DISTINCT da.companyname FROM DeliveryAdmin da, Users u WHERE da.userid = u.userid AND u.username = '" + authName + "';", (err, result) => {
    if(result !== undefined){
      for(const rest of result.rows){
        // try{
          var companyName = rest.companyname;
          const channel = serverSideClient.channel("team", companyName, {
            name: companyName,
            created_by: admin
          });
          channel.create();
          channel.addMembers([smsName]);
        // }
        // catch(error){
        //   console.log("OOF");
        // }
      }
    }
  });
  //Creates Driver To Admins Chat
  await pool.query("SELECT auser.email FROM DeliveryDriver dd, Users duser, DeliveryAdmin da, Users auser WHERE dd.userid = duser.userid AND da.userid = auser.userid AND dd.companyname = da.companyname AND duser.username = '" + authName + "';", (err, result) => {
    //Driver_NAME__Admin_NAME
    if(result !== undefined){
      for(const rest of result.rows){
        // try{
          const fixedName = rest.email.replace(/([^a-z0-9_-]+)/gi, "_");
          // const channelName = "Driver_" + smsName + "__" + "Manager_" + fixedName;

          const channel = serverSideClient.channel("messaging", {
            created_by_id: admin.id,
            members: [smsName, fixedName]
          });
          console.log(channel);
          channel.create();
          // channel.create();
          // channel.addMembers([smsName, fixedName]);
        // }
        // catch(error){
        //   console.log("OOF");
        // }
      }
    }
  });
  //Creates Admins To Driver Chat
  await pool.query("SELECT duser.email FROM DeliveryDriver dd, Users duser, DeliveryAdmin da, Users auser WHERE dd.userid = duser.userid AND da.userid = auser.userid AND dd.companyname = da.companyname AND auser.username = '" + authName + "';", (err, result) => {
    //Driver_NAME__Admin_NAME
    if(result !== undefined){
      for(const rest of result.rows){
        // try{
          const fixedName = rest.email.replace(/([^a-z0-9_-]+)/gi, "_");
          const channelName = "Driver_" + fixedName + "__" + "Manager_" + smsName;

          const channel = serverSideClient.channel("messaging", {
            created_by_id: admin.id,
            members: [smsName, fixedName]
          });
          channel.create();
          // channel.create();
          // channel.addMembers([smsName, fixedName]);
        // }
        // catch(error){
          // console.log("OOF");
        // }
      }
    }
  });
  //Creates Customer To Admin Chat
  await pool.query("SELECT manager.email FROM Package p, Users customer, Users manager, DeliveryAdmin da WHERE customer.userid = p.userid AND manager.userid = da.userid AND da.adminid = p.adminid AND customer.username = '" + authName + "';", (err, result) => {
    console.log(result)
    if(result !== undefined){
      for(const rest of result.rows){
        // try{
          const fixedName = rest.email.replace(/([^a-z0-9_-]+)/gi, "_");
          const channelName = "Customer_" + smsName + "__" + "Manager_" + fixedName;

          const channel = serverSideClient.channel("messaging", {
            members: [smsName, fixedName]
          });
          channel.create();
        // }
        // catch(error){
        //   console.log("OOF");
        // }
      }
    }
  });
  //Creates Admin To Customer Chat
  await pool.query("SELECT customer.email FROM Package p, Users customer, Users manager, DeliveryAdmin da WHERE customer.userid = p.userid AND manager.userid = da.userid AND da.adminid = p.adminid AND manager.username = '" + authName + "';", (err, result) => {
    console.log(result)
    if(result !== undefined){
      for(const rest of result.rows){
        // try{
          const fixedName = rest.email.replace(/([^a-z0-9_-]+)/gi, "_");
          const channelName = "Customer_" + fixedName + "__" + "Manager_" + smsName;

          const channel = serverSideClient.channel("messaging", {
            created_by_id: admin.id,
            members: [smsName, fixedName]
          });
          channel.create();
          // channel.addMembers([smsName, fixedName]);
        // }
        // catch(error){
        //   console.log("OOF");
        // }
      }
    }
  });

  // await pool.query("SELECT DISTINCT da.companyname FROM DeliveryAdmin da, Users u WHERE da.userid = u.userid AND u.username = '" + authName + "';", (err, result) => {
  //   try{
  //     var companyName = result.rows[0].companyname;
  //     const channel = serverSideClient.channel("team", companyName, {
  //       name: companyName,
  //       created_by: admin
  //     });
  //     channel.create();
  //     channel.addMembers([smsName]);
  //   }
  //   catch(err){
  //     console.log("User does not belong to a company in the admin table")
  //   }
  // });
  //Add Admins To Driver Chat
  //Add Customer To Admins Chat
  //Add Admins To Customer Chat

  //Connect driver to manager
  // await pool.query("SELECT DISTINCT manager.email FROM DeliveryDriver dd, DeliveryAdmin da, Users emp, Users manager WHERE dd.companyname = da.companyname AND emp.userid = dd.userid AND manager.userid = da.userid AND emp.username = '" + authName + "';", (err, result) => {
  //   for(const rest of result.rows){
  //     const fixedName = rest.email.replace(/([^a-z0-9_-]+)/gi, "_");
  //     console.log()
  //     // try{
  //       const dmName = "Manager-" + fixedName + '-x-' + "Driver" + smsName;
  //       const channel = serverSideClient.channel("team", dmName, {
  //         name: dmName,
  //         created_by: admin
  //       });
  //       channel.create();
  //       channel.addMembers([smsName, fixedName]);
  //     // }
  //     // catch(err){
  //       // console.log(fixedName, " hasn't joined the chat yet...");
  //     // }
  //   }
  // });


  //Connect manager to driver
  // await pool.query("SELECT DISTINCT emp.email FROM DeliveryDriver dd, DeliveryAdmin da, Users emp, Users manager WHERE dd.companyname = da.companyname AND emp.userid = dd.userid AND manager.userid = da.userid AND manager.username = '" + authName + "';", (err, result) => {
  //   console.log(result.rows)
  //   if(err){
  //     console.log("Query errored out...")
  //     console.log(err);
  //   }
  //   else if (result.rows[0] !== undefined){
  //     console.log("Successful query!")
  //     console.log("Printing results")
  //     console.log("RESULTS: ", result.rows);
  //     for(const rest of result.rows){
  //       const fixedName = rest.email.replace(/([^a-z0-9_-]+)/gi, "_");
  //
  //       try{
  //         const dmName = "Manager-" + smsName + '-x-' + "Driver-" + fixedName;
  //         const channel = serverSideClient.channel("team", dmName, {
  //           name: dmName,
  //           created_by: admin
  //         });
  //         channel.create();
  //         channel.addMembers([smsName, fixedName]);
  //       }
  //       catch(err){
  //         console.log(fixedName, " hasn't joined the chat yet...");
  //       }
  //
  //     }
  //   }
  // });

  //Connect manager to customers
  // await pool.query("SELECT DISTINCT duser.email FROM Package p, DeliveryAdmin dadmin, Users duser, Users customer WHERE p.adminid = dadmin.adminid AND dadmin.userid = duser.userid AND customer.userid = p.userid AND customer.username = '" + authName + "';", (err, result) => {
  //   for(const rest of result.rows){
  //     const fixedName = rest.email.replace(/([^a-z0-9_-]+)/gi, "_");
  //     try{
  //       const dmName = "Customer-" + smsName + '-x-' + "Manager-" + fixedName;
  //       const channel = serverSideClient.channel("team", dmName, {
  //         name: dmName,
  //         created_by: admin
  //       });
  //       channel.create();
  //       channel.addMembers([smsName, fixedName]);
  //     }
  //     catch(err){
  //       console.log(fixedName, " hasn't joined the chat...")
  //     }
  //   }
  // })

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
