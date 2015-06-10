# flow_to_strava

Chrome Extension to send a Polar Flow activity to Strava.

# Build the extension

Prepare a space for the extension contents: `mkdir build`

Create background.js from the various source files: `cat src/zip.js src/inflate.js src/core.js > build/background.js`

Copy the extension manifest: `cp src/manifest.json build`

# Load the built extension into Chrome for testing

Open Chrome and navigate to the Extension tab.

Enable Developer Mode and choose the `build` directory as the source for your Unpacked Extension.
