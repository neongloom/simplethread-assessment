'use strict' 
import './style.css'
const sets = []; // holds data from json files
const sequences = []; // holds timeline information generated from data files 

run();

async function run() {
  await getAllData();
  const render = renderData();

  sets.forEach( (set, index) => {
    const days = render.mapDays(set);
    sequences.push(days);
    render.generateTable(set);
  });

  // set up 'run scenario' button events
  const runButtons = [...document.querySelectorAll('.calculate-button')];
  runButtons.forEach((button, index) => {
    button.onclick = () => {
      render.visualizeDays(index);
      button.remove();
    }
  })
}

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
  sets.push(await GetData('/data/set1.json'));
  sets.push(await GetData('/data/set2.json'));
  sets.push(await GetData('/data/set3.json'));
  sets.push(await GetData('/data/set4.json'));
}

const renderData = function() {
  let datasets = [];
  let daysets = [];

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
      const day = days.get(currentDayString);
      day ? days.set(currentDayString, {...day, projects: [...day?.projects, {cityCost, number }] }) : null;
      currentDay = new Date(currentDay.getTime() + (1000 * 3600 * 24));
    } while ( currentDay <= endDate)
  }

  // draws the timeline
  const visualizeDays = function(datasetIndex) {
    const days = daysets[datasetIndex];
    const projects = datasets[datasetIndex];
    const parentContainer = document.querySelector(`[data-set="${datasetIndex}"]`);
    const timelineContainer = document.createElement('div');
    timelineContainer.classList.add('timeline-container');
    timelineContainer.innerHTML = `<h3 class="heading">Projects Timeline</h3>`;

    const timeline = document.createElement('div');
    timeline.classList.add('timeline');

    //  display all days in set of projects
    const timelineheaderTemplate = document.querySelector('.timeline-header-template');
    const timelineheader = timelineheaderTemplate.content.firstElementChild.cloneNode(true);

    let timelineheaderHTML = '<div></div>';
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

    // display total reimbursement
    const sum = calculateTotalReimbursement(days);
    const sumContainer = document.createElement('div');
    sumContainer.classList.add('total-reimbursement')
    sumContainer.innerHTML = `Total Reimbursement: <span>$${sum}</span>`;
    parentContainer.appendChild(sumContainer);

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

      return `${html}<div data-status="${dayStatus}" data-rate="${rate[0] ?? ''}" data-cost="${reimbursement}"><span>${reimbursement}</span><span></span></div>`

    }, '<div>daily cost</div>')
    timelinecalculation.innerHTML = timelinecalculationHTML;
    timeline.appendChild(timelinecalculation);
    timelineContainer.appendChild(timeline);
    parentContainer.appendChild(timelineContainer);
  }

  /**
  a day is as a travel day when
    - it's at the start or end of a map
    - adjacent values are empty arrays (start or beginning or projects) AND there is only one project on the current day
  */
  const calculateTotalReimbursement = function(days) {
    let dayrates = calculateDayRates(days);
    console.log(dayrates);
    const sum = dayrates.reduce( (sum, day) => sum + calculateDailyReimbursement(day.isTravelDay, day.rate), 0)
    return sum;
  }

  /* return array with rate information for each day in a set useful for calculating the reimbursement*/
  const calculateDayRates = function(days) {
    const dayrates = [];
    days.forEach((day, index, days) => {
      const prev = days.get(day.prev);
      const next = days.get(day.next);
      const projects = day.projects;
      const currentDayProjects = projects.map( project => project.number );
      const prevProjects = prev ? prev.projects : [];
      const nextProjects = next ? next.projects : [];
      const adjacentDayProjects = [...prevProjects.map (p => p.number), ...nextProjects.map( p => p.number)];
      const isAdjacentToAnotherProject = projects.length ? adjacentDayProjects.some( p => !currentDayProjects.includes(p)) : false;

      let isTravelDay = (!prev || !next || (!prev?.projects.length || !next?.projects.length)) && projects.length === 1 &&  !isAdjacentToAnotherProject; 
      
      const rate = projects.reduce( (rate, project) => {
        return rate === "high" ? rate : project.cityCost
      }, "");

      dayrates.push( {isTravelDay, rate});
    })
    return dayrates;
  }

  /* calculates daily cost from rate information */
  const calculateDailyReimbursement = function(isTravelDay, rate) {
    if (!rate) return 0;
    if (isTravelDay) {
      return rate === "low" ? 45 : 55;
    } else {
      return rate === "low" ? 75 : 85;
    }
  }

  function getSequenceStartDate(set) {
    const sequenceStart = set.reduce( (prev, currentProject) =>  prev < currentProject.startDate ? prev : currentProject.startDate, new Date() )
    return sequenceStart;
  }

  function getSequenceEndDate(set) {
    const sequenceEnd = set.reduce( (prev, currentProject) =>  prev > currentProject.endDate ? prev : currentProject.endDate, 0)
    return sequenceEnd;
  }

  return {
    generateTable,
    visualizeDays,
    mapDays,
    calculateTotalReimbursement
  }
};