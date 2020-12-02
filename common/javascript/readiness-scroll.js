export default ($element) =>  {
  const themeId = $element.getAttribute('data-theme-id')

  try {
    let previousThemeId = window.sessionStorage.getItem('themeId') || ''
    if (previousThemeId == themeId) {
      restoreScrollPosition()
    } else {
      sessionStorage.clear();
      window.sessionStorage.setItem('themeId', themeId)
    }
    
    window.addEventListener('scroll', () => setScrollPosition('page'))
    document.getElementById('outcome-statements').addEventListener('scroll', () => setScrollPosition('statements'))
    document.getElementById('sub-statements').addEventListener('scroll', () => setScrollPosition('subStatements'))

  } catch (exception) {
    new Error('Notice: sessionStorage not available.')
  }
}

const setScrollPosition = (scrollElement) => {
  try {
    
    let scrollValue = 0;

    if (scrollElement === 'page') {
      scrollValue = window.scrollY
    }

    if (scrollElement === 'statements') {
      const subStatementColumn = document.getElementById('outcome-statements')
      if (subStatementColumn) {
        scrollValue = subStatementColumn.scrollTop
      }
    }

    if (scrollElement === 'subStatements') {
      const subStatementColumn = document.getElementById('sub-statements')
      if (subStatementColumn) {
        scrollValue = subStatementColumn.scrollTop
      }
    }

    window.sessionStorage.setItem('scroll-position-' + scrollElement, scrollValue)
  } catch (exception) {
    new Error('Notice: sessionStorage not available.')
  }
}

const restoreScrollPosition = () => {
  
  const scrollPositionPage = window.sessionStorage.getItem('scroll-position-page') || 0
  window.scrollTo(0, parseInt(scrollPositionPage));
  
  const statementColumn = document.getElementById('outcome-statements')
  const subStatementColumn = document.getElementById('sub-statements')

  if (statementColumn) {
    const scrollPositionStatements = window.sessionStorage.getItem('scroll-position-statements') || 0
    statementColumn.scrollTop = scrollPositionStatements
  }

  if (subStatementColumn) {
    const scrollPositionSubStatements = window.sessionStorage.getItem('scroll-position-subStatements') || 0
    subStatementColumn.scrollTop = scrollPositionSubStatements
  }
}