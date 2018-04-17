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


function incomeHandler(request,response){
	var incomeUrl=url.parse(request.url).pathname;
	// console.log(request);
	console.log(incomeUrl);
	// console.log(url.parse(request.url));
	if(incomeUrl=== '/' || incomeUrl==="/index"){   	//Default redirects to index page
		incomeUrl="/index.html";
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

	if(incomeUrl==='/getEveList'){
		// var query=qs.parse(url.parse(request.url).query);
		// console.log(query);
			getEveList(query,function(dataJ){
				// console.log(dataJ);
				response.writeHead(200,{'Content-Type':'application/JSON'});
				response.write(JSON.stringify(dataJ));
				response.end();
			});
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
	
	else if(incomeUrl==='/Authinticitite'){
		var query=qs.parse(url.parse(request.url).query);
		console.log(query);
		AuthUser(query,function(stat,data){
			response.writeHead(stat);
			if(stat!=200){
				response.end();
			}
			else{
				response.writeHead(200,{'Content-Type':'text/plain'});
				console.log({"PreLvl":data,"UserID":query.Uid,"UserPW":query.pw});
				response.write(encrypt(JSON.stringify({"PreLvl":data,"UserID":query.Uid,"UserPW":query.pw})));
				response.end();
			}
		});
	}

	else{
		var filepath = process.cwd() + incomeUrl;
			// console.log(filepath);
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

function getEveList(query,callback){
	// var inserts=[query.name];
	connection.query("select * from event",function(err,result,field){
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

function getParticipants(query,callback){
	var inserts=[query.eventID];
	connection.query("select * from participants where eventID=?",inserts,function(err,result,field){
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
	var inserts=[query.voterID,query.eventID,query.participantID];
	connection.query("insert into votes values(?,?,?)",inserts,function(err,result,field){
		// console.log(result);
		console.log(err);
		console.log(result);
		console.log(field);
		if(err){
			callback(err);
		}
		else{
			callback(result);
		}
	});	
}

function AuthUser(queryJ,callback){
	var inserts=[queryJ.Uid,queryJ.pw];
	function CBroll(err){
			console.log(err);
			callback(400,"Failed");
	}
	connection.beginTransaction(function(err){
		if(err){
			callback("Post UnSuccessful",404,"Transaction failed to initiate");
		}
		else{
			connection.query("set @status=0",function(err,result){
				if(err)
					return connection.rollback(CBroll(err));
			});

			connection.query("call getUSER(?,?,@status)",inserts,function(err,result){
				if(err)
					return connection.rollback(CBroll(err));
			});

			connection.query("select PreLvl,@status as stat from Users where UserID=\""+queryJ.Uid+"\"",function(err,result,field){
				if(err)
					return connection.rollback(CBroll(err));
				else{
					console.log(result);
					connection.commit(function(err){
						if(err){
							callback("Post UnSuccessful",400,"Commit Failed");
						}
						else{
							if( result.length==0 || result[0].stat==0)
								callback(201,"X");
							else
								callback(200,result[0].PreLvl);
						}
					});	
				}
			});	
		}
	});
}

