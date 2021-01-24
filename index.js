const 
	dft  = require('diff-file-tree'),
	path = require("path"),
	fs   = require("fs"),
	fspr = fs.promises;

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

	console.log(`o`, o);

	o.dstP     = path.isAbsolute(o.dstRawP) ? 
		o.dstRawP : 
		path.join(o.srcPN, o.dstRawP);
	o.srcName  = path.basename(o.srcPN);
	o.dstPN    = path.join(o.dstP, o.srcName);
	o.dstDifPN = o.dstPN + ".###";
	o.commitPN = path.join(o.dstDifPN, dateStr);



	(async function () {
		console.log(
			"\n\n",(new Date(Date.now()).toString()), "  ", dateStr, "\n",
			"it compares:\n", 
			"    ", o.srcPN, "\n",
			"with:\n", 
			"    ", o.dstPN
		);

		// setInterval(function(){}, 5 * 1000); // To debugging
	})()

	console.log(`o`, o);
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