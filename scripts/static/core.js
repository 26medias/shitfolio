(function() {
	
	var electron	= require('electron');
	var remote		= electron.remote;
	var shell		= electron.shell;
	var path		= require('path');
	var mkdirp		= require('mkdirp');
	var fstool		= require('fs-tool');
	const {getCurrentWindow, globalShortcut} = require('electron').remote;
	
	
	var ftl = function() {
		this.auth			= false;
		this._jsonPrefix 	= ":json:";
		this.contentHeight	= $(window).height()-115;
		
		// Default env & zone
		this.env			= 'dev';
		this.zone			= 'US';
	};
	ftl.prototype.apicall	= function(options) {
		var scope = this;
		
		options	= _.extend({
		}, options);
		
		//console.log("apicall", options);
		
		
		var ajaxObj = {
			url: 		options.url,
			dataType: 	'json',
			type:		options.type||"POST",
			data:		options.params,
			headers:	options.headers,
			success: 	function(response, status){
				options.callback(response, status);
			},
			error: function(jqXHR, data, errorThrown, code) {
				console.log("error",jqXHR, data, errorThrown, code);
				if (jqXHR && jqXHR.status==401) {
					window.ftl.dialog.open('401');
				}
				options.onError({
					error:		true,
					message:	errorThrown
				});
			}
		};
		
		
		if (options.json) {
			ajaxObj.data = JSON.stringify(ajaxObj.data);
		}
		
		if (options.crossDomain) {
			ajaxObj.crossDomain	= true;
			ajaxObj.contentType = "application/json";
		}2
		
		$.ajax(ajaxObj);
	};
	ftl.prototype.qs = function() {
		var urlParams;
		var match,
		pl     = /\+/g,  // Regex for replacing addition symbol with a space
		search = /([^&=]+)=?([^&]*)/g,
		decode = function (s) { return decodeURIComponent(s.replace(pl, " ")); },
		query  = window.location.search.substring(1);
	
		urlParams = {};
		while (match = search.exec(query))
		urlParams[decode(match[1])] = decode(match[2]);
		return urlParams;
	};
	ftl.prototype.uuid	= function() {
		return 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
			var r = Math.random()*16|0, v = c == 'x' ? r : (r&0x3|0x8);
			return v.toString(16);
		});
	};
	// Open links in the OS's default browser
	ftl.prototype.openLink	= function(link) {
		console.log("openLink", link);
		shell.openExternal(link);
	};
	
	// Cookies
	ftl.prototype._setCookie = function(name,value,days) {
		
		// encode JSON if required
		if (typeof value != "string" && typeof value != "number") {
			value = this._jsonPrefix+JSON.stringify(value);
		}
		
		if (days) {
			var date = new Date();
			date.setTime(date.getTime()+(days*24*60*60*1000));
			var expires = "; expires="+date.toGMTString();
		} else{
			var expires = "";
		}
		document.cookie = name+"="+value+expires+"; path=/;";
		
		return true;
	};
	ftl.prototype.setCookie = function(name,value,days) {
		this._setCookie(name,value,days);
		this._setCookie(name+'_created',(new Date()).getTime(),days);
		return true;
	};
	ftl.prototype.getCookie = function(name) {
		try {
			var nameEQ = name + "=";
			var ca = document.cookie.split(';');
			for(var i=0;i < ca.length;i++) {
				var c = ca[i];
				while (c.charAt(0)==' ') c = c.substring(1,c.length);
				if (c.indexOf(nameEQ) == 0){
					var cookieValue = c.substring(nameEQ.length,c.length);
					//console.log("cookieValue",cookieValue.substr(0, this._jsonPrefix.length) == this._jsonPrefix, cookieValue.substr(this._jsonPrefix.length));
					// Now we decode if required
					if (cookieValue.substr(0, this._jsonPrefix.length) == this._jsonPrefix) {
						cookieValue = JSON.parse(cookieValue.substr(this._jsonPrefix.length));
						//console.log("cookieValue", cookieValue);
						return cookieValue;
					}
					return null;//cookieValue;
				}
			}
		} catch(e) {
			console.log("Invalid Json Cookie:", name, cookieValue);
			return null;
		}
		return false;
	};
	ftl.prototype.getCookies = function() {
		var cookies = {};
		if (document.cookie && document.cookie != '') {
			var split = document.cookie.split(';');
			for (var i = 0; i < split.length; i++) {
				var name_value = split[i].split("=");
				name_value[0] = name_value[0].replace(/^ /, '');
				cookies[decodeURIComponent(name_value[0])] = decodeURIComponent(name_value[1]);
				if (cookies[decodeURIComponent(name_value[0])].substr(0, this._jsonPrefix.length) == this._jsonPrefix) {
					cookies[decodeURIComponent(name_value[0])] = JSON.parse(cookies[decodeURIComponent(name_value[0])].substr(this._jsonPrefix.length));
				}
			}
		}
		return cookies;
	};
	ftl.prototype.cookieAge = function(name) {
		var cookie = this.getCookie(name+'_created');
		
		if (!cookie) {
			return false;
		}
		
		var cookieCreation	= new Date(parseInt(cookie)).getTime();
		var timestamp		= new Date().getTime()
		
		return timestamp-cookieCreation;
	};
	
	window.ftl = new ftl();
	
	// FTL plugins
	
	// == Dialog ==
	window.ftl.dialog = {
		visible:	true,
		front:	 	"",
		status:	 	{},
		payload:	{},
		open:	function(id, payload) {
			console.log("dialog.open", id);
			window.ftl.dialog.status[id]	= true;
			window.ftl.dialog.payload[id]	= payload;
			window.ftl.dialog.front			= id;
			window.Arbiter.inform("dialog.opened", {id:id, payload:payload});
		},
		close:	function(id) {
			window.ftl.dialog.status[id]	= false;
			window.ftl.dialog.front			= null;
			delete window.ftl.dialog.payload[id];
			window.Arbiter.inform("dialog.closed", {id:id});
		},
		hide:	function() {
			window.ftl.dialog.visible		= false;
			window.Arbiter.inform("dialog.hidden", {});
		},
		show:	function() {
			window.ftl.dialog.visible		= true;
			window.Arbiter.inform("dialog.shown", {});
		},
	};
	// == Sidebar Menu ==
	window.ftl.sidebar = {
		sections:	[],
		section: {
			find:	function(section_id) {
				var section = _.find(window.ftl.sidebar.sections, function(section) {
					return section.id==section_id;
				});
				return section;
			},
			add:	function(section_name, section_id) {
				var section = {
					id:		section_id||window.ftl.uuid(),
					name:	section_name,
					items:	[]
				};
				window.ftl.sidebar.sections.push(section);
				return section.id;
			},
			remove:	function(section_id) {
				var found = false;
				window.ftl.sidebar.sections = _.filter(window.ftl.sidebar.sections, function(section) {
					if (section.id==section_id) {
						found = true;
					}
					return section.id!=section_id;
				});
				return found;
			}
		},
		menu: {
			find:	function(section_id, menu_id) {
				var section = _.find(window.ftl.sidebar.sections, function(section) {
					return section.id==section_id;
				});
				if (section) {
					var menu = _.find(section.items, function(item) {
						return item.id==menu_id;
					});
					return menu;
				}
				return false;
			},
			update:	function(section_id, menu_id, modifyFn) {
				window.ftl.sidebar.sections = _.map(window.ftl.sidebar.sections, function(section) {
					if (section.id==section_id) {
						section.items = _.map(section.items, function(item) {
							if (item.id==menu_id) {
								item	= modifyFn(item);
							}
							return item;
						});
					}
					return section;
				});
			},
			// Toggle a boolean value on the whole section, set true only to menu_id
			toggle:	function(section_id, menu_id, property_name, property_value) {
				window.ftl.sidebar.sections = _.map(window.ftl.sidebar.sections, function(section) {
					if (section.id==section_id) {
						section.items = _.map(section.items, function(item) {
							if (item.id==menu_id) {
								item[property_name]	= property_value||true;
							} else {
								item[property_name]	= false;
							}
							return item;
						});
					}
					return section;
				});
			},
			add:	function(section_id, menu_object) {
				if (!menu_object.id) {
					menu_object.id	= window.ftl.uuid();
				}
				window.ftl.sidebar.sections = _.map(window.ftl.sidebar.sections, function(section) {
					if (section.id==section_id) {
						section.items.push(menu_object);
					}
					return section;
				});
				return menu_object.id;
			},
			remove:	function(section_id, menu_id) {
				console.log("Menu remove", section_id, menu_id);
				var found = false;
				window.ftl.sidebar.sections = _.map(window.ftl.sidebar.sections, function(section) {
					if (section.id==section_id) {
						console.log("Menu Section found", section);
						section.items = _.filter(section.items, function(item) {
							if (item.id==menu_id) {
								found = true;
							}
							return item.id!=menu_id;
						});
					}
					return section;
				});
				return found;
			}
		}
	};
	
	// == Top Menu ==
	window.ftl.menu = {
		sections:	[],
		section: {
			find:	function(section_id) {
				var section = _.find(window.ftl.menu.sections, function(section) {
					return section.id==section_id;
				});
				return section;
			},
			add:	function(section_name, section_id) {
				var section = {
					id:		section_id||window.ftl.uuid(),
					name:	section_name,
					items:	[]
				};
				window.ftl.menu.sections.push(section);
				return section.id;
			},
			remove:	function(section_id) {
				var found = false;
				window.ftl.menu.sections = _.filter(window.ftl.menu.sections, function(section) {
					if (section.id==section_id) {
						found = true;
					}
					return section.id!=section_id;
				});
				return found;
			}
		},
		menu: {
			add:	function(section_id, menu_object, menu_id) {
				menu_object.id	= menu_id||window.ftl.uuid();
				window.ftl.menu.sections = _.map(window.ftl.menu.sections, function(section) {
					if (section.id==section_id) {
						section.items.push(menu_object);
					}
					return section;
				});
				return menu_object.id;
			},
			remove:	function(section_id, menu_id) {
				var found = false;
				window.ftl.menu.sections = _.map(window.ftl.menu.sections, function(section) {
					if (section.id==section_id) {
						section.items = _.filter(section.items, function(item) {
							if (item.menu_id==menu_id) {
								found = true;
							}
							return item.menu_id!=menu_id;
						});
					}
					return section;
				});
				return found;
			}
		}
	};
	
	const BNB = '0xbb4cdb9cbd36b01bd1cbaebf2de08d9173bc095c';


	// Data provider
	window.ftl.data = {
		
		loadAll:	function(callback) {
			//console.log("loadAll");
			var stack	= new pstack({});
			
			// Load the data
			stack.add(function(done) {
				window.ftl.data.refreshSettings(done);
			});

			stack.add(function(done) {
				window.ftl.explorer.init(done);
			});

			stack.add(function(done) {
				window.ftl.portfolio.init(done);
			});

			stack.add(function(done) {
				window.ftl.discoverer.init(done);
			});
			
			// Test BSC
			/*stack.add(function(done) {
				window.ftl.bsc.refresh(done);
			});*/
			
			// Test Bitquery
			/*stack.add(function(done) {
				window.ftl.bitquery.refresh();
			});*/
			
			stack.start(function() {
				if (callback) {
					callback();
				}
			});
		},
		refreshSettings:	function(callback) {
			fstool.file.readJson('./settings.json', function(jsonSettings) {
				window.ftl.settings = jsonSettings;
				console.log("settings", jsonSettings)
				callback(jsonSettings);
			});
		},
		update:	function(name, modifier, callback) {
			// Read the settings
			var filename	= path.normalize("./cache_"+name+".json");
			console.log("filename",filename);
			fstool.file.readJson(filename, function(jsonSettings) {
				modifier(jsonSettings, function(response) {
					fstool.file.write(filename, JSON.stringify(response, null, 4), function() {
						if (callback) {
							callback(response);
						}
					});
				});
			});
		},
		read:	function(name, callback) {
			// Read the settings
			var filename	= path.normalize("./cache_"+name+".json");
			console.log("filename",filename);
			fstool.file.readJson(filename, function(response) {
				if (callback) {
					callback(response);
				}
			});
		}
	};
	window.ftl.data.loadAll();


	/* FIREBASE */
	/*
	window.ftl.firebase = {
		init: function() {
			window.ftl.firebase.admin = require("firebase-admin");
			var serviceAccount = require("./firebase.json");
			window.ftl.firebase.admin.initializeApp({
				credential: window.ftl.firebase.admin.credential.cert(serviceAccount),
				databaseURL: "https://shitfoliodb-default-rtdb.firebaseio.com"
			});
			window.ftl.firebase.db = window.ftl.firebase.admin.database();
		},
		get:	function(pathname, callback) {
			var ref = window.ftl.firebase.db.ref(pathname);
			ref.once("value", function(snapshot) {
				callback(snapshot.val());
			});
		},
		set:	function(pathname, data) {
			var ref = window.ftl.firebase.db.ref(pathname);
			ref.set(data);
		},
		update:	function(pathname, data) {
			var ref = window.ftl.firebase.db.ref(pathname);
			ref.update(data);
		},
		push:	function(pathname, data) {
			var ref = window.ftl.firebase.db.ref(pathname);
			ref.push(data);
		}
	}
	window.ftl.firebase.init()
	*/

	/* BSC SCAN, to explore wallets & transactions */
	window.ftl.bsc = {
		refresh:	function(callback) {
			var stack	= new pstack({});
			
			// Get the transactions
			stack.add(function(done) {
				window.ftl.bsc.get_balance(function(response) {
					console.log("get_balance", response)
					done();
				})
			});
			// Get the transactions
			stack.add(function(done) {
				window.ftl.bsc.list_bought(function(response) {
					console.log("list_bought", response)
					done();
				})
			});
			// Get the transactions
			stack.add(function(done) {
				window.ftl.bsc.list_bought2(function(response) {
					console.log("list_bought2", response)
					done();
				})
			});
			// Get the transactions
			stack.add(function(done) {
				window.ftl.bsc.list_sold(function(response) {
					console.log("list_sold", response)
					done();
				})
			});
			// Get the transactions
			stack.add(function(done) {
				window.ftl.bsc.list_main(function(response) {
					console.log("list_main", response)
					done();
				})
			});
			
			stack.start(function() {
				if (callback) {
					callback();
				}
			});
		},
		list_bought:	function(callback) {
			window.ftl.bsc.fetch({
				module:		"account",
				action:		"tokentx",
				startblock:	1,
				endblock:	99999999,
				sort:		"asc"
			}, callback)
		},
		list_bought2:	function(callback) {
			window.ftl.bsc.fetch({
				module:		"account",
				action:		"tokennfttx",
				startblock:	1,
				endblock:	99999999,
				sort:		"asc"
			}, callback)
		},
		list_sold:	function(callback) {
			window.ftl.bsc.fetch({
				module:		"account",
				action:		"txlistinternal",
				startblock:	1,
				endblock:	99999999,
				sort:		"asc"
			}, callback)
		},
		list_main:	function(callback) {
			window.ftl.bsc.fetch({
				module:		"account",
				action:		"txlist",
				startblock:	1,
				endblock:	99999999,
				sort:		"asc"
			}, callback)
		},
		get_balance:	function(callback) {
			window.ftl.bsc.fetch({
				module:		"account",
				action:		"balance",
				tag:		"latest"
			}, callback)
		},
		token_info:	function(contractaddress, callback) {
			window.ftl.bsc.fetch({
				module:				"token",
				action:				"tokeninfo",
				contractaddress:	contractaddress
			}, callback)
		},
		fetch:	function(params, callback) {
			window.ftl.apicall({
				url:		"https://api.bscscan.com/api",
				method:		"GET",
				headers:	{},
				params:		_.extend({}, params, {
					address: window.ftl.settings.wallet,
					apikey:  window.ftl.settings.bscscan.api_key
				}),
				callback:	function(response) {
					console.log("bscscan api response", response)
					if (response && response.status=="1") {
						callback(response.result)
					} else {
						callback({error: true, message: response})
					}
				}
			});
		}
	}



	/* BITQUERY */
	window.ftl.bitquery = {
		refresh:	function(callback) {
			var stack	= new pstack({});
			
			stack.add(function(done) {
				window.ftl.bitquery.exec('pancake-historical', {
					baseCurrency:	BNB,
					quoteCurrency:  '0x9b7f59a5b5a2d0a7e9daeb5b5a19da112d533dc7'
				}, function(response) {
					console.log("pancake-historical", response)
					done();
				})
			});
			
			stack.start(function() {
				if (callback) {
					callback();
				}
			});
		},
		exec:	function(query_name, params, callback) {
			fstool.file.read('./scripts/graphql/'+query_name+'.graphql', function(graphql) {
				_.each(params, function(v, k) {
					graphql = graphql.replace(new RegExp('%'+k+'%','g'), v)
				});
				window.ftl.bitquery.fetch(graphql, callback)
			});
		},
		fetch:	function(data, callback) {
			//console.log("fetch()", data)
			window.ftl.apicall({
				url:		"https://graphql.bitquery.io",
				method:		"POST",
				headers:	{
					"X-API-KEY": window.ftl.settings.bitquery.api_key
				},
				params:		{
					query: data,
					params: {}
				},
				callback:	function(response) {
					callback(response)
				}
			});
		}
	}

	/* PORTFOLIO */
	window.ftl.portfolio = {
		data:	{},
		init:	function(callback) {
			window.ftl.portfolio.refreshAll(callback);
			setInterval(function() {
				window.ftl.portfolio.refreshAll();
			}, 30000);
		},
		refreshAll:	function(callback) {
			if (window.ftl.portfolio.loading) {
				if (callback) {
					callback();
				}
				return false;
			}
			window.ftl.portfolio.loading = true;

			var stack		= new pstack({});
			
			var bufferBalance = [];

			// Get the current balance
			stack.add(function(done) {
				window.ftl.portfolio.refreshBalance(function(response) {
					bufferBalance = response;
					done();
				}, bufferBalance);
			});

			// Get the current balance values
			stack.add(function(done) {
				window.ftl.portfolio.refreshCharts(function(response) {
					bufferBalance = response;
					done();
				}, bufferBalance);
			});

			// Load the wallet to find the contracts being traded
			stack.add(function(done) {
				window.ftl.portfolio.refreshPositions(function(positions, response) {
					bufferBalance = response;
					done();
				}, bufferBalance);
			});
			
			stack.start(function() {
				window.ftl.portfolio.data.balances = bufferBalance;
				window.ftl.portfolio.data.balances.sort(function(a, b) {
					if (a.currency.symbol=='BNB') {
						return -1;
					}
					return b.gains-a.gains;
				})
				window.ftl.portfolio.last_refresh = new Date();
				window.ftl.portfolio.loading = false;
				if (callback) {
					callback();
				}
			});
		},
		refreshBalance:	function(callback, bufferBalance) {
			window.ftl.bitquery.exec('pancake-balance', {
				wallet: window.ftl.settings.wallet
			}, function(response) {
				var balances = [];
				_.each(response.data.ethereum.address, function(currItem) {
					_.each(currItem.balances, function(item) {
						balances.push(item);
					})
				})
				//console.log("balances", balances)
				//window.ftl.portfolio.data.balances = balances;
				bufferBalance = balances;
				if (callback) {
					callback(bufferBalance);
				}
			})
		},
		refreshCharts:	function(callback, bufferBalance) {
			var stack	= new pstack({async: true});
			var charts	= {}

			//_.each(window.ftl.portfolio.data.balances, function(item, n) {
			_.each(bufferBalance, function(item, n) {
				if (item.value>0 && item.currency.symbol!='BNB') {
					stack.add(function(done) {
						window.ftl.bitquery.exec('pancake-historical', {
							baseCurrency:	item.currency.address,
							quoteCurrency:	BNB
						}, function(response) {

							charts[item.currency.symbol] = response.data.ethereum.dexTrades;
							//window.ftl.portfolio.data.balances[n].bnbValue = item.value * parseFloat(charts[item.currency.symbol][0].close_price)
							bufferBalance[n].bnbValue = item.value * parseFloat(charts[item.currency.symbol][0].close_price)
							//console.log(item.currency.symbol, window.ftl.portfolio.data.balances[n].bnbValue);
							done();
						})
					});
				}
			});
			
			stack.start(function() {
				window.ftl.portfolio.data.charts = charts;
				if (callback) {
					callback(bufferBalance);
				}
			});
		},
		refreshPositions:	function(callback, bufferBalance) {
			window.ftl.bitquery.exec('pancake-transactions', {
				wallet: window.ftl.settings.wallet
			}, function(response) {
				console.log("pancake-transactions", response.data.ethereum.dexTrades);
				// Sort asc
				response.data.ethereum.dexTrades.sort(function(a,b) {
					return a.block.timestamp.unixtime-b.block.timestamp.unixtime;
				});
				window.ftl.portfolio.data.positions = response.data.ethereum.dexTrades;

				// Calculate how much we invested, sold & avg price
				var ledger = {}
				_.each(response.data.ethereum.dexTrades, function(item) {
					if (item.buyCurrency.symbol=='WBNB') {
						// Buy
						var symbol = item.sellCurrency.symbol;
						if (!ledger[symbol]) {
							ledger[symbol] = {
								balance: 0,
								avg: {
									sum: 0,
									n: 0,
									value: 0
								},
								transactions: [],
								sold:	false
							}
						}
						ledger[symbol].avg.sum 	+= item.buyAmount;
						ledger[symbol].avg.n 	+= 1;
						ledger[symbol].avg.value = ledger[symbol].avg.sum/ledger[symbol].avg.n;
						ledger[symbol].balance 	+= item.sellAmount-item.transaction.gas;
						ledger[symbol].transactions.push(item.sellAmount);
					} else {
						// Sell
						var symbol = item.buyCurrency.symbol;
						if (!ledger[symbol]) {
							ledger[symbol] = {
								balance: 0,
								avg: {
									sum: 0,
									n: 0,
									value: 0
								},
								transactions: [],
								sold:	false
							}
						}
						ledger[symbol].sold = true;
						ledger[symbol].balance -= item.buyAmount-item.transaction.gas;
						ledger[symbol].transactions.push(-item.buyAmount);
					}
				})

				console.log("ledger", ledger)

				/*_.each(window.ftl.portfolio.data.balances, function(item, n) {
					if (ledger[item.currency.symbol]) {
						if (!ledger[item.currency.symbol].sold) {
							window.ftl.portfolio.data.balances[n].gains = ((item.bnbValue-ledger[item.currency.symbol].avg.sum)/ledger[item.currency.symbol].avg.sum)*100;
						}
						window.ftl.portfolio.data.balances[n].sold = !!ledger[item.currency.symbol].sold;
					}
				})*/
				_.each(bufferBalance, function(item, n) {
					if (ledger[item.currency.symbol]) {
						//if (!ledger[item.currency.symbol].sold) {
						bufferBalance[n].gains = ((item.bnbValue-ledger[item.currency.symbol].avg.sum)/ledger[item.currency.symbol].avg.sum)*100;
						//}
						bufferBalance[n].sold = !!ledger[item.currency.symbol].sold;
					}
				})

				// Sort the balances by highest value
				//window.ftl.portfolio.data.balances.sort(function(a, b) {
				bufferBalance.sort(function(a, b) {
					return b.bnbValue-a.bnbValue;
				})

				window.ftl.portfolio.data.ledger = ledger;

				if (callback) {
					callback(response.data.ethereum.dexTrades, bufferBalance);
				}
			})
		},
		refreshBalanceValues:	function(callback) {
			var stack		= new pstack({async: true});
			
			_.each(window.ftl.portfolio.data.balances, function(item) {
				if (item.value>0 && item.currency.symbol!='BNB') {
					stack.add(function(done) {
						window.ftl.bitquery.exec('pancake-latest-price', {
							baseCurrency:	item.currency.address,
							quoteCurrency:	BNB
						}, function(response) {
							console.log(item.currency.symbol, response);
							done();
						})
					});
				}
			});
			
			stack.start(function() {
				if (callback) {
					callback();
				}
			});
		}
	}

	/* Explorer */
	window.ftl.explorer = {
		data:	{},
		init:	function(callback) {
			console.log("Explorer init")
			window.ftl.explorer.refreshAll(callback);
			setInterval(function() {
				window.ftl.explorer.recentTrades();
			}, 1000*30);
		},
		refreshAll:	function(callback) {
			window.ftl.explorer.loading = true;

			var stack		= new pstack({});
			
			// Read the existing tokens
			stack.add(function(done) {
				window.ftl.data.read('tokens', function(response) {
					if (!response) {
						response = {};
					}
					window.ftl.explorer.data.tokens = response;
					done();
				});
			});
			stack.add(function(done) {
				window.ftl.data.read('watchlist', function(response) {
					if (!response) {
						response = {};
					}
					window.ftl.explorer.data.watchlist = response;
					done();
				});
			});
			
			// Get the current balance
			stack.add(function(done) {
				window.ftl.explorer.recentTrades(done);
			});
			
			stack.start(function() {
				window.ftl.explorer.last_refresh = new Date();
				window.ftl.explorer.loading = false;
				if (callback) {
					callback();
				}
			});
		},
		recentTrades:	function(callback) {
			//console.log("recentTrades")
			window.ftl.bitquery.exec('pancake-recent-trades', {}, function(response) {
				var trades = response.data.ethereum.dexTrades;
				var ignore = ['BUSD','WBNB','ETH','USDT']
				var tokens = {};
				_.each(trades, function(trade) {
					if (!tokens[trade.sellCurrency.symbol] && !_.contains(ignore, trade.sellCurrency.symbol)) {
						tokens[trade.sellCurrency.symbol] = trade.sellCurrency.address;
					}
				});
				//console.log("pancake-recent-trades", trades)
				//console.log("pancake-recent-tokens", tokens)
				window.ftl.explorer.getTokenBirthdates(tokens, function(tokenbd) {
					//console.log("token-age tokenbd", tokenbd);
					window.ftl.explorer.savePotentialTokens(tokenbd, callback);
				});
			})
		},
		getTokenBirthdates:	function(tokens, callback) {
			var stack	= new pstack({async: true});
			var tokenbd	= {}

			console.log("getTokenBirthdates() tokens", tokens)

			_.each(tokens, function(address, symbol) {
				if (!window.ftl.explorer.data.tokens[symbol]) {
					stack.add(function(done) {
						window.ftl.bitquery.exec('pancake-token-age', {
							baseCurrency:	BNB,
							quoteCurrency:	address
						}, function(response) {
							try {
								tokenbd[symbol] = {
									address:	address,
									created:	new Date(response.data.ethereum.dexTrades[0].timeInterval.minute)
								};
							} catch(e) {
								console.info("Parse failure", symbol, response);
							}
							done();
						})
					});
				}
			});
			
			stack.start(function() {
				console.log("tokenbd", tokenbd)
				if (callback) {
					callback(tokenbd);
				}
			});
		},
		savePotentialTokens:	function(tokens, callback) {
			console.log("savePotentialTokens()", tokens)
			var buffer = {};

			// Filter the potential ones
			var maxAge = 1000*60*60*24*1;
			_.each(tokens, function(tokenInfo, symbol) {
				if (!window.ftl.explorer.data.tokens[symbol]) {
					buffer[symbol] = tokenInfo;
				}
			});

			console.log("buffer", buffer)

			window.ftl.data.update('tokens', function(data, update) {
				if (!data) {
					data = {}
				}
				data = _.extend(data, buffer)
				update(data);
				window.ftl.explorer.data.tokens = data;
			}, function() {
				if (callback) {
					callback();
				}
			});
		},
		openChart:	function(addr) {
			//window.ftl.openLink('https://unidexbeta.app/bscCharting?token='+addr);
			window.Arbiter.inform('iframe.load', 'https://unidexbeta.app/bscCharting?token='+addr);
		},
		openTokenInfo:	function(addr) {
			window.ftl.openLink('https://bscscan.com/token/'+addr);
			//window.Arbiter.inform('iframe.load', 'https://bscscan.com/token/'+addr);
		},
		openTokenContract:	function(addr) {
			window.ftl.openLink('https://bscscan.com/address/'+addr);
			//window.Arbiter.inform('iframe.load', 'https://bscscan.com/token/'+addr);
		},
		openPancakeSwap:	function(addr) {
			window.ftl.openLink('https://exchange.pancakeswap.finance/#/swap?inputCurrency=BNB&outputCurrency='+addr);
		},
		star:	function(symbol) {
			window.ftl.data.update('watchlist', function(data, update) {
				if (!data) {
					data = {}
				}
				if (data[symbol]) {
					delete data[symbol];
				} else {
					if (window.ftl.explorer.data.tokens[symbol]) {
						data[symbol] = window.ftl.explorer.data.tokens[symbol];
					}
				}
				update(data);
				window.ftl.explorer.data.watchlist = data;
			}, function() {
				
			});
		}
	}


	/* Coin Discoverer */
	window.ftl.discoverer = {
		lastBlock:	0,	// Last block investigated
		tokens:		{}, // All the known tokens
		init:	function(callback) {
			console.log("Discoverer init")
			window.ftl.data.read('new_tokens', function(data) {
				if (!data) {
					data = {};
				}
				window.ftl.discoverer.tokens = data;
				window.ftl.discoverer.refresh(callback);
				/*setInterval(function() {
					window.ftl.discoverer.refresh();
				}, 1000*30);*/
			});
		},
		refresh:	function(callback) {
			if (window.ftl.discoverer.lastBlock==0) {
				window.ftl.bitquery.exec('pancake-new-tokens', {}, function(response) {
					window.ftl.discoverer.processTokens(response, callback);
				})
			} else {
				window.ftl.bitquery.exec('pancake-new-tokens-after-block', {
					blockheight: window.ftl.discoverer.lastBlock
				}, function(response) {
					window.ftl.discoverer.processTokens(response, callback);
				})
			}
		},
		processTokens:	function(response, callback) {
			var list = response.data.ethereum.arguments;
			console.log("discoverer", list);
			var new_tokens = {};
			_.each(list, function(item) {
				var type 		= item.argument.name;
				var name 		= item.reference.smartContract.currency.name;
				var address		= item.reference.address;
				var ignoreList 	= ['Wrapped BNB','BUSD Token','PancakeSwap Token','Tether USD','-'];
				if (!_.contains(ignoreList, name) && !window.ftl.discoverer.tokens[address]) {
					new_tokens[address] = {
						type:		type,
						name:		name,
						address:	address,
						created:	item.block.timestamp.unixtime
					}
				}
			});

			//window.ftl.discoverer.tokens[address]

			window.ftl.data.update('new_tokens', function(data, update) {
				if (!data) {
					data = {}
				}
				data = _.extend(data, new_tokens)
				update(data);
			}, function() {
				if (callback) {
					callback();
				}
			});
		}
	}
	
})(window)