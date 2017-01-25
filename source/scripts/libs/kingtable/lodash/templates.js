//
//Knight generated templates file.
// * 
// * Templates for the jQuery-KingTable Lodash connector
// * 
//
if (!$.KingTable.Templates) $.KingTable.Templates = {};
(function (templates) {
  var o = {
    'king-table-head-cell': '<th data-id="{{cid}}" class="{{$hyphenize(name)}}{% if (obj.sortable) { %} sortable{%}%}"> {% if (name) { %} <div> <span>{{displayName}}</span> <span class="oi" data-glyph="{% if (obj.sort) { %}sort-{{obj.sort}}ending{%}%}" aria-hidden="true"></span> {% if (obj.resizable) { %} <span class="resize-handler"></span> {% } %} </div> {% } %} </th>',
    'king-table-preloader': '<div class="preloader-mask"> <div class="preloader-icon"></div> </div>',
    'king-table-empty-cell': '<th></th>',
    'king-table-gallery': '<div class="king-table-gallery"> <ul class="king-table-body"></ul> <br class="break" /> </div>',
    'king-table-table': '<table class="king-table"> <thead class="king-table-head"></thead> <tbody class="king-table-body"></tbody> </table>',
    'king-table-empty-view': '<div class="king-table-empty"> <span>{{$i("voc.NoResults")}}</span> </div>',
    'king-table-base': '<div class="king-table-region"> <div class="pagination-bar"></div> <div class="filters-region"></div> <div class="king-table-container"></div> </div>',
    'king-table-error-view': '<div class="king-table-error"> <span class="message"> <span>{{message}}</span> <span class="oi" data-glyph="warning" aria-hidden="true"></span> </span> </div>',
    'pagination-bar-buttons': '{% if (page > firstPage) { %} <span tabindex="0" class="pagination-button pagination-bar-first-page oi" data-glyph="media-step-backward" title="{{$i(\'voc.FirstPage\')}}"></span> <span tabindex="0" class="pagination-button pagination-bar-prev-page oi" data-glyph="caret-left" title="{{$i(\'voc.PrevPage\')}}"></span> {% } else { %} <span class="pagination-button-disabled pagination-bar-first-page-disabled oi" data-glyph="media-step-backward"></span> <span class="pagination-button-disabled pagination-bar-prev-page-disabled oi" data-glyph="caret-left"></span> {% } %} <span class="separator"></span> <span class="valigned">{{$i(\'voc.Page\')}} </span> {% if (totalPageCount > 1) { %} <input name="page-number" type="text" class="w30 must-integer pagination-bar-page-number" value="{{page}}" /> {% } else { %} <span class="valigned pagination-bar-page-number-disabled">{{page}}</span> {% } %} <span class="valigned total-page-count"> {{$i(\'voc.of\')}} {{totalPageCount}}</span> <span class="separator"></span> <span tabindex="0" class="pagination-button pagination-bar-refresh oi" data-glyph="reload" title="{{$i(\'voc.Refresh\')}}"></span> <span class="separator"></span> {% if (page < totalPageCount) { %} <span tabindex="0" class="pagination-button pagination-bar-next-page oi" data-glyph="caret-right" aria-expanded="true" title="{{$i(\'voc.NextPage\')}}"></span> <span tabindex="0" class="pagination-button pagination-bar-last-page oi" data-glyph="media-step-forward" title="{{$i(\'voc.LastPage\')}}"></span> {% } else { %} <span class="pagination-button-disabled pagination-bar-next-page-disabled oi" data-glyph="caret-right"></span> <span class="pagination-button-disabled pagination-bar-last-page-disabled oi" data-glyph="media-step-forward"></span> {% } %} <span class="separator"></span> <span class="valigned">{{$i(\'voc.ResultsPerPage\')}}</span> {% if (totalRowsCount) { %} <select name="pageresults" class="pagination-bar-results-select valigned"{% if (totalRowsCount <= 10) { %} disabled="disabled"{% } %}> {% _.each(resultsPerPageSelect, function (val) { %} <option value="{{val}}"{% if (val == resultsPerPage) { %} selected="selected"{%}%}>{{val}}</option> {% }) %} </select> {% } else { %} <select name="pageresults" class="pagination-bar-results-select valigned" disabled="disabled" readonly="readonly"></select> {% } %} <span class="separator"></span> <span class="valigned m0"> {% if (totalRowsCount) { %} {{$i(\'voc.Results\')}} {{firstObjectNumber}} - {{Math.min(lastObjectNumber, totalRowsCount)}} {{$i(\'voc.of\')}} {{totalRowsCount}} {% } else { %} 0 Results {% } %} </span> <span class="separator"></span>',
    'pagination-bar-filters': '{% if (allowSearch) { %} <input type="text" class="search-field" value="{{search}}" /> {% } %} {% if (advancedFiltersButton) { %} <button class="btn camo-btn btn-advanced-filters">{{$i("voc.AdvancedFilters")}}</button> {% } %} {% if (filtersWizard) { %} <button class="btn btn-filters-wizard">{{$i("voc.Filters")}}</button> {% } %}',
    'pagination-bar-layout': '<div class="tools-region"> <span tabindex="0" class="oi ug-expander" data-glyph="cog"></span> </div> <span class="pagination-bar-buttons"></span> <span class="pagination-bar-filters"></span>'
  };
  var x;
  for (x in o) {
    templates[x] = o[x];
  }
})($.KingTable.Templates);