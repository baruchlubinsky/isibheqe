
BASE = 16;
HEIGHT = 13.8;
TONE = HEIGHT / 3.5;

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
	this.left = 0;
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
		this.padding = function() {
			return 0;
		}
		this.kerning = function() {
			return BASE * this.unit;
		}		
		if(this.apex.y < this.origin.y) { // dy = +x
			this.zero = 1.5 * Math.PI;
			this.move = function(a, b) {
				return a.translate(new Point(b.x, b.y));
			}
		} else {	// dy = -x
			this.zero = 0.5 * Math.PI;
			this.move = function(a, b) {
				return a.translate(new Point(b.x, -b.y));
			}
		}
	}
	this.unit = Math.abs(this.unit);
	this.data = [];
	this.vowel = "";
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

Glyph.prototype.renderOn = function(canvas) {
	for(var i = 0; i < this.data.length; i++) {
		if (this.data[i].length === 2) {
			canvas.drawLine.apply(canvas, this.data[i]);
		} else if (this.data[i].length === 5) {
			canvas.drawArc.apply(canvas, this.data[i]);
		}
	}
}

Glyph.prototype.top = function() {
	if(this.consonants.indexOf("f") >= 0) {
		return 5 * this.unit;
	}
	if(this.consonants.indexOf("n̪") >= 0 || this.consonants.indexOf("n") >= 0 || this.consonants.indexOf("n̩") >= 0 || this.consonants.indexOf("ŋ̩") >= 0) {
		return 2 * TONE * this.unit;
	}
	return 0;
}

Glyph.prototype.bottom = function() {
	if(this.consonants.indexOf("j") >= 0) {
		return 6 * this.unit;
	}
	return 0;
}

Glyph.prototype.setLeft = function() {
	if (this.left !== this.padding()) {
		this.translate(new Point(this.padding() - this.left, 0));
		this.left = this.padding();
	}
}

Glyph.prototype.solidVowel = function() {
	this.addLine(this.origin,this.apex);
	this.addLine(this.apex, this.base);
	this.addLine(this.origin, this.base);
}

Glyph.prototype.openVowel = function() {
	this.addLine(this.origin,this.apex);
	this.addLine(this.apex, this.base);
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
		} else if (this.data[i].length === 5) {
			this.data[i][0] = this.data[i][0] + p.x;
			this.data[i][1] = this.data[i][1] + p.y;
		}

	}
}

