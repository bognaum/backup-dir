const 
	path = require("path");

File.prototype = {
	getType
};

Folder.prototype = {
	addPath,
	addDir,
	addFile,
	getDir,
	getFile,
	getType,
};

exports.createTree        = createTree;
exports.createTreeTemplate = createTreeTemplate;
exports.createText = createText;

function createText(dftList, rootName) {
	const 
		context = {
			text: "\n",
			isContainer,
			getPath,
			addHeader,
			addBranchEl,
			endOfRow,
		},
		template = createTreeTemplate(dftList, rootName);

	createTree(template, context);
	context.text += "\n";

	return context.text;

	function isContainer(m) {
		return !!m.ch;
	}
	function getPath(arr) {
		return arr.join(path.sep);
	}
	function addHeader(m) {
		if (m.ch)
			this.text += "(/)";
		else
			this.text += "━#━";
		this.text += 
			m.change == "add" ? " +":
			m.change == "del" ? " -":
			m.change == "mod" ? " !":
				"  ";
		this.text += ` ${m.name}`;
		if (m.ch)
			this.text += " /";
	}
	function addBranchEl(type, m) {
		this.text += 
			type == 'v' ? " ┃ " :
			type == 'f' ? " ┣━" :
			type == 'c' ? " ┗━" :
			type == 'e' ? "   " :
				"err";
	}
	function endOfRow(m) {
		this.text += "\n";
	}
}

function createTree(treeModel, _) {
	// version 3.0.0
	// 
	// isContainer(modelNode)
	// getPath(pathArr)
	// addHeader(modelNode, rc)
	// addBranchEl(type, modelNode, rc)
	// newRow(modelNode, rI)
	// endOfRow(modelNode, rI)
	// initModelNodeBefore(modelNode)
	// initModelNodeAfter(modelNode)
	// 
	// 'v'    vertical    " ┃ "    вертикальная часть стебля
	// 'f'    fork        " ┣━"    развилка
	// 'c'    corner      " ┗━"    угол
	// 'e'    empty       "   "    пустая ячейка
	
	function createRow(mNode, rowType) {
		var cI = 0;
		_.newRow && _.newRow(mNode, rI);

		var 
			len = lastChildStateArr.length,
			lastK = len - 1;
		for (var k = 0; k < len; k++) {
			var type;

			if (rowType == "header" && k == lastK) 
				type = lastChildStateArr[k] ? "c" : "f";
			else
				type = lastChildStateArr[k] ? "e" : "v";

			var rc = [rI, cI];
			_.addBranchEl(type, mArr[k] ,rc);
			cI ++;
		}
		
		var rc = [rI, cI];

		if (rowType == "header") {
			_.addHeader(mNode ,rc);

		} else if (rowType == "second-header-line" && _.addHExt) {
			_.addSecondHeaderLine(mNode ,rc);
		} 

		_.endOfRow && _.endOfRow(mNode, rI);
		rI ++;
	}

	function recursive(mNode) {
		var name = (_.getNameToPath)? _.getNameToPath(mNode) : mNode.name;
		mNode.path = _.getPath(pathArr);
		pathArr.push(name);
		mNode.pathname = _.getPath(pathArr);
		mNode.isBranchNode = !!(mNode.ch && mNode.ch.length);

		_.initNodeBefore && _.initNodeBefore(mNode);

		createRow(mNode, "header");
		lastChildStateArr.push(!(mNode.ch && mNode.ch.length)) + mArr.push(mNode);
		_.addSecondHeaderLine && createRow(mNode, "second-header-line");
		// createRow(mNode);

		if (mNode.isBranchNode) {
			var lastChIndex = mNode.ch.length - 1
			for (var i = 0; i < mNode.ch.length; i++) {

				mNode.ch[i].parent = mNode;
				mNode.ch[i].seqN = i;

				lastChildStateArr[lastChildStateArr.length - 1] = i == lastChIndex;
				recursive(mNode.ch[i]);
			}		
		}

		pathArr.pop();
		lastChildStateArr.pop();
		mArr.pop();
		_.initNodeAfter && _.initNodeAfter(mNode);
	}	

	_.getPath = _.getPath || ((pathArr) => pathArr.join("/"));
	
	var 
		pathArr = treeModel.rootpath ? treeModel.rootpath.split(_.pathDiv) : [],
		lastChildStateArr = [],
		rI = 0,
		mArr = []

	recursive(treeModel);
	return _;
}

function createTreeTemplate(dftList, rName="root") {
	const 
		sep = path.sep,
		root = new Folder(rName);

	root.isRoot = true;

	dftList.forEach(root.addPath(root));

	return root;
}

function addPath(parent) {
	return function (opts) {
		const arr = opts.path.split(path.sep);
		let curr = parent;

		arr.shift();
		const arrLen = arr.length;
		for (let [segNum, segName] of arr.entries()) {
			const segType = (segNum == arrLen - 1)? opts.type : "dir";
			if (segType == "file") {
				curr = curr.addFile(segName);
			} else if (segType == "dir") {
				let existed;
				if (existed = curr.getDir(segName))
					curr = existed;
				else 
					curr = curr.addDir(segName);
			}
			else {}
		}
		curr.change = opts.change;
	}
}

function addFile(name) {
	if (typeof this.ch != "object")
		this.ch = [];
	const file = new File(name);
	this.ch.push(file);
	return file;
}

function addDir(name) {
	if (typeof this.ch != "object")
		this.ch = [];
	const folder = new Folder(name);
	this.ch.push(folder);
	return folder;
}

function getType() {
	return (this.ch)? "dir" : "file";
}

function getDir(name) {
	if (typeof this.ch == "object")
		return this.ch.find(v => v.ch && v.name == name);
}

function getFile(name) {
	if (typeof this.ch == "object")
		return this.ch.find(v => !v.ch && v.name == name);
}

function File(name) {
	this.name = name;
}

function Folder(name) {
	File.call(this, name);
	this.ch = true;
}
