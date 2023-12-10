import OpenAI from "openai";
import { config } from "dotenv";
config();

import fs from "fs";
import express from 'express';
const app = express();
import cors from "cors";
const openai = new OpenAI();

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cors());

const assistantId = 'asst_doz8twF3Zg9vAqZxNtFaRZyP';

const inst = "You are a lawyer assistant. when asked a question answer as a lawyers assistant.";
var fileIds = ['file-i7ZXjwbamadWyc2qTtVUaeLa'];


// https://platform.openai.com/docs/api-reference/assistants/file-object?lang=node.js
//CRUD

async function createAssistant(name, instructions) {
  const myAssistant = await openai.beta.assistants.create({
    instructions: instructions,
    name: name,
    tools: [{ type: "retrieval" }, { type: "code_interpreter" }],
    model: "gpt-3.5-turbo-1106",
  });
  
  console.log(myAssistant);
  //assistantId = myAssistant.id;
}

async function ReadAssistant(ID) {
  const myAssistant = await openai.beta.assistants.retrieve(
    ID
  );
  
  console.log(myAssistant);
}

async function ListAssistants() {
  const myAssistants = await openai.beta.assistants.list({
    order: "desc",
    limit: "20",
  });

  console.log(myAssistants.data);
}

async function UpdateAssistant(ID, instructions, name, fileId) {
  if (fileId != null) {
    fileIds.push(fileId);
  }
  const myUpdatedAssistant = await openai.beta.assistants.update(
    ID,
    {
      instructions: instructions,
      name: name,
      tools: [{ type: "retrieval" }],
      model: "gpt-3.5-turbo-1106",
      file_ids: fileIds,
    }
  );
  console.log(myUpdatedAssistant);
}

async function DeleteAssistant(ID) {
  const response = await openai.beta.assistants.del(ID);

  console.log(response);
}

// UPLOADS A FILE TO OPENAI AND RETURNS FILE ID
async function uploadFile(filename) {
  const file = await openai.files.create({
    file: fs.createReadStream(filename),
    purpose: "assistants",
  });

  console.log(file);
  return file.id;
}

// ATTACHES FILE TO AN ASSISTANT
async function fileToAssistant(fileId, ID) {
  const myAssistantFile = await openai.beta.assistants.files.create(
    ID, 
    { 
      file_id: fileId
    }
  );
  console.log(myAssistantFile);
}

// TESTS IF THE FILE IS ATTACHED TO THE ASSISTANT
async function testFile(ID, fileId) {
  const myAssistantFile = await openai.beta.assistants.files.retrieve(
    ID,
    fileId
  );
  console.log(myAssistantFile);
}

// DELETE A FILE FROM AN ASSISTANT
async function deleteFile(ID, fileId) {
  const deletedAssistantFile = await openai.beta.assistants.files.del(
    ID,
    fileId
  );
  console.log(deletedAssistantFile);
}

// LIST FILES OF AN ASSISTANT IN AN ARRAY CALLED `data`
async function listFiles(ID){
  const assistantFiles = await openai.beta.assistants.files.list(
    ID
  );
  console.log(assistantFiles);
}


//
// THREADS
//
// Create a thread RETURNS THREAD ID
async function createThread() {
  const emptyThread = await openai.beta.threads.create();

  console.log(emptyThread);
  return emptyThread.id;
}

// Read a thread
async function readThread(threadId) {
  const myThread = await openai.beta.threads.retrieve(
    threadId
  );

  console.log(myThread);    
}

// Update a thread VIP ATTACH THREAD TO USER TEST
async function updateThread(threadId) {
  const updatedThread = await openai.beta.threads.update(
    threadId,
    {
      metadata: { modified: "true", user: "abc123" },
    }
  );

  console.log(updatedThread);
}

// Delete a thread
async function deleteThread(threadId) {
  const response = await openai.beta.threads.del(threadId);

  console.log(response);
}


//
// MESSAGES
//
// Create a Message RETURNS MESSAGE ID
async function createMessage(threadId, content) {
  const threadMessages = await openai.beta.threads.messages.create(
    threadId,
    { role: "user", content: content }
  );

  console.log(threadMessages);
  return threadMessages.id;
}

// Read a Message RETURNS MESSAGE CONTENT
async function readMessage(threadId, msgId) {
  const message = await openai.beta.threads.messages.retrieve(
    threadId,
    msgId
  );

  console.log(message.content[0].text.value);
  return message.content[0].text.value;
}

// Update a Message x
async function updateMessage(threadId, msgId) {
  const message = await openai.beta.threads.messages.update(
    threadId,
    msgId,
    {
      metadata: {
        modified: "true",
        user: "abc123",
      },
    });
  console.log(message);
}

