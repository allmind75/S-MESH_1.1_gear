//Date
var current_dt = tizen.time.getCurrentDateTime();
//Battery
var battery = navigator.battery || navigator.webkitBattery || navigator.mozBattery;

window.addEventListener('load', function(e)
{
	document.querySelector('#Date').textContent = current_dt.toLocaleDateString();
	document.querySelector('#Batterylevel').textContent = Math.floor(battery.level * 100) + '%';
			
	
}, false);
