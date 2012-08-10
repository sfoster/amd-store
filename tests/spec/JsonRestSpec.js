define(['store/JsonRest', '../../lib/util'], function(JsonRest, lang){

  xhrProto = {
    request: {
        headers: {}
    },
    open: function() {},
    setRequestHeader: function(name, value){
      this.request.headers[name] = value;
    },
    timeout: 5000,
    withCredentials: false,
    upload: false,
    send: function() {},
    abort: function() {},
    response: {
      headers: {}
    },
    status: null,
    statusText: 'ok',
    getResponseHeader: function(name) {
      return this.response.headers[name];
    },
    getAllResponseHeaders: function(){
      var str = '';
      for(var i in this.response.headers){
        str +=  i + ': ' + this.response.headers[i] + '\n';
      }
      return str;
    },
    body: null,
    overrideMimeType: function(){},
    responseType: null,
    responseText: '',
    responseXML: null
  };
      
  function mockXhr(data) {
    var xhr = Object.create(xhrProto);
    xhr.request.headers = {}; 
    xhr.response.headers = {}; 
    for(var i in data){
      xhr[i] = data[i];
    }
    return xhr;
  }
  
  describe("JsonRest smoke tests", function(){
    it("is a constructor", function(){
      expect(typeof JsonRest).toBe('function');
    });
    it("creates instances of itself", function(){
      var store = new JsonRest({});
      expect(store instanceof JsonRest).toBeTruthy();
    });
    it("mixes in instance properties in the constructor", function(){
      var store = new JsonRest({ target: "/thetarget" });
      expect(store.target).toBe("/thetarget");
    });
    
    it("makes requests when you query", function(){
      var ajaxSpy = spyOn($, "ajax").andCallFake(function(options){
        var xhr = mockXhr({});
        if(options.success) options.success({}, "ok", xhr);
      });
      
      var store = new JsonRest();
      store.get('foo');
      expect(ajaxSpy).toHaveBeenCalled();
    });

    it("sends sort info in the querystring when you query", function(){
      var url; 
      var ajaxSpy = spyOn($, "ajax").andCallFake(function(options){
        url = options.url;
        console.log("sort request options", options);
        var xhr = mockXhr({});
        if(options.success) options.success({}, "ok", xhr);
      });
      
      var store = new JsonRest();
      store.query('foo', { sort: [{ descending: true, attribute: "xyz"  }, { descending: false, attribute: "zyx"  }] });

      expect(ajaxSpy).toHaveBeenCalled();
      expect(url.indexOf('xyz')).toBeGreaterThan(-1);
      expect(url.indexOf('zyx')).toBeGreaterThan(-1);
    });
    
  });
  
  

});