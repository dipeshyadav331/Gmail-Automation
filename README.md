# Gmail-Automation

## Overview

This project is an automated Gmail autoresponder that checks for new emails, sends replies to threads with no prior replies, adds a label to the email, and repeats the process at random intervals. The application utilizes the "Login with Google" API to access Gmail and perform the necessary actions.

## Features

1. **Login with Google API Integration**
   - The application uses the "Login with Google" API to authenticate and access the Gmail account.

2. **Automated Email Replies**
   - The app identifies email threads with no prior replies and sends a predefined response.

3. **Labeling and Moving Emails**
   - After sending a reply, the app adds a label to the email and moves it to the labeled category in Gmail.

4. **Randomized Interval Processing**
   - The entire sequence of checking for new emails, sending replies, and labeling is repeated at random intervals between 45 to 120 seconds.
