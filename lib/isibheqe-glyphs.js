
BASE = 16;
HEIGHT = 13.8;
TONE = HEIGHT / 3.5;
THETA = Math.atan(HEIGHT / (BASE / 2.0));

var Point = function(x, y) {
	this.x = x;
	this.y = y;
}

Point.prototype.scale = function(m) {
	return new Point(this.x * m, this.y * m);
}

Point.prototype.translate = function(p) {
	return new Point(this.x + p.x, this.y + p.y);
}

Point.prototype.difference = function(p) {
	return new Point(this.x - p.x, this.y - p.y);	
}

Point.prototype.mid = function(p) {
	return new Point((this.x + p.x) / 2.0, (this.y + p.y) / 2.0);
}

var Glyph = function(origin, apex, base) {
	this.origin = origin;
	this.apex = apex;
	this.base = base;
	this.margin = 0;
	if(this.base.x === this.origin.x) { // vertical
		this.unit = (base.y - origin.y) / BASE;
		this.kerning = function() {
			return this.top() + BASE * this.unit + this.bottom();
		}
		if(this.apex.x > this.origin.x) { // dy = +y
			this.zero = 0 * Math.PI;
			this.move = function(a, b) {
				return a.translate(new Point(b.y, b.x));
			}
			this.padding = function() {
				return this.bottom();
			}
		} else { // dy = -y
			this.zero = 1 * Math.PI;
			this.move = function(a, b) {
				return a.translate(new Point(-b.y, -b.x));
			}
			this.padding = function() {
				return this.top();
			}
		}
	} else { // horizontal
		this.unit = (base.x - origin.x) / BASE;
		this.kerning = function() {
			return BASE * this.unit + this.padding();
		}		
		if(this.apex.y < this.origin.y) { // dy = +x
			this.zero = 1.5 * Math.PI;
			this.move = function(a, b) {
				return a.translate(new Point(b.x, b.y));
			}
			this.padding = function() {
				return this.left();
			}
		} else {	// dy = -x
			this.zero = 0.5 * Math.PI;
			this.move = function(a, b) {
				return a.translate(new Point(b.x, -b.y));
			}
			this.padding = function() {
				return 0;
			}
		}
	}
	this.unit = Math.abs(this.unit);
	this.data = [];
	this.vowel = "";
	this.vowelData = "";
	this.consonants = [];
}

Glyph.prototype.addLine = function(a, b) {
	this.data.push(new Array(a,b));
}

Glyph.prototype.addArc = function(centre, radius, start, end) {
	this.data.push(new Array(centre.x, centre.y, radius, start, end));
}

Glyph.prototype.addCircle = function(centre, radius) {
	this.data.push(new Array(centre.x, centre.y, radius, 0, Math.PI * 2.0));
}

Glyph.prototype.fillCircle = function(centre, radius) {
	this.data.push(new Array(centre.x, centre.y, radius));
}

Glyph.prototype.renderOn = function(canvas) {
	for(var i = 0; i < this.data.length; i++) {
		if (this.data[i].length === 2) {
			canvas.drawLine.apply(canvas, this.data[i]);
		} else if (this.data[i].length === 5) {
			canvas.drawArc.apply(canvas, this.data[i]);
		} else if (this.data[i].length === 3) {
			canvas.fillCircle.apply(canvas, this.data[i]);
		}

	}
}

Glyph.prototype.top = function() {
	if(this.consonants.indexOf("f") >= 0) {
		return 5 * this.unit;
	}
	if(this.consonants.indexOf("n̪") >= 0 || this.consonants.indexOf("n") >= 0 || this.consonants.indexOf("ɲ") >= 0 || this.consonants.indexOf("ŋ") >= 0 || this.consonants.indexOf("°") >= 0 || this.consonants.indexOf("~") >= 0) {
		return 2 * TONE * this.unit;
	}
	return 0;
}

Glyph.prototype.bottom = function() {
	if(this.consonants.indexOf("j") >= 0) {
		return 6 * this.unit;
	}
	if((this.consonants.indexOf("n̪") >= 0 || this.consonants.indexOf("n") >= 0 || this.consonants.indexOf("ɲ") >= 0 || this.consonants.indexOf("ŋ") >= 0 || this.consonants.indexOf("°") >= 0 ) && this.consonants.indexOf("~") >= 0) {
		return 2 * TONE * this.unit;
	}
	return 0;
}

