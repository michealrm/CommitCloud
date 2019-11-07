import React, { useState } from 'react';
import './App.css';
import Async from 'react-async';
const {BigQuery} = require('@google-cloud/bigquery');
const bq = new BigQuery();

function App() {
  const [msg, setMsg] = useState('Loading...');

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
    };

    const [job] = await bq.createQueryJob(options);
    setMsg(`Job ${job.id} started. Waiting to process results.`);
    console.log(msg);

    const [rows] = await job.getQueryResults();
    return rows;
}

  return (
      <div>
        <h1>CommitCloud</h1>
        <h3>Word clouds for commits across GitHub via <a href="https://gharchive.org/">GH Archive</a></h3>
        <Async promiseFn={query}>
            <Async.Pending>{ msg }</Async.Pending>
            // TODO: Need to add rejected check here
            <Async.Fulfilled>
                <h6>Data</h6>
                {data => (
                    <p>{data}</p>
                )}
            </Async.Fulfilled>
        </Async>
      </div>
    );
}

export default App;
