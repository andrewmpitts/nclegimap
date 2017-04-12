/**
 * Created by andrewpitts on 4/11/17.
 */
var openStatesURL = "https://openstates.org/api/v1/METHOD/";
var ncMetadataURL = "openstates.org/api/v1/metadata/nc/";
var ncLegislatorsURL = "https://openstates.org/api/v1/legislators/?state=nc";
var ncSenateURL = "https://openstates.org/api/v1/legislators/?state=nc&chamber=upper";
var ncRepURL = "https://openstates.org/api/v1/legislators/?state=nc&chamber=lower";
var billLookupURL = "https://openstates.org/api/v1/bills/NCB00010747/";
var hb2BillURL = "https://openstates.org/api/v1/bills/NCB00009985/"; //Detailed bill example
var billLookupURL = "openstates.org/api/v1/bills/?state=nc&q=" //+ query
var ncCongressURL = "http://apitts.com/"
var billIds = [];

var repModel = {};
var senModel = {};
var conModel = {};

var selectedRepDistrict = 0;
var selectedSenDistrict = 0;
var selectedConDistrict = 0;

var width = 900, height = 450;

var gr = d3.select("#map")
    .append("g")
    .attr("id", "repMap")
    .attr("width", width)
    .attr("height", height);

var gs = d3.select("#map")
    .append("g")
    .attr("id", "senMap")
    .attr("width", width)
    .attr("height", height);

var gc = d3.select("#map")
    .append("g")
    .attr("id", "conMap")
    .attr("width", width)
    .attr("height", height);

var albersProjection = d3.geo.albersUsa()
    .scale(7000)
    .translate([-1200, -40]);

var geoPath = d3.geo.path()
    .projection(albersProjection);

var republicanColor = "#DB1F1E";
var selectedRepublicanColor = "#DB1F1E";
var democratColor = "#1840DE";
var selectedDemocratColor = "#";
var independentColor = "#AAADAD";
var selectedIndependentColor = "#";
var selectedColor = "#07C230";

var photoHiResURL = "http://www.ncga.state.nc.us/House/pictures/hiRes/719.jpg";

function getThumbnailURL(url, house) {
    var lastSlashIndex = url.indexOf("hiRes") + 6;
    var fileName = url.substr(lastSlashIndex);
    var thumbnailURL = "http://www.ncga.state.nc.us/" + house + "/pictures/" + fileName;
    return thumbnailURL;
}

function toggleMap(map) {
    if (map == "rep") {
        clearLegData();
        displayRepData(1);
        document.getElementById("senMap").style.display = "none";
        document.getElementById("conMap").style.display = "none";
        document.getElementById("mapTitle").innerHTML = "NC General Assembly - House of Representatives District Map";
        document.getElementById("repMap").style.display = "block";
        document.getElementById("congressMapToggle").className = "mapToggle";
        document.getElementById("senMapToggle").className = "mapToggle";
        document.getElementById("repMapToggle").className = "mapToggle activeMapToggle";
    }
    else if (map == "sen") {
        clearLegData();
        displaySenData(1)
        document.getElementById("conMap").style.display = "none";
        document.getElementById("repMap").style.display = "none";
        document.getElementById("mapTitle").innerHTML = "NC General Assembly - Senate Map";
        document.getElementById("senMap").style.display = "block";
        document.getElementById("congressMapToggle").className = "mapToggle";
        document.getElementById("senMapToggle").className = "mapToggle activeMapToggle";
        document.getElementById("repMapToggle").className = "mapToggle";

    }
    else if (map == "con") {
        clearLegData();
        displayConData(1);
        document.getElementById("senMap").style.display = "none";
        document.getElementById("repMap").style.display = "none";
        document.getElementById("mapTitle").innerHTML = "NC Congressional Districts Map";
        document.getElementById("conMap").style.display = "block";
        document.getElementById("congressMapToggle").className = "mapToggle activeMapToggle";
        document.getElementById("senMapToggle").className = "mapToggle";
        document.getElementById("repMapToggle").className = "mapToggle";
    }
}

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

function parseAddress(address) {
    if (address.indexOf("N.C. House") != -1) {
        var repLoc = address.indexOf('ves') + 3;
//            address[repLoc] = "<br>";
        address = address.substr(0, repLoc) + "<br>" + address.substr(repLoc + 1);
        return address;
    }
    else if (address.indexOf("N.C. Senate") != -1) {
        var senateLoc = address.indexOf('ate') + 3;
//            address[firstComma] = "<br>";
        address = address.substr(0, senateLoc) + "<br>" + address.substr(senateLoc + 1);
        return address;
    }
    else {
        var firstComma = address.indexOf(',');
        var secondComma = address.ind
//            address[firstComma] = "<br>";
        address = address.substr(0, firstComma) + "<br>" + address.substr(firstComma + 1);
        return address;
    }
}

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

