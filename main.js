'use strict' 
import './style.css'
const sets = [];

async function GetData(url) {
  try {
    const set =  await fetch(url);
    const data = await set.json();
    data.forEach( proj => {
      proj.startDate = new Date(proj.startDate);
      proj.endDate = new Date(proj.endDate);
    })
    return data;
  } catch(e) {
    console.log(`error: ${e}`);
  }
}

async function getAllData() {
  sets.push(await GetData('./data/set1.json'));
  sets.push(await GetData('./data/set2.json'));
  sets.push(await GetData('./data/set3.json'));
  sets.push(await GetData('./data/set4.json'));
}

async function run() {
  await getAllData();
  sets.forEach( set => {
    generateTable(set)
    set.forEach( proj => enumerateProjectDays(proj))
  });
}

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
      row.querySelector('.datarow__startdate').textContent = project.startDate.toLocaleDateString();
      row.querySelector('.datarow__enddate').textContent = project.endDate.toLocaleDateString();
      tableBody.appendChild(row);
    })
  };
})();


function enumerateProjectDays({startDate, endDate} = project) {
  const dateDifference = endDate - startDate;
  const dateDifferenceinDays = dateDifference / (1000 * 3600 * 24);
  console.log(dateDifferenceinDays);
}

function getSequenceStartEndDates({startDate, endDate} = project) {

}

function getDayRate(project) {
  console.log(project.startDate);
  let currentDay = start;
  // do (
  //   currentDay += 

  // )
}

run();