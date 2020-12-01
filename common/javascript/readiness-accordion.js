
/*
  Accordion

  This allows a collection of sections to be collapsed by default,
  showing only their headers. Sections can be exanded or collapsed
  individually by clicking their headers.

  The state of each section is saved to the DOM via the `aria-expanded`
  attribute, which also provides accessibility.

*/

import { nodeListForEach } from 'govuk-frontend/govuk/common'
import 'govuk-frontend/govuk/vendor/polyfills/Function/prototype/bind'
import 'govuk-frontend/govuk/vendor/polyfills/Element/prototype/classList'

function ReadinessAccordion ($module) {
  this.$module = $module
  this.moduleId = $module.getAttribute('id')
  this.$sections = $module.querySelectorAll(`.govuk-accordion__section-${this.moduleId }`)
  this.$openAllButton = ''
  this.browserSupportsSessionStorage = helper.checkForSessionStorage()

  this.controlsClass = 'govuk-accordion__controls'
  this.openAllClass = 'govuk-accordion__open-all'
  this.iconClass = 'govuk-accordion__icon'

  this.sectionHeaderClass = 'govuk-accordion__section-header'
  this.sectionHeaderFocusedClass = 'govuk-accordion__section-header--focused'
  this.sectionHeadingClass = 'govuk-accordion__section-heading'
  this.sectionSummaryClass = 'govuk-accordion__section-summary'
  this.sectionButtonClass = 'govuk-accordion__section-button'
  this.sectionExpandedClass = 'govuk-accordion__section--expanded'
  this.sectionNoChildrenClass = 'no-children'
  this.tableauMessageClass = 'tableu-message'
  this.tableauiFrameClass = 'theme-tableu'
  this.projectInformationClass = 'project-information'
  this.hiddenClass = 'hidden';
}

// Initialize component
ReadinessAccordion.prototype.init = function () {
  // Check for module
  if (!this.$module) {
    return
  }

  this.initSectionHeaders()
}

// Initialise section headers
ReadinessAccordion.prototype.initSectionHeaders = function () {
  // Loop through section headers
  nodeListForEach(this.$sections, function (section) {
    // Set header attributes
    const header = section.querySelector('.' + this.sectionHeaderClass)

    this.setExpanded(this.isExpanded(section), section)

    // Handle events
    header.addEventListener('click', this.onSectionToggle.bind(this, section))

    this.setInitialState(section)
  }.bind(this))
}

// When section toggled, set and store state
ReadinessAccordion.prototype.onSectionToggle = function (section) {
  const expanded = this.isExpanded(section);
  this.clearActiveAccordionsWithoutChildren();
  this.setExpanded(!expanded, section)
  this.storeState(section)
  this.hideShowProjectDetails(!expanded, section);
}

ReadinessAccordion.prototype.clearActiveAccordionsWithoutChildren = function () {
  const activeAccordionsWithNoChildren = document.querySelector(`.${this.sectionExpandedClass}.${this.sectionNoChildrenClass}`);
  if(activeAccordionsWithNoChildren) {
    activeAccordionsWithNoChildren.classList.remove(this.sectionExpandedClass);
  }
}

// Set section attributes when opened/closed
ReadinessAccordion.prototype.hideShowProjectDetails = function (expanded, section) {
  const button = section.querySelector('.' + this.sectionButtonClass);
  const projectDetailsId = button.getAttribute('data-project-details-id');

  const tableauMessageOrIframe = document.querySelector(`.${this.tableauMessageClass}, .${this.tableauiFrameClass}`);
  const projectDetailsView = document.getElementById(projectDetailsId);
  const projectInformationOpen = document.querySelector(`.${this.projectInformationClass}:not(.${this.hiddenClass})`);

  if(projectDetailsView){
    if(expanded) {
      projectDetailsView.classList.remove(this.hiddenClass);
      tableauMessageOrIframe.classList.add(this.hiddenClass);

      if(projectInformationOpen) {
        projectInformationOpen.classList.add(this.hiddenClass);
      }
    } else {
      if(projectInformationOpen) {
        projectInformationOpen.classList.add(this.hiddenClass);
      }
      tableauMessageOrIframe.classList.remove(this.hiddenClass);
    }
  }
}

// Set section attributes when opened/closed
ReadinessAccordion.prototype.setExpanded = function (expanded, section) {
  const button = section.querySelector('.' + this.sectionButtonClass)
  button.setAttribute('aria-expanded', expanded)

  if (expanded) {
    section.classList.add(this.sectionExpandedClass)
  } else {
    section.classList.remove(this.sectionExpandedClass)
  }
}

// Get state of section
ReadinessAccordion.prototype.isExpanded = function (section) {
  return section.classList.contains(this.sectionExpandedClass)
}

// Check for `window.sessionStorage`, and that it actually works.
const helper = {
  checkForSessionStorage: function () {
    const testString = 'this is the test string'
    let result
    try {
      window.sessionStorage.setItem(testString, testString)
      result = window.sessionStorage.getItem(testString) === testString.toString()
      window.sessionStorage.removeItem(testString)
      return result
    } catch (exception) {
      if (typeof console === 'undefined') {
        new Error('Notice: sessionStorage not available.')
      }
    }
  }
}

// Set the state of the accordions in sessionStorage
ReadinessAccordion.prototype.storeState = function (section) {
  // do not save open state if accordion has no children
  const hasChildren = !section.classList.contains(this.sectionNoChildrenClass);
  if (this.browserSupportsSessionStorage && hasChildren) {
    const button = section.querySelector('.' + this.sectionButtonClass)

    if (button) {
      const contentId = button.getAttribute('aria-controls')
      const contentState = button.getAttribute('aria-expanded')

      if (typeof contentId === 'undefined') {
        new Error('No aria controls present in accordion section heading.')
      }

      if (typeof contentState === 'undefined') {
        new Error('No aria expanded present in accordion section heading.')
      }

      // Only set the state when both `contentId` and `contentState` are taken from the DOM.
      if (contentId && contentState) {
        window.sessionStorage.setItem(contentId, contentState)
      }
    }
  }
}

// Read the state of the accordions from sessionStorage
ReadinessAccordion.prototype.setInitialState = function (section) {
  if (this.browserSupportsSessionStorage) {
    const button = section.querySelector('.' + this.sectionButtonClass)

    if (button) {
      const contentId = button.getAttribute('aria-controls')

      let contentState = contentId ? window.sessionStorage.getItem(contentId) : null

      if (contentState !== null) {
        this.setExpanded(contentState === 'true', section)
      }
    }
  }
}



export default ReadinessAccordion
