/**
 * jQuery-KingTable, core logic.
 * https://github.com/RobertoPrevato/jQuery-KingTable
 *
 * Copyright 2017, Roberto Prevato
 * https://robertoprevato.github.io
 *
 * Licensed under the MIT license:
 * http://www.opensource.org/licenses/MIT
 */
R("kingtable-core", [
  "kt-extend",
  "kt-events",
  "kt-string",
  "kt-date",
  "kt-regex",
  "kt-array-search",
  "kt-query",
  "kt-object-analyzer",
  "kt-sanitizer",
  "kt-filters-manager",
  "kt-csv",
  "kt-xml",
  "kt-file"], function (Extend,
                        Events,
                        StringUtils,
                        DateUtils,
                        RegexUtils,
                        ArraySearch,
                        Query,
                        Analyzer,
                        Sanitizer,
                        FiltersManager,
                        Csv,
                        Xml,
                        FileUtil) {
  //
  // Defines the core business logic of the jQuery-KingTable plugin.
  // The core is abstracted from jQuery itself;
  //
  var KingTable = function (options, staticProperties) {
    var self = this;
    if (staticProperties)
      _.extend(self, staticProperties);
    self.mergeOptions(options).coreInit().initialize();
  };
  KingTable.version = "1.0.1";
  KingTable.extend = Extend;

  KingTable.Utils = {};
  KingTable.Utils.String = StringUtils;
  KingTable.Utils.Regex = RegexUtils;
  KingTable.Utils.Date = DateUtils;
  KingTable.Utils.Array = ArraySearch;
  KingTable.Utils.Analyzer = Analyzer;
  KingTable.Utils.Sanitizer = Sanitizer;
  KingTable.Utils.FiltersManager = FiltersManager;

  // global object containing defaults by type and name: these objects are designed to be extended during library setup
  KingTable.Schemas = {

    /**
     * Default columns properties, by field value type.
     * This object is meant to be extended by implementers; following their personal preferences.
     */
    DefaultByType: {
      number: function (columnSchema, objSchema) {
        return {
          format: function (value) {
            return value + '';
          }
        };
      },
      date: function (columnSchema, objSchema) {
        return {
          format: function (value) {
            return this.date.format(value, "dd/MM/yyyy hh:mm");
          }
        };
      }
    },

    /**
     * Default columns properties, by field name.
     * This object is meant to be extended by implementers; following their personal preferences.
     */
    DefaultByName: {
      id: {
        name: "id",
        type: "id",
        hidden: true,
        secret: true
      },
      guid: {
        name: "guid",
        type: "guid",
        hidden: true,
        secret: true
      }
    }
  };

  _.extend(KingTable.prototype, Events, {

    /**
     * Override this function to implement custom initialization logic.
     */
    initialize: function () {},

    /**
     * Base properties that can be overridden upon instantiation.
     * @examples
     * var sm = new $.KingTable.KingTable({
     *   initialize: function () { this function overrides the prototype initialize },
     *   someCustomProperty: 2 //this property will instead be cached inside the instance.options property
     * });
     */
    baseProperties: ["initialize", "$el", "data", "fixed", "formatData"],

    /**
     * Upon instantiation; this function is called to merge the options inside the instance of KingTable.
     * @param options
     * @returns {$.KingTable.KingTable}
     */
    mergeOptions: function (options) {
      var self = this;
      for (var i = 0, l = self.baseProperties.length; i < l; i++) {
        var name = self.baseProperties[i];
        if (options.hasOwnProperty(name)) {
          self[name] = options[name];
          delete options[name];
        }
      }
      self.options = _.defaults({}, options || {}, _.result(self, 'defaults'));
      return self;
    },

    /**
     * Sets a property, or a set of properties into this KingTable.
     * @param name
     * @param value
     * @returns {$.KingTable.KingTable}
     */
    set: function (name, value) {
      var self = this;
      if (typeof name == 'object') {
        _.each(name, function (v, k) {
          self.set(k, v);
        });
        return self;
      }
      self[name] = value;
      return self;
    },

    /**
     * Whether to support multiple tables per page; or not.
     * The only difference is that the query strings become weirder.
     * Please notice that this value is shared by the prototype of any kingtable.
     */
    multitable: true,

    /**
     * Default options of the KingTable.
     */
    defaults: {

      /**
       * Whether to display the row count or not.
       */
      rowCount: true,

      /**
       * Default schema for each table column.
       */
      columnDefault: {
        name: "",
        type: "text",
        groupable: true,
        sortable: true,
        resizable: true,
        allowSearch: true,
        template: "##Name##",
        hidden: false
      },

      /**
       * Whether to allow search, or not.
       */
      allowSearch: true,

      /**
       * Minimum number of characters inside the search field to trigger a search.
       */
      minSearchChars: 3,

      /**
       * Delay to start a search after the user stops typing into the search field.
       * by design and intentionally, the search is lazy (it starts few milliseconds after the user stops typing into the search field)
       */
      searchDelay: 50,

      /**
       * Whether to write and read filters inside the query string, or not
       * for usability, it is better to keep this option active.
       */
      useQueryString: false,

      /**
       * Whether to write and read some settings using the local storage.
       */
      useLocalStorage: true,

      /**
       * The query string to use, when storing the search inside the query string.
      * */
      searchQueryString: "search",

      /**
       * The query string to use, when storing the results per page number in the query string.
       */
      resultsPerPageQueryString: "size",

      /**
       * The local storage key, to use when storing the results per page settings.
       */
      resultsPerPageStorageKey: "kt-results-per-page",
      
      /**
       * The local storage key, to use when storing the columns order.
       */
      columnsOrderStorageKey: "kt-columns-order",

      /**
       * The query string to use, when storing the page inside the query string.
       */
      pageQueryString: "page",

      /**
       * Default first page.
       */
      page: 1,

      /**
       * Default page size
       */
      resultsPerPage: 30,

      // Permits to specify the options of the results per page select
      resultsPerPageSelect: [10, 30, 50, 100],

      // Permits to specify extra tools for this table
      tools: null,

      // Permits to turn on or off pagination for this table
      paginationEnabled: true,

      //limit of objects to analyze for collection
      analyzeLimit: 1,

      //when one or more search filters are active, auto highlight them
      autoHighlightSearchProperties: true,

      //suffix to use for formatted properties
      formattedSuffix: '_formatted',

      //permits to specify whether the collection is fixed or not
      //default changes if the table is instantiated passing a collection
      fixed: false,

      //permits to specify an initial search when generating the table for the first time
      search: '',

      //permits to specify the search mode to use during live search
      //FullString, SplitWords or SplitSentences
      searchMode: "FullString",

      /**
       * Default function to get the name of the id property of displayed objects.
       */
      getIdProperty: function () {
        var columns = this.columns;
        if (!columns || !columns.length) return "id";
        for (var i = 0, l = columns.length; i < l; i++) {
          var name = columns[i].name;
          if (/^_?id$|^_?guid$/i.test(name))
            return name;
        }
        throw new Error("jQuery-KingTable: cannot guess which property should be used as id. Please specify the getIdProperty function; to return the id property.");
      },
      
      /**
       * Whether the table should automatically refresh itself, when a filter changes; or not.
       */
      autorefresh: true,

      /**
       * Default export formats.
       */
      exportFormats: [
        {
          name: "Csv",
          format: "csv",
          type: "text/csv"
        },
        {
          name: "Json",
          format: "json",
          type: "application/json"
        },
        {
          name: "Xml",
          format: "xml",
          type: "text/xml"
        }
      ],

      /**
       * Whether to prettify xml when exporting, or not.
       */
      prettyXml: true,

      /**
       * Allows to specify csv serialization options
       */
      csvOptions: {},

      /**
       * Whether to include hidden properties in the export; or not.
       */
      exportHiddenProperties: false,

      /**
       * Whether to go to the first page upon an hard refresh, or not
       */
      firstPageOnRefresh: true,

      /**
       * Whether to allow columns sorting or not.
       */
      allowColumnsSorting: true
    },

    string: StringUtils,

    query: Query,

    json: function (o) {
      return JSON.stringify(o);
    },
    
    raiseError: function (message) {
      throw new Error("KingTable: " + message + ". Please refer to official documentation at https://github.com/RobertoPrevato/jQuery-KingTable");
    },

    coreInit: function () {
      var self = this, options = self.options;
      self.cid = _.uniqueId('c');
      self.cache = {};
      //if the table is instantiated with data; then consider it fixed (no need to fetch data using ajax)
      if (self.data) {
        self.fixed = true;
        self.data = self.normalizeCollection(self.data);
      }
      //create an instance of object analyzer
      self.objAnalyzer = new Analyzer();
      self.filters = new FiltersManager();
      self.sanitizer = new Sanitizer();
      if (!self.fixed) {
        //if the table collection is not fixed;
        //then there is no need to perform search operations on the client side
        self.filters.searchDisabled = true;
      }

      if (!window.localStorage) options.useLocalStorage = false;
      if (options.allowSearch) {
        self.searchCore = self.getSearchHandler();
      }
      if (self.multitable) {
        //the table supports coexisting at the same time with other tables.
        //the query strings must be unique for the instance of table
        if (options.useQueryString) {
          _.each(["pageQueryString", "searchQueryString", "resultsPerPageQueryString"], function (name) {
            options[name] = options[name] + self.cid;
          });
        }
      }
      //support custom filters
      self.customFilters = {};
      self.loadSettings().checkHash();
      //set basic pagination data
      self.setPagination();
      var connectorInit = "connectorInit";
      if (self[connectorInit])
        self[connectorInit]();
      return self;
    },

    loadSettings: function () {
      var self = this, options = self.options;
      //loads the settings from the query string and the local storage
      if (options.useQueryString) {
        //load the query string
        var s = self.query.get(options.searchQueryString);
        if (s) {
          //set the search inside the options
          options.search = s;
          self.setSearchFilter(s);
        }
        s = self.query.get(options.pageQueryString);
        if (s) {
          //set the page inside the options
          options.page = parseInt(s);
        } else {
          Query.set(options.pageQueryString, options.page);
        }
        s = self.query.get(options.resultsPerPageQueryString);
        if (s) {
          //set the results per page inside the options
          options.resultsPerPage = parseInt(s);
        }
        
        var reservedKeys = [options.searchQueryString, options.pageQueryString, options.resultsPerPageQueryString],
          otherFilters = self.query.getAll(), x;
          for (x in otherFilters) {
            if (_.contains(reservedKeys, x))
              delete otherFilters[x];
          }
        _.extend(self.customFilters, otherFilters);
      }
      //load from local storage
      if (options.useLocalStorage) {
        s = window.localStorage.getItem(options.resultsPerPageStorageKey);
        if (s) {
          //set the results per page inside the options
          options.resultsPerPage = parseInt(s);
          if (options.useQueryString) {
            Query.set(options.resultsPerPageQueryString, s);
          }
        }
      }
      return self;
    },

    /**
     * Sets an event handler to check for hashchange.
     * @returns {KingTable}
     */
    checkHash: function () {
      if (!this.options.useQueryString) return this;
      //this is the only piece of code that actually refers to jQuery inside this file.
      $(window).on("hashchange.kingtable" + this.cid, _.bind(function() {
        var self = this,
          o = self.options,
          p = self.pagination,
          page = p.page,
          size = p.resultsPerPage,
          search = p.search,
          qsPage = Query.get(o.pageQueryString),
          qsSize = Query.get(o.resultsPerPageQueryString),
          qsSearch = Query.get(o.searchQueryString) || "";
        //validate page number
        if (qsPage) {
          qsPage = parseInt(qsPage);
          if (isNaN(qsPage) || qsPage < 1 || qsPage > p.totalPageCount) {
            //invalid query string: revert
            Query.set(o.pageQueryString, page);
          } else {
            //query string has a new page:
            if (page !== qsPage) {
              p.page = qsPage;
              self.onPageChange();
            }
          }
        } else {
          //no page query string: it must be one
          if (page !== 1) {
            p.page = 1;
            self.onPageChange();
          }
        }
        if (qsSize) {
          qsSize = parseInt(qsSize);
          if (isNaN(qsSize) || !_.contains(o.resultsPerPageSelect, qsSize)) {
            //invalid query string: revert
            Query.set(o.resultsPerPageQueryString, size);
          } else {
            //query string has a new page size:
            if (size !== qsSize) {
              p.resultsPerPage = qsSize;
              self.onResultsPerPageChange();
              self.onPageChange();
            }
          }
        } else {
          //no size query string: it must be one
          if (size !== o.resultsPerPage) {
            p.resultsPerPage = o.resultsPerPage;
            self.onResultsPerPageChange();
            self.onPageChange();
          }
        }
        if (qsSearch !== search) {
          p.search = qsSearch || "";
          if (!qsSearch)
            self.onSearchEmpty();
          self.trigger("search-qs-change");
        }
      }, this));
      return this;
    },

    render: function () {
      var def = new $.Deferred(), self = this;

      //self.data && self.hasData()
      if (self.fixed && self.hasData()) {
        //resolve automatically
        def.resolveWith(self, [self.data, true]);
      } else {
        //it is necessary to load data
        var timestamp = self.lastFetchTimestamp = new Date().getTime();
        self.loadData(null, timestamp).done(function (data, isSynchronous) {
          if (!data || !data.length && !self.columnsInitialized) {
            //there is no data: this may happen when the page is loaded
            //with a wrong page setting and the server is returning a catalog object
            self.pendingRender = def;
            //display anyway the pagination
            self.trigger("missing-data");
            return;
          }
          def.resolveWith(self, [data, isSynchronous]);
        });
      }

      def.done(function (data, isSynchronous) {
        if (self.beforeRender)
          self.beforeRender();
        //initialize columns
        self.initializeColumns()
          .formatData(data)
          .sortColumns()
          .setTools();

        self.build(isSynchronous);
        if (self.afterRender)
          self.afterRender();
      });
      return def.promise();
    },

    hasData: function () {
      var data = this.data;
      return data && data.length;
    },

    //prepares post data to send to the server for ajax calls that fetch collection
    mixinAjaxPostData: function (options) {
      var self = this;
      return _.extend(self.getFilters(), self.options.postData || {});
    },

    sortOrderKey: function (value) {
      if (value == "asc")
        return "ascending";
      if (value == "desc")
        return "descending";
      return "descending";
    },

    getFilters: function () {
      var self = this,
          pagination = self.pagination;
      return _.extend({
        fixed: self.fixed || false,//whether the table requires server side pagination or not
        page: pagination.page,//page number
        size: pagination.resultsPerPage,//page size; i.e. results per page
        orderBy: pagination.orderBy || "",
        sortOrder: this.sortOrderKey(pagination.sortOrder) || "",
        search: pagination.search,
        timestamp: self.anchorTimestamp//the timestamp of the first time the table was rendered
      }, self.customFilters);
    },

    //function that obtains the current timestamp from the server side:
    //this represents the timestamp from the server point of view: useful to display properly fast-growing collections
    getAnchorTimestamp: function (data, xhr) {
      if (!_.isArray(data)) {
        //try to obtain the timestamp from the returned object
        var props = ["date", "timestamp", "time"];
        for (i = 0, l = props.length; i < l; i++) {
          var prop = props[i];
          var value = data[prop];
          if (value) {
            return value;
          }
        }
      }
      //try to obtain the timestamp from headers
      var headers = ["X-Timestamp", "Timestamp", "Date"], i, l;
      for (i = 0, l = headers.length; i < l; i++) {
        var header = headers[i];
        var value = xhr.getResponseHeader(header);
        if (value) {
          return value;
        }
      }
      return null;
    },

    //function that loads data, eventually performing ajax calls
    loadData: function (options, timestamp) {
      options = options || {};
      var def = new $.Deferred(), self = this;

      //if the table is a fixed table, then resolve automatically the promise
      if (options.nofetch || self.fixed && self.hasData()) {
        def.resolveWith(self, [self.data, true]);
      } else {
        //an ajax call is required
        var url = self.options.url;
        if (!url) self.raiseError("Missing data, or url option to fetch data");

        //obtain ajax options
        var postData = self.mixinAjaxPostData(options, timestamp);

        self.trigger("fetch:start").getFetchPromise({
          url: url,
          data: postData
        }).always(function () {
          self.trigger("fetch:end");
        }).done(function (catalog, status, xhr) {
          //check if there is a newer call to function
          if (timestamp < self.lastFetchTimestamp) {
            //do nothing because there is a newer call to loadData
            return;
          }
          self.trigger("fetch:done").onFetchDone();
          //check if the anchor timestamp is set
          if (!self.anchorTimestamp) {
            //try to obtain the anchor timestamp from the response objects
            self.anchorTimestamp = self.getAnchorTimestamp(catalog, xhr);
          }

          //check if returned data is an array or a catalog
          if (_.isArray(catalog)) {
            //
            //The server returned an array, so take for good that this collection
            //is complete and doesn't require server side pagination. This is by design.
            //
            catalog = self.normalizeCollection(catalog);
            self.fixed = true;
            self.filters.searchDisabled = false;
            if (self.columnsInitialized)
              self.formatData(catalog);
            self.data = catalog;
            self.updatePagination(catalog.length);
            def.resolveWith(self, [catalog, false]);
          } else {
            //
            //The server returned an object, so take for good that this collection requires
            //server side pagination; expect the returned data to include information like:
            //total number of results (possibly), so a client side pagination can be built;
            //
            //expect catalog structure (page count, page number, etc.)
            if (catalog.items && !catalog.subset)
              catalog.subset = catalog.items;
            if (!catalog.subset) self.raiseError("The returned object is not a catalog");
            var subset = self.normalizeCollection(catalog.subset);
            if (self.columnsInitialized) self.formatData(subset);
            if (catalog.search) {
              //set last fetch filter to avoid useless ajax calls
              self.cache.lastFetchFilter = self.filters.regex.getMatchPattern(catalog.search);
            }
            self.data = subset;

            if (typeof catalog.total !== "number")
              self.raiseError("Missing total items count in response object. Please provide the total rows count inside the catalog page response object");
            self.updatePagination(catalog.total);
            def.resolveWith(self, [subset, false]);
          }
          self.checkPendingRender();
        }).fail(function () {
          //check if there is a newer call to function
          if (timestamp < self.lastFetchTimestamp) {
            //do nothing because there is a newer call to loadData
            return;
          }
          self.trigger("fetch:error");
          self.onFetchError();
          self.trigger("error", "ajax");
        });
      }
      return def.promise();
    },

    checkPendingRender: function () {
      var self = this, pending = self.pendingRender;
      if (pending && self.hasData()) {
        pending.resolveWith([self]);
        self.pendingRender = null;
      }
      return self;
    },

    /**
     * Returns a promise object related to the process of fetching data;
     * @param params
     * @returns {*}
     */
    getFetchPromise: function (params) {
      var self = this;
      //set ajax callbacks context
      params.context = self;
      self.onFetchStart();
      return self.postJson(params).always(function () {
        self.onFetchEnd();
      });
    },

    /**
     * Override this function to implement "onLoad" logic.
     */
    onFetchStart: function () {},

    /**
     * Override this function to implement "onFetchEnd" logic.
     */
    onFetchEnd: function () {},

    /**
     * Override this function to implement "onFetchError" logic.
     */
    onFetchError: function () {},

    /**
     * Override this function to implement "onFetchDone" logic.
     */
    onFetchDone: function () {},

    /**
     * Default function to post json data to the server, to fetch a collection.
     * Commonly, posted data includes filters like page number; number of items per page; etc.
     * @param params, default input parameters.
     * @returns {*}
     */
    postJson: function (params) {
      _.extend(params, {
        type: "POST",
        dataType: "json",
        contentType: "application/json"
      });
      if (!_.isString(params.data)) {
        params.data = this.json(params.data);
      }
      return $.ajax(params);
    },

    //pagination functions
    goToFirst: function () {
      this.pagination.page = 1;
      return this.onPageChange();
    },

    goToLast: function () {
      this.pagination.page = this.pagination.totalPageCount;
      return this.onPageChange();
    },

    goToNext: function () {
      var self = this,
        next = self.pagination.page + 1;
      if (self.validPage(next)) {
        self.pagination.page = next;
        self.onPageChange();
      }
      return self;
    },

    goToPrev: function () {
      var self = this,
        prev = self.pagination.page - 1;
      if (self.validPage(prev)) {
        self.pagination.page = prev;
        self.onPageChange();
      }
      return self;
    },

    onPageChange: function () {
      return this.storePage();
    },

    onResultsPerPageChange: function () {
      //store in the query string and in the localStorage
      var self = this,
        options = self.options,
        resultsPerPage = self.pagination.resultsPerPage;
      if (options.useLocalStorage && window.localStorage) {
        window.localStorage.setItem(options.resultsPerPageStorageKey, resultsPerPage);
      }
      if (options.useQueryString) {
        self.query.set(options.resultsPerPageQueryString, resultsPerPage);
      }
      return self;
    },

    storePage: function () {
      var self = this,
        page = self.pagination.page;
      if (self.options.useQueryString) {
        self.query.set(self.options.pageQueryString, page);
      }
      return self;
    },

    validPage: function (val) {
      var p = this.pagination;
      return !(isNaN(val) || val < 1 || val > p.totalPageCount || val === p.page);
    },

    getObjectSchema: function () {
      var self = this, limit = self.options.analyzeLimit;
      //analyze whole collection
      return self.objAnalyzer.getCollectionStructure(self.data, { clear: false, limit: limit });
    },

    getMemory: function (key) {
      var self = this,
        k = self.getKey(self.options[key]);
      return localStorage.getItem(k);
    },

    setMemory: function (key, val) {
      var self = this,
        k = self.getKey(self.options[key]);
      return localStorage.setItem(k, val);
    },

    getColumnsPositionData: function () {
      var self = this, 
        val = self.getMemory("columnsOrderStorageKey");
      try {
        if (val) {
          return JSON.parse(val);
        }
      } catch (ex) {}
      return null;
    },

    initializeColumns: function () {
      var n = "columnsInitialized",
        self = this;
      if (self[n] || !self.hasData()) return this;
      self[n] = true;
      var columns = [];
      var posData = self.getColumnsPositionData();

      //gets the first object of the table as example
      var objSchema = self.getObjectSchema();
      var optionsColumns = self.options.columns;

      if (optionsColumns) {
        var i = 0;
        //support defining only the columns by their display name (to save programmers's time)
        for (var x in optionsColumns) {
          var col = optionsColumns[x];
          if (_.isString(col))
            //normalize
            optionsColumns[x] = { displayName: col };
          if (_.isString(col.name)) {
            //if a name property is defined, replace it with the word `displayName`
            //since the KingTable requires the name to be equal to the property name.
            col.displayName = col.name;
            delete col.name;
          }
          if (_.isString(col.type)) {
            objSchema[x].type = col.type;
          }
          var colPos = col.position;
          if (_.isNumber(colPos)) {
            optionsColumns[x].position = colPos;
          } else {
            optionsColumns[x].position = i;
          }
          i++;
        }
      }

      for (var x in objSchema) {
        var base = { name: x },
          schema = objSchema[x],
          type = schema.type;
        if (!type) schema.type = type = "string";
        //extend with table column default options
        var col = _.extend({}, self.options.columnDefault, base, schema);
        // assign a unique id to this column object:
        col.cid = _.uniqueId("col");
        type = type.toLowerCase();
        //set default properties by field type
        var a = $.KingTable.Schemas.DefaultByType;
        if (a.hasOwnProperty(type)) {
          //default schema by type
          _.extend(base, a[type].call(self, schema, objSchema));
        }
        //set default properties by name
        a = $.KingTable.Schemas.DefaultByName;
        if (a.hasOwnProperty(x)) {
          //default schema by name
          _.extend(base, a[x]);
        }

        _.extend(col, base);

        if (optionsColumns) {
          //the user esplicitly defined some column options
          //columns are defined in the options, so take their defaults, supporting both arrays or plain objects
          var definedSchema = _.isArray(optionsColumns)
            ? _.find(optionsColumns, function (o) { return o.name == x; })
            : optionsColumns[x];
          if (definedSchema) {
            //some options are explicitly defined for a field: extend existing schema with column defaults
            _.extend(col, definedSchema);
          }
        }

        //replace the column template name placeholder with the actual field name
        col.template = col.template.replace(/##\s*Name\s*##/, '{{' + x + '}}');

        if (posData) {
          col.position = _.indexOf(posData, x);
        }
        // set css name for column
        n = "cssName";
        if (!_.isString(col[n])) {
          col[n] = _.kebabCase(col.name);
        }

        if (!_.isString(col.displayName))
          col.displayName = col.name;
        columns.push(col);
      }

      //if the user defined the columns inside the options;
      //automatically set their position on the basis of their index
      if (optionsColumns) {
        var i = 0, p = "position";
        for (var x in optionsColumns) {
          var col = _.find(columns, function (o) {
            return o.name == x;
          });
          if (col && !col.hasOwnProperty(p))
            col[p] = i;
          i++;
        }
      }

      //this.columns = new this.columnsCollection(columns);
      self.setColumns(columns);
      //will contain names of formatted properties
      self.columns.formatted = [];

      _.each(columns, function (col) {
        if (col.format) {
          self.columns.formatted.push(col.name);
        }
      });

      return self;
    },

    normalizeCollection: function (collection) {
      var len = "length";
      if (!collection[len]) return collection;
      var first = collection[0];
      if (first instanceof Array) {
        // assumes that the server is returning an optimized collection:
        // the first array contains the column names; while the others the values.
        var a = [];
        for (var i = 1, l = collection[len]; i < l; i++) {
          var o = {};
          for (var k = 0, j = first[len]; k < j; k++) {
            o[first[k]] = collection[i][k];
          }
          a.push(o);
        }
        return a;
      }
      // the collection is not optimized
      return collection;
    },

    formatData: function (data) {
      return this;
    },

    sortColumns: function () {
      //default function to sort columns: they are sorted
      //by position first, then display name
      var isNumber = _.isNumber, columns = this.columns;
      columns.sort(function (a, b) {
        var p = "position";
        if (isNumber(a[p]) && !isNumber(b[p])) return -1;
        if (!isNumber(a[p]) && isNumber(b[p])) return 1;
        if (a[p] > b[p]) return 1;
        if (a[p] < b[p]) return -1;
        //compare display name
        p = "displayName";
        return StringUtils.compare(a[p], b[p], 1);
      });
      for (var i = 0, l = columns.length; i < l; i++)
        columns[i].position = i;
      return this;
    },

    setTools: function () {
      var self = this,
        additionaltools = self.options.tools,
        tools = [
          // columns menu
          {
            name: I.t("voc.Columns"),
            menu: {
              id: "columns-menu",
              items: _(self.columns).reject(function (o) {
                return o.secret === true;
              }).map(function (o) {
                return {
                  name: o.displayName,
                  checked: !o.hidden,
                  type: "checkbox",
                  attr: {
                    "name": o.name,
                    "class": "visibility-check"
                  }
                };
              }).value()
            }
          }, self.getViewTools(), self.getExportTools()
        ];
      if (additionaltools) {
        //the user defined some tools
        tools = tools.concat(additionaltools.call(self));
      }

      self.tools = tools;
      return self;
    },

    getExportTools: function () {
      var exportFormats = this.options.exportFormats;
      if (!exportFormats) return null;
      //normalize
      _.each(exportFormats, function (o) {
        _.extend(o, {
          attr: {
            css: "export-btn",
            "data-format": o.format
          }
        });
      });
      return FileUtil.supportsCsExport() ? {
        name: I.t("voc.Export"),
        menu: {
          items: exportFormats
        }
      } : null;
    },

    setColumns: function (columns) {
      this.columns = columns;
      return this;
    },

    /**
     * First function that sets the pagination data inside the instance of KingTable; by options.
     * @returns {KingTable}
     */
    setPagination: function () {
      var data = this.data,
        options = this.options,
        page = options.page,
        resultsPerPage = +options.resultsPerPage,
        totalRowsCount = +options.totalRowsCount || (data ? data.length : 0),
        firstObjectNumber = (page * resultsPerPage) - resultsPerPage + 1,
        lastObjectNumber = page * resultsPerPage,
        search = self.pagination ? self.pagination.search : "";
      this.pagination = {
        page: options.page,
        firstPage: 1,
        resultsPerPage: resultsPerPage,
        totalRowsCount: totalRowsCount,
        totalPageCount: this.getPageCount(totalRowsCount, resultsPerPage),
        resultsPerPageSelect: options.resultsPerPageSelect,
        allowSearch: options.allowSearch,
        filtersWizard: options.filtersWizard,
        filterProperties: options.filterProperties,
        search: search || options.search,
        firstObjectNumber: firstObjectNumber,
        lastObjectNumber: lastObjectNumber,
        orderBy: options.orderBy,
        sortOrder: options.sortOrder
      };
      return this;
    },

    // gets the total page count to display n objects, given the number of objects per page
    getPageCount: function (objectsCount, objectsPerPage) {
      if (objectsCount > objectsPerPage) {
        if (objectsCount % objectsPerPage == 0) {
          return objectsCount / objectsPerPage;
        }
        return Math.ceil(objectsCount / objectsPerPage);
      }
      return 1;
    },

    setItemCount: function (arr) {
      var self = this,
          pag = self.pagination,
          offset = self.fixed ? 0 : ((pag.page - 1) * pag.resultsPerPage);
      if (!arr) arr = self.data;
      if (!self.columnsInitialized) self.initializeColumns();
      for (var i = 0, l = arr.length; i < l; i++) {
        arr[i].rowCount = i + 1 + offset;
      }
      return arr;
    },

    getItemsToDisplay: function (options) {
      options = options || {};
      var def = new $.Deferred(), self = this;
      var timestamp = self.lastFetchTimestamp = new Date().getTime();

      self.loadData(options, timestamp).done(function (a) {
        //make sure that the search filter is updated
        self.ensureSearchFilter();
        //apply filters here because we care about looking inside string representations of values
        a = self.filters.skim(a);
        //update pagination, but only if the table is fixed;
        if (self.fixed) {
          self.updatePagination(a.length);
          self.sortClientSide(a);
        }
        //set row count inside the array:
        self.setItemCount(a);
        def.resolveWith(self, [self.data.length > self.pagination.resultsPerPage && self.options.paginationEnabled ? self.getSubSet(a) : a]);
      });
      return def.promise();
    },

    sortClientSide: function (a) {
      var self = this,
          pag = self.pagination,
          sortBy = pag.orderBy,
          sortOrder = pag.sortOrder;
      if (!sortBy) return a;
      // get the column we are sorting by:
      var column = _.find(self.columns, function (o) { return o.name == sortBy; });
      if (!column) {
        // this can happen if the table is instantiated with a 'orderBy' option that doesn't
        // describe an existing property: do not sort - nothing bad happen, it's unclear what should be done otherwise
        return a;
      }
      // does it specify a sort function?
      if (column.sortFunction) {
        // sort using the column sorting function
        a.sort(column.sortFunction);
        if (/desc/i.test(sortOrder)) {
          a.reverse();
        }
      } else {
        // sort using the default function
        $.KingTable.Utils.Array.sortByProperty(a, sortBy, sortOrder);
      }
      return a;
    },

    /**
     * Updates the pagination data of this KingTable;
     * on the basis of the total items count.
     * @param totalRowsCount
     * @returns {$.KingTable.KingTable}
     */
    updatePagination: function (totalRowsCount) {
      var self = this;
      if (!self.pagination) self.setPagination();
      if (!_.isNumber(totalRowsCount)) throw "invalid type";
      var pagination = self.pagination;
      if (pagination.totalRowsCount !== totalRowsCount) {
        pagination.totalRowsCount = totalRowsCount;
        var totalPages = self.getPageCount(totalRowsCount, pagination.resultsPerPage);
        pagination.totalPageCount = totalPages;

        //if the current page is greater than the total pages count; then automatically set the page to 1
        if (totalPages < pagination.page)
          pagination.page = 1, self.onPageChange();
      }
      pagination.firstObjectNumber = (pagination.page * pagination.resultsPerPage) - pagination.resultsPerPage + 1;
      pagination.lastObjectNumber = pagination.page * pagination.resultsPerPage;
      //results count change
      if (self.onResultsCountChange)
        self.onResultsCountChange();
      return self;
    },

    // NB: this code is optimized this way: the server may return bigger supsets, in order to reduce the amount of ajax calls (for example, "pages" with arrays of 500 objects),
    // then the client may display them just 30 at a time, to avoid problems related to DOM manipulation slowness.
    // gets a new array with a subset of elements of a given array, based on the page and on the results per page numbers.
    getSubSet: function (array) {
      var pagination = this.pagination;
      var from = (pagination.page - 1) * pagination.resultsPerPage, to = pagination.resultsPerPage + from;
      return array.slice(from, to);
    },

    validateForSeach: function (val) {
      //returns true if a string value should trigger a search, false otherwise.
      var minSearchChars = this.options.minSearchChars;
      if (val.match(/^[\s]+$/g) || (_.isNumber(minSearchChars) && val.length < minSearchChars)) {
        return false;
      }
      return true;
    },

    getSearchProperties: function () {
      var self = this;
      if (self.options.searchProperties)
      //the user explicitly specified the search properties
        return self.options.searchProperties;
      //if data is not initialized yet, return false; search properties will be set later
      if (!self.data)
        return false;
      //guess search properties by objects
      var f = self.data[0];
      var arr = self.options.searchProperties = self.objAnalyzer.guessSearchableProperties(f);
      return _.reject(arr, function (name) {
        //
        //reject those columns that, by configuration, do not allow search
        //
        var col = _.find(self.columns, function (a) {
          return a.name == name;
        });
        if (col && col.allowSearch == false) return true;
        return false;
      });
    },

    dispose: function () {
      var self = this;
      delete self.columns;
      $(window).off("hashchange.kingtable" + self.cid);
      //trigger dispose event
      self.trigger("dispose");
      return self;
    },

    ensureSearchFilter: function () {
      var s = this.pagination.search;
      if (s && !this.filters.getRuleByKey("search"))
        this.setSearchFilter(s);
      return this;
    },

    setSearchFilter: function (val) {
      var self = this;
      if (!self.pagination) self.pagination = {};
      self.pagination.search = val;
      var searchProperties = self.getSearchProperties();
      if (searchProperties && searchProperties.length) {
        self.filters.set({
          type: "search",
          key: "search",
          value: val,
          searchProperties: searchProperties,
          searchMode: self.options.searchMode
        });
      }
      return self;
    },

    onSearchStart: function (search) {
      if (this.options.useQueryString) {
        //remove the search from the query string
        this.query.set(this.options.searchQueryString, search);
      }
      return this;
    },

    onSearchEmpty: function () {
      //remove rule from the filters manager
      var self = this;
      self.filters.removeRuleByKey("search");
      if (self.options.useQueryString) {
        //remove the search from the query string
        self.query.set(self.options.searchQueryString, "");
      }
      self.pagination.search = "";
      return self;
    },

    /**
     * Sorts the table by a column property
     * @param column object
     */
    sortBy: function (col) {
      //if the table is fixed; we can sort client side
      var self = this,
          pag = self.pagination,
          currentOrderBy = pag.orderBy,
          currentSort = pag.sortOrder,
          sortOrder = (currentOrderBy == col.name && currentSort == "asc") ? "desc" : "asc";
      //set sort oder
      pag.orderBy = col.name;
      pag.sortOrder = sortOrder;
      self.refresh();
      return this;
    },
    
    getKey: function (key) {
      if (typeof location != "undefined")
        return location.pathname + key;
      return key;
    },
    
    saveColumnsOrder: function () {
      var self = this,
        order = _.map(self.columns, function (o) {
          return o.name;
        });
      self.setMemory("columnsOrderStorageKey", self.json(order));
      return self;
    },

    getExportFileName: function (format) {
      return _.result(this.options, "collectionName", "data") + "." + format;
    },

    getColumnsForExport: function () {
      var columns = this.columns;
      return this.options.exportHiddenProperties
        ? columns
        : _.reject(columns, function (o) {
          return o.hidden || o.secret;
        });
    },

    /**
     * Optimizes a collection; making its structure smaller by removing the property names.
     * @param data
     */
    optimizeCollection: function (data) {
      var columns = this.getColumnsForExport(),
        a = [_.map(columns, function (o) {
        return o.displayName;
      })], len = "length", push = "push";
      for (var i = 0, l = data[len]; i < l; i++) {
        var b = [];
        for (var k = 0, j = columns[len]; k < j; k++) {
          var colname = columns[k].name;
          if (data[i].hasOwnProperty(colname))
            b[push](data[i][colname]);
        }
        a[push](b);
      }
      return a;
    },

    /**
     * Exports the current collection to the given format.
     * @param format
     */
    exportTo: function (format) {
      if (!format) throw "missing format";
      var self = this, options = self.options;
      var filename = self.getExportFileName(format),
        exportFormat = _.find(self.options.exportFormats, function (o) {
          return o.format === format;
        }),
        columns = self.getColumnsForExport();
      if (!exportFormat || !exportFormat.type) throw "missing format information";
      self.getItemsToDisplay().done(function (itemsToDisplay) {
        itemsToDisplay = _.map(itemsToDisplay, function (o) {
          return _.pick(o, _.map(columns, function (c) { return c.name; }));
        });
        var contents = "";
        if (exportFormat.handler) {
          //user defined handler
          contents = exportFormat.handler.call(self, itemsToDisplay);
        } else {
          //use default export handlers
          switch (format) {
            case "csv":
              var data = self.optimizeCollection(itemsToDisplay);
              contents = Csv.serialize(data, options.csvOptions);
              break;
            case "json":
              contents = JSON.stringify(itemsToDisplay, 2, 2);
              break;
            case "xml":
              contents = self.dataToXml(itemsToDisplay);
              break;
            default:
              throw "export format " + format + "not implemented";
          }
        }
        if (contents)
          FileUtil.exportfile(filename, contents, exportFormat.type);
      });
    },

    /**
     * Basic function to convert the given data into an xml structure.
     */
    dataToXml: function (data) {
      var self = this,
        columns = self.getColumnsForExport(),
        options = self.options,
        len = "length",
        d = document,
        s = new XMLSerializer(),
        createElement = "createElement",
        appendChild = "appendChild",
        root = d[createElement](options.collectionName || "collection");
      for (var i = 0, l = data[len]; i < l; i++) {
        var item = d[createElement](options.entityName || "item");
        for (var k = 0, j = columns[len]; k < j; k++) {
          var col = columns[k], name = col.name, value = data[i][name];
          if (options.entityUseProperties) {
            //use properties
            item.setAttribute(name, value);
          } else {
            //use elements
            var subitem = d[createElement](name);
            subitem.innerText = value;
            item[appendChild](subitem);
          }
        }
        root[appendChild](item);
      }
      var xml = s.serializeToString(root);
      return options.prettyXml ? Xml.pretty(xml) : Xml.normal(xml);
    }
  });

  return KingTable;
});