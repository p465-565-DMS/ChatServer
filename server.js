const express = require('express');
const app = express();
const jwt = require('express-jwt');
const jwtAuthz = require('express-jwt-authz');
const jwksRsa = require('jwks-rsa');
const cors = require('cors');
const { get_jwt_claims } = require('./utils/jwtClaims');
const { Pool, Client } = require('pg');
require('dotenv').config();

if (!process.env.AUTH0_DOMAIN || !process.env.AUTH0_AUDIENCE) {
  throw 'Make sure you have AUTH0_DOMAIN, and AUTH0_AUDIENCE in your .env file';
}

const corsOptions =  {
  origin: ['https://hermes-delivery-hub.herokuapp.com','http://localhost:3000']
};

app.use(cors(corsOptions));
app.use(express.json());

const checkJwt = jwt({
  // Dynamically provide a signing key based on the [Key ID](https://tools.ietf.org/html/rfc7515#section-4.1.4) header parameter ("kid") and the signing keys provided by the JWKS endpoint.
  secret: jwksRsa.expressJwtSecret({
    cache: true,
    rateLimit: true,
    jwksRequestsPerMinute: 5,
    jwksUri: `https://${process.env.AUTH0_DOMAIN}/.well-known/jwks.json/`
  }),

  // Validate the audience and the issuer.
  audience: process.env.AUTH0_AUDIENCE,
  issuer: `https://${process.env.AUTH0_DOMAIN}/`,
  algorithms: ['RS256']
});

const checkScopes = jwtAuthz(['read:messages']);

app.get('/api/public', function(req, res) {
  res.json({
    message: 'Hello from a public endpoint! You don\'t need to be authenticated to see this.'
  });
});

app.get('/api/private', checkJwt, function(req, res) {
  res.json({
    message: 'Hello from a private endpoint! You need to be authenticated to see this.'
  });
});

app.get('/api/private-scoped', checkJwt, checkScopes, function(req, res) {
  res.json({
    message: 'Hello from a private endpoint! You need to be authenticated and have a scope of read:messages to see this.'
  });
});


app.use(function(err, req, res, next){
  console.log(req.headers)
  console.error(err.stack);
  return res.status(err.status).json({ message: err.message });
});

//Connecting the database to the backend
//Connecting to the database so we can query it, etc.
// const pool = new Pool({
//   user: 'postgres',
//   host: 'localhost',
//   database: 'hermes',
//   password: 'a',
//   port: 5432,
// })
//adidas123
client = new Client({
    user: 'postgres',
    host: 'localhost',
    database: 'hermes',
    password: 'a',
    port: 5432,
});
// const client = new Client({
//   connectionString: process.env.DATABASE_URL,
//   ssl: {
//     rejectUnauthorized: false
//   }
// });
// const client = new Client({
//   connectionString: process.env.DATABASE_URL,
//   ssl: {
//     rejectUnauthorized: false
//   }
// });
client.connect()

//JS isnt an OOP language, so getting this class I created onto another file might be tricky. For now, it can live here.
class ezQueryBuilder {
    getUsersFromCompany(companyName){
      console.log("SELECT DISTINCT u.* FROM CompanyRelations cr, Users u, Company c WHERE cr.userId = u.userId AND c.compId = cr.compId AND c.compName = '" + companyName + "';");
      return "SELECT DISTINCT u.* FROM CompanyRelations cr, Users u, Company c WHERE cr.userId = u.userId AND c.compId = cr.compId AND c.compName = '" + companyName + "';"
    }

    getAllCompanies(){
      console.log('SELECT DISTINCT compName FROM Company;');
      return 'SELECT DISTINCT compName FROM Company;';
    }

    getAUsersPackages(username){
      console.log("SELECT DISTINCT p.* FROM Users u, PackageRelations pr, Package p WHERE pr.userId = u.userId AND pr.packageId = p.packageId AND u.userName = '" + username + "';");
      return "SELECT DISTINCT p.* FROM Users u, PackageRelations pr, Package p WHERE pr.userId = u.userId AND pr.packageId = p.packageId AND u.userName = '" + username + "';";
    }

    getACompanysPackages(companyName){
      console.log("SELECT DISTINCT p.* FROM Company c, PackageRelations pr, CompanyRelations cr, Package p WHERE c.compName = '" + companyName + "' AND c.compId = cr.compId AND pr.userId = cr.userId AND pr.packageId = p.packageId;")
      return "SELECT DISTINCT p.* FROM Company c, PackageRelations pr, CompanyRelations cr, Package p WHERE c.compName = '" + companyName + "' AND c.compId = cr.compId AND pr.userId = cr.userId AND pr.packageId = p.packageId;";
    }

