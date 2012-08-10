define(['store/JsonRest', '../../lib/util'], function(JsonRest, lang){

  // from dojo/tests/store/JsonRest
  var globalHeaders = {
      "test-global-header-a": "true",
      "test-global-header-b": "yes"
    },
    requestHeaders = {
      "test-local-header-a": "true",
      "test-local-header-b": "yes",
      "test-override": "overridden"
    },
    store = new JsonRest({
      target: '/tests/',
      headers: lang.mixin({ "test-override": false }, globalHeaders)
    });

  describe("JsonRest requests", function(){
    it("gets", function testGet(t){

      store.get("node1.1").then(function(object){
        expect(object.name).toBe("node1.1");
        expect(object.someProperty).toBe("somePropertyA1");
      });
    });

    it("queries", function testQuery(){

      store.query("treeTestRoot").then(function(results){
        var object = results[0];
        expect(object.name).toBe("node1");
        expect(object.someProperty).toBe("somePropertyA");
      });
    });

    it("does iterative querying", function testQueryIterative(t){
      var i = 0;
      store.query("treeTestRoot").forEach(function(object){
        i++;
        expect(object.name).toBe("node" + i);
      });
    });
  });

  describe("JsonRest request headers", function(){
    var expected = 0, 
        received = 0, 
        inFlight = [];

    // NOTE: Because HTTP headers are case-insensitive they should always be provided as all-lowercase
    // strings to simplify testing.
    function runTest(method, args){
      var error;
      expected++;
      inFlight.push([method, args]);
      
      it("Issues the correct headers with a " + method + " request", function(){
        var hasResponse = null;
        waitsFor(function(){
          return hasResponse;
        });
        
        runs(function(){
          inFlight.pop();
          expect(error).toBeFalsy();
        });
        
        store[method].apply(store, args).then(function(result){
          hasResponse = !!result;
          received++;

          var k;
          console.log("Got back result.headers: ", result.headers);
          for(k in requestHeaders){
            if(!result.headers.hasOwnProperty(k) || "" + result.headers[k] !== "" + requestHeaders[k]){
              error = true;
              console.warn(new Error("Header mismatch in " + method + ": " + k));
            }
          }

          for(k in globalHeaders){
            if(!result.headers.hasOwnProperty(k) || "" + result.headers[k] !== "" + globalHeaders[k]){
              error = true;
              console.warn(new Error("Global header mismatch in " + method + ": " + k));
            }
          }

        }, function(err) { error = err; hasResponse = !!error; });
      });
    }

    runTest("get", [ "./", requestHeaders ]);
    runTest("get", [ "./", { headers: requestHeaders } ]);
    runTest("remove", [ "./", { headers: requestHeaders } ]);
    runTest("query", [ {}, { headers: requestHeaders, start: 20, count: 42 } ]);
    runTest("put", [ {}, { headers: requestHeaders } ]);
    runTest("add", [ {}, { headers: requestHeaders } ]);

    it("Ran all the headers tests", function(){
      waitsFor(function(){
        return !inFlight.length;
      });
      runs(function(){
        expect(expected).toBe(received);
      });
    });
  });


});
