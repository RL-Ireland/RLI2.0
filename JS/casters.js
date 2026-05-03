//Variables for EVERYTHING
//Declare here if using across multiple function/need to keep the value for duration of series
//These will only refresh if source is refreshed or the values are set in code


$(() => {
	WsSubscribers.init(49322, true)
    WsSubscribers.subscribe("Games", "Info", (e) => {
        currentSeries.style.visibility = e[0]['values'][3][5];
        nextSeries1.style.visibility = e[0]['values'][7][5];
        nextSeries2.style.visibility = e[0]['values'][10][5];
        nextSeries3.style.visibility = e[0]['values'][13][5];
        headlineText.innerHTML = e[0]['values'][16][1].toUpperCase();
        scrollText.innerHTML = " " + e[0]['values'][17][1].toUpperCase() + "        ";
        scrollText1.innerHTML = " " + e[0]['values'][18][1].toUpperCase() + "       ";
        scrollText2.innerHTML = " " + e[0]['values'][19][1].toUpperCase() + "       ";
        scrollText3.innerHTML = " " + e[0]['values'][20][1].toUpperCase() + "       ";
        currentBo.innerHTML = e[0]['values'][3][4].toUpperCase();
        firstBo.innerHTML = e[0]['values'][7][4].toUpperCase();
        secondBo.innerHTML = e[0]['values'][10][4].toUpperCase();
        thirdBo.innerHTML = e[0]['values'][13][4].toUpperCase();
        firstSeries.innerHTML = e[0]['values'][7][0].toUpperCase();
        secondSeries.innerHTML = e[0]['values'][10][0].toUpperCase();
        thirdSeries.innerHTML = e[0]['values'][13][0].toUpperCase();
        currentBlueName.innerHTML = e[0]['values'][2][1].toUpperCase();
        currentOrangeName.innerHTML = e[0]['values'][2][3].toUpperCase();
        nextBlueName.innerHTML = e[0]['values'][6][1].toUpperCase();
        nextOrangeName.innerHTML = e[0]['values'][6][3].toUpperCase();
        nextBlueName2.innerHTML = e[0]['values'][9][1].toUpperCase();
        nextOrangeName2.innerHTML = e[0]['values'][9][3].toUpperCase();
        nextBlueName3.innerHTML = e[0]['values'][12][1].toUpperCase();
        nextOrangeName3.innerHTML = e[0]['values'][12][3].toUpperCase();
        firstScore.innerHTML = e[0]['values'][7][1] + "-" + e[0]['values'][7][3];
        secondScore.innerHTML = e[0]['values'][10][1] + "-" + e[0]['values'][10][3];
        thirdScore.innerHTML = e[0]['values'][13][1] + "-" + e[0]['values'][13][3];
        if(e[0]['values'][7][1] != 0 || e[0]['values'][7][3] != 0){
            firstScoreArea.style.visibility = "visible";
        }else{
            firstScoreArea.style.visibility = "hidden";
        }
        if(e[0]['values'][10][1] != 0 || e[0]['values'][10][3] != 0){
            secondScoreArea.style.visibility = "visible";
        }else{
            secondScoreArea.style.visibility = "hidden";
        }
        if(e[0]['values'][13][1] != 0 || e[0]['values'][13][3] != 0){
            thirdScoreArea.style.visibility = "visible";
        }else{
            thirdScoreArea.style.visibility = "hidden";
        }
        if(e[0]['values'][7][5] == "hidden"){
            firstScoreArea.style.visibility = "hidden";
        }
        if(e[0]['values'][10][5] == "hidden"){
            secondScoreArea.style.visibility = "hidden";
        }
        if(e[0]['values'][13][5] == "hidden"){
            thirdScoreArea.style.visibility = "hidden";
        }
        $('#headlineText').textfill({ maxFontPixels: 25, widthOnly: true });
        $('#scrollText').textfill({ maxFontPixels: 25, widthOnly: true });
        $('#scrollText1').textfill({ maxFontPixels: 25, widthOnly: true });
        $('#scrollText2').textfill({ maxFontPixels: 25, widthOnly: true });
        $('#scrollText3').textfill({ maxFontPixels: 25, widthOnly: true });
        $('#currentBlueName').textfill({ maxFontPixels: 10, widthOnly: true });
        $('#currentOrangeName').textfill({ maxFontPixels: 10, widthOnly: true });
        $('#nextBlueName').textfill({ maxFontPixels: 10, widthOnly: true });
        $('#nextOrangeName').textfill({ maxFontPixels: 10, widthOnly: true });
        $('#nextBlueName2').textfill({ maxFontPixels: 10, widthOnly: true });
        $('#nextOrangeName2').textfill({ maxFontPixels: 10, widthOnly: true });
        $('#nextBlueName3').textfill({ maxFontPixels: 10, widthOnly: true });
        $('#nextOrangeName3').textfill({ maxFontPixels: 10, widthOnly: true });

        Object.keys(e[1]['values']).forEach((id) => {
          if(e[1]['values'][id][0] == e[0]['values'][2][1]){
              currentBlue.src = e[1]['values'][id][1];
          }
          if(e[1]['values'][id][0] == e[0]['values'][2][3]){
              currentOrange.src = e[1]['values'][id][1];
          }
          if(e[1]['values'][id][0] == e[0]['values'][6][1]){
              nextBlue.src = e[1]['values'][id][1];
          }
          if(e[1]['values'][id][0] == e[0]['values'][6][3]){
              nextOrange.src = e[1]['values'][id][1];
          }
          if(e[1]['values'][id][0] == e[0]['values'][9][1]){
              nextBlue2.src = e[1]['values'][id][1];
          }
          if(e[1]['values'][id][0] == e[0]['values'][9][3]){
              nextOrange2.src = e[1]['values'][id][1];
          }
          if(e[1]['values'][id][0] == e[0]['values'][12][1]){
              nextBlue3.src = e[1]['values'][id][1];
          }
          if(e[1]['values'][id][0] == e[0]['values'][12][3]){
              nextOrange3.src = e[1]['values'][id][1];
          }
         });
    });
});

var intervalId = window.setInterval(function(){
  var oldDate = new Date();
  var temp;
  if (oldDate.getMinutes() < 10){
    var newDate = oldDate.getHours() + ":0" + oldDate.getMinutes();
  }else{
    var newDate = oldDate.getHours() + ":" + oldDate.getMinutes();
  }
  time.innerHTML = newDate;
}, 500);