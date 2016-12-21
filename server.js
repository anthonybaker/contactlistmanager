var express = require("express");
var path = require("path");
var bodyParser = require("body-parser");
var mongodb = require("mongodb");
var ObjectID = mongodb.ObjectID;

// create a global scope variable for our contacts collection
var CONTACTS_COLLECTION = "contacts";

// define the express app server , but instantiate only after connecting to the db
var app = express();
app.use(express.static(__dirname + "/public"));
app.use(bodyParser.json());

// Create a database variable outside of the database connection callback 
// so we can reuse the connection pool in your app.
var db;

// Connect to the database before starting the application server.
mongodb.MongoClient.connect(process.env.MONGODB_URI, function (err, database) {
  if (err) {
    console.log(err);
    process.exit(1);
  }

  // Save database object from the callback for reuse.
  db = database;
  console.log("Database connection ready");

  // Initialize the app.
  var server = app.listen(process.env.PORT || 8080, function () {
    var port = server.address().port;
    console.log("App now running on port", port);
  });
});

// CONTACTS API ROUTES BELOW

// Generic error handler used by all endpoints.
function handleError(res, reason, message, code) {
  console.log("ERROR: " + reason);
  res.status(code || 500).json({"error": message});
}

/*  "/contacts"
 *    GET: finds all contacts
 *    POST: creates a new contact
 */

app.get("/contacts", function(req, res) {
  db.collection(CONTACTS_COLLECTION).find({}).toArray(function(err, docs) {
    if (err) {
      handleError(res, err.message, "Failed to get contacts.");
    } else {
      res.status(200).json(docs);
    }
  });
});

app.post("/contacts", function(req, res) {
  var newContact = req.body;
  newContact.createDate = new Date();

  if (!(req.body.firstName || req.body.lastName)) {
    handleError(res, "Invalid user input", "Must provide a first or last name.", 400);
  }

  db.collection(CONTACTS_COLLECTION).insertOne(newContact, function(err, doc) {
    if (err) {
      handleError(res, err.message, "Failed to create new contact.");
    } else {
      res.status(201).json(doc.ops[0]);
    }
  });
});

/*  "/contacts/:id"
 *    GET: find contact by id
 *    PUT: update contact by id
 *    DELETE: deletes contact by id
 */

app.get("/contacts/:id", function(req, res) {
  db.collection(CONTACTS_COLLECTION).findOne({ _id: new ObjectID(req.params.id) }, function(err, doc) {
    if (err) {
      handleError(res, err.message, "Failed to get contact");
    } else {
      res.status(200).json(doc);
    }
  });
});

app.put("/contacts/:id", function(req, res) {
  var updateDoc = req.body;
  delete updateDoc._id;

  db.collection(CONTACTS_COLLECTION).updateOne({_id: new ObjectID(req.params.id)}, updateDoc, function(err, doc) {
    if (err) {
      handleError(res, err.message, "Failed to update contact");
    } else {
      res.status(204).end();
    }
  });
});

app.delete("/contacts/:id", function(req, res) {
  db.collection(CONTACTS_COLLECTION).deleteOne({_id: new ObjectID(req.params.id)}, function(err, result) {
    if (err) {
      handleError(res, err.message, "Failed to delete contact");
    } else {
      res.status(204).end();
    }
  });
});

app.get("/fbmsgr/contacts", function(req, res) {
  db.collection(CONTACTS_COLLECTION).find({}).toArray(function(err, docs) {
    if (err) {
      handleError(res, err.message, "Failed to get contacts.");
    } else {

      var count = 0;
      var fbContacts = [];
      fbContact = "";

      docs.forEach(function(doc) {

        fbContact = {
          "title": doc.firstName + " " + doc.lastName,
          "image_url": "http://res.cloudinary.com/abakerp/image/upload/v1480872817/Backgrounds_The_man_in_black_tie_zq8mam.jpg",
          "item_url": "http://www.rga.com",
          "subtitle": doc.email,
          "buttons": [
            {
              "type": "web_url",
              "url": "http://www.rga.com",
              "title": "Open URL"
            },
            {
              "type": "postback",
              "title": "Select",
              "payload": doc._id
            }
          ]
        }

        console.log("fbContact JSON: " + JSON.stringify(fbContact));        

        fbContacts.push(fbContact);  

        console.log("Added contact to fbContacts array. Count: " + fbContacts.length + " Array: " + JSON.stringify(fbContacts));
      });

      fbTemplate = {
        "fbmsgrTemplate": {
          "type": "template",
          "payload": {
            "template_type": "generic",
            "elements":
              /* Here goes the list of contacts */
              fbContacts
          }
        }
      }

      console.log("fbTemplate JSON: " + JSON.stringify(fbTemplate));

      res.status(200).json(fbTemplate);
    }
  });
});