    getACustomersPackages(username){
      console.log("SELECT DISTINCT p.* FROM CustomerToPackage ctp, Users u, Package p WHERE u.userName = '" + username + "' AND ctp.userId = u.userId AND p.packageId = ctp.packageId;");
      return "SELECT DISTINCT p.* FROM CustomerToPackage ctp, Users u, Package p WHERE u.userName = '" + username + "' AND ctp.userId = u.userId AND p.packageId = ctp.packageId;"
    }

    getUser(email){
      return "SELECT * FROM Users WHERE email = '"+email+"';"
    }

    //Want to try a completely new pull to see if it works?
    //This repo has some of my changes
    //Sure
    getUserId(email){
      return "SELECT userid FROM Users WHERE email = '"+email+"';"
    }

    getUsername(email){
      return "SELECT username FROM Users WHERE email = '"+email+"';"
    }

    getCompany(uid){
      return "SELECT companyname FROM deliveryadmin WHERE userid = '"+uid+"';"
    }

    getAdmin(uid){
      return "SELECT adminid FROM deliveryadmin WHERE userid = '"+uid+"';"
    }

    getAdminCompany(uid){
      return "SELECT companyname FROM deliveryadmin WHERE userid = '"+uid+"';"
    }

    getAdminCompanyAddress(){
      return "SELECT da.companyname, u.googlelink, u.lat, u.long FROM Users u, deliveryadmin da WHERE role = 'dadmin' and u.userid = da.userid;"
    }

    getAdminInfo(uid){
      return "SELECT da.companyname, u.address, u.city, u.state, u.email, u.phone FROM deliveryadmin da, users u WHERE u.userid = '"+uid+"' AND da.userid='"+uid+"';"
    }

    getDrivers(cname){
      return "SELECT u.username FROM users u, deliverydriver d WHERE u.userid = d.userid AND d.companyname = '"+cname+"';";
    }

    getPackage(tid){
      return "SELECT * FROM package WHERE trackingid = '"+tid+"';";
    }

    getAdminPackages(aid){
      return "SELECT DISTINCT u.email, p.packageid, p.packagesource, p.packagedestination, p.deadline, p.packagespeed, p.packagetype, p.packageweight, p.packagesize, p.packagestatus, p.packageassigned, p.packagelocation, p.trackingid FROM package p, users u WHERE u.userid = p.userid AND p.adminid = '"+aid+"';";
    }

    getAdminHistory(aid){
      return "SELECT DISTINCT u.email, u.fname, p.packageid, p.packageassigned, p.packagestatus, p.trackingid, p.packagelocation, p.packagetype, p.price, p.review FROM users u, package p WHERE u.userid = p.userid AND p.adminid = '"+aid+"';";
    }

    getAdminServices(aid){
      return "SELECT DISTINCT s.id, s.pspeed, s.ptype, s.psize, s.pweight, s.price FROM deliveryadmin a, servicedetails s WHERE s.adminid='"+aid+"';";
    }

    getDriverPackages(uname){
      return "SELECT DISTINCT u.email, p.packageid, p.packagesource, p.packagedestination, p.deadline, p.packagespeed, p.packagetype, p.packageweight, p.packagesize, p.packagestatus, p.packagelocation, p.trackingid FROM package p, users u WHERE u.userid = p.userid AND p.packageassigned = '"+uname+"';";
    }

    getDriverPackagesByEmail(email){
      return "SELECT p.packagelocation FROM Package p, Users u WHERE p.packageassigned = u.username and u.email = '" + email + "';";
    }

    getDriverHistory(uname){
      return "SELECT DISTINCT u.email, u.fname, p.packageid, p.packagesource, p.price, p.review, p.deadline, p.packagedestination, p.packagetype, p.packagestatus, p.packagelocation, p.trackingid FROM package p, users u WHERE u.userid = p.userid AND p.packageassigned = '"+uname+"';";
    }

    getUserHistory(uid){
      return "SELECT DISTINCT u.email, da.companyname, p.packageid, p.packagesource, p.price, p.review, p.deadline, p.packagedestination, p.packagetype, p.packagestatus, p.packagelocation, p.packageassigned, p.trackingid FROM deliveryadmin da, package p, users u WHERE u.userid = p.userid AND da.adminid = p.adminid AND p.packagestatus = 'Delivered' AND p.userid = '"+uid+"';";
    }

