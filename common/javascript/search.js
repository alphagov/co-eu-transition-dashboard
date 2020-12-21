
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
    tagFilters: (params.tagFilter) ? params.tagFilter.split(",") : [],
  }
  this.setSearchInput(this.queryParameters.terms);
  this.setClearFiltersUrl(this.queryParameters.terms)
  this.setThemeFilters(this.queryParameters.themeFilters);
  this.setColorFilters(this.queryParameters.colorFilters);
  this.setTagFilters(this.queryParameters.tagFilters);
  this.hideShowClearButton();
  this.filterTable(this.queryParameters.terms, this.queryParameters.themeFilters, this.queryParameters.colorFilters, this.queryParameters.tagFilters);
  this.updateResultCount();
  this.bindEvents();
  this.updateSearchList();
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
  },
  getStatus: status => {
    switch(status) {
    case 'red':
      status = 'High risk';
      break;
    case 'amber':
      status = 'Medium risk';
      break;    
    case 'yellow':
      status = 'Low risk';
      break;
    case 'green':
      status = 'Minimal/no risk';
      break;    
    case 'grey':
      status = 'Unassigned risk';
      break;    
    default:
      status = 'No risk status found'
    }
    return status;
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
  const queryParameterNames = ['term', 'themeFilter', 'colorFilter', 'tagFilter'];

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
      const themeFilterElement = document.querySelector('#' + CSS.escape(`themeFilter-${filter}`));
      themeFilterElement.setAttribute('checked', 'true');
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

Search.prototype.setTagFilters = function(tagFilters) {
  if(tagFilters.length>0) {
    tagFilters.forEach(filter => {
      const themeFilterElement = document.querySelector(`input[value="${filter}"]`);
      themeFilterElement.setAttribute('checked', 'true')
    });
  }
};

Search.prototype.filterTable = function(terms, themeFilters=[], colorFilters=[], tagFilters=[]) {
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

    if (tagFilters.length > 0) {
      const rowTags = $row.getAttribute('data-tags').split(',');
      tagFilters.forEach(tagFilter => {
        matchesQueryParmeters = matchesQueryParmeters && rowTags.includes(tagFilter);
      });
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
      this.filterTable(this.queryParameters.terms, this.queryParameters.themeFilters, this.queryParameters.colorFilters, this.queryParameters.tagFilters);
      this.updateResultCount();
    }
  });

  this.elements.$searchInput.addEventListener("keyup", () => {
    this.hideShowClearButton();
    if (liveSearchEnabled) {
      this.queryParameters.terms = this.elements.$searchInput.value;
      this.filterTable(this.queryParameters.terms, this.queryParameters.themeFilters, this.queryParameters.colorFilters, this.queryParameters.tagFilters);
      this.updateResultCount();
    }
  });
};

Search.prototype.updateSearchList = function() {
  const $searchList = document.querySelector('.search-list');

  const $url = `${window.location.href.split('?')[0]}`
  const $searchParams = window.location.search;
  const $params = $searchParams.split('&');
  
  const $filterTitleList = [];

  $params.forEach(function(item, index) {

    let $filterTitle = item.substring(0, item.indexOf('=')).replace('Filter', '').replace('?', '');
    let $filterTerm = item.substring(item.indexOf('=') + 1).replace('+%26+', ' & ');

    if ($filterTitle.includes('term') || (!$filterTerm)) return false;

    if ($filterTitle == 'color') {
      $filterTitle = 'Status';
      $filterTerm = helper.getStatus($filterTerm);
    }

    let $tempParams = Array.from($params);
    $tempParams.splice(index, 1);

    const $label = document.createElement('p');
    const $button = document.createElement('a');

    $label.className = 'govuk-body govuk-!-font-weight-bold';
    $label.innerHTML = $filterTitle;
    $button.className = 'govuk-button govuk-button--secondary delete-filter-link';
    $button.innerHTML = `<img src='/assets/images/cross.png' class='cross' alt='delete-filter'/>${$filterTerm}`
    $button.href = `${$url}${$tempParams.join('&')}`;

    $searchList.classList.remove('hidden');

    if (!$filterTitleList.includes($filterTitle)) {
      $searchList.appendChild($label);
    }

    $filterTitleList.push($filterTitle);
    $searchList.appendChild($button);
  })
}

export default Search;
