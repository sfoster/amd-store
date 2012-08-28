define(["lang", "./lib/promise", "knockout" /*=====, "./api/Store" =====*/
], function(lang, Deferred, ko /*=====, Store =====*/){

// module:
//		store/Observable
// summary:
//		TODOC

var wrapOnce = function(originalFn, wrapFn) {
	var callCount = 0;
	var wrapped = function(){
		// after the first call, put it back how it was
		if(!(callCount++)) { wrapFn.apply(this, arguments); }
		return originalFn.apply(this, arguments);
	};
	wrapped.original = originalFn;
	return wrapped;
};

var Observable = function(/*Store*/ store){
	// summary:
	//		The Observable store wrapper takes a store and sets an observe method on query()
	//		results that can be used to monitor results for changes.
	//
	// description:
	//		Observable wraps an existing store so that notifications can be made when a query
	//		is performed.
	//
	// example:
	//		Create a Memory store that returns an observable query, and then log some
	//		information about that query.
	//
	//	| var store = store.Observable(new store.Memory({
	//	|		data: [
	//	|			{id: 1, name: "one", prime: false},
	//	|			{id: 2, name: "two", even: true, prime: true},
	//	|			{id: 3, name: "three", prime: true},
	//	|			{id: 4, name: "four", even: true, prime: false},
	//	|			{id: 5, name: "five", prime: true}
	//	|		]
	//	| }));
	//	| var changes = [], results = store.query({ prime: true });
	//	| var observer = results.observe(function(object, previousIndex, newIndex){
	//	|		changes.push({previousIndex:previousIndex, newIndex:newIndex, object:object});
	//	| });
	//
	//		See the Observable tests for more information.

	var undef, queryUpdaters = [], revision = 0;
	// a Comet driven store could directly call notify to notify observers when data has
	// changed on the backend
	// create a new instance
	store = Object.create(store);
	
	store.notify = function(object, existingId){
		// called when a change has been completed against the given object
		// 'remove' calls will only define existingId
		revision++;
		var updaters = queryUpdaters.slice();
		for(var i = 0, l = updaters.length; i < l; i++){
			updaters[i](object, existingId);
		}
	};
	var originalQuery = store.query;
	store.query = function(query, options){
		options = options || {};
		var results = originalQuery.apply(this, arguments);
		// our return value - a knockout-js Observable
		var observedResults = ko.observableArray(results);
		var registerNotifyListener;
		
		if(results && results.forEach){
			// TODO: reinstate the queryUpdates functionality, 
			// which allows subscribers to relevant queries to be notified when a store change 
			// implies a change in the results for a query
			
			var nonPagedOptions = lang.extend({}, options);
			delete nonPagedOptions.start;
			delete nonPagedOptions.count;
			
			var queryExecutor = store.queryEngine && store.queryEngine(query, nonPagedOptions);
			var queryRevision = revision;
			var listeners = [], queryUpdater;
			var originalSubscribe = observedResults.subscribe;
			
			registerNotifyListener = function(listener){
				var includeObjectUpdates = !!listener.includeObjectUpdates;
				
				listeners.push(listener);
				// first listener was added, create the query checker and updater
				queryUpdaters.push(queryUpdater = function(changed, existingId){
					console.log("queryUpdate, changed: ", changed, existingId);
					Deferred.when(results, function(resultsArray){
						var atEnd = resultsArray.length != options.count;
						var i, l, listener;
						if(++queryRevision != revision){
							throw new Error("Query is out of date, you must observe() the query prior to any data modifications");
						}
						var removedObject, removedFrom = -1, insertedInto = -1;
						if(existingId !== undef){
							// remove the old one
							for(i = 0, l = resultsArray.length; i < l; i++){
								var object = resultsArray[i];
								if(store.getIdentity(object) == existingId){
									removedObject = object;
									removedFrom = i;
									if(queryExecutor || !changed){// if it was changed and we don't have a queryExecutor, we shouldn't remove it because updated objects would be eliminated
										resultsArray.splice(i, 1);
									}
									break;
								}
							}
						}
						if(queryExecutor){
							// add the new one
							if(changed &&
									// if a matches function exists, use that (probably more efficient)
									(queryExecutor.matches ? queryExecutor.matches(changed) : queryExecutor([changed]).length)){
		
								var firstInsertedInto = removedFrom > -1 ? 
									removedFrom : // put back in the original slot so it doesn't move unless it needs to (relying on a stable sort below)
									resultsArray.length;
								resultsArray.splice(firstInsertedInto, 0, changed); // add the new item
								insertedInto = queryExecutor(resultsArray).indexOf(changed); // sort it
								// we now need to push the chagne back into the original results array
								resultsArray.splice(firstInsertedInto, 1); // remove the inserted item from the previous index
								
								if((options.start && insertedInto == 0) ||
									(!atEnd && insertedInto == resultsArray.length)){
									// if it is at the end of the page, assume it goes into the prev or next page
									insertedInto = -1;
								}else{
									resultsArray.splice(insertedInto, 0, changed); // and insert into the results array with the correct index
								}
							}
						}else if(changed && !options.start){
							// we don't have a queryEngine, so we can't provide any information
							// about where it was inserted, but we can at least indicate a new object
							insertedInto = removedFrom >= 0 ? removedFrom : (store.defaultIndex || 0);
						}
						if((removedFrom > -1 || insertedInto > -1) &&
								(includeObjectUpdates || !queryExecutor || (removedFrom != insertedInto))){
							var copyListeners = listeners.slice();
							for(i = 0;listener = copyListeners[i]; i++){
								listener(changed || removedObject, removedFrom, insertedInto);
							}
						}
						// update the results in our observed array
						console.log("updating observed array: ", observedResults().length, resultsArray.length);
						observedResults.splice.apply(observedResults, [0, resultsArray.length].concat(resultsArray));
					});
				});
			};
			observedResults.subscribe = function(listener){
				// on the first call, hook up our listener for notifications of changes in the store
				registerNotifyListener.apply(this, arguments);
				// ko's subscribable gives back a subscription handle object, with a dispose method
				// hook into that to do our own cleanup
				var subscription = originalSubscribe.apply(observedResults, arguments);
				var dispose = subscription.dispose;
				subscription.dispose = function(){
					// remove this listener
					var index = listeners.indexOf(listener);
					if(index > -1){ // check to make sure we haven't already called cancel
						listeners.splice(index, 1);
						if(!listeners.length){
							// no more listeners, remove the query updater too
							queryUpdaters.splice(queryUpdaters.indexOf(queryUpdater), 1);
						}
					}
					return dispose.apply(this, arguments);
				};
				// 
				// subsequent calls to subscribe don't need additional notification hooks, so put back the original
				observedResults.subscribe = originalSubscribe;
				return subscription;
			};
		}
		Deferred.when(results, function(arrayResults){
			// put results in there and hook up subscribers when we have them
			observedResults.splice.apply(observedResults, [0, arrayResults.length].concat(arrayResults));
		});
		return observedResults;
	};
	var inMethod;
	function whenFinished(method, action){
		var original = store[method];
		if(original){
			store[method] = function(value){
				if(inMethod){
					// if one method calls another (like add() calling put()) we don't want two events
					return original.apply(this, arguments);
				}
				inMethod = true;
				try{
					var results = original.apply(this, arguments);
					Deferred.when(results, function(results){
						action((typeof results == "object" && results) || value);
					});
					return results;
				}finally{
					inMethod = false;
				}
			};
		}
	}
	// monitor for updates by listening to these methods
	whenFinished("put", function(object){
		store.notify(object, store.getIdentity(object));
	});
	whenFinished("add", function(object){
		store.notify(object);
	});
	whenFinished("remove", function(id){
		store.notify(undefined, id);
	});

	return store;
};

return Observable;
});
