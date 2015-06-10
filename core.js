
chrome.runtime.onInstalled.addListener(function() {
  chrome.declarativeContent.onPageChanged.removeRules(undefined, function() {
    chrome.declarativeContent.onPageChanged.addRules([
      {
        conditions: [
          new chrome.declarativeContent.PageStateMatcher({
            pageUrl: {
              hostEquals: 'flow.polar.com',
              schemes: ['https'],
              pathContains: 'training/analysis/'
            }
          })
        ],
        actions: [new chrome.declarativeContent.ShowPageAction()]
      }
    ]);
  });
});


function getExportUrl (tabUrl) {
  var re = /https:\/\/flow.polar.com\/training\/analysis\/(\d+)/;
  var matches = re.exec(tabUrl);
  var urlParts = ['https://flow.polar.com/training/analysis/', matches[1], '/export/tcx'];

  return urlParts.join('');
};


function getZip (url, callback) {

  var httpRequest = new XMLHttpRequest();
  httpRequest.onreadystatechange = function(){
    if (httpRequest.readyState === 4) {
      if (httpRequest.status === 200) {
        callback(httpRequest.response);
      } else {
        console.log('There was a problem with fetching the authenticity token.');
      }
    }
  };
  httpRequest.open('GET', url);
  httpRequest.responseType = "blob";
  httpRequest.send();
};


function unzipBlob (blob, callback) {
  zip.useWebWorkers = false;

  zip.createReader(new zip.BlobReader(blob), function(reader){
    reader.getEntries(function(entries) {
      if (entries.length) {
        entries[0].getData(new zip.TextWriter(), function(text) {
          callback(entries[0].filename, text);

          reader.close(function() {});

        }, function(current, total) {});
      }
    });
  }, function(error){console.log('failed to create zip reader', error)});
};


function getAuthenticityToken (callback) {

  var stravaUploadSelectUrl = 'https://www.strava.com/upload/select';
  
  var httpRequest = new XMLHttpRequest();
  httpRequest.onreadystatechange = function(){
    if (httpRequest.readyState === 4) {
      if (httpRequest.status === 200) {
        
        var inputSelector = '#uploadFile > form > input[type="hidden"]:nth-child(2)';
        var authenticityToken = httpRequest.response.querySelector(inputSelector).value;

        callback(authenticityToken);
      } else {
        console.log('There was a problem with fetching the authenticity token.');
      }
    }
  };
  httpRequest.open('GET', stravaUploadSelectUrl);
  httpRequest.responseType = "document";
  httpRequest.send();
};


function genRequestData(multipart) {
  var uint8array = new Uint8Array(multipart.length);
  for (var i=0; i<multipart.length; i++) {
    uint8array[i] = multipart.charCodeAt(i) & 0xff;
  }
  return uint8array;
};


function uploadTCX (authenticityToken, tcxFilename, tcxData, callback) {

  var boundary = '---------------------------' + Date.now().toString(16);
  var parts = [
    'Content-Disposition: form-data; name="_method"\r\n\r\npost\r\n',
    'Content-Disposition: form-data; name="authenticity_token"\r\n\r\n' +
    authenticityToken + '\r\n',
    'Content-Disposition: form-data; name="files[]"; filename="' + tcxFilename + '"\r\n\r\n' +
    tcxData + '\r\n'
  ];
  var multipart =  '--' + boundary + '\r\n' + parts.join('--' + boundary + '\r\n') + '--' + boundary + '--\r\n';
  var requestData = genRequestData(multipart);
  
  var stravaUploadFilesUrl = 'https://www.strava.com/upload/files';

  var httpRequest = new XMLHttpRequest();
  httpRequest.onreadystatechange = function(){
    if (httpRequest.readyState === 4) {
      if (httpRequest.status === 200) {
        console.log(httpRequest.response);
        callback();
      } else {
        console.log('There was a problem with uploading the file.');
      }
    }
  };
  httpRequest.open('POST', stravaUploadFilesUrl);
  httpRequest.setRequestHeader("Content-Type", "multipart\/form-data; boundary=" + boundary);
  httpRequest.send(requestData);
};


chrome.pageAction.onClicked.addListener(function(tab) {

  var exportUrl = getExportUrl(tab.url);

  getZip(exportUrl, function(blob){
    unzipBlob(blob, function(tcxFilename, tcxData){
      console.log('tcx file extracted', tcxFilename);

      getAuthenticityToken(function(authenticityToken){
        console.log('authenticity token', authenticityToken);

        uploadTCX(authenticityToken, tcxFilename, tcxData, function(){
          chrome.pageAction.setTitle({title: "Synchronised", tabId: tab.id});
        })
      });
    });
  });
});
