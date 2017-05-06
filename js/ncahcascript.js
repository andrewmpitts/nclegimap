/**
 * Created by andrewpitts on 4/11/17.
 */

// List of legislator objects
var conReps = {};
console.log("Hi!");
// Variables to track which legislative district is selected
var selectedConDistrict = 0;
var selectedDistrict = 0;

// Map dimensions
var width = 900, height = 450;

var achaRepVotes = {
    "1": "No",
    "2": "Yes",
    "3": "No",
    "4": "No",
    "5": "Yes",
    "6": "Yes",
    "7": "Yes",
    "8": "Yes",
    "9": "Yes",
    "10": "Yes",
    "11": "Yes",
    "12": "No",
    "13": "Yes"
}

//Adds <g> element for containing map SVG coordinates.
//State Congressionial Districts <g> element
var gc = d3.select("#map")
    .append("g")
    .attr("id", "conMap")
    .attr("width", width)
    .attr("height", height);

function drawLegend() {

    var legendColorSideSize = 15;
    var legendColorSquareX = 25;
    var legendColorSquareY = 240;
    var legendIncrement = 20;
    var legendTagX = legendColorSquareX + 20;
    var legendTagY = legendColorSquareY + 12;

    d3.select("svg")
        .append("text")
        .attr("id", "legendTagRepublican")
        .attr("x", legendTagX)
        .attr("y", legendTagY)
        .attr("font-family", "Verdana")
        .attr("font-size", 10)
        .html("Yes");


    d3.select("svg")
        .append("rect")
        .attr("id", "legendColorRepublican")
        .attr("x", legendColorSquareX)
        .attr("y", legendColorSquareY)
        .attr("height", legendColorSideSize)
        .attr("width", legendColorSideSize)
        .attr("fill", "#E70018");

    d3.select("svg")
        .append("text")
        .attr("id", "legendTagDemocrat")
        .attr("x", legendTagX)
        .attr("y", legendTagY + legendIncrement)
        .attr("font-family", "Verdana")
        .attr("font-size", 10)
        .html("No");

    d3.select("svg")
        .append("rect")
        .attr("id", "legendColorDemocrat")
        .attr("x", legendColorSquareX)
        .attr("y", legendColorSquareY + legendIncrement)
        .attr("height", legendColorSideSize)
        .attr("width", legendColorSideSize)
        .attr("fill", "#00B6BD");

    d3.select("svg")
        .append("text")
        .attr("id", "legendTagSelected")
        .attr("x", legendTagX)
        .attr("y", 291)
        .attr("font-family", "Verdana")
        .attr("font-size", 10)
        .html("Selected");

    d3.select("svg")
        .append("rect")
        .attr("id", "legendColorSelected")
        .attr("x", legendColorSquareX)
        .attr("y", legendColorSquareY + (legendIncrement * 2))
        .attr("height", legendColorSideSize)
        .attr("width", legendColorSideSize)
        .attr("fill", "#07C230");

}

// Map Project with translations to optimally display state map
var albersProjection = d3.geo.mercator()
    .scale(5650)
    .translate([8320, 3900]);

var geoPath = d3.geo.path()
    .projection(albersProjection);

// Map Colors
var republicanColor = "#E70018";
var selectedRepublicanColor = "#DB1F1E";
var democratColor = "#00B6BD";
var selectedDemocratColor = "#";
var independentColor = "#AAADAD";
var selectedIndependentColor = "#";
var selectedColor = "#07C230";
var mouseOverSelectedColor = "#147A26";
var strokeColor = "#333333";
var mouseOverColor = "#E900E5";

// Adds the correct suffix to the legislator's district number
function parseDistrictString(district) {
    var lastDigit = district.slice(-1);
    var suffix = "";
    if (lastDigit == 0 || lastDigit >= 4 ) {
        suffix = "th";
    }
    else if (lastDigit == 3) {
        suffix = "rd";
    }
    else if (lastDigit == 2) {
        suffix = "nd";
    }
    else {
        suffix = "st";
    }
    return district + suffix;
}

