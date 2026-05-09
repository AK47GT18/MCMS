const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

/**
 * Retrieves the precise physical location of the Windows PC using the 
 * Native Windows.Devices.Geolocation WinRT API via a PowerShell bridge.
 */
function getPreciseLocation() {
    const tempPs1 = path.join(__dirname, 'temp_location.ps1');
    
    // PowerShell script content
    const psScript = `
$ErrorActionPreference = 'Stop'
try {
    # Check if WinRT Geolocation is available
    $Type = [Windows.Devices.Geolocation.Geolocator, Windows.Devices.Geolocation, ContentType=WindowsRuntime]
    $geolocator = New-Object Windows.Devices.Geolocation.Geolocator
    
    # Set High Accuracy Mode (Forces GPS/Wi-Fi triangulation)
    $geolocator.DesiredAccuracy = [Windows.Devices.Geolocation.PositionAccuracy]::High
    
    # Request position asynchronously
    $asyncOp = $geolocator.GetGeopositionAsync()
    
    # Wait for results (max 10 seconds)
    $timeout = 100
    while ($asyncOp.Status -eq 'Started' -and $timeout -gt 0) {
        Start-Sleep -m 100
        $timeout--
    }

    if ($asyncOp.Status -eq 'Completed') {
        $pos = $asyncOp.GetResults()
        $result = @{
            Latitude  = $pos.Coordinate.Point.Position.Latitude
            Longitude = $pos.Coordinate.Point.Position.Longitude
            Accuracy  = $pos.Coordinate.Accuracy # Accuracy in meters
            Timestamp = $pos.Coordinate.Timestamp.ToString()
            Status    = "Success"
        }
        Write-Output ($result | ConvertTo-Json)
    } else {
        throw "Location capture timed out or services are disabled. Status: $($asyncOp.Status)"
    }
} catch {
    $err = @{
        Status  = "Error"
        Message = $_.Exception.Message
        Help    = "Ensure 'Location Services' and 'Allow apps to access your location' are ON in Windows Privacy Settings."
    }
    Write-Output ($err | ConvertTo-Json)
}
`;

    // Write temp PS1 file to avoid shell escaping issues
    fs.writeFileSync(tempPs1, psScript);

    const command = `powershell -NoProfile -ExecutionPolicy Bypass -File "${tempPs1}"`;

    exec(command, (error, stdout, stderr) => {
        // Clean up temp file
        if (fs.existsSync(tempPs1)) fs.unlinkSync(tempPs1);

        if (error) {
            console.error(JSON.stringify({
                Status: "ExecError",
                Message: error.message,
                Details: stderr
            }, null, 2));
            return;
        }

        try {
            // Find the JSON part of the output (in case there's extra noise)
            const jsonStart = stdout.indexOf('{');
            const jsonEnd = stdout.lastIndexOf('}');
            if (jsonStart !== -1 && jsonEnd !== -1) {
                const jsonStr = stdout.substring(jsonStart, jsonEnd + 1);
                const result = JSON.parse(jsonStr);
                console.log(JSON.stringify(result, null, 2));
            } else {
                throw new Error("No valid JSON found in output");
            }
        } catch (e) {
            console.error(JSON.stringify({
                Status: "ParseError",
                Message: e.message,
                RawOutput: stdout
            }, null, 2));
        }
    });
}

getPreciseLocation();