    getUserOrders(uid){
      return "SELECT DISTINCT u.email, p.packageid, p.packagesource, p.price, p.review, p.deadline, p.packagedestination, p.packagetype, p.packagestatus, p.packagelocation, p.packageassigned, p.trackingid FROM package p, users u WHERE u.userid = p.userid AND p.packagestatus != 'Delivered' AND p.userid = '"+uid+"';";
    }

    getEmployee(cname){
      return "SELECT DISTINCT u.fname, u.lname, u.email, u.username, u.role, u.googlelink FROM users u, deliverydriver dd WHERE dd.companyname ='"+cname+"' AND dd.userid = u.userid;"
    }

    updateUser(email, fname, lname, phone, streetAddress, city, state, zipcode, googlelink){
      return "UPDATE Users SET fname = '"+fname+"', lname = '"+lname+"', phone = '"+phone+"', address = '"+streetAddress+"', city = '"+city+"', state = '"+state+"', zipcode = '"+zipcode+"', googlelink = '"+googlelink+"' WHERE email = '"+email+"';";
    }

    updateOrders(packageid, driver){
      return "UPDATE package SET packageassigned = '"+driver+"' WHERE packageid = '"+packageid+"';";
    }

    updatePackage(packageid, status, location){
      return "UPDATE package SET packagestatus = '"+status+"' , packagelocation = '"+location+"' WHERE packageid = '"+packageid+"';";
    }

    updateUsersAddress(username, address){
      console.log("UPDATE Users SET address = '" + address + "' WHERE userName = '"+ username +"';")
      return "UPDATE Users SET address = '" + address + "' WHERE userName = '"+ username +"';"
    }

    updatePackageStartingLocation(packageId, location){
      console.log("UPDATE Package SET packageSLocation = '" + location + "' WHERE packageId = " + packageId + ";");
      return "UPDATE Package SET packageSLocation = '" + location + "' WHERE packageId = " + packageId + ";"
    }

    updatePackageEndingLocation(packageId, location){
      console.log("UPDATE Package SET packageELocation = '" + location + "' WHERE packageId = " + packageId + ";");
      return "UPDATE Package SET packageELocation = '" + location + "' WHERE packageId = " + packageId + ";"
    }

    updatePackageDeliveryStatus(packageId, packageDeliveryStatus){
      console.log("UPDATE Package SET packageDeliveryStatus = '" + packageDeliveryStatus + "' WHERE packageId = " + packageId + ";")
      return "UPDATE Package SET packageDeliveryStatus = '" + packageDeliveryStatus + "' WHERE packageId = " + packageId + ";"
    }

    updateReview(packageid, review){
      return "UPDATE package SET review = '"+review+"' WHERE packageid='"+packageid+"';"
    }

    updateServices(id, speed, type, size, weight, price){
      return "UPDATE servicedetails SET pspeed = '"+speed+"', "+"ptype = '"+type+"', "+"psize = '"+size+"', "+"pweight = '"+weight+"', "+"price = '"+price+"' WHERE id = '"+id+"';";
    }

    createService(speed, type, size, weight, price, aid){
      return "INSERT INTO servicedetails (adminid, pspeed, ptype, psize, pweight, price) VALUES ('"+aid+"', '"+speed+"', '"+type+"', '"+size+"', '"+weight+"', '"+price+"');";
    }

    createACompany(compName, creatorId, logo, description, address){
      return "INSERT INTO Company (compName, creatorId, logo, description, address) VALUES ('" + compName + "', " + creatorId + ", '" + logo + "', '" + description +"', '" + address + "');";
    }

    createAUser(fname, lname, username, role, address, phone, email, state, city, link, zipcode, lat, long){
      console.log("INSERT INTO Users (fname, lName, userName, role, address, phone, email, state, city, googlelink, zipcode, lat, long) VALUES ('"+fname+"', '"+lname+"', '"+username+"', '"+role+"', '"+address+"', '"+phone+"', '"+email+"', '"+state+"', '"+city+"', '"+link+"', '"+zipcode +"', '"+lat+"', '"+long+"');");
      return "INSERT INTO Users (fname, lName, userName, role, address, phone, email, state, city, googlelink, zipcode, lat, long) VALUES ('"+fname+"', '"+lname+"', '"+username+"', '"+role+"', '"+address+"', '"+phone+"', '"+email+"', '"+state+"', '"+city+"', '"+link+"', '"+zipcode +"', '"+lat+"', '"+long+"');";
    }

