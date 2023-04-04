// *********************************************
// CODE DEVELOPED BY: NATHAN WILBANKS
// FIND ME ON LINKEDIN: https://www.linkedin.com/in/nathanwilbanks/
// FIND ME ON TWITTER: https://twitter.com/NathanWilbanks_
// WEBSITE: https://jaqnjil.com
// LICENSE: MIT License
// VERSION: 4.4.2023
// COPYRIGHT: 2023 Nathan Wilbanks

// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:

// The above copyright notice and this permission notice shall be included in all
// copies or substantial portions of the Software.

// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
// SOFTWARE.
// *********************************************

import { exec } from 'child_process';
import { writeFileSync } from 'fs';
import { ModelSwitch } from './ModelSwitch.js';

const modelSwitch = ModelSwitch(process.env.OPENAI_API_KEY);

async function generateCode(userInstructions) {
  const stream = await modelSwitch.getStreamDataWithFallback(
    `[INSTRUCTIONS]: You are the greatest software developer in the world. Write JavaScript code based on the following instructions. Use well known npm packages to make the task easier. ES6 import syntax is preferred. Return only the code, do NOT explain yourself. Return the result in plain text and NOT markdown.\n\n
INSTRUCTIONS: Write a simple Javascript program to predict the price of a house using @tensorflow/tfjs machine learning based on the number of bedrooms and bathrooms.\n\n
CODE:
import * as tf from '@tensorflow/tfjs';

const getData = async () => {
  return [
    { bedrooms: 2, bathrooms: 1, price: 200000 },
    { bedrooms: 3, bathrooms: 2, price: 300000 },
    { bedrooms: 4, bathrooms: 3, price: 400000 },
    { bedrooms: 5, bathrooms: 4, price: 500000 },
  ];
};

const trainModel = async (data) => {
  const model = tf.sequential();
  model.add(tf.layers.dense({ units: 1, inputShape: [2] }));
  model.compile({ loss: 'meanSquaredError', optimizer: 'sgd' });

  const xs = tf.tensor2d(data.map((item) => [item.bedrooms, item.bathrooms]));
  const ys = tf.tensor2d(data.map((item) => [item.price]));

  await model.fit(xs, ys, { epochs: 250 });

  return model;
};

const predictHousePrice = async (bedrooms, bathrooms) => {
  const data = await getData();
  const model = await trainModel(data);

  const input = tf.tensor2d([[bedrooms, bathrooms]]);
  const result = model.predict(input);
  const predictedPrice = result.dataSync()[0];

  return predictedPrice;
};

(async () => {
  console.log('Predicted price:', await predictHousePrice(3, 2));
})();
[INSTRUCTIONS]: You are the greatest software developer in the world. Write JavaScript code based on the following instructions. Use well known npm packages to make the task easier. ES6 import syntax is preferred. Return only the code, do NOT explain yourself. Return the result in plain text and NOT markdown.\n\n
[INSTRUCTIONS]: ${userInstructions}\n\n
CODE:\n`
  );

  return new Promise((resolve, reject) => {
    let accumulatedData = '';

    // Listen to the 'data' event to receive chunks of data
    stream.on('data', (chunk) => {
      accumulatedData += chunk;
    });

    // Listen to the 'end' event to know when the stream has ended
    stream.on('end', () => {
      console.log('\nStream ended');
      resolve(accumulatedData);
    });

    // Listen to the 'error' event to handle any errors
    stream.on('error', (error) => {
      console.error('Error:', error);
      reject(error);
    });
  });
}

async function regenerateCode(userInstructions, code, error) {
  const stream = await modelSwitch.getStreamDataWithFallback(
    `Rewrite the following original code based on the user instructions, the original code, and the error. Rewrite the code to fix any errors and pass any provided tests. Leave a comment in the code for what you did to fix the issues. Return only the code, do NOT explain yourself. Return the result in plain text and NOT markdown.\n\n
INSTRUCTIONS:\n${userInstructions}\n\n
ORIGINAL CODE:\n${code}\n\n
ERROR:\n${error}\n\n
NEW ERROR FREE CODE:\n`
  );

  return new Promise((resolve, reject) => {
    let accumulatedData = '';

    // Listen to the 'data' event to receive chunks of data
    stream.on('data', (chunk) => {
      accumulatedData += chunk;
    });

    // Listen to the 'end' event to know when the stream has ended
    stream.on('end', () => {
      console.log('\nStream ended');
      resolve(accumulatedData);
    });

    // Listen to the 'error' event to handle any errors
    stream.on('error', (error) => {
      console.error('Error:', error);
      reject(error);
    });
  });
}

