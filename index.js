const 
	diffFT  = require('diff-file-tree'),
	path = require("path"),
	fs   = require("fs"),
	fspr = fs.promises,
	drawFT = require("./draw-f-tree.js");

const 
	date = new Date(Date.now()),
	dateStr = 
		date.getFullYear() +       "-" +
		pS0(date.getMonth() + 1) + "-" +
		pS0(date.getDate()) +      "." +
		pS0(date.getHours()) +     "-" +
		pS0(date.getMinutes()) +   "-" +
		pS0(date.getSeconds());

const 
	argv = process.argv.map(v => v),
	o = {
		engine:  argv.shift(),
		script:  argv.shift(),
		dstRawP: argv.shift(), 
		srcPN:   process.cwd(),
		mixRaport: argv.includes("-mx") 
			|| argv.includes("-mix") 
			|| argv.includes("--mix"),
		sortRaport: argv.includes("-st") 
			|| argv.includes("-sort") 
			|| argv.includes("--sort"),
		backup: argv.includes("-bc") 
			|| argv.includes("-backup") 
			|| argv.includes("--backup"),
	};

if (test)
	setInterval(function(){}, 5 * 1000); // To debugging



// setInterval(function(){}, 5 * 1000); // To debugging

if (! o.dstRawP)
	printHelp();
else {

	// console.log(`o`, o);

	o.dstP     = path.isAbsolute(o.dstRawP) ? 
		o.dstRawP : 
		path.join(o.srcPN, o.dstRawP);
	o.srcName  = path.basename(o.srcPN);
	o.dstPN    = path.join(o.dstP, o.srcName);
	o.dstDifPN = o.dstPN + ".###";
	o.commitPN = path.join(o.dstDifPN, dateStr);

	(async function () {
		if (! fs.existsSync(o.dstP)) {
			console.log([
				``,
				`The path "${o.dstP}" is not exists.`,
				`Pleas set an existed path.`,
				``,
			].join("\n"));
			return;
		}

		console.log([
			``,
			`${(new Date(Date.now())).toString()}    ${dateStr}`,
			``,
			`it compares:`,
			`    ${o.srcPN}`,
			`with:`,
			`    ${o.dstPN}`,
			``,
		].join("\n"));

		if (! fs.existsSync(o.dstPN)) {
			if (o.backup) {
				await fspr.mkdir(o.dstPN).
				catch(console.error);
			} else {
				console.log([
					``,
					`The "${o.dstPN}" folder is not exists.`,
					`You may use flag "-bc" or "--backup",` + 
						` and the "${o.dstPN}" folder` + 
						` will be created autumatically.`,
					``,
				].join("\n"));
			}
		}

		const 
			timestamp = Date.now(),
			changes   = await diffFT.diff(o.srcPN, o.dstPN),
			ts2       = Date.now(),
			compareTime = getToMinSec((ts2 - timestamp) / 1000),
			sorted = sortByChange(changes),
			rootHeader = `${o.srcPN} (${o.dstPN})`

		console.log(drawFT.createText(changes, o.srcName));

		// setInterval(function(){}, 5 * 1000); // To debugging
	})()

	// console.log(`o`, o);
}

function sortByChange(changes) {
	const sorted = {
		add: [],
		mod: [],
		del: [],
	}
	for (let fso of changes) {
		sorted[fso.change].push(fso);
	}
	return sorted;
}

function getToMinSec(seconds) {
	var h, m, s, ms, rest = seconds, arr;
	[h, rest] = div(rest, 3600);
	[m, rest] = div(rest, 60);
	[s, rest] = div(rest, 1);
	ms = Math.round(rest * 1000);

	arr = [h, (""+m).padStart(2, "0"), (""+s).padStart(2, "0")];

	if (!arr[0])
		arr.shift();

	return arr.join(":") + "." + (""+ms).padStart(3, "0");

	function div(a, b) {
		var
			rest = a % b,
			n = (a - rest) / b;
		rest = Math.round(rest * 1000) / 1000;
		return [n, rest];
	}
}

function pS0(subj, len=2) {
	return subj.toString().padStart(len, "0");
}

function printHelp() {
	console.log([
		"",
		"    bcpdir <dst-path> [-bc | -bakcup | --backup]",
		"",
		"bcpdir <dst-path>          : Compare current folder with a folder,",
		"                              that hac the <dst-path> path, ",
		"                              and as name as the current folder.",
		"                              It path may be absolute or relative.",
		"",
		"-bc, -backup, --backup     : Apply changes to backup copy.",
		"",
	].join("\n"));
}

function pr(x, name="") {
	return function (...args) {
		return new Promise((rs, rj) => {
			const callb = (e,r) => e ? rj(e) : rs(r)
			if (name)
				x[name](...args, callb);
			else
				x(...args, callb);
		});
	}
}
