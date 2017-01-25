R("kt-array-group", [], function () {
  
  //use this object to extend prototypes of objects that should offer
  //functions to group arrays
  
  return {
    // Returns an array of object with grouped items, in alphabetical order for the group names
    group: function (collection, options) {
      
      var defaults = {
        groupGetter: null, //permits to specify a function which returns the group value of each item (if provided, groupPropertyName is ignored)
        groupPropertyName: 'group', //permits to specify which property should be used to group items (ignored if groupGetter is provided)
        sortGroups: true //permits to specify if returned objects should be ordered by group name
      };
      
      var o = $.extend({}, defaults, options), result = [], foundGroups = {};
      
      for (var i = 0, l = collection.length; i < l; i++) {
        
        var item = collection[i], group;
        
        if (o.groupGetter) {
          group = o.groupGetter(item);
        } else {
          //default
          group = item[o.groupPropertyName];
        }
        
        if (!group) {
          group = 'Ungrouped';
        }
        
        if (foundGroups.hasOwnProperty(group)) {
          
          result[foundGroups[group]].items.push(item);
          
        } else {
          foundGroups[group] = result.push({
            name: group,
            items: [item]
          }) - 1;
        }
      }
      
      if (o.sortGroups) {
        //order groups by alphabetical ascending order
        //this.sortByProperty(result, 'name', 'asc');
      }
      
      return result;
    }
  };
  
});


