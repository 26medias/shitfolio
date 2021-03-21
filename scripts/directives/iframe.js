(function(window) {
	window.app.directive('uiIframe', ['$compile', '$timeout', function ($compile, $timeout) {
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
					
				},
			};
			
            var evt = window.Arbiter.subscribe('iframe.load', function(src) {
                //console.log("src", src);
                $scope.safeApply(function() {
                    $scope.main.src = src;
                });
            });
			
			$timeout(function() {
				$scope.main.init();
			});
			
			$scope.$on('$destroy', function() {
				clearInterval(refreshClock);
                window.Arbiter.unsubscribe(evt);
			});
		}
		return {
			replace: 		true,
			link: 			component,
			scope:			{},
			templateUrl:	'scripts/directives/iframe.html'
		};
	}]);
})(window);