(function(window) {
	window.app.directive('uiExplorer', ['$compile', '$timeout', function ($compile, $timeout) {
		var component = function($scope, element, attrs, ctlr, transcludeFn) {

			// Utilities
			$scope.safeApply = function(fn) {
				var phase = this.$root.$$phase;
				if(phase == '$apply' || phase == '$digest') {
					if(fn && (typeof(fn) === 'function')) {
						fn();
					}
				} else {
					this.$apply(fn);
				}
			};
			
			var electron	= require('electron');
			var remote		= electron.remote;
			
			$scope.dialog	= window.dialog;
			$scope.core		= window.ftl;
			
			var refreshClock	= setInterval(function() {
				$scope.safeApply(function() {});
			}, 1000);
			

			
			$scope.main = {
				convertTZ: function(date, tzString) {
					return new Date((typeof date === "string" ? new Date(date) : date).toLocaleString("en-US", {timeZone: tzString}));   
				},
				init:	function() {
					if ($scope.tabs.is('recent')) {
						var tokenList = 'tokens';
					} else if ($scope.tabs.is('watchlist')) {
						var tokenList = 'watchlist';
					} else if ($scope.tabs.is('all')) {
						var tokenList = 'tokens';
					}
					
					$scope.main.tokens = _.map($scope.core.explorer.data[tokenList], function(data, symbol) {
						return _.extend(data, {symbol: symbol, ts: new Date(data.created).getTime()-(1000*60*60*4)});
					})
					
					if ($scope.tabs.is('all')) {
						$scope.main.tokens.sort(function(a,b) {
							return b.symbol>a.symbol?-1:1;
						});
					} else {
						$scope.main.tokens.sort(function(a,b) {
							return b.ts-a.ts;
						});
					}
					if ($scope.tabs.is('recent')) {
						$scope.main.tokens = _.filter($scope.main.tokens, function(item) {
							return new Date().getTime()-item.ts <= 1000*60*60*3;
						});
					}
					//console.log("$scope.main.tokens", $scope.main.tokens);
				},
				refresh:	function() {
					$scope.safeApply(function() {
						$scope.main.loading = true;
					});
					window.ftl.explorer.recentTrades(function() {
						$scope.safeApply(function() {
							$scope.main.loading = false;
						});
					});
				}
			};
			


			$scope.tabs	= {
				selected:	'watchlist',
				select:		function(id) {
					$scope.safeApply(function() {
						
						if ($scope.tabs.selected==id) {
							
						}
						
						$scope.tabs.selected	= id;

						$scope.main.init();
						
					});
				},
				is:		function(id) {
					return $scope.tabs.selected	== id;
				}
			};
			
			
			$timeout(function() {
				//$scope.main.init();
			});
			
			$scope.$watch('core.explorer.data', function() {
				$scope.main.init();
			}, true);
			
			$scope.$on('$destroy', function() {
				clearInterval(refreshClock);
			});
		}
		return {
			link: 			component,
			scope:			{},
			templateUrl:	'scripts/directives/explorer.html'
		};
	}]);
})(window);