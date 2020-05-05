# MediView Medical Monitor Viewer Backend

## install
```shell
npm i
```
## run
### requirements
mongodb
for testing: 
```console
docker run --rm -it -p 27017:27017 --name mongo mongo:4.2
```
```console
node app
```


## configs:
configs from environment
|environment|description|default|
|-----------|-----------|-------|
|PORT|listen port of the server|3000|
|DB_CONNECTION|mongodb connection string|```mongodb://localhost/test```|


