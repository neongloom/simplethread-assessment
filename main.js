'use strict' 
import set1 from './data/set1.json';
import set2 from './data/set2.json';
import set3 from './data/set3.json';
import set4 from './data/set4.json';
import './style.css'

set1.forEach( project => enumerateProjectDays(project));
set2.forEach( project => enumerateProjectDays(project));
set3.forEach( project => enumerateProjectDays(project));
set4.forEach( project => enumerateProjectDays(project));

const generateTable = (function(set) {
  let tableCount = 0;

  return function(set) {
    if (!set) return;

    tableCount++;
    const main = document.querySelector('#main');
    const sectionTemplate = document.querySelector('.dataset-template');
    const rowTemplate= document.querySelector('.datarow-template');

    const section = sectionTemplate.content.firstElementChild.cloneNode(true);
    section.querySelector('.dataset__heading').textContent = `Project set #${tableCount}`;
    const tableBody = section.querySelector('tbody');
    main.appendChild(section);

    set.forEach( project => {
      const row = rowTemplate.content.firstElementChild.cloneNode(true);
      row.querySelector('.datarow__city').textContent = project.cityCost;
      row.querySelector('.datarow__startdate').textContent = project.startDate;
      row.querySelector('.datarow__enddate').textContent = project.endDate;
      tableBody.appendChild(row);
    })
  };
})();

generateTable(set1);
generateTable(set2);
generateTable(set3);
generateTable(set4);

function enumerateProjectDays({startDate, endDate} = project) {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const dateDifference = end - start;
  const dateDifferenceinDays = dateDifference / (1000 * 3600 * 24);
  console.log(dateDifferenceinDays);
}