Cypress.Commands.add('getProjectData', (department) => {
  getProjectData(department).as('dbResultPrjData');
});

Cypress.Commands.add('getRandomProject', (department) => {
  getRandomProject(department).as('dbResultPrjData');
});

Cypress.Commands.add('getMilestoneData', (projectName,department) => {
  getMilestoneData(projectName,department).as('dbResultMilesData');
});

Cypress.Commands.add('getMissedMilestone', (projectName,department,theme) => {
  getMissedMilestone(projectName,department,theme).as('dbResultMilesData');
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

function getRandomProject(department) {
  const query =
    `set @department = "${department}" COLLATE utf8mb4_0900_ai_ci;
      select hmg.*, citiz.CitizenReadiness, br.BusinessReadiness, eucfd.EUStateConfidence,th.DeliveryTheme, st.ProgressStatus from
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
      where pf.name = 'euStateConfidence' ) eucfd,
      (SELECT p.uid, pfe.value as 'DeliveryTheme' FROM project p 
      join project_field_entry pfe on p.uid = pfe.project_uid
      join project_field pf on pfe.project_field_id = pf.id 
      where pf.name = 'deliveryTheme' ) th,
      (SELECT p.uid, pfe.value as 'ProgressStatus' FROM project p 
      join project_field_entry pfe on p.uid = pfe.project_uid
      join project_field pf on pfe.project_field_id = pf.id 
      where pf.name = 'progressStatus' ) st
      )
    where hmg.uid = citiz.uid and hmg.uid = br.uid and hmg.uid = eucfd.uid and th.uid = eucfd.uid and th.uid = citiz.uid
    and citiz.uid = br.uid and citiz.uid = eucfd.uid and br.uid = eucfd.uid and th.uid = br.uid and th.uid = hmg.uid
    and st.uid = br.uid and st.uid = eucfd.uid and st.uid = th.uid and st.uid = hmg.uid and st.uid = citiz.uid
    and( (FIND_IN_SET(hmg.department_name, @department) and @department <> 'All') or
    (hmg.department_name is not null and @department = 'All')) 
    ORDER BY RAND()
    LIMIT 1`;
  return cy.task('queryDb', query);
}

function getMilestoneData(projUid,department) {
  const query =
    `
    set @department = "${department}" COLLATE utf8mb4_0900_ai_ci;
    set @projectuid = "${projUid}" COLLATE utf8mb4_0900_ai_ci;
      select p.title, compl.*, comm.LastComment from
      (
        (select m.project_uid, m.uid, m.description, DATE_FORMAT(m.date,'%e %b %Y') as duedate, mfe.value as 'Complete' FROM milestone m
        join milestone_field_entry mfe on mfe.milestone_uid = m.uid
        join milestone_field mf on mfe.milestone_field_id = mf.id
        where mf.display_name = 'Complete' ) compl,
        (select m.uid, mfe.value as 'LastComment' FROM milestone m
        join milestone_field_entry mfe on mfe.milestone_uid = m.uid
        join milestone_field mf on mfe.milestone_field_id = mf.id
        where mf.display_name = 'Comments' ) comm
      )
      join project p on p.uid = compl.project_uid
      where compl.uid = comm.uid
      and( (FIND_IN_SET(compl.project_uid, @projectuid) and @projectuid <> 'All') or
        (compl.project_uid is not null and @projectuid = 'All'))
      and( (FIND_IN_SET(p.department_name, @department) and @department <> 'All') or
      (p.department_name is not null and @department = 'All'))  
      order by project_uid, uid;`;
  return cy.task('queryDb', query);
}

function getMissedMilestone(projUid,department,theme) {
  const query =
    `
    set @department = "${department}" COLLATE utf8mb4_0900_ai_ci;
    set @projectuid = "${projUid}" COLLATE utf8mb4_0900_ai_ci;
    set @theme = "${theme}" COLLATE utf8mb4_0900_ai_ci;
    select compl.project_uid as 'ProjectUid', p.title as 'ProjectName', p.department_name as 'Department',pfe.value as 'Theme', compl.uid as Uid, 
    compl.description as 'MilestoneDescription', DATE_FORMAT(compl.Duedate,'%d/%m/%Y') as Duedate, dcof.DeliveryConfidence , p.impact as 'ProjectImpact' from
    (
    (select m.project_uid, m.uid, m.description, m.date as Duedate, mfe.value as 'Complete' FROM milestone m
    join milestone_field_entry mfe on mfe.milestone_uid = m.uid
    join milestone_field mf on mfe.milestone_field_id = mf.id
    where mf.display_name = 'Complete' ) compl,
    (select m.uid, mfe.value as 'DeliveryConfidence' FROM milestone m
    join milestone_field_entry mfe on mfe.milestone_uid = m.uid
    join milestone_field mf on mfe.milestone_field_id = mf.id
    where mf.display_name = 'Delivery Confidence' ) dcof
    )
    join project p on p.uid = compl.project_uid
    join project_field_entry pfe on pfe.project_uid = p.uid
	  join project_field pf on pfe.project_field_id = pf.id 
    where compl.uid = dcof.uid 
    and( (FIND_IN_SET(compl.project_uid, @projectuid) and @projectuid <> 'All') or
    (compl.project_uid is not null and @projectuid = 'All'))
    and( (FIND_IN_SET(p.department_name, @department) and @department <> 'All') or
    (p.department_name is not null and @department = 'All'))  
    and( (FIND_IN_SET(pfe.value, @theme) and @theme <> 'All') or
    (pfe.value is not null and @theme = 'All'))  
    and compl.duedate < sysdate()
    and compl.Complete = 'No'
    and p.impact in(0,1)
    and pf.display_name ='Delivery Theme'
    order by compl.Duedate desc`;
  return cy.task('queryDb', query);
}