//Formats the legislator's address into a more readable form (Revise, seems pointless with new updates)
function formatAddress(address) {
    if (address.indexOf("N.C. House") != -1) {
        var repLoc = address.indexOf('ves') + 3;
        address = address.substr(0, repLoc) + "<br>" + address.substr(repLoc + 1);
        return address;
    }
    else if (address.indexOf("N.C. Senate") != -1) {
        var senateLoc = address.indexOf('ate') + 3;
        address = address.substr(0, senateLoc) + "<br>" + address.substr(senateLoc + 1);
        return address;
    }
    else {
        var firstComma = address.indexOf(',');
        address = address.substr(0, firstComma) + "<br>" + address.substr(firstComma + 1);
        return address;
    }
}

// Returns the party's color (Clunky, need to revise approach)
function getPartyColor(partyString) {
    var republicanColor = "#E31C12";
    var selectedRepublicanColor = "#DB1F1E";
    // var democratColor = "#1840DE";
    var democratColor = "#308BE3";
    var selectedDemocratColor = "#";
    var independentColor = "#AAADAD";
    var selectedIndependentColor = "#";
    var selectedColor = "#07C230";
    if (partyString == "D" || partyString == "Democrat" || partyString == "Democratic") {
        return democratColor;
    }
    else if (partyString == "R" || partyString == "Republican") {
        return republicanColor;
    }
    else {
        return independentColor;
    }
}

function getVoteColor(vote) {
    var yesColor = "#E31C12";
    var selectedRepublicanColor = "#DB1F1E";
    // var democratColor = "#1840DE";
    var noColor = "#308BE3";
    var selectedDemocratColor = "#";
    var independentColor = "#AAADAD";
    var selectedIndependentColor = "#";
    var selectedColor = "#07C230";
    if (vote == "No") {
        return noColor;
    }
    else {
        return yesColor;
    }
}

// Displays congressional district map
function displayAchaMap() {
    // clearLegData();
    displayAchaData(1);
    document.getElementById("mapTitle").innerHTML = "NC Congressional Districts Map";
    document.getElementById("zipForm").style.display = "none";
    document.getElementById("zipFormSubmit").onclick = function() {getLegislatorByZip('con', getZipInput());};
    document.getElementById("zipCodeInput").onkeyup = function() {getZipOnEnter(event, 'con')};
    activateToggleButton("conMapToggle");
}

//Clears all displayed legislator info
function clearLegData() {
    document.getElementById("addressHeader").innerHTML = "";
    document.getElementById("legTitle").innerHTML = "";
    document.getElementById("repNameText").innerHTML = "";
    document.getElementById("districtText").innerHTML = "";
    document.getElementById("partyText").innerHTML = "";
    document.getElementById("nclegURLText").innerHTML = "";
    document.getElementById("nclegURLText").href = "";
    document.getElementById("repPhoto").src = "";
    document.getElementById("addressContainer").innerHTML = "";
}

// Displays information about selected congress member
function displayAchaData(district) {
    con = conReps[district]
    if (selectedConDistrict > 0) {
        d3.select("#c" + selectedConDistrict).attr("fill", getVoteColor(achaRepVotes[selectedConDistrict]));
        d3.select("#c" + selectedConDistrict).attr("onmouseover", 'd3.select(c' + selectedConDistrict + ').attr("fill", "' + mouseOverColor + '")')
            .attr("onmouseout", 'd3.select(c' + selectedConDistrict + ').attr("fill", "' + getVoteColor(achaRepVotes[selectedConDistrict]) + '")');
    }
    selectedConDistrict = district
    d3.select("#c" + district).attr("fill", selectedColor);
    d3.select("#c" + district).attr("onmouseover", 'd3.select(c' + district + ').attr("fill", "' + mouseOverSelectedColor + '")');
    d3.select("#c" + district).attr("onmouseout", 'd3.select(c' + district + ').attr("fill", "' + selectedColor + '")');
    document.getElementById("repPhoto").src = "";
    document.getElementById("legTitle").innerHTML = con.title;
    document.getElementById("repNameText").innerHTML = con.fullName;
    document.getElementById("districtText").innerHTML = parseDistrictString(con.district) + " District<br>";
    document.getElementById("partyText").innerHTML = con.party == "R" ? "Republican" : "Democrat";
    document.getElementById("nclegURLText").innerHTML = con.title + "'s Website";
    document.getElementById("nclegURLText").href = con.website;
    document.getElementById("repPhoto").src = "img/congress/" + con.district + ".jpg";
    document.getElementById("addressHeader").innerHTML = "Addresses";
    document.getElementById("addressContainer").innerHTML = "";
    for (var i = 0; i < con.offices.length; i++) {
        var addressDiv = document.createElement("div");
        var phone = con.offices[i].phone != null ? "<img class = 'teleIcon' src = 'icons/phone/phone2.png'>  " + con.offices[i].phone + "<br>" : "";
        var fax = con.offices[i].fax != null ? "<img class = 'teleIcon' src = 'icons/fax/fax.png'>  " + con.offices[i].fax + "<br>" : "";
        addressDiv.className = "address";
        addressDiv.id = "rAddress" + i;
        document.getElementById("addressContainer").appendChild(addressDiv);
        document.getElementById("rAddress" + i).innerHTML = con.offices[i].title + "<br>" + con.offices[i].address + "<br>" + con.offices[i].city + ", " + con.offices[i].state + " " + con.offices[i].zip + "<br>" + phone + fax;
    }
    populateIconList(con);
}