Glyph.prototype.left = function() {
	if (this.consonants.indexOf("l̩") >= 0 && this.consonants.indexOf("l") >= 0) {
		return 4 * this.unit;				
	}
	if (this.consonants.indexOf("l") >= 0) {
		return 2 * this.unit;				
	}
	return 0;
}

Glyph.prototype.setMargin = function() {
	if (this.margin !== this.padding()) {
		this.translate(new Point(this.padding() - this.margin, 0));
		this.margin = this.padding();
	}
}

Glyph.prototype.solidVowel = function() {
	this.addLine(this.origin,this.apex);
	this.addLine(this.apex, this.base);
	this.addLine(this.origin, this.base);
	this.vowelData = this.data.slice();
}

Glyph.prototype.openVowel = function() {
	this.addLine(this.origin,this.apex);
	this.addLine(this.apex, this.base);
	this.vowelData = this.data.slice();
}

Glyph.prototype.vector = function(a, b) {
	var origin = new Point(0,0);
	var point = a.difference(b);
	return this.move(origin, point);
}

Glyph.prototype.midBase = function() {
	return this.origin.mid(this.base);
}

Glyph.prototype.translate = function(p) { 
	this.origin = this.origin.translate(p);
	this.apex = this.apex.translate(p);
	this.base = this.base.translate(p);
	for(var i = 0; i < this.data.length; i++) {
		if (this.data[i].length === 2) {
			this.data[i][0] = this.data[i][0].translate(p);
			this.data[i][1] = this.data[i][1].translate(p);
		} else if (this.data[i].length === 5 || this.data[i].length === 3) {
			this.data[i][0] = this.data[i][0] + p.x;
			this.data[i][1] = this.data[i][1] + p.y;
		}

	}
}

