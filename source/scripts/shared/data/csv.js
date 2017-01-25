//
// Csv utilities
//
R("kt-csv", ["kt-date"], function (DateUtils) {

  var setAttribute = "setAttribute";

  var TypeHandling = {
    allStrings: 1,
    keepType: 2
  };

  return {

    typeHandling: TypeHandling,

    //null value handling option
    defaults: {
      /**
       * Separator to use
       */
      separator: ";",
      /**
       * Whether to add a separator line at the beginning of the file, or not.
       * (May be useful for excel)
       */
      addSeparatorLine: true,
      /**
       * How the types should be handled: allStrings to manage all properties as strings (all will be quoted)
       */
      typeHandling: TypeHandling.allStrings
    },

    /**
     * Serializes the given collection in csv format.
     * Assumes that the collection is optimized (the first row contains properties, the other only values)
     * @param data collection
     * @param options
     */
    serialize: function (data, options) {
      options = _.extend({}, this.defaults, options);
      var re = [],
        push = "push",
        toString = "toString",
        len = "length",
        rep = "replace",
        test = "test",
        sep = options.separator,
        dobquote = "\"";
      for (var i = 0, l = data[len]; i < l; i++) {
        var a = [], row = data[i];
        //assume that the first row contains the columns
        for (var k = 0, j = row[len]; k < j; k++) {
          var v = row[k];
          if (v instanceof Date) {
            v = DateUtils.format(v, DateUtils.hasTime(v) ? "DD.MM.YYYY hh:mm:ss" : "DD.MM.YYYY");
          } else {
            if (typeof v != "string") {
              v = v && v[toString] ? v[toString]() : "";
            }
          }
          v = v[rep](/"/g, '""');
          //escape quotes - RFC-4180, paragraph "If double-quotes are used to enclose fields, then a double-quote
          //appearing inside a field must be escaped by preceding it with another double quote."
          if (/"/[test](v))
            v = v[rep](/"/g, "\"\"");
          //https://en.wikipedia.org/wiki/Comma-separated_values
          //Fields with embedded commas or double-quote characters must be quoted. (by standard, so even if CsvTypeHandling is different than "AllStrings")
          //1997, Ford, E350, "Super, ""luxurious"" truck"
          //1997, Ford, E350, "Super, luxurious truck"
          if (options.typeHandling == TypeHandling.allStrings || /"|\n/[test](v) || v.indexOf(sep) > -1)
            v = dobquote + v + dobquote;
          a[push](v);
        }
        re[push](a.join(sep));
      }
      if (options.addSeparatorLine) {
        re[push]("\t" + sep);
      }
      return "\uFEFF" + re.join("\n");
    }
  };
});
