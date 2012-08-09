define(['store/main'], function(store){
  var MemoryStore = store.Memory;
  
  describe("MemoryStore smoke tests", function(){
    it("is a constructor", function(){
      expect(typeof MemoryStore).toBe('function');
    });
    it("creates instances of itself", function(){
      var store = new MemoryStore({});
      expect(store instanceof MemoryStore).toBeTruthy();
    });
  });
  
  var store = new MemoryStore({
    data: [
      {id: 1, name: "one", prime: false},
      {id: 2, name: "two", even: true, prime: true},
      {id: 3, name: "three", prime: true},
      {id: 4, name: "four", even: true, prime: false},
      {id: 5, name: "five", prime: true}
    ]
  });
  
  describe("MemoryStore", function(){
    it("gets", function(){
      expect(store.get(1).name).toBe("one");
      expect(store.get(4).name).toBe("four");
      expect(store.get(5).prime).toBeTruthy();
    });
    
    it("queries", function testQuery(t){
      expect(store.query({prime: true}).length).toBe(3);
      expect(store.query({even: true})[1].name).toBe("four");
    });
    
    it("queries with string", function testQueryWithString(t){
      expect(store.query({name: "two"}).length).toBe(1);
      expect(store.query({name: "two"})[0].name).toBe("two");
    });
    
    it("queries with regexp", function testQueryWithRegExp(t){
      expect(store.query({name: /^t/}).length).toBe(2);
      expect(store.query({name: /^t/})[1].name).toBe("three");
      expect(store.query({name: /^o/}).length).toBe(1);
      expect(store.query({name: /o/}).length).toBe(3);
    });
    
    it("queries with test function", function testQueryWithTestFunction(t){
      expect(store.query({id: {test: function(id){ return id < 4;}}}).length).toBe(3);
      expect(store.query({even: {test: function(even, object){ return even && object.id > 2;}}}).length).toBe(1);
    });
    
    it("queries with sort", function testQueryWithSort(t){
      expect(store.query({prime: true}, {sort:[{attribute:"name"}]}).length).toBe(3);
      expect(store.query({even: true}, {sort:[{attribute:"name"}]})[1].name).toBe("two");
    });
    
    it("queries with paging" , function testQueryWithPaging(t){
      expect(store.query({prime: true}, {start: 1, count: 1}).length).toBe(1);
      expect(store.query({even: true}, {start: 1, count: 1})[0].name).toBe("four");
    });
    
    it("updates with put", function testPutUpdate(t){
      var four = store.get(4);
      four.square = true;
      store.put(four);
      four = store.get(4);
      expect(four.square).toBeTruthy();
    });
    
    it("creates new with put", function testPutNew(t){
      store.put({
        id: 6,
        perfect: true
      });
      expect(store.get(6).perfect).toBeTruthy();
    });
    
    it("does the right thing when adding duplicates", function testAddDuplicate(t){
      var threw;
      try{
        store.add({
          id: 6,
          perfect: true
        });
      }catch(e){
        threw = true;
      }
      expect(threw).toBeTruthy();
    });
    
    it("adds new entries", function testAddNew(t){
      store.add({
        id: 7,
        prime: true
      });
      expect(store.get(7).prime).toBeTruthy();
    });
    
    it("removes", function testRemove(t){
      expect(store.remove(7)).toBeTruthy();
      expect(store.get(7)).toBe(undefined);
    });
    
    it("handles removing missing entries", function testRemoveMissing(t){
      expect(store.remove(77)).toBeFalsy();
      // make sure nothing changed
      expect(store.get(1).id).toBe(1);
    });
    
    it("returns expecded values after changes", function testQueryAfterChanges(t){
      expect(store.query({prime: true}).length).toBe(3);
      expect(store.query({perfect: true}).length).toBe(1);
    });
    
    it("handles IFRS style of data", function testIFRSStyleData(t){
      var anotherStore = new MemoryStore({
        data: {
          items:[
            {name: "one", prime: false},
            {name: "two", even: true, prime: true},
            {name: "three", prime: true}
          ],
          identifier: "name"
        }
      });
      expect(anotherStore.get("one").name).toBe("one");
      expect(anotherStore.query({name:"one"})[0].name).toBe("one");
    });
    
    it("assigns ids to new entries", function testAddNewIdAssignment(t){
      var object = {
        random: true
      };
      store.add(object);
      expect(!!object.id).toBeTruthy();
    });
  });

});
