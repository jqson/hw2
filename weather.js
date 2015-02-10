var timeUpdate = 60;
var lastUpdate = null;
var unit = 'us';

var apikey = '73602553d0be92af1ead24434c6b3466';
var sanjoseLat = 37.3382082;
var sanjoseLong = -121.88632860000001;
var sydneyLat = -33.8674869;
var sydneyLong = 151.20699020000006;

var weekday = new Array(7);
weekday[0]=  'Sunday';
weekday[1] = 'Monday';
weekday[2] = 'Tuesday';
weekday[3] = 'Wednesday';
weekday[4] = 'Thursday';
weekday[5] = 'Friday';
weekday[6] = 'Saturday';

$(document).ready(function() {
  $(function() {
    navPage(window.location.hash);
    updateAll();
    updateUnit();
    setInterval(updateAll, timeUpdate * 1000);
  });
})  

$(window).on('hashchange', function(e) {
  navPage(window.location.hash);
});

$('.change-unit').click(function() {
  if (unit == 'si') unit = 'us';
  else unit = 'si';
      
  // save weather to local stroage
  if (typeof(Storage) !== 'undefined') {
    localStorage.setItem('unit', unit);
  }

  updateUnit();
  updateWeather();
});

function navPage(hash) {
  console.log(hash);
  $('.page').removeClass('show');

  if (hash == '') {
    $('#cities-list').addClass('show');
  }
  if (hash == '#city/currentlocation') {
    $('#city-current').addClass('show');
  }
  if (hash == '#city/sanjose') {
    $('#city-sanjose').addClass('show');
  }
  if (hash == '#city/sydney') {
    $('#city-sydney').addClass('show');
  }
}

function updateAll() {
  var curTime = new Date($.now());
  updateTime(curTime);
  
  // display weather saved in local stroage just after the app start
  if (lastUpdate == null) {    
    // load weather and unit from local stroage
    if (typeof(Storage) !== 'undefined') {
      var curWeather = JSON.parse(localStorage.getItem('is-cur'));
      if (curWeather) {
        lastUpdate = curWeather.currently.time;
        dispWeather('is-cur', curWeather);
      }
      var sanjoseWeather =  JSON.parse(localStorage.getItem('is-sanjose'));
      if (sanjoseWeather) dispWeather('is-sanjose', sanjoseWeather);
      var sydneyWeather = JSON.parse(localStorage.getItem('is-sydney'));
      if (sydneyWeather) dispWeather('is-sydney', sydneyWeather);
      var preUnit = localStorage.getItem('unit');
      if (preUnit) unit = preUnit;
      console.log(preUnit);
    }
  }

  // if local storage is empty, or lastUpdate > 5min, update Weather from server 
  console.log('time from last update: ' + (curTime.getTime() / 1000 - lastUpdate));
  if (lastUpdate == null || curTime.getTime() / 1000 - lastUpdate > 300) {
    updateWeather();
  }
}

// convert time to h:mm A format and update
function updateTime(curTime) {
  var sanjoseTime= UTCtoLocalDate(curTime, -8);
  var sydneyTime = UTCtoLocalDate(curTime, 11);
  dispTime('is-cur', curTime);
  dispTime('is-sanjose', sanjoseTime);
  dispTime('is-sydney', sydneyTime);
  
  function dispTime(city, time) {
    var timeString = time.toLocaleTimeString();
    timeString = timeString.substring(0, timeString.lastIndexOf(':')) + timeString.substr(timeString.indexOf(' '), 3);
    $('#' + city + ' .time').text(timeString);
  }
}

// get weather info from API and save to local stroage
function updateWeather() {
  console.log('update weather from server')
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
      url: 'https://api.forecast.io/forecast/' + apikey + '/' + latitude + ',' + longitude + '?units=' + unit,
      dataType: 'jsonp',
      crossDomain: true,
    }).done(function(weather) {
      console.log(weather);
      
      // save weather to local stroage
      if (typeof(Storage) !== 'undefined') {
        localStorage.setItem(city, JSON.stringify(weather));
      }
      if (city == 'is-cur') {
        lastUpdate = weather.currently.time;
        console.log('new lastUpdate time: ' + lastUpdate);
      }
      
      dispWeather(city, weather);
    });
  }
}