//Populates social media / contact icon list based on data provided
function populateIconList(legislator) {
    if (legislator.facebook != "") {
        document.getElementById("facebookIcon").style.display = "block";
        document.getElementById("facebookLink").href = "http://facebook.com/" + legislator.facebook;
    }
    else {
        document.getElementById("facebookIcon").style.display = "none";
        document.getElementById("facebookLink").href = "";
    }
    if (legislator.youtube != "") {
        document.getElementById("youtubeIcon").style.display = "block";
        document.getElementById("youtubeLink").href = "http://youtube.com/" + legislator.youtube;
    }
    else {
        document.getElementById("youtubeIcon").style.display = "none";
        document.getElementById("youtubeLink").href = "";
    }
    if (legislator.twitter != "") {
        document.getElementById("twitterIcon").style.display = "block";
        document.getElementById("twitterLink").href = "http://twitter.com/" + legislator.twitter;
    }
    else {
        document.getElementById("twitterIcon").style.display = "none";
        document.getElementById("twitterLink").href = "";
    }
    if (legislator.email != "") {
        document.getElementById("emailIcon").style.display = "block";
        document.getElementById("emailLink").href = "mailto:" + legislator.email;
    }
    else {
        document.getElementById("emailIcon").style.display = "none";
        document.getElementById("emailLink").href = "";
    }
}


//Draws NC Congressional district map based on geoJSON data
function drawAchaMap() {
    ncCongressReps.results.forEach(function(rep){
        conReps[rep.district] = {
            "party": rep.party,
            "fullName": rep.first_name + " " + rep.last_name,
            "gender": rep.gender,
            "title": rep.gender == "M" ? "Congressman":"Congresswoman",
            "website": rep.url,
            "facebook": rep.facebook_account,
            "fax": rep.fax,
            "phone": rep.phone,
            "twitter": rep.twitter_account,
            "youtube": rep.youtube_account,
            "district": rep.district,
            "id": rep.id,
            "offices": rep.offices,
            "email": rep.email
        };
    });

    d3.json("ncsgeo/ncdccongressdistrictsmin.json", function (json) {
        gc.selectAll("path")
            .data(json.features)
            .enter()
            .append("path")
            .attr("stroke", strokeColor)
            .each(function(d, i) {
                var district = d.properties.District;
                d3.select(this)
                    .attr("id", "c" + district)
                    .attr("fill", getVoteColor(achaRepVotes[district]))
                    .attr("onmouseover", 'd3.select(c' + district + ').attr("fill", "' + mouseOverColor + '")')
                    .attr("onmouseout", 'd3.select(c' + district + ').attr("fill", "' + getVoteColor(achaRepVotes[district]) + '")');
                document.getElementById("c" + district).onclick = function(){displayAchaData(district)};
            })
            .attr("d", geoPath);
    });
}

function initMap() {
    drawAchaMap();
    console.log("init");
    document.getElementById("conMap").style.display = "block";
    drawLegend();
}

initMap();

