
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
  this.setThemeFilters(this.queryParameters.themeFilter);
  this.hideShowClearButton();
  this.filterTable();
  this.bindEvents();
};

const helper = {
  getUrlQueryParameter: name => {
    const regexp = `[\?&]${name}=([^&#]*)`; // eslint-disable-line no-useless-escape
    const params = Array.from(window.location.href.matchAll(regexp));
    let paramValues = [];
    if (params && params.length) {
      paramValues = params.map(param => {
        return decodeURI(param[1])
      })
      // return decodeURI(results[1]);
    }
    return paramValues;
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
  const queryParameterNames = ['term', 'themeFilter'];

  this.queryParameters = queryParameterNames.reduce((queryParameters, name) => {
    const queryParameterValue = helper.getUrlQueryParameter(name);
    if(queryParameterValue) {
      // FORM with get method replaces spaces with +
      queryParameters[name] = decodeURIComponent(queryParameterValue).replace(/[+]/g, ' ');
    }
    return queryParameters;
  }, {});
};

Search.prototype.setSearchInput = function(value = "") {
  this.elements.$searchInput.value = value;
};

Search.prototype.setThemeFilters = function(themeFilters) {
  const filters = themeFilters.split(',');
  filters.forEach(filter => {
    const themeFilterElement = document.querySelector(`#themeFilter[value=${filter}]`);
    themeFilterElement.setAttribute('checked', 'true')
  });
};

Search.prototype.clearSearchTerm = function() {
  this.elements.$searchInput.value = "";
};

Search.prototype.filterTable = function() {
  const queryParameterValues = this.queryParameters.term.split(" ");
  
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
