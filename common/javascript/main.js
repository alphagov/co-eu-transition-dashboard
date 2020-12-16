import govukFrontend from 'govuk-frontend/govuk/all';

import missedMilestonesChart from './missed-milestones';
import milestoneTimeline from './milestone-timeline';
import removeAccordionCross from './remove-accordion-cross';
import disableButton from './disable-button';
import groupDisplay from './group-display';
import fieldOrder from './field-order';
import ReadinessAccordion from './readiness-accordion';
import ClearOrRestoreScroll from './readiness-scroll';
import Search from './search';
import sortTable from './sort-table';

window.TRANSITIONDELIVERYDASHBOARD = {
  missedMilestonesChart,
  milestoneTimeline,
  removeAccordionCross,
  disableButton,
  groupDisplay,
  fieldOrder,
  sortTable
};

document.addEventListener('DOMContentLoaded', function() {
  govukFrontend.initAll();

  const $table = document.getElementById('search-table');
  const $search = document.getElementById('search');
  const $searchFilters = document.getElementById('search-filters');
  if ($table && $search) {
    new Search({
      $search,
      $table,
      $searchFilters
    }).init();
  }

  var $readinessAccordions = document.querySelectorAll('[data-module="readiness-accordion"]')

  function searchSummaryList() {
    const $searchList = document.getElementById('search-list');

    const $url = `${window.location.href.split('?')[0]}?`
    const $searchParams = window.location.search;
    const $values = $searchParams.split('&');
    const $filterTitleList = [];

    $values.forEach(function(item, index) {

      const $filterTitle = item.substring(0, item.indexOf('=')).replace('Filter', '').replace('?', '');
      const $filterTerm = item.substring(item.indexOf('=') + 1);

      if (!$filterTerm) return false;

      let $tempValues = Array.from($values);
      $tempValues.splice(index, 1);

      const $title = document.createElement('p');
      const $button = document.createElement('a');

      $title.className = 'govuk-body govuk-!-font-weight-bold';
      $title.innerHTML = $filterTitle;
      $button.className = 'govuk-button govuk-button--secondary delete-filter-link';
      $button.innerHTML = `<img src='/assets/images/cross.png' class='cross' alt='delete-filter'/>${$filterTerm}`
      $button.href = `${$url}${$tempValues.join('&')}`;

      $searchList.style.display = 'block';

      if (!$filterTitleList.includes($filterTitle)) {
        $searchList.appendChild($title);
      }

      $filterTitleList.push($filterTitle);
      $searchList.appendChild($button);
    })
    return $values;
  }

  searchSummaryList()

  if ($readinessAccordions) {
    $readinessAccordions.forEach($accordion => new ReadinessAccordion($accordion).init())
  }

  if (document.getElementById('readiness-theme-page')) {
    ClearOrRestoreScroll(document.getElementById('readiness-theme-page'))
  }

  function countDownTime() {
    const second = 1000,
      minute = second * 60,
      hour = minute * 60,
      day = hour * 24;

    const finalTransitionDate = new Date('Jan 01, 2021 23:59:59').getTime();
    const distance = finalTransitionDate - new Date().getTime();

    let daysToDate = Math.floor(distance / day);

    if (distance < 0) {
      daysToDate = 0;
    }

    return daysToDate;
  }

  const coundDownElement = document.getElementById('countdown');
  if(coundDownElement) {
    coundDownElement.innerHTML = countDownTime();
  }
});

// The expanded state of individual instances of the accordion component persists across page loads using sessionStorage.
// These will be removed from the session storage so the accordions will collapse rather than stay open.
// We want to keep session storage on the readiness theme and search transition pages to prevent accordions closing on a page refresh
const currentPage = document.getElementsByClassName('govuk-header__navigation-item--active');
const isTransitionReadinessPage = currentPage && currentPage.length > 0 && currentPage[0].innerText === 'Transition readiness';

const pageHeading = document.getElementsByTagName('h1');
const isSearchMeasuresPage = pageHeading.length > 0 && pageHeading[0].innerText === 'Search measures';

const projectDetailsPage = !!document.getElementById('project-details');

if(!isTransitionReadinessPage && !isSearchMeasuresPage && !projectDetailsPage){
  sessionStorage.clear();
}
