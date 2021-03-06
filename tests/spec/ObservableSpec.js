define(['store/Memory', 'store/Observable', '../../lib/util'], function(MemoryStore, ObservableStore, lang){

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

      expect(results).toBeTruthy();
      expect(typeof results.observe).toBe('function');
      
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
      expect(results.length).toBe(3);
      
      var changes = [], secondChanges = [];
      var observer = results.observe(function(object, previousIndex, newIndex){
        changes.push({previousIndex:previousIndex, newIndex:newIndex, object:object});
      });
      var secondObserver = results.observe(function(object, previousIndex, newIndex){
        secondChanges.push({previousIndex:previousIndex, newIndex:newIndex, object:object});
      });
      var expectedChanges = [],
        expectedSecondChanges = [];
      var two = results[0];
      two.prime = false;
      store.put(two); // should remove it from the array
      expect(results.length).toBe(2);
      
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
      secondObserver.cancel();
      var one = store.get(1);
      one.prime = true;
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
      expect(results.length).toBe(3);
      
      store.add({// shouldn't be added
        id:6, name:"six"
      });
      expect(results.length).toBe(3);
      
      store.add({// should be added
        id:7, name:"seven", prime:true
      });
      expect(results.length).toBe(4);
      
      expectedChanges.push({
          previousIndex: -1,
          "newIndex":3,
          "object":{
            id:7, name:"seven", prime:true
          }
        });
      store.remove(3);
      expectedChanges.push({
          "previousIndex":0,
          newIndex: -1,
          object: {id: 3, name: "three", prime: true}
        });
      expect(results.length).toBe(3);
      
      observer.remove(); // shouldn't get any more calls
      store.add({// should not be added
        id:11, name:"eleven", prime:true
      });
      expect(secondChanges).toEqual(expectedSecondChanges);
      expect(changes).toEqual(expectedChanges);
    });

    it("Handles queries with zero id", function testQueryWithZeroId(){
      var results = store.query({});
      expect(results.length).toBe(8);
      var observer = results.observe(function(object, previousIndex, newIndex){
              // we only do puts so previous & new indices must always been the same
              // unfortunately if id = 0, the previousIndex
              console.log("called with: "+previousIndex+", "+newIndex);
              expect(previousIndex).toBe(newIndex);
      }, true);
      store.put({id: 5, name: "-FIVE-", prime: true});
      store.put({id: 0, name: "-ZERO-", prime: false});
    });
    
    it("Pages through results", function testPaging(t){
      var results, opts = {count: 25, sort: [{attribute: "order"}]};
      results = window.results = [
          bigStore.query({}, lang.create(opts, {start: 0})),
          bigStore.query({}, lang.create(opts, {start: 25})),
          bigStore.query({}, lang.create(opts, {start: 50})),
          bigStore.query({}, lang.create(opts, {start: 75}))
      ];
      var observations = [];
      results.forEach(function(r, i){
          r.observe(function(obj, from, to){
            observations.push({from: from, to: to});
              console.log(i, " observed: ", obj, from, to);
          }, true);
      });

      bigStore.add({id: 101, name: "one oh one", order: 2.5});
      expect(results[0].length).toBe(26);
      expect(results[1].length).toBe(25);
      expect(results[2].length).toBe(25);
      expect(results[3].length).toBe(25);
      expect(observations.length).toBe(1);
      
      bigStore.remove(101);
      expect(observations.length).toBe(2);
      expect(results[0].length).toBe(25);

      bigStore.add({id: 102, name: "one oh two", order: 26.5});
      expect(results[0].length).toBe(25);
      expect(results[1].length).toBe(26);
      expect(results[2].length).toBe(25);
      expect(observations.length).toBe(3);
    });
  });

});