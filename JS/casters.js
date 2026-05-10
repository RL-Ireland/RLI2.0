//Variables for EVERYTHING
//Declare here if using across multiple function/need to keep the value for duration of series
//These will only refresh if source is refreshed or the values are set in code

$(() => {
    WsSubscribers.init(49322, true);
    WsSubscribers.subscribe("Games", "Info", (e) => {

        // --- Headline and scrolling texts ---
        headlineText.innerHTML = e['headline'].toUpperCase();
        scrollText.innerHTML = " " + e['scrollTexts'][0].toUpperCase() + "        ";
        scrollText1.innerHTML = " " + e['scrollTexts'][1].toUpperCase() + "       ";
        scrollText2.innerHTML = " " + e['scrollTexts'][2].toUpperCase() + "       ";
        scrollText3.innerHTML = " " + e['scrollTexts'][3].toUpperCase() + "       ";

        // --- Series formats (BoX) ---
        currentBo.innerHTML = e['currentSeries']['format'].toUpperCase();
        firstBo.innerHTML = e['otherSeries'][0]['format'].toUpperCase();
        secondBo.innerHTML = e['otherSeries'][1]['format'].toUpperCase();
        thirdBo.innerHTML = e['otherSeries'][2]['format'].toUpperCase();

        // --- Other series titles ---
        firstSeries.innerHTML = e['otherSeries'][0]['name'].toUpperCase();
        secondSeries.innerHTML = e['otherSeries'][1]['name'].toUpperCase();
        thirdSeries.innerHTML = e['otherSeries'][2]['name'].toUpperCase();

        // --- Current series team names ---
        currentBlueName.innerHTML = e['currentSeries']['teamA']['name'].toUpperCase();
        currentOrangeName.innerHTML = e['currentSeries']['teamB']['name'].toUpperCase();

        // --- Other series team names ---
        nextBlueName.innerHTML = e['otherSeries'][0]['teamA']['name'].toUpperCase();
        nextOrangeName.innerHTML = e['otherSeries'][0]['teamB']['name'].toUpperCase();
        nextBlueName2.innerHTML = e['otherSeries'][1]['teamA']['name'].toUpperCase();
        nextOrangeName2.innerHTML = e['otherSeries'][1]['teamB']['name'].toUpperCase();
        nextBlueName3.innerHTML = e['otherSeries'][2]['teamA']['name'].toUpperCase();
        nextOrangeName3.innerHTML = e['otherSeries'][2]['teamB']['name'].toUpperCase();

        // --- Always update the score text (even if hidden) ---
        firstScore.innerHTML = e['otherSeries'][0]['scoreA'] + "-" + e['otherSeries'][0]['scoreB'];
        secondScore.innerHTML = e['otherSeries'][1]['scoreA'] + "-" + e['otherSeries'][1]['scoreB'];
        thirdScore.innerHTML = e['otherSeries'][2]['scoreA'] + "-" + e['otherSeries'][2]['scoreB'];

        // --- Set series container visibility ---
        currentSeries.style.visibility = e['currentSeries']['visibility'];
        nextSeries1.style.visibility = e['otherSeries'][0]['visibility'];
        nextSeries2.style.visibility = e['otherSeries'][1]['visibility'];
        nextSeries3.style.visibility = e['otherSeries'][2]['visibility'];

        // --- Helper: Show score area only if series is visible AND at least one score > 0 ---
        function setScoreVisibility(seriesVis, scoreA, scoreB, areaElem, scoreElem) {
            // Convert seriesVis to lowercase string for case-insensitive compare
            const isVisible = (String(seriesVis).toLowerCase() === 'visible');
            // Convert scores to numbers (handles strings like "0", "1", etc.)
            const a = Number(scoreA);
            const b = Number(scoreB);
            const hasNonZero = (a > 0 || b > 0);

            // Debug logging (remove after testing)
            console.log(`Series visible: ${seriesVis} -> ${isVisible}, Scores: ${a}-${b}, hasNonZero: ${hasNonZero}`);

            if (isVisible && hasNonZero) {
                areaElem.style.visibility = 'visible';
                scoreElem.style.visibility = 'visible';
            } else {
                areaElem.style.visibility = 'hidden';
                scoreElem.style.visibility = 'hidden';
            }
        }

        // Apply to each "other series"
        setScoreVisibility(
            e['otherSeries'][0]['visibility'],
            e['otherSeries'][0]['scoreA'],
            e['otherSeries'][0]['scoreB'],
            firstScoreArea,
            firstScore
        );
        setScoreVisibility(
            e['otherSeries'][1]['visibility'],
            e['otherSeries'][1]['scoreA'],
            e['otherSeries'][1]['scoreB'],
            secondScoreArea,
            secondScore
        );
        setScoreVisibility(
            e['otherSeries'][2]['visibility'],
            e['otherSeries'][2]['scoreA'],
            e['otherSeries'][2]['scoreB'],
            thirdScoreArea,
            thirdScore
        );

        // --- Text fitting (unchanged) ---
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

        // --- Team logos ---
        currentBlue.src = e['currentSeries']['teamA']['logo'];
        currentOrange.src = e['currentSeries']['teamB']['logo'];
        nextBlue.src = e['otherSeries'][0]['teamA']['logo'];
        nextOrange.src = e['otherSeries'][0]['teamB']['logo'];
        nextBlue2.src = e['otherSeries'][1]['teamA']['logo'];
        nextOrange2.src = e['otherSeries'][1]['teamB']['logo'];
        nextBlue3.src = e['otherSeries'][2]['teamA']['logo'];
        nextOrange3.src = e['otherSeries'][2]['teamB']['logo'];
    });
});

// --- Clock update (unchanged) ---
var intervalId = window.setInterval(function () {
    var oldDate = new Date();
    var newDate;
    if (oldDate.getMinutes() < 10) {
        newDate = oldDate.getHours() + ":0" + oldDate.getMinutes();
    } else {
        newDate = oldDate.getHours() + ":" + oldDate.getMinutes();
    }
    time.innerHTML = newDate;
}, 500);