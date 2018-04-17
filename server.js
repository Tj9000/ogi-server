var http=require('http'),
fs=require('fs'),
url=require('url'),
qs=require('querystring');
const EventEmitter = require('events');
var myEmitter = new EventEmitter();
const dbConfig = require('./cred.js')
var sql=require('mysql');
var connection = sql.createConnection({
	host	: 'localhost',
	user	: dbConfig.dbUser,
	password: dbConfig.dbPw,
	database: dbConfig.database,
	multipleStatements: true  
});
connection.connect(function(err) {
  if (err) {
    console.error('error connecting: ' + err.stack);
    return;
  }

  console.log('connected as id ' + connection.threadId);
});

var port=9090;

var server=http.createServer(incomeHandler);
server.listen(port,function(){
	console.log("Server started. port: "+port);
});


var crypto = require('crypto'),
    algorithm = 'aes-256-ctr',
    password = 'd6F3Efeq';
function encrypt(text){
  var cipher = crypto.createCipher(algorithm,password)
  var crypted = cipher.update(text,'utf8','hex')
  crypted += cipher.final('hex');
  return crypted;
}
function decrypt(text){
  var decipher = crypto.createDecipher(algorithm,password)
  var dec = decipher.update(text,'hex','utf8')
  dec += decipher.final('utf8');
  return dec;
}

function Authentic(ip){
	if(ip!='undefined' && decrypt(ip)=='securePassword')
		return true;
	else
		return false;
}

function incomeHandler(request,response){
	var incomeUrl=url.parse(request.url).pathname;
	// console.log(request);
	console.log(incomeUrl);
	// console.log(url.parse(request.url));
	if(incomeUrl=== '/' || incomeUrl==="/index"){   	//Default redirects to index page
		incomeUrl="/login.html";
	}
	else if(incomeUrl==='/server.js'){
		incomeUrl='/accessDenied.html';
	}
	if(request.method === 'GET'){
		console.log("GET request");
		getReq(request,response,incomeUrl);				// handle GET requests
	}
	else if(request.method === 'POST'){
		console.log("POST request");
		postReq(request,response,incomeUrl); 			//Handle POST requests
	}
}

function getReq(request,response,incomeUrl){

	if(incomeUrl==='/Authinticitite'){
		var query=qs.parse(url.parse(request.url).query);
		let pw = query.TN;
		if(pw=='rinnegan'){
				response.writeHead(200,{'Content-Type':'text/html'});
				response.write(encrypt('securePassword'));
				response.end();
		}
		else{
				response.writeHead(400);
				// response.write();
				response.end();
		}
	}
	else if(incomeUrl==='/getParticipants'){
		var query=qs.parse(url.parse(request.url).query);
		console.log(query);
			getParticipants(query,function(dataJ){
				// console.log(dataJ);
				response.writeHead(200,{'Content-Type':'application/JSON'});
				response.write(JSON.stringify(dataJ));
				response.end();
			});
	}
	else if(incomeUrl==='/appendParticipants'){
		var query=qs.parse(url.parse(request.url).query);
		if(Authentic(query.Token)){
		console.log(query);
			insertParticipant(query,function(status,dataJ){
				// console.log(dataJ);
				response.writeHead(status,{'Content-Type':'application/JSON'});
				response.write(JSON.stringify(dataJ));
				response.end();
			});
		}
		else{
			response.writeHead(401)
			response.end();
		}
	}
	else if(incomeUrl==='/vote'){
		var query=qs.parse(url.parse(request.url).query);
		console.log(query);
			castVote(query,function(dataJ){
				// console.log(dataJ);
				response.writeHead(200,{'Content-Type':'application/JSON'});
				response.write(JSON.stringify(dataJ));
				response.end();
			});
	}
	else if(incomeUrl==='/getResult'){
		// var query=qs.parse(url.parse(request.url).query);
		// console.log(query);
			getResult(function(dataJ){
				// console.log(dataJ);
				response.writeHead(200,{'Content-Type':'application/JSON'});
				response.write(JSON.stringify(dataJ));
				response.end();
			});
	}
	
	else{
		var filepath = process.cwd() +'/views'+ incomeUrl;
			console.log(filepath);
			fs.exists(filepath,function(ExistFlag){			//Check if file exists
					if(ExistFlag){
						fs.readFile(filepath,function(err,file){		//check if there is any error reading the file
							if(!err){
								response.end(file);
							}
							else{
								response.writeHead(404);
								response.end();
						
								console.log("error reading the File");
							}
						});
					}
					else{
						response.writeHead(404);
						response.write("error 404. not found");
						response.end();
						console.log("File doesnt exist");
					}
			});
	}	
}


function getParticipants(query,callback){
	var inserts=[query.eventID];
	connection.query("select * from participants",inserts,function(err,result,field){
		// console.log(result);
		console.log(result);
		if(err){
			callback(err);
		}
		else{
			callback(result);
		}
	});
}
function getResult(callback){
	// var inserts=[query.eventID];
	connection.query("SELECT eventID,COUNT(*) as count FROM votes GROUP BY eventID",[],function(err,result,field){
		// console.log(result);
		console.log(result);
		if(err){
			callback(err);
		}
		else{
			callback(result);
		}
	});
}

function castVote(query, callback){
	var inserts=[query.eventID];
	connection.query("insert into votes(eventID, time_) values(?,SYSDATE())",inserts,function(err,result,field){
		// console.log(result);
		console.log(field);
		if(err){
			callback(err);
		}
		else{
			callback(result);
		}
	});	
}
function insertParticipant(query, callback){
	var inserts=[query.eventID,query.teamname,query.details];
	connection.query("insert into participants(id,teamname,details) values(?,?,?)",inserts,function(err,result,field){
		// console.log(result);
		console.log(field);
		if(err){
			callback(409,err);
		}
		else{
			callback(200,result);
		}
	});	
}
