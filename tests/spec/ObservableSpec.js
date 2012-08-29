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
      var subscription = results.subscribe(function(object, details){
        details = details || {};
        changes.push({previousIndex:details.previousIndex, newIndex:details.newIndex, details:object});
      });
      var secondSubscription = results.subscribe(function(object, previousIndex, newIndex){
        details = details || {};
        secondChanges.push({previousIndex:details.previousIndex, newIndex:details.newIndex, details:object});
      });
      var expectedChanges = [],
        expectedSecondChanges = [];
      var two = results()[0];
      two.prime = false;
      console.log("Putting 'one' object");
      store.put(two); // should remove it from the array
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
      var observer = results.subscribe(function(results, details){
              // we only do puts so previous & new indices must always been the same
              // unfortunately if id = 0, the previousIndex
              console.log("called with: "+details.previousIndex+", "+details.newIndex);
              expect(details.previousIndex).toBe(details.newIndex);
      }, true);
      store.put({id: 5, name: "-FIVE-", prime: true});
      store.put({id: 0, name: "-ZERO-", prime: false});
    });
    
    it("Pages through results", function testPaging(t){
      var results, opts = {count: 25, sort: [{attribute: "order"}]};
      results = window.results = [
          bigStore.query({}, lang.extend(Object.create(opts), {start: 0})),
          bigStore.query({}, lang.extend(Object.create(opts), {start: 25})),
          bigStore.query({}, lang.extend(Object.create(opts), {start: 50})),
          bigStore.query({}, lang.extend(Object.create(opts), {start: 75}))
      ];
      var observations = [];
      results.forEach(function(r, i){
          r.subscribe(function(results, details){
            observations.push({from: details.previousIndex, to: details.newIndex});
              console.log(i, " observed: ", details);
          }, true);
      });

      bigStore.add({id: 101, name: "one oh one", order: 2.5});
      expect(results()[0].length).toBe(26);
      expect(results()[1].length).toBe(25);
      expect(results()[2].length).toBe(25);
      expect(results()[3].length).toBe(25);
      expect(observations.length).toBe(1);
      
      bigStore.remove(101);
      expect(observations.length).toBe(2);
      expect(results()[0].length).toBe(25);

      bigStore.add({id: 102, name: "one oh two", order: 26.5});
      expect(results()[0].length).toBe(25);
      expect(results()[1].length).toBe(26);
      expect(results()[2].length).toBe(25);
      expect(observations.length).toBe(3);
    });
  });

});