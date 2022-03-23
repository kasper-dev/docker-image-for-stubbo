#!/usr/bin/env node

var startupCmd = "";
const fs = require("fs");
fs.writeFile("latest.log", "", (err) => {
	if (err) console.log("Callback error in appendFile:" + err);
});

var args = process.argv.splice(process.execArgv.length + 2);
for (var i = 0; i < args.length; i++) {
	if (i === args.length - 1) {
		startupCmd += args[i];
	} else {
		startupCmd += args[i] + " ";
	}
}

if (startupCmd.length < 1) {
	console.log("Error: Please specify a startup command.");
	process.exit();
}

const seenPercentage = {};

function filter(data) {
	const str = data.toString();
	if (str.startsWith("Loading Prefab Bundle ")) { // Rust seems to spam the same percentage, so filter out any duplicates.
		const percentage = str.substr("Loading Prefab Bundle ".length);
		if (seenPercentage[percentage]) return;

		seenPercentage[percentage] = true;
	}

	console.log(str);
}

var exec = require("child_process").exec;
console.log("Starting Rust...");

var exited = false;

const gameProcess = exec(`./RustDedicated ${startupCmd}`); //RustDedicated ${startupCmd}
gameProcess.stdout.on('data', filter);
gameProcess.stderr.on('data', filter);
gameProcess.on('exit', function (code, signal) {
	if (signal) {
		console.log(signal)
	}
	exited = true;

	if (code) {
		console.log("Main game process exited with code " + code);
		// process.exit(code);
	}
});
function initialListener(data) {
	const command = data.toString().trim();
	if (command === 'quit') {
		gameProcess.kill('SIGTERM');
	} else {
		console.log('Unable to run "' + command + '" due to RCON not being connected yet.');
	}
}
process.stdin.resume();
process.stdin.setEncoding("utf8");
process.stdin.on('data', initialListener);

process.on('exit', function (code) {
	if (exited) return;

	console.log("Received request to stop the process, stopping the game...");
	gameProcess.kill('SIGTERM');
});

var waiting = true;
var poll = function () {
	function createPacket(command) {
		var packet = {
			Identifier: -1,
			Message: command,
			Name: "WebRcon"
		};
		return JSON.stringify(packet);
	}

	var WebSocket = require("ws");
	var ws = new WebSocket("ws://127.0.0.1:28016/docker");

	ws.on("open", function open() {
		console.log("Connected to RCON. Generating the map now. Please wait until the server status switches to \"Running\".");
		waiting = false;
	});


	ws.on("error", function (err) {
		waiting = true;
		console.log(`Waiting for RCON to come up...` + err);
		setTimeout(poll, 5000);
	});

	ws.on("close", function () {
		if (!waiting) {
			console.log("Connection to server closed.");

			exited = true;
			process.exit();
		}
	});
}
poll();