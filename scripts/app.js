(function () {
	'use strict';
	
	// To support cookies
	require('electron-cookies');

	window.app = angular.module('app', ['ngRoute','ngMaterial','ngAnimate']).config(function($sceProvider) {
		// Completely disable SCE.  For demonstration purposes only!
		// Do not use in new projects or libraries.
		$sceProvider.enabled(false);
	});;
	window.app.config(['$routeProvider', '$mdThemingProvider', function ($routeProvider, $mdThemingProvider) {
		
		$mdThemingProvider.theme('default').primaryPalette('blue').accentPalette('blue-grey').warnPalette('amber').backgroundPalette('blue-grey',{'default': '900'}).dark();
		//console.log("THEME",$mdThemingProvider.theme('default'));
		//$mdIconProvider.defaultFontSet('FontAwesome').fontSet('fa', 'FontAwesome');
		
		window.ftl.page	= 'home';
		
		$routeProvider.when('/', {
			templateUrl: './scripts/app/index.html'
		});
		
		$routeProvider.otherwise({redirectTo: '/'});
	}]);
	window.app.directive('rawHtml', function ($compile) {
		var component = function(scope, element, attrs, ctlr) {
			scope.$watch('rawHtml', function() {
				$(element).html(scope.rawHtml);
			});
		}
		return {
			link: 			component,
			replace:		false,
			scope:			{
				rawHtml:	'='
			}
		};
	});


	var nFormatter = function (num, digits) {
		var si = [
		  { value: 1, symbol: "" },
		  { value: 1E3, symbol: "K" },
		  { value: 1E6, symbol: "M" },
		  { value: 1E9, symbol: "B" },
		  { value: 1E12, symbol: "T" },
		  { value: 1E15, symbol: "P" },
		  { value: 1E18, symbol: "E" }
		];
		var rx = /\.0+$|(\.[0-9]*[1-9])0+$/;
		var i;
		for (i = si.length - 1; i > 0; i--) {
		  if (num >= si[i].value) {
			break;
		  }
		}
		return (num / si[i].value).toFixed(digits).replace(rx, "$1") + ' '+si[i].symbol;
	  }


	window.app.filter('largenumber', function() {
		return function(input, all) {
			if (!input) {
				return '';
			}
			return nFormatter(input, 2)
		}
	});
	window.app.filter('timeago', function() {
		var service = {};
		
		service.settings = {
			refreshMillis: 60000,
			allowFuture: false,
			overrideLang : null,
			fullDateAfterSeconds : null,
			strings: {
				'en_US': {
					prefixAgo: null,
					prefixFromNow: null,
					suffixAgo: 'ago',
					suffixFromNow: 'from now',
					seconds: 'just now',
					minute: 'a minute',
					minutes: '%d minutes',
					hour: 'an hour',
					hours: '%d hours',
					day: 'a day',
					days: '%d days',
					month: 'a month',
					months: '%d months',
					year: 'a year',
					years: '%d years',
					numbers: []
				}
			}
		};
		
		service.inWords = function (distanceMillis, fromTime, format, timezone) {
		
			var fullDateAfterSeconds = parseInt(service.settings.fullDateAfterSeconds, 10);
		
			if (!isNaN(fullDateAfterSeconds)) {
				var fullDateAfterMillis = fullDateAfterSeconds * 1000;
				if ((distanceMillis >= 0 && fullDateAfterMillis <= distanceMillis) ||
				(distanceMillis < 0 && fullDateAfterMillis >= distanceMillis)) {
					if (format) {
						return $filter('date')(fromTime, format, timezone);
					}
					return fromTime;
				}
			}
		
			var overrideLang = service.settings.overrideLang;
			var documentLang = document.documentElement.lang;
			var sstrings = service.settings.strings;
			var lang, $l;
		
			if (typeof sstrings[overrideLang] !== 'undefined') {
				lang = overrideLang;
				$l = sstrings[overrideLang];
			} else if (typeof sstrings[documentLang] !== 'undefined') {
				lang = documentLang;
				$l = sstrings[documentLang];
			} else {
				lang = 'en_US';
				$l = sstrings[lang];
			}
		
			var prefix = $l.prefixAgo;
			var suffix = $l.suffixAgo;
			if (service.settings.allowFuture) {
				if (distanceMillis < 0) {
					prefix = $l.prefixFromNow;
					suffix = $l.suffixFromNow;
				}
			}
		
			var seconds = Math.abs(distanceMillis) / 1000;
			var minutes = seconds / 60;
			var hours = minutes / 60;
			var days = hours / 24;
			var years = days / 365;
		
			function substitute(stringOrFunction, number) {
				var string = angular.isFunction(stringOrFunction) ?
				stringOrFunction(number, distanceMillis) : stringOrFunction;
				var value = ($l.numbers && $l.numbers[number]) || number;
				return string.replace(/%d/i, value);
			}
		
			var words = seconds < 45 && substitute($l.seconds, Math.round(seconds)) ||
			seconds < 90 && substitute($l.minute, 1) ||
			minutes < 45 && substitute($l.minutes, Math.round(minutes)) ||
			minutes < 90 && substitute($l.hour, 1) ||
			hours < 24 && substitute($l.hours, Math.round(hours)) ||
			hours < 42 && substitute($l.day, 1) ||
			days < 30 && substitute($l.days, Math.round(days)) ||
			days < 45 && substitute($l.month, 1) ||
			days < 365 && substitute($l.months, Math.round(days / 30)) ||
			years < 1.5 && substitute($l.year, 1) ||
			substitute($l.years, Math.round(years));
		
			var separator = $l.wordSeparator === undefined ?  ' ' : $l.wordSeparator;
			if(seconds < 60){
				return [prefix, words].join(separator).trim();
			} else {
				return [prefix, words, suffix].join(separator).trim();
			}
			
		};
		
		service.parse = function (input) {
			if (input instanceof Date){
				return input;
			} else if (angular.isNumber(input)) {
				return new Date(input);
			} else if (/^\d+$/.test(input)) {
				return new Date(parseInt(input, 10));
			} else {
				var s = (input || '').trim();
				s = s.replace(/\.\d+/, ''); // remove milliseconds
				s = s.replace(/-/, '/').replace(/-/, '/');
				s = s.replace(/T/, ' ').replace(/Z/, ' UTC');
				s = s.replace(/([\+\-]\d\d)\:?(\d\d)/, ' $1$2'); // -04:00 -> -0400
				return new Date(s);
			}
		};
		
		return function (value, format, timezone) {
			//ftl.log("value, format, timezone", value, format, timezone);
			var fromTime = service.parse(value);
			
			var diff = Date.now() - fromTime;
			return service.inWords(diff, fromTime, format, timezone);
			return 'blah';
		};
	});
})();