Glyph.prototype.addConsonant = function(letter) {
	if(this.consonants.indexOf(letter) >= 0) { // Don't repeat consonants
		return;
	}
	this.consonants.push(letter);
	this.data = this.vowelData.slice();
	for(var i = 0; i < this.consonants.length; i++) {
		l = this.consonants[i];
		switch(l) {
			case "-":
				if(this.consonants.indexOf("ʃ") === -1 && this.consonants.indexOf("ȿ") === -1){
					this.addLine(this.midBase(), this.apex);	
				}
				break;
			case "•":
				var centre = this.move(this.midBase(), this.vector(this.apex, this.midBase()).scale(0.12));
				var radius = this.unit;
				if (this.consonants.indexOf("r̩") >= 0) {
					centre = this.move(centre, this.vector(this.base, this.origin).scale(0.32));
				} else if (this.consonants.indexOf("-") >= 0) {
					var h = 0.18;
					if (this.consonants.indexOf("k") >= 0 || this.consonants.indexOf("|") >= 0 || this.consonants.indexOf("!") >= 0) {
						h = 0.32;
					}
					centre = this.move(centre, this.vector(this.base, this.origin).scale(h));
				} else if (this.consonants.indexOf("k") >= 0 || this.consonants.indexOf("|") >= 0 || this.consonants.indexOf("!") >= 0) {
					radius = radius * 0.7;
				}
				this.fillCircle(centre, radius);
				break;
			case "°":
				this.setMargin();
				var h = 0.18;
				var centre = this.move(this.midBase(), this.vector(this.apex, this.midBase()).scale(1.0 + h));
				var radius = h * HEIGHT * this.unit;
				this.addCircle(centre, radius);
				break;
			case "~":
				this.setMargin();
				var h = 0.18;
				var centre = this.move(this.midBase(), this.vector(this.apex, this.midBase()).scale(1.0 + h));
				var radius = h * 0.6 * HEIGHT * this.unit;
				if (this.consonants.indexOf("n̪") >= 0 || this.consonants.indexOf("n") >= 0 || this.consonants.indexOf("n̩") >= 0 || this.consonants.indexOf("ŋ̩") >= 0 || this.consonants.indexOf("°") >= 0) {
					centre = this.move(this.apex, this.vector(this.midBase(), this.apex).scale(1.0 + h));
				}				
				this.fillCircle(centre, radius);
				break;
			case "t":
				if (this.consonants.indexOf("ʃ") === -1 && this.consonants.indexOf("ȿ") === -1) {
					var start = this.move(this.origin, this.vector(this.apex, this.origin).scale(1.0/3.0));
					var end = this.move(this.base, this.vector(this.apex, this.base).scale(1.0/3.0));
					this.addLine(start, end);
				}
				break;
			case "p":
				var start = this.move(this.apex, new Point((-1.0/2.0) * BASE * this.unit, 0));
				var end = this.move(this.apex, new Point((1.0/2.0) * BASE * this.unit, 0));
				this.addLine(start, end);
				break;
			case "t̪":
				var start = this.move(this.origin, this.vector(this.apex, this.origin).scale(0.9/3.0));
				var end = this.move(this.base, this.vector(this.apex, this.base).scale(0.9/3.0));
				this.addLine(start, end);
				start = this.move(this.origin, this.vector(this.apex, this.origin).scale(1.2/3.0));
				end = this.move(this.base, this.vector(this.apex, this.base).scale(1.2/3.0));
				this.addLine(start, end);
				break;
			case "c":
				var start = this.origin.mid(this.apex);
				var end = this.base;
				this.addLine(start, end);
				start = this.base.mid(this.apex);
				end = this.origin;
				this.addLine(start, end);
				break;
			case "k":
				var origin = this.move(this.origin, this.vector(this.base, this.origin).scale(0.35));
				var apex = this.move(this.midBase(), this.vector(this.apex, this.midBase()).scale(0.3));
				var base = this.move(this.origin, this.vector(this.base, this.origin).scale(0.65));
				this.addLine(origin, apex);
				this.addLine(apex, base);
				break;
			case "ɸ":
				var centre = this.midBase().mid(this.apex);
				var startAngle = this.zero + Math.PI / 4.0;
			    var endAngle = this.zero - Math.PI / 4.0;
			    var radius = (HEIGHT / 2.0) * this.unit;
			    this.addArc(centre, radius, startAngle, endAngle);
			    break;
			case "f":
				this.setMargin();
				var centre = this.move(this.midBase(), this.vector(this.apex, this.midBase()).scale(1.5));
				var startAngle = this.zero + Math.PI + Math.PI / 4.0;
			    var endAngle = this.zero + Math.PI - Math.PI / 4.0;
			    var radius = (HEIGHT / 2.0) * this.unit;
			    this.addArc(centre, radius, startAngle, endAngle);
			    break;
			case "s":
				var centre = this.apex;			
				var startAngle = this.zero + Math.PI + Math.PI / 6.0;
				var endAngle = this.zero + Math.PI - Math.PI / 6.0;
				var radius = (BASE / 2.0) * this.unit;
				this.addArc(centre, radius, startAngle, endAngle);
			    break;
			case "ʃ":
				var h = 0.4;
				var centre = this.move(this.midBase(), this.vector(this.apex, this.midBase()).scale(h));
				var radius = (TONE / 2.0) * this.unit;
				this.addCircle(centre, radius);
				var apex = this.move(centre, this.vector(this.midBase(), centre).scale((TONE * 1.24) / HEIGHT));
				if(this.consonants.indexOf("t") === -1) {
					this.addLine(this.origin, apex);
					this.addLine(apex, this.base);
				} else {
					var start = this.move(apex, this.vector(this.origin, this.midBase()).scale(1.07 * h * (HEIGHT / (BASE / 2.0))));
					var end = this.move(apex, this.vector(this.base, this.midBase()).scale(1.07 * h * (HEIGHT / (BASE / 2.0))));
					this.addLine(start, end);
				}
				if (this.consonants.indexOf("-") >= 0) {
					this.addLine(this.midBase(), apex);
				}
				break;
			case "ȿ":
				var h = 0.25;
				var centre = this.move(this.midBase(), this.vector(this.apex, this.midBase()).scale(h));
				var radius = (TONE / 2.0) * this.unit;
				this.addCircle(centre, radius);
				var apex = this.move(centre, this.vector(this.apex, centre).scale((TONE / 1.3) / HEIGHT));
				if(this.consonants.indexOf("t") === -1) {
					var origin = this.move(this.origin, this.vector(this.apex, this.origin).scale(0.6));
					var base = this.move(this.base, this.vector(this.apex, this.base).scale(0.6));
					this.addLine(origin, apex);
					this.addLine(apex, base);
				} else {
					var start = this.move(apex, this.vector(this.origin, this.midBase()).scale(h * 2.3));
					var end = this.move(apex, this.vector(this.base, this.midBase()).scale(h * 2.3));
					this.addLine(start, end);
				}
				if (this.consonants.indexOf("-") >= 0) {
					this.addLine(this.apex, apex);
				}
				break;
			case "x":
				var centre = this.midBase();
				var radius = (BASE * 0.27) * this.unit;
				var startAngle = this.zero + Math.PI / 2.0;
				var endAngle = this.zero - Math.PI / 2.0;
				this.addArc(centre, radius, startAngle, endAngle);
				break;
			case "h":
				var centre = this.move(this.midBase(), this.vector(this.apex, this.midBase()).scale(0.25));
				var radius = (TONE / 2.2) * this.unit;
				this.addCircle(centre, radius);
				break;
			case "ɬ":
				var centre = this.base.mid(this.apex);
				var radius = (BASE / 4.0) * this.unit;
				var endAngle = this.zero - Math.PI / 6.0;
				var startAngle = endAngle + Math.PI;
				this.addArc(centre, radius, startAngle, endAngle);
				break;
			case "w":
				var h = 0.6;
				if (this.consonants.indexOf("t̪") >= 0 || this.consonants.indexOf("t") >= 0 || this.consonants.indexOf("ɽ") >= 0 ) {
					h = 0.32;
				} else if (this.consonants.indexOf("s") >= 0 || this.consonants.indexOf("c") >= 0 || this.consonants.indexOf("x") >= 0 || this.consonants.indexOf("r") >= 0 || this.consonants.indexOf("||") >= 0 || this.consonants.indexOf("ʃ") >= 0 || this.consonants.indexOf("ȿ") >= 0) {
					h = 0.5;
				}
				var a = h * Math.cos(Math.PI / 3.0);
				var start = this.move(this.origin, this.vector(this.apex, this.origin).scale(h));
				var end = this.move(this.origin, this.vector(this.base, this.origin).scale(a));
				this.addLine(start, end);
				start = this.move(this.base, this.vector(this.apex, this.base).scale(h));
				end = this.move(this.base, this.vector(this.origin, this.base).scale(a));
				this.addLine(start, end);
				break;
			case "j":
				this.setMargin();
				var apex = this.origin.mid(this.base);
				var p = this.move(apex, this.vector(apex, this.apex).scale(0.6));
				var end = p.mid(this.origin);
				this.addLine(end, apex);
				end = p.mid(this.base);
				this.addLine(end, apex);
				break;
			case "l":
				this.setMargin();
				var start = this.move(this.origin, this.vector(this.origin, this.base).scale(0.1));
				var end = this.move(this.apex, this.vector(this.origin, this.base).scale(0.1));
				this.addLine(start, end);
				if (this.consonants.indexOf("l̩") >= 0) {
					start = this.move(this.origin, this.vector(this.origin, this.base).scale(0.2));
					end = this.move(this.apex, this.vector(this.origin, this.base).scale(0.2));
					this.addLine(start, end);
				}
				break;
			case "r":
				var apex = this.move(this.midBase(), this.vector(this.apex, this.midBase()).scale(0.3));
				var start = this.move(this.origin, this.vector(this.apex, this.origin).scale(2.0/3.0));
				var end = this.move(this.base, this.vector(this.apex, this.base).scale(2.0/3.0));
				this.addLine(start, apex);
				this.addLine(apex, end);
				if (this.consonants.indexOf("r̩") >= 0) {
					this.addLine(this.midBase(), this.origin.mid(this.apex));
					this.addLine(this.midBase(), this.base.mid(this.apex));
				}
				break;
			case "ɽ":
				var h = 0.65;
				var start = this.move(this.apex, this.vector(this.origin, this.apex).scale(h));
				var end = this.move(this.apex, this.vector(this.base, this.apex).scale(h));
				this.addLine(start, end);
				var m = start.mid(end);
				this.addLine(m, this.apex);
				break;
			case "|":
				var h = 0.6;
				var a = h * Math.cos(Math.PI / 3.0);
				var oa = this.move(this.origin, this.vector(this.apex, this.origin).scale(h));
				var ob = this.move(this.origin, this.vector(this.base, this.origin).scale(a));
				var ba = this.move(this.base, this.vector(this.apex, this.base).scale(h));
				var bo = this.move(this.base, this.vector(this.origin, this.base).scale(a));
				this.addLine(oa, ba);
				this.addLine(oa, bo);
				this.addLine(ba, ob);
				this.addLine(oa.mid(this.origin), ba.mid(this.base));
				break;
			case "!":
				var h = 0.6;
				var a = h * Math.cos(Math.PI / 3.0);
				var oa = this.move(this.origin, this.vector(this.apex, this.origin).scale(h));
				var ob = this.move(this.origin, this.vector(this.base, this.origin).scale(a));
				var ba = this.move(this.base, this.vector(this.apex, this.base).scale(h));
				var bo = this.move(this.base, this.vector(this.origin, this.base).scale(a));
				this.addLine(oa, ba);
				this.addLine(oa, bo);
				this.addLine(ba, ob);
				break;	
			case "||":
				var start = this.origin.mid(this.apex);
				var end = this.move(start, this.vector(this.apex.mid(this.base), start).scale(1.5));
				this.addLine(start, end);
				this.addLine(end, this.midBase().mid(this.base));
				break;
			case "n̪":
				this.setMargin();
				var h = 0.18;
				var centre = this.move(this.midBase(), this.vector(this.apex, this.midBase()).scale(1.0 + h));
				var radius = h * HEIGHT * this.unit;
				this.addCircle(centre, radius);
				var r = Math.PI / 9;
				var dx = Math.cos(r) * radius;
				var dy = Math.sin(r) * radius;
				var startA = this.move(centre, new Point(dx, dy));
				var startB = this.move(centre, new Point(-dx, dy));
				var endA = this.move(centre, new Point(dx, -dy));
				var endB = this.move(centre, new Point(-dx, -dy));
				this.addLine(startA, startB);
				this.addLine(endA, endB);
				break;
			case "n":
				this.setMargin();
				var h = 0.18;
				var centre = this.move(this.midBase(), this.vector(this.apex, this.midBase()).scale(1.0 + h));
				var radius = h * HEIGHT * this.unit;
				this.addCircle(centre, radius);
				var start = this.move(centre, new Point(radius, 0));
				var end = this.move(centre, new Point(-radius, 0));
				this.addLine(start, end);
				break;
			case "ɲ":
				this.setMargin();
				var h = 0.18;
				var centre = this.move(this.midBase(), this.vector(this.apex, this.midBase()).scale(1.0 + h));
				var radius = h * HEIGHT * this.unit;
				this.addCircle(centre, radius);
				var r = Math.PI / 4;
				var dx = Math.cos(r) * radius;
				var dy = Math.sin(r) * radius;
				var endA = this.move(centre, new Point(-dx, dy));
				var endB = this.move(centre, new Point(dx, dy));
				this.addLine(endA, centre);
				this.addLine(centre, endB)
				break;
			case "ŋ":
				this.setMargin();
				var h = 0.18;
				var centre = this.move(this.midBase(), this.vector(this.apex, this.midBase()).scale(1.0 + h));
				var radius = h * HEIGHT * this.unit;
				this.addCircle(centre, radius);
				var r = Math.PI / 4;
				var dx = Math.cos(r) * radius;
				var dy = Math.sin(r) * radius;
				var startA = this.move(centre, new Point(dx, dy));
				var startB = this.move(centre, new Point(-dx, dy))
				var endA = this.move(centre, new Point(-dx, -dy));
				var endB = this.move(centre, new Point(dx, -dy));
				this.addLine(startA, endA);
				this.addLine(startB, endB);
				break;
		}
	}		
}

