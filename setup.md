In order to get everything running:

# Run statement-blocks-microservice
cd microservices/statement-block-service 
python3 app.py

# Run file server
cd microervices/file-server/
python3 fileserver.py

#Run auth server
cd microservices/auth-server
node auth-server.js

# Run ngrok
ngrok http http://localhost:9909
