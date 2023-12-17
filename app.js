import { config } from "dotenv";
config();
let { PGHOST, PGDATABASE, PGUSER, PGPASSWORD, ENDPOINT_ID } = process.env;

import fs from "fs";
import express from 'express';
import postgres from "postgres";
import cors from "cors";
import OpenAI from "openai";

const sql = postgres({
  host: PGHOST,
  database: PGDATABASE,
  username: PGUSER,
  password: PGPASSWORD,
  port: 5432,
  ssl: 'require',
  connection: {
    options: `project=${ENDPOINT_ID}`,
  },
});


// DATABASE FUNCTIONS
// Get database version
async function getPgVersion() {
  const result = await sql`select version()`;
  console.log("Database Connected\n" , result[0].version);
}

// Fetch all accounts
async function allLawyers() {
  const result = await sql`select * from lawyer`;
  console.log(result);
};

// Fetch all todos
async function allTodos() {
  const result = await sql`select * from todos`;
  console.log(result);
};

// fetch all todos assigned for or by users and its status
async function allTodosStatus() {
  const result = await sql`select * from donetodo`;
  console.log(result);
}

// createAccount(name, password, jobtitle, type, email, sup_id)
async function createAccount(name, password, job_title, type, email, sup_id) {
  const result = await sql`INSERT INTO lawyer (name, password, job_title, type, email, sup_id)
  VALUES
     (${name}, ${password}, ${job_title}, ${type}, ${email}, ${sup_id});`;
  console.log(result);
  return result;
}

// check if account exists with email and password
async function login(email, password) {
  const result = await sql`
    SELECT *
    FROM lawyer
    WHERE email = ${email} AND password = ${password}
  `;
  console.log(result);

  // Check if a lawyer exists based on the query result
  if (result.length > 0) {
    console.log('Lawyer exists!');
  } else {
    console.log('Lawyer does not exist.');
  }
  return result;
}

// check if account exists with email
async function checkEmail(email) {
  const result = await sql`
    SELECT *
    FROM lawyer
    WHERE email = ${email}
  `;
  console.log(result);

  // Check if an email exists based on the query result
  if (result.length > 0) {
    console.log('email exists!');
  } else {
    console.log('email does not exist.');
  }
  return result;
}

// fetch all todos for a supervisor
async function fetchSupTodos(lawyer_id) {
  const result = await sql`
    SELECT *
    FROM todos
    WHERE l_id = ${lawyer_id}
  `;
  console.log(result);
  return result;
}

// fetch all todos for a lawyer
async function fetchTodoIds(lawyer_id) {
  const result = await sql`
    SELECT todo_id
    FROM donetodo
    WHERE l_id = ${lawyer_id}
  `;
  console.log(result);
  return result;
}

// create a todo
async function createTodo(title, description, deadline, l_id) {
  const result = await sql`
    INSERT INTO todos (title, description, deadline, l_id)
    VALUES
      (${title}, ${description}, ${deadline}, ${l_id})
  `;
  console.log(result);
  return result;
}

// fetch a todo id
async function fetchTodoId(title, description, deadline, l_id) {
  const result = await sql`
    SELECT id
    FROM todos
    WHERE title = ${title} AND description = ${description} AND deadline = ${deadline} AND l_id = ${l_id}
  `;
  console.log(result[0]);
  return result[0].id;
}

// asssign a todo to lawyers
async function assignTodoToLawyers(todo_id, l_id) {
  const result = await sql`
    INSERT INTO donetodo (l_id, todo_id, done)
    VALUES
      (${l_id}, ${todo_id}, false)
  `;
  console.log(result);
}

// delete a todo

const openai = new OpenAI();
const app = express();
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

  console.log(threadMessages.id);
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

  console.log(run.id);
  return run.id;
}

