//
//Knight generated templates file.
// * 
// * Templates for the jQuery-KingTable Lodash connector
// * 
//
if (!$.KingTable.Templates) $.KingTable.Templates = {};
(function (templates) {
  var o = {
    'king-table-preloader': '<div class="preloader-mask"> <div class="preloader-icon"></div> </div>',
    'king-table-empty-view': '<tr class="king-table-empty"> <td colspan="{{colspan}}">{{I.t("voc.NoResults")}}</td> </tr>',
    'king-table-head-cell': '<th data-id="{{cid}}" class="{% if (obj.sortable) { %} sortable{%}%}"> {% if (name) { %} <div> <span>{{displayName}}</span> <span class="oi" data-glyph="{% if (obj.sort) { %}sort-{{obj.sort}}ending{%}%}" title="icon name" aria-hidden="true"></span> {% if (obj.resizable) { %} <span class="resize-handler"></span> {% } %} </div> {% } %} </th>',
    'king-table-empty-cell': '<th></th>',
    'king-table-base': '<div class="king-table-region"> <div class="pagination-bar"></div> <div class="filters-region"></div> <div class="king-table-container"> <table class="king-table"> <thead class="king-table-head"></thead> <tbody class="king-table-body"></tbody> </table> </div> </div>',
    'king-table-error-view': '<tr class="king-table-error"> <td class="message" colspan="{{colspan}}"> <span>{{message}}</span> <span class="oi" data-glyph="warning" title="icon name" aria-hidden="true"></span> </td> </tr>',
    'pagination-bar-buttons': '{% if (page > firstPage) { %} <span tabindex="0" class="pagination-button pagination-bar-first-page" title="{{I.t(\'voc.FirstPage\')}}"></span> <span tabindex="0" class="pagination-button pagination-bar-prev-page" title="{{I.t(\'voc.PrevPage\')}}"></span> {% } else { %} <span class="pagination-button-disabled pagination-bar-first-page-disabled"></span> <span class="pagination-button-disabled pagination-bar-prev-page-disabled"></span> {% } %} <span class="separator"></span> <span class="valigned">{{I.t(\'voc.Page\')}} </span> {% if (totalPageCount > 1) { %} <input name="page-number" text="text" class="w30 must-integer pagination-bar-page-number" value="{{page}}" /> {% } else { %} <span class="valigned pagination-bar-page-number-disabled">{{page}}</span> {% } %} <span class="valigned" style="display:inline-block;min-width:30px;"> {{I.t(\'voc.of\')}} {{totalPageCount}}</span> <span class="separator"></span> <span tabindex="0" class="pagination-button pagination-bar-refresh" title="{{I.t(\'voc.Refresh\')}}"></span> <span class="separator"></span> {% if (page < totalPageCount) { %} <span tabindex="0" class="pagination-button pagination-bar-next-page" title="{{I.t(\'voc.NextPage\')}}"></span> <span tabindex="0" class="pagination-button pagination-bar-last-page" title="{{I.t(\'voc.LastPage\')}}"></span> {% } else { %} <span class="pagination-button-disabled pagination-bar-next-page-disabled"></span> <span class="pagination-button-disabled pagination-bar-last-page-disabled"></span> {% } %} <span class="separator"></span> <span class="valigned">{{I.t(\'voc.ResultsPerPage\')}}</span> {% if (totalRowsCount) { %} <select name="pageresults" class="pagination-bar-results-select valigned"{% if (totalRowsCount <= 10) { %} disabled="disabled"{% } %}> {% _.each(resultsPerPageSelect, function (val) { %} <option value="{{val}}"{% if (val == resultsPerPage) { %} selected="selected"{%}%}>{{val}}</option> {% }) %} </select> {% } else { %} <select name="pageresults" class="pagination-bar-results-select valigned" disabled="disabled" readonly="readonly"></select> {% } %} <span class="separator"></span> <span class="valigned m0"> {% if (totalRowsCount) { %} {{I.t(\'voc.Results\')}} {{firstObjectNumber}} - {{Math.min(lastObjectNumber, totalRowsCount)}} {{I.t(\'voc.of\')}} {{totalRowsCount}} {% } else { %} 0 Results {% } %} </span> <span class="separator"></span>',
    'pagination-bar-filters': '{% if (allowSearch) { %} <input type="text" class="search-field" value="{{search}}" /> {% } %} {% if (advancedFiltersButton) { %} <button class="btn camo-btn btn-advanced-filters">{{I.t("voc.AdvancedFilters")}}</button> {% } %} {% if (filtersWizard) { %} <button class="btn btn-filters-wizard">{{I.t("voc.Filters")}}</button> {% } %}',
    'pagination-bar-layout': '<span class="pagination-bar-buttons"></span> <span class="pagination-bar-filters"></span>'
  };
  var x;
  for (x in o) {
    templates[x] = o[x];
  }
})($.KingTable.Templates);