Glyph.prototype.addConsonant = function(letter) {
	this.consonants.push(letter);
	switch(letter) {
		case 't':
			var start = this.move(this.origin, this.vector(this.apex, this.origin).scale(1.0/3.0));
			var end = this.move(this.base, this.vector(this.apex, this.base).scale(1.0/3.0));
			this.addLine(start, end);
			break;
		case 'pʰ':
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
			this.setLeft();
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
			var centre = this.move(this.midBase(), this.vector(this.apex, this.midBase()).scale(0.3));
			var radius = (TONE / 2.0) * this.unit;
			this.addCircle(centre, radius);
			var apex = this.move(centre, this.vector(centre, this.apex).scale(1.0 / (radius - (1 + 1.0 / this.unit))));
			this.addLine(this.origin, apex);
			this.addLine(apex, this.base);
			break;
		case "ȿ":
			var centre = this.move(this.midBase(), this.vector(this.apex, this.midBase()).scale(0.25));
			var radius = (TONE / 2.0) * this.unit;
			this.addCircle(centre, radius);
			var apex = this.move(centre, this.vector(this.apex, centre).scale(1.0 / (radius - (1 + 1.0 / this.unit))));
			var origin = this.move(this.origin, this.vector(this.apex, this.origin).scale(0.6));
			var base = this.move(this.base, this.vector(this.apex, this.base).scale(0.6));
			this.addLine(origin, apex);
			this.addLine(apex, base);
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
			var a = h * Math.cos(Math.PI / 3.0);
			var start = this.move(this.origin, this.vector(this.apex, this.origin).scale(h));
			var end = this.move(this.origin, this.vector(this.base, this.origin).scale(a));
			this.addLine(start, end);
			start = this.move(this.base, this.vector(this.apex, this.base).scale(h));
			end = this.move(this.base, this.vector(this.origin, this.base).scale(a));
			this.addLine(start, end);
			break;
		case "j":
			this.setLeft();
			var apex = this.origin.mid(this.base);
			var p = this.move(apex, this.vector(apex, this.apex).scale(0.6));
			var end = p.mid(this.origin);
			this.addLine(end, apex);
			end = p.mid(this.base);
			this.addLine(end, apex);
			break;
		case "l":
			var start = this.move(this.origin, this.vector(this.origin, this.base).scale(0.1));
			var end = this.move(this.apex, this.vector(this.origin, this.base).scale(0.1));
			this.addLine(start, end);
			break;
		case "r":
			var apex = this.move(this.midBase(), this.vector(this.apex, this.midBase()).scale(0.3));
			var start = this.move(this.origin, this.vector(this.apex, this.origin).scale(2.0/3.0));
			var end = this.move(this.base, this.vector(this.apex, this.base).scale(2.0/3.0));
			this.addLine(start, apex);
			this.addLine(apex, end);
			break;
		case "ɽ":
			var h = 0.6;
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
			this.setLeft();
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
			this.setLeft();
			var h = 0.18;
			var centre = this.move(this.midBase(), this.vector(this.apex, this.midBase()).scale(1.0 + h));
			var radius = h * HEIGHT * this.unit;
			this.addCircle(centre, radius);
			var start = this.move(centre, new Point(radius, 0));
			var end = this.move(centre, new Point(-radius, 0));
			this.addLine(start, end);
			break;
		case "n̩":
			this.setLeft();
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
		case "ŋ̩":
			this.setLeft();
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

CONSONANTS = ["t", "pʰ", "t̪", "c", "k", "ɸ", "f", "s", "ʃ", "ȿ", "x", "h", "ɬ", "w", "j", "l", "r", "ɽ", "|", "!", "||", "n̪", "n", "n̩", "ŋ̩"];

var GlyphFactory = function(unit) {
	this.unit = unit;
}

GlyphFactory.prototype.newVowel = function(letter, origin) {
	this.baseline = origin.y + (TONE + HEIGHT + 2) * this.unit;
	this.left = origin.x;
	switch (letter) {
	case 'i':
		var o = new Point(this.left, this.baseline);
		var a = new Point(o.x + (BASE / 2) * this.unit, o.y - HEIGHT * this.unit);
		var b = new Point(o.x + BASE * this.unit, o.y);
		var res = new Glyph(o, a, b);
		res.solidVowel();
		break;
	case 'a':
		var o = new Point(this.left, this.baseline - HEIGHT * this.unit);
		var a = new Point(o.x + (BASE / 2) * this.unit, this.baseline);
		var b = new Point(o.x + BASE * this.unit, o.y);
		var res = new Glyph(b, a, o);
		res.solidVowel();
		break;
	case 'u': // same as i but open
		var o = new Point(this.left, this.baseline);
		var a = new Point(o.x + (BASE / 2) * this.unit, o.y - HEIGHT * this.unit);
		var b = new Point(o.x + BASE * this.unit, o.y);
		var res = new Glyph(o, a, b);
		res.openVowel();
		break;
	case 'e':
		var o = new Point(this.left + HEIGHT * this.unit, this.baseline);
		var a = new Point(this.left, o.y - (BASE / 2) * this.unit);
		var b = new Point(o.x, o.y - BASE * this.unit);
		var res = new Glyph(o, a, b);
		res.openVowel();
		break;
	case 'o':
		var o = new Point(this.left, this.baseline - BASE * this.unit);
		var a = new Point(o.x + HEIGHT * this.unit, o.y + (BASE / 2) * this.unit);
		var b = new Point(o.x, o.y + BASE * this.unit);
		var res = new Glyph(o, a, b);
		res.openVowel();
		break;
	case 'ɔ': // same as o but solid
		var o = new Point(this.left, this.baseline - BASE * this.unit);
		var a = new Point(o.x + HEIGHT * this.unit, o.y + (BASE / 2) * this.unit);
		var b = new Point(o.x, o.y + BASE * this.unit);
		var res = new Glyph(o, a, b);
		res.solidVowel();
		break;
	case 'ɛ': // same as e but solid
		var o = new Point(this.left + HEIGHT * this.unit, this.baseline);
		var a = new Point(this.left, o.y - (BASE / 2) * this.unit);
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

GlyphFactory.prototype.punctuation = function() {
	
}