/*  API Endpoints Returning results in Facebook Messenger Template Structure */
app.get("/fbmsgr/contacts/:id", function(req, res) {
  db.collection(CONTACTS_COLLECTION).findOne({ _id: new ObjectID(req.params.id) }, function(err, doc) {
    if (err) {
      handleError(res, err.message, "Failed to get contact");
    } else {

      fbTemplate = {
        "fbmsgrTemplate": {
          "type": "template",
          "payload": {
            "template_type": "generic",
            "elements": [
              {
                "title": doc.firstName + " " + doc.lastName,
                "image_url": "http://res.cloudinary.com/abakerp/image/upload/v1480872817/Backgrounds_The_man_in_black_tie_zq8mam.jpg",
                "item_url": "http://www.rga.com",
                "subtitle": doc.email,
                "buttons": [
                  {
                    "type": "web_url",
                    "url": "http://www.rga.com",
                    "title": "Open URL"
                  },
                  {
                    "type": "postback",
                    "title": "Select",
                    "payload": doc._id
                  }
                ]
              }
            ]
          }
        }
      }

      res.status(200).json(fbTemplate);
    }
  });
});


/*  API.ai webhook endpoint */
app.post("/webhook", function(req, res) {
  
  //console.log('Request headers: ' + JSON.stringify(req.headers));
  //console.log('Request body: ' + JSON.stringify(req.body));

  var action = req.body.result.action;
  console.log('Request Action: ' + action);

  if (action == "getcontacts") {
    apiaiGetContacts(res);
  }
  else {

    // fullfillment logic
    resTemplate = {
        "speech": "got the message, here's an answer from the webhook",
        "displayText": "got the message, but can't understand the action",
        "source": "Contacts-Manager-Webhook" 
    }    

    console.log('Response body: ' + JSON.stringify(resTemplate));

    res.setHeader('content-type', 'application/json');
    res.status(200).json(resTemplate);
  }

});

// Get Contacts funtion for Api.ai agent
function apiaiGetContacts (res) {

  db.collection(CONTACTS_COLLECTION).find({}).toArray(function(err, contacts) {
    if (err) {
      handleError(res, err.message, "Failed to get contacts.");
    } else {

      console.log("Contacts retrieved: " + contacts.toString());

      // Generate the Facebook template structure for API.ai agent
      var count = 0;
      var fbContacts = [];
      fbContact = "";

      contacts.forEach(function(contact) {

        fbContact = {
          "title": contact.firstName + " " + contact.lastName,
          "image_url": "http://res.cloudinary.com/abakerp/image/upload/v1480872817/Backgrounds_The_man_in_black_tie_zq8mam.jpg",
          "item_url": "http://www.rga.com",
          "subtitle": contact.email,
          "buttons": [
            {
              "type": "web_url",
              "url": "http://www.rga.com",
              "title": "Open URL"
            },
            {
              "type": "postback",
              "title": "Select",
              "payload": contact._id
            }
          ]
        }

        fbContacts.push(fbContact);  

      });

      fbTemplate = {
        "attachment": {
          "type": "template",
          "payload": {
            "template_type": "generic",
            "elements":
              /* Here goes the list of contacts */
              fbContacts
          }
        }
      }
        
      slackTemplate = {
        "text": "got the message, here's an answer from the webhook",
        "attachments": [
            {
                "fallback": "John Smith - R/GA Employee - http://res.cloudinary.com/abakerp/image/upload/v1480872817/Backgrounds_The_man_in_black_tie_zq8mam.jpg",
                "title": "John Smith",
                "title_link": "https://www.rga.com",
                "text": "R/GA Employee",
                "image_url": "http://res.cloudinary.com/abakerp/image/upload/v1480872817/Backgrounds_The_man_in_black_tie_zq8mam.jpg",
                "color": "#764FA5"
            }
        ]
      }

      resTemplate = {
        "speech": "got the message, here's an answer from the webhook",
        "displayText": "got the message, here's an answer from the webhook",
        "source": "Contacts-Manager-Webhook",
        "data": {
          "facebook": {
            fbTemplate
          },
          "slack":{
            slackTemplate
          }
        }
      }

      console.log("API.ai Response Body JSON: " + JSON.stringify(fbTemplate));

      res.setHeader('content-type', 'application/json');
      res.status(200).json(fbTemplate);
    }
  });
}


