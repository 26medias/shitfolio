+(function(window) {
	function stack(options) {
		this.options = _.extend({
			async:		false,
			progress:	false
		},options);
		this.reset();
	}
	stack.prototype.reset = function() {
		this.stack 		= [];
		this.count 		= 0;
	}
	stack.prototype.add = function(fn, params) {
		this.stack.push({
			fn:		fn,
			params:	params
		});
		this.count++;
	}
	stack.prototype.start = function(callback) {
		this.process(callback);
	}
	stack.prototype.process = function(callback) {
		var scope = this;
		
		if (this.stack.length == 0) {
			callback();
			return false;
		}
		
		if (!this.options.async) {
			// synchronous execution
			if (this.stack.length == 0) {
				callback();
				return true;
			}
			
			this.stack[0].fn(function(status) {
				if (status===false) {
					scope.stack	= [];
					if (scope.options.progress!==false) {
						console.log(" - stack aborted.");
					}
					callback();
				} else {
					scope.stack.shift();
					if (scope.stack.length == 0) {
						callback();
					} else {
						scope.process(callback);
					}
				}
			}, this.stack[0].params);
		} else {
			// asynchronous execution
			var i;
			for (i=0;i<this.stack.length;i++) {
				this.stack[i].fn(function() {
					scope.count--;
					if (scope.count == 0) {
						callback();
					}
					if (scope.options.progress!==false) {
						scope.bar.tick();
					}
				}, this.stack[i].params);
			}
		}
		
	}
	
	window.pstack	= stack;
})(window);