    createAnAdmin(username, cname, spkg, mpkg, lpkg, elec, deli, heavy, doc, other, express, normal){
      return "INSERT INTO deliveryAdmin(userid, companyname, spkg, mpkg, lpkg, electronic, delicate, heavy, doc, other, express, normal) VALUES((SELECT userid from users where username='"+username+"'), '"+cname+"','"+spkg+"','"+mpkg+"','"+lpkg+"','"+elec+"','"+deli+"','"+heavy+"','"+doc+"','"+other+"','"+express+"','"+normal+"');";
    }

    createADriver(username, cname, lno){
      return "INSERT INTO deliverydriver(userid, companyname, licenseno) VALUES((SELECT userid from users where username='"+username+"'),'"+cname+"','"+lno+"');";
    }
    createUserRelationToCompany(compId, userId){
      return "INSERT INTO CompanyRelations VALUES ("+compId +", "+userId+");";
    }

    createAPackage(title, desc, sloc, deadline, eloc, status){
      return "INSERT INTO Package (packageTitle, packageDescription, packageSLocation, deadline, packageELocation, packageDeliveryStatus) VALUES ('"+title+"','"+desc+"','"+sloc+"','"+deadline+"','"+eloc+"', '"+status+"');";
    }

    placeOrder(adminid, userid, price, trackingid, packagesource, packagedestination, packagelocation, packagespeed, packagetype, packagesize, packageweight, deadline, long, lat){
      return "INSERT INTO package (packagestatus, adminid, userid, price, trackingid, packagesource, packagedestination, packagelocation, packagespeed, packagetype, packagesize, packageweight, deadline, long, lat) VALUES ('Recieved', '"+adminid+"','"+userid+"','"+price+"','"+trackingid+"','"+packagesource+"','"+packagedestination+"','"+packagelocation+"','"+packagespeed+"','"+packagetype+"','"+packagesize+"','"+packageweight+"','"+deadline+"','"+long+"','"+lat+"');"
    }

    createAPackageRelation(userid, packageid){
      return "INSERT INTO PackageRelations VALUES ('"+userid +"', '"+packageid+"');";
    }

    createACustomerToPackageRelation(userid, packageid){
      return "INSERT INTO CustomerToPackage VALUES ('"+userid +"', '"+packageid+"');";
    }

    getPackageCurrentLocation(packageId){
      return "SELECT currentLocation FROM Package WHERE packageId = " + packageId;
    }

    getAllCompanyCustomers(compName){
      return "SELECT DISTINCT customers.* FROM CustomerToPackage ctp, PackageRelations pr, Users u, CompanyRelations cr, Company c, Users customers WHERE ctp.packageId = pr.packageId AND pr.userId = u.userId AND u.userId = cr.userId AND cr.compId = c.compId AND customers.userId = ctp.userId AND c.compName = "+"'"+compName+"';"
    }

    getAUsersPackagesThatAreDelivered(username){
      return "SELECT DISTINCT p.* FROM Users u, PackageRelations pr, Package p WHERE pr.userId = u.userId AND p.packageDeliveryStatus = 'DELIVERED' AND pr.packageId = p.packageId AND u.userName = '" + username + "';";
    }

    deleteServices(id){
      return "DELETE FROM servicedetails WHERE id = '"+id+"';";
    }

}

let easyQB = new ezQueryBuilder();

