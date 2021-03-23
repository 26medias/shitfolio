(function(window) {
	window.app.directive('appHome', ['$compile', '$timeout', function ($compile, $timeout) {
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
			var path		= require('path');
			var mkdirp		= require('mkdirp');
			var fstool		= require('fs-tool');
			var remote		= electron.remote;
			
			
			$scope.dialog	= window.dialog;
			$scope.core		= window.ftl;
			
			var refreshClock	= setInterval(function() {
				$scope.safeApply(function() {});
			}, 1000);
			
			
			$scope.tabs	= {
				selected:	'holdings',
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
				api:	function(endpoint, params, callback) {
					if (!callback) {
						callback	= function() {};
					}
					window.ftl.apicall({
						url:		endpoint,
						auth:		true,
						encrypt:	true,
						headers:	{},
						params:		JSON.parse(angular.toJson(params)),
						callback:	callback
					});
				}
			};
			
			
			$timeout(function() {
				$scope.main.init();
			});
			
			$scope.$on('$destroy', function() {
				clearInterval(refreshClock);
			});
		}
		return {
			replace:		true,
			link: 			component,
			scope:			{
			},
			templateUrl:	'scripts/directives/home.html'
		};
	}]);
})(window);