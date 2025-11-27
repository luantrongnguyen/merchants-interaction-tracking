/**
 * Google Apps Script for Real-time Call Logs Sync
 * 
 * Setup Instructions:
 * 1. Open your Call Logs Google Sheet
 * 2. Go to Extensions > Apps Script
 * 3. Paste this code
 * 4. Update the WEBHOOK_URL and WEBHOOK_SECRET variables below
 * 5. Save the script
 * 6. Run the setupTrigger() function once to create the trigger
 * 7. The trigger will automatically call syncCallLogs() when rows are added/edited
 */

// ===== CONFIGURATION =====
// Update these values:
const WEBHOOK_URL = 'https://your-backend-url.com/merchants/webhook/sync-call-logs';
const WEBHOOK_SECRET = '130398'; // Use the same passcode from your backend config

// ===== MAIN FUNCTIONS =====

/**
 * This function is called automatically when a row is added or edited in the sheet
 * It will trigger a sync to the backend
 */
function onEdit(e) {
  try {
    // Only trigger if editing the active sheet (not other sheets)
    const sheet = e.source.getActiveSheet();
    const sheetName = sheet.getName();
    
    // Skip if editing header row (row 1)
    if (e.range.getRow() <= 1) {
      return;
    }
    
    // Log the change
    console.log(`[Real-time Sync] Row ${e.range.getRow()} edited in sheet "${sheetName}"`);
    
    // Call webhook to sync
    syncCallLogs(sheetName);
  } catch (error) {
    console.error('[Real-time Sync] Error in onEdit:', error);
    // Don't throw - we don't want to break the sheet editing
  }
}

/**
 * This function is called when a row is added (onChange trigger)
 * More reliable than onEdit for detecting new rows
 */
function onChange(e) {
  try {
    const sheet = e.source.getActiveSheet();
    const sheetName = sheet.getName();
    
    // Check if this is a change we care about (row added/edited)
    if (e.changeType === 'INSERT_ROW' || e.changeType === 'EDIT') {
      console.log(`[Real-time Sync] Change detected: ${e.changeType} in sheet "${sheetName}"`);
      
      // Small delay to ensure data is written
      Utilities.sleep(500);
      
      // Call webhook to sync
      syncCallLogs(sheetName);
    }
  } catch (error) {
    console.error('[Real-time Sync] Error in onChange:', error);
  }
}

/**
 * Call the backend webhook to trigger sync
 */
function syncCallLogs(sheetName) {
  try {
    const payload = {
      secret: WEBHOOK_SECRET,
      sheetName: sheetName || null,
      timestamp: new Date().toISOString(),
    };
    
    const options = {
      method: 'post',
      contentType: 'application/json',
      payload: JSON.stringify(payload),
      muteHttpExceptions: true, // Don't throw on HTTP errors
    };
    
    console.log(`[Real-time Sync] Calling webhook: ${WEBHOOK_URL}`);
    const response = UrlFetchApp.fetch(WEBHOOK_URL, options);
    const responseCode = response.getResponseCode();
    const responseText = response.getContentText();
    
    if (responseCode === 200) {
      console.log(`[Real-time Sync] Success: ${responseText}`);
    } else {
      console.error(`[Real-time Sync] Error ${responseCode}: ${responseText}`);
    }
  } catch (error) {
    console.error('[Real-time Sync] Error calling webhook:', error);
  }
}

/**
 * Setup the onChange trigger (run this once manually)
 * This creates a trigger that fires when rows are added/edited
 */
function setupTrigger() {
  try {
    // Delete existing triggers for this function
    const triggers = ScriptApp.getProjectTriggers();
    triggers.forEach(trigger => {
      if (trigger.getHandlerFunction() === 'onChange') {
        ScriptApp.deleteTrigger(trigger);
      }
    });
    
    // Create new onChange trigger
    const sheet = SpreadsheetApp.getActiveSpreadsheet();
    ScriptApp.newTrigger('onChange')
      .onChange()
      .create();
    
    console.log('[Real-time Sync] Trigger setup completed successfully!');
    return 'Trigger setup completed!';
  } catch (error) {
    console.error('[Real-time Sync] Error setting up trigger:', error);
    throw error;
  }
}

/**
 * Test function to manually trigger a sync
 */
function testSync() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  const sheetName = sheet.getName();
  console.log(`[Test] Testing sync for sheet: ${sheetName}`);
  syncCallLogs(sheetName);
  return 'Test sync completed. Check logs for results.';
}