app.post('/fill-info', checkJwt, function(req, res) {
  if(req.body.role  == "user") {
  const setRow = async() =>{
    await client.query(easyQB.createAUser(req.body.fname, req.body.lname, req.body.username, req.body.role, req.body.address.streetAddress, req.body.phone, req.body.email, req.body.address.state, req.body.address.city, req.body.address.googleMapLink, req.body.zipCode, req.body.address.lat, req.body.address.long), (err, result) => {
      if (err){
        console.log(err.stack)
        res.status(400).json(err)
      } else {
        console.log(result.command)
        res.status(200).json(result.command)}
    })
  }
  setRow()
  }
  else if(req.body.role == "dadmin"){
    const setRow = async() => {
      await client.query(easyQB.createAUser(req.body.fname, req.body.lname, req.body.username, req.body.role, req.body.address.streetAddress, req.body.phone, req.body.email, req.body.address.state, req.body.address.city, req.body.address.googleMapLink, req.body.zipCode, req.body.address.lat, req.body.address.long), (err, result) => {
        if (err){
          console.log(err.stack)
          res.status(400).json(err)
        } else {
          console.log(result.command)
          const setAdmin = async() =>{
            await client.query(easyQB.createAnAdmin(req.body.username, req.body.admin.cname, req.body.admin.spkg, req.body.admin.mpkg, req.body.admin.lpkg, req.body.admin.elec, req.body.admin.deli, req.body.admin.heavy, req.body.admin.doc, req.body.admin.other, req.body.admin.express, req.body.admin.normal), (err, result1) => {
              if (err){
                console.log(err.stack)
                res.status(400).json(err)
              } else {
                console.log(result1.command)
                res.status(200).json(result1.command)}
            })
          }
          setAdmin()
          }
      })
    }
    setRow()
  }
  else {
    const setRow = async() => {
      await client.query(easyQB.createAUser(req.body.fname, req.body.lname, req.body.username, req.body.role, req.body.address.streetAddress, req.body.phone, req.body.email, req.body.address.state, req.body.address.city, req.body.address.googleMapLink, req.body.zipCode, req.body.address.lat, req.body.address.long), (err, result) => {
        if (err){
          console.log(err.stack)
          res.status(400).json(err)
        } else {
          console.log(result.command)
          const setDriver = async() =>{
            await client.query(easyQB.createADriver(req.body.username, req.body.driver.cname, req.body.driver.lno), (err, result1) => {
              if (err){
                console.log(err.stack)
                res.status(400).json(err)
              } else {
                console.log(result1.command)
                res.status(200).json(result1.command)}
            })
          }
          setDriver()
          }
      })
    }
    setRow()
  }
});

app.get('/api/me', checkJwt, function(req, res){
  const fetchRow = async() =>{
    const claims = get_jwt_claims(req)
    const email = claims['https://example.com/email']
    await client.query(easyQB.getUser(email), (err, result) => {
      if(result.rows.length > 0){
        res.status(200).json(result.rows)
      } else {
        res.status(400).json()
      }
    })
  }
  fetchRow()
});


app.post("/api/trackPackage", function(req, res) {
  const fetchRow = async() =>{
    console.log(req.body.trackingid)
    await client.query(easyQB.getPackage(req.body.trackingid), (err, result) => {
      console.log(result.rows)
      if(result.rows.length > 0){
        res.status(200).json(result.rows)
      } else {
        res.status(400).json()
      }
    })
  }
  fetchRow()
});

app.post('/api/me', checkJwt, function(req, res){
  const fetchRow = async() =>{
    await client.query(easyQB.updateUser(req.body.email, req.body.fname, req.body.lname, req.body.phone, req.body.address.streetAddress, req.body.address.city, req.body.address.state, req.body.address.zip, req.body.address.googlelink), (err, result) => {
      if(err){
        res.status(400).json(err.stack)
      } else {
        res.status(200).json(result.rows)
      }
    })
  }
  fetchRow()
});

app.get('/api/address', function(req, res){
  const fetchRow = async() =>{
    await client.query(easyQB.getAdminCompanyAddress(), (err, result) => {
      console.log(result)
      if(result.rows.length > 0){
        res.status(200).json(result.rows)
      } else {
        res.status(400).json()
      }
    })
  }
  fetchRow()
});

app.get('/api/destination', checkJwt, function(req, res){
  const fetchRow = async() =>{
    const claims = get_jwt_claims(req)
    const email = claims['https://example.com/email']
    await client.query(easyQB.getDriverPackagesByEmail(email), (err, result) => {
      console.log(result)
      console.log(email)
        if(result.rows.length > 0){
          res.status(200).json(result.rows)
        } else {
          res.status(400).json()
        }
    })
  }
  fetchRow()
});

app.get('/admin/employees', checkJwt, function(req, res){
  const fetchRow1 = async() =>{
    const claims = get_jwt_claims(req)
    const email = claims['https://example.com/email']
    await client.query(easyQB.getUserId(email), (err, result) => {
      console.log(result)
      if(err){
        res.status(400).json()
      } else {
        const uid = result.rows[0].userid;
        console.log(result.rows[0].userid);
          const fetchUsers = async() =>{
            await client.query(easyQB.getCompany(uid), (err, result1) => {
              if (err){
                console.log(err.stack)
                res.status(400).json(err)
              } else {
                console.log(result1);
                const cname = result1.rows[0].companyname;
                const fetchEmployee = async() =>{
                  await client.query(easyQB.getEmployee(cname), (err, result2) => {
                    if (err){
                      console.log(err.stack)
                      res.status(400).json(err)
                    } else {
                      console.log(result2.rows)
                      res.status(200).json(result2.rows)}
                  })
                }
                fetchEmployee()
              }
            })
          }
          fetchUsers()
      }
    })
  }
  fetchRow1()
});