CONSONANTS = ["-", "•", "°", "~", "t", "p", "t̪", "c", "k", "ɸ", "f", "s", "ʃ", "ȿ", "x", "h", "ɬ", "w", "j", "l", "r", "ɽ", "|", "!", "||", "n̪", "n", "ɲ", "ŋ", "l̩", "r̩"];

var GlyphFactory = function(unit) {
	this.unit = unit;
}

GlyphFactory.prototype.newVowel = function(letter, origin) {
	this.baseline = origin.y + (TONE + HEIGHT + 2) * this.unit;
	this.margin = origin.x;
	switch (letter) {
	case 'i':
		var o = new Point(this.margin, this.baseline);
		var a = new Point(o.x + (BASE / 2) * this.unit, o.y - HEIGHT * this.unit);
		var b = new Point(o.x + BASE * this.unit, o.y);
		var res = new Glyph(o, a, b);
		res.solidVowel();
		break;
	case 'a':
		var o = new Point(this.margin, this.baseline - HEIGHT * this.unit);
		var a = new Point(o.x + (BASE / 2) * this.unit, this.baseline);
		var b = new Point(o.x + BASE * this.unit, o.y);
		var res = new Glyph(b, a, o);
		res.solidVowel();
		break;
	case 'u': // same as i but open
		var o = new Point(this.margin, this.baseline);
		var a = new Point(o.x + (BASE / 2) * this.unit, o.y - HEIGHT * this.unit);
		var b = new Point(o.x + BASE * this.unit, o.y);
		var res = new Glyph(o, a, b);
		res.openVowel();
		break;
	case 'e':
		var o = new Point(this.margin + HEIGHT * this.unit, this.baseline);
		var a = new Point(this.margin, o.y - (BASE / 2) * this.unit);
		var b = new Point(o.x, o.y - BASE * this.unit);
		var res = new Glyph(o, a, b);
		res.openVowel();
		break;
	case 'o':
		var o = new Point(this.margin, this.baseline - BASE * this.unit);
		var a = new Point(o.x + HEIGHT * this.unit, o.y + (BASE / 2) * this.unit);
		var b = new Point(o.x, o.y + BASE * this.unit);
		var res = new Glyph(o, a, b);
		res.openVowel();
		break;
	case 'ɔ': // same as o but solid
		var o = new Point(this.margin, this.baseline - BASE * this.unit);
		var a = new Point(o.x + HEIGHT * this.unit, o.y + (BASE / 2) * this.unit);
		var b = new Point(o.x, o.y + BASE * this.unit);
		var res = new Glyph(o, a, b);
		res.solidVowel();
		break;
	case 'ɛ': // same as e but solid
		var o = new Point(this.margin + HEIGHT * this.unit, this.baseline);
		var a = new Point(this.margin, o.y - (BASE / 2) * this.unit);
		var b = new Point(o.x, o.y - BASE * this.unit);
		var res = new Glyph(o, a, b);
		res.solidVowel();
		break;
	default:
		console.log("Unknown vowel: " + letter);
	}
	res.vowel = letter;
	return res;
}

