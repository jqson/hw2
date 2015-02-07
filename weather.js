var timeUpdate = 60;
var weatherUpdate = 600;
var apikey = '73602553d0be92af1ead24434c6b3466';
var sanjoseLat = 37.3382082;
var sanjoseLong = -121.88632860000001;
var sydneyLat = -33.8674869;
var sydneyLong = 151.20699020000006;

$(document).ready(function() {
  $(window).on('hashchange', function(e) {
    var hash = window.location.hash;
    })
  
  $(function() {
    updateTime();
    setInterval(updateTime, timeUpdate * 1000);
  });
  
  $(function() {
    updateWeather();
    setInterval(updateWeather, weatherUpdate * 1000);
  });
})  

 
function getLocalDate(time, offset) {
  var date = new Date(time);
  var utc = new Date(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), date.getUTCHours(), date.getUTCMinutes());
  utc.setHours(utc.getHours() + offset);
  return utc;
}

// convert time to h:mm A format and update
function updateTime() {
  var curTime = new Date($.now());
  var sanjoseTime= getLocalDate($.now(), -8);
  var sydneyTime = getLocalDate($.now(), 11);
  getTime(curTime, 'is-cur');
  getTime(sanjoseTime, 'is-sanjose');
  getTime(sydneyTime, 'is-sydney');
  
  function getTime(time, city) {
    var timeString = time.toLocaleTimeString();
    timeString = timeString.substring(0, timeString.lastIndexOf(':')) + timeString.substr(timeString.indexOf(' '), 3);
    //var timeString = date.toLocaleTimeString();
    $('#' + city + ' .time').text(timeString);
  }
}

function updateWeather() {
  navigator.geolocation.getCurrentPosition(curLoc);

  function curLoc(position) {
    var curLat = position.coords.latitude;
    var curLong = position.coords.longitude;
    //console.log(curLat);
    //console.log(curLong);
    getWeather(curLat, curLong, 'is-cur');
  }

  getWeather(sanjoseLat, sanjoseLong, 'is-sanjose');
  getWeather(sydneyLat, sydneyLong, 'is-sydney');
  
  function getWeather(latitude, longitude, city) {
    $.ajax({
      type: 'GET',
      url: 'https://api.forecast.io/forecast/' + apikey + '/' + latitude + ',' + longitude,
      dataType: 'jsonp',
      crossDomain: true,
    }).done(function(result) {
      console.log(result);
      var curTemp = Math.round(result.currently.temperature);
      console.log(curTemp);
      $('#' + city + ' .city-temp').text(curTemp + '˚');
    });
  }
}

