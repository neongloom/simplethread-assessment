'use strict' 
import './style.css'
const sets = [];
const sequences = [];

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
    sequences.push(mapSequence(set));
    // set.forEach( proj => {
    //   enumerateProjectDays(proj)
    //   // mapProjectDays(proj);
    // })
    // console.log(set);
    // setInfo.push( {
    //   sequenceStart: getSequenceStartDate(set),
    //   sequenceEnd: getSequenceEndDate(set)
    // })

  });
  sequences.forEach( days => {
    let totalReimbursement = calculateTotalReimbursement(days);
    console.log(totalReimbursement);
  })

  console.log(sequences);
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

function getSequenceStartDate(set) {
  const sequenceStart = set.reduce( (prev, currentProject) =>  prev < currentProject.startDate ? prev : currentProject.startDate, new Date() )
  // console.log(sequenceStart.toLocaleDateString());
  return sequenceStart;
}

function getSequenceEndDate(set) {
  const sequenceEnd = set.reduce( (prev, currentProject) =>  prev > currentProject.endDate ? prev : currentProject.endDate, 0)
  // console.log(sequenceEnd.toLocaleDateString());
  return sequenceEnd;
}

function mapSequence(set) {
  const days  = new Map();
  const start = getSequenceStartDate(set)
  const end = getSequenceEndDate(set)
  let currentDay = start;

  // create map of all days in a sequence
  // projects stores (cost of) all projects occuring on that day
  do {
    const nextDay = new Date(currentDay.getTime() + (1000 * 3600 * 24));
    const prevDay = new Date(currentDay.getTime() - (1000 * 3600 * 24));
    const next = (nextDay <= end) ? nextDay.toLocaleDateString() : null;
    const prev = (currentDay != start) ? prevDay.toLocaleDateString() : null;
    days.set(currentDay.toLocaleDateString(), { projects:[], next, prev }); // kind of realized here an actual linked list would be better so that's something I can refactor to in the future
    currentDay = nextDay;
  } while ( currentDay <= end)
  console.log(days);
  set.forEach( project => {
    mapProjectDays(project, days);
  })
  console.log(days);
  return days;
}

function mapProjectDays({startDate, endDate, cityCost} = project, days) {
  let currentDay = startDate;
  do {
    const currentDayString = currentDay.toLocaleDateString();
    // console.log(days.get(currentDayString));
    const day = days.get(currentDayString);
    day ? days.set(currentDayString, {...day, projects: [...day?.projects, cityCost] }) : null;
    currentDay = new Date(currentDay.getTime() + (1000 * 3600 * 24));
  } while ( currentDay <= endDate)
}

/**
a day is as a travel day when
  - it's at the start or end of a map
  - key value is an empty array (between projects)
  - adjacent values are empty arrays (start or beginning or projects) AND there is only one project on the current day
 */
function calculateTotalReimbursement(days) {
  let sum = 0;
  days.forEach((day, index, days) => {
    console.log(index);
    const prev = days.get(day.prev);
    const next = days.get(day.next);
    const projects = day.projects;

    // check sequences ends
    let isTravelDay = !prev || !next; 

    // check if it's between projects
    isTravelDay = isTravelDay || day.projects.length === 0;

    // check if it's at the beginning or end of a project and isn't overlapping with or next to another project
    isTravelDay = isTravelDay || ((!prev.projects.length || !next.projects.length) && day.projects.length === 1)
    
    // rate defaults to low cost, use higher cost rate if projects overlap
    const rate = projects.reduce( (rate, cost) => {
      return rate === "low" && cost.toLowerCase() === "high" ? cost : rate
    }, "low");

    // console.log(calculateDailyReimbursement(isTravelDay, rate))
    sum += calculateDailyReimbursement(isTravelDay, rate);
  })
  return sum;
}

function calculateDailyReimbursement(isTravelDay, rate) {
  if (isTravelDay) {
    return rate === "low" ? 45 : 55;
  } else {
    return rate === "low" ? 75 : 85;
  }
}

run();