app.get('/admin/orders', checkJwt, function(req, res){
  const fetchRow1 = async() =>{
    const claims = get_jwt_claims(req)
    const email = claims['https://example.com/email']
    await client.query(easyQB.getUserId(email), (err, result) => {
      console.log(result)
      if(err){
        res.status(400).json()
      } else {
        const uid = result.rows[0].userid;
        console.log(result.rows[0].userid);
          const fetchUsers = async() =>{
            await client.query(easyQB.getAdmin(uid), (err, result1) => {
              if (err){
                console.log(err.stack)
                res.status(400).json(err)
              } else {
                console.log(result1);
                const aid = result1.rows[0].adminid;
                const fetchPackages = async() =>{
                  await client.query(easyQB.getAdminPackages(aid), (err, result2) => {
                    if (err){
                      console.log(err.stack)
                      res.status(400).json(err)
                    } else {
                      console.log(result2.rows)
                      res.status(200).json(result2.rows)}
                  })
                }
                fetchPackages()
              }
            })
          }
          fetchUsers()
      }
    })
  }
  fetchRow1()
});

app.get('/driver/orders', checkJwt, function(req, res){
  const fetchRow1 = async() =>{
    const claims = get_jwt_claims(req)
    const email = claims['https://example.com/email']
    await client.query(easyQB.getUsername(email), (err, result) => {
      console.log(result)
      if(err){
        res.status(400).json()
      } else {
        const uname = result.rows[0].username;
        console.log(result.rows[0].username);
                const fetchPackages = async() =>{
                  await client.query(easyQB.getDriverPackages(uname), (err, result2) => {
                    if (err){
                      console.log(err.stack)
                      res.status(400).json(err)
                    } else {
                      console.log(result2.rows)
                      res.status(200).json(result2.rows)}
                  })
                }
                fetchPackages()
              }
            })
          }
  fetchRow1()
});

app.get('/admin/services', checkJwt, function(req, res){
  const fetchRow1 = async() =>{
    const claims = get_jwt_claims(req)
    const email = claims['https://example.com/email']
    await client.query(easyQB.getUserId(email), (err, result) => {
      console.log(result)
      if(err){
        res.status(400).json()
      } else {
        const uid = result.rows[0].userid;
        console.log(result.rows[0].userid);
          const fetchUsers = async() =>{
            await client.query(easyQB.getAdmin(uid), (err, result1) => {
              if (err){
                console.log(err.stack)
                res.status(400).json(err)
              } else {
                console.log(result1);
                const aid = result1.rows[0].adminid;
                const fetchServices = async() =>{
                  await client.query(easyQB.getAdminServices(aid), (err, result2) => {
                    if (err){
                      console.log(err.stack)
                      res.status(400).json(err)
                    } else {
                      console.log(result2.rows)
                      res.status(200).json(result2.rows)}
                  })
                }
                fetchServices()
              }
            })
          }
          fetchUsers()
      }
    })
  }
  fetchRow1()
});

app.get('/admin/orderHistory', checkJwt, function(req, res){
  const fetchRow1 = async() =>{
    const claims = get_jwt_claims(req)
    const email = claims['https://example.com/email']
    await client.query(easyQB.getUserId(email), (err, result) => {
      console.log(result)
      if(err){
        res.status(400).json()
      } else {
        const uid = result.rows[0].userid;
        console.log(result.rows[0].userid);
          const fetchUsers = async() =>{
            await client.query(easyQB.getAdmin(uid), (err, result1) => {
              if (err){
                console.log(err.stack)
                res.status(400).json(err)
              } else {
                console.log(result1);
                const aid = result1.rows[0].adminid;
                const fetchPackages = async() =>{
                  await client.query(easyQB.getAdminHistory(aid), (err, result2) => {
                    if (err){
                      console.log(err.stack)
                      res.status(400).json(err)
                    } else {
                      console.log(result2.rows)
                      res.status(200).json(result2.rows)}
                  })
                }
                fetchPackages()
              }
            })
          }
          fetchUsers()
      }
    })
  }
  fetchRow1()
});

