setInterval(function(){}, 5 * 1000); // To debugging

console.log("\n\n",(new Date(Date.now()).toString()));

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
		engine: argv.shift(),
		script: argv.shift(),
		srcPN:  argv.shift(),
		dstP:   argv.shift(), 
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

o.srcName  = path.basename(o.srcPN);
o.dstPN    = path.join(o.dstP, o.srcName);
o.dstDifPN = o.dstPN + ".###";
o.commitPN = path.join(o.dstDifPN, dateStr);

console.log(`o`, o);

function pS0(subj, len=2) {
	return subj.toString().padStart(len, "0");
}