VOWELS = ['i','a','u','e','o','ɔ','ɛ'];

GlyphFactory.prototype.newSyllabicConsonant = function(letter, origin) {
	this.baseline = origin.y + (TONE + HEIGHT + 2) * this.unit;
	this.margin = origin.x;
	var o = new Point(this.margin, this.baseline);
	var a = new Point(o.x + (BASE / 2) * this.unit, o.y - HEIGHT * this.unit);
	var b = new Point(o.x + BASE * this.unit, o.y);
	var res = new Glyph(o, a, b);
	var radius = (HEIGHT / 2.0) * this.unit;
	var centre = res.midBase().mid(res.apex);
	res.addCircle(centre, radius);
	res.kerning = function() {
		return (BASE + 2) * this.unit
	}
	switch (letter) {
	case "m̩":
		break;
	case "n̩":
		res.addLine(new Point(centre.x - radius, centre.y), new Point(centre.x + radius, centre.y));
		break
	case "ŋ̩":
		h = Math.sin(Math.PI/4.0);
		res.addLine(new Point(centre.x - h * radius, centre.y - h * radius), new Point(centre.x + h * radius, centre.y + h * radius));
		res.addLine(new Point(centre.x - h * radius, centre.y + h * radius), new Point(centre.x + h * radius, centre.y - h * radius));
		break;
	default:
		console.log("Unknown syllabic consonant: " + letter);
	}
	res.vowel = letter;
	return res;
}

SYLLABIC_CONSONANTS = ["m̩", "n̩", "ŋ̩"];

GlyphFactory.prototype.punctuation = function() {

}