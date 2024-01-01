# Gmail-Automation

## A note on the areas where my code can be improved:-

1. Try/catch can be used inside every function instead of just using it once in the main function for better debugging and error handling.

2. A date can be taken as input from the user when he would be back from vacation and can be added in the automated reply.

3. I am considering only the top threadId , though it won't create any problems as I am updating it precisely in the loop and I have tested it by sending multiple mails from different gmails but still to avoid any type of bugs we can consider a certain number of top thread Ids. eg considering the top 3 threadIds in every fetch new messages check and updating these threadIds after receving new mails.

4. In the case when a mail is sent to multiple users the automated reply would be sent only to the user who created the thread first and not to those users who further replied to that thread (the incoming mail would be ignored on further replies as the automated reply is sent once).

5. Creating different files for functions performing a particular function for better readabiity and bug fixing in case of errors. 

## Features

1. The application uses the "Login with Google" API to authenticate and access the Gmail account.

2. The app identifies email threads with no prior replies and sends a predefined response.

3. After sending a reply, the app adds a label to the email and moves it to the labeled category in Gmail.

4. The entire sequence of checking for new emails, sending replies, and labeling is repeated at random intervals of 120 seconds(2 minutes).