async function generateTestCode(userInstructions, code) {
  const stream = await modelSwitch.getStreamDataWithFallback(
    `Write a JavaScript test case in vanilla javascript for the following code based on the user instructions. The test should output the test case number and status (pass or fail) if the code is functioning correctly.\n\n
INSTRUCTIONS:\n${userInstructions}\n\n
CODE:\n${code}\n\n
TEST CODE:\n`
  );

  return new Promise((resolve, reject) => {
    let accumulatedData = '';

    // Listen to the 'data' event to receive chunks of data
    stream.on('data', (chunk) => {
      accumulatedData += chunk;
    });

    // Listen to the 'end' event to know when the stream has ended
    stream.on('end', () => {
      console.log('\nStream ended');
      resolve(accumulatedData);
    });

    // Listen to the 'error' event to handle any errors
    stream.on('error', (error) => {
      console.error('Error:', error);
      reject(error);
    });
  });
}

async function installMissingModule(moduleName) {
  console.log(`Installing missing module: ${moduleName}`);

  return new Promise((resolve, reject) => {
    // Run the npm install command to install the missing module
    exec(`npm install ${moduleName}`, (installError, stdout, stderr) => {
      if (installError) {
        console.error('Error installing module:', installError);
        reject(installError);
      } else {
        console.log(`Module ${moduleName} installed successfully.`);
        resolve();
      }
    });
  }).then(async () => {
    // Use dynamic import to load the installed module
    try {
      await import(moduleName);
      console.log(`Module ${moduleName} imported successfully.`);
    } catch (importError) {
      console.error('Error importing module:', importError);
      throw importError;
    }
  });
}

let codeHistory = [];
let errorHistory = [];

async function runCode(code, skipErrorHistory = false, codeToRun = '') {
  return new Promise(async (resolve, reject) => {
    if (!skipErrorHistory) {
      // Store code history
      codeHistory.push(code);
    }

    let comments = '';

    // Add previous code and errors as comments
    for (let i = 0; i < codeHistory.length - 1; i++) {
      comments += `// Previous Code ${i + 1}:\n// ${codeHistory[i].split('\n').join('\n// ')}\n\n`;
      comments += `// Previous Error ${i + 1}:\n// ${errorHistory[i].split('\n').join('\n// ')}\n\n`;
    }

    // Prepend comments to the current code
    const codeWithComments = comments + (codeToRun || code);

    writeFileSync('temp.js', codeWithComments);
    exec('node temp.js', async (error, stdout, stderr) => {
      if (error) {
        console.log(`error.code`, error.code);
        if (!skipErrorHistory) {
          // Store error history
          errorHistory.push(error.message);
        }

        // Check if any modules need to be installed and install them
        if (error.message.includes('Cannot find package')) {
          // Extract the module name from the error message
          const moduleName = error.message.match(/Cannot find package '(.*?)'/)?.[1];
          // Call the installMissingModule function
          await installMissingModule(moduleName);
          // Rerun the code after installing the missing module
          const output = await runCode(code, skipErrorHistory, codeToRun);
          resolve(output);
        } else {
          reject(error);
        }
      } else {
        resolve(stdout);
      }
    });
  });
}

(async () => {
  let userInstructions = 'Write a simple Javascript program to manage a to-do list.';
  let code = await generateCode(userInstructions);
  console.log('Generated code:', code);
  let runProgram = true;
  let codeFixed = false;

  async function installMissingModule(moduleName) {
    console.log(`Installing missing module: ${moduleName}`);

    return new Promise((resolve, reject) => {
      // Run the npm install command to install the missing module
      exec(`npm install ${moduleName}`, (installError, stdout, stderr) => {
        if (installError) {
          console.error('Error installing module:', installError);
          reject(installError);
        } else {
          console.log(`Module ${moduleName} installed successfully.`);
          resolve();
        }
      });
    });
  }

  while (runProgram) {
    try {
      const output = await runCode(code);
      console.log('Output:', output);
      codeFixed = true;
    } catch (error) {
      console.log('Error:', error.message);

      // Check if any modules need to be installed and install them
      if (error.code === 'ERR_MODULE_NOT_FOUND') {
        // Extract the module name from the error message
        const moduleName = error.message.match(/Cannot find package '(.*?)'/)[1];
        // Call the installMissingModule function
        await installMissingModule(moduleName);
        // Continue with the next iteration of the loop
        continue;
      } else {
        // If the error is not a module not found error, regenerate the code
        code = await regenerateCode(userInstructions, code, error);
      }
    }

    if (codeFixed) {
      // Generate test code
      const testCode = await generateTestCode(userInstructions, code);
      console.log('Generated test code:', testCode);

      // Run test code
      let testErrorOccurred = true;
      while (testErrorOccurred) {
        try {
          const testOutput = await runCode(code, true, `${code}\n${testCode}`);
          console.log('Test output:', testOutput);

          // Check if tests failed
          if (testOutput.includes('Fail')) {
            const regeneratedCode = await regenerateCode(userInstructions, code, testCode + testOutput);
            code = regeneratedCode; // Update the code with the regenerated code
          } else {
            testErrorOccurred = false;
            runProgram = false;
          }
        } catch (testError) {
          console.log('Test error:', testError.message);

          // Regenerate the code if an error occurs
          const regeneratedCode = await regenerateCode(userInstructions, code, testError);
          code = regeneratedCode; // Update the code with the regenerated code
        }
      }
    }
  }
})();
