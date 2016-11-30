CURL Commands to test ContactList API endpoints:
(make sure to use a Json Linter or Json formatter to make sure JSON content is correct)
https://jsonformatter.curiousconcept.com/

POST - Add New Contact
curl -H "Content-Type: application/json" -d '{"firstName":"John", "lastName":"Smith", "email":"support@rga.com","phone":{"mobile":"+ 44 7711 111 111", "work":"+44 222 111 111"},"twitterHandle":"@johnsmith", "address":"Shoreditch, London, ECR1 4 AB"}' http://contactsmanager2016.herokuapp.com/contacts

GET - Get all existing contacts
curl -X GET "http://contactsmanager2016.herokuapp.com/contacts"

GET - Get a specific contact
curl -X GET "http://contactsmanager2016.herokuapp.com/contacts/583f49b1d8bd8200119717ff"

DELETE - Delete a specific contact
curl -X DELETE "http://contactsmanager2016.herokuapp.com/contacts/583f49b1d8bd8200119717ff"

PUT - Update a specific contact
curl -X PUT -H "Content-Type: application/json" -d '{"firstName":"Updated", "lastName":"Contact", "email":"support@rga.com","phone":{"mobile":"+ 44 7711 111 111", "work":"+44 222 111 111"},"twitterHandle":"@johnsmith", "address":"Shoreditch, London, ECR1 4 AB"}' http://contactsmanager2016.herokuapp.com/contacts/583f49fdd8bd820011971800