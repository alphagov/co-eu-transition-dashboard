import govukFrontend from 'govuk-frontend/govuk/all';

import missedMilestonesChart from './missed-milestones';
import upcomingMilestoneChart from './upcoming-milestones';

window.TRANSITIONDELIVERYDASHBOARD = {
  missedMilestonesChart,
  upcomingMilestoneChart
};

document.addEventListener('DOMContentLoaded', function() {
  govukFrontend.initAll();
});

// The expanded state of individual instances of the accordion component persists across page loads using sessionStorage.
// These will be removed from the session storage so the accordions will collapse rather than stay open.
sessionStorage.clear();


