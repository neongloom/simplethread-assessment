import set1 from './data/set1.json';
import set2 from './data/set2.json';
import set3 from './data/set3.json';
import set4 from './data/set4.json';
import './style.css'

function enumerateProjectDays({startDate, endDate} = project) {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const dateDifference = end - start;
  const dateDifferenceinDays = dateDifference / (1000 * 3600 * 24);
  console.log(dateDifferenceinDays);

}

set1.forEach( project => enumerateProjectDays(project));
set2.forEach( project => enumerateProjectDays(project));