app.get('/driver/orderHistory', checkJwt, function(req, res){
  const fetchRow1 = async() =>{
    const claims = get_jwt_claims(req)
    const email = claims['https://example.com/email']
    await client.query(easyQB.getUsername(email), (err, result) => {
      console.log(result)
      if(err){
        res.status(400).json()
      } else {
        const uname = result.rows[0].username;
        console.log(result.rows[0].username);
        const fetchPackages = async() =>{
          await client.query(easyQB.getDriverHistory(uname), (err, result2) => {
            if (err){
              console.log(err.stack)
              res.status(400).json(err)
            } else {
              console.log(result2.rows)
              res.status(200).json(result2.rows)}
          })
        }
        fetchPackages()
      }
    })
  }
  fetchRow1()
});

app.get('/user/orderHistory', checkJwt, function(req, res){
  const fetchRow1 = async() =>{
    const claims = get_jwt_claims(req)
    const email = claims['https://example.com/email']
    await client.query(easyQB.getUserId(email), (err, result) => {
      console.log(result)
      if(err){
        res.status(400).json()
      } else {
        const uid = result.rows[0].userid;
        console.log(result.rows[0].userid);
        const fetchPackages = async() =>{
          await client.query(easyQB.getUserHistory(uid), (err, result2) => {
            if (err){
              console.log(err.stack)
              res.status(400).json(err)
            } else {
              console.log(result2.rows)
              res.status(200).json(result2.rows)}
          })
        }
        fetchPackages()
      }
    })
  }
  fetchRow1()
});

app.get('/user/currentOrders', checkJwt, function(req, res){
  const fetchRow1 = async() =>{
    const claims = get_jwt_claims(req)
    const email = claims['https://example.com/email']
    await client.query(easyQB.getUserId(email), (err, result) => {
      console.log(result)
      if(err){
        res.status(400).json()
      } else {
        const uid = result.rows[0].userid;
        console.log(result.rows[0].userid);
        const fetchPackages = async() =>{
          await client.query(easyQB.getUserOrders(uid), (err, result2) => {
            if (err){
              console.log(err.stack)
              res.status(400).json(err)
            } else {
              console.log(result2.rows)
              res.status(200).json(result2.rows)}
          })
        }
        fetchPackages()
      }
    })
  }
  fetchRow1()
});

app.get('/admin/company', checkJwt, function(req, res){
  const fetchRow1 = async() =>{
    const claims = get_jwt_claims(req)
    const email = claims['https://example.com/email']
    await client.query(easyQB.getUserId(email), (err, result) => {
      console.log(result)
      if(err){
        res.status(400).json()
      } else {
        const uid = result.rows[0].userid;
        const fetchCompany = async() =>{
          await client.query(easyQB.getAdminInfo(uid), (err, result2) => {
            if (err){
              console.log(err.stack)
              res.status(400).json(err)
            } else {
              console.log(result2.rows)
              res.status(200).json(result2.rows)}
          })
        }
        fetchCompany()
      }
    })
  }
  fetchRow1()
});

app.get('/admin/drivers', checkJwt, function(req, res){
  const fetchRow1 = async() =>{
    const claims = get_jwt_claims(req)
    const email = claims['https://example.com/email']
    await client.query(easyQB.getUserId(email), (err, result) => {
      console.log(result)
      if(err){
        res.status(400).json()
      } else {
        const uid = result.rows[0].userid;
        console.log(result.rows[0].userid);
          const fetchCompany = async() =>{
            await client.query(easyQB.getAdminCompany(uid), (err, result1) => {
              if (err){
                console.log(err.stack)
                res.status(400).json(err)
              } else {
                console.log(result1);
                const cname = result1.rows[0].companyname;
                const fetchDrivers = async() =>{
                  await client.query(easyQB.getDrivers(cname), (err, result2) => {
                    if (err){
                      console.log(err.stack)
                      res.status(400).json(err)
                    } else {
                      console.log(result2.rows)
                      res.status(200).json(result2.rows)}
                  })
                }
                fetchDrivers()
              }
            })
          }
          fetchCompany()
      }
    })
  }
  fetchRow1()
});

app.post('/admin/updateOrders', function(req, res) {
  const fetchRow = async() =>{
    console.log(req.body)
    await client.query(easyQB.updateOrders(req.body.packageid, req.body.packageassigned), (err, result) => {
      if (err){
        console.log(err.stack)
        res.status(400).json(err)
      } else {
        console.log(result.rows)
        res.status(200).json(result.rows)}
    })
  }
  fetchRow()
});

