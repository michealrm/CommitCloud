import React, { useState } from 'react';
import './App.css';
import Async from 'react-async';
import jsonData from './jsonData2.json';
import ReactWordcloud from 'react-wordcloud';
const {BigQuery} = require('@google-cloud/bigquery');
const bq = new BigQuery();
var nlp = require('compromise')

function App() {
  const [msg, setMsg] = useState('Loading...');
  const [started, setStarted] = useState(null);
  const [data, setData] = useState([]);

async function query() {

    const query = `SELECT * FROM (
    TABLE_DATE_RANGE([githubarchive:day.], 
    TIMESTAMP('2015-01-01'), 
    TIMESTAMP('2015-05-01')
    )) 
    WHERE type = 'PushEvent'
    LIMIT = 5`;
    
    const options = {
        query: query,
        location: 'US',
        timeoutMS: 10000
    };

    const [job] = await bq.createQueryJob(options);
    setMsg(`Job ${job.id} started. Waiting to process results.`);
    console.log(msg);

    const [rows] = await job.getQueryResults();
    return rows;
}

function range(start, stop, step) {
    if (typeof stop == 'undefined') {
        stop = start;
        start = 0;
    }

    if (typeof step == 'undefined') {
        step = 1;
    }

    if ((step > 0 && start >= stop) || (step < 0 && start <= stop)) {
        return [];
    }

    var result = [];
    for (var i = start; step > 0 ? i < stop : i > stop; i += step) {
        result.push(i);
    }

    return result;
};

function get_commits(limit = 100) {
    var allCommits = [];
    var wordsMap = {};
    var commits = []
    jsonData.forEach(line => {
        if(line.type === "PushEvent") {
            commits.push(...line.payload.commits.map(a => a.message));
        }
    });
    var nouns = nlp(commits).sentences().nouns().out('array');
    nouns.forEach(key => {
        if(wordsMap.hasOwnProperty(key)) {
            wordsMap[key]++;
        } else {
            wordsMap[key] = 1;
        }
    });


    Object.keys(wordsMap).forEach(key => {
        allCommits.push({text:key, value:wordsMap[key]});
    });
    allCommits.sort((a, b) => (a.value < b.value ? 1 : -1));
    if(limit > 0)
        allCommits = allCommits.slice(0, limit);
    return allCommits;
}

if(!started) {
    setStarted(true);
    var d = get_commits();
    setData(d);
}
if(data.length == 0) {
    return ("Loading...");
} else {
  return (
      <div>
        <h1>CommitCloud</h1>
        <h3>Word clouds for commits across GitHub via <a href="https://gharchive.org/">GH Archive</a></h3>
      <div style={{width:'800px',height:'800px'}}>
        <ReactWordcloud
            options={{
                rotations: 3,
                rotationAngles: [0, 90],
                fontSizes: [15,100,200,300,400],
            }}
            words={data}
      />
      </div>
      </div>
    );
}
}

export default App;
