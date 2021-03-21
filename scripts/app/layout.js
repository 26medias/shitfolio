(function(window) {
	window.app.directive('appLayout', ['$compile', '$timeout', '$mdSidenav', function ($compile, $timeout, $mdSidenav) {
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
			
			//const {remote, shell}	= require('electron');
			var electron	= require('electron');
			var remote		= electron.remote;
			var shell		= electron.shell;
			$scope.dialog	= window.dialog;
			$scope.core		= window.ftl;
			
			// Auth
			$scope.auth		= window.ftl.auth;
			$scope.session	= window.ftl.getCookie('session');
			
			var refreshClock	= setInterval(function() {
				$scope.safeApply(function() {});
			}, 1000);
			
			var menu_ids = {};
			$scope.main = {
				branches:	{},
				maximized:	false,
				init:	function() {
					if (!$scope.auth) {
						console.log("Login first");
						return false;
					}
					
					// Init the database listener
					window.ftl.database.init();
					
					$scope.safeApply(function() {
						$scope.main.loading	= true;
					});
					window.ftl.data.loadAll(function() {
						$scope.safeApply(function() {
							$scope.main.loading	= false;
						});
						
						menu_ids.workspaces	= window.ftl.menu.section.add('Options', 'options');
						window.ftl.menu.menu.add(menu_ids.workspaces, {
							label:		"Settings",
							icon:		'fas fa-cogs',
							onClick:	function() {
								window.ftl.page		= 'settings';
							}
						});
						window.ftl.menu.menu.add(menu_ids.workspaces, {
							label:		"Logout",
							icon:		'fas fa-sign-out-alt',
							onClick:	function() {
								window.ftl.logout();
							}
						});
					});
				},
				winDebug:	function () {
					console.log("winDebug");
					remote.getCurrentWindow().toggleDevTools();
				},
				winMinimize:	function () {
					console.log("winMinimize");
					remote.getCurrentWindow().minimize();
				},
				winMaximize:	function() {
					console.log("winMaximize", window.winBounds);
					if ($scope.main.maximized) {
						// Already maximized
						// Restore
						var devToolOpen	= remote.getCurrentWindow().isDevToolsOpened();
						if (devToolOpen) {
							remote.getCurrentWindow().closeDevTools();
						}
						window.resizeTo(window.winBounds.width, window.winBounds.height);
						window.moveTo(window.winBounds.x, window.winBounds.y);
						if (devToolOpen) {
							remote.getCurrentWindow().openDevTools();
						}
					} else {
						// Not maximized
						// Save the position
						window.winBounds	= remote.getCurrentWindow().webContents.getOwnerBrowserWindow().getBounds();
						window.moveTo(0, 0);
						window.resizeTo(screen.width, screen.height);
					}
					$scope.main.maximized = !$scope.main.maximized;
				},
				winClose:	function () {
					console.log("winClose");
					window.Arbiter.inform('win.close');
					setTimeout(function() {
						window.close();
					}, 750);
				},
				// API call to the local FTL server (use gatekeeper for calls to the outside)
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
			
			
			$scope.resize = function() {
				var appHeaderHeight		= parseInt($('#app-header').height());
				var winHeight			= parseInt($(window).height());
				$('.app-content').css({
					height:		(winHeight-appHeaderHeight)+'px'
				});
				window.ftl.contentHeight	= (winHeight-appHeaderHeight);
			}
			$(window).on('resize', function() {
				$scope.resize();
			});
			$(window).on('orientationchange', function() {
				$scope.resize();
			});
			var resizeITV = setInterval(function() {
				$scope.resize();
			}, 500);
			
			
			$scope.$on('$destroy', function() {
				clearInterval(refreshClock);
				clearInterval(resizeITV);
			});
		}
		return {
			link: 			component,
			scope:			{},
			templateUrl:	'scripts/app/layout.html'
		};
	}]);
})(window);