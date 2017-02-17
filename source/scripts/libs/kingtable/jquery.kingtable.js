/**
 * jQuery-KingTable, a jQuery plugin for administrative tables that are able to build themselves,
 * on the basis of their input data.
 * https://github.com/RobertoPrevato/jQuery-KingTable
 *
 * Copyright 2017, Roberto Prevato
 * https://robertoprevato.github.io
 *
 * Licensed under the MIT license:
 * http://www.opensource.org/licenses/MIT
 */
R("jquery-kingtable", ["kingtable-core"], function (KingTable) {
  //
  // The core business logic is abstracted from jQuery:
  // this file acts as a connector between the core object and jQuery library.
  //
  $.KingTable = KingTable;

  //jQuery methods
  var methods = {
    init: function (data) {
      if (!data)
        throw new Error("missing options to set up a king table");

      var table = new KingTable(_.extend({
        $el: $(this)
      }, data));
      this.data("kingtable", table);
      table.render();
      return this;
    },
    collection: function () {
      var kt = this.data("kingtable");
      if (kt) kt.data;
      return []
    },
    dispose: function () {
      var kt = this.data("kingtable");
      if (kt) kt.dispose();
      return this
    }
  };

  $.fn.kingtable = function (method) {
    if (!this.length)
      return this;
    if (methods[method])
      return methods[method].apply(this, Array.prototype.slice.call(arguments, 1));
    else if (typeof method === "object" || !method)
      return methods.init.apply(this, arguments);
    else
      $.error("Method \"" + method + "\" does not exist on jQuery-KingTable.");
  };
});