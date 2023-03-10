const 
	diffFT  = require('diff-file-tree'),
	path    = require("path"),
	fs      = require("fs"),
	fspr    = fs.promises,
	cliP    = require("cli-progress"),
	drawFT  = require("./draw-f-tree.js");

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
	};
while (argv.length) {
	let arg = argv.shift();
	if (["-mix", "--mix"].includes(arg))
		o.mixReport = arg;
	else if (["-sort", "--sort"].includes(arg))
		o.sortReport = arg;
	else if (["-bc", "-backup", "--backup"].includes(arg))
		o.backup = arg;
	else {
		console.log("\n\n", `Invalid argument "${arg}"`, "\n\n");
		throw new Error(`Invalid argument of command line "${arg}"`);
	}
}

const failedChanges = [];

if ("test" in global && test) {
	setInterval(function(){}, 5 * 1000); // To debugging
	console.log("\n");
	for (let i in o) 
			console.log(i.padStart(20), ":", o[i]);
}



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
	o.commonJsonLogPN = path.join(o.dstDifPN, "log.json");

	if ("test" in global && test) {
		console.log("\n");
		for (let i in o) 
			console.log(i.padStart(20), ":", o[i]);
	}

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
						` will be created automatically.`,
					``,
				].join("\n"));
				return;
			}
		}

		const 
			timestamp   = Date.now(),
			changes     = await diffFT.diff(o.srcPN, o.dstPN),
			ts2         = Date.now(),
			compareTime = getToMinSec((ts2 - timestamp) / 1000),
			sorted      = sortByChange(changes),
			rootHeader  = `${o.srcPN} (${o.dstPN})`

		// console.log(drawFT.createText(changes, o.srcName));

		if (o.sortReport) {
			console.log([
				``,
				`Added '+' ${sorted.add.length}`,
				drawFT.createText(sorted.add, o.srcName),
				`Deleted '-' ${sorted.del.length}`,
				drawFT.createText(sorted.del, o.srcName),
				`Modified '!' ${sorted.mod.length}`,
				drawFT.createText(sorted.mod, o.srcName),
			].join("\n"));
		} else {
			console.log([
				``,
				`All changes : ${changes.length}`,
				drawFT.createText(changes, o.srcName),
			].join("\n"));
		}

		console.log([
			`Compare time : ${compareTime}`,
			``,
		].join("\n"));

		if (100 < changes.length) {
			console.log([
				`${(new Date(Date.now())).toString()}    ${dateStr}`,
				`Compare time : ${compareTime}`,
				` All changes : ${changes.length}`,
				`     add '+' : ${sorted.add.length}`,
				`     del '-' : ${sorted.del.length}`,
				`     mod '!' : ${sorted.mod.length}`,
				``,
			].join("\n"));
		}

		if (o.backup) {
			console.log("Creating logs ...");
			const 
				txtLogPN  = path.join(o.commitPN, "log.txt"),
				jsonLogPN = path.join(o.commitPN, "log.json"),
				errLogPN  = path.join(o.commitPN, "error-log.txt"),
				modPath   = path.join(o.commitPN, "modified"),
				delPath   = path.join(o.commitPN, "deleted");

			if (! fs.existsSync(o.dstDifPN))
				await fspr.mkdir(o.dstDifPN).catch(console.error);

			await fspr.mkdir(o.commitPN).catch(console.error);

			const txtLogDs = await fspr.open(txtLogPN, "w");
			txtLogDs.write([
				`${(new Date(Date.now())).toString()}    ${dateStr}`,
				`Compare time : ${compareTime}`,
				` All changes : ${changes.length}`,
				`     add '+' : ${sorted.add.length}`,
				`     del '-' : ${sorted.del.length}`,
				`     mod '!' : ${sorted.mod.length}`,
				``,
				`Added '+' ${sorted.add.length}`,
				drawFT.createText(sorted.add, o.srcName),
				`Deleted '-' ${sorted.del.length}`,
				drawFT.createText(sorted.del, o.srcName),
				`Modified '!' ${sorted.mod.length}`,
				drawFT.createText(sorted.mod, o.srcName),
			].join("\r\n"));
			txtLogDs.close();

			const jsonLogDs = await fspr.open(jsonLogPN, "w");
			jsonLogDs.write(JSON.stringify({
				dataTime: dateStr,
				summary: {
					all: changes.length,
					add: sorted.add.length,
					del: sorted.del.length,
					mod: sorted.mod.length,
				},
				add: sorted.add,
				del: sorted.del,
				mod: sorted.mod,
			}, null, 4));
			jsonLogDs.close();

			const commonJsonLogDs = await fspr.open(o.commonJsonLogPN, "a");
			commonJsonLogDs.write(JSON.stringify({
				dataTime: dateStr,
				summary: {
					all: changes.length,
					add: sorted.add.length,
					del: sorted.del.length,
					mod: sorted.mod.length,
				},
				add: sorted.add,
				del: sorted.del,
				mod: sorted.mod,
			}, null, 4) + "\n , \n");
			commonJsonLogDs.close();

			if (sorted.mod.length) {
				console.log("Saving modified ...");
				await fspr.mkdir(modPath);
				await copyList(sorted.mod, o.dstPN, modPath);
			}
			if (sorted.del.length) {
				console.log("Saving deleted ...");
				await fspr.mkdir(delPath);
				await copyList(sorted.del, o.dstPN, delPath);
			}

			console.log(`Transferring all changes to "${o.dstPN}" ...`);

			await applyChanges(o.srcPN, o.dstPN, changes, errLogPN);

			const 
				ts3 = Date.now(),
				backupTime = getToMinSec((ts3 - ts2) / 1000);
			console.log([
				``,
				`Backup time : ${backupTime}`,
				``,
			].join("\n"));

			if (failedChanges.length) {
				console.log([
					``,
					`Errors : ${failedChanges.length}`,
					``,
				].join("\n"));
				const treeLog = drawFT.createText(failedChanges, o.srcName);
				if (100 < treeLog.length && 10 < treeLog.split("\n").length)
					console.log(treeLog);
				const errLogDs = await fspr.open(errLogPN, "a");
				errLogDs.write(treeLog);
				errLogDs.close();
			}

			console.log("\n done \n");
		}
	})()

	// console.log(`o`, o);
}

