/**
 * Created by andrewpitts on 4/11/17.
 */

// Used URLs for AJAX calls
var ncSenateURL = "https://openstates.org/api/v1/legislators/?state=nc&chamber=upper";
var ncRepURL = "https://openstates.org/api/v1/legislators/?state=nc&chamber=lower";

// List of legislator objects
var houseReps = {};
var senators = {};
var conReps = {};

// Variables to track which legislative district is selected
var selectedRepDistrict = 0;
var selectedSenDistrict = 0;
var selectedConDistrict = 0;

// Map dimensions
var width = 900, height = 450;


//Adds <g> element for containing map SVG coordinates.
//State House of Representatives <g> element
var gr = d3.select("#map")
    .append("g")
    .attr("id", "repMap")
    .attr("width", width)
    .attr("height", height);

//State Senate <g> element
var gs = d3.select("#map")
    .append("g")
    .attr("id", "senMap")
    .attr("width", width)
    .attr("height", height);

//State Congressionial Districts <g> element
var gc = d3.select("#map")
    .append("g")
    .attr("id", "conMap")
    .attr("width", width)
    .attr("height", height);

// Map Project with translations to optimally display state map
var albersProjection = d3.geo.mercator()
    .scale(5650)
    .translate([8320, 3900]);
    // .scale(8500);
    // .translate([-1200, -40]);

var geoPath = d3.geo.path()
    .projection(albersProjection);

// Map Colors
var republicanColor = "#E70018";
var selectedRepublicanColor = "#DB1F1E";
var democratColor = "#145AFF";
var selectedDemocratColor = "#";
var independentColor = "#AAADAD";
var selectedIndependentColor = "#";
var selectedColor = "#07C230";
var strokeColor = "#333333";

// Modifies legislator's photo url to the url of a smaller thumbnail photo
function getThumbnailURL(url, house) {
    var lastSlashIndex = url.indexOf("hiRes") + 6;
    var fileName = url.substr(lastSlashIndex);
    var thumbnailURL = "http://www.ncga.state.nc.us/" + house + "/pictures/" + fileName;
    return thumbnailURL;
}

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
    var republicanColor = "#DB1F1E";
    var selectedRepublicanColor = "#DB1F1E";
    var democratColor = "#1840DE";
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

//Displays house district map
function displayRepMap() {
    clearLegData();
    displayRepData(1);
    toggleViewById("repMap");
    document.getElementById("mapTitle").innerHTML = "NC General Assembly - House of Representatives District Map";
    document.getElementById("zipForm").style.display = "block";
    document.getElementById("zipFormSubmit").onclick = function() {getLegislatorByZip('rep', getZipInput())};
    activateToggleButton("repMapToggle");
}

// Displays senate district map
function displaySenMap() {
    clearLegData();
    displaySenData(1);
    toggleViewById("senMap");
    document.getElementById("mapTitle").innerHTML = "NC General Assembly - Senate Map";
    document.getElementById("zipForm").style.display = "block";
    document.getElementById("zipFormSubmit").onclick = function() {getLegislatorByZip('sen', getZipInput());};
    activateToggleButton("senMapToggle");
}

// Displays congressional district map
function displayConMap() {
    clearLegData();
    displayConData(1);
    toggleViewById("conMap");
    document.getElementById("mapTitle").innerHTML = "NC Congressional Districts Map";
    document.getElementById("zipForm").style.display = "none";
    document.getElementById("zipFormSubmit").onclick = function() {getLegislatorByZip('con', getZipInput());};
    activateToggleButton("conMapToggle");
}

//Hides the maps and displays an about page
function displayAboutPage() {
    // document.getElementById("legimapMainContainer").style.display = "none";
    // document.getElementById("aboutContainer").style.display = "block";
    toggleViewById("about");
}

function activateToggleButton(buttonId) {
    document.getElementById("senMapToggle").className = "mapToggle";
    document.getElementById("repMapToggle").className = "mapToggle";
    document.getElementById("conMapToggle").className = "mapToggle";
    // document.getElementById("aboutToggle").className = "mapToggle";
    document.getElementById(buttonId).className += " activeMapToggle";
}

