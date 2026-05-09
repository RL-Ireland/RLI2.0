# Start the Node.js process
$nodeProcess = Start-Process "node" -ArgumentList "ws-relay.js" -PassThru

# Wait for a short period to allow the Node.js process to start
Start-Sleep -Seconds 0.75

# Send Enter key presses
Add-Type -AssemblyName System.Windows.Forms
[System.Windows.Forms.SendKeys]::SendWait("{ENTER}")
Start-Sleep -Seconds 0.1
[System.Windows.Forms.SendKeys]::SendWait("{ENTER}")

# Wait for the Node.js process to complete
$nodeProcess.WaitForExit()
