const fs = require("fs").promises;
const path = require("path");
const process = require("process");
const { authenticate } = require("@google-cloud/local-auth");
const { google } = require("googleapis");
const SCOPES = ["https://mail.google.com/"];

const TOKEN_PATH = path.join(process.cwd(), "token.json");
const CREDENTIALS_PATH = path.join(process.cwd(), "credentials.json");
const my_label_name = "Replied Auto";
let my_label_id = null;
let seen_upto_mId = null;

async function loadSavedCredentialsIfExist() {
  try {
    const content = await fs.readFile(TOKEN_PATH);
    const credentials = JSON.parse(content);
    return google.auth.fromJSON(credentials);
  } catch (err) {
    return null;
  }
}

async function saveCredentials(client) {
  const content = await fs.readFile(CREDENTIALS_PATH);
  const keys = JSON.parse(content);
  const key = keys.installed || keys.web;
  const payload = JSON.stringify({
    type: "authorized_user",
    client_id: key.client_id,
    client_secret: key.client_secret,
    refresh_token: client.credentials.refresh_token,
  });
  await fs.writeFile(TOKEN_PATH, payload);
}

async function authorize() {
  let client = await loadSavedCredentialsIfExist();
  if (client) {
    return client;
  }
  client = await authenticate({
    scopes: SCOPES,
    keyfilePath: CREDENTIALS_PATH,
  });
  if (client.credentials) {
    await saveCredentials(client);
  }
  return client;
}

async function gmailSetup(auth) {
  return google.gmail({ version: "v1", auth });
}

async function addLabel(gmail) {
  const res = await gmail.users.labels.create({
    userId: "me",
    requestBody: {
      labelListVisibility: "labelShow",
      messageListVisibility: "show",
      name: my_label_name,
      color: {
        backgroundColor: "#fef1d1",
        textColor: "#89d3b2",
      },
    },
  });

  my_label_id = res.data.id;
  console.log(my_label_id);
}

async function checkLabel(gmail) {
  const res = await gmail.users.labels.list({
    userId: "me",
  });

  const labelsArray = res.data.labels;
  const existingLabel = labelsArray.find(
    (label) => label.name === my_label_name
  );

  if (!existingLabel) {
    await addLabel(gmail);
  }
  else{
    my_label_id = existingLabel.id;
  }
}

async function seenUpto(gmail) {
  const res = await gmail.users.threads.list({
    userId: "me",
    maxResults: 1,
  });

  seen_upto_mId = res.data.threads[0].id;
}

async function markLabel(gmail, threadId) {
  const addLabel = await gmail.users.threads.modify({
    userId: "me",
    id: threadId,
    resource: {
      addLabelIds: [`${my_label_id}`],
      removeLabelIds: [],
    },
  });

  console.log(
    `Replied to New Thread Succesfully and marked it's label as ${my_label_name}`
  );
}

async function replyThread(gmail, threadId, senderEmail) {
  const emailLines = [
    `To: ${senderEmail}`,
    "Subject: Out of Office Auto Reply",
    "",
    "Thank you for reaching out. I am currently on vacation and have limited access to my email and won't be able to respond promptly",
    " ",
    " ",
    "Rest assured, I will attend to your email upon my return.",
    "Regards",
  ];

  const email = emailLines.join("\n");

  const raw = Buffer.from(email).toString("base64")

  const message = await gmail.users.messages.send({
    userId: "me",
    requestBody: {
      raw: raw,
      threadId: threadId,
    },
  });

  await markLabel(gmail, threadId);
}

async function ifAlreadyRepliedThread(gmail, threadId) {
  const res = await gmail.users.threads.get({
    userId: "me",
    id: threadId,
  });

  const messages = res.data.messages || [];

  let alreadyReplied = false;
  for (const message of messages) {
    const labelIds = message.labelIds || [];

    if (labelIds.includes("SENT")) {
      alreadyReplied = true;
      break;
    }
  }

  if(!alreadyReplied){
    const mailHeader = messages[0]?.payload?.headers?.find(
      (header) => header.name === "From"
    ).value;
    
    if(mailHeader){
      const senderEmail = mailHeader.split("<")[1].split(">")[0];
      replyThread(gmail, threadId, senderEmail);
    }
  }
}

async function replyNewThreads(gmail) {
  let nextPageToken = null;
  let new_seen = null;

  outer: do {
    const response = await gmail.users.threads.list({
      userId: "me",
      maxResults: 10,
      pageToken: nextPageToken,
    });

    const threads = response.data.threads;
    for (const thread of threads) {
      const currentId = thread.id;

      if (new_seen === null) {
        new_seen = currentId;
      }

      if (currentId == seen_upto_mId) {
        seen_upto_mId = new_seen;
        break outer;
      }

      await ifAlreadyRepliedThread(gmail, currentId);
    }

    nextPageToken = response.data.nextPageToken;
  } while (nextPageToken);
}

async function checkNewMessages(gmail) {
  const res = await gmail.users.threads.list({
    userId: "me",
    maxResults: 1,
  });

  if (res.data.threads[0].id === seen_upto_mId) {
    console.log("No new messages found");
    return;
  }

  await replyNewThreads(gmail);
}

async function run() {
  try {
    const auth = await authorize();
    const gmail = await gmailSetup(auth);
    await checkLabel(gmail);
    await seenUpto(gmail);
    setInterval(async () => {
      await checkNewMessages(gmail);
    }, 1000 * 5);
  } catch (error) {
    console.error("An error occurred:", error.message);
  }
}

run();