async function applyChanges (srcP, dstP, changes, errLogPN) {
	const pBar = new cliP.SingleBar({
		format: " {bar} {percentage}% {value}/{total} {path}",
		barCompleteChar: '\u2588',
		barIncompleteChar: '\u2591',
		hideCursor: false,
		// clearOnComplete: true,
		barsize: 20,
		linewrap: true, // ???????? 'true' - ???? ?????????????? ???? ?????????? ????????????, ?????? ???? ???????????? ?? ????????.
	});
	pBar.start(changes.length, 0);
	for (let [n, change] of changes.entries()) {
		pBar.update(n, {path: change.path});
		// console.log(`change`, change);
		await diffFT.applyRight(srcP, dstP, [change]).
			catch(async function (err) {
				failedChanges.push(change);
				const errLogDs = await fspr.open(errLogPN, "a");
				errLogDs.write([
					``,
					`${err}`,
					``,
				].join("\r\n"));
				errLogDs.close();
			});
		pBar.update(n + 1, {path: ""});
	}
	pBar.stop();
}

async function copyList(list, fromP, toP) {
	const pBar = new cliP.SingleBar({
		format: " {bar} {percentage}% {value}/{total} {path}",
		barCompleteChar: '\u2588',
		barIncompleteChar: '\u2591',
		hideCursor: false,
		// clearOnComplete: true,
		barsize: 20,
		linewrap: true, // ???????? 'true' - ???? ?????????????? ???? ?????????? ????????????, ?????? ???? ???????????? ?? ????????.
	});
	pBar.start(list.length, 0);
	for (let [n, subj] of list.entries()) {
		pBar.update(n, {path: subj.path});
		const 
			srcP = path.join(fromP, subj.path),
			destP = path.join(toP, subj.path);
		if (subj.type == "file") {
			await fspr.mkdir(path.dirname(destP), {recursive: true});
			await pr(fs.copyFile)(srcP, destP);
		} else if (subj.type == "dir") {
			await fspr.mkdir(destP, {recursive: true});
		} else {
			throw new Error("subj.type = "+subj.type);
		}
		pBar.update(n + 1, {path: ""});
	}
	pBar.stop();
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
		"    budir <dst-path> [-bc | -bakcup | --backup]" + 
			" [-st | -sort | --sort]",
		"",
		"budir <dst-path>           : Compare current folder with a folder,",
		"                              that hac the <dst-path> path, ",
		"                              and as name as the current folder.",
		"                              It path may be absolute or relative.",
		"",
		"-bc, -backup, --backup     : Apply changes to backup copy." + 
			" Add changes to logs.",
		"",
		"-st, -sort, --sort         : Sort the input of changes" + 
			" as add, del, mod.",
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
