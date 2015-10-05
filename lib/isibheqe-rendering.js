var Context = function(unit, width, height) {
	this.factory = new GlyphFactory(unit);
	this.lineHeight = unit * HEIGHT * 3;
	this.lineWidth = unit / 3.0;
	this.spaceWidth = unit * BASE * 1.1;
	this.canvasWidth = width;
	this.canvasHeight = height;
	this.cursor = new Point(0, 0);
	this.buffer = new Array();
	this.currentVowel = undefined;
	this.sentence = new Array();
}

Context.prototype.reset = function() {
	this.cursor = new Point(0, 0);
	this.buffer = new Array();
	this.currentVowel = undefined;
	this.sentence = new Array();
}

makeTarget = function(context) {
	var target = {element: context};	

	target.drawLine = function(a, b) {
		this.element.beginPath();
		this.element.moveTo(a.x, a.y);
		this.element.lineTo(b.x, b.y);
		this.element.closePath();
		this.element.stroke();
	}
	target.drawArc = function(x, y, radius, start, end) {
		this.element.beginPath();
		this.element.arc(x, y, radius, start, end, true);
		this.element.stroke();
	}
	target.fillCircle = function(x, y, radius) {
		this.element.beginPath();
		this.element.arc(x, y, radius, 0, Math.PI * 2, true);
		this.element.fill();	
	}
	return target		
}

var space = {
	renderOn: function () {
		
	}
}
var enter = {
	renderOn: function () {
		
	}
}

Context.prototype.render = function() {
	var canvas = document.createElement('canvas');
	canvas.width  = this.canvasWidth;
	canvas.height = this.canvasHeight;
	var context = canvas.getContext("2d");
	context.lineWidth = this.lineWidth;
  	context.lineCap = 'round';
	var target = makeTarget(context);
	
	for(var i = 0; i < this.sentence.length; i++) {
		this.sentence[i].renderOn(target);
	}

	return canvas;
}

Context.prototype.serialize = function() {
	var output = [];
	for(var i = 0; i < this.sentence.length; i++) {
		var elem = this.sentence[i];
		if(elem === space) {
			output.push(" ");
			continue;
		}
		if(elem === enter) {
			output.push("\n");
			continue;
		}
		var v = elem.vowel;
		var c = elem.consonants;
		if(c.length > 0) {
			output.push([v,c]);
		} else {
			output.push(v);
		}
	}
	return JSON.stringify(output);
}

Context.prototype.deserialize = function(data) {
	var loaded = JSON.parse(data);
	this.reset();
	for(var i = 0; i < loaded.length; i++) {
		var elem = loaded[i];
		if(typeof elem === "string") {
			if(elem === " ") {
				this.addLetter("space");
				continue;
			} 
			if(elem === "\n") {
				this.addLetter("enter");
				continue;	
			}
			this.addLetter(elem);
		} else {
			this.addLetter(elem[0]);
			for(var j = 0; j < elem[1].length; j++) {
				this.addLetter(elem[1][j]);
			}
		}
	}
}

Context.prototype.addLetter = function(key) {
	if(this.cursor.y + this.lineHeight >= this.canvasHeight) {
		this.canvasHeight = this.canvasHeight + this.lineHeight;
	}
	var overflow = new Point();
	if(VOWELS.indexOf(key) >= 0) {
		if(this.currentVowel !== undefined) {
			this.buffer.push(this.cursor);
			this.cursor = this.cursor.translate(new Point(this.currentVowel.kerning(), 0));
		}
		this.currentVowel = this.factory.newVowel(key, this.cursor);
		this.sentence.push(this.currentVowel);
		overflow = this.cursor.translate(new Point(this.currentVowel.kerning(), 0));
	} else if (SYLLABIC_CONSONANTS.indexOf(key) >= 0) {
		if(this.currentVowel !== undefined) {
			this.buffer.push(this.cursor);
			this.cursor = this.cursor.translate(new Point(this.currentVowel.kerning(), 0));
			this.currentVowel = undefined;
		}
		var syllabicConsonant = this.factory.newSyllabicConsonant(key, this.cursor);
		this.sentence.push(syllabicConsonant);
		this.cursor = this.cursor.translate(new Point(syllabicConsonant.kerning(), 0));
		overflow = this.cursor;
	} else if(CONSONANTS.indexOf(key) >= 0) {
		if(this.currentVowel !== undefined) {
			this.currentVowel.addConsonant(key);
		} else {
			return;
		}
	} else if(key === "space") {
		this.buffer.push(this.cursor);
		if (this.currentVowel !== undefined) {
			this.cursor = this.cursor.translate(new Point(this.currentVowel.kerning(), 0));
		}
		this.currentVowel = undefined;
		this.cursor = this.cursor.translate(new Point(this.spaceWidth, 0));
		this.sentence.push(space);
		return;
	} else if(key === "enter") {
		this.currentVowel = undefined;
		this.buffer.push(this.cursor);
		this.cursor = new Point(0, this.cursor.y + this.lineHeight);
		this.sentence.push(enter);
		return;
	}
	if (overflow.x >= this.canvasWidth) {
		var index = this.sentence.lastIndexOf(space);
		if(index != 0) {
			this.sentence.splice(index + 1, 0, enter);
			var hack = this.serialize();
			this.deserialize(hack);
		}
	}
}

Context.prototype.undo = function() {
	this.sentence.pop();
	this.cursor = this.buffer.pop();
}