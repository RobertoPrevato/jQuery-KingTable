/**
 * jQuery-KingTable Lodash connector.
 * https://github.com/RobertoPrevato/jQuery-KingTable
 *
 * Copyright 2015, Roberto Prevato
 * http://ugrose.com
 *
 * Licensed under the MIT license:
 * http://www.opensource.org/licenses/MIT
 */
R("kingtable-lodash", ["kingtable-core"], function (KingTable) {
  //
  //  Extends jQuery KingTable prototype with functions to use it with jQuery and Lodash.
  //  These functions are separated from the business logic, and contain DOM manipulation code.
  //  It is possible to define different "connector" that, following the same interface used by the business logic,
  //  use different approach to build the interface.
  //
  var paginationBarEvents = {
    "click .pagination-bar-first-page": "goToFirst",
    "click .pagination-bar-last-page": "goToLast",
    "click .pagination-bar-prev-page": "goToPrev",
    "click .pagination-bar-next-page": "goToNext",
    "click .pagination-bar-refresh": "refresh",
    "change .pagination-bar-page-number": "changePage",
    "change .pagination-bar-results-select": "changeResultsNumber"
  };

  var tableEvents = {
    "click .king-table-head th": "sort",
    "click .resize-handler": "toggleColumnResize"
  };

  var searchEvents = {
    "keyup .search-field": "onSearchKeyUp",
    "paste .search-field, cut .search-field": "onSearchChange",
    "click .btn-filters-wizard": "openFiltersDialog"
  };

  //extend the table default options
  _.extend(KingTable.prototype.defaults, {
    /**
     * TagName of the row element
     */
    rowTagName: "tr",
    /**
     * TagName of the head cells
     */
    headCellTagName: "th",
    /**
     * Whether to keep consistent the width of cells; once they have been rendered for the first time; or not.
     * Really useful to nicely keep the cell size when changing page; saving the time to specify the width in the css.
     */
    keepCellsWidth: true,
    /**
     * Permits to specify whether checkboxes inside the KingTable should be editable or not (TODO)
     */
    editableCheckboxes: false,
    /**
     * Allows to define additional template helpers to use with Lodash template engine
     */
    templateHelpers: null,
    /**
     * Allows to define additional event handlers
     */
    events: null
  });

  // modifies the default schemas
  _.extend(KingTable.Schemas.DefaultByType, {
    boolean: function (columnSchema, objSchema) {
      var editable = this.editableCheckboxes;
      return {
        sortable: true,
        template: '<input class="ajax-checkbox" name="' + columnSchema.name + '" type="checkbox"{% if(' + columnSchema.name + ') {%} checked="checked"{% } %}' + (editable ? '' : ' disabled="disabled" readonly="readonly"') + ' />',
        position: 990
      };
    }
  });

  //NB: in newer versions of lodash, the template function returns a compiler function;
  //in older versions it returns directly a string
  var templateMode = typeof _.template("") == "string" ? 0 : 1;

  _.extend(KingTable.prototype, {

    connectorInit: function () {
      //register a missing data event handler
      return this.on("missing-data", function () {
        //data is missing; and the table doesn't have columns info
        //this may happen when the user refreshes the page when nothing is displayed
        this.buildSkeleton().buildPagination().showEmptyView().focusSearchField();
      });
    },

    template: function (templateName, context) {
      var data = $.KingTable.Templates[templateName];
      switch (templateMode) {
        case 0:
          //legacy mode: _.template returns a string
          return _.template(template, context);
        case 1:
          //newer mode: _.template returns a compiler function
          //is the template already compiled?
          if (_.isFunction(data))
            return data(context);

          //compile and store template cache
          var compiler = $.KingTable.Templates[templateName] = _.template(data);
          return compiler(_.extend({}, context, this.templateHelpers()));
      }
    },

    templateSafe: function (template, context) {
      switch (templateMode) {
        case 0:
          //legacy mode: _.template returns a string
          return _.template(template, context);
        case 1:
          //newer mode: _.template returns a compiler function
          var compiler = _.template(template);
          return compiler(context);
      }
    },

    refresh: function () {
      //refresh only the pagination buttons and the table body
      return this.buildPaginationControls().buildBody();
    },

    build: function (isSynchronous) {
      var self = this;
      self.buildSkeleton()
        .buildHead()
        .buildPagination()
        .buildHead()
        .buildBody({
          dataJustFetched: !isSynchronous
        }).focusSearchField();
      self.on("search-qs-change", function () {
        self.buildPagination().buildBody().focusSearchField();
      });
    },

    buildSkeleton: function () {
      var self = this, initialized = "skeletonInitialized";
      if (self[initialized]) return self;
      self[initialized] = true;
      var template = self.getTemplate();
      var html = $(template);

      if (!(self.$el instanceof $) || !self.$el.length)
        throw new Error("the king-table is not bound to any element; it must be bound to a container element.");

      var id = self.options.id;
      if (id)
        html.attr("id", id);

      self.$el.html(html);
      self.bindUiElements();
      return self;
    },

    focusSearchField: function () {
      var self = this;
      _.delay(function () {
        var sfield = $(".search-field").trigger("focus"),
          search = self.pagination.search;
        if (search) {
          sfield.get(0).selectionStart = search.length;
        }
      }, 50);
      return self;
    },

    getTemplate: function () {
      return $.KingTable.Templates["king-table-base"];
    },
    
    buildHead: function () {
      var self = this,
        options = self.options,
        rowTagName = options.rowTagName || "tr",
        headCellTagName = options.headCellTagName || "th",
        emptyCell = "<" + headCellTagName + " class=\"row-number\"></" + headCellTagName + ">",
        html = ["<" + rowTagName + ">"],
        columns = self.columns;
      //add empty cells
      html.push(emptyCell);//for first row number
      emptyCell =  "<" + headCellTagName + "></" + headCellTagName + ">";
      if (options.detailRoute)
        html.push(emptyCell);//for the go to details link
      _.each(columns, function (col) {
        if (col.hidden) return;
        //first time
        html.push(self.template("king-table-head-cell", _.extend(col, {
          sort: options.orderBy == col.name ? options.sortOrder : ""
        })));
      });
      html.push("</" + rowTagName + ">");
      //set html inside the head
      self.$el.find(".king-table-head").html(html.join(""));
      if (options.keepCellsWidth) {
        //delay is intentional
        _.delay(function () {
          self.$el.find(".king-table-head th").each(function () {
            var $t = $(this), w = "width";
            $t[w]($t[w]());
          });
        }, 20);
      }
      return self;
    },

    buildPagination: function () {
      var self = this;
      if (!self.options.paginationEnabled) return self;
      self.$el.find(".pagination-bar").html(self.template("pagination-bar-layout"));
      return self.buildPaginationControls().buildFiltersControls();
    },

    keepFocus: function (el) {
      var focused = el.find(":focus:first");
      if (focused.length)
        _.defer(function () {
          el.find("[class='" + focused.attr("class") + "']").trigger("focus");
        });
      return this;
    },

    rebuild: function (el, template, context) {
      this.keepFocus(el);
      el.html(this.template(template, context));
      return this;
    },

    buildPaginationControls: function () {
      return this.rebuild(this.$el.find(".pagination-bar-buttons"), "pagination-bar-buttons", this.pagination);
    },

    buildFiltersControls: function () {
      return this.rebuild(this.$el.find(".pagination-bar-filters"), "pagination-bar-filters", this.pagination);
    },

    buildBody: function (options) {
      var self = this;

      self.getRowsToDisplay(options).done(function (rowsToDisplay) {
        if (!rowsToDisplay.length)
          return self.showEmptyView();

        var html = [], rowTemplate = self.getRowTemplate(), helpers = self.templateHelpers();
        _.each(rowsToDisplay, function (row) {
          html.push(self.templateSafe(rowTemplate, _.extend(row, helpers)));
        });
        //inject all html at once
        self.$el.find(".king-table-body").html(html.join(""));
      });
      return self;
    },

    showEmptyView: function () {
      var self = this,
          cols = self.columns,
          html = self.templateSafe($.KingTable.Templates["king-table-empty-view"], {
        colspan: cols ? cols.length + 1 : 1
      });
      this.$el.find(".king-table-body").html(html);
      return this;
    },

    bindUiElements: function () {
      return this
          .delegateEvents()
          .bindWindowEvents();
    },

    bindWindowEvents: function () {
      var self = this;
      //support moving changing page using the keyboard
      $("body").on("keydown.king-table", function (e) {
        var isInputFocused = !!$(":input:focus").length;
        if (isInputFocused) return true;
        var kc = e.keyCode;
        if (_.contains([37, 65], kc)) {
          //prev page
          self.goToPrev();
        }
        if (_.contains([39, 68], kc)) {
          //next page
          self.goToNext();
        }
      });
      //when the table is disposed, remove the event handler:
      self.on("dispose", function () {
        $("body").off("keydown.king-table");
      });

      //TODO: support swipe events; using HammerJs library
      return self;
    },

    /**
     * Returns a table cell with a link to a detail link.
     */
    getGoToDetailsLink: function () {
      var self = this, cellTagName = "td", options = self.options;
      var idProperty = options.getIdProperty();
      var detailRoute = options.detailRoute;
      return self.string.format("<{0} class=\"{1}\"><a href=\"{2}{{" + idProperty + "}}\"><span class=\"oi\" data-glyph=\"document\" title=\"{{I.t('voc.GoToDetailsLink')}}\" aria-hidden=\"true\"></span></a></{0}>", cellTagName, "detail-link", detailRoute);
    },
    
    /** 
     * Returns a built template of a row, with cells in the proper order
     * Assumes that Columns are already ordered by Position
     */
    getRowTemplate: function () {
      var sb = [],
        self = this,
        options = self.options,
        wrapperTagName = "tr",
        cellTagName = "td";

      if (!self.columnsInitialized)
        self.initializeColumns();

      sb.push(self.string.format("<{0}>", wrapperTagName));
      if (options.rowCount) {
        sb.push(self.string.format("<{0} class=\"{1}\">{{rowCount}}</{0}>", cellTagName, "row-number"));
      }
      
      if (options.detailRoute) {
        sb.push(self.getGoToDetailsLink());
      }

      var searchRule = self.filters.getRuleByKey("search");
      for (var i = 0, l = self.columns.length; i < l; i++) {
        //skip hidden columns
        var column = self.columns[i];
        if (column.hidden || !column.template) continue;

        //super smart table
        if (column.allowSearch) {
          var looksOkForSearch = self.doesTemplateLookSearchable(column);
          if (!looksOkForSearch) column.allowSearch = false;
        }

        var propertyToUse = _.contains(self.columns.formatted, column.name) ? (column.name + self.options.formattedSuffix) : column.name;
        sb.push(this.string.format('<{0}>', cellTagName));

        //automatic highlight of searched properties: if the column template contains the $highlight function;
        //the programmer is specifying the template, so don't interfere!
        if (searchRule && options.autoHighlightSearchProperties && column.allowSearch && !/\$highlight/.test(column.template)) {
          //automatically highlight the searched property, if it contains any match
          sb.push('{%print($highlight(' + propertyToUse + '))%}');
        } else {
          //use the column template
          sb.push(column.template);
        }
        sb.push(this.string.format("</{0}>", cellTagName));
      }

      sb.push(this.string.format("</{0}>", wrapperTagName));
      //sb.push("{%});%}");
      var template = sb.join("");
      return template;
    },

    /**
     * Returns true if the column template looks like as if it allow
     * to highlight the property value, false otherwise.
     * The table is smart and doesn't break the template of those columns like pictures or anchor tags.
     * @param column
     * @returns {boolean}
     */
    doesTemplateLookSearchable: function (column) {
      //if the template contains the $highlight function;
      //the programmer is specifying the template, so don't interfere
      if (/\$highlight/.test(column.template)) return true;
      var property = column.name;
      var rx = new RegExp("(src|href)=['\"].*{{" + property + "}}.*['\"]");
      return column.template.search(rx) == -1;
    },

    //
    //generates a dynamic definition of events to bind to elements
    //if passing events option when defining the dataentry, there is a base automatically added
    getEvents: function () {
      var events = this.events || {};
      if (_.isFunction(events)) events = events.call(this);
      //extends events object with validation events
      return _.extend({}, paginationBarEvents, tableEvents, searchEvents, events, this.options.events);
    },

    // delegate events
    delegateEvents: function () {
      var self = this,
        events = self.getEvents(),
        delegateEventSplitter = /^(\S+)\s*(.*)$/;
      self.undelegateEvents();
      for (var key in events) {
        var method = events[key];
        if (!_.isFunction(method)) method = self[method];
        if (!method) throw new Error("method not defined inside the model: " + events[key]);
        var match = key.match(delegateEventSplitter);
        var eventName = match[1], selector = match[2];
        method = _.bind(method, this);
        eventName += '.delegate';
        if (selector === '') {
          self.$el.on(eventName, method);
        } else {
          self.$el.on(eventName, selector, method);
        }
      }
      return self;
    },

    // Clears all callbacks previously bound to the view with `delegateEvents`
    undelegateEvents: function () {
      this.$el.off('.delegate');
      return this;
    },

    changePage: function (e) {
      var val = parseInt(e.currentTarget.value),
        self = this,
        currentPage = self.pagination.page;
      if (!self.validPage(val)) {
        //revert to previous value
        e.currentTarget.value = currentPage;
      } else {
        self.pagination.page = val;
        self.onPageChange();
      }
    },

    changeResultsNumber: function (e) {
      var val = parseInt(e.currentTarget.value),
        pagination = this.pagination;
      pagination.resultsPerPage = val;
      //set total page number
      pagination.totalPageCount = this.getPageCount(pagination.totalRowsCount, val);
      this.onResultsPerPageChange();
      this.buildPaginationControls().buildBody();
    },

    onPageChange: function () {
      this.storePage().buildPaginationControls().buildBody();
    },

    sort: function (e) {
      var el = $(e.currentTarget),
          ic = el.find(".oi"),
          colid = el.data("id"),
          col = _.find(this.columns, function (o) {
            return o.cid == colid;
          });
      if (!col || !col.sortable)
        return true;//do nothing

      //remove sort icon from other columns
      el.siblings().find(".oi").attr("data-glyph", "");
      var sortOrder = ic.attr("data-glyph") == "sort-ascending" ? "desc" : "asc";
      ic.attr("data-glyph", "sort-" + sortOrder + "ending");
      //sort collection by
      this.sortBy(col);
    },

    onFetchStart: function () {
      //displays a preloader into the table; but only if the requests last more than 300 ms
      this.showPreloader();
    },

    onFetchEnd: function () {
      this.hidePreloader();
    },

    onFetchError: function () {
      var self = this,
          html = self.templateSafe($.KingTable.Templates["king-table-error-view"], {
        message: I.t("voc.ErrorLoadingContents"),
        colspan: self.columns ? self.columns.length + 1 : 1
      });
      self.$el.find(".king-table-body").html(html);
      return self;
    },

    toggleColumnResize: function (e) {
      var self = this, $el = $(e.currentTarget).closest("th");
      if (self.mode == "col-resize") {
        self.unsetMode();
        return false;
      }
      self.mode = "col-resize";
      self.unsetMode = self.stopResize;
      //track mouse move
      var pos = $el.position();
      self.$el
        .css({
          cursor: "col-resize"
        }).on("mousemove.resize", function (e) {
          if (e.clientX - 10 < pos.left) return;
          var newWidth = e.clientX - pos.left;
          if (newWidth < 0) newWidth = 0;
          $el.width(newWidth);
          //TODO: save width as a preference inside the local storage (low priority)
        });

      _.delay(function () {
        //bind one time event handler for document mouseup
        $(document).one("mouseup.resize", function () {
          self.stopResize();
          return false;
        });
      }, 50);
      return false;
    },

    stopResize: function () {
      this.mode = "";
      this.$el.css({ cursor: "default" }).off("mousemove.resize");
      $(document).off("mouseup.resize");
      return this;
    },

    getSearchHandler: function () {
      //gets a search handler to start a search
      //by design and intentionally, the search is lazy (it starts few milliseconds after the user stops typing into the search field)
      return _.debounce(function searchCore(field) {
        if (!field) return;
        var val = _.isString(field) ? field : field.val();
        var self = this;
        if (self.validateForSeach(val)) {
          //add filters inside the filters manager
          if (val.length === 0) {
            //remove filter
            self.onSearchEmpty();
            self.filters.removeRuleByKey("search");
          } else {
            self.onSearchStart(val);
            self.setSearchFilter(val);
          }
          //set page to first
          self.pagination.page = 1;
          self.refresh();
        } else {
          //value is not valid for search: remove the rule by key
          self.onSearchEmpty();
          self.filters.removeRuleByKey("search");
          self.refresh();
        }
      }, this.options.searchDelay);
    },

    validateSearchEventKey: function (e) {
      //returns true if the event keycode is meaningful to trigger a search, false otherwise
      var c = e.keyCode ? e.keyCode : e.charCode;
      var codesToIgnore = [
        9,  //tab
        13, //enter
        16, //shift
        17, //ctrl
        18, //alt
        20, //caps lock
        27, //esc
        33, //pageUp
        34, //pageDown
        35, //end
        36, //beginning
        37, //left
        38, //top
        39, //right
        40, //down
        91  //windows
      ];
      //ignore certains keys
      for (var i = 0, l = codesToIgnore.length; i < l; i++) {
        if (c == codesToIgnore[i]) return false;
      }
      return true;
    },

    onSearchKeyUp: function (e) {
      var el = $(e.currentTarget),
        self = this;

      if (el.hasClass("ui-disabled")) return true;
      //does the field has a value?
      if (!el.val()) {
        self.onSearchEmpty();
      }
      //should the key event trigger a search?
      if (self.validateSearchEventKey(e)) {
        //event character is valid, go on
        self.searchCore(el);
      }
      return true;
    },

    onResultsCountChange: function () {
      return this.buildPaginationControls();
    },

    onSearchChange: function (e) {
      var el = $(e.currentTarget), self = this;
      _.delay(function () {
        self.searchCore(el);
      }, 50);
    },

    showPreloader: function (delay) {
      if (!_.isNumber(delay)) delay = 300;
      var self = this;
      self.unsetDelayedPreloader();
      self.cache.delayedpreloader = window.setTimeout(function () {
        if (!self.cache.delayedpreloader)
          return;
        var n = "king-table-preloader",
            preloader = $($.KingTable.Templates[n]).addClass(n);
        self.$el.find(".king-table-container").append(preloader);
      }, delay);
    },

    hidePreloader: function () {
      var self = this;
      self.unsetDelayedPreloader();
      self.$el.find(".king-table-container .king-table-preloader").remove();
    },

    unsetDelayedPreloader: function () {
      var cache = this.cache, prop = "delayedpreloader";
      if (cache[prop]) {
        window.clearTimeout(cache[prop]);
        delete cache[prop];
      }
      return this;
    },

    //template helpers to build html with UnderscoreJs template function
    templateHelpers: function () {
      var self = this,
          searchRule = self.filters.getRuleByKey("search"),
          pattern = searchRule ? new RegExp("(" + $.KingTable.Utils.Regex.escapeCharsForRegex(searchRule.value) + ")", "gi") : null;
      return _.extend({
        $i: function (key) { return I.t(key); },
        $highlight: function (s) {
          if (!s) return "";
          if (!pattern) return s;
          if (typeof s != "string") s = s + "";
          return s.replace(pattern, "<span class=\"ui-search-highlight\">$1</span>");
        },
        $relwidth: function (origWidth, origHeight, relHeight) {
          var ratio = relHeight / origHeight;
          return Math.ceil(ratio * origWidth);
        },
        $relheight: function (origWidth, origHeight, relWidth) {
          var ratio = relWidth / origWidth;
          return Math.ceil(ratio * origHeight);
        }
      }, self.options.templateHelpers);
    },

    openFiltersDialog: function () {
      //TODO
    }

  });
});