function clearLegData() {
    document.getElementById("addressHeader").innerHTML = "";
    document.getElementById("legTitle").innerHTML = "";
    document.getElementById("repNameText").innerHTML = "";
    // document.getElementById("emailLi").style.display = "";
    // document.getElementById("emailLink").innerHTML = "";
    // document.getElementById("emailLink").href = "";
    document.getElementById("districtText").innerHTML = "";
    document.getElementById("partyText").innerHTML = "";
    document.getElementById("nclegURLText").innerHTML = "";
    document.getElementById("nclegURLText").href = "";
    document.getElementById("repPhoto").src = "";
    var localPhone = "";
    var capitalPhone = "";
    document.getElementById("addressContainer").innerHTML = "";
//        document.getElementById("localAddress").innerHTML = "";
//        document.getElementById("capitalAddress").innerHTML = "";
}

function displayRepData(district) {
    rep = repModel[district];
//        if (selectedRepDistrict != 0) {
//            document.getElementById("r" + district).fill(getPartyColor(rep.party));
//        }
//        selectedRepDistrict = district;
    document.getElementById("legTitle").innerHTML = "Representative";
    document.getElementById("repNameText").innerHTML = rep.fullName;
    // document.getElementById("emailLi").style.display = "block";
    // document.getElementById("emailLink").innerHTML = "Representative's E-Mail";
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

//            var addressText =
        document.getElementById("addressContainer").appendChild(addressDiv);
        document.getElementById("rAddress" + i).innerHTML = rep.offices[i].name + "<br><br>" + parseAddress(rep.offices[i].address) + "<br>" + phone;
    }
    // document.getElementById("socialMediaIconContainer").style.display = "none";

    if (rep.email != "") {
        document.getElementById("emailLink").href = "mailto:" + rep.email;
        document.getElementById("emailIcon").style.display = "block";
    }
    else {
        document.getElementById("emailLink").href = "";
        document.getElementById("emailIcon").style.display = "none";
    }
//        document.getElementById("localAddress").innerHTML = rep.offices[0].name + "<br><br>" + parseAddress(rep.offices[0].address) + "<br>" + localPhone;
//        document.getElementById("capitalAddress").innerHTML = rep.offices[1].name + "<br><br>" + parseAddress(rep.offices[1].address) + "<br>Phone: " + rep.offices[1].phone;
}

function displaySenData(district) {
    sen = senModel[district];
    document.getElementById("legTitle").innerHTML = "Senator";
    document.getElementById("senMapToggle").class = "mapToggle activeMapToggle";
    document.getElementById("repNameText").innerHTML = sen.fullName;
    // document.getElementById("emailLi").style.display = "block";
    // document.getElementById("emailLink").innerHTML = sen.email;
    // document.getElementById("emailLink").href = sen.email;
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
        document.getElementById("rAddress" + i).innerHTML = sen.offices[i].name + "<br><br>" + parseAddress(sen.offices[i].address) + "<br>" + phone;
    }
    if (sen.email != "") {
        document.getElementById("emailLink").href = "mailto:" + sen.email;
        document.getElementById("emailIcon").style.display = "block";
    }
    else {
        document.getElementById("emailLink").href = "";
        document.getElementById("emailIcon").style.display = "none";
    }
    // document.getElementById("socialMediaIconContainer").style.display = "none";
//        document.getElementById("localAddress").innerHTML = sen.offices[0].name + "<br><br>" + parseAddress(sen.offices[0].address) + "<br>" + localPhone;
//        document.getElementById("capitalAddress").innerHTML = sen.offices[1].name + "<br><br>" + parseAddress(sen.offices[1].address) + "<br>" + capitalPhone;
}



