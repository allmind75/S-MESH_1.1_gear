var SAAgent = null;
var SASocket = null;
var CHANNELID = 117;
var cnt = 1;
var ProviderAppName = "SmeshProvider";
var HrmCheck = false;
var Location;
var click_flag = true;
var connect_flag = true;
var noSearch_flag = true;
var sos_flag = true;
var message_flag = 0;

// 화면에 띄우기
function createHTML(log_string) {
	var log = document.getElementById('resultBoard');
	log.innerHTML = log_string + "<br>" + log.innerHTML;
}

function addLine() {
	var node = document.createElement("LI");
	var textnode = document.createTextNode("__________________________");
	node.appendChild(textnode);

	var list = document.getElementById("mList");
	// document.getElementById("mList").appendChild(node);
	list.insertBefore(node, list.childNodes[0]);
}
function addList(str) {
	var node = document.createElement("LI");
	var textnode = document.createTextNode(str);
	node.appendChild(textnode);

	var list = document.getElementById("mList");
	list.insertBefore(node, list.childNodes[0]);

}

// Start HRM
function startHrm() {
	webapis.motion.start("HRM", onchangedCB);
}

function onerror(err) {
	console.log("err [" + err + "]");
	connect_flag = false;
	tau.openPopup("#ToastNotFind");
}

var agentCallback = {
	onconnect : function(socket) {
		SASocket = socket;
		// alert("Smesh Connection established with RemotePeer");
		// createHTML("startConnection");
		tau.openPopup("#ToastConnect")
		tau.closePopup();
		// noSearch_flag = true;

		SASocket.setSocketStatusListener(function(reason) {
			console.log("Service connection lost, Reason : [" + reason + "]");
			disconnect();
		});

		fetch();
	},
	onerror : onerror
};

var peerAgentFindCallback = {
	onpeeragentfound : function(peerAgent) {
		try {
			if (peerAgent.appName == ProviderAppName) {
				SAAgent.setServiceConnectionListener(agentCallback);
				SAAgent.requestServiceConnection(peerAgent);
			} else {
				alert("Not expected app!! : " + peerAgent.appName);
			}
		} catch (err) {
			console
					.log("exception [" + err.name + "] msg[" + err.message
							+ "]");
		}
	},
	onerror : onerror
}

function onsuccess(agents) {
	
	try {
		if (agents.length > 0) {
			SAAgent = agents[0];
			SAAgent.setPeerAgentFindListener(peerAgentFindCallback);
			SAAgent.findPeerAgents();
		} else {
			alert("Not found SAAgent!!");
		}
	} catch (err) {
		console.log("exception [" + err.name + "] msg[" + err.message + "]");
	}
}

function connect() {

	if (SASocket) {
		// alert('Already connected!');
		tau.openPopup("#ToastReConnect");
		return false;
	}
	try {
		webapis.sa.requestSAAgent(onsuccess, function(err) {
			console.log("err [" + err.name + "] msg[" + err.message + "]");
			connect_flag = false;
			tau.openPopup("#ToastNotFind");
			setTimeout(tau.closePopup(), 1000);

		});
	} catch (err) {
		console.log("exception [" + err.name + "] msg[" + err.message + "]");
	}

}

function disconnect() {
	webapis.motion.stop("HRM");

	cnt = 1;
	try {
		if (SASocket != null) {
			SASocket.close();
			SASocket = null;
			// createHTML("closeConnection");
			tau.openPopup("#ToastDisConnect");
			setTimeout(tau.closePopup(), 1000);

		}
	} catch (err) {
		console.log("exception [" + err.name + "] msg[" + err.message + "]");
	}
}

// Receive Android
function onreceive(channelId, data) {

	if (data[0] == 'G') {
		Location = data.substring(1);
		document.getElementById("Location").innerHTML = Location;
	} else if (data[0] == 'H') {
		startHrm();
	} else {
		addList(data);
		message_flag++;
		
		if(message_flag == 2) {
			addLine();
			message_flag = 0;
		}
			
	}
	console.log("Receive Data : " + channelId + "||" + data);

}

// fetch, SASocket.sendData() 사용해 android로 전송
function fetch() {

	try {
		SASocket.setDataReceiveListener(onreceive);

	} catch (err) {
		console.log("exception [" + err.name + "] msg[" + err.message + "]");
	}
}

// HRM CallBack
function onchangedCB(hrmInfo) {

	if (hrmInfo.heartRate > 0) {

		// 위험상태
		if (hrmInfo.heartRate > 85 || hrmInfo.heartRate < 50) {
			document.getElementById("HeartState").innerHTML = "위험";
			document.getElementById("HeartRate").innerHTML = hrmInfo.heartRate
					+ " bpm";
			// Send Android, 위험상태

		} else {
			document.getElementById("HeartState").innerHTML = "정상";
			document.getElementById("HeartRate").innerHTML = hrmInfo.heartRate
					+ " bpm";
			// Send Adnroid, 정상상태
		}

		SASocket.sendData(CHANNELID, "H" + hrmInfo.heartRate); // Send Android
		webapis.motion.stop("HRM");

		cnt = 0;
	} else {

		document.getElementById("HeartRate").innerHTML = "측정중...";

		// SASocket.sendData(CHANNELID, "H" + "-1"); // Send Android
		if (cnt > 500) {
			webapis.motion.stop("HRM");
			console.log("Stop HRM --" + cnt);
		}
		console.log("No HRM Data" + "--" + cnt);
		cnt++;
	}
}

function btnClick(btn) {

	var property = document.getElementById(btn);
	var i;
	console.log("btnClick");
	if (click_flag) {
		console.log("if");
		connect();
		click_flag = false;
		for(i=0 ; i<10000; i++);
		if (connect_flag) {
			property.style.backgroundColor = "#b30f58";
			document.getElementById(btn).innerHTML = "해 제";
		}

	} else {
		if(!connect_flag)
			tau.openPopup("#ToastNotFind");
		click_flag = true;
		console.log("else");
		disconnect()
		property.style.backgroundColor = "#3d94f6";
		document.getElementById(btn).innerHTML = "연 결";

	}
}

function pageScroll() {
	console.log("Page Scroll");
	window.scrollTo(0,0); // horizontal and vertical scroll increments
	//scrolldelay = setTimeout('pageScroll()',100); // scrolls every 100 milliseconds
}

function sosMessage() {
	//pageScroll();
	console.log("sos");
	if(connect_flag)
		tau.openPopup("#ToastSOS");
	else
		tau.openPopup("#ToastNotFind");
	
	if(sos_flag) {
		SASocket.sendData(CHANNELID, "S");
		sos_flag = false;
	} else {
		SASocket.sendData(CHANNELID, "P");
		sos_flag = true;
	}
	
}


window.onload = function() {
	// add eventListener for tizenhwkey
	document.addEventListener('tizenhwkey', function(e) {
		if (e.keyName == "back")
			tizen.application.getCurrentApplication().exit();
	});

};
