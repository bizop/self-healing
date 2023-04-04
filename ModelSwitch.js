// *********************************************
// CODE DEVELOPED BY: NATHAN WILBANKS
// FIND ME ON LINKEDIN: https://www.linkedin.com/in/nathanwilbanks/
// FIND ME ON TWITTER: https://twitter.com/NathanWilbanks_
// WEBSITE: https://jaqnjil.com
// LICENSE: MIT License
// VERSION: 3.29.2023
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

import axios from 'axios';
import { PassThrough } from 'stream';

const MODEL_OPTIONS = {
  primary: {
    url: 'https://api.openai.com/v1/chat/completions',
    modelParams: (userQuery) => ({
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: userQuery }],
      max_tokens: 1000,
      temperature: 0.8,
      stop: '{STOP}',
      stream: true,
    }),
    timeout: 300,
  },
  secondary: {
    url: 'https://api.openai.com/v1/engines/text-davinci-003/completions',
    modelParams: (userQuery) => ({
      prompt: userQuery,
      max_tokens: 1000,
      temperature: 0.8,
      stop: '{STOP}',
      stream: true,
    }),
  },
};

export const ModelSwitch = (apiKey) => {
  let isUsingSecondary = false;

  const getModelData = (userQuery, modelType) => MODEL_OPTIONS[modelType].modelParams(userQuery);

  const getStreamDataWithFallback = async (userQuery) => {
    isUsingSecondary = false;
    const primaryModelData = getModelData(userQuery, 'primary');
    const secondaryModelData = getModelData(userQuery, 'secondary');

    try {
      return await getStreamData(primaryModelData, 'primary');
    } catch (error) {
      console.log('Switching to secondary model...');
      isUsingSecondary = true;
      return await getStreamData(secondaryModelData, 'secondary');
    }
  };

  const getStreamData = async (modelData, modelType) => {
    const modelOptions = MODEL_OPTIONS[modelType];
    try {
      const response = await axios.post(modelOptions.url, modelData, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        responseType: 'stream',
        timeout: modelOptions.timeout,
      });

      console.log(`Using ${modelType} model...`);
      return processStreamResponse(response);
    } catch (error) {
      handleError(error, modelType);
      throw error;
    }
  };

  const handleError = (error, modelType) => {
    const errorMessage = error.message || 'Unknown error';
    if (error.code === 'ECONNABORTED') {
      console.error('Model Timeout: Primary model timed out.');
    } else if (errorMessage !== 'aborted') {
      console.error(`Error with ${modelType} request: ${errorMessage}`);
    }
  };

  const processStreamResponse = (response) => {
    const stream = new PassThrough();
    response.data.on('data', (chunk) => handleStreamData(chunk, stream));
    response.data.on('end', () => handleStreamEnd(response, stream));
    response.data.on('error', (error) => handleStreamError(error, response, stream));
    return stream;
  };

  const handleStreamData = (chunk, stream) => {
    const completion = chunk.toString().trim();
    const jsonStrings = completion.split(/(?:\n|data:)/).filter((str) => str.trim().length > 0);

    jsonStrings.forEach((jsonString) => {
      try {
        const completionText = extractCompletionText(jsonString);
        if (completionText) stream.write(completionText);
      } catch (error) {
        console.error(`Error parsing JSON: ${error}`);
      }
    });
  };

  const extractCompletionText = (jsonString) => {
    if (jsonString.trim() === '[DONE]') return;
    const textJson = JSON.parse(jsonString.trim());

    const choice = textJson.choices?.[0] || {};
    return choice.delta?.content || choice.text;
  };

  const handleStreamEnd = (response, stream) => {
    response.data.removeAllListeners();
    stream.end();
    isUsingSecondary = false;
  };

  const handleStreamError = (error, response, stream) => {
    const errorMessage = error.message || 'Unknown error';
    console.error(`Error with stream: ${errorMessage}`);
    handleError(error, isUsingSecondary ? 'secondary' : 'primary');
    stream.emit('error', error);
  };

  return { getStreamDataWithFallback };
};
