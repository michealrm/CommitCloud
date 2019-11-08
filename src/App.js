import React, { useState } from 'react';
import './App.css';
import jsonData from './jsonData2.json';
import ReactWordcloud from 'react-wordcloud';
const {BigQuery} = require('@google-cloud/bigquery');
const bq = new BigQuery();
var nlp = require('compromise')
const useStateWithLocalStorage = localStorageKey => {
    var stored = localStorage.getItem(localStorageKey);
    var parsed = null;
    try {
        parsed = JSON.parse(stored);
    } catch(error) {}
    const [value, setValue] = React.useState(parsed);
    React.useEffect(() => {
        localStorage.setItem(localStorageKey, JSON.stringify(value));
    }, [value]);

    return [value, setValue];
};

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
    console.log(`Job ${job.id} started. Waiting to process results.`);

    const [rows] = await job.getQueryResults();
    return rows;
}

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
    console.log(nouns);
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


function App() {

  const [data, setData] = useStateWithLocalStorage('data');

    if(!data) {
        setData(get_commits())
        return ('Processing...');
    } else {
        console.log(data);
      return (
          <div className="container">
            <h1>CommitCloud</h1>
            <h3>Word clouds for commits across GitHub via <a href="https://gharchive.org/">GH Archive</a></h3>
            <br />
          <div className="center" style={{height:'500px', width:'80%'}}>
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
