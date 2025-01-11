// Trigger to add a custom menu when the Google Sheets file is opened
function onOpen(e) {
  Logger.log("onOpen triggered");
  addMenu();
}

// Adds a custom menu to Google Sheets
function addMenu() {
  Logger.log("Adding custom menu to the Google Sheets UI");
  const ui = SpreadsheetApp.getUi();
  const menu = ui.createMenu('Freds GSP PowerPoint Maker :-)');
  menu.addItem('Generate Presentation', 'promptForSheet');
  menu.addToUi();
  Logger.log("Custom menu added successfully");
}

// Prompt user to select a sheet name and then run the main presentation function
function promptForSheet() {
  const ui = SpreadsheetApp.getUi();
  const sheets = SpreadsheetApp.getActiveSpreadsheet().getSheets();
  const sheetNames = sheets.map(sheet => sheet.getName());
  
  Logger.log("Available sheets: " + sheetNames.join(', '));

  const response = ui.prompt(
    'Select a Sheet',
    'Please type the name of the sheet you want to use for creating the PowerPoint:\n\n' + sheetNames.join(', '),
    ui.ButtonSet.OK_CANCEL
  );

  if (response.getSelectedButton() == ui.Button.OK) {
    const selectedSheetName = response.getResponseText().trim().toLowerCase();  // Convert user input to lowercase
    const sheetNamesLowerCase = sheetNames.map(name => name.toLowerCase());     // Convert all sheet names to lowercase

    Logger.log("User entered sheet name (lowercase): " + selectedSheetName);

    // Find the index of the entered sheet name in the lowercase sheet names array
    const sheetIndex = sheetNamesLowerCase.indexOf(selectedSheetName);

    if (sheetIndex !== -1) {
      Logger.log("Valid sheet name found: " + sheetNames[sheetIndex]);
      generatePresentation(sheetNames[sheetIndex]); // Use original casing of the matched sheet name
    } else {
      Logger.log("Invalid sheet name entered by the user.");
      ui.alert("Invalid sheet name. Please try again.");
    }
  } else {
    Logger.log("User canceled the sheet selection prompt.");
  }
}

// Main function that prepares data from the selected sheet and sends it to the Python server
function generatePresentation(sheetName) {
  Logger.log("Generating presentation for sheet: " + sheetName);

  // Get the selected sheet by name
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sheetName);
  
  if (!sheet) {
    Logger.log("Error: The sheet does not exist.");
    SpreadsheetApp.getUi().alert("The sheet does not exist. Please try again.");
    return;
  }
  
  Logger.log("Sheet found. Retrieving data from sheet.");

  // Prepare and send data to the Python server
  const url = 'https://gsppm.bv-cloud.synology.me/process';
  const data = sheet.getDataRange().getValues();
  
  Logger.log("Data retrieved from sheet. Total rows: " + data.length);

  const headers = data[0];
  const questionIndex = headers.indexOf("Question");
  const answerIndex = headers.indexOf("Answer");

  if (questionIndex === -1 || answerIndex === -1) {
    Logger.log('Error: "Question" and/or "Answer" columns not found in the sheet.');
    SpreadsheetApp.getUi().alert('The selected sheet must have "Question" and "Answer" columns.');
    return;
  }

  Logger.log('"Question" column index: ' + questionIndex + ', "Answer" column index: ' + answerIndex);

  const qaData = [];
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    const question = String(row[questionIndex]); // Convert to string
    const answer = String(row[answerIndex]);     // Convert to string
    qaData.push({ question, answer });
  }

  Logger.log("Prepared question-answer data as strings: " + JSON.stringify(qaData));

  // Get the folderId (assuming it's associated with the active spreadsheet)
  const folderId = getFolderId(); // You need to implement this function to fetch folderId

  Logger.log("Folder ID: " + folderId);

  const payload = JSON.stringify({ data: qaData, folderId: folderId });
  const options = {
    method: 'post',
    contentType: 'application/json',
    payload: payload,
    muteHttpExceptions: true
  };

  Logger.log("Sending POST request to Python server at " + url);
  
  try {
    const response = UrlFetchApp.fetch(url, options);
    const result = JSON.parse(response.getContentText());
    Logger.log("Response received from Python server: " + JSON.stringify(result));
    
    // Show success message to the user
    SpreadsheetApp.getUi().alert('Presentation generation successful! ');
  } catch (e) {
    Logger.log('Error occurred while sending data to Python server: ' + e.toString());
    SpreadsheetApp.getUi().alert('Error sending data to Python server: ' + e.toString());
  }
}

// Function to get the folder ID of the active spreadsheet (assuming it's in Drive)
function getFolderId() {
  const file = SpreadsheetApp.getActiveSpreadsheet();
  const fileId = file.getId();
  
  // Get the file's parent folder(s)
  const parents = DriveApp.getFileById(fileId).getParents();
  
  // Assuming the file is in one folder, return the folder ID
  if (parents.hasNext()) {
    return parents.next().getId();
  } else {
    Logger.log('No parent folder found for this file');
    return null;
  }
}
