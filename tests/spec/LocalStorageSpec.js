define(['store/LocalStorage'], function(LSStore){
  
  describe("LocalStorage smoke tests", function(){
    it("is a constructor", function(){
      expect(typeof LSStore).toBe('function');
    });
    it("creates instances of itself", function(){
      var store = new LSStore({});
      expect(store instanceof LSStore).toBeTruthy();
    });
  });
  
  // reset for testing
  var STORAGE_ID = 'LocalStorageSpec';
  localStorage.removeItem(STORAGE_ID);
  
  var dataRows = [
      {id: 1, name: "one", prime: false},
      {id: 2, name: "two", even: true, prime: true},
      {id: 3, name: "three", prime: true},
      {id: 4, name: "four", even: true, prime: false},
      {id: 5, name: "five", prime: true}
  ];
  
  describe("LocalStorage Store", function(){
    var store = new LSStore({ data: dataRows });
    it("gets", function(){
      expect(store.get(1).name).toBe("one");
      expect(store.get(4).name).toBe("four");
      expect(store.get(5).prime).toBeTruthy();
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
    
    it("returns expected values after changes", function testQueryAfterChanges(t){
      expect(store.query({prime: true}).length).toBe(3);
      expect(store.query({perfect: true}).length).toBe(1);
    });
    
    it("assigns ids to new entries", function testAddNewIdAssignment(t){
      var object = {
        random: true
      };
      store.add(object);
      console.log("added object: ", object);
      expect(!!object.id).toBeTruthy();
    });
  });

});
