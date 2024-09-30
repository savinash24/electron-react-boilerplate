import React, { useState, useEffect, useRef } from 'react';

const Communication: React.FC = () => {
  useEffect(() => {
    // // request
    // window.electronAPI.getData(
    //   'Requesting data from main process from communication component',
    // );
    // // response listener
    // window.electronAPI.onReply('reply-f1', (event, response) => {
    //   console.log(response);
    // });

    // ----
    window.electronAPI.arrayCompute([1, 2, 3, 4]);
    window.electronAPI.onReply('reply-f2', (event, response) => {
      console.log(response);
      
    });
  });
  return (
    <>
      <div>Communication</div>
    </>
  );
};

export default Communication;
