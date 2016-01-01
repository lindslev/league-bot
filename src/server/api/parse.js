function parse(body) {
	 return JSON.parse('[' + Object.keys(body)[0] + ']');
}

module.exports = parse;