function drawRepMap() {
    var xhttp = new XMLHttpRequest();
    xhttp.onreadystatechange = function() {
        if (this.readyState == 4 && this.status == 200) {
            var repJSON = JSON.parse(this.responseText);
//                var repModel = {};
            console.log(repJSON);
            repJSON.forEach(function(rep){
                repModel[rep.district] = {
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
                    "nimspID": rep.nimsp_id
                };

            });
            d3.json("ncsgeo/ncrepdistrictsmin.json", function (json) {
                gr.selectAll("path")
                    .data(json.features)
                    .enter()
                    .append("path")
                    .attr("stroke", "#222222")
                    .each(function(d, i) {
                        var district = d.properties.District;
//                                console.log(repModel[district])
                        d3.select(this)
                            .attr("id", "r" + district)
                            .attr("fill", getPartyColor(repModel[district].party))
                            .attr("onmouseover", 'd3.select(r' + district + ').attr("fill", "' + selectedColor + '")')
                            .attr("onmouseout", 'd3.select(r' + district + ').attr("fill", "' + getPartyColor(repModel[district].party) + '")');
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
drawRepMap();


function drawSenMap() {
    var xhttp = new XMLHttpRequest();
    xhttp.onreadystatechange = function() {
        if (this.readyState == 4 && this.status == 200) {
            var senJSON = JSON.parse(this.responseText);
//                var senModel = {};
            senJSON.forEach(function(sen){
                senModel[sen.district] = {
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
                    "nimspID": sen.nimsp_id
                };
            });

            d3.json("ncsgeo/ncsendistrictsmin.json", function (json) {
                console.log(json);
                gs.selectAll("path")
                    .data(json.features)
                    .enter()
                    .append("path")
                    //                            .attr("fill", "#888888")
                    .attr("stroke", "#000000")
                    .each(function(d, i) {
                        var district = d.properties.District;
                        d3.select(this)
                            .attr("id", "s" + district)
                            .attr("fill", getPartyColor(senModel[district].party))
                            .attr("onmouseover", 'd3.select(s' + district + ').attr("fill", "' + selectedColor + '")')
                            .attr("onmouseout", 'd3.select(s' + district + ').attr("fill", "' + getPartyColor(senModel[district].party) + '")');
                        document.getElementById("s" + district).onclick = function(){displaySenData(district)};
//                                        .attr("onmouseout", 'd3.select(s' + district + ').attr("fill", "#ffffff")');
                    })
                    .attr("d", geoPath);
//                            displaySenData(repModel[1]);
            });
        }
    };
    xhttp.open("GET", ncSenateURL, true);
    xhttp.send();
}
drawSenMap();

function displayConData(district) {
    con = conModel[district]
    document.getElementById("legTitle").innerHTML = con.title;
    document.getElementById("repNameText").innerHTML = con.fullName;
    // document.getElementById("emailLi").style.display = "none";
//        document.getElementById("emailLink").innerHTML = con.email;
//        document.getElementById("emailLink").href = con.email;
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

    document.getElementById("socialMediaIconContainer").style.display = "block";
    if (con.facebook != "") {
        document.getElementById("facebookIcon").style.display = "block";
        document.getElementById("facebookLink").href = "http://facebook.com/" + con.facebook;

    }
    else {
        document.getElementById("facebookIcon").style.display = "none";
        document.getElementById("facebookLink").href = "";
    }
    if (con.youtube != "") {
        document.getElementById("youtubeIcon").style.display = "block";
        document.getElementById("youtubeLink").href = "http://youtube.com/" + con.youtube;
    }
    else {
        document.getElementById("youtubeIcon").style.display = "none";
        document.getElementById("youtubeLink").href = "";
    }
    if (con.twitter != "") {
        document.getElementById("twitterIcon").style.display = "block";
        document.getElementById("twitterLink").href = "http://twitter.com/" + con.twitter;
    }
    else {
        document.getElementById("twitterIcon").style.display = "none";
        document.getElementById("twitterLink").href = "";
    }
    if (con.email != "") {
        document.getElementById("emailIcon").style.display = "block";
        document.getElementById("emailLink").href = "emailto:" + con.email;
    }
    else {
        document.getElementById("emailIcon").style.display = "none";
        document.getElementById("emailLink").href = "";
    }
}

function drawConMap() {
    ncCongressReps.results.forEach(function(rep){
        conModel[rep.district] = {
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
            .attr("stroke", "#444444")
            .each(function(d, i) {
                var district = d.properties.District;
                d3.select(this)
                    .attr("id", "c" + district)
                    .attr("fill", getPartyColor(conModel[district].party))
                    //                              .attr("onmouseover", 'd3.select(d' + district + ').attr("fill", "' + democratColor + '")')
                    .attr("onclick", "console.log('" + conModel[district].rep + "')")
                    .attr("onmouseover", 'd3.select(c' + district + ').attr("fill", "' + selectedColor + '")')
                    .attr("onmouseout", 'd3.select(c' + district + ').attr("fill", "' + getPartyColor(conModel[district].party) + '")');
//                              .attr("onmouseout", 'd3.select(d' + district + ').attr("fill", "#ffffff")');
                document.getElementById("c" + district).onclick = function(){displayConData(district)};
            })
            .attr("d", geoPath);
    });
}

drawConMap();