define(['store/Memory', 'store/Observable', '../../lib/util'], function(MemoryStore, ObservableStore, lang){

  // Tests modified to expect the subscribe to get results array, details
  var testData = [
    {id: 1, name: "one", prime: false},
    {id: 2, name: "two", even: true, prime: true},
    {id: 3, name: "three", prime: true},
    {id: 4, name: "four", even: true, prime: false},
    {id: 5, name: "five", prime: true}
  ];

  describe("Observable Store Basics", function(){
    it("Loaded the expected constructors", function(){
      expect(typeof MemoryStore).toBe('function');
      expect(typeof ObservableStore).toBe('function');
    });
    
    it("Composes to create observable memory store instances", function(){
      var store = ObservableStore(new MemoryStore({
        data: []
      }));
      
      expect(store instanceof MemoryStore).toBeTruthy();
      expect(typeof store.notify).toBe('function');

    });
    it("Produces observable result objects", function(){
      var store = ObservableStore(new MemoryStore({
        data: testData
      }));
      var changes = [], results = store.query({ prime: true });

      expect(results && results()).toBeTruthy();
      expect(typeof results.subscribe).toBe('function');
      
    });
  
  });

  describe("Batch changes on Observable results", function(){
    it("Notifies subscribers once for multiple changes", function(){
      var numMatches = 0;
      var changeCount = 0;  
      var store = ObservableStore(new MemoryStore({
        data: testData
      }));
      var results = store.query({ prime: true });
      results.subscribe(function(resultsArray, details){
        numMatches = resultsArray.length;
        console.log("prime query change: ", resultsArray, details);
        changeCount++;
      });
      results.batchStart();
      store.add({id: 11, name: "eleven", prime: true});
      store.add({id: 13, name: "thirteen", prime: true});
      results.batchEnd();
      
      expect(changeCount).toBe(1);
      expect(numMatches).toBe(5);
    });
  });

  // Ported tests from dojo/tests/store/Observable.js
  var memoryStore, store = new ObservableStore(memoryStore = new MemoryStore({ /*store.Memory*/
    data: [
      {id: 0, name: "zero", even: true, prime: false},
      {id: 1, name: "one", prime: false},
      {id: 2, name: "two", even: true, prime: true},
      {id: 3, name: "three", prime: true},
      {id: 4, name: "four", even: true, prime: false},
      {id: 5, name: "five", prime: true}
    ]
  }));
  var data = [], i;
  for(i = 1; i <= 100; i++){
      data.push({id: i, name: "item " + i, order: i});
  }
  var bigStore = ObservableStore(new MemoryStore({data:data}));

  describe("store.Observable", function() {
    it("Gets", function(){
      expect(store.get(1).name).toBe("one");
      expect(store.get(4).name).toBe("four");
      expect(store.get(5).prime).toBeTruthy();
    });
    
    it("Query-s", function testQuery(){
      var results = store.query({prime: true});
      expect(results().length).toBe(3);
      
      var changes = [], secondChanges = [];
      //  TODO: fix resolve ko subscribe callback signature with observe signature
      //  observable.subscribe(callback, callbackTarget, event);
      // and callback gets: (Array)results, (Object)details = { object: object, previousIndex: n, newIndex: n }
      //  vs.changed || removedObject, removedFrom, insertedInto 
      var subscription = results.subscribe(function(resultsArray, details){
        expect(typeof details).toBe('object');
        changes.push({previousIndex:details.previousIndex, newIndex:details.newIndex, object:details.object});
      });
      var secondSubscription = results.subscribe(function(resultsArray, details){
        expect(typeof details).toBe('object');
        secondChanges.push({previousIndex:details.previousIndex, newIndex:details.newIndex, object:details.object});
      });
      var expectedChanges = [],
        expectedSecondChanges = [];
      var two = results()[0];
      two.prime = false;
      console.log("Setting prime to false, should update the query");
      console.log("Results are currently: ", results());

      store.put(two); // should remove it from the array
      expect("Update done, results are now: ", results());
      expect(results().length).toBe(2);
      
      expectedChanges.push({
          previousIndex: 0,
          newIndex: -1,
          object:{
            id: 2,
            name: "two",
            even: true,
            prime: false
          }
        });
      expectedSecondChanges.push(expectedChanges[expectedChanges.length - 1]);
      secondSubscription.dispose();
      var one = store.get(1);
      one.prime = true;
      console.log("Putting 'one' object");
      store.put(one); // should add it
      expectedChanges.push({
          previousIndex: -1,
          "newIndex":2,
          object:{
            id: 1,
            name: "one",
            prime: true
          }
        });
      expect(results().length).toBe(3);
      
      console.log("Adding 'six' object - shouldn't be added");
      store.add({// shouldn't be added
        id:6, name:"six"
      });
      expect(results().length).toBe(3);
      
      console.log("Adding 'seven' object");
      store.add({// should be added
        id:7, name:"seven", prime:true
      });
      expect(results().length).toBe(4);
      
      expectedChanges.push({
          previousIndex: -1,
          "newIndex":3,
          "object":{
            id:7, name:"seven", prime:true
          }
        });
      console.log("Removing '3' object");
      store.remove(3);
      expectedChanges.push({
          "previousIndex":0,
          newIndex: -1,
          object: {id: 3, name: "three", prime: true}
        });
      expect(results().length).toBe(3);
      
      subscription.dispose(); // shouldn't get any more calls
      console.log("Adding '11' object - should not be added");
      store.add({// should not be added
        id:11, name:"eleven", prime:true
      });
      expect(secondChanges).toEqual(expectedSecondChanges);
      expect(changes).toEqual(expectedChanges);
    });

    it("Handles queries with zero id", function testQueryWithZeroId(){
      var results = store.query({});
      expect(results().length).toBe(8);
      var observer = results.subscribe(function(resultsArray, details){
              // we only do puts so previous & new indices must always been the same
              // unfortunately if id = 0, the previousIndex
              expect(typeof details).toBe('object');
              expect(details.previousIndex).toBe(details.newIndex);
      }, true);
      store.put({id: 5, name: "-FIVE-", prime: true});
      store.put({id: 0, name: "-ZERO-", prime: false});
    });
    
    it("Pages through results", function testPaging(t){
      var resultPages, opts = {count: 25, sort: [{attribute: "order"}]};
      resultPages = window.resultPages = [
          bigStore.query({}, lang.extend({start: 0}, opts)),
          bigStore.query({}, lang.extend({start: 25}, opts)),
          bigStore.query({}, lang.extend({start: 50}, opts)),
          bigStore.query({}, lang.extend({start: 75}, opts))
      ];
      var observations = [];
      resultPages.forEach(function(r, i){
          r.subscribe(function(resultArray, details){
            expect(typeof details).toBe('object');
            observations.push({from: details.previousIndex, to: details.newIndex});
              console.log(i, " observed: ", details);
          }, true);
      });

      bigStore.add({id: 101, name: "one oh one", order: 2.5});
      expect(resultPages[0]().length).toBe(26);
      expect(resultPages[1]().length).toBe(25);
      expect(resultPages[2]().length).toBe(25);
      expect(resultPages[3]().length).toBe(25);
      expect(observations.length).toBe(1);
      
      bigStore.remove(101);
      expect(observations.length).toBe(2);
      expect(resultPages[0]().length).toBe(25);

      bigStore.add({id: 102, name: "one oh two", order: 26.5});
      expect(resultPages[0]().length).toBe(25);
      expect(resultPages[1]().length).toBe(26);
      expect(resultPages[2]().length).toBe(25);
      expect(observations.length).toBe(3);
    });
  });

});