window.onload=function(){
	document.getElementById('mainDiv').addEventListener('keydown',function(e){
		if(e.key=='Enter'){
		 Login();
		}
	});
}
function Login() {
	var userPw= document.getElementById('UserLoginTN').value;
	var login=new XMLHttpRequest;
	Session.clear('userLogin');
	login.open('GET','/Authinticitite?TN='+userPw,true);
	login.send();
	login.onreadystatechange=function(){
		if(login.readyState==4){
			if(login.status==200){
				console.log("ok");
				Session.set("userLogin",login.responseText);
				window.location.pathname='/index.html';
			}
			else{
				console.log("Not ok");
				alert('Invalid Credentials!');
				
				// document.getElementById('UserLoginPw').value;
			}
		}
	}
}