app.post('/user/review', function(req, res) {
  const fetchRow = async() =>{
    console.log(req.body)
    await client.query(easyQB.updateReview(req.body.packageid, req.body.review), (err, result) => {
      if (err){
        console.log(err.stack)
        res.status(400).json(err)
      } else {
        console.log(result.rows)
        res.status(200).json(result.rows)}
    })
  }
  fetchRow()
});

app.post('/driver/updateOrders', function(req, res) {
  const fetchRow = async() =>{
    console.log(req.body)
    await client.query(easyQB.updatePackage(req.body.packageid, req.body.packagestatus, req.body.packagelocation), (err, result) => {
      if (err){
        console.log(err.stack)
        res.status(400).json(err)
      } else {
        console.log(result.rows)
        res.status(200).json(result.rows)}
    })
  }
  fetchRow()
});

app.post('/api/placeOrder', function(req, res) {
  const fetchRow = async() =>{
    console.log(req.body)
    await client.query(easyQB.placeOrder(req.body.adminid, req.body.userid, req.body.price, req.body.trackingid, req.body.packagesource, req.body.packagedestination, req.body.packagelocation, req.body.packagespeed, req.body.packagetype, req.body.packagesize, req.body.packageweight, req.body.deadline, req.body.long, req.body.lat), (err, result) => {
      if (err){
        console.log(err.stack)
        res.status(400).json(err)
      } else {
        console.log(result.rows)
        res.status(200).json(result.rows)}
    })
  }
  fetchRow()
});

app.post('/admin/addServices', function(req, res) {
  const fetchRow1 = async() =>{
    console.log(req.body)
    const claims = get_jwt_claims(req)
    const email = claims['https://example.com/email']
    await client.query(easyQB.getUserId(email), (err, result) => {
      console.log(result)
      if(err){
        res.status(400).json()
      } else {
        const uid = result.rows[0].userid;
        console.log(result.rows[0].userid);
          const fetchUsers = async() =>{
            await client.query(easyQB.getAdmin(uid), (err, result1) => {
              if (err){
                console.log(err.stack)
                res.status(400).json(err)
              } else {
                console.log(result1);
                const aid = result1.rows[0].adminid;
                const addService = async() =>{
                  await client.query(easyQB.createService(req.body.pspeed, req.body.ptype, req.body.psize, req.body.pweight, req.body.price, aid), (err, result2) => {
                    if (err){
                      console.log(err.stack)
                      res.status(400).json(err)
                    } else {
                      console.log(result2.rows)
                      res.status(200).json(result2.rows)}
                  })
                }
                addService()
              }
            })
          }
          fetchUsers()
      }
    })
  }
  fetchRow1()
});

app.post('/admin/updateServices', function(req, res) {
  const fetchRow1 = async() =>{
    console.log(req.body)
    await client.query(easyQB.updateServices(req.body.id, req.body.pspeed, req.body.ptype, req.body.psize, req.body.pweight, req.body.price), (err, result2) => {
      if (err){
        console.log(err.stack)
        res.status(400).json(err)
      } else {
        console.log(result2.rows)
        res.status(200).json(result2.rows)
      }
    })
  }
  fetchRow1()
});

app.delete('/admin/deleteServices', function(req, res){
  const fetchRow1 = async() =>{
    console.log(req.body)
    await client.query(easyQB.deleteServices(req.body.id), (err, result2) => {
      if (err){
        console.log(err.stack)
        res.status(400).json(err)
      } else {
        console.log(result2.rows)
        res.status(200).json(result2.rows)
      }
    })
  }
  fetchRow1()
});

app.post('/api/me', checkJwt, function(req, res){
  const fetchRow = async() =>{
    await client.query(easyQB.updateUser(req.body.email, req.body.fname, req.body.lname, req.body.phone, req.body.address.streetAddress, req.body.address.city, req.body.address.state, req.body.address.zip, req.body.address.googlelink), (err, result) => {
      if(err){
        res.status(400).json(err.stack)
      } else {
        res.status(200).json(result.rows)
      }
    })
  }
  fetchRow()
});

app.post('/api/search', function(req, res) {
  const fetchRow = async() =>{
    console.log(req.body.queryValue)
    await client.query((req.body.queryValue), (err, result) => {
      if (err){
        console.log(err.stack)
        res.status(400).json(err)
      } else {
        console.log(result.rows)
        res.status(200).json(result.rows)}
    })
  }
  fetchRow()
});

app.listen(process.env.PORT || 5000);
