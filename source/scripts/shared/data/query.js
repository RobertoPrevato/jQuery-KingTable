//
// Utilities to work with the query string (location.search)
//
R("kt-query", [], function () {
  
  return {
    
    get: function (name) {
      return this.getAll()[name];
    },
    
    getAll: function () {
      var o = {}, i, l, x, splitter = /\?|\&/,
      s = location.search.split(splitter),
      m = location.hash.match(/(\?.+)$/);
      //support query string inside hash (normally it is ignored)
      if (m)
        s = s.concat(m[1].split(splitter));
      for (i = 0, l = s.length; i < l; i++) {
        x = s[i];
        if (!x) continue;
        x = x.split(/=/);
        o[x[0]] = decodeURIComponent(x[1]);
      }
      return o;
    },
    
    set: function (key, val) {
      //support call with object
      var invalidParam = 'invalid parameter';
      if (typeof key == "object") {
        if (key instanceof Array) throw invalidParam;
        for (var x in key)
          this.set(x, key[x]);
        return this;
      }
      if (!key) throw invalidParam;
      var hash = location.hash;
      if (!hash)
        return location.hash = "#/?" + key + "=" + val;

      var q = this.getAll();
      if (val === null || val === "")
        delete q[key]
      else
        q[key] = val;
      location.hash = this.getHashForParams(q);
    },

    getHashForParams: function (params) {
      var hash = location.hash, query = [], x;
      for (x in params)
        query.push(x + "=" + encodeURIComponent(params[x]));

      query = query.length ? "?" + query.join("&") : "";
      if (!hash)
        return "#/" + query;
      var ixq = hash.indexOf("?");
      if (ixq > -1)
        return hash.substring(0, ixq) + query;
      return hash + query;
    }
  };
  
});


