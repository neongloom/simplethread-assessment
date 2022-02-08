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
  const render = renderData();
  sets.forEach( (set, index) => {
    // setInfo.push( {
    //   sequenceStart: getSequenceStartDate(set),
    //   sequenceEnd: getSequenceEndDate(set)
    // })
    const days = render.mapDays(set);
    sequences.push(days);
    render.generateTable(set);
    render.visualizeDays(index);

  });
  sequences.forEach( days => {
    let totalReimbursement = render.calculateTotalReimbursement(days);
    console.log(totalReimbursement);
  })

  console.log(sequences);
}

const renderData = function() {
  let datasets = [];
  let daysets = [];
  console.log('render data');

  const generateTable = function(set) {
    if (!set) return;
    datasets.push(set);
    const tableCount = datasets.length;

    const main = document.querySelector('#main');
    const sectionTemplate = document.querySelector('.dataset-template');
    const rowTemplate= document.querySelector('.datarow-template');

    const section = sectionTemplate.content.firstElementChild.cloneNode(true);
    section.querySelector('.dataset__heading').textContent = `Project set #${tableCount}`;
    section.setAttribute('data-set', `${tableCount-1}`);
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

  const mapDays = function(set) {
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
    set.forEach( (project, i) => {
      mapProjectDays(project, days, i);
    })
    console.log(days);
    daysets.push(days);
    return days;
  }

  const mapProjectDays = function({startDate, endDate, cityCost} = project, days, number) {
    let currentDay = startDate;
    do {
      const currentDayString = currentDay.toLocaleDateString();
      // console.log(days.get(currentDayString));
      const day = days.get(currentDayString);
      day ? days.set(currentDayString, {...day, projects: [...day?.projects, {cityCost, number }] }) : null;
      currentDay = new Date(currentDay.getTime() + (1000 * 3600 * 24));
    } while ( currentDay <= endDate)
  }

  const visualizeDays = function(datasetIndex) {
    const days = daysets[datasetIndex];
    const projects = datasets[datasetIndex];
    const parentContainer = document.querySelector(`[data-set="${datasetIndex}"]`);
    const timeline = document.createElement('div');
    timeline.classList.add('timeline');

    //  display all days in set of projects
    const timelineheaderTemplate = document.querySelector('.timeline-header-template');
    const timelineheader = timelineheaderTemplate.content.firstElementChild.cloneNode(true);

    let timelineheaderHTML = '<div></div>';
    days.forEach( (day, index, days) => console.log(day) )
    days.forEach( (day, index, days) => timelineheaderHTML += `<div>${index.replace(/([/][\d]+$)/, '')}</div>` )
    timelineheader.innerHTML = timelineheaderHTML;
    timeline.appendChild(timelineheader);

    // display project days
    projects.forEach((project,projectIndex) => {
      const timelineprojectTemplate = document.querySelector('.timeline-project-template');
      const timelineproject = timelineprojectTemplate.content.firstElementChild.cloneNode(true);
      timelineproject.setAttribute('data-cost', project.cityCost);
      let timelineprojectHTML = `<div>${projectIndex}</div>`;
      days.forEach((day,i) => {
        const projectIsActive = day.projects.some( project => projectIndex === project.number);
        const isActive = projectIsActive ? 'class="isActive"' : '';
        timelineprojectHTML = `${timelineprojectHTML}<div ${isActive}></div>` 
      })
      timelineproject.innerHTML = timelineprojectHTML;
      timeline.appendChild(timelineproject);
    })

    // display calculation
    const timelinecalculationTemplate = document.querySelector('.timeline-calculation-template');
    const timelinecalculation = timelinecalculationTemplate.content.firstElementChild.cloneNode(true);
    let dayrates = calculateDayRates(days);
    let timelinecalculationHTML = dayrates.reduce( (html, day) => {
      const isTravelDay = day.isTravelDay;
      const rate = day.rate;
      const reimbursement = calculateDailyReimbursement(isTravelDay, rate);
      let dayStatus = isTravelDay ? "travel" : "full"; 
      dayStatus = reimbursement === 0 ? "free" : dayStatus;

      return `${html}<div data-status="${dayStatus}" data-rate="${rate[0] ?? ''}" data-cost="${reimbursement}">${rate[0] ?? ""}</div>`

    }, '<button type="button">toggle amounts</button>')
    timelinecalculation.innerHTML = timelinecalculationHTML;
    timeline.appendChild(timelinecalculation);
    parentContainer.appendChild(timeline);
  }

  /**
  a day is as a travel day when
    - it's at the start or end of a map
    - key value is an empty array (between projects)
    - adjacent values are empty arrays (start or beginning or projects) AND there is only one project on the current day
  */
  const calculateTotalReimbursement = function(days) {
    let sum = 0;
    let dayrates = calculateDayRates(days);
    console.log(dayrates);
    sum = dayrates.reduce( (sum, day) => sum + calculateDailyReimbursement(day.isTravelDay, day.rate), 0)
    return sum;
  }

  const calculateDayRates = function(days) {
    const dayrates = [];
    days.forEach((day, index, days) => {
      console.log(index);
      const prev = days.get(day.prev);
      const next = days.get(day.next);
      const projects = day.projects;
      const isProjectDay = projects.length ? 1 : 0;

      // check sequences ends
      let isTravelDay = (!prev || !next) && projects.length === 1; 

      // check if it's between projects
      // isTravelDay = isTravelDay || !day.projects.length; 

      // check if it's at the beginning or end of a project and isn't overlapping with or next to another project
      isTravelDay = isTravelDay || ((!prev?.projects.length || !next?.projects.length) && day.projects.length === 1)
      
      // rate defaults to low cost, use higher cost rate if projects overlap
      const rate = projects.reduce( (rate, project) => {
        return rate === "high" ? rate : project.cityCost
      }, "");

      dayrates.push( {isTravelDay, rate});
      // sum += calculateDailyReimbursement(isTravelDay, rate) * isProjectDay;
    })
    return dayrates;
  }

  const calculateDailyReimbursement = function(isTravelDay, rate) {
    if (!rate) return 0;
    if (isTravelDay) {
      return rate === "low" ? 45 : 55;
    } else {
      return rate === "low" ? 75 : 85;
    }
  }

  return {
    generateTable,
    visualizeDays,
    mapDays,
    calculateTotalReimbursement
  }
};

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


run();