R("kt-reflection", [], function () {
  
  //static
  
  return {
    // gets value or values of a given object, from a name or namespace (example: 'dog.name')
    getPropertyValue: function (o, name) {
      var a = name.split('.'), x = o, p;
      while (p = a.shift()) {
        if (x.hasOwnProperty(p)) {
          x = x[p];
        }
        if (x instanceof Array) {
          break;
        }
      }
      if (x instanceof Array) {
        if (!a.length) {
          return x;
        }
        return this.getCollectionPropertiesValue(x, a.join('.'));
      }
      return x;
    },

    // gets properties values from a given collection
    getCollectionPropertiesValue: function (collection, name, includeEmptyValues) {
      if (!name) {
        return collection;
      }
      if (typeof includeEmptyValues != 'boolean') {
        includeEmptyValues = false;
      }
      var a = name.split('.'), values = [];
      for (var i = 0, l = collection.length; i < l; i++) {
        var o = collection[i];

        if (!o.hasOwnProperty(a[0])) {
          if (includeEmptyValues) {
            values.push(null);
          }
          continue;
        }
        if (o instanceof Array) {
          var foundColl = this.getCollectionPropertiesValue(o, name);
          if (includeEmptyValues || foundColl.length) {
            values.push(foundColl);
          }
        } else if (typeof o == 'object') {
          var foundVal = this.getPropertyValue(o, name);
          if (includeEmptyValues || this.validateValue(foundVal)) {
            values.push(foundVal);
          }
        } else {
          if (includeEmptyValues || this.validateValue(o)) {
            values.push(o);
          }
        }
      }
      return values;
    },
    
    // returns true if the object has a significant value, false otherwise
    validateValue: function (o) {
      if (!o) return false;
      
      if (o instanceof Array) {
        return !!o.length;
      }
      
      return true;
    }
  };
});