function dispWeather(city, weather) {
  // get sunrise/sunset time and determin day/night
  var curTime = UNIXtoLocalDate(weather.currently.time, weather.offset);
  var sunriseTime = UNIXtoLocalDate(weather.daily.data[0].sunriseTime, weather.offset);
  var sunsetTime = UNIXtoLocalDate(weather.daily.data[0].sunsetTime, weather.offset);
  var day = curTime > sunriseTime && curTime < sunsetTime;

  // get cloudy or not
  var cloudy = weather.currently.cloudCover >= 0.4;

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
  
  // update list temp
  $('#' + city + ' .city-temp').text(tempToStr(weather.currently.temperature));
  
  // update background color
  $('#' + city).attr('class', bgClass);
  var cityDetail = '#' + city + '-detail';
  $(cityDetail).attr('class', bgClass);

  // update detail page
  // overview
  $(cityDetail + ' h4').text(weather.currently.summary);
  $(cityDetail + ' h1').text(tempToStr(weather.currently.temperature));
  $(cityDetail + ' .today-overview li:eq(0)').text(weekday[curTime.getDay()]);
  $(cityDetail + ' .today-overview li:eq(2)').text(tempToStr(weather.daily.data[0].temperatureMax));
  $(cityDetail + ' .today-overview li:eq(3)').text(tempToStr(weather.daily.data[0].temperatureMin));

  // hourly
  $(cityDetail + ' .today-hourly-list').empty();

  for (hour = 0; hour < 24; hour++) {
    var hourly = weather.hourly.data[hour];
    var hourStr = 'Now';
    if (hour > 0) hourStr = toHourStr(hourly.time, weather.offset);
    var time = $('<li></li>').text(hourStr);
    var img = $('<li></li>').html(iconToDir(hourly.icon));
    var temp = $('<li></li>').text(tempToStr(hourly.temperature));
    var list = $('<li></li>').append($('<ul></ul>').append(time, img, temp));
    $(cityDetail + ' .today-hourly-list').append(list);
  }

  // daily
  $(cityDetail + ' .forecast-list').empty();

  for (var day in weather.daily.data) {
    var daily = weather.daily.data[day]
    var day = $('<li></li>').text(weekday[UNIXtoLocalDate(daily.time, weather.offset).getDay()]);
    var img = $('<li></li>').html(iconToDir(daily.icon));
    var high = $('<li></li>').text(tempToStr(daily.temperatureMax));
    var low = $('<li></li>').text(tempToStr(daily.temperatureMin));
    var list = $('<li></li>').append($('<ul></ul>').append(day, img, high, low));
    $(cityDetail + ' .forecast-list').append(list);
  }

  // summary and today details list
  $(cityDetail + ' .today-summary').text('Today: ' + weather.daily.summary);

  var sunriseStr = sunriseTime.toLocaleTimeString();
  var sunriseStr = sunriseStr.substring(0, sunriseStr.lastIndexOf(':')) + sunriseStr.substr(sunriseStr.indexOf(' '), 3);
  var sunsetStr = sunsetTime.toLocaleTimeString();
  var sunsetStr = sunsetStr.substring(0, sunsetStr.lastIndexOf(':')) + sunsetStr.substr(sunsetStr.indexOf(' '), 3);
  $(cityDetail + ' .sunriseTime').text(sunriseStr);
  $(cityDetail + ' .sunsetTime').text(sunsetStr);

  $(cityDetail + ' .chanceRain').text(Math.round(weather.currently.precipProbability * 100) + '%');
  $(cityDetail + ' .humidity').text(Math.round(weather.currently.humidity * 100) + '%');
  
  var windSpeed = weather.currently.windSpeed;
  var windBearing = weather.currently.windBearing;
  if (unit == 'si') windSpeed *= 2.23694;
  windSpeed = Math.round(windSpeed);
  var windStr = windSpeed + ' mph ';
  
  var bearings = ["NE", "E", "SE", "S", "SW", "W", "NW", "N"];
  var index = windBearing - 22.5;
  if (index < 0) index += 360;
  index = parseInt(index / 45);
  windStr += bearings[index];
  $(cityDetail + ' .wind').text(windStr);
  
  $(cityDetail + ' .feelsLike').text(tempToStr(weather.currently.apparentTemperature));
  var precip = weather.currently.precipIntensity;
  if (unit == 'si') precip *= 0.0393701;
  precip = Math.round(precip * 10000) / 10000;
  if (precip > 0) $(cityDetail + ' .precip').text(precip + ' in');
  $(cityDetail + ' .pressure').text(Math.round(weather.currently.pressure * 0.0295299830714) + ' in');
  var visi = weather.currently.visibility;
  if (unit == 'si') visi *= 0.621371;
  visi = Math.round(visi);
  $(cityDetail + ' .visibility').text(visi + ' mi');
}

function updateUnit() {
  console.log(unit);
  if (unit == 'si') {
    $('nav .celsius').removeClass('disabled');
    $('nav .fahrenheit').addClass('disabled');
  }
  else {
    $('nav .celsius').addClass('disabled');
    $('nav .fahrenheit').removeClass('disabled');
  }
}

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

function tempToStr(temperature) {
  return Math.round(temperature) + '˚';
}

function toHourStr(time, offset) {
  var hours = UNIXtoLocalDate(time, offset).getHours();
  var hourStr = "";
  if (hours > 12) hourStr += hours - 12;
  else hourStr += hours;
  if (hours >= 12) return hourStr + ' PM';
  else return hourStr + ' AM';
}

function iconToDir(icon) {
  return '<img src="images/' + icon + '.png"/>';
}
