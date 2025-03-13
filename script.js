document.addEventListener("DOMContentLoaded", function () {
  // Sign-Up Functionality
  let signupForm = document.getElementById("signup-form");
  if (signupForm) {
      signupForm.addEventListener("submit", function (event) {
          event.preventDefault();
          //Get form values
          const name = document.getElementById("name").value;
          const email = document.getElementById("email").value;
          const password = document.getElementById("password").value;
          const role = document.getElementById("role").value;
          
          if (name && email && password && role) {
              const user = { name, email, password, role };
          localStorage.setItem("user", JSON.stringify(user));
          alert("sign-up successful! Redirecting to login...");
          window.location.href = "login.html"; //Redirect to login 
      } else {
          alert("please fill in all fields.");
      }
   });
  }

// Login Functionality
let loginForm = document.getElementById("loginForm");
if (loginForm) {
    loginForm.addEventListener("submit", function (event) {
        event.preventDefault();
        let username = document.getElementById("username").value;
        let password = document.getElementById("password").value;

        if (username && password) {
            window.location.href = "dashboard.html"; // Redirect to dashboard
        } else {
            alert("Please enter valid credentials.");
        }
    });
}

// Logout Functionality
let logoutButton = document.getElementById("logoutButton");
if (logoutButton) {
    logoutButton.addEventListener("click", function () {
        window.location.href = "index.html"; // Redirect to login page
    });
}
//Menu Toggle
let menuButton = document.getElementById("menuButton");
let menu = document.getElementById("menu");
if (menuButton && menu) {
  menuButton.addEventListener("click", function () {
      menu.classList.toggle("active");
  });
}

// Map Initialization
let mapElement = document.getElementById("map");
if (mapElement) {
    var map = L.map('map').setView([-1.286389, 36.817223], 13); // Default view
    //Load map tiles 
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);
    let busMarkers = {};
    //Fetch bus location from the backend
    fetch("http://192.168.0.102:5000/api/buses")
       .then(response => response.json())
       .then(data => {
          data.forEach(bus => {
              L.marker([bus.latitude, bus.longitude]).addTo(map)
              .bindPopup(`<b>Bus ${bus.bus_number}</b><br>Driver: ${bus.driver_name}`)
              .openPopup();
          });
       })
       .catch(error => console.error("Error fetching bus locations:", error));
    //Check if browser support Geolocation
    if (navigator.geolocation) {
      navigator.geolocation.watchPosition(
         function (position) {
          var userLat = position.coords.latitude;
          var userLng = position.coords.longitude;
          // Set map view to user location
          map.setView([userLat, userLng], 15);
          if (userMarker) {
            userMarker.setLatLng([userLat, userlng]);
          } else {
            userMarker = 
          L.marker([userLat, userLng])
             .addTo(map)
             .bindPopup("You are here")
             .openPopup();

          }
         },
         function (error) {
          console.log("Geolocation failed: " + error.message);
         }
      );
    } else {
      console.log("Geolocation is not supported by this browser.");
    }
    // Example static bus markers (for initial testing)
    const buses = [
      { id: 1, latitude:  -1.27247,  longitude: 36.85047, bus_number: '101', driver_name: 'John Doe' },
      { id: 2, latitude: -1.28000, longitude: 36.84000, bus_number: '102', driver_name: 'Jane Smith' }
    ];
    //Add static bus markers
    buses.forEach(bus => {
      L.marker([bus.latitude, bus.longitude])
      .addTo(map)
      .bindPopup(`<b>Bus ${bus.bus_number}</b><br>Driver: ${bus.driver_name}`);
    });
    // WebSocket Connection for Live Bus Tracking 
    const socket = io("http://192.168.0.102:5000");
    socket.on("connect", () => {
      console.log("Connected:", socket.connected);
    });
    socket.on("busLocation", (data) => {
      console.log("Live Buses:", data);
      updateBusMarkers(data);
    });

    function 
    updateBusMarkers(busdata) {
      busdata.forEach(bus => {
          const { id, latitude, longitude, bus_number, driver_name } = bus;
          // If markers exist update position
          if (busMarkers[id]) {
              busMarkers[id].setLatLng([latitude, longitude]);
          } else {
              // Create a new marker for new buses
              busMarkers[id] = L.marker([latitude, longitude])
              .addTo(map)
              .bindPopup(`<b>Bus ${bus_number}</b><br>Driver: ${driver_name}`);
          }
      });
    }
}
});