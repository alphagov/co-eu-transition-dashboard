
/*
  Search

  Given a search input and table. This module orchastrates and inline search
  of a table.

*/

const liveSearchEnabled = false;

function Search (options) {
  this.options = options;
}

Search.prototype.init = function() {
  // Check for search and table element
  if (!this.options.$search || !this.options.$table) {
    return;
  }

  this.setElements();
  this.getSearchArguments();
  this.setSearchInput(this.queryParameters.term);
  this.hideShowClearButton();
  this.filterTable();
  this.bindEvents();
};

const helper = {
  getUrlQueryParameter: name => {
    const regexp = new RegExp('[\?&]' + name + '=([^&#]*)'); // eslint-disable-line no-useless-escape
    const results = regexp.exec(window.location.href);
    if (results && results.length) {
      return decodeURI(results[1]);
    }
  }
};

Search.prototype.setElements = function() {
  this.elements = {
    $searchInput: this.options.$search.querySelector('.search-input'),
    $clearSearch: this.options.$search.querySelector('.clear-search-button'),
    $tableRows: this.options.$table.querySelectorAll('.searchable-row')
  };
};

Search.prototype.getSearchArguments = function() {
  const queryParameterNames = ['term'];

  this.queryParameters = queryParameterNames.reduce((queryParameters, name) => {
    const queryParameterValue = helper.getUrlQueryParameter(name);
    if(queryParameterValue) {
      queryParameters[name] = queryParameterValue;
    }
    return queryParameters;
  }, {});
};

Search.prototype.setSearchInput = function(value = "") {
  this.elements.$searchInput.value = value;
};

Search.prototype.clearSearchTerm = function() {
  this.elements.$searchInput.value = "";
};

Search.prototype.filterTable = function() {
  const queryParameterValues = Object.values(this.queryParameters);

  this.elements.$tableRows.forEach($row => {
    let rowText = $row.innerText || $row.textContent;
    rowText = rowText.toLowerCase();

    const matchesQueryParmeters = queryParameterValues
      .every(queryParameterValue => rowText.includes(queryParameterValue.toLowerCase()));

    if(matchesQueryParmeters) {
      $row.classList.add("show");
    } else {
      $row.classList.remove("show");
    }
  });
};

Search.prototype.hideShowClearButton = function() {
  if(this.elements.$searchInput.value.length) {
    this.elements.$clearSearch.classList.remove("hidden");
  } else {
    this.elements.$clearSearch.classList.add("hidden");
  }
};

Search.prototype.bindEvents = function() {
  this.elements.$clearSearch.addEventListener("click", () => {
    this.queryParameters.term = "";
    this.setSearchInput();
    this.elements.$searchInput.focus();
    this.hideShowClearButton();

    if (liveSearchEnabled) {
      this.filterTable();
    }
  });

  this.elements.$searchInput.addEventListener("keyup", () => {
    this.hideShowClearButton();
    if (liveSearchEnabled) {
      this.queryParameters.term = this.elements.$searchInput.value;
      this.filterTable();
    }
  });
};

export default Search;