// Read a run RETURNS RUN STATUS
async function readRun(threadId, runId) {
  const run = await openai.beta.threads.runs.retrieve(
    threadId,
    runId
  );

  console.log(run.status);
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

  console.log(runs.data);
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

var currentThreadId = "";
var currentRunId = "";
var currentRunStatus = "";
var currentMsgId = "";
var currentResponse = "";
var lastOutputId = "";
var lawyer;
var todos;
var todoIds;

// removing unncessary string from date
function cleanDate(date1) {
  let dateFromDatabase = new Date(date1);
  // Convert to string with the desired format

  let formattedDateString = dateFromDatabase.toLocaleDateString('en-US', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  return formattedDateString;
}

// Get Last Output ID
async function getLastId(threadId) {
  const threadMessages = await openai.beta.threads.messages.list(
    threadId
  );
  console.log(threadMessages.body.first_id);
  return threadMessages.body.first_id;
}

// Create new thread / Conversation
app.get('/new', async (req, res) => {
  currentThreadId = await createThread();

  res.send(currentThreadId);
});

// Test
app.post('/chatt', (req, res) => {
  let threadId = "";
  let msg = "";
  console.log(req.body);

  msg = req.body.msg;
  threadId = req.body.threadId;

  console.log(msg);
  console.log(threadId);
  
  res.send(JSON.stringify({
    "msg": msg,
    "threadId": threadId
  }));
});

// Chat with the assistant
app.post('/chat', async (req, res) => {
  var msg = req.body.msg;
  var threadId = req.body.threadId;
  
  console.log(msg);
  console.log(threadId);

  currentThreadId = threadId;
  
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


// Delete a thread
app.post('/delete', async (req, res) => {
  let threadId = req.body.threadId;

  await deleteThread(threadId);

  res.send("Thread deleted");
});


app.get('/', (req, res) => {
  res.send("Hello World");
});


// register a new account
app.post('/register', async (req, res) => {
  let name = req.body.name;
  let password = req.body.password;
  let job_title = req.body.job_title;
  let type = req.body.type;
  let email = req.body.email;
  let sup_email = req.body.sup_email;

  let sup_id = await sql`select id from lawyer where email = ${sup_email}`;

  let emailExists = checkEmail(email);
  if (emailExists.length > 0) {
    res.send("email already exists");
  }

  let result = await createAccount(name, password, job_title, type, email, sup_id);

  if(result.length == 0)
    res.send("account created");
  else
    res.send("account creation failed");
});

// login to an account
app.post('/login', async (req, res) => {
  let email = req.body.email;
  let password = req.body.password;

  let emailExists = await checkEmail(email);
  
  if (emailExists.length > 0) {
    let result = await login(email, password);

    if(result.length == 0) {
      res.send("wrong password");
    }

    else {
      res.write(JSON.stringify(result[0]));
      lawyer = result[0];

      if (lawyer.type == "supervisor") {
        // Fetching todos for supervisor
        todos = await fetchSupTodos(lawyer.id);

        if (todos.length > 0) {
          // Removing unnecessary string from date
          for (let i = 0; i < todos.length; i++) {
            todos[i].deadline = cleanDate(todos[i].deadline);
          }
          res.write(JSON.stringify(todos));
        }
        else {
          res.write("no todos");
        }
      }
      else {
        // Fetching todos for lawyer
        todoIds = await fetchTodoIds(lawyer.id);

        console.log(todoIds);

        if (todoIds.length > 0) {
          for(let i = 0; i < todoIds.length; i++) {
            todos[i] = await sql`
              SELECT *
              FROM todos
              WHERE id = ${todoIds[i].todo_id}
            `;
          }

          // Removing unnecessary string from date
          for (let i = 0; i < todos.length; i++) {
            todos[i].deadline = cleanDate(todos[i].deadline);
          }
          res.write(JSON.stringify(todos));
        }
        else {
          res.write("no todos");
        }
      }
      
      res.end();
    }
  }

  else {
    res.send("Email does not exist");
  }

});

// create a todo
app.post('/create', async (req, res) => {
  let title = req.body.title;
  let description = req.body.description;
  let deadline = req.body.deadline;
  let l_id = req.body.l_id;
  // in production
  // let l_id = lawyer.id;
  let junior_id = parseInt(req.body.junior_ids);

  let result = await createTodo(title, description, deadline, l_id);

  if(result.length == 0) {
    res.write("Todo created");

    let todo_id = await fetchTodoId(title, description, deadline, l_id);

    await assignTodoToLawyers(todo_id, junior_id);
    res.end();
  }
  else {
    res.send("Todo creation failed");
  }
});

// delete a todo
app.post('/deletetodo', async (req, res) => {
  let id = req.body.id;

  let result = await sql`
    DELETE FROM todos
    WHERE id = ${id}
  `;

  if(result.length == 0) {
    res.send("Todo deleted");
  }
  else {
    res.send("Todo deletion failed");
  }
});

// search for a user name
app.post('/namesearch', async (req, res) => {

  let name = req.body.name;

  let result = await sql`
    SELECT *
    FROM lawyer
    WHERE name LIKE '%' || ${name} || '%';
  `;

  if (result.length > 0) {
    res.json(result);
  } else {
    res.send("User not found");
  }

});

// search for a user email
app.post('/emailsearch', async (req, res) => {

  let email = req.body.email;

  let result = await sql`
    SELECT *
    FROM lawyer
    WHERE email LIKE '%' || ${email} || '%';
  `;

  if (result.length > 0) {
    res.json(result);
  } else {
    res.send("User not found");
  }

});

app.listen(4000, () => {
  console.log('Server connected');
});
await getPgVersion();