// List Messages RETURNS AN ARRAY OF DATA LOOK INSIDE TO GET EXAMPLE
async function listMessages(threadId) {
  const threadMessages = await openai.beta.threads.messages.list(
    threadId
  );
  // loop the array of data[i] ex: threadMessages.data[i].content[0].text.value;
  // for(let i = 0; i < threadMessages.data.length; i++) {
  //   console.log(threadMessages.data[i].content[0].text.value);
  // }
  // console.log(threadMessages.body.first_id);
  // readMessage(threadId, threadMessages.body.first_id);
  return threadMessages;
}

//
// RUNS
//
// Create a run RETURNS RUN ID
async function createRun(threadId, ID) {
  const run = await openai.beta.threads.runs.create(
    threadId,
    { assistant_id: ID }
  );

  console.log(run);
  return run.id;
}

// Read a run RETURNS RUN STATUS
async function readRun(threadId, runId) {
  const run = await openai.beta.threads.runs.retrieve(
    threadId,
    runId
  );

  console.log(run);
  return run.status;
}

// Update a run
async function updateRun(threadId, runId) {
  const run = await openai.beta.threads.runs.update(
    threadId,
    runId,
    {
      metadata: {
        user_id: "user_abc123",
      },
    }
  );

  console.log(run);
}

// REQUIRES ACTION FUNCTION `still needs developing`
async function submitToolOutputsToRun(threadId, runId) {
  const run = await openai.beta.threads.runs.submitToolOutputs(
    threadId,
    runId,
    {
      tool_outputs: [
        {
          tool_call_id: "call_abc123",
          output: "28C",
        },
      ],
    }
  );

  console.log(run);
}

// List runs RETURNS BIG OBJECT HAS ATTRIBUTE `data` WHICH IS AN ARRAY OF RUN OBJECTS
async function listRuns(threadId) {
  const runs = await openai.beta.threads.runs.list(
    threadId
  );

  console.log(runs);
  return runs.data;
}

// Cancel a run
async function cancelRun(threadId, runId) {
  const run = await openai.beta.threads.runs.cancel(
    threadId,
    runId
  );

  console.log(run);
}


//
// STEPS
//
// Reads step in a specific run RETURNS MESSAGE ID
async function readStep(threadId, runId, stepId) {
  const runStep = await openai.beta.threads.runs.steps.retrieve(
    threadId,
    runId,
    stepId
  );
  console.log(runStep);
  return runStep.step_details.message_creation.message_id;
}

// List all steps to a specific run RETURNS LAST STEP ID
async function listSteps(threadId, runId) {
  const runStep = await openai.beta.threads.runs.steps.list(
    threadId,
    runId
  );
  console.log(runStep);

  return runStep.data;
}


//
// APP
//
// After Uploading a file copy its id from logs
// uploadFile('filename.txt');
// fileToAssistant('file-i7ZXjwbamadWyc2qTtVUaeLa', assistantId);

// Get Last Output ID
async function getLastId(threadId) {
  const threadMessages = await openai.beta.threads.messages.list(
    threadId
  );
  console.log(threadMessages);
  return threadMessages.body.first_id;
}

var currentThreadId = "";
var currentRunId = "";
var currentRunStatus = "";
var currentMsgId = "";
var currentResponse = "";
var lastOutputId = "";


// Create new thread / Conversation
app.get('/new', async (req, res) => {
  currentThreadId = await createThread();

  res.send(currentThreadId);
});

app.post('/test', (req, res) => {
  let threadId = "";
  let msg = "";
  console.log(req.body.haha);
  console.log(req.body.haha2);
  msg = req.body.haha;
  threadId = req.body.haha2;
  res.send({
    msg: msg,
    threadId: threadId
  });
});


app.post('/chat', async (req, res) => {
  var msg = req.body.msg;

  if (req.body.threadId == "") 
    currentThreadId = await createThread();
  else
    currentThreadId = req.body.threadId;
  
  currentMsgId = await createMessage(currentThreadId, msg);

  currentRunId = await createRun(currentThreadId, assistantId);

  currentRunStatus = await readRun(currentThreadId, currentRunId);

  while (currentRunStatus != "completed") 
    currentRunStatus = await readRun(currentThreadId, currentRunId);
  
  lastOutputId = await getLastId(currentThreadId);

  currentResponse = await readMessage(currentThreadId, lastOutputId);

  res.write(currentResponse);

  res.end();
});

app.get('/', (req, res) => {
  res.send("Hello World");
});

app.listen(4000, () => {
  console.log('Server connected');
});
