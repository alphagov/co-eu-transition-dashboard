
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
  const params = this.getSearchArguments();
  this.queryParameters ={
    terms : params.term.split(" "),
    themeFilters: (params.themeFilter) ? params.themeFilter.split(",") : [],
  }
  this.setSearchInput(this.queryParameters.terms);
  this.setThemeFilters(this.queryParameters.themeFilters);
  this.hideShowClearButton();
  this.filterTable(this.queryParameters.terms, this.queryParameters.themeFilters);
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

  const params = queryParameterNames.reduce((queryParameters, name) => {
    const queryParameterValue = helper.getUrlQueryParameter(name);
    if(queryParameterValue) {
      // FORM with get method replaces spaces with +
      queryParameters[name] = decodeURIComponent(queryParameterValue).replace(/[+]/g, ' ');
    }
    return queryParameters;
  }, {});
  return params;
};

Search.prototype.setSearchInput = function(terms) {
  this.elements.$searchInput.value = terms.join(" ");
};

Search.prototype.setThemeFilters = function(themeFilters) {
  if(themeFilters.length>0) {
    themeFilters.forEach(filter => {
      const themeFilterElement = document.querySelector(`#themeFilter[value=${filter}]`);
      themeFilterElement.setAttribute('checked', 'true')
    });
  }
};

Search.prototype.clearSearchTerm = function() {
  this.elements.$searchInput.value = "";
};

Search.prototype.filterTable = function(terms, themeFilters) {
  
  this.elements.$tableRows.forEach($row => {
    let rowText = $row.innerText || $row.textContent;
    rowText = rowText.toLowerCase();

    let matchesQueryParmeters = terms
      .every(queryParameterValue => rowText.includes(queryParameterValue.toLowerCase()));
    if (themeFilters.length > 0) {
      matchesQueryParmeters = matchesQueryParmeters && themeFilters.includes($row.getAttribute('data-theme'));
    } 
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
    this.queryParameters.terms = "";
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
      this.queryParameters.terms = this.elements.$searchInput.value;
      this.filterTable();
    }
  });
};

export default Search;