function toggleViewById(id) {
    if (id == "about") {
        activateToggleButton("aboutToggle");
        document.getElementById("legimapMainContainer").style.display = "none";
        document.getElementById("aboutContainer").style.display = "block";
    }
    else {
        // document.getElementById("aboutContainer").style.display = "none";
        document.getElementById("legimapMainContainer").style.display = "block";
        document.getElementById("senMap").style.display = "none";
        document.getElementById("repMap").style.display = "none";
        document.getElementById("conMap").style.display = "none";
        document.getElementById(id).style.display = "block";
    }
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

//Displays information about selected state representative
function displayRepData(district) {

    rep = houseReps[district];
    document.getElementById("repPhoto").src = "";
    document.getElementById("legTitle").innerHTML = "Representative";
    document.getElementById("repNameText").innerHTML = rep.fullName;
    document.getElementById("emailLink").href = rep.email;
    document.getElementById("districtText").innerHTML = parseDistrictString(rep.district) + " District<br>";
    document.getElementById("partyText").innerHTML = rep.party;
    document.getElementById("nclegURLText").innerHTML = "Represenative's NC Legislature Page";
    document.getElementById("nclegURLText").href = rep.ncLegURL;
    document.getElementById("repPhoto").src = getThumbnailURL(rep.photoURL, "House");
    var localPhone = rep.offices[0].phone != null ? "<img class = 'teleIcon' src = 'icons/phone/phone2.png'>  " + rep.offices[0].phone : "";
    var capitalPhone = rep.offices[1].phone != null ? "<img class = 'teleIcon' src = 'icons/phone/phone2.png'>  " + rep.offices[1].phone : "";
    document.getElementById("addressHeader").innerHTML = "Addresses";
    document.getElementById("addressContainer").innerHTML = "";
    for (var i = 0; i < rep.offices.length; i++) {
        var phone = i % 2 == 0 ? localPhone : capitalPhone;

        var addressDiv = document.createElement("div");
        addressDiv.className = "address";
        addressDiv.id = "rAddress" + i;
        document.getElementById("addressContainer").appendChild(addressDiv);
        document.getElementById("rAddress" + i).innerHTML = rep.offices[i].name + "<br><br>" + formatAddress(rep.offices[i].address) + "<br>" + phone;
    }
    populateIconList(rep);
}

// Displays information about selected state senator
function displaySenData(district) {
    sen = senators[district];
    document.getElementById("repPhoto").src = "";
    document.getElementById("legTitle").innerHTML = "Senator";
    document.getElementById("senMapToggle").class = "mapToggle activeMapToggle";
    document.getElementById("repNameText").innerHTML = sen.fullName;
    document.getElementById("districtText").innerHTML = parseDistrictString(sen.district) + " District<br>";
    document.getElementById("partyText").innerHTML = sen.party;
    document.getElementById("nclegURLText").innerHTML = "Senator's NC Legislature Page";
    document.getElementById("nclegURLText").href = sen.ncLegURL;
    document.getElementById("repPhoto").src = getThumbnailURL(sen.photoURL, "Senate");
    var localPhone = sen.offices[0].phone != null ? "<img class = 'teleIcon' src = 'icons/phone/phone2.png'>  " + sen.offices[0].phone : "";
    var capitalPhone = sen.offices[1].phone != null ? "<img class = 'teleIcon' src = 'icons/phone/phone2.png'>  " + sen.offices[1].phone : "";
    document.getElementById("addressHeader").innerHTML = "Addresses";
    document.getElementById("addressContainer").innerHTML = "";
    for (var i = 0; i < sen.offices.length; i++) {
        var addressDiv = document.createElement("div");
        var phone = i % 2 == 0 ? localPhone : capitalPhone;
        addressDiv.className = "address";
        addressDiv.id = "rAddress" + i;
        document.getElementById("addressContainer").appendChild(addressDiv);
        document.getElementById("rAddress" + i).innerHTML = sen.offices[i].name + "<br><br>" + formatAddress(sen.offices[i].address) + "<br>" + phone;
    }
    populateIconList(sen);
}

// Displays information about selected congress member
function displayConData(district) {
    con = conReps[district]
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
        document.getElementById("emailLink").href = "emailto:" + legislator.email;
    }
    else {
        document.getElementById("emailIcon").style.display = "none";
        document.getElementById("emailLink").href = "";
    }
}

//Draws NC House district map based on geoJSON data
function drawRepMap() {
    var xhttp = new XMLHttpRequest();
    xhttp.onreadystatechange = function() {
        if (this.readyState == 4 && this.status == 200) {
            var repJSON = JSON.parse(this.responseText);
            repJSON.forEach(function(rep){
                houseReps[rep.district] = {
                    "party": rep.party,
                    "fullName": rep.full_name,
                    "id": rep.leg_id,
                    "level": rep.level,
                    "offices": rep.offices,
                    "photoURL": rep.photo_url,
                    "ncLegURL": rep.url,
                    "email": rep.email,
                    "chamber": rep.chamber,
                    "active": rep.active,
                    "district": rep.district,
                    "nimspCandID": rep.nimsp_candidate_id,
                    "nimspID": rep.nimsp_id,
                    "facebook": "",
                    "twitter": "",
                    "youtube": ""
                };

            });
            d3.json("ncsgeo/ncrepdistrictsmin.json", function (json) {
                gr.selectAll("path")
                    .data(json.features)
                    .enter()
                    .append("path")
                    .attr("stroke", strokeColor)
                    .each(function(d, i) {
                        var district = d.properties.District;
                        d3.select(this)
                            .attr("id", "r" + district)
                            .attr("fill", getPartyColor(houseReps[district].party))
                            .attr("onmouseover", 'd3.select(r' + district + ').attr("fill", "' + selectedColor + '")')
                            .attr("onmouseout", 'd3.select(r' + district + ').attr("fill", "' + getPartyColor(houseReps[district].party) + '")');
                        document.getElementById("r" + district).onclick = function(){displayRepData(district)};

                    })
                    .attr("d", geoPath);
                displayRepData(1);
            });
        }
    };
    xhttp.open("GET", ncRepURL, true);
    xhttp.send();
}

