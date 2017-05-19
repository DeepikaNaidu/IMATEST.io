// Copyright 2013 Google Inc. All Rights Reserved.
// You may study, modify, and use this example for any purpose.
// Note that this example is provided "as is", WITHOUT WARRANTY
// of any kind either expressed or implied.

var adsManager;
var adsLoader;
var adDisplayContainer;
var intervalTimer;
var playButton;
var videoContent;

function init() {
  videoContent = document.getElementById('contentElement');
  playButton = document.getElementById('playButton');
  playButton.addEventListener('click', playAds);
  setUpIMA();
}

function setUpIMA() {
  // Create the ad display container.
  createAdDisplayContainer();
  // Create ads loader.
  adsLoader = new google.ima.AdsLoader(adDisplayContainer);
  // Listen and respond to ads loaded and error events.
  adsLoader.addEventListener(
      google.ima.AdsManagerLoadedEvent.Type.ADS_MANAGER_LOADED,
      onAdsManagerLoaded,
      false);
  adsLoader.addEventListener(
      google.ima.AdErrorEvent.Type.AD_ERROR,
      onAdError,
      false);

  // Request video ads.
  var adsRequest = new google.ima.AdsRequest();
  adsRequest.adTagUrl = 'http://pubads.g.doubleclick.net/gampad/ads?ad_rule=1&gdfp_req=1&output=xml_vmap1&impl=s&unviewed_position_start=1&env=vp&hl=en&iu=%2F4180%2Fod-test%2Ffremantl%2Ftake-me-out%2Fs2-ep13&cust_params=ppid%3D0EEHDWfH8KCXKxqAM4TbVn1cYCIDtD8b%26dur%3D60%26pt%3Dvideopage%26rating%3Dpgr%26dist%3Dfremantl%26dm%3Ds4%2Cs1%26ep%3Ds2-ep13-video-6524372%26type%3Dep%26kw%3Dtv2%2Ctake-me-out%2Cfremantl%2Creality%26prog%3Dtake-me-out%26endpoint-group%3Ddesktop%26ppid%3D0EEHDWfH8KCXKxqAM4TbVn1cYCIDtD8b%26pub_age%3Drecent%26site%3Dtv%26endpoint%3Dweb%26ibms-title-id%3D10455833%26seg%3Ds4%2Cs1%26endpoint-detail%3Ddesktop%26vm%3Dcatchup%26genre%3Dreality%26chanl%3Dtv2&vid=5425630990001&cmsid=396&sz=640x480&ciu_szs=300x250&ppid=0EEHDWfH8KCXKxqAM4TbVn1cYCIDtD8b';

  // Specify the linear and nonlinear slot sizes. This helps the SDK to
  // select the correct creative if multiple are returned.
  adsRequest.linearAdSlotWidth = 640;
  adsRequest.linearAdSlotHeight = 400;

  adsRequest.nonLinearAdSlotWidth = 640;
  adsRequest.nonLinearAdSlotHeight = 150;

  adsLoader.requestAds(adsRequest);
}


function createAdDisplayContainer() {
  // We assume the adContainer is the DOM id of the element that will house
  // the ads.
  adDisplayContainer = new google.ima.AdDisplayContainer(
      document.getElementById('adContainer'), videoContent);
}

function playAds() {
  // Initialize the container. Must be done via a user action on mobile devices.
  videoContent.load();
  adDisplayContainer.initialize();

  try {
    // Initialize the ads manager. Ad rules playlist will start at this time.
    adsManager.init(640, 360, google.ima.ViewMode.NORMAL);
    // Call play to start showing the ad. Single video and overlay ads will
    // start at this time; the call will be ignored for ad rules.
    adsManager.start();
  } catch (adError) {
    // An error may be thrown if there was a problem with the VAST response.
    videoContent.play();
  }
}

function onAdsManagerLoaded(adsManagerLoadedEvent) {
  // Get the ads manager.
  var adsRenderingSettings = new google.ima.AdsRenderingSettings();
  adsRenderingSettings.restoreCustomPlaybackStateOnAdBreakComplete = true;
  // videoContent should be set to the content video element.
  adsManager = adsManagerLoadedEvent.getAdsManager(
      videoContent, adsRenderingSettings);

  // Add listeners to the required events.
  adsManager.addEventListener(
      google.ima.AdErrorEvent.Type.AD_ERROR,
      onAdError);
  adsManager.addEventListener(
      google.ima.AdEvent.Type.CONTENT_PAUSE_REQUESTED,
      onContentPauseRequested);
  adsManager.addEventListener(
      google.ima.AdEvent.Type.CONTENT_RESUME_REQUESTED,
      onContentResumeRequested);
  adsManager.addEventListener(
      google.ima.AdEvent.Type.ALL_ADS_COMPLETED,
      onAdEvent);

  // Listen to any additional events, if necessary.
  adsManager.addEventListener(
      google.ima.AdEvent.Type.LOADED,
      onAdEvent);
  adsManager.addEventListener(
      google.ima.AdEvent.Type.STARTED,
      onAdEvent);
  adsManager.addEventListener(
      google.ima.AdEvent.Type.COMPLETE,
      onAdEvent);
}

function onAdEvent(adEvent) {
  // Retrieve the ad from the event. Some events (e.g. ALL_ADS_COMPLETED)
  // don't have ad object associated.
  var ad = adEvent.getAd();
  switch (adEvent.type) {
    case google.ima.AdEvent.Type.LOADED:
      // This is the first event sent for an ad - it is possible to
      // determine whether the ad is a video ad or an overlay.
      if (!ad.isLinear()) {
        // Position AdDisplayContainer correctly for overlay.
        // Use ad.width and ad.height.
        videoContent.play();
      }
      break;
    case google.ima.AdEvent.Type.STARTED:
    document.getElementById('adContainer').style.display = 'block';
      // This event indicates the ad has started - the video player
      // can adjust the UI, for example display a pause button and
      // remaining time.
      if (ad.isLinear()) {
        // For a linear ad, a timer can be started to poll for
        // the remaining time.
        intervalTimer = setInterval(
            function() {
              var remainingTime = adsManager.getRemainingTime();
            },
            300); // every 300ms
      }
      break;
    case google.ima.AdEvent.Type.COMPLETE:
      // This event indicates the ad has finished - the video player
      // can perform appropriate UI actions, such as removing the timer for
      // remaining time detection.
      document.getElementById('adContainer').style.display = 'none';
      if (ad.isLinear()) {
        clearInterval(intervalTimer);
      }
      break;
  }
}

function onAdError(adErrorEvent) {
  // Handle the error logging.
  console.log(adErrorEvent.getError());
  adsManager.destroy();
}

function onContentPauseRequested() {
  videoContent.pause();
  // This function is where you should setup UI for showing ads (e.g.
  // display ad timer countdown, disable seeking etc.)
  // setupUIForAds();
}

function onContentResumeRequested() {
  videoContent.play();
  // This function is where you should ensure that your UI is ready
  // to play content. It is the responsibility of the Publisher to
  // implement this function when necessary.
  // setupUIForContent();

}

// Wire UI element references and UI event listeners.
init();
