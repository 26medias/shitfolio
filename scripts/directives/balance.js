(function(window) {
	window.app.directive('uiBalance', ['$compile', '$timeout', function ($compile, $timeout) {
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
			
			
			$scope.tabs	= {
				selected:	'list',
				select:		function(id) {
					$scope.safeApply(function() {
						
						if ($scope.tabs.selected==id) {
							
						}
						
						$scope.tabs.selected	= id;
						
					});
				},
				is:		function(id) {
					return $scope.tabs.selected	== id;
				}
			};

			$scope.main = {
				init:	function() {
					var sum = 0;
					console.log("balance", $scope.core.portfolio.data.balances);
					_.each($scope.core.portfolio.data.balances, function(item) {
						if (item.currency.cumbol != 'BNB' && item.bnbValue && item.gains>=-65) {
							sum += item.bnbValue
						}
					});
					$scope.main.sum = sum;
				},
			};
			
			
			$scope.$watch('core.portfolio.data.balances', function() {
				$scope.main.init();
			}, true);
			
			$scope.$on('$destroy', function() {
				clearInterval(refreshClock);
			});
		}
		return {
			replace: 		true,
			link: 			component,
			scope:			{},
			templateUrl:	'scripts/directives/balance.html'
		};
	}]);
})(window);