//Draws NC Senate district map based on geoJSON data
function drawSenMap() {
    var xhttp = new XMLHttpRequest();
    xhttp.onreadystatechange = function() {
        if (this.readyState == 4 && this.status == 200) {
            var senJSON = JSON.parse(this.responseText);
            senJSON.forEach(function(sen){
                senators[sen.district] = {
                    "party": sen.party,
                    "fullName": sen.full_name,
                    "id": sen.leg_id,
                    "level": sen.level,
                    "offices": sen.offices,
                    "photoURL": sen.photo_url,
                    "ncLegURL": sen.url,
                    "email": sen.email,
                    "chamber": sen.chamber,
                    "active": sen.active,
                    "district": sen.district,
                    "nimspCandID": sen.nimsp_candidate_id,
                    "nimspID": sen.nimsp_id,
                    "facebook": "",
                    "twitter": "",
                    "youtube": ""
                };
            });

            d3.json("ncsgeo/ncsendistrictsmin.json", function (json) {
                console.log(json);
                gs.selectAll("path")
                    .data(json.features)
                    .enter()
                    .append("path")
                    .attr("stroke", strokeColor)
                    .each(function(d, i) {
                        var district = d.properties.District;
                        d3.select(this)
                            .attr("id", "s" + district)
                            .attr("fill", getPartyColor(senators[district].party))
                            .attr("onmouseover", 'd3.select(s' + district + ').attr("fill", "' + selectedColor + '")')
                            .attr("onmouseout", 'd3.select(s' + district + ').attr("fill", "' + getPartyColor(senators[district].party) + '")');
                        document.getElementById("s" + district).onclick = function(){displaySenData(district)};
//                                        .attr("onmouseout", 'd3.select(s' + district + ').attr("fill", "#ffffff")');
                    })
                    .attr("d", geoPath);
            });
        }
    };
    xhttp.open("GET", ncSenateURL, true);
    xhttp.send();
}


//Draws NC Congressional district map based on geoJSON data
function drawConMap() {
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
                    .attr("fill", getPartyColor(conReps[district].party))
                    .attr("onclick", "console.log('" + conReps[district].rep + "')")
                    .attr("onmouseover", 'd3.select(c' + district + ').attr("fill", "' + selectedColor + '")')
                    .attr("onmouseout", 'd3.select(c' + district + ').attr("fill", "' + getPartyColor(conReps[district].party) + '")');
                document.getElementById("c" + district).onclick = function(){displayConData(district)};
            })
            .attr("d", geoPath);
    });
}

function isZipValid(zip) {
    if (isNaN(zip)) {
        return false;
    }
    else if (zip < 27006 || zip > 28909){
        return false;
    }
    return true;
}

function getZipInput() {
    return document.getElementById("zipCodeInput").value;
}

function getLegislatorByZip(chamber, zip) {
    if (isZipValid(zip)) {
        getLegislatorDataByZip(chamber, zip);
    }
    else {
        console.log("Invalid NC Zip");
        // Display this in a tooltip
    }
}

function getLegislatorDataByZip(chamber, zip) {
    if (chamber == "con") {
        console.log("Not implemented yet. :(");
    }
    var geoURL = "https://openstates.org/api/v1/legislators/geo/?lat=" + zipCodes[zip].lat + "&long=" + zipCodes[zip].long + "&fields=district";
    var xhttp = new XMLHttpRequest();
    xhttp.onreadystatechange = function() {
        if (this.readyState == 4 && this.status == 200) {
            var responseJSON = JSON.parse(this.responseText);
            if (chamber == "rep") {
                displayRepData(responseJSON[0].district);
                // d3.select("#r" + responseJSON[0].district)
            }
            else if (chamber == "sen") {
                displaySenData(responseJSON[1].district);
                // d3.select("#s" + responseJSON[1].district)
            }
        }
    }
    xhttp.open("GET", geoURL, true);
    xhttp.send();

}

// Draws maps
function initMaps() {
    drawRepMap();
    drawSenMap();
    drawConMap();
}

initMaps();