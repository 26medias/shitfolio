(function(window) {
	window.app.directive('uiSparkline', ['$compile', '$timeout', function ($compile, $timeout) {
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
			
			$scope.dialog	= window.dialog;
			$scope.core		= window.ftl;
			
			var refreshClock	= setInterval(function() {
				$scope.safeApply(function() {});
			}, 1000);
			
			$scope.main = {
				init:	function() {
					$scope.main.destroy();
					var data = [['']];
					console.log("$scope.uiSparkline", $scope.uiSparkline)
					$scope.uiSparkline.sort(function(a,b) {
						return new Date(a.timeInterval.minute).getTime()-new Date(b.timeInterval.minute).getTime()
					});
					//console.log("arr", arr)
					var dataset = _.map($scope.uiSparkline, function(item, n) {
						data.push([parseFloat(item.close_price)])
						//data.push([n])
						return parseFloat(item.close_price);
					});
					//console.log("dataset", dataset)
					var container = $(element).find('.sparkline-container').get(0);
					var data = google.visualization.arrayToDataTable(data);
					var chart = new google.visualization.ImageSparkLine(container);
					chart.draw(data, {width: 150, height: 30, showAxisLines: false,  showValueLabels: false, labelPosition: 'left', backgroundColor: '#283138'});
				},
				destroy:	function() {
					$(element).find('.sparkline-container').empty();
				},
			};
			
			
			$scope.$watch('uiSparkline', function() {
				if ($scope.uiSparkline) {
					$scope.main.init();
				}
			});
			
			$scope.$on('$destroy', function() {
				clearInterval(refreshClock);
				$scope.main.destroy();
			});
		}
		return {
			link: 			component,
			scope:			{
				uiSparkline: '='
			},
			templateUrl:	'scripts/directives/sparkline.html'
		};
	}]);
})(window);