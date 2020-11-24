
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
    colorFilters: (params.colorFilter) ? params.colorFilter.split(",") : [],
  }
  this.setSearchInput(this.queryParameters.terms);
  this.setClearFiltersUrl(this.queryParameters.terms)
  this.setThemeFilters(this.queryParameters.themeFilters);
  this.setColorFilters(this.queryParameters.colorFilters);
  this.hideShowClearButton();
  this.filterTable(this.queryParameters.terms, this.queryParameters.themeFilters, this.queryParameters.colorFilters);
  this.updateResultCount();
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
    }
    return paramValues;
  }
};

Search.prototype.setElements = function() {
  this.elements = {
    $searchInput: this.options.$search.querySelector('.search-input'),
    $clearSearch: this.options.$search.querySelector('.clear-search-button'),
    $tableRows: this.options.$table.querySelectorAll('.searchable-row'),
    $resultCount: this.options.$table.querySelector('.result-count p.count'),
    $clearFilterBtn: this.options.$searchFilters.querySelector('.clear-filter'),
  };
};

Search.prototype.getSearchArguments = function() {
  const queryParameterNames = ['term', 'themeFilter', 'colorFilter'];

  const params = queryParameterNames.reduce((queryParameters, name) => {
    const queryParameterValue = helper.getUrlQueryParameter(name);
    if(queryParameterValue) {
      // FORM with get method replaces spaces with +
      queryParameters[name] = unescape(queryParameterValue).replace(/[+]/g, ' ');
    }
    return queryParameters;
  }, {});
  return params;
};

Search.prototype.setSearchInput = function(terms) {
  if(terms) {
    this.elements.$searchInput.value = terms.join(" ");
  } else {
    this.elements.$searchInput.value = "";
  }
};

Search.prototype.setClearFiltersUrl = function(terms) {
  if(terms) {
    this.elements.$clearFilterBtn.href += `?term=${encodeURI(terms.join("+"))}`;
  } 
};

Search.prototype.setThemeFilters = function(themeFilters) {
  if(themeFilters.length>0) {
    themeFilters.forEach(filter => {
      const themeFilterElement = document.querySelector(`#themeFilter-${filter}`);
      const themeFilterElement = document.querySelector('#' + CSS.escape(`themeFilter-${filter}`));
      themeFilterElement.setAttribute('checked', 'true')
    });
  }
};

Search.prototype.setColorFilters = function(colorFilters) {
  if(colorFilters.length>0) {
    colorFilters.forEach(filter => {
      const themeFilterElement = document.querySelector(`#colorFilter-${filter}`);
      themeFilterElement.setAttribute('checked', 'true')
    });
  }
};

Search.prototype.filterTable = function(terms, themeFilters=[], colorFilters=[]) {
  this.elements.$tableRows.forEach($row => {
    let rowText = $row.innerText || $row.textContent;
    rowText = rowText.toLowerCase();

    let matchesQueryParmeters = terms
      .every(queryParameterValue => rowText.includes(queryParameterValue.toLowerCase()));
    if (themeFilters.length > 0) {
      matchesQueryParmeters = matchesQueryParmeters && themeFilters.includes($row.getAttribute('data-theme'));
    } 

    if (colorFilters.length > 0) {
      matchesQueryParmeters = matchesQueryParmeters && colorFilters.includes($row.getAttribute('data-color'));
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

Search.prototype.updateResultCount = function() {
  let count = 0;
  this.elements.$tableRows.forEach($row => {
    if($row.classList.contains('show')) {
      count ++;
    }
  });
  this.elements.$resultCount.textContent = `${count} results`;
};

Search.prototype.bindEvents = function() {
  this.elements.$clearSearch.addEventListener("click", () => {
    this.queryParameters.terms = "";
    this.setSearchInput(this.queryParameters.terms);
    this.elements.$searchInput.focus();
    this.hideShowClearButton();

    if (liveSearchEnabled) {
      this.filterTable(this.queryParameters.terms, this.queryParameters.themeFilters, this.queryParameters.colorFilters);
      this.updateResultCount();
    }
  });

  this.elements.$searchInput.addEventListener("keyup", () => {
    this.hideShowClearButton();
    if (liveSearchEnabled) {
      this.queryParameters.terms = this.elements.$searchInput.value;
      this.filterTable(this.queryParameters.terms, this.queryParameters.themeFilters, this.queryParameters.colorFilters);
      this.updateResultCount();
    }
  });
};

export default Search;
