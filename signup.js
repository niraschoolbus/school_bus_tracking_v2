const backendURL = "http://192.168.0.102:5000"; // Change to 5000 if needed

document.getElementById("signup-form").addEventListener("submit", async (event) => {
    event.preventDefault();

    const name = document.getElementById("name").value;
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;
    const role = document.getElementById("role").value; // Assume you have a role dropdown

    const response = await fetch(`${backendURL}/api/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, role })
    });

    const data = await response.json();
    if (response.ok) {
        alert(data.message);
        window.location.href = "index.html"; // Redirect to login page
    } else {
        alert(data.error);
    }
});