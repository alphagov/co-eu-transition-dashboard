Cypress.Commands.add('getProjectData', (department) => {
  getProjectData(department).as('dbResultPrjData');
});

function getProjectData(department) {
  const query =
    `set @department = "${department}" COLLATE utf8mb4_0900_ai_ci;
      select hmg.*, citiz.CitizenReadiness, br.BusinessReadiness, eucfd.EUStateConfidence from
      (
      (SELECT p.uid, p.department_name, p.title, p.impact, pfe.value as 'HMGConfidence' FROM project p 
      join project_field_entry pfe on p.uid = pfe.project_uid
      join project_field pf on pfe.project_field_id = pf.id 
      where pf.name = 'hmgConfidence' ) hmg, 
      (SELECT p.uid, pfe.value as 'CitizenReadiness' FROM project p 
      join project_field_entry pfe on p.uid = pfe.project_uid
      join project_field pf on pfe.project_field_id = pf.id 
      where pf.name = 'citizenReadiness' ) citiz, 
      (SELECT p.uid, pfe.value as 'BusinessReadiness' FROM project p 
      join project_field_entry pfe on p.uid = pfe.project_uid
      join project_field pf on pfe.project_field_id = pf.id 
      where pf.name = 'businessReadiness' ) br, 
      (SELECT p.uid, pfe.value as 'EUStateConfidence' FROM project p 
      join project_field_entry pfe on p.uid = pfe.project_uid
      join project_field pf on pfe.project_field_id = pf.id 
      where pf.name = 'euStateConfidence' ) eucfd
      )
    where hmg.uid = citiz.uid and hmg.uid = br.uid and hmg.uid = eucfd.uid
    and citiz.uid = br.uid and citiz.uid = eucfd.uid and br.uid = eucfd.uid
    and( (FIND_IN_SET(hmg.department_name, @department) and @department <> 'All') or
    (hmg.department_name is not null and @department = 'All')) ; `;
  return cy.task('queryDb', query);
}