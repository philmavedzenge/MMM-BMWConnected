Module.register('MMM-BMWConnected', {

  defaults: {
    apiBase: "www.bmw-connecteddrive.co.uk",
    refresh: 20,
    vehicleAngle: 300,
    distance: "miles",
    debug: false
  },

  getStyles: function () {
    return ["MMM-BMWConnected.css"];
  },

  getScripts: function () {
    return ["moment.js"];
  },

  capFirst: function (string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
  },

  start: function () {
    Log.info('Starting module: ' + this.name);
    this.sendSocketNotification('MMM-BMWCONNECTED-CONFIG', this.config);
    this.bmwInfo = {};
    this.getInfo();
    this.timer = null;
  },

  getInfo: function () {
    clearTimeout(this.timer);
    this.timer = null;
   
    //added this part to rotate the car image
    this.config.vehicleAngle = (this.config.vehicleAngle+50)%360;
    console.log("Car angle "+this.config.vehicleAngle);
    this.sendSocketNotification('MMM-BMWCONNECTED-CONFIG', this.config);
    //end rotate car image
    
    this.sendSocketNotification("MMM-BMWCONNECTED-GET", {
      instanceId: this.identifier
    });

    var self = this;
    this.timer = setTimeout(function () {
      self.getInfo();
    }, this.config.refresh * 60 * 1000);
  },

  socketNotificationReceived: function (notification, payload) {

    if (notification == "MMM-BMWCONNECTED-RESPONSE" + this.identifier && Object.keys(payload).length > 0) {
      this.bmwInfo = payload;
      this.updateDom(1000);
    }
  },

  faIconFactory: function (icon) {
    var faIcon = document.createElement("i");
    faIcon.classList.add("fas");
    faIcon.classList.add(icon);
    return (faIcon);
  },

  getDom: function () {

    var distanceSuffix = "mi";
    if (this.config.distance === "km") {
      distanceSuffix = "km";
    }

    var wrapper = document.createElement("div");

    if (this.config.email === "" || this.config.password === "") {
      wrapper.innerHTML = "Missing configuration.";
      return wrapper;
    }

    if (Object.keys(this.bmwInfo).length == 0) {
      wrapper.innerHTML = this.translate("LOADING");
      wrapper.className = "dimmed light small";
      return wrapper;
    }

    var info = this.bmwInfo;

    var carContainer = document.createElement("div");
    carContainer.classList.add("bmw-container");

    var locked = document.createElement("span");
    locked.classList.add("locked");
    if (info.doorLock === "SECURED" || info.doorLock === "LOCKED") {
      locked.appendChild(this.faIconFactory("fa-lock"));
    } else {
      locked.appendChild(this.faIconFactory("fa-lock-open"));
    }
    carContainer.appendChild(locked);

    var mileage = document.createElement("span");
    mileage.classList.add("mileage");
    mileage.appendChild(this.faIconFactory("fa-road"));
    mileage.appendChild(document.createTextNode(info.mileage + " " + distanceSuffix));
    carContainer.appendChild(mileage);

    wrapper.appendChild(carContainer);

    //
    carContainer = document.createElement("div");
    carContainer.classList.add("bmw-container");


    var plugged = document.createElement("span");
    plugged.classList.add("plugged");
    if (info.connectorStatus == "CONNECTED") {
      plugged.appendChild(this.faIconFactory("fa-bolt"));
    } else {
      plugged.appendChild(this.faIconFactory("fa-plugjk"));//added an icon that's not available so that it doesnt show on screen
    }
    carContainer.appendChild(plugged);

    wrapper.appendChild(carContainer);

    carContainer = document.createElement("div");
    carContainer.classList.add("bmw-container");
    var battery = document.createElement("span");
    battery.classList.add("battery");

    switch (true) {
      case (info.chargingLevelHv < 25):
        battery.appendChild(this.faIconFactory("fa-battery-empty"));
        break;
      case (info.chargingLevelHv < 50):
        battery.appendChild(this.faIconFactory("fa-battery-quarter"));
        break;
      case (info.chargingLevelHv < 75):
        battery.appendChild(this.faIconFactory("fa-battery-half"));
        break;
      case (info.chargingLevelHv < 100):
        battery.appendChild(this.faIconFactory("fa-battery-three-quarters"));
        break;
      default:
        battery.appendChild(this.faIconFactory("fa-battery-fullz"));//added an icon that's not available so that it doesnt show on screen
        break;
    }

    carContainer.appendChild(battery);
    wrapper.appendChild(carContainer);
    
    var fuelcolor = "";
    if(info.fuelLitres > 30){
        fuelcolor = "green";
    }else {
        if(info.fuelLitres <= 30 && info.fuelLitres > 10){
            fuelcolor = "orange";
        }else{
        fuelcolor = "red";
    }
}
    
    carContainer = document.createElement("div");
    carContainer.classList.add("bmw-container");
    var fuelLeft = document.createElement("span");
    fuelLeft.classList.add(fuelcolor);
    fuelLeft.appendChild(this.faIconFactory("fa-tachometer-alt")); 
    fuelLeft.appendChild(document.createTextNode(info.fuelLitres + "  litres" ));
    carContainer.appendChild(fuelLeft);

    var fuelRange = document.createElement("span");
    fuelRange.classList.add("fuelRange");
    fuelRange.appendChild(this.faIconFactory("fa-gas-pump"));
    fuelRange.appendChild(document.createTextNode(info.fuelRange + " " + distanceSuffix));
    carContainer.appendChild(fuelRange);
    wrapper.appendChild(carContainer);
 
    //display if windows or sunroof are open
    var windows = "windows : ";
                      
    if (info.windowDriverFront === "CLOSED" && info.windowPassengerFront === "CLOSED" && info.windowDriverRear === "CLOSED" && info.windowPassengerRear === "CLOSED"){
        windows = "closed";
        } 
    else{
        windows = "open";
    }
    
    var sunroof = "sunroof : ";
    if (info.sunroof === "CLOSED"){
        sunroof = "closed";
    }else{
        sunroof = "open";
    }  
        
    //
    carContainer = document.createElement("div");
    carContainer.classList.add("bmw-container");
    carContainer.classList.add("updated");
    var updated = document.createElement("span");
    updated.classList.add("updated");
    updated.appendChild(this.faIconFactory("fa-info"));
    var lastUpdateText = "last updated " + moment(info.updateTime).fromNow();
    if (this.config.debug) {
      lastUpdateText += " [" + info.unitOfLength + "]";
    }
    
    if(windows === "open" && sunroof === "open"){
        lastUpdateText = "sunroof and windows open";
    }
    if(windows === "open" && sunroof === "closed"){
            lastUpdateText = "windows open";
    }
    if(windows === "closed" && sunroof === "open"){
            lastUpdateText = "sunroof open";
    }
    
    updated.appendChild(document.createTextNode(lastUpdateText));
    carContainer.appendChild(updated);
    wrapper.appendChild(carContainer);

  

    //

    carContainer = document.createElement("div");
    carContainer.classList.add("bmw-container");
    var imageContainer = document.createElement("span");
    var imageObject = document.createElement("img");
    imageObject.setAttribute('src', info.imageUrl);
    imageContainer.appendChild(imageObject);
    carContainer.appendChild(imageContainer);

    wrapper.appendChild(carContainer);

    return wrapper;
  }

});
