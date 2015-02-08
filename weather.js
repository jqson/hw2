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

  $('.cities-list').css('display', 'block')
})  

// convet UNIX time to local time
function UNIXtoLocalDate(time, offset) {
  var date = new Date(time * 1000);
  var utc = new Date(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), date.getUTCHours(), date.getUTCMinutes());
  utc.setHours(utc.getHours() + offset);
  return utc;
}

// convert UTC time to local time
function UTCtoLocalDate(time, offset) {
  var date = new Date(time);
  var utc = new Date(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), date.getUTCHours(), date.getUTCMinutes());
  utc.setHours(utc.getHours() + offset);
  return utc;
}

// convert time to h:mm A format and update
function updateTime() {
  var curTime = new Date($.now());
  var sanjoseTime= UTCtoLocalDate($.now(), -8);
  var sydneyTime = UTCtoLocalDate($.now(), 11);
  getTime(curTime, 'is-cur');
  getTime(sanjoseTime, 'is-sanjose');
  getTime(sydneyTime, 'is-sydney');
  
  function getTime(time, city) {
    var timeString = time.toLocaleTimeString();
    timeString = timeString.substring(0, timeString.lastIndexOf(':')) + timeString.substr(timeString.indexOf(' '), 3);
    // save time to localStroage
    if (typeof(Storage) !== 'undefined') {
      localStorage.setItem(city + '-time', timeString);
    }
    $('#' + city + ' .time').text(timeString);
  }
}

function updateWeather() {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(curLoc);

    function curLoc(position) {
      var curLat = position.coords.latitude;
      var curLong = position.coords.longitude;
      //console.log(curLat);
      //console.log(curLong);
      getWeather(curLat, curLong, 'is-cur');
    }
  }

  getWeather(sanjoseLat, sanjoseLong, 'is-sanjose');
  getWeather(sydneyLat, sydneyLong, 'is-sydney');
  
  function getWeather(latitude, longitude, city) {
    $.ajax({
      type: 'GET',
      url: 'https://api.forecast.io/forecast/' + apikey + '/' + latitude + ',' + longitude + '?units=si',
      dataType: 'jsonp',
      crossDomain: true,
    }).done(function(weather) {
      console.log(weather);
      // save weather to local stroage
      localStorage.setItem(city + '-weather', weather);

      // get Temperature
      var curTemp = Math.round(weather.currently.temperature);
      //console.log(curTemp);
       
      $('#' + city + ' .city-temp').text(curTemp + '˚');
      
      // get sunrise/sunset time and determin day/night
      var curTime = UNIXtoLocalDate(weather.currently.time, weather.offset);
      var sunriseTime = UNIXtoLocalDate(weather.daily.data[0].sunriseTime, weather.offset);
      var sunsetTime = UNIXtoLocalDate(weather.daily.data[0].sunsetTime, weather.offset);
      var day = curTime > sunriseTime && curTime < sunsetTime;
      
      // get cloudy or not
      var cloudy = weather.currently.cloudCover > 0.5;
      
      // determin background color
      var bgClass = 'day';
      if (day) {
        if (cloudy) bgClass = 'dayCloudy';
        else bgClass = 'day';
      }
      else {
        if (cloudy) bgClass = 'nightCloudy';
        else bgClass = 'night';
      }

      $('#' + city).attr('class', bgClass);
    });
  }
}

function loadTime() {

}


