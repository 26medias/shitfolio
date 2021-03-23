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
						$scope.main.tokens = _.map($scope.core.discoverer.tokens, function(data, address) {
							return _.extend(data, {address:address, ts:new Date(data.created*1000).getTime()});
						});
						$scope.main.tokens.sort(function(a,b) {
							return b.created-a.created;
						});
						console.log("$scope.main.tokens", $scope.main.tokens.length, $scope.main.tokens);
						return true;
					} else if ($scope.tabs.is('watchlist')) {
						var tokenList = 'watchlist';
					} else if ($scope.tabs.is('all')) {
						var tokenList = 'tokens';
					} else if ($scope.tabs.is('purchased')) {
						var tokenList = 'tokens';
					}
					
					$scope.main.tokens = _.map($scope.core.explorer.data[tokenList], function(data, symbol) {
						return _.extend(data, {symbol: symbol, ts: new Date(data.created).getTime()-(1000*60*60*4)});
					})
					
					if ($scope.tabs.is('all') || $scope.tabs.is('purchased') || $scope.tabs.is('watchlist')) {
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
					if ($scope.tabs.is('purchased')) {
						var purchased = _.map($scope.core.portfolio.data.balances, function(item) {
							return item.currency.address;
						});
						//console.log("purchased", purchased);
						$scope.main.tokens = _.filter($scope.main.tokens, function(item) {
							return _.contains(purchased, item.address)
						});
						//console.log("$scope.main.tokens", $scope.main.tokens);
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
				},
				toggleRefresh:	function() {
					$scope.safeApply(function() {
						$scope.core.paused = !!$scope.core.paused;
					});
				}
			};
			


			$scope.tabs	= {
				selected:	'recent',
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
			
			/*$scope.$watch('core.explorer.data', function() {
				$scope.main.init();
			}, true);*/
			$scope.$watch('core.discoverer.tokens', function() {
				$scope.main.init();
			});
			
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