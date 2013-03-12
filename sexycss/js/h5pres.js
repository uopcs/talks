var rdfx = rdfx || {};
rdfx.h5pres = (function () {
	"use strict";
	var slides,
		nonslides,
		everything,
		stylesheets,
		activeStyleSheet = 0,
		presenting = false,
		cascadingHeadings = true,
		current = 0,
		keys = { backspace : 8, tab: 9, escape : 27, pageup : 33, pagedown : 34, end : 35, home : 36, left : 37, up : 38, right : 39, down : 40, slash : 191, f_five : 116 },
		params = { slide : "s", debug : "debug" },
		debug = false,

	// Analyse the query part of the URI returning an array of name value pairs.
	// Candidate for memoization?
	parseHash = function () {
		var i, arg, argObj = {}, args;

		if (location.hash) {
			args = location.hash.substring(1).split('&');
			for (i = 0; i < args.length; i = i + 1) {
				arg = args[i].split('=');
				argObj[arg[0]] = arg[1];
			}
		}
		return argObj;
	},

	/* return the value of a particular field in the query */
	readHash = function (name) {
		return parseHash()[name];
	},

	/* writes a value to the location URI. other existing values are not affected */
	writeHash = function (name, value) {
		var propName, generatedHash = [], argObj = parseHash();
		argObj[name] = value;

		for (propName in argObj) {
			if (argObj.hasOwnProperty(propName)) {
				generatedHash.push(propName + "=" + argObj[propName]);
			}
		}
		location.hash = generatedHash.join("&");
	},

	/*
	showAfterDelay = function (elem, delay) {
		setTimeout(show.bind(this), delay, elem);
	},
	*/
	
	setBg = function (elem) {
		var imgElem = elem.querySelectorAll("figure.bg img");
		var shim = document.getElementById("presoshim");
		shim.style.display = "";
		if (imgElem && imgElem[0] && imgElem[0].src) {
			shim.style.background = "url("+imgElem[0].src+")";
			shim.style.backgroundSize = "cover";
		} else {
			shim.style.backgroundImage = "";
		}

	},

	injectShim = function() {
		var shim = document.getElementById("presoshim");
		if (!shim) {
			shim = document.createElement("div");
			shim.setAttribute("id", "presoshim");
			document.body.appendChild( shim );
		}
	},
	
	injectMeters = function() {
		var n, i, m, l=slides.length-1;
		for ( i =0; i<slides.length; i++) {
			m = document.createElement("meter");
			m.setAttribute("value", i);
			m.setAttribute("min", 0);
			m.setAttribute("max", l);
			m.setAttribute("title", "slide"+i);
			m.setAttribute("class", "sideme");
			m.appendChild(document.createTextNode(i+"/"+l));
			slides[i].insertBefore(m, slides[i].firstChild);
		}
	},
	
	show = function (elem) {
		var n, i, cascaded;
		for ( i =0; i<everything.length; i++) {
			if (everything[i].style.display != "none") {
				everything[i].style.display = "none";
			}
		}
		
		for ( i =0; i<everything.length; i++) {
			n = elem.compareDocumentPosition(everything[i]);
			switch (n) {
				case 0:
					// same node.
					// just delete any display information to ensure it's not hidden
					everything[i].style.display = "";
					break;
				case 2:
				case 4:
					// outside the tree of interest so hide it
					//everything[i].style.display = "none";
					break;
				case 10:
						// elem within i, so show i
						// just any display information from everything[i] to ensure it's not hidden
						everything[i].style.display = "";
						if (cascadingHeadings) {
							cascaded = everything[i].querySelector("h1");
							if (cascaded) {
								cascaded.style.display = "";
							}
						}
					break;
				default:
					// everything[i] is within elem, so show
					// everything[i] if it's not a section
					if (everything[i].nodeName !== "SECTION") {
						everything[i].style.display = "";
						if (cascadingHeadings && everything[i].parentNode) {
							cascaded = everything[i].parentNode.querySelector("h1");
							if (cascaded) {
								cascaded.style.display = "";
								cascaded.setAttribute("style", "font-size: -20%;");
							}
						}
					} else {
						//everything[i].style.display = "none";
					}
			}
		}
		setBg(elem);

	},
	
	/* hides an element */
	hide = function (elem) {
		if (elem && elem.style) {
			elem.style.display = "none";
		}
	},
	
	simpleShow = function (elem) {
		elem.style.display = "";
	},
			
	changeCurrent = function (step) {
		var next;
		if (presenting) {
			// ensure that the next slide never has an index
			// that is out of range.
			next = current + step;
			next = Math.max(next, 0);
			next = Math.min(next, slides.length-1);

			// only aniate a slide change if necessary - first
			// and last slides that have reached the beginning
			// or end don't need animation.
			if (next !== current) {
				hide(slides[current]);
				show(slides[next]);
				writeHash(params.slide, next + 1);
			}
			current = next;
		}
	},
	
	toArray = function (x) {
		var i, result = [];
		for (i = 0; i < x.length; i++) {
			result.push(x[i]);
		}
		return result;
	},

	startPresenting = function () {
		// hide everything except the current slide.
		slides.forEach(hide);
		show(slides[current]);

		presenting = true;

		// go fullscreen
		var docElm = document.documentElement;
		if (docElm.requestFullscreen) {
			docElm.requestFullscreen();
		}
		else if (docElm.mozRequestFullScreen) {
			docElm.mozRequestFullScreen();
		}
		else if (docElm.webkitRequestFullScreen) {
			docElm.webkitRequestFullScreen();
		}

		document.getElementById("startstopmenu").setAttribute("label","Stop Slideshow");
	},

	stopPresenting = function () {
		everything.forEach(simpleShow);
		slides.forEach(simpleShow);
		presenting = false;
		document.body.style.backgroundImage = "";

		// exit fullscreen
		if (document.exitFullscreen) {
			document.exitFullscreen();
		}
		else if (document.mozCancelFullScreen) {
			document.mozCancelFullScreen();
		}
		else if (document.webkitCancelFullScreen) {
			document.webkitCancelFullScreen();
		}

		document.getElementById("startstopmenu").setAttribute("label","Start Slideshow");

	},
	
	activateNextStyleSheet = function () {
		stylesheets[activeStyleSheet].disabled = true;
		activeStyleSheet = (activeStyleSheet + 1) % stylesheets.length;
		stylesheets[activeStyleSheet].disabled = false;
		if (stylesheets[activeStyleSheet].title === "presentation") {
			startPresenting();
		} else {
			stopPresenting();
		}
	},

	keypress = function (e) {
		/* Skip events with modifier keys */
		switch (e.keyCode) {
			case (keys.right):
			case (keys.down):
				this.changeCurrent(+1);
				break;
			case (keys.left):
			case (keys.up):
				this.changeCurrent(-1);
				break;
			case (keys.f_five):
			case (keys.escape):
				if (e.ctrlKey) {
					cascadingHeadings = !cascadingHeadings;
					this.changeCurrent(-1);
					this.changeCurrent(1);
				} else {
					this.activateNextStyleSheet();
				}
				break;
			case (keys.slash):
				if (e.ctrlKey) {
					this.activateNextStyleSheet();
				}
				break;
		}

		return false;
	},
	
	injectStylesheet = function () {
		var e = document.createElement('link');
		e.href = "/lib/h5pres/src/nakedpreso.css";
		e.title = "presentation";
		e.media = "screen";
		e.type = "text/css";
		e.rel = "stylesheet";
		e.disabled = true;
		document.getElementsByTagName('head')[0].appendChild(e);
	},
	
	loaded = function () {
		injectStylesheet();
		injectShim();
		injectMenu();
		stylesheets = document.querySelectorAll('link[media~=screen][rel~=stylesheet], link[media~=all][rel~=stylesheet]');
		slides = toArray( document.querySelectorAll("article>section, section>section") );
		nonslides = toArray( document.getElementsByTagName("body") );
		everything = toArray( document.querySelectorAll("body *") );
		current = readHash(params.slide) ? parseInt(readHash(params.slide), 10) - 1 : 0;
		debug = readHash(params.debug) ? true : false;
		injectMeters();
		window.addEventListener('keydown', keypress.bind(rdfx.h5pres), false);
	},

	injectMenu = function () {
		var body = document.querySelector("body");
		body.innerHTML += '<menu type="context" id="presentmenu"><menuitem id="startstopmenu" label="Start Slideshow" onclick="rdfx.h5pres.activateNextStyleSheet()" icon="/favicon.ico"></menuitem></menu>';
		var articles = toArray( document.querySelectorAll("article") );
		for (var i=0; i<articles.length; i++) {
			articles[i].setAttribute("contextmenu", "presentmenu");
		}
	};

	// return exposes some private functions as public
	return {
		loaded : loaded.bind(rdfx.h5pres),
		activateNextStyleSheet: activateNextStyleSheet.bind(rdfx.h5pres),
		changeCurrent: changeCurrent.bind(this)
	};

}());

rdfx.h5pres.loaded();