//
// regex utilities
//
R("kt-regex", [], function () {
  
  //use this object to extend prototypes of objects that should offers
  //functions for Regular Expressions
  
  return {
    // prepares a string to use it to declare a regular expression
    escapeCharsForRegex: function (s) {
      if (typeof s != 'string') {
        s += '';
      }
      //characters to escape in regular expressions
      return s.replace(/([\^\$\.\(\)\[\]\?\!\*\+\{\}\|\/\\])/g, '\\$1').replace(/\s/g, '\\s');
    },
    
    // gets a regular expression for a search pattern,
    // returns undefined if the regular expression is not valid
    getSearchPattern: function (s, options) {
      if (!s) return /.+/mgi;
      options = _.extend({ searchMode: 'fullstring' }, options || {});
      switch (options.searchMode.toLowerCase()) {
        case 'fullstring':
          //escape characters
          s = this.escapeCharsForRegex(s);
          try {
            return new RegExp('(' + s + ')', 'mgi');
          } catch (ex) {
            //this should not happen
            return;
          }
        break;
        default:
          throw 'invalid searchMode';
      }
    },
    
    //gets a regular expression for a search match pattern
    getMatchPattern: function (s) {
      if (!s) { return /.+/mg; }
      s = this.escapeCharsForRegex(s);
      try {
        return new RegExp(s, 'i');
      } catch (ex) {
        throw ex;
      }
    },
    
    // Returns true if the string has matches with a RegExp
    safeTest: function (rx, s) {
      if (!s) { return false; }
      return !!s.match(rx);
